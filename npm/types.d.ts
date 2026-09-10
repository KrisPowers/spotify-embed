export type SpotifyTimeRange = "short_term" | "mid_term" | "medium_term" | "long_term";
export type SpotifyNormalizedTimeRange = "short_term" | "mid_term" | "long_term";
export type SpotifyApiTimeRange = "short_term" | "medium_term" | "long_term";

export interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

export interface SpotifyArtistSummary {
  name: string;
}

export interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyCurrentlyPlayingTrack {
  id?: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtistSummary[];
  album: SpotifyAlbum;
  external_urls?: SpotifyExternalUrls;
}

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  timestamp?: number;
  progress_ms: number | null;
  item: SpotifyCurrentlyPlayingTrack | null;
}

export interface SpotifyArtist {
  id?: string;
  name: string;
  genres?: string[];
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyTrack {
  id?: string;
  name: string;
  artists: SpotifyArtistSummary[];
  album: SpotifyAlbum;
  external_urls: SpotifyExternalUrls;
  duration_ms?: number;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyAuthorizationUrlOptions {
  redirectUri: string;
  scopes?: readonly string[];
  state?: string;
  showDialog?: boolean;
}

export interface SpotifyCodeExchangeOptions {
  code: string;
  redirectUri: string;
}

export interface SpotifyTopItemsOptions {
  timeRange?: SpotifyTimeRange;
  limit?: number;
}

export type SpotifyFetch = typeof globalThis.fetch;

export interface SpotifyClientOptions {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  fetch?: SpotifyFetch;
  tokenRefreshLeewayMs?: number;
  imageCacheTtlMs?: number;
  imageCacheMaxEntries?: number;
}

export interface FetchImageAsDataUriOptions {
  fetch?: SpotifyFetch;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
}

export interface SanitizeCountOptions {
  defaultValue?: number;
  min?: number;
  max?: number;
}
