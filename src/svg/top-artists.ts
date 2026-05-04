import { esc, trunc, SVG_FONT } from "../utils.js";

const CARD_W = 86;
const CARD_GAP = 10;
const COLS = 5;
const IMG_SIZE = 70;
const CARD_H = 100;
const PAD_X = 16;
const PAD_Y = 48; // space for header

function cardsPerRow(count: number): number {
  return Math.min(count, COLS);
}

function gridDimensions(count: number): { W: number; H: number; cols: number; rows: number } {
  const cols = cardsPerRow(count);
  const rows = Math.ceil(count / cols);
  const W = PAD_X * 2 + cols * CARD_W + (cols - 1) * CARD_GAP;
  const H = PAD_Y + rows * CARD_H + (rows - 1) * CARD_GAP + 16;
  return { W, H, cols, rows };
}

function rangeLabel(range: string): string {
  if (range === "short_term") return "Last 4 Weeks";
  if (range === "mid_term") return "Last 6 Months";
  return "All Time";
}

export function svgTopArtists(
  artists: Array<{ name: string; genres?: string[]; art: string }>,
  range: string
): string {
  const count = artists.length;
  const { W, H, cols } = gridDimensions(count);

  const cards = artists.map((artist, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAD_X + col * (CARD_W + CARD_GAP);
    const y = PAD_Y + row * (CARD_H + CARD_GAP);
    const genre = artist.genres?.[0] ? trunc(artist.genres[0], 12) : "";
    const name = trunc(artist.name, 11);
    const rank = i + 1;

    return `
    <g transform="translate(${x}, ${y})">
      <!-- Card background -->
      <rect width="${CARD_W}" height="${CARD_H}" rx="8" fill="#141414" stroke="#1f1f1f" stroke-width="1"/>
      <!-- Art -->
      <clipPath id="ca${i}"><rect x="8" y="8" width="${IMG_SIZE}" height="${IMG_SIZE}" rx="6"/></clipPath>
      ${artist.art
        ? `<image href="${artist.art}" x="8" y="8" width="${IMG_SIZE}" height="${IMG_SIZE}" clip-path="url(#ca${i})" preserveAspectRatio="xMidYMid slice"/>`
        : `<rect x="8" y="8" width="${IMG_SIZE}" height="${IMG_SIZE}" rx="6" fill="#1a1a1a"/>`
      }
      <!-- Rank badge -->
      <rect x="8" y="8" width="18" height="16" rx="4" fill="#000000cc"/>
      <text x="17" y="20" font-size="9" fill="#ffffff" font-weight="700" text-anchor="middle">${rank}</text>
      <!-- Name -->
      <text x="${CARD_W / 2}" y="90" font-size="9.5" fill="#e0e0e0" font-weight="600" text-anchor="middle">${esc(name)}</text>
      <!-- Genre -->
      ${genre ? `<text x="${CARD_W / 2}" y="100" font-size="8" fill="#555" text-anchor="middle">${esc(genre)}</text>` : ""}
    </g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>text { ${SVG_FONT} }</style>
    <clipPath id="ta-clip">
      <rect width="${W}" height="${H}" rx="14"/>
    </clipPath>
  </defs>
  <g clip-path="url(#ta-clip)">
    <rect width="${W}" height="${H}" fill="#0e0e0e"/>
    <rect width="${W}" height="40" fill="#111111"/>
    <text x="${PAD_X}" y="17" font-size="10" fill="#1DB954" font-weight="700" letter-spacing="1.5">SPOTIFY</text>
    <text x="${PAD_X + 56}" y="17" font-size="10" fill="#333" font-weight="600" letter-spacing="0.5">·</text>
    <text x="${PAD_X + 64}" y="17" font-size="10" fill="#444" font-weight="500">TOP ARTISTS</text>
    <text x="${W - PAD_X}" y="17" font-size="9" fill="#333" text-anchor="end">${rangeLabel(range)}</text>
    <line x1="${PAD_X}" y1="26" x2="${W - PAD_X}" y2="26" stroke="#1f1f1f" stroke-width="1"/>
    ${cards}
  </g>
  <rect width="${W}" height="${H}" rx="14" fill="none" stroke="#ffffff08" stroke-width="1"/>
</svg>`;
}

export function svgTopArtistsError(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="60" viewBox="0 0 480 60">
  <defs><style>text { ${SVG_FONT} }</style></defs>
  <rect width="480" height="60" rx="10" fill="#0e0e0e"/>
  <text x="20" y="36" font-size="13" fill="#444">Could not load top artists</text>
</svg>`;
}
