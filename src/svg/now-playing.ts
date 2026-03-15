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
  const coverSize = 168;
  const coverX = Math.round(W / 2 - coverSize / 2);
  const coverY = 235;
  const diskCx = Math.round(W / 2);
  const diskCy = 248;
  const diskR = 102;
  const prog = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;
  const barW = W - 56;
  const filledW = Math.round(barW * prog);
  const remainingSec = Math.max(0, (durationMs - progressMs) / 1000);
  const animateDur = `${Math.max(0.1, remainingSec).toFixed(1)}s`;

  const displayTrack = esc(trunc(track, 28));
  const displayArtists = esc(trunc(artists, 30));
  const displayAlbum = esc(trunc(album, 22));

  const timerTspans = Array.from({ length: Math.ceil(remainingSec) + 1 }, (_, i) => {
    const ms = Math.min(progressMs + i * 1000, durationMs);
    return `<tspan x="28" visibility="hidden">${fmtMs(ms)}<set attributeName="visibility" to="visible" begin="${i}s" end="${i + 1}s"/></tspan>`;
  }).join("");

  const vinylRings = [17, 29, 41, 53, 66, 79, 91].map((r, i) => {
    const opacity = (0.14 - i * 0.012).toFixed(3);
    return `<circle cx="${diskCx}" cy="${diskCy}" r="${r}" fill="none" stroke="#d8d8d8" stroke-opacity="${opacity}" stroke-width="1"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>text { ${SVG_FONT} }</style>
    <clipPath id="card-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="16"/></clipPath>
    <clipPath id="cover-clip"><rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="10"/></clipPath>
    <filter id="bg-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="24"/>
    </filter>
    <filter id="disk-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.6"/>
    </filter>
    <filter id="cover-shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.65"/>
    </filter>
    <linearGradient id="base-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#090909"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="shade-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.52"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="shade-bottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="68%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.62"/>
    </radialGradient>
    <radialGradient id="vinyl-fill" cx="32%" cy="28%" r="78%">
      <stop offset="0%" stop-color="#8f939a"/>
      <stop offset="35%" stop-color="#535760"/>
      <stop offset="72%" stop-color="#2f343d"/>
      <stop offset="100%" stop-color="#22262d"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1DB954"/>
      <stop offset="100%" stop-color="#1ed760"/>
    </linearGradient>
  </defs>

  <g clip-path="url(#card-clip)">
    <rect width="${W}" height="${H}" fill="url(#base-bg)"/>
    ${art
      ? `<image href="${art}" x="-42" y="-92" width="${W + 84}" height="${H + 184}" preserveAspectRatio="xMidYMid slice" filter="url(#bg-blur)" opacity="0.66"/>`
      : ""
    }
    ${art
      ? `<image href="${art}" x="0" y="-26" width="${W}" height="${H + 52}" preserveAspectRatio="xMidYMid slice" opacity="0.14"/>`
      : ""
    }
    <rect width="${W}" height="${H}" fill="url(#shade-top)"/>
    <rect width="${W}" height="${H}" fill="url(#shade-bottom)"/>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>

    <g transform="translate(26 27)">
      <circle cx="11" cy="11" r="11" fill="#1DB954"/>
      <path d="M6.2 9.1c3.4-1 6.8-.7 9.8 1" fill="none" stroke="#07150d" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M6.9 12.2c2.8-.8 5.8-.6 8.1.8" fill="none" stroke="#07150d" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M7.6 15.1c2.2-.6 4.3-.5 6 .5" fill="none" stroke="#07150d" stroke-width="1.25" stroke-linecap="round"/>
    </g>
    <text x="58" y="44" font-size="38" fill="#f5f5f5" font-weight="700">Last Played</text>
    <text x="28" y="79" font-size="13.5" fill="#dadada">
      I recently listened to <tspan font-weight="700" fill="#ffffff">${displayTrack}</tspan> by <tspan font-weight="700" fill="#ffffff">${displayArtists}</tspan>${displayAlbum ? ` from the album <tspan font-weight="700" fill="#ffffff">${displayAlbum}</tspan>` : ""}
    </text>

    <g filter="url(#disk-shadow)">
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 ${diskCx} ${diskCy}" to="360 ${diskCx} ${diskCy}" dur="18s" repeatCount="indefinite"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="${diskR}" fill="url(#vinyl-fill)"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="${diskR - 4}" fill="none" stroke="#f4f4f4" stroke-opacity="0.2" stroke-width="1.2"/>
        ${vinylRings}
        <circle cx="${diskCx}" cy="${diskCy}" r="29" fill="#30343a"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="11" fill="#0f1013"/>
        <circle cx="${diskCx}" cy="${diskCy}" r="3.6" fill="#040506"/>
      </g>
    </g>

    <g filter="url(#cover-shadow)">
      <rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="10" fill="#161616"/>
      ${art
        ? `<image href="${art}" x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" clip-path="url(#cover-clip)" preserveAspectRatio="xMidYMid slice"/>`
        : ""
      }
      <rect x="${coverX}" y="${coverY}" width="${coverSize}" height="${coverSize}" rx="10" fill="none" stroke="#ffffff36" stroke-width="1.1"/>
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
