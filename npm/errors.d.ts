export declare class SpotifyApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: string;

  constructor(message: string, options: { status: number; url: string; body?: string });
}
