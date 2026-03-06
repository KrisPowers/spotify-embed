// functions/now-playing.ts
// Cloudflare Pages Function — serves the live SVG badge.
// Env vars required (Pages > Settings > Variables & Secrets):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN

interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REFRESH_TOKEN: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number | null;
  item: {
    name: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string; width: number; height: number }>;
    };
    external_urls: { spotify: string };
  } | null;
}

async function getAccessToken(env: Env): Promise<string> {
  const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = (await res.json()) as SpotifyTokenResponse;
  return data.access_token;
}

async function getNowPlaying(accessToken: string): Promise<SpotifyCurrentlyPlaying | null> {
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json() as Promise<SpotifyCurrentlyPlaying>;
}

async function fetchAlbumArt(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return "";
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function fmtMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function svgPlaying(
  track: string,
  artists: string,
  art: string,
  progressMs: number,
  durationMs: number
): string {
  const W = 480, H = 130;
  const prog = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const barW = 296;
  const filledW = Math.round(barW * prog);
  const trackText = esc(trunc(track, 36));
  const artistText = esc(trunc(artists, 44));

  const vizBars = [
    { h: 8, x: 118 }, { h: 14, x: 126 }, { h: 10, x: 134 }, { h: 18, x: 142 }, { h: 12, x: 150 },
  ];
  const vizSvg = vizBars.map(({ h, x }, i) => {
    const delay = (i * 0.13).toFixed(2);
    return `<rect x="${x}" y="${65 - h / 2}" width="5" height="${h}" rx="2.5" fill="#1DB954">
      <animate attributeName="height" values="${h};${Math.max(3, h * 0.3)};${h}" dur="1s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="y" values="${65 - h / 2};${65 - Math.max(3, h * 0.3) / 2};${65 - h / 2}" dur="1s" begin="${delay}s" repeatCount="indefinite"/>
    </rect>`;
  }).join("");

  const remainingSec = Math.max(0, (durationMs - progressMs) / 1000);
  const animateDur = `${remainingSec.toFixed(1)}s`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>text { font-family: system-ui, -apple-system, sans-serif; }</style>
    <clipPath id="art"><rect x="16" y="16" width="88" height="88" rx="8"/></clipPath>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e0e0e"/>
      <stop offset="100%" stop-color="#161616"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1DB954"/>
      <stop offset="100%" stop-color="#1ed760"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" rx="14" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" rx="14" fill="none" stroke="#ffffff08" stroke-width="1"/>

  ${art
    ? `<image href="${art}" x="16" y="16" width="88" height="88" clip-path="url(#art)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="16" y="16" width="88" height="88" rx="8" fill="#1a1a1a"/>`
  }

  <!-- Visualizer -->
  ${vizSvg}

  <!-- Spotify wordmark -->
  <text x="164" y="27" font-size="10" fill="#1DB954" font-weight="700" letter-spacing="1.5">SPOTIFY</text>

  <!-- Track title -->
  <text x="164" y="56" font-size="16" fill="#f0f0f0" font-weight="600">${trackText}</text>

  <!-- Artist -->
  <text x="164" y="77" font-size="13" fill="#888888">${artistText}</text>

  <!-- Progress track -->
  <rect x="164" y="95" width="${barW}" height="3" rx="1.5" fill="#2a2a2a"/>
  <!-- Progress fill animates from current position to end of song -->
  <rect x="164" y="95" width="${filledW}" height="3" rx="1.5" fill="url(#bar)">
    <animate
      attributeName="width"
      from="${filledW}"
      to="${barW}"
      dur="${animateDur}"
      begin="0s"
      fill="freeze"
      calcMode="linear"
    />
  </rect>

  <!-- Elapsed time counts up second by second -->
  <text x="164" y="112" font-size="10" fill="#555">
    ${Array.from({ length: Math.ceil(remainingSec) + 1 }, (_, i) => {
      const ms = Math.min(progressMs + i * 1000, durationMs);
      return `<tspan visibility="hidden">${fmtMs(ms)}<set attributeName="visibility" to="visible" begin="${i}s" end="${i + 1}s"/></tspan>`;
    }).join("")}
  </text>
  <text x="${164 + barW}" y="112" font-size="10" fill="#555" text-anchor="end">${fmtMs(durationMs)}</text>
</svg>`;
}

function svgIdle(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="72" viewBox="0 0 480 72">
  <defs>
    <style>text { font-family: system-ui, -apple-system, sans-serif; }</style>
  </defs>
  <rect width="480" height="72" rx="12" fill="#0e0e0e"/>
  <rect width="480" height="72" rx="12" fill="none" stroke="#ffffff06" stroke-width="1"/>

  <!-- Muted Spotify icon -->
  <svg x="18" y="22" width="22" height="22" viewBox="0 0 24 24" fill="#2a2a2a">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>

  <!-- Static muted bars -->
  <rect x="50" y="28" width="4" height="16" rx="2" fill="#1e1e1e"/>
  <rect x="57" y="31" width="4" height="10" rx="2" fill="#1e1e1e"/>
  <rect x="64" y="26" width="4" height="20" rx="2" fill="#1e1e1e"/>
  <rect x="71" y="30" width="4" height="12" rx="2" fill="#1e1e1e"/>
  <rect x="78" y="28" width="4" height="16" rx="2" fill="#1e1e1e"/>

  <text x="96" y="34" font-size="13" fill="#3a3a3a" font-weight="600">Not playing anything right now</text>
  <text x="96" y="52" font-size="11" fill="#2a2a2a">Spotify is quiet</text>
</svg>`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  // ?nocache=1 bypasses Cloudflare edge cache for the live preview UI.
  // GitHub Camo hits the plain URL and receives the cached version (good for perf).
  const noCache = url.searchParams.has("nocache");
  void noCache; // both paths now use no-cache so GitHub/Camo always get fresh data
  const headers = {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const token = await getAccessToken(env);
    const playing = await getNowPlaying(token);

    if (!playing || !playing.is_playing || !playing.item) {
      return new Response(svgIdle(), { headers });
    }

    const { item, progress_ms } = playing;
    const artists = item.artists.map((a) => a.name).join(", ");
    const imageUrl = item.album.images[1]?.url ?? item.album.images[0]?.url ?? "";
    const art = imageUrl ? await fetchAlbumArt(imageUrl) : "";

    return new Response(
      svgPlaying(item.name, artists, art, progress_ms ?? 0, item.duration_ms),
      { headers }
    );
  } catch (err) {
    console.error(err);
    return new Response(svgIdle(), { headers });
  }
};
