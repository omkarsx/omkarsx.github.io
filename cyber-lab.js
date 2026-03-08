(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const yearEl = document.getElementById("currentYear");
  const apiStatus = document.getElementById("apiStatus");

  const vulnForm = document.getElementById("vulnForm");
  const targetUrlInput = document.getElementById("targetUrl");
  const headerInput = document.getElementById("headerInput");
  const vulnOutput = document.getElementById("vulnOutput");

  const passwordForm = document.getElementById("passwordForm");
  const passwordInput = document.getElementById("passwordInput");
  const strengthBar = document.getElementById("strengthBar");
  const passwordOutput = document.getElementById("passwordOutput");

  const aesPlain = document.getElementById("aesPlain");
  const aesPass = document.getElementById("aesPass");
  const aesOutput = document.getElementById("aesOutput");
  const aesEncryptBtn = document.getElementById("aesEncrypt");
  const aesDecryptBtn = document.getElementById("aesDecrypt");
  const aesStatus = document.getElementById("aesStatus");

  const rsaGenerateBtn = document.getElementById("rsaGenerate");
  const rsaMessage = document.getElementById("rsaMessage");
  const rsaEncryptBtn = document.getElementById("rsaEncrypt");
  const rsaDecryptBtn = document.getElementById("rsaDecrypt");
  const rsaCipher = document.getElementById("rsaCipher");
  const rsaPlainOut = document.getElementById("rsaPlainOut");
  const rsaStatus = document.getElementById("rsaStatus");

  const THEME_KEY = "omkarx-theme";
  const rawApiBase = typeof window.OMKARX_API_BASE === "string" ? window.OMKARX_API_BASE.trim() : "";
  const API_BASE = rawApiBase.replace(/\/+$/, "");
  const apiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const updateThemeButton = (theme) => {
    if (!themeToggle) {
      return;
    }

    const icon = themeToggle.querySelector("i");
    const text = themeToggle.querySelector("span");

    if (theme === "light") {
      themeToggle.setAttribute("aria-pressed", "true");
      if (icon) {
        icon.className = "fa-solid fa-sun";
      }
      if (text) {
        text.textContent = "Light";
      }
    } else {
      themeToggle.setAttribute("aria-pressed", "false");
      if (icon) {
        icon.className = "fa-solid fa-moon";
      }
      if (text) {
        text.textContent = "Dark";
      }
    }
  };

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    updateThemeButton(theme);
  };

  const getInitialTheme = () => {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }

    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    return prefersLight ? "light" : "dark";
  };

  applyTheme(getInitialTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      window.localStorage.setItem(THEME_KEY, next);
    });
  }

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const setApiStatus = (message, type) => {
    if (!apiStatus) {
      return;
    }

    apiStatus.textContent = message;
    apiStatus.classList.remove("online", "offline");
    if (type) {
      apiStatus.classList.add(type);
    }
  };

  const checkApiHealth = async () => {
    setApiStatus("Checking backend...", "");

    try {
      const response = await fetch(apiUrl("/api/health"), { method: "GET" });
      if (!response.ok) {
        throw new Error("Backend unhealthy");
      }
      setApiStatus("Backend online", "online");
    } catch (error) {
      const hint = API_BASE
        ? `Backend offline (${API_BASE})`
        : "Backend offline (run: start-server.bat)";
      setApiStatus(hint, "offline");
    }
  };

  checkApiHealth();

  const classForRisk = (label) => {
    if (label === "High") return "sev-high";
    if (label === "Medium") return "sev-medium";
    return "sev-low";
  };

  const renderAnalyzerResult = (result) => {
    if (!vulnOutput) {
      return;
    }

    const findings = Array.isArray(result.findings) ? result.findings : [];
    const findingHtml = findings.length
      ? `<ul>${findings
          .map(
            (finding) =>
              `<li><span class="severity sev-${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span> <strong>${escapeHtml(finding.title)}:</strong> ${escapeHtml(finding.detail)}</li>`
          )
          .join("")}</ul>`
      : '<p><span class="severity sev-low">low</span> No obvious issues found by current checks.</p>';

    const securityHeaders = result.securityHeaders || {};
    const kvHtml = Object.keys(securityHeaders)
      .map((header) => {
        const value = securityHeaders[header] || "Missing";
        return `<div class="kv-item"><b>${escapeHtml(header)}</b><span>${escapeHtml(value)}</span></div>`;
      })
      .join("");

    const allHeaders = result.headers || {};
    const headerRows = Object.keys(allHeaders)
      .sort()
      .map((key) => `<li><code>${escapeHtml(key)}</code>: ${escapeHtml(allHeaders[key])}</li>`)
      .join("");

    const tls = result.tls || null;
    const tlsText = tls
      ? tls.error
        ? `TLS info unavailable: ${escapeHtml(tls.error)}`
        : `${escapeHtml(tls.protocol || "unknown")} | ${escapeHtml(tls.cipher || "unknown cipher")}`
      : "Not HTTPS";

    vulnOutput.innerHTML = `
      <div class="analysis-meta">
        <div class="meta-item">
          <span class="label">Risk</span>
          <span class="value">${escapeHtml(result.risk.score)}/100 <span class="severity ${classForRisk(result.risk.label)}">${escapeHtml(result.risk.label)}</span></span>
        </div>
        <div class="meta-item">
          <span class="label">HTTP Status</span>
          <span class="value">${escapeHtml(result.status.code)} ${escapeHtml(result.status.text || "")}</span>
        </div>
        <div class="meta-item">
          <span class="label">TLS</span>
          <span class="value">${tlsText}</span>
        </div>
      </div>

      <p><strong>Target:</strong> <code>${escapeHtml(result.target)}</code></p>
      <p><strong>Final URL:</strong> <code>${escapeHtml(result.finalUrl)}</code></p>

      <p><strong>Findings:</strong></p>
      ${findingHtml}

      <div class="kv-grid">${kvHtml}</div>

      <details class="header-details">
        <summary>View all fetched headers (${Object.keys(allHeaders).length})</summary>
        <ul class="header-list">${headerRows || "<li>No headers available.</li>"}</ul>
      </details>
    `;
  };

  if (vulnForm && targetUrlInput && headerInput && vulnOutput) {
    vulnForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const targetUrl = targetUrlInput.value.trim();
      const headerText = headerInput.value;

      if (!targetUrl) {
        vulnOutput.innerHTML = '<p class="muted">Please enter target URL.</p>';
        return;
      }

      vulnOutput.innerHTML = '<p class="loader"><span></span><span></span><span></span> Running live backend analysis...</p>';

      try {
        const response = await fetch(apiUrl("/api/security/analyze-url"), {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ targetUrl, headerInput: headerText })
        });

        const payload = await response.json();

        if (!response.ok) {
          const errorMessage = payload && payload.error ? payload.error : "Analysis failed";
          throw new Error(errorMessage);
        }

        renderAnalyzerResult(payload);
      } catch (error) {
        const backendHint = API_BASE
          ? `Make sure your backend is reachable: <code>${escapeHtml(API_BASE)}</code>`
          : "Make sure backend is running: <code>start-server.bat</code>";
        vulnOutput.innerHTML = `
          <p><span class="severity sev-high">high</span> Live analysis failed.</p>
          <p class="muted">${escapeHtml(error.message || "Unknown error")}</p>
          <p class="muted">${backendHint}</p>
        `;
      }
    });
  }

  const commonPasswords = new Set([
    "password",
    "123456",
    "12345678",
    "qwerty",
    "admin",
    "letmein",
    "welcome",
    "iloveyou",
    "passw0rd"
  ]);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const crackTimeFromEntropy = (entropy) => {
    if (entropy < 28) return "Instantly";
    if (entropy < 36) return "Minutes";
    if (entropy < 50) return "Hours";
    if (entropy < 64) return "Days to weeks";
    if (entropy < 80) return "Years";
    return "Many decades";
  };

  const colorForScore = (score) => {
    if (score < 30) return "#ff7a7a";
    if (score < 60) return "#ffd479";
    if (score < 80) return "#9dd3ff";
    return "#93f8cf";
  };

  if (passwordForm && passwordInput && passwordOutput && strengthBar) {
    passwordForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const value = passwordInput.value;
      if (!value) {
        passwordOutput.innerHTML = '<p class="muted">Enter a password to analyze.</p>';
        strengthBar.style.width = "0";
        return;
      }

      const lower = /[a-z]/.test(value);
      const upper = /[A-Z]/.test(value);
      const digit = /\d/.test(value);
      const symbol = /[^A-Za-z0-9]/.test(value);
      const longEnough = value.length >= 12;
      const hasRepeats = /(.)\1{2,}/.test(value);
      const isCommon = commonPasswords.has(value.toLowerCase());

      let score = 0;
      score += Math.min(value.length * 3, 36);
      if (lower) score += 12;
      if (upper) score += 12;
      if (digit) score += 12;
      if (symbol) score += 12;
      if (value.length >= 16) score += 10;
      if (hasRepeats) score -= 12;
      if (isCommon) score = 8;
      score = clamp(score, 0, 100);

      const charsetSize = (lower ? 26 : 0) + (upper ? 26 : 0) + (digit ? 10 : 0) + (symbol ? 33 : 0);
      const entropy = charsetSize > 0 ? value.length * Math.log2(charsetSize) : 0;

      let level = "Weak";
      if (score >= 80) {
        level = "Strong";
      } else if (score >= 60) {
        level = "Good";
      } else if (score >= 30) {
        level = "Fair";
      }

      const tips = [];
      if (!longEnough) tips.push("Use at least 12 characters.");
      if (!upper || !lower) tips.push("Mix uppercase and lowercase letters.");
      if (!digit) tips.push("Add numbers.");
      if (!symbol) tips.push("Add symbols (for example: ! @ #).");
      if (hasRepeats) tips.push("Avoid repeating one character too many times.");
      if (isCommon) tips.push("This password is too common. Use a unique passphrase.");

      const tipHtml = tips.length
        ? `<ul>${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>`
        : "<p>No obvious weakness found by this local checker.</p>";

      strengthBar.style.width = `${score}%`;
      strengthBar.style.background = colorForScore(score);

      passwordOutput.innerHTML = `
        <p><strong>Strength:</strong> ${level} (${score}/100)</p>
        <p><strong>Estimated Entropy:</strong> ${entropy.toFixed(1)} bits</p>
        <p><strong>Estimated Crack Time:</strong> ${crackTimeFromEntropy(entropy)}</p>
        <p><strong>Suggestions:</strong></p>
        ${tipHtml}
      `;
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const bytesToBase64 = (bytes) => {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const base64ToBytes = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const deriveAesKey = async (passphrase, salt, usage) => {
    const baseKey = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 120000,
        hash: "SHA-256"
      },
      baseKey,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      usage
    );
  };

  const setInlineStatus = (element, message, type) => {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.remove("success", "error", "muted");
    if (type) {
      element.classList.add(type);
    } else {
      element.classList.add("muted");
    }
  };

  if (aesEncryptBtn && aesDecryptBtn && aesPlain && aesPass && aesOutput) {
    aesEncryptBtn.addEventListener("click", async () => {
      const plainText = aesPlain.value;
      const passphrase = aesPass.value;

      if (!plainText || !passphrase) {
        setInlineStatus(aesStatus, "Enter both plain text and passphrase.", "error");
        return;
      }

      try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveAesKey(passphrase, salt, ["encrypt"]);
        const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plainText));

        const packet = {
          algo: "AES-GCM",
          salt: bytesToBase64(salt),
          iv: bytesToBase64(iv),
          cipher: bytesToBase64(new Uint8Array(cipherBuffer))
        };

        aesOutput.value = JSON.stringify(packet, null, 2);
        setInlineStatus(aesStatus, "Encrypted successfully.", "success");
      } catch (error) {
        setInlineStatus(aesStatus, "Encryption failed. Check input values.", "error");
      }
    });

    aesDecryptBtn.addEventListener("click", async () => {
      const passphrase = aesPass.value;
      if (!aesOutput.value || !passphrase) {
        setInlineStatus(aesStatus, "Need AES packet and passphrase for decryption.", "error");
        return;
      }

      try {
        const packet = JSON.parse(aesOutput.value);
        const salt = base64ToBytes(packet.salt);
        const iv = base64ToBytes(packet.iv);
        const cipherBytes = base64ToBytes(packet.cipher);

        const key = await deriveAesKey(passphrase, salt, ["decrypt"]);
        const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
        const plainText = decoder.decode(plainBuffer);

        aesPlain.value = plainText;
        setInlineStatus(aesStatus, "Decrypted successfully.", "success");
      } catch (error) {
        setInlineStatus(aesStatus, "Decryption failed. Wrong passphrase or invalid packet.", "error");
      }
    });
  }

  let rsaKeyPair = null;

  if (rsaGenerateBtn && rsaEncryptBtn && rsaDecryptBtn && rsaStatus && rsaCipher && rsaPlainOut && rsaMessage) {
    rsaGenerateBtn.addEventListener("click", async () => {
      setInlineStatus(rsaStatus, "Generating RSA key pair...", "");
      try {
        rsaKeyPair = await crypto.subtle.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
          },
          true,
          ["encrypt", "decrypt"]
        );

        setInlineStatus(rsaStatus, "RSA key pair ready.", "success");
      } catch (error) {
        setInlineStatus(rsaStatus, "Failed to generate RSA keys.", "error");
      }
    });

    rsaEncryptBtn.addEventListener("click", async () => {
      if (!rsaKeyPair) {
        setInlineStatus(rsaStatus, "Generate key pair first.", "error");
        return;
      }

      if (!rsaMessage.value) {
        setInlineStatus(rsaStatus, "Enter a message for encryption.", "error");
        return;
      }

      try {
        const cipherBuffer = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaKeyPair.publicKey, encoder.encode(rsaMessage.value));
        rsaCipher.value = bytesToBase64(new Uint8Array(cipherBuffer));
        setInlineStatus(rsaStatus, "Message encrypted.", "success");
      } catch (error) {
        setInlineStatus(rsaStatus, "RSA encryption failed.", "error");
      }
    });

    rsaDecryptBtn.addEventListener("click", async () => {
      if (!rsaKeyPair) {
        setInlineStatus(rsaStatus, "Generate key pair first.", "error");
        return;
      }

      if (!rsaCipher.value.trim()) {
        setInlineStatus(rsaStatus, "Cipher text is empty.", "error");
        return;
      }

      try {
        const cipherBytes = base64ToBytes(rsaCipher.value.trim());
        const plainBuffer = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, rsaKeyPair.privateKey, cipherBytes);
        rsaPlainOut.value = decoder.decode(plainBuffer);
        setInlineStatus(rsaStatus, "Message decrypted.", "success");
      } catch (error) {
        setInlineStatus(rsaStatus, "RSA decryption failed. Check cipher text and key state.", "error");
      }
    });
  }
})();

