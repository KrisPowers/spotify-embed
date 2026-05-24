import { SpotifyApiError } from "./errors.js";
import type {
  FetchImageAsDataUriOptions,
  SanitizeCountOptions,
  SpotifyApiTimeRange,
  SpotifyArtist,
  SpotifyAuthorizationUrlOptions,
  SpotifyClientOptions,
  SpotifyCodeExchangeOptions,
  SpotifyCurrentlyPlaying,
  SpotifyNormalizedTimeRange,
  SpotifyTimeRange,
  SpotifyTokenResponse,
  SpotifyTopItemsOptions,
  SpotifyTrack,
} from "./types.js";

export { SpotifyApiError };

export declare const DEFAULT_SPOTIFY_SCOPES: readonly [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-top-read",
];

export declare function sanitizeRange(raw: string | null | undefined): SpotifyNormalizedTimeRange;
export declare function toSpotifyApiTimeRange(range?: SpotifyTimeRange): SpotifyApiTimeRange;
export declare function sanitizeCount(
  raw: string | number | null | undefined,
  options?: SanitizeCountOptions
): number;
export declare function fetchImageAsDataUri(
  url: string,
  options?: FetchImageAsDataUriOptions
): Promise<string>;

export declare class SpotifyClient {
  constructor(options?: SpotifyClientOptions);

  createAuthorizationUrl(options: SpotifyAuthorizationUrlOptions): string;
  exchangeAuthorizationCode(options: SpotifyCodeExchangeOptions): Promise<SpotifyTokenResponse>;
  getAccessToken(forceRefresh?: boolean): Promise<string>;
  refreshAccessToken(): Promise<string>;
  getNowPlaying(): Promise<SpotifyCurrentlyPlaying | null>;
  getCurrentlyPlaying(): Promise<SpotifyCurrentlyPlaying | null>;
  getTopArtists(options?: SpotifyTopItemsOptions): Promise<SpotifyArtist[]>;
  getTopTracks(options?: SpotifyTopItemsOptions): Promise<SpotifyTrack[]>;
  fetchImageAsDataUri(url: string): Promise<string>;
}
