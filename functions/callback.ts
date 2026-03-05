// functions/callback.ts
// Handles the OAuth redirect and exchanges the code for tokens.
// Displays the refresh token so you can copy it into your env vars.

interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const redirectUri = `${url.origin}/callback`;

  if (error) {
    return new Response(`Authorization error: ${error}`, { status: 400 });
  }
  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    return new Response(`Token exchange failed: ${text}`, { status: 500 });
  }

  const data = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };

  const token = data.refresh_token;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Authorization successful</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080808;
      color: #f0f0f0;
      font-family: 'Syne', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
    }
    .card {
      background: #111;
      border: 1px solid #1f1f1f;
      border-radius: 16px;
      padding: 40px;
      max-width: 560px;
      width: 100%;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(29,185,84,0.1);
      border: 1px solid rgba(29,185,84,0.25);
      color: #1DB954;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 6px 12px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .dot { width: 7px; height: 7px; background: #1DB954; border-radius: 50%; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.3px; }
    p { font-size: 14px; color: #888; line-height: 1.7; margin-bottom: 24px; }
    p code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      padding: 2px 6px;
      border-radius: 4px;
      color: #ccc;
    }
    .token-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #444;
      margin-bottom: 8px;
    }
    .token-box {
      background: #0c0c0c;
      border: 1px solid #1f1f1f;
      border-radius: 8px;
      padding: 14px 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #1DB954;
      word-break: break-all;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #1DB954;
      color: #000;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 14px;
      border: none;
      border-radius: 8px;
      padding: 11px 22px;
      cursor: pointer;
      transition: background 0.15s;
      margin-bottom: 28px;
    }
    .copy-btn:hover { background: #1ed760; }
    .steps {
      border-top: 1px solid #1f1f1f;
      padding-top: 24px;
      font-size: 13px;
      color: #555;
      line-height: 1.8;
      counter-reset: s;
    }
    .step { counter-increment: s; padding-left: 24px; position: relative; margin-bottom: 6px; }
    .step::before {
      content: counter(s) ".";
      position: absolute;
      left: 0;
      color: #333;
      font-weight: 600;
    }
    .step strong { color: #888; }
    .step code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      padding: 1px 6px;
      border-radius: 4px;
      color: #aaa;
    }
    a.home { color: #1DB954; text-decoration: none; }
    a.home:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Authorization successful</div>
    <h1>Your refresh token</h1>
    <p>
      Copy the token below and add it to Cloudflare Pages as
      <code>SPOTIFY_REFRESH_TOKEN</code> (mark it as a Secret), then redeploy.
    </p>

    <div class="token-label">Refresh Token</div>
    <div class="token-box" id="token">${token}</div>
    <button class="copy-btn" id="copyBtn" onclick="copy()">
      Copy token
    </button>

    <div class="steps">
      <div class="step">Copy the token above.</div>
      <div class="step">In <strong>Cloudflare Pages → Settings → Variables &amp; Secrets</strong>, set <code>SPOTIFY_REFRESH_TOKEN</code> to this value (mark as Secret).</div>
      <div class="step">Redeploy your Pages project.</div>
      <div class="step">Your <code>/now-playing</code> endpoint is now live. <a href="/" class="home">← Back to setup</a></div>
    </div>
  </div>

  <script>
    function copy() {
      navigator.clipboard.writeText(${JSON.stringify(token)}).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = 'Copy token', 2000);
      });
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
