const http = require("http");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const dns = require("dns").promises;
const net = require("net");
const tls = require("tls");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();
const MAX_BODY_SIZE = 1024 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp"
};

const SECURITY_HEADERS = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy"
];

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8"
  });
  res.end(body);
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function normalizeHostname(hostname) {
  return hostname.trim().toLowerCase();
}

function isPrivateIPv4(ip) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(ip) {
  const value = ip.toLowerCase();
  if (value === "::1") return true;
  if (value === "::") return true;
  if (value.startsWith("fe80:")) return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (value.startsWith("::ffff:")) {
    const mapped = value.replace("::ffff:", "");
    return isPrivateIPv4(mapped);
  }
  return false;
}

function assertPublicAddress(address) {
  const ipVersion = net.isIP(address);
  if (!ipVersion) {
    throw new Error("Invalid resolved address");
  }

  if (ipVersion === 4 && isPrivateIPv4(address)) {
    throw new Error("Private or reserved IPv4 targets are blocked");
  }

  if (ipVersion === 6 && isPrivateIPv6(address)) {
    throw new Error("Private or reserved IPv6 targets are blocked");
  }
}

async function assertPublicHostname(hostname) {
  const value = normalizeHostname(hostname);
  if (!value) {
    throw new Error("Hostname is required");
  }

  if (value === "localhost" || value.endsWith(".localhost") || value.endsWith(".local")) {
    throw new Error("Local host targets are blocked");
  }

  const literalVersion = net.isIP(value);
  if (literalVersion) {
    assertPublicAddress(value);
    return;
  }

  let records;
  try {
    records = await dns.lookup(value, { all: true });
  } catch (error) {
    throw new Error("DNS lookup failed for target hostname");
  }

  if (!records.length) {
    throw new Error("No DNS records found for target hostname");
  }

  records.forEach((record) => assertPublicAddress(record.address));
}

function parseHeaderText(text) {
  const map = new Map();
  if (!text || typeof text !== "string") {
    return map;
  }

  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const index = line.indexOf(":");
      if (index <= 0) {
        return;
      }

      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();
      map.set(key, value);
    });

  return map;
}

function addFinding(findings, severity, title, detail) {
  findings.push({ severity, title, detail });
}

function computeRisk(findings) {
  const weights = { high: 30, medium: 15, low: 7 };
  let score = 0;
  findings.forEach((finding) => {
    score += weights[finding.severity] || 0;
  });
  score = Math.min(score, 100);

  if (score >= 70) {
    return { score, label: "High" };
  }
  if (score >= 40) {
    return { score, label: "Medium" };
  }
  return { score, label: "Low" };
}

async function getTlsDetails(targetUrl) {
  if (targetUrl.protocol !== "https:") {
    return null;
  }

  const port = targetUrl.port ? Number(targetUrl.port) : 443;
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: targetUrl.hostname,
        port,
        servername: targetUrl.hostname,
        rejectUnauthorized: false,
        timeout: 7000
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();

        const tlsInfo = {
          authorized: socket.authorized,
          authorizationError: socket.authorizationError || null,
          protocol: protocol || null,
          cipher: cipher ? cipher.name : null,
          validFrom: cert && cert.valid_from ? cert.valid_from : null,
          validTo: cert && cert.valid_to ? cert.valid_to : null,
          subject: cert && cert.subject ? cert.subject : null,
          issuer: cert && cert.issuer ? cert.issuer : null
        };

        socket.end();
        resolve(tlsInfo);
      }
    );

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ error: "TLS connection timeout" });
    });

    socket.on("error", (error) => {
      resolve({ error: error.message });
    });
  });
}

function analyzeHeadersAndUrl(inputUrl, finalUrl, statusCode, mergedHeaders) {
  const findings = [];

  if (inputUrl.protocol !== "https:") {
    addFinding(findings, "high", "Insecure transport", "Input URL is not using HTTPS.");
  }

  if (finalUrl.protocol !== "https:") {
    addFinding(findings, "high", "Final response is not HTTPS", "The final URL after redirects is not HTTPS.");
  }

  if (inputUrl.hostname !== finalUrl.hostname) {
    addFinding(findings, "low", "Redirected host", `Final host changed to '${finalUrl.hostname}'.`);
  }

  if (statusCode >= 400) {
    addFinding(findings, "medium", "Error response status", `Server returned HTTP ${statusCode}.`);
  }

  if (inputUrl.username || inputUrl.password) {
    addFinding(findings, "high", "Credentials in URL", "Credentials in URL can leak through logs/history.");
  }

  const riskyParams = ["token", "password", "pass", "apikey", "api_key", "secret"];
  riskyParams.forEach((param) => {
    if (inputUrl.searchParams.has(param)) {
      addFinding(findings, "high", "Sensitive query parameter", `Found '${param}' in URL query.`);
    }
  });

  const redirectParam = inputUrl.searchParams.get("redirect") || inputUrl.searchParams.get("next") || inputUrl.searchParams.get("url");
  if (redirectParam && /^https?:\/\//i.test(redirectParam)) {
    addFinding(findings, "medium", "Open redirect pattern", "External redirect parameter detected in URL.");
  }

  SECURITY_HEADERS.forEach((header) => {
    if (!mergedHeaders[header]) {
      addFinding(findings, "medium", "Missing security header", `${header} is missing.`);
    }
  });

  const csp = mergedHeaders["content-security-policy"];
  if (csp && /unsafe-inline/i.test(csp)) {
    addFinding(findings, "medium", "Weak CSP pattern", "CSP contains unsafe-inline.");
  }

  const server = mergedHeaders.server || "";
  if (/\d/.test(server)) {
    addFinding(findings, "low", "Server version disclosure", "Server header appears to expose version details.");
  }

  return findings;
}

async function analyzeTarget(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request payload");
  }

  const target = typeof payload.targetUrl === "string" ? payload.targetUrl.trim() : "";
  const headerInput = typeof payload.headerInput === "string" ? payload.headerInput : "";

  if (!target) {
    throw new Error("targetUrl is required");
  }

  let inputUrl;
  try {
    inputUrl = new URL(target);
  } catch (error) {
    throw new Error("Invalid URL format");
  }

  if (!["http:", "https:"].includes(inputUrl.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  if (inputUrl.username || inputUrl.password) {
    throw new Error("Credentials in URL are not allowed");
  }

  await assertPublicHostname(inputUrl.hostname);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(inputUrl.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "OmkarX-Security-Lab/1.0",
        accept: "text/html,application/json,*/*;q=0.9"
      }
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw new Error(`Could not reach target: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  const finalUrl = new URL(response.url || inputUrl.toString());
  await assertPublicHostname(finalUrl.hostname);

  const fetchedHeaders = {};
  response.headers.forEach((value, key) => {
    fetchedHeaders[key.toLowerCase()] = value;
  });

  const userHeadersMap = parseHeaderText(headerInput);
  const mergedHeaders = { ...fetchedHeaders };
  userHeadersMap.forEach((value, key) => {
    mergedHeaders[key] = value;
  });

  const findings = analyzeHeadersAndUrl(inputUrl, finalUrl, response.status, mergedHeaders);
  const risk = computeRisk(findings);
  const tls = await getTlsDetails(finalUrl);

  const visibleSecurityHeaders = {};
  SECURITY_HEADERS.forEach((header) => {
    visibleSecurityHeaders[header] = mergedHeaders[header] || null;
  });

  return {
    target: inputUrl.toString(),
    finalUrl: finalUrl.toString(),
    fetchedAt: new Date().toISOString(),
    status: {
      code: response.status,
      text: response.statusText
    },
    risk,
    findings,
    securityHeaders: visibleSecurityHeaders,
    headers: mergedHeaders,
    tls
  };
}

async function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const normalized = path.normalize(safePath).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(ROOT, normalized);

  if (!filePath.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch (error) {
    sendText(res, 404, "Not Found");
    return;
  }

  if (stat.isDirectory()) {
    sendText(res, 403, "Forbidden");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  res.writeHead(200, {
    "content-type": contentType,
    "cache-control": ext === ".html" ? "no-cache" : "public, max-age=3600"
  });

  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === "GET" && parsedUrl.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, timestamp: new Date().toISOString() });
      return;
    }

    if (req.method === "POST" && parsedUrl.pathname === "/api/security/analyze-url") {
      let body;
      try {
        body = await getBody(req);
      } catch (error) {
        sendJson(res, 413, { error: "Payload too large" });
        return;
      }

      let payload;
      try {
        payload = JSON.parse(body || "{}");
      } catch (error) {
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }

      try {
        const result = await analyzeTarget(payload);
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 400, { error: error.message });
      }
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res, parsedUrl.pathname);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`OmkarX server running at http://${HOST}:${PORT}`);
});
