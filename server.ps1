param(
    [string]$ServerHost = "127.0.0.1",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$SecurityHeaders = @(
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy"
)
$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
}
$CorsAllowOrigin = "*"
$CorsAllowMethods = "GET, POST, OPTIONS"
$CorsAllowHeaders = "content-type"

function Add-CorsHeaders {
    param($Response)
    $Response.Headers["Access-Control-Allow-Origin"] = $CorsAllowOrigin
    $Response.Headers["Access-Control-Allow-Methods"] = $CorsAllowMethods
    $Response.Headers["Access-Control-Allow-Headers"] = $CorsAllowHeaders
}

function Send-Bytes {
    param($Context, [int]$StatusCode, [string]$ContentType, [byte[]]$Bytes, [string]$CacheControl = $null)
    $response = $Context.Response
    Add-CorsHeaders -Response $response
    $response.StatusCode = $StatusCode
    $response.ContentType = $ContentType
    if ($CacheControl) {
        $response.Headers["Cache-Control"] = $CacheControl
    }
    $response.ContentLength64 = $Bytes.Length
    $response.OutputStream.Write($Bytes, 0, $Bytes.Length)
    $response.Close()
}

function Send-Json {
    param($Context, [int]$StatusCode, $Payload)
    $json = $Payload | ConvertTo-Json -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    Send-Bytes -Context $Context -StatusCode $StatusCode -ContentType "application/json; charset=utf-8" -Bytes $bytes -CacheControl "no-store"
}

function Send-Text {
    param($Context, [int]$StatusCode, [string]$Body)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    Send-Bytes -Context $Context -StatusCode $StatusCode -ContentType "text/plain; charset=utf-8" -Bytes $bytes
}

function Read-Body {
    param($Request)
    $reader = New-Object System.IO.StreamReader($Request.InputStream, $Request.ContentEncoding)
    try {
        return $reader.ReadToEnd()
    } finally {
        $reader.Dispose()
    }
}

function Test-PrivateIp {
    param([string]$Address)
    $ip = $null
    if (-not [System.Net.IPAddress]::TryParse($Address, [ref]$ip)) {
        throw "Invalid resolved address"
    }

    if ($ip.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork) {
        $bytes = $ip.GetAddressBytes()
        $a = [int]$bytes[0]
        $b = [int]$bytes[1]
        if ($a -eq 10 -or $a -eq 127 -or $a -eq 0) { return $true }
        if ($a -eq 169 -and $b -eq 254) { return $true }
        if ($a -eq 172 -and $b -ge 16 -and $b -le 31) { return $true }
        if ($a -eq 192 -and $b -eq 168) { return $true }
        if ($a -eq 100 -and $b -ge 64 -and $b -le 127) { return $true }
        if ($a -eq 192 -and $b -eq 0) { return $true }
        if ($a -eq 198 -and ($b -eq 18 -or $b -eq 19)) { return $true }
        if ($a -ge 224) { return $true }
        return $false
    }

    if ($ip.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetworkV6) {
        if ([System.Net.IPAddress]::IsLoopback($ip)) { return $true }
        if ($ip.Equals([System.Net.IPAddress]::IPv6None)) { return $true }
        if ($ip.IsIPv4MappedToIPv6) { return Test-PrivateIp -Address $ip.MapToIPv4().ToString() }
        $bytes = $ip.GetAddressBytes()
        if (($bytes[0] -band 0xFE) -eq 0xFC) { return $true }
        if ($bytes[0] -eq 0xFE -and (($bytes[1] -band 0xC0) -eq 0x80)) { return $true }
        return $false
    }

    return $true
}

function Assert-PublicHost {
    param([string]$Hostname)
    $value = $Hostname.Trim().ToLowerInvariant()
    if (-not $value) { throw "Hostname is required" }
    if ($value -eq "localhost" -or $value.EndsWith(".localhost") -or $value.EndsWith(".local")) {
        throw "Local host targets are blocked"
    }

    $literal = $null
    if ([System.Net.IPAddress]::TryParse($value, [ref]$literal)) {
        if (Test-PrivateIp -Address $literal.ToString()) { throw "Private or reserved targets are blocked" }
        return
    }

    try {
        $addresses = [System.Net.Dns]::GetHostAddresses($value)
    } catch {
        throw "DNS lookup failed for target hostname"
    }

    if (-not $addresses -or $addresses.Count -eq 0) {
        throw "No DNS records found for target hostname"
    }

    foreach ($address in $addresses) {
        if (Test-PrivateIp -Address $address.ToString()) {
            throw "Private or reserved targets are blocked"
        }
    }
}
function Parse-HeaderText {
    param([string]$Text)
    $headers = @{}
    if (-not $Text) { return $headers }

    foreach ($line in ($Text -split "`r?`n")) {
        $trimmed = $line.Trim()
        if (-not $trimmed) { continue }
        $index = $trimmed.IndexOf(":")
        if ($index -le 0) { continue }
        $key = $trimmed.Substring(0, $index).Trim().ToLowerInvariant()
        $value = $trimmed.Substring($index + 1).Trim()
        $headers[$key] = $value
    }

    return $headers
}

function Get-HeadersMap {
    param($HeaderCollection)
    $headers = @{}
    foreach ($key in $HeaderCollection.AllKeys) {
        $headers[$key.ToLowerInvariant()] = $HeaderCollection.Get($key)
    }
    return $headers
}

function Get-Risk {
    param([System.Collections.ArrayList]$Findings)
    $score = 0
    foreach ($finding in $Findings) {
        switch ($finding.severity) {
            "high" { $score += 30 }
            "medium" { $score += 15 }
            "low" { $score += 7 }
        }
    }
    $score = [Math]::Min($score, 100)
    if ($score -ge 70) { return @{ score = $score; label = "High" } }
    if ($score -ge 40) { return @{ score = $score; label = "Medium" } }
    return @{ score = $score; label = "Low" }
}

function Get-TlsInfo {
    param([uri]$TargetUrl)
    if ($TargetUrl.Scheme -ne "https") { return $null }

    $tcpClient = $null
    $sslStream = $null
    try {
        $port = if ($TargetUrl.Port -gt 0) { $TargetUrl.Port } else { 443 }
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.ReceiveTimeout = 7000
        $tcpClient.SendTimeout = 7000
        $tcpClient.Connect($TargetUrl.Host, $port)

        $callback = { param($sender, $certificate, $chain, $sslPolicyErrors) return $true }
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream(), $false, $callback)
        $sslStream.ReadTimeout = 7000
        $sslStream.WriteTimeout = 7000
        $sslStream.AuthenticateAsClient($TargetUrl.Host)

        $certificate = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 $sslStream.RemoteCertificate
        return @{ 
            authorized = $null
            authorizationError = $null
            protocol = [string]$sslStream.SslProtocol
            cipher = "$($sslStream.CipherAlgorithm) $($sslStream.CipherStrength)"
            validFrom = $certificate.NotBefore.ToString("o")
            validTo = $certificate.NotAfter.ToString("o")
            subject = $certificate.Subject
            issuer = $certificate.Issuer
        }
    } catch {
        return @{ error = $_.Exception.Message }
    } finally {
        if ($sslStream) { $sslStream.Dispose() }
        if ($tcpClient) { $tcpClient.Close() }
    }
}

function Get-TargetResponse {
    param([uri]$Uri)
    $request = [System.Net.HttpWebRequest]::Create($Uri)
    $request.Method = "GET"
    $request.AllowAutoRedirect = $true
    $request.MaximumAutomaticRedirections = 5
    $request.UserAgent = "OmkarX-Security-Lab/1.0"
    $request.Timeout = 10000
    $request.ReadWriteTimeout = 10000

    try {
        return [System.Net.HttpWebResponse]$request.GetResponse()
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            return [System.Net.HttpWebResponse]$_.Exception.Response
        }
        throw "Could not reach target: $($_.Exception.Message)"
    }
}

function Get-Findings {
    param([uri]$InputUrl, [uri]$FinalUrl, [int]$StatusCode, [hashtable]$Headers)
    $findings = New-Object System.Collections.ArrayList

    if ($InputUrl.Scheme -ne "https") {
        [void]$findings.Add(@{ severity = "high"; title = "Insecure transport"; detail = "Input URL is not using HTTPS." })
    }
    if ($FinalUrl.Scheme -ne "https") {
        [void]$findings.Add(@{ severity = "high"; title = "Final response is not HTTPS"; detail = "The final URL after redirects is not HTTPS." })
    }
    if ($InputUrl.Host -ne $FinalUrl.Host) {
        [void]$findings.Add(@{ severity = "low"; title = "Redirected host"; detail = "Final host changed to '$($FinalUrl.Host)'." })
    }
    if ($StatusCode -ge 400) {
        [void]$findings.Add(@{ severity = "medium"; title = "Error response status"; detail = "Server returned HTTP $StatusCode." })
    }

    foreach ($paramName in @("token", "password", "pass", "apikey", "api_key", "secret")) {
        if ($InputUrl.Query -match "(^|[?&])$([Regex]::Escape($paramName))=") {
            [void]$findings.Add(@{ severity = "high"; title = "Sensitive query parameter"; detail = "Found '$paramName' in URL query." })
        }
    }

    foreach ($redirectKey in @("redirect", "next", "url")) {
        if ($InputUrl.Query -match "(^|[?&])$([Regex]::Escape($redirectKey))=https?%3A" -or $InputUrl.Query -match "(^|[?&])$([Regex]::Escape($redirectKey))=https?:") {
            [void]$findings.Add(@{ severity = "medium"; title = "Open redirect pattern"; detail = "External redirect parameter detected in URL." })
            break
        }
    }

    foreach ($header in $SecurityHeaders) {
        if (-not $Headers.ContainsKey($header) -or -not $Headers[$header]) {
            [void]$findings.Add(@{ severity = "medium"; title = "Missing security header"; detail = "$header is missing." })
        }
    }

    if ($Headers.ContainsKey("content-security-policy") -and $Headers["content-security-policy"] -match "unsafe-inline") {
        [void]$findings.Add(@{ severity = "medium"; title = "Weak CSP pattern"; detail = "CSP contains unsafe-inline." })
    }
    if ($Headers.ContainsKey("server") -and $Headers["server"] -match "\d") {
        [void]$findings.Add(@{ severity = "low"; title = "Server version disclosure"; detail = "Server header appears to expose version details." })
    }

    return $findings
}
function Invoke-TargetAnalysis {
    param($Payload)
    $targetUrl = if ($Payload.targetUrl) { [string]$Payload.targetUrl } else { "" }
    $headerInput = if ($Payload.headerInput) { [string]$Payload.headerInput } else { "" }

    if (-not $targetUrl.Trim()) { throw "targetUrl is required" }

    try {
        $inputUri = [uri]$targetUrl.Trim()
    } catch {
        throw "Invalid URL format"
    }

    if ($inputUri.Scheme -ne "http" -and $inputUri.Scheme -ne "https") {
        throw "Only http and https URLs are allowed"
    }
    if ($inputUri.UserInfo) {
        throw "Credentials in URL are not allowed"
    }

    Assert-PublicHost -Hostname $inputUri.Host

    $response = $null
    try {
        $response = Get-TargetResponse -Uri $inputUri
        $finalUri = $response.ResponseUri
        Assert-PublicHost -Hostname $finalUri.Host

        $headers = Get-HeadersMap -HeaderCollection $response.Headers
        $manualHeaders = Parse-HeaderText -Text $headerInput
        foreach ($key in $manualHeaders.Keys) {
            $headers[$key] = $manualHeaders[$key]
        }

        $findings = Get-Findings -InputUrl $inputUri -FinalUrl $finalUri -StatusCode ([int]$response.StatusCode) -Headers $headers
        $risk = Get-Risk -Findings $findings
        $tls = Get-TlsInfo -TargetUrl $finalUri

        $visibleHeaders = [ordered]@{}
        foreach ($header in $SecurityHeaders) {
            $visibleHeaders[$header] = if ($headers.ContainsKey($header)) { $headers[$header] } else { $null }
        }

        return [ordered]@{
            target = $inputUri.AbsoluteUri
            finalUrl = $finalUri.AbsoluteUri
            fetchedAt = (Get-Date).ToString("o")
            status = @{ code = [int]$response.StatusCode; text = [string]$response.StatusDescription }
            risk = $risk
            findings = $findings
            securityHeaders = $visibleHeaders
            headers = $headers
            tls = $tls
        }
    } finally {
        if ($response) { $response.Close() }
    }
}

function Send-StaticFile {
    param($Context, [string]$Pathname)
    $relativePath = if ($Pathname -eq "/") { "index.html" } else { [Uri]::UnescapeDataString($Pathname.TrimStart("/")).Replace("/", "\") }
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relativePath))

    if (-not $fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Text -Context $Context -StatusCode 403 -Body "Forbidden"
        return
    }
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
        Send-Text -Context $Context -StatusCode 404 -Body "Not Found"
        return
    }

    $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
    $contentType = if ($MimeTypes.ContainsKey($extension)) { $MimeTypes[$extension] } else { "application/octet-stream" }
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $cacheControl = if ($extension -eq ".html") { "no-cache" } else { "public, max-age=3600" }
    Send-Bytes -Context $Context -StatusCode 200 -ContentType $contentType -Bytes $bytes -CacheControl $cacheControl
}

$prefix = "http://$ServerHost`:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "OmkarX PowerShell server running at $prefix"
Write-Host "Open $prefix`cyber-lab.html"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $path = $request.Url.AbsolutePath

        try {
            if ($request.HttpMethod -eq "OPTIONS" -and $path.StartsWith("/api/")) {
                Send-Bytes -Context $context -StatusCode 204 -ContentType "text/plain; charset=utf-8" -Bytes ([byte[]]@()) -CacheControl "no-store"
                continue
            }

            if ($request.HttpMethod -eq "GET" -and $path -eq "/api/health") {
                Send-Json -Context $context -StatusCode 200 -Payload @{ ok = $true; timestamp = (Get-Date).ToString("o") }
                continue
            }

            if ($request.HttpMethod -eq "POST" -and $path -eq "/api/security/analyze-url") {
                $body = Read-Body -Request $request
                try {
                    $payload = if ($body) { $body | ConvertFrom-Json } else { @{} }
                } catch {
                    Send-Json -Context $context -StatusCode 400 -Payload @{ error = "Invalid JSON payload" }
                    continue
                }

                try {
                    $result = Invoke-TargetAnalysis -Payload $payload
                    Send-Json -Context $context -StatusCode 200 -Payload $result
                } catch {
                    Send-Json -Context $context -StatusCode 400 -Payload @{ error = $_.Exception.Message }
                }
                continue
            }

            if ($request.HttpMethod -eq "GET") {
                Send-StaticFile -Context $context -Pathname $path
                continue
            }

            Send-Json -Context $context -StatusCode 405 -Payload @{ error = "Method not allowed" }
        } catch {
            if ($context.Response -and $context.Response.OutputStream.CanWrite) {
                Send-Json -Context $context -StatusCode 500 -Payload @{ error = "Internal server error" }
            }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}

