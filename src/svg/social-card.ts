import { esc, trunc, SVG_FONT } from "../utils.js";

export type SocialDataset = "top-artists" | "top-tracks";
export type SocialFormat = "story" | "square" | "portrait";

export interface SocialCardItem {
  rank: number;
  title: string;
  subtitle: string;
  art: string;
}

interface SocialCardRenderInput {
  dataset: SocialDataset;
  range: string;
  format: SocialFormat;
  generatedAt: string;
  items: SocialCardItem[];
}

interface CanvasSize {
  width: number;
  height: number;
  label: string;
}

function getCanvasSize(format: SocialFormat): CanvasSize {
  if (format === "story") return { width: 1080, height: 1920, label: "Story 9:16" };
  if (format === "portrait") return { width: 1080, height: 1350, label: "Post 4:5" };
  return { width: 1080, height: 1080, label: "Post 1:1" };
}

function getRangeLabel(range: string): string {
  if (range === "short_term") return "Last 4 Weeks";
  if (range === "mid_term") return "Last 6 Months";
  return "All Time";
}

function datasetMeta(dataset: SocialDataset): { heading: string; subheading: string } {
  if (dataset === "top-artists") {
    return { heading: "Top Artists", subheading: "Most played artists" };
  }
  return { heading: "Top Tracks", subheading: "Most played tracks" };
}

function computeListLayout(format: SocialFormat): { topPad: number; sidePad: number; rowHeight: number; rowGap: number; maxItems: number; titleSize: number; subtitleSize: number } {
  if (format === "story") {
    return { topPad: 360, sidePad: 88, rowHeight: 180, rowGap: 22, maxItems: 7, titleSize: 42, subtitleSize: 30 };
  }
  if (format === "portrait") {
    return { topPad: 300, sidePad: 82, rowHeight: 150, rowGap: 18, maxItems: 5, titleSize: 34, subtitleSize: 24 };
  }
  return { topPad: 236, sidePad: 76, rowHeight: 132, rowGap: 16, maxItems: 5, titleSize: 30, subtitleSize: 22 };
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function svgSocialCard(input: SocialCardRenderInput): string {
  const { dataset, range, format, generatedAt } = input;
  const size = getCanvasSize(format);
  const meta = datasetMeta(dataset);
  const layout = computeListLayout(format);
  const items = input.items.slice(0, layout.maxItems);

  const listRows = items
    .map((item, idx) => {
      const y = layout.topPad + idx * (layout.rowHeight + layout.rowGap);
      const artSize = layout.rowHeight - 26;
      const textX = layout.sidePad + artSize + 36;
      const title = trunc(item.title, format === "story" ? 34 : 30);
      const subtitle = trunc(item.subtitle, format === "story" ? 42 : 36);

      return `
      <g transform="translate(${layout.sidePad}, ${y})">
        <rect width="${size.width - layout.sidePad * 2}" height="${layout.rowHeight}" rx="32" fill="#101010" stroke="#222" stroke-width="2"/>
        <clipPath id="row-art-${idx}">
          <rect x="14" y="13" width="${artSize}" height="${artSize}" rx="18"/>
        </clipPath>
        ${item.art
          ? `<image href="${item.art}" x="14" y="13" width="${artSize}" height="${artSize}" clip-path="url(#row-art-${idx})" preserveAspectRatio="xMidYMid slice"/>`
          : `<rect x="14" y="13" width="${artSize}" height="${artSize}" rx="18" fill="#1c1c1c"/>`
        }
        <rect x="${artSize - 8}" y="10" width="54" height="42" rx="16" fill="#000000cc"/>
        <text x="${artSize + 19}" y="39" font-size="24" fill="#fff" text-anchor="middle" font-weight="700">${item.rank}</text>
        <text x="${textX}" y="${layout.rowHeight / 2 - 10}" font-size="${layout.titleSize}" fill="#f2f2f2" font-weight="650">${esc(title)}</text>
        <text x="${textX}" y="${layout.rowHeight / 2 + 30}" font-size="${layout.subtitleSize}" fill="#8a8a8a">${esc(subtitle)}</text>
      </g>`;
    })
    .join("");

  const hero = items[0];
  const heroCard = hero
    ? (() => {
        const cfg = format === "story"
          ? { cardW: 780, cardH: 1040, cardY: 330, artSize: 430, artYPad: 150, titleYPad: 760, subtitleYPad: 818, badgeYPad: 72, badgeW: 148, badgeH: 70, titleSize: 58, subtitleSize: 33, pulseR1: 320, pulseR2: 250, pulseR3: 186 }
          : format === "portrait"
          ? { cardW: 760, cardH: 860, cardY: 300, artSize: 360, artYPad: 136, titleYPad: 650, subtitleYPad: 702, badgeYPad: 68, badgeW: 140, badgeH: 66, titleSize: 50, subtitleSize: 30, pulseR1: 276, pulseR2: 218, pulseR3: 164 }
          : { cardW: 720, cardH: 640, cardY: 300, artSize: 280, artYPad: 118, titleYPad: 546, subtitleYPad: 588, badgeYPad: 54, badgeW: 128, badgeH: 58, titleSize: 42, subtitleSize: 28, pulseR1: 210, pulseR2: 166, pulseR3: 128 };

        const cx = (size.width - cfg.cardW) / 2;
        const cy = cfg.cardY;
        const artX = (size.width - cfg.artSize) / 2;
        const artY = cy + cfg.artYPad;
        const pulseX = size.width / 2;
        const pulseY = artY + cfg.artSize / 2;
        const title = trunc(hero.title, format === "story" ? 26 : 22);
        const subtitle = trunc(hero.subtitle, format === "story" ? 36 : 30);

        return `
  <g>
    <rect x="${cx}" y="${cy}" width="${cfg.cardW}" height="${cfg.cardH}" rx="54" fill="#0f0f0f" stroke="#222" stroke-width="3"/>
    <circle cx="${pulseX}" cy="${pulseY}" r="${cfg.pulseR1}" fill="url(#pulse-a)"/>
    <circle cx="${pulseX}" cy="${pulseY}" r="${cfg.pulseR2}" fill="url(#pulse-b)"/>
    <circle cx="${pulseX}" cy="${pulseY}" r="${cfg.pulseR3}" fill="url(#pulse-c)"/>
    <clipPath id="hero-art">
      <rect x="${artX}" y="${artY}" width="${cfg.artSize}" height="${cfg.artSize}" rx="40"/>
    </clipPath>
    ${hero.art
      ? `<image href="${hero.art}" x="${artX}" y="${artY}" width="${cfg.artSize}" height="${cfg.artSize}" clip-path="url(#hero-art)" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${artX}" y="${artY}" width="${cfg.artSize}" height="${cfg.artSize}" rx="40" fill="#1c1c1c"/>`
    }
    <rect x="${size.width / 2 - cfg.badgeW / 2}" y="${cy + cfg.badgeYPad}" width="${cfg.badgeW}" height="${cfg.badgeH}" rx="30" fill="#1DB954"/>
    <text x="${size.width / 2}" y="${cy + cfg.badgeYPad + cfg.badgeH - 18}" font-size="44" fill="#060606" text-anchor="middle" font-weight="900">#1</text>
    <text x="${size.width / 2}" y="${cy + cfg.titleYPad}" font-size="${cfg.titleSize}" fill="#f4f4f4" text-anchor="middle" font-weight="800">${esc(title)}</text>
    <text x="${size.width / 2}" y="${cy + cfg.subtitleYPad}" font-size="${cfg.subtitleSize}" fill="#949494" text-anchor="middle">${esc(subtitle)}</text>
  </g>`;
      })()
    : "";

  const dateLabel = formatGeneratedAt(generatedAt);
  const accountText = `${meta.subheading} - ${getRangeLabel(range)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
  <defs>
    <style>text { ${SVG_FONT} }</style>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#040404"/>
      <stop offset="40%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#111"/>
    </linearGradient>
    <radialGradient id="glow-a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${size.width * 0.85} ${size.height * 0.1}) rotate(90) scale(${size.height * 0.5} ${size.width * 0.5})">
      <stop offset="0%" stop-color="#1DB954" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#1DB954" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${size.width * 0.14} ${size.height * 0.9}) rotate(90) scale(${size.height * 0.4} ${size.width * 0.45})">
      <stop offset="0%" stop-color="#1ed760" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1ed760" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pulse-a" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#27e56a" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#27e56a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pulse-b" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1DB954" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#1DB954" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pulse-c" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1DB954" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1DB954" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${size.width}" height="${size.height}" fill="url(#bg-grad)"/>
  <rect width="${size.width}" height="${size.height}" fill="url(#glow-a)"/>
  <rect width="${size.width}" height="${size.height}" fill="url(#glow-b)"/>

  <text x="80" y="116" font-size="34" fill="#1DB954" font-weight="700" letter-spacing="5">SPOTIFY</text>
  <text x="80" y="210" font-size="96" fill="#fff" font-weight="800">${meta.heading}</text>
  <text x="80" y="264" font-size="34" fill="#8d8d8d">${esc(accountText)}</text>

  ${items.length === 1 ? heroCard : listRows}

  <text x="80" y="${size.height - 78}" font-size="24" fill="#696969">Generated by spotify-embed</text>
  <text x="${size.width - 80}" y="${size.height - 78}" font-size="24" fill="#696969" text-anchor="end">${dateLabel}</text>
</svg>`;
}

export function svgSocialCardError(format: SocialFormat, message = "Could not load Spotify data"): string {
  const size = getCanvasSize(format);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
  <defs><style>text { ${SVG_FONT} }</style></defs>
  <rect width="${size.width}" height="${size.height}" fill="#090909"/>
  <rect x="64" y="64" width="${size.width - 128}" height="${size.height - 128}" rx="30" fill="#101010" stroke="#232323" stroke-width="2"/>
  <text x="${size.width / 2}" y="${size.height / 2 - 16}" text-anchor="middle" font-size="48" fill="#f4f4f4" font-weight="700">Export Error</text>
  <text x="${size.width / 2}" y="${size.height / 2 + 38}" text-anchor="middle" font-size="28" fill="#8a8a8a">${esc(message)}</text>
</svg>`;
}
