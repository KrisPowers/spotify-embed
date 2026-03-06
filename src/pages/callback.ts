import { htmlShell } from "./shell.js";

export function pageCallback(refreshToken: string): string {
  const body = `
    <div class="page-header">
      <h1 class="page-title">Authorization successful</h1>
      <p class="page-subtitle">Copy your refresh token below and add it to your Worker secrets, then redeploy.</p>
    </div>

    <div class="section">
      <div class="section-label">Your Refresh Token</div>
      <div class="code-block">
        <pre class="code-pre" id="token-text">${refreshToken}</pre>
        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
      </div>
      <p class="footer-note" style="margin-top:10px;">This token does not expire unless you revoke access in your Spotify account settings.</p>
    </div>

    <hr/>

    <div class="section">
      <div class="section-label">Next Steps</div>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-body">
            <div class="step-title">Add the token to your Worker</div>
            <p class="step-desc">Run this in your terminal from your project directory:</p>
            <div class="code-block">
              <pre class="code-pre">npx wrangler secret put SPOTIFY_REFRESH_TOKEN</pre>
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <p class="step-note">Paste the token above when prompted. Alternatively, add it via the Cloudflare dashboard under Workers → your worker → Settings → Variables &amp; Secrets.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-body">
            <div class="step-title">Redeploy</div>
            <div class="code-block">
              <pre class="code-pre">npx wrangler deploy</pre>
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-body">
            <div class="step-title">Start embedding</div>
            <p class="step-desc">Your widgets are now live. Head to any widget page to grab your embed snippet.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <a href="/now-playing" class="auth-btn" style="font-size:13px;padding:9px 18px;">Now Playing</a>
              <a href="/top-artists" class="auth-btn" style="font-size:13px;padding:9px 18px;background:#1a1a1a;color:#e0e0e0;border:1px solid #2a2a2a;">Top Artists</a>
              <a href="/top-tracks" class="auth-btn" style="font-size:13px;padding:9px 18px;background:#1a1a1a;color:#e0e0e0;border:1px solid #2a2a2a;">Top Tracks</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return htmlShell("Authorized", body, "");
}
