import {
  SpotifyApiError,
  SpotifyClient,
  fetchImageAsDataUri,
  sanitizeCount as sanitizeSharedCount,
  sanitizeRange as sanitizeSharedRange,
  type SpotifyArtist,
  type SpotifyCurrentlyPlaying,
  type SpotifyTimeRange,
  type SpotifyTrack,
} from "../npm/index.js";

export interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REFRESH_TOKEN: string;
}

export type TimeRange = SpotifyTimeRange;
export type { SpotifyArtist, SpotifyCurrentlyPlaying, SpotifyTrack };

export function createSpotifyClient(env: Env): SpotifyClient {
  return new SpotifyClient({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
    refreshToken: env.SPOTIFY_REFRESH_TOKEN,
  });
}

export async function getAccessToken(env: Env): Promise<string> {
  return createSpotifyClient(env).getAccessToken();
}

export async function getNowPlaying(token: string): Promise<SpotifyCurrentlyPlaying | null> {
  return new SpotifyClient({ accessToken: token }).getNowPlaying();
}

export async function getTopArtists(
  token: string,
  range: TimeRange = "medium_term",
  limit = 8
): Promise<SpotifyArtist[]> {
  return new SpotifyClient({ accessToken: token }).getTopArtists({
    timeRange: range,
    limit,
  });
}

export async function getTopTracks(
  token: string,
  range: TimeRange = "medium_term",
  limit = 8
): Promise<SpotifyTrack[]> {
  return new SpotifyClient({ accessToken: token }).getTopTracks({
    timeRange: range,
    limit,
  });
}

export async function fetchImageAsBase64(url: string): Promise<string> {
  return fetchImageAsDataUri(url);
}

export function sanitizeRange(raw: string | null): TimeRange {
  return sanitizeSharedRange(raw);
}

export function sanitizeCount(raw: string | null): number {
  return sanitizeSharedCount(raw);
}

// Spotify refresh tokens now expire, so a dead token shows up either as a
// rejected refresh at accounts.spotify.com or as a 401 from the Web API.
export function isTokenExpiredError(err: unknown): boolean {
  if (!(err instanceof SpotifyApiError)) return false;
  if (err.status === 401) return true;
  return err.url.startsWith("https://accounts.spotify.com/api/token") && err.status >= 400 && err.status < 500;
}
