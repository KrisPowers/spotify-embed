# `spotify-embed`

Typed Node.js wrapper for the Spotify Web API primitives used by this repo's embed worker.

## What it gives you

- A `SpotifyClient` class for Node 18+.
- Built-in refresh token handling.
- JS-friendly ESM output plus TypeScript declarations.
- Helpers for auth URLs, code exchange, time range normalization, and image-to-data-URI fetching.

## Install

```bash
npm install ./npm
```

## JavaScript

```js
import { SpotifyClient } from "spotify-embed";

const spotify = new SpotifyClient({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

const nowPlaying = await spotify.getNowPlaying();
const topTracks = await spotify.getTopTracks({ timeRange: "mid_term", limit: 5 });

console.log(nowPlaying?.item?.name);
console.log(topTracks.map((track) => track.name));
```

## TypeScript

```ts
import { SpotifyClient, type SpotifyTrack } from "spotify-embed";

const spotify = new SpotifyClient({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

const topArtists = await spotify.getTopArtists({
  timeRange: "short_term",
  limit: 8,
});

const topTracks: SpotifyTrack[] = await spotify.getTopTracks({
  timeRange: "long_term",
  limit: 10,
});
```

## OAuth helpers

```ts
import { DEFAULT_SPOTIFY_SCOPES, SpotifyClient } from "spotify-embed";

const spotify = new SpotifyClient({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const authUrl = spotify.createAuthorizationUrl({
  redirectUri: "http://localhost:3000/callback",
  scopes: DEFAULT_SPOTIFY_SCOPES,
});

const token = await spotify.exchangeAuthorizationCode({
  code: "spotify-callback-code",
  redirectUri: "http://localhost:3000/callback",
});
```

## Verify package

The package ships checked-in JavaScript runtime files plus `.d.ts` declarations, so there is no TypeScript compile step required to publish it.

```bash
npm run build
```
