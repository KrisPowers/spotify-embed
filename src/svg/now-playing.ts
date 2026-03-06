import { esc, trunc, fmtMs, SVG_FONT } from "../utils.js";

export function svgNowPlaying(
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
  const remainingSec = Math.max(0, (durationMs - progressMs) / 1000);
  const animateDur = `${remainingSec.toFixed(1)}s`;

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

  const timerTspans = Array.from({ length: Math.ceil(remainingSec) + 1 }, (_, i) => {
    const ms = Math.min(progressMs + i * 1000, durationMs);
    return `<tspan x="164" visibility="hidden">${fmtMs(ms)}<set attributeName="visibility" to="visible" begin="${i}s" end="${i + 1}s"/></tspan>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>text { ${SVG_FONT} }</style>
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
  ${vizSvg}
  <text x="164" y="27" font-size="10" fill="#1DB954" font-weight="700" letter-spacing="1.5">SPOTIFY</text>
  <text x="164" y="56" font-size="16" fill="#f0f0f0" font-weight="600">${esc(trunc(track, 36))}</text>
  <text x="164" y="77" font-size="13" fill="#888888">${esc(trunc(artists, 44))}</text>
  <rect x="164" y="95" width="${barW}" height="3" rx="1.5" fill="#2a2a2a"/>
  <rect x="164" y="95" width="${filledW}" height="3" rx="1.5" fill="url(#bar)">
    <animate attributeName="width" from="${filledW}" to="${barW}" dur="${animateDur}" begin="0s" fill="freeze" calcMode="linear"/>
  </rect>
  <text y="112" font-size="10" fill="#555">${timerTspans}</text>
  <text x="${164 + barW}" y="112" font-size="10" fill="#555" text-anchor="end">${fmtMs(durationMs)}</text>
</svg>`;
}

export function svgNowPlayingIdle(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="72" viewBox="0 0 480 72">
  <defs><style>text { ${SVG_FONT} }</style></defs>
  <rect width="480" height="72" rx="12" fill="#0e0e0e"/>
  <rect width="480" height="72" rx="12" fill="none" stroke="#ffffff06" stroke-width="1"/>
  <svg x="18" y="22" width="22" height="22" viewBox="0 0 24 24" fill="#2a2a2a">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
  <rect x="50" y="28" width="4" height="16" rx="2" fill="#1e1e1e"/>
  <rect x="57" y="31" width="4" height="10" rx="2" fill="#1e1e1e"/>
  <rect x="64" y="26" width="4" height="20" rx="2" fill="#1e1e1e"/>
  <rect x="71" y="30" width="4" height="12" rx="2" fill="#1e1e1e"/>
  <rect x="78" y="28" width="4" height="16" rx="2" fill="#1e1e1e"/>
  <text x="96" y="34" font-size="13" fill="#3a3a3a" font-weight="600">Not playing anything right now</text>
  <text x="96" y="52" font-size="11" fill="#2a2a2a">Spotify is quiet</text>
</svg>`;
}
