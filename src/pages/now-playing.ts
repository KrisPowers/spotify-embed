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
      <div class="section-label">Copy Embed</div>
      <div class="card">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="auth-btn" style="border:0;cursor:pointer;" onclick="copyEmbed('markdown', this)">Copy Markdown</button>
          <button class="auth-btn" style="background:#1a1a1a;color:#e0e0e0;border:1px solid #2a2a2a;cursor:pointer;" onclick="copyEmbed('html', this)">Copy HTML</button>
        </div>
      </div>
    </div>

    <p class="footer-note">The progress bar and elapsed timer animate in real time using SVG SMIL — no JavaScript needed in the badge itself.</p>

    <script>
      let lastNowPlayingKey = null;
      const markdownEmbed = '![Now Playing](${embedUrl})';
      const htmlEmbed = '<img src="${embedUrl}" alt="Now Playing on Spotify" loading="lazy" />';

      function refreshPreview() {
        const img = document.getElementById('preview-img');
        const nextUrl = '${embedUrl}?t=' + Date.now();
        const preload = new Image();
        preload.onload = () => { img.src = nextUrl; };
        preload.src = nextUrl;
      }

      async function copyEmbed(type, btn) {
        const content = type === 'html' ? htmlEmbed : markdownEmbed;
        const originalLabel = btn.textContent;
        try {
          await navigator.clipboard.writeText(content);
          btn.textContent = 'Copied';
          setTimeout(() => { btn.textContent = originalLabel; }, 1300);
        } catch {
          btn.textContent = 'Copy failed';
          setTimeout(() => { btn.textContent = originalLabel; }, 1600);
        }
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
