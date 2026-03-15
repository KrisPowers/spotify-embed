import { htmlShell } from "./shell.js";

export function pageNowPlaying(origin: string): string {
  const embedUrl = `${origin}/now-playing.svg`;
  const stateUrl = `${origin}/now-playing-state.json`;

  const body = `
    <div class="page-header">
      <h1 class="page-title">Now Playing</h1>
      <p class="page-subtitle">Shows your currently playing Spotify track with album art, progress bar, and live timer animation.</p>
    </div>

    <div class="section">
      <div class="section-label">Live Preview</div>
      <div class="preview-wrap" id="preview-wrap">
        <img id="preview-img" src="${embedUrl}?t=${Date.now()}" alt="Now Playing preview"/>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;">
        <button class="ctrl-btn" onclick="refreshPreview()">↻ Refresh</button>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Embed in your README</div>
      <div class="code-block">
        <pre class="code-pre">![Now Playing](${embedUrl})</pre>
        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
      </div>
    </div>

    <hr/>

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
            <div class="step-title">Add to your README</div>
            <p class="step-desc">Paste the embed snippet above into any <code>README.md</code>. The badge updates on every page load.</p>
          </div>
        </div>
      </div>
    </div>

    <p class="footer-note">The progress bar and elapsed timer animate in real time using SVG SMIL — no JavaScript needed in the badge itself.</p>

    <script>
      let lastNowPlayingKey = null;

      function refreshPreview() {
        const img = document.getElementById('preview-img');
        const nextUrl = '${embedUrl}?t=' + Date.now();
        const preload = new Image();
        preload.onload = () => { img.src = nextUrl; };
        preload.src = nextUrl;
      }

      async function pollNowPlayingState() {
        try {
          const res = await fetch('${stateUrl}?t=' + Date.now(), { cache: 'no-store' });
          if (!res.ok) return;
          const state = await res.json();
          const nextKey = state && state.isPlaying && state.trackKey ? 'playing:' + state.trackKey : 'idle';

          if (lastNowPlayingKey === null) {
            lastNowPlayingKey = nextKey;
            return;
          }

          if (nextKey !== lastNowPlayingKey) {
            lastNowPlayingKey = nextKey;
            refreshPreview();
          }
        } catch {}
      }

      pollNowPlayingState();
      setInterval(pollNowPlayingState, 10000);
    </script>
  `;

  return htmlShell("Now Playing", body, "now-playing");
}
