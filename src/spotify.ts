export interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REFRESH_TOKEN: string;
}

export interface SpotifyCurrentlyPlaying {
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
  } | null;
}

export interface SpotifyArtist {
  name: string;
  genres?: string[];
  images: Array<{ url: string; width: number; height: number }>;
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  external_urls: { spotify: string };
}

export type TimeRange = "short_term" | "mid_term" | "long_term" | "medium_term";

export async function getAccessToken(env: Env): Promise<string> {
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
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function getNowPlaying(token: string): Promise<SpotifyCurrentlyPlaying | null> {
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json() as Promise<SpotifyCurrentlyPlaying>;
}

export async function getTopArtists(
  token: string,
  range: TimeRange = "medium_term",
  limit = 8
): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({
    time_range: range,
    limit: String(Math.min(Math.max(limit, 1), 10)),
  });
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/artists?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Top artists error: ${res.status}`);
  const data = await res.json() as { items: SpotifyArtist[] };
  return data.items;
}

export async function getTopTracks(
  token: string,
  range: TimeRange = "medium_term",
  limit = 8
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    time_range: range,
    limit: String(Math.min(Math.max(limit, 1), 10)),
  });
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Top tracks error: ${res.status}`);
  const data = await res.json() as { items: SpotifyTrack[] };
  return data.items;
}

export async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const b64 = btoa(binary);
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch {
    return "";
  }
}

export function sanitizeRange(raw: string | null): TimeRange {
  if (raw === "short_term" || raw === "mid_term" || raw === "long_term") return raw;
  return "short_term";
}

export function sanitizeCount(raw: string | null): number {
  const n = parseInt(raw ?? "8", 10);
  return isNaN(n) ? 8 : Math.min(Math.max(n, 1), 10);
}
