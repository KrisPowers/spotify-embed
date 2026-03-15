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
  const coverSize = 160;
  const coverX = Math.round(W / 2 - coverSize / 2);
  const coverY = 238;
  const diskCx = Math.round(W / 2);
  const diskCy = 246;
  const diskR = 95;
  const prog = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const barW = W - 56;
  const filledW = Math.round(barW * prog);
  const remainingSec = Math.max(0, (durationMs - progressMs) / 1000);
  const animateDur = `${Math.max(0.1, remainingSec).toFixed(1)}s`;

  const displayTrack = esc(trunc(track, 22));
  const displayArtists = esc(trunc(artists, 18));
  const displayAlbum = esc(trunc(album, 14));

  const timerTspans = Array.from({ length: Math.ceil(remainingSec) + 1 }, (_, i) => {
    const ms = Math.min(progressMs + i * 1000, durationMs);
    return `<tspan x="28" visibility="hidden">${fmtMs(ms)}<set attributeName="visibility" to="visible" begin="${i}s" end="${i + 1}s"/></tspan>`;
  }).join("");

  const vinylRings = [17, 29, 41, 53, 66, 79, 91].map((r, i) => {
    const opacity = (0.11 - i * 0.012).toFixed(3);
    return `<circle cx="${diskCx}" cy="${diskCy}" r="${r}" fill="none" stroke="#d6d9df" stroke-opacity="${opacity}" stroke-width="1"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>text { ${SVG_FONT} }</style>
    <clipPath id="card-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="16"/></clipPath>
    <clipPath id="cover-clip"><rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8"/></clipPath>
    <filter id="bg-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="20"/>
    </filter>
    <filter id="disk-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.56"/>
    </filter>
    <filter id="cover-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.66"/>
    </filter>
    <linearGradient id="base-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#090909"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="shade-main" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.54"/>
      <stop offset="55%" stop-color="#000" stop-opacity="0.36"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.75"/>
    </linearGradient>
    <linearGradient id="shade-top-band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vinyl-fill" cx="36%" cy="28%" r="78%">
      <stop offset="0%" stop-color="#979ba3"/>
      <stop offset="36%" stop-color="#5d626b"/>
      <stop offset="74%" stop-color="#373c45"/>
      <stop offset="100%" stop-color="#2a2e36"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1DB954"/>
      <stop offset="100%" stop-color="#1ed760"/>
    </linearGradient>
  </defs>

  <g clip-path="url(#card-clip)">
    <rect width="${W}" height="${H}" fill="url(#base-bg)"/>
    ${art
      ? `<image href="${art}" x="-30" y="-72" width="${W + 60}" height="${H + 144}" preserveAspectRatio="xMidYMid slice" filter="url(#bg-blur)" opacity="0.72"/>`
      : ""
    }
    ${art
      ? `<image href="${art}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" opacity="0.2"/>`
      : ""
    }
    <rect width="${W}" height="${H}" fill="url(#shade-main)"/>
    <rect width="${W}" height="112" fill="url(#shade-top-band)"/>

    <g transform="translate(26 31)">
      <circle cx="10" cy="10" r="10" fill="#1DB954"/>
      <path d="M5.7 8.3c3.1-.9 6.2-.6 8.9.9" fill="none" stroke="#07150d" stroke-width="1.45" stroke-linecap="round"/>
      <path d="M6.4 11.1c2.5-.7 5.2-.6 7.4.7" fill="none" stroke="#07150d" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M6.9 13.7c2-.5 3.9-.4 5.4.5" fill="none" stroke="#07150d" stroke-width="1.15" stroke-linecap="round"/>
    </g>
    <text x="56" y="55" font-size="50" fill="#f5f5f5" font-weight="700">Last Played</text>
    <text x="28" y="95" font-size="13.5" fill="#ffffffde">
      I recently listened to <tspan font-weight="700" fill="#ffffff">${displayTrack}</tspan> by <tspan font-weight="700" fill="#ffffff">${displayArtists}</tspan>${displayAlbum ? ` from the album <tspan font-weight="700" fill="#ffffff">${displayAlbum}</tspan>` : ""}
    </text>

    <g filter="url(#disk-shadow)">
      <g>
        <circle cx="${diskCx}" cy="${diskCy}" r="${diskR}" fill="url(#vinyl-fill)"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="${diskR - 3}" fill="none" stroke="#f0f0f0" stroke-opacity="0.2" stroke-width="1.1"/>
        ${vinylRings}
        <circle cx="${diskCx}" cy="${diskCy}" r="26" fill="#353a43"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="9.5" fill="#0f1013"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="3.2" fill="#06070a"/>
      </g>
    </g>

    <g filter="url(#cover-shadow)">
      <rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8" fill="#161616"/>
      ${art
        ? `<image href="${art}" x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" clip-path="url(#cover-clip)" preserveAspectRatio="xMidYMid slice"/>`
        : ""
      }
      <rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="8" fill="none" stroke="#ffffff30" stroke-width="1"/>
    </g>
  </g>

  <rect width="${W}" height="${H}" rx="16" fill="none" stroke="#ffffff18" stroke-width="1"/>
  <rect x="28" y="321" width="${barW}" height="4" rx="2" fill="#ffffff2a"/>
  <rect x="28" y="321" width="${filledW}" height="4" rx="2" fill="url(#bar)">
    <animate attributeName="width" from="${filledW}" to="${barW}" dur="${animateDur}" begin="0s" fill="freeze" calcMode="linear"/>
  </rect>
  <text y="313" font-size="11" fill="#d5d5d5">${timerTspans}</text>
  <text x="${28 + barW}" y="313" font-size="11" fill="#d5d5d5" text-anchor="end">${fmtMs(durationMs)}</text>
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
  <text x="64" y="46" font-size="22" fill="#ececec" font-weight="700">Last Played</text>
  <text x="28" y="80" font-size="14" fill="#888">Not playing anything right now. Start a track in Spotify to update this card.</text>
</svg>`;
}
