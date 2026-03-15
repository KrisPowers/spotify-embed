import { htmlShell } from "./shell.js";

export function pageGettingSetup(origin: string): string {
  const nowPlayingEmbedUrl = `${origin}/now-playing.svg`;

  const body = `
    <div class="page-header">
      <h1 class="page-title">Getting Setup</h1>
      <p class="page-subtitle">Configure your Cloudflare Worker with Spotify credentials, authorize access, and start embedding widgets in your README.</p>
    </div>

    <div class="section">
      <div class="section-label">Setup</div>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-body">
            <div class="step-title">Add Spotify app credentials</div>
            <p class="step-desc">In <strong>Cloudflare Workers → your worker → Settings → Variables &amp; Secrets</strong>, add:</p>
            <div class="env-table">
              <div class="env-row"><span class="env-var">SPOTIFY_CLIENT_ID</span><span class="env-desc">Your app's Client ID</span><span class="badge badge-plain">Plain text</span></div>
              <div class="env-row"><span class="env-var">SPOTIFY_CLIENT_SECRET</span><span class="env-desc">Your app's Client Secret</span><span class="badge badge-secret">Secret</span></div>
              <div class="env-row"><span class="env-var">SPOTIFY_REFRESH_TOKEN</span><span class="env-desc">From the authorize step below</span><span class="badge badge-secret">Secret</span></div>
            </div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-body">
            <div class="step-title">Authorize with Spotify</div>
            <p class="step-desc">Click below to authorize. You'll be shown your <strong>Refresh Token</strong> — copy it into <code>SPOTIFY_REFRESH_TOKEN</code> and redeploy.</p>
            <a href="/auth" class="auth-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Authorize with Spotify
            </a>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-body">
            <div class="step-title">Add a widget to your README</div>
            <p class="step-desc">Use any widget page in the sidebar to copy an embed snippet and paste it in <code>README.md</code>.</p>
            <div class="code-block">
              <pre class="code-pre">![Now Playing](${nowPlayingEmbedUrl})</pre>
              <button class="copy-btn" onclick="copyCode(this)">Copy</button>
            </div>
            <p class="step-note">You can also use Top Artists, Top Tracks, or Social Export snippets from their pages.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return htmlShell("Getting Setup", body, "getting-setup");
}
