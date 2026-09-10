import { SpotifyApiError } from "./errors.js";

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const DEFAULT_TOKEN_REFRESH_LEEWAY_MS = 30_000;
const DEFAULT_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_IMAGE_CACHE_MAX_ENTRIES = 64;
const DEFAULT_TOP_ITEMS_LIMIT = 8;
const MAX_TOP_ITEMS_LIMIT = 50;

const sharedImageCache = new Map();

export const DEFAULT_SPOTIFY_SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-top-read",
];

function getFetchImplementation(fetchOverride) {
  if (fetchOverride !== undefined) {
    if (typeof fetchOverride !== "function") {
      throw new Error("SpotifyClient requires a Fetch API implementation.");
    }

    return fetchOverride;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("SpotifyClient requires a Fetch API implementation.");
  }

  // Cloudflare Workers rejects the global fetch when it is called with any
  // receiver other than globalThis, so bind it before storing it anywhere.
  return globalThis.fetch.bind(globalThis);
}

function encodeBasicAuth(clientId, clientSecret) {
  const input = `${clientId}:${clientSecret}`;

  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64");
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(input);
  }

  throw new Error("No base64 encoder is available in this runtime.");
}

function toBase64(arrayBuffer) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(arrayBuffer).toString("base64");
  }

  if (typeof globalThis.btoa !== "function") {
    throw new Error("No base64 encoder is available in this runtime.");
  }

  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return globalThis.btoa(binary);
}

async function readResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function clampTopItemsLimit(limit) {
  const normalized = Number.isFinite(limit) ? Math.trunc(limit) : DEFAULT_TOP_ITEMS_LIMIT;
  return Math.min(Math.max(normalized, 1), MAX_TOP_ITEMS_LIMIT);
}

export function sanitizeRange(raw) {
  if (raw === "short_term" || raw === "mid_term" || raw === "long_term") {
    return raw;
  }

  if (raw === "medium_term") {
    return "mid_term";
  }

  return "short_term";
}

export function toSpotifyApiTimeRange(range = "short_term") {
  return range === "mid_term" ? "medium_term" : range;
}

export function sanitizeCount(raw, options = {}) {
  const defaultValue = options.defaultValue ?? DEFAULT_TOP_ITEMS_LIMIT;
  const min = options.min ?? 1;
  const max = options.max ?? 10;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(raw ?? String(defaultValue), 10);

  if (Number.isNaN(parsed)) {
    return defaultValue;
  }

  return Math.min(Math.max(parsed, min), max);
}

export async function fetchImageAsDataUri(url, options = {}) {
  try {
    const cached = sharedImageCache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const fetchImplementation = getFetchImplementation(options.fetch);
    const response = await fetchImplementation(url);

    if (!response.ok) {
      return "";
    }

    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") ?? "image/jpeg";
    const data = `data:${mimeType};base64,${toBase64(arrayBuffer)}`;
    const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_IMAGE_CACHE_TTL_MS;
    const cacheMaxEntries = options.cacheMaxEntries ?? DEFAULT_IMAGE_CACHE_MAX_ENTRIES;

    sharedImageCache.set(url, {
      data,
      expiresAt: Date.now() + cacheTtlMs,
    });

    if (sharedImageCache.size > cacheMaxEntries) {
      const firstKey = sharedImageCache.keys().next().value;
      if (firstKey) {
        sharedImageCache.delete(firstKey);
      }
    }

    return data;
  } catch {
    return "";
  }
}

export class SpotifyClient {
  constructor(options = {}) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.refreshToken = options.refreshToken;
    this.fetchImplementation = getFetchImplementation(options.fetch);
    this.tokenRefreshLeewayMs = options.tokenRefreshLeewayMs ?? DEFAULT_TOKEN_REFRESH_LEEWAY_MS;
    this.imageCacheTtlMs = options.imageCacheTtlMs ?? DEFAULT_IMAGE_CACHE_TTL_MS;
    this.imageCacheMaxEntries = options.imageCacheMaxEntries ?? DEFAULT_IMAGE_CACHE_MAX_ENTRIES;
    this.cachedToken = options.accessToken ? { accessToken: options.accessToken } : undefined;
  }

  createAuthorizationUrl(options) {
    const clientId = this.requireClientId();
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: options.redirectUri,
      scope: (options.scopes ?? DEFAULT_SPOTIFY_SCOPES).join(" "),
      show_dialog: String(options.showDialog ?? true),
    });

    if (options.state) {
      params.set("state", options.state);
    }

    return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
  }

  async exchangeAuthorizationCode(options) {
    const { clientId, clientSecret } = this.requireClientCredentials();
    const url = `${SPOTIFY_ACCOUNTS_URL}/api/token`;
    const response = await this.fetchImplementation(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: options.code,
        redirect_uri: options.redirectUri,
      }),
    });

    const token = await this.parseJsonResponse(response, url, "Token exchange failed");
    this.setCachedToken(token);
    if (token.refresh_token) {
      this.refreshToken = token.refresh_token;
    }

    return token;
  }

  async getAccessToken(forceRefresh = false) {
    if (!forceRefresh && this.cachedToken) {
      const isExpiringSoon =
        this.cachedToken.expiresAt !== undefined &&
        Date.now() + this.tokenRefreshLeewayMs >= this.cachedToken.expiresAt;

      if (!isExpiringSoon) {
        return this.cachedToken.accessToken;
      }
    }

    if (!this.refreshToken) {
      if (this.cachedToken?.accessToken) {
        return this.cachedToken.accessToken;
      }

      throw new Error("SpotifyClient needs either an access token or a refresh token.");
    }

    return this.refreshAccessToken();
  }

  async refreshAccessToken() {
    const { clientId, clientSecret } = this.requireClientCredentials();
    const refreshToken = this.requireRefreshToken();
    const url = `${SPOTIFY_ACCOUNTS_URL}/api/token`;
    const response = await this.fetchImplementation(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodeBasicAuth(clientId, clientSecret)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const token = await this.parseJsonResponse(response, url, "Token refresh failed");
    this.setCachedToken(token);
    if (token.refresh_token) {
      this.refreshToken = token.refresh_token;
    }

    return token.access_token;
  }

  async getNowPlaying() {
    const url = `${SPOTIFY_API_URL}/me/player/currently-playing?additional_types=track`;
    const response = await this.request(url);

    if (response.status === 204 || response.status === 404) {
      return null;
    }

    return this.parseJsonResponse(response, url, "Currently playing request failed");
  }

  async getCurrentlyPlaying() {
    return this.getNowPlaying();
  }

  async getTopArtists(options = {}) {
    const url = new URL(`${SPOTIFY_API_URL}/me/top/artists`);
    url.searchParams.set("time_range", toSpotifyApiTimeRange(options.timeRange ?? "short_term"));
    url.searchParams.set("limit", String(clampTopItemsLimit(options.limit ?? DEFAULT_TOP_ITEMS_LIMIT)));

    const response = await this.request(url.toString());
    const data = await this.parseJsonResponse(response, url.toString(), "Top artists request failed");
    return data.items;
  }

  async getTopTracks(options = {}) {
    const url = new URL(`${SPOTIFY_API_URL}/me/top/tracks`);
    url.searchParams.set("time_range", toSpotifyApiTimeRange(options.timeRange ?? "short_term"));
    url.searchParams.set("limit", String(clampTopItemsLimit(options.limit ?? DEFAULT_TOP_ITEMS_LIMIT)));

    const response = await this.request(url.toString());
    const data = await this.parseJsonResponse(response, url.toString(), "Top tracks request failed");
    return data.items;
  }

  async fetchImageAsDataUri(url) {
    return fetchImageAsDataUri(url, {
      fetch: this.fetchImplementation,
      cacheTtlMs: this.imageCacheTtlMs,
      cacheMaxEntries: this.imageCacheMaxEntries,
    });
  }

  async request(url) {
    const accessToken = await this.getAccessToken();

    return this.fetchImplementation(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async parseJsonResponse(response, url, message) {
    if (!response.ok) {
      throw new SpotifyApiError(message, {
        status: response.status,
        url,
        body: await readResponseText(response),
      });
    }

    return response.json();
  }

  requireClientId() {
    if (!this.clientId) {
      throw new Error("SpotifyClient requires a clientId for this operation.");
    }

    return this.clientId;
  }

  requireClientCredentials() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("SpotifyClient requires both clientId and clientSecret for this operation.");
    }

    return {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    };
  }

  requireRefreshToken() {
    if (!this.refreshToken) {
      throw new Error("SpotifyClient requires a refreshToken for this operation.");
    }

    return this.refreshToken;
  }

  setCachedToken(token) {
    this.cachedToken = {
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    };
  }
}
