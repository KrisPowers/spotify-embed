export function htmlShell(title: string, body: string, activePage: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Spotify README</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    ::-webkit-scrollbar { width: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --green: #1DB954;
      --green-dim: rgba(29,185,84,0.15);
      --bg: #080808;
      --surface: #111111;
      --surface-2: #171717;
      --surface-3: #1f1f1f;
      --border: #1a1a1a;
      --border-2: #252525;
      --text: #f0f0f0;
      --text-2: #888;
      --text-3: #444;
      --font: 'Syne', system-ui, sans-serif;
      --mono: 'JetBrains Mono', monospace;
      --r: 10px;
    }
    html, body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; -webkit-font-smoothing: antialiased; }

    /* Layout */
    .layout { display: flex; min-height: 100vh; }

    /* Sidebar */
    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 28px 0 24px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 20px 28px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }
    .sidebar-logo-icon {
      width: 32px; height: 32px;
      background: var(--green-dim);
      border: 1px solid rgba(29,185,84,0.25);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: var(--green);
      flex-shrink: 0;
    }
    .sidebar-logo-text { font-size: 13px; font-weight: 700; letter-spacing: -0.2px; line-height: 1.3; }
    .sidebar-logo-sub { font-size: 10px; color: var(--text-3); font-weight: 400; margin-top: 1px; }
    .sidebar-section { padding: 0 12px; margin-bottom: 4px; }
    .sidebar-label { font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-3); padding: 0 8px; margin-bottom: 6px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: 7px;
      font-size: 13px; font-weight: 500; color: var(--text-2);
      text-decoration: none; transition: all 0.15s;
      margin-bottom: 2px;
    }
    .nav-item:hover { background: var(--surface-2); color: var(--text); }
    .nav-item.active { background: var(--green-dim); color: var(--green); border: 1px solid rgba(29,185,84,0.2); }
    .nav-item svg { flex-shrink: 0; opacity: 0.7; }
    .nav-item.active svg { opacity: 1; }
    .sidebar-footer { margin-top: auto; padding: 16px 20px 0; border-top: 1px solid var(--border); }
    .sidebar-footer p { font-size: 11px; color: var(--text-3); line-height: 1.6; }
    .sidebar-footer a { color: var(--text-3); }
    .sidebar-footer a:hover { color: var(--green); }

    /* Main content */
    .main { flex: 1; padding: 40px 48px 80px; max-width: 720px; }
    .page-header { margin-bottom: 32px; }
    .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 6px; }
    .page-subtitle { font-size: 14px; color: var(--text-2); line-height: 1.6; }

    /* Section */
    .section { margin-bottom: 28px; }
    .section-label { font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-3); margin-bottom: 10px; }

    /* Cards */
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; margin-bottom: 12px; }

    /* Code block */
    .code-block {
      background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
      padding: 13px 16px; position: relative; display: flex; align-items: flex-start; gap: 10px;
    }
    .code-pre { font-family: var(--mono); font-size: 12.5px; color: var(--green); word-break: break-all; white-space: pre-wrap; flex: 1; min-width: 0; line-height: 1.6; padding-right: 70px; }
    .copy-btn {
      position: absolute; top: 10px; right: 10px;
      display: flex; align-items: center; gap: 5px;
      background: var(--surface-3); border: 1px solid var(--border-2);
      color: var(--text-3); font-family: var(--font); font-size: 11px; font-weight: 500;
      padding: 5px 10px; border-radius: 5px; cursor: pointer; white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .copy-btn:hover { color: var(--text); border-color: var(--text-3); }

    /* Env table */
    .env-table { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .env-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 10px 14px; background: var(--surface); border-bottom: 1px solid var(--border); }
    .env-row:last-child { border-bottom: none; }
    .env-var { font-family: var(--mono); font-size: 12px; color: #e8c97e; white-space: nowrap; }
    .env-desc { font-size: 13px; color: var(--text-3); }
    .badge { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
    .badge-plain { background: var(--surface-3); color: var(--text-3); border: 1px solid var(--border-2); }
    .badge-secret { background: rgba(255,100,100,0.06); color: #e07070; border: 1px solid rgba(255,100,100,0.2); }

    /* Steps */
    .steps { display: flex; flex-direction: column; }
    .step { display: grid; grid-template-columns: 32px 1fr; gap: 0 18px; padding-bottom: 28px; position: relative; }
    .step::before { content: ''; position: absolute; left: 15px; top: 32px; bottom: 0; width: 1px; background: var(--border); }
    .step:last-child::before { display: none; }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--surface-2); border: 1px solid var(--border-2); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text-2); position: relative; z-index: 1; flex-shrink: 0; }
    .step-body { padding-top: 6px; display: flex; flex-direction: column; gap: 10px; }
    .step-title { font-size: 15px; font-weight: 600; color: var(--text); letter-spacing: -0.2px; }
    .step-desc { font-size: 14px; color: var(--text-2); line-height: 1.7; }
    .step-desc strong { color: var(--text); font-weight: 600; }
    .step-note { font-size: 12px; color: var(--text-3); line-height: 1.6; }

    /* Inline code */
    code { font-family: var(--mono); font-size: 12px; color: var(--text-2); background: var(--surface-2); border: 1px solid var(--border-2); padding: 2px 6px; border-radius: 4px; }

    /* Auth button */
    .auth-btn { display: inline-flex; align-items: center; gap: 9px; background: var(--green); color: #000; font-family: var(--font); font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 8px; padding: 11px 22px; transition: background 0.15s, transform 0.1s; align-self: flex-start; }
    .auth-btn:hover { background: #1ed760; transform: translateY(-1px); }

    /* Link */
    a.link { color: var(--green); text-decoration: none; border-bottom: 1px solid rgba(29,185,84,0.3); transition: border-color 0.15s; }
    a.link:hover { border-color: var(--green); }

    /* Range/count controls */
    .controls { display: flex; gap: 12px; flex-wrap: wrap; }
    .control-group { display: flex; flex-direction: column; gap: 6px; }
    .control-label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-3); }
    .control-row { display: flex; gap: 4px; }
    .ctrl-btn {
      padding: 7px 14px; border-radius: 6px; border: 1px solid var(--border-2);
      background: var(--surface-2); color: var(--text-2); font-family: var(--font);
      font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
    }
    .ctrl-btn:hover { color: var(--text); border-color: var(--text-3); }
    .ctrl-btn.active { background: var(--green-dim); color: var(--green); border-color: rgba(29,185,84,0.4); }

    /* Preview */
    .preview-wrap { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r); padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 80px; position: relative; overflow: hidden; }
    .preview-wrap img { max-width: 100%; border-radius: 4px; display: block; }
    .social-preview-wrap { min-height: 460px; padding: 18px; }
    .social-preview-wrap img { max-height: 680px; width: auto; object-fit: contain; border: 1px solid #242424; background: #080808; }

    /* Divider */
    hr { border: none; border-top: 1px solid var(--border); margin: 28px 0; }

    /* Footer note */
    .footer-note { font-size: 12px; color: var(--text-3); line-height: 1.7; margin-top: 16px; }

    /* Build info table */
    .build-table { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .build-row { display: flex; align-items: center; gap: 16px; padding: 10px 14px; background: var(--surface); border-bottom: 1px solid var(--border); }
    .build-row:last-child { border-bottom: none; }
    .build-key { font-size: 12px; color: var(--text-3); min-width: 130px; flex-shrink: 0; }
    .build-val { font-family: var(--mono); font-size: 12px; color: var(--green); }

    @media (max-width: 980px) {
      .layout { flex-direction: column; }
      .sidebar {
        width: 100%;
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--border);
        padding: 18px 0 14px;
      }
      .sidebar-section { display: flex; flex-wrap: wrap; gap: 6px; }
      .sidebar-label { width: 100%; }
      .nav-item { margin-bottom: 0; }
      .main {
        max-width: 100%;
        padding: 28px 20px 56px;
      }
      .control-row { flex-wrap: wrap; }
      .auth-btn { width: 100%; justify-content: center; }
      .social-preview-wrap img {
        max-height: 520px;
        width: min(100%, 360px);
      }
    }
  </style>
</head>
<body>
  <div class="layout">
    <nav class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        </div>
        <div>
          <div class="sidebar-logo-text">Spotify EMBED</div>
          <div class="sidebar-logo-sub">GitHub badge toolkit</div>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-label">Start</div>
        <a href="/getting-setup" class="nav-item ${activePage === 'getting-setup' ? 'active' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M12 4h9"/><path d="M4 9h16"/><path d="M4 15h16"/><path d="M8 4v16"/></svg>
          Getting Setup
        </a>
      </div>
      <div class="sidebar-section" style="margin-top: 16px;">
        <div class="sidebar-label">Widgets</div>
        <a href="/now-playing" class="nav-item ${activePage === 'now-playing' ? 'active' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          Now Playing
        </a>
        <a href="/top-artists" class="nav-item ${activePage === 'top-artists' ? 'active' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Top Artists
        </a>
        <a href="/top-tracks" class="nav-item ${activePage === 'top-tracks' ? 'active' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          Top Tracks
        </a>
        <a href="/social-export" class="nav-item ${activePage === 'social-export' ? 'active' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          Social Export
        </a>
      </div>
      <div class="sidebar-section" style="margin-top: 16px;">
        <div class="sidebar-label">Account</div>
        <a href="/auth" class="nav-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Authorize Spotify
        </a>
      </div>
      <div class="sidebar-footer">
        <p>Powered by Cloudflare Workers &amp; Spotify API</p>
      </div>
    </nav>
    <div class="main">
      ${body}
    </div>
  </div>
  <script>
    function copyCode(btn) {
      const pre = btn.closest('.code-block').querySelector('.code-pre');
      navigator.clipboard.writeText(pre.textContent.trim()).then(() => {
        btn.textContent = '✓ Copied';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    }
  </script>
</body>
</html>`;
}
