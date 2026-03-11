import { htmlShell } from "./shell.js";

export function pageSocialExport(origin: string): string {
  const body = `
    <div class="page-header">
      <h1 class="page-title">Instagram Export</h1>
      <p class="page-subtitle">Generate a styled Spotify summary image and download it as JPG for Instagram Story or Post formats.</p>
    </div>

    <div class="section">
      <div class="section-label">Configure</div>
      <div class="card">
        <div class="controls" style="margin-bottom: 12px;">
          <div class="control-group">
            <div class="control-label">Dataset</div>
            <div class="control-row">
              <button class="ctrl-btn active" data-dataset="top-artists" onclick="setDataset(this)">Top Artists</button>
              <button class="ctrl-btn" data-dataset="top-tracks" onclick="setDataset(this)">Top Tracks</button>
            </div>
          </div>

          <div class="control-group">
            <div class="control-label">Time Range</div>
            <div class="control-row">
              <button class="ctrl-btn active" data-range="short_term" onclick="setRange(this)">Last 4 Weeks</button>
              <button class="ctrl-btn" data-range="mid_term" onclick="setRange(this)">Last 6 Months</button>
              <button class="ctrl-btn" data-range="long_term" onclick="setRange(this)">All Time</button>
            </div>
          </div>

          <div class="control-group">
            <div class="control-label">Items</div>
            <div class="control-row">
              ${[1, 2, 3, 4, 5, 6, 7].map(n =>
                `<button class="ctrl-btn${n === 6 ? " active" : ""}" data-count="${n}" onclick="setCount(this)">${n}</button>`
              ).join("")}
            </div>
          </div>
        </div>

        <div class="controls" style="align-items: end; justify-content: space-between; gap: 14px;">
          <div class="control-group">
            <div class="control-label">Instagram Size</div>
            <div class="control-row">
              <button class="ctrl-btn active" data-format="story" onclick="setFormat(this)">Story (9:16)</button>
              <button class="ctrl-btn" data-format="square" onclick="setFormat(this)">Post (1:1)</button>
              <button class="ctrl-btn" data-format="portrait" onclick="setFormat(this)">Post (4:5)</button>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="ctrl-btn" onclick="refreshPreview()">Refresh</button>
            <button id="download-btn" class="auth-btn" style="padding: 10px 16px; border: none; cursor:pointer;" onclick="downloadJpg()">
              Download JPG
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-label">Preview</div>
      <div class="preview-wrap social-preview-wrap">
        <img id="preview-img" src="" alt="Instagram export preview"/>
      </div>
      <p class="footer-note" id="download-note">JPG export keeps Instagram-ready dimensions (1080x1920, 1080x1080, or 1080x1350).</p>
    </div>

    <script>
      let currentDataset = 'top-artists';
      let currentRange = 'short_term';
      let currentCount = 6;
      let currentFormat = 'story';

      function maxCountForFormat(format) {
        return format === 'story' ? 7 : 5;
      }

      function syncCountControls() {
        const maxCount = maxCountForFormat(currentFormat);
        document.querySelectorAll('[data-count]').forEach(btn => {
          const value = Number(btn.dataset.count || '0');
          btn.disabled = value > maxCount;
          btn.style.opacity = btn.disabled ? '0.45' : '1';
          btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
        });

        if (currentCount > maxCount) {
          currentCount = maxCount;
          document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
          const active = document.querySelector('[data-count=\"' + String(maxCount) + '\"]');
          if (active) active.classList.add('active');
        }
      }

      function getSvgUrl() {
        const params = new URLSearchParams({
          dataset: currentDataset,
          range: currentRange,
          count: String(currentCount),
          format: currentFormat,
          t: String(Date.now())
        });
        return '${origin}/social-card.svg?' + params.toString();
      }

      function updatePreview() {
        const img = document.getElementById('preview-img');
        img.src = getSvgUrl();
        document.getElementById('download-note').textContent =
          'Dataset: ' + currentDataset.replace('-', ' ') + ' | Range: ' + currentRange.replace('_term', '').replace('_', ' ') +
          ' | Format: ' + currentFormat;
      }

      function refreshPreview() {
        updatePreview();
      }

      function setDataset(btn) {
        document.querySelectorAll('[data-dataset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDataset = btn.dataset.dataset;
        updatePreview();
      }

      function setRange(btn) {
        document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = btn.dataset.range;
        updatePreview();
      }

      function setCount(btn) {
        if (btn.disabled) return;
        document.querySelectorAll('[data-count]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCount = Number(btn.dataset.count || '6');
        updatePreview();
      }

      function setFormat(btn) {
        document.querySelectorAll('[data-format]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFormat = btn.dataset.format;
        syncCountControls();
        updatePreview();
      }

      function getSizeForFormat(format) {
        if (format === 'story') return { width: 1080, height: 1920 };
        if (format === 'portrait') return { width: 1080, height: 1350 };
        return { width: 1080, height: 1080 };
      }

      async function downloadJpg() {
        const downloadBtn = document.getElementById('download-btn');
        if (!downloadBtn) return;

        const originalText = downloadBtn.textContent;

        try {
          downloadBtn.textContent = 'Rendering...';
          downloadBtn.disabled = true;

          const svgResponse = await fetch(getSvgUrl(), { cache: 'no-store' });
          if (!svgResponse.ok) {
            throw new Error('Could not generate export image');
          }

          const svgText = await svgResponse.text();
          const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
          const blobUrl = URL.createObjectURL(svgBlob);

          const image = new Image();
          image.decoding = 'sync';

          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = blobUrl;
          });

          const size = getSizeForFormat(currentFormat);
          const canvas = document.createElement('canvas');
          canvas.width = size.width;
          canvas.height = size.height;

          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Could not prepare image canvas');
          }

          context.fillStyle = '#090909';
          context.fillRect(0, 0, size.width, size.height);
          context.drawImage(image, 0, 0, size.width, size.height);

          const jpgBlob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('JPG conversion failed')), 'image/jpeg', 0.95);
          });

          const jpgUrl = URL.createObjectURL(jpgBlob);
          const a = document.createElement('a');
          const dateTag = new Date().toISOString().slice(0, 10);
          a.href = jpgUrl;
          a.download = 'spotify-' + currentDataset + '-' + currentFormat + '-' + dateTag + '.jpg';
          document.body.appendChild(a);
          a.click();
          a.remove();

          URL.revokeObjectURL(blobUrl);
          URL.revokeObjectURL(jpgUrl);

          downloadBtn.textContent = 'Downloaded';
          setTimeout(() => {
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
          }, 1400);
        } catch (error) {
          console.error(error);
          downloadBtn.textContent = 'Retry Download';
          downloadBtn.disabled = false;
          alert(error instanceof Error ? error.message : 'Download failed');
        }
      }

      syncCountControls();
      updatePreview();
    </script>
  `;

  return htmlShell("Instagram Export", body, "social-export");
}
