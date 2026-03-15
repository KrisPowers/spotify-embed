import { esc, trunc, fmtMs, SVG_FONT } from "../utils.js";

export function svgNowPlaying(
  track: string,
  artists: string,
  album: string,
  art: string,
  progressMs: number,
  durationMs: number
): string {
  const W = 640, H = 360;
  const coverSize = 156;
  const coverX = Math.round(W / 2 - coverSize / 2);
  const coverY = 219;
  const diskCx = Math.round(W / 2);
  const diskCy = 241;
  const diskR = 72;
  const barX = 28;
  const barY = 110;
  const barH = 3;
  const timerY = 103;
  const prog = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const barW = W - barX * 2;
  const filledW = Math.round(barW * prog);
  const remainingSec = Math.max(0, (durationMs - progressMs) / 1000);
  const animateDur = `${Math.max(0.1, remainingSec).toFixed(1)}s`;

  const displayTrack = esc(trunc(track, 22));
  const displayArtists = esc(trunc(artists, 18));
  const displayAlbum = esc(trunc(album, 14));

  const timerTspans = Array.from({ length: Math.ceil(remainingSec) + 1 }, (_, i) => {
    const ms = Math.min(progressMs + i * 1000, durationMs);
    return `<tspan x="${barX}" visibility="hidden">${fmtMs(ms)}<set attributeName="visibility" to="visible" begin="${i}s" end="${i + 1}s"/></tspan>`;
  }).join("");

  const vinylRings = [14, 24, 34, 44, 54, 64, 70].map((r, i) => {
    const opacity = (0.1 - i * 0.011).toFixed(3);
    return `<circle cx="${diskCx}" cy="${diskCy}" r="${r}" fill="none" stroke="#d4d8df" stroke-opacity="${opacity}" stroke-width="1"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>text { ${SVG_FONT} }</style>
    <clipPath id="card-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="16"/></clipPath>
    <clipPath id="cover-clip"><rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="4"/></clipPath>
    <filter id="bg-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="disk-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
    <filter id="cover-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity="0.6"/>
    </filter>
    <linearGradient id="base-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#090909"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="shade-main" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.58"/>
      <stop offset="52%" stop-color="#000" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.78"/>
    </linearGradient>
    <linearGradient id="shade-edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.42"/>
      <stop offset="20%" stop-color="#000" stop-opacity="0.08"/>
      <stop offset="80%" stop-color="#000" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.42"/>
    </linearGradient>
    <linearGradient id="shade-top-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.46"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vinyl-fill" cx="36%" cy="28%" r="78%">
      <stop offset="0%" stop-color="#8f949d"/>
      <stop offset="34%" stop-color="#565b64"/>
      <stop offset="72%" stop-color="#323740"/>
      <stop offset="100%" stop-color="#262b33"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1DB954"/>
      <stop offset="100%" stop-color="#1ed760"/>
    </linearGradient>
  </defs>

  <g clip-path="url(#card-clip)">
    <rect width="${W}" height="${H}" fill="url(#base-bg)"/>
    ${art
      ? `<image href="${art}" x="-28" y="-76" width="${W + 56}" height="${H + 152}" preserveAspectRatio="xMidYMid slice" filter="url(#bg-blur)" opacity="0.62"/>`
      : ""
    }
    <rect width="${W}" height="${H}" fill="url(#shade-main)"/>
    <rect width="${W}" height="${H}" fill="url(#shade-edge)"/>
    <rect width="${W}" height="112" fill="url(#shade-top-band)"/>

    <g>
      <circle cx="36" cy="43" r="11" fill="#1DB954"/>
      <path d="M31.2 41.1c3.4-1 6.8-.7 9.8 1" fill="none" stroke="#07150d" stroke-width="1.55" stroke-linecap="round"/>
      <path d="M31.9 44.2c2.8-.8 5.8-.6 8.1.8" fill="none" stroke="#07150d" stroke-width="1.35" stroke-linecap="round"/>
      <path d="M32.6 47.1c2.2-.6 4.3-.5 6 .5" fill="none" stroke="#07150d" stroke-width="1.2" stroke-linecap="round"/>
      <text x="60" y="45" font-size="17" fill="#f5f5f5" font-weight="700" dominant-baseline="middle">Now Playing</text>
    </g>
    <text x="28" y="83" font-size="12.8" fill="#ffffffde">
      Now playing <tspan font-weight="700" fill="#ffffff">${displayTrack}</tspan> by <tspan font-weight="700" fill="#ffffff">${displayArtists}</tspan>${displayAlbum ? ` from the album <tspan font-weight="700" fill="#ffffff">${displayAlbum}</tspan>` : ""}
    </text>

    <g filter="url(#disk-shadow)">
      <g>
        <circle cx="${diskCx}" cy="${diskCy}" r="${diskR}" fill="url(#vinyl-fill)"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="${diskR - 2}" fill="none" stroke="#ededed" stroke-opacity="0.18" stroke-width="1"/>
        ${vinylRings}
        <circle cx="${diskCx}" cy="${diskCy}" r="18" fill="#333841"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="6.4" fill="#0f1013"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="3" fill="#06070a"/>
      </g>
    </g>

    <g filter="url(#cover-shadow)">
      <rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="4" fill="#161616"/>
      ${art
        ? `<image href="${art}" x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" clip-path="url(#cover-clip)" preserveAspectRatio="xMidYMid slice"/>`
        : ""
      }
      <rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="4" fill="none" stroke="#ffffff24" stroke-width="1"/>
    </g>
  </g>

  <rect width="${W}" height="${H}" rx="16" fill="none" stroke="#ffffff18" stroke-width="1"/>
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="1.5" fill="#ffffff2a"/>
  <rect x="${barX}" y="${barY}" width="${filledW}" height="${barH}" rx="1.5" fill="url(#bar)">
    <animate attributeName="width" from="${filledW}" to="${barW}" dur="${animateDur}" begin="0s" fill="freeze" calcMode="linear"/>
  </rect>
  <text y="${timerY}" font-size="11.5" fill="#d4d4d4">${timerTspans}</text>
  <text x="${barX + barW}" y="${timerY}" font-size="11.5" fill="#d4d4d4" text-anchor="end">${fmtMs(durationMs)}</text>
</svg>`;
}

export function svgNowPlayingIdle(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="120" viewBox="0 0 640 120">
  <defs><style>text { ${SVG_FONT} }</style></defs>
  <rect width="640" height="120" rx="16" fill="#090909"/>
  <rect width="640" height="120" rx="16" fill="none" stroke="#ffffff12" stroke-width="1"/>
  <circle cx="42" cy="42" r="11" fill="#1DB954"/>
  <path d="M37.2 40.1c3.4-1 6.8-.7 9.8 1" fill="none" stroke="#07150d" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M37.9 43.2c2.8-.8 5.8-.6 8.1.8" fill="none" stroke="#07150d" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M38.6 46.1c2.2-.6 4.3-.5 6 .5" fill="none" stroke="#07150d" stroke-width="1.25" stroke-linecap="round"/>
  <text x="64" y="46" font-size="22" fill="#ececec" font-weight="700">Now Playing</text>
  <text x="28" y="80" font-size="14" fill="#888">Not playing anything right now. Start a track in Spotify to update this card.</text>
</svg>`;
}
