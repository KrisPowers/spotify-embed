export class SpotifyApiError extends Error {
  constructor(message, options) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = options.status;
    this.url = options.url;
    this.body = options.body ?? "";
  }
}
