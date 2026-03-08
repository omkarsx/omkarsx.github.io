# Cyber Lab Run + Deploy Guide

## Local Run (Real Backend)
1. Double-click `start-server.bat`
2. Open `http://127.0.0.1:3000/cyber-lab.html`

This runs the real backend (`server.ps1`) and serves your site + API locally.

## Important: GitHub Pages Limitation
GitHub Pages only hosts static files (HTML/CSS/JS).  
It cannot run `server.ps1` or any backend process.

## Production Setup (omkarx.tech)
1. Host frontend on GitHub Pages (your normal portfolio publish flow).
2. Host backend separately (VPS/Windows server/other backend host).
3. In `cyber-lab.html`, set:

```html
<script>
  window.OMKARX_API_BASE = "https://your-backend-domain";
</script>
```

4. Ensure backend exposes:
   - `GET /api/health`
   - `POST /api/security/analyze-url`

## CORS
`server.ps1` now includes CORS + `OPTIONS` preflight support, so cross-origin calls from your frontend domain can work.
