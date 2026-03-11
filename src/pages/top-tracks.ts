import { htmlShell } from "./shell.js";

export function pageTopTracks(origin: string): string {
  const body = `
    <div class="page-header">
      <h1 class="page-title">Top Tracks</h1>
      <p class="page-subtitle">A grid of your most-played tracks with album art, rank, and artist name. Configure the time range and how many to show.</p>
    </div>

    <div class="section">
      <div class="section-label">Configure</div>
      <div class="card">
        <div class="controls">
          <div class="control-group">
            <div class="control-label">Time Range</div>
            <div class="control-row">
              <button class="ctrl-btn active" data-range="short_term" onclick="setRange(this)">Last 4 Weeks</button>
              <button class="ctrl-btn" data-range="mid_term" onclick="setRange(this)">Last 6 Months</button>
              <button class="ctrl-btn" data-range="long_term" onclick="setRange(this)">All Time</button>
            </div>
          </div>
          <div class="control-group">
            <div class="control-label">Count</div>
            <div class="control-row" id="count-row">
              ${[1,2,3,4,5,6,7,8,9,10].map(n =>
                `<button class="ctrl-btn${n === 8 ? ' active' : ''}" data-count="${n}" onclick="setCount(this)">${n}</button>`
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Live Preview</div>
      <div class="preview-wrap" id="preview-wrap">
        <img id="preview-img" src="${origin}/top-tracks.svg?range=short_term&count=8&t=${Date.now()}" alt="Top Tracks preview"/>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Instagram Export</div>
      <div class="card">
        <p class="page-subtitle" style="margin-bottom: 14px;">Generate an Instagram-formatted image from this dataset and download it directly as JPG.</p>
        <a href="/social-export" class="auth-btn">Open Social Export</a>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Embed in your README</div>
      <div class="code-block">
        <pre class="code-pre" id="embed-code">![Top Tracks](${origin}/top-tracks.svg?range=short_term&count=8)</pre>
        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
      </div>
    </div>

    <script>
      let currentRange = 'short_term';
      let currentCount = 8;

      function updatePreview() {
        const url = '${origin}/top-tracks.svg?range=' + currentRange + '&count=' + currentCount + '&t=' + Date.now();
        document.getElementById('preview-img').src = url;
        document.getElementById('embed-code').textContent =
          '![Top Tracks](${origin}/top-tracks.svg?range=' + currentRange + '&count=' + currentCount + ')';
      }

      function setRange(btn) {
        document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = btn.dataset.range;
        updatePreview();
      }

      function setCount(btn) {
        document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCount = btn.dataset.count;
        updatePreview();
      }
    </script>
  `;

  return htmlShell("Top Tracks", body, "top-tracks");
}
