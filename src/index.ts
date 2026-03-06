import {
  Env,
  getAccessToken,
  getNowPlaying,
  getTopArtists,
  getTopTracks,
  fetchImageAsBase64,
  sanitizeRange,
  sanitizeCount,
} from "./spotify.js";

import { NO_CACHE_HEADERS, HTML_HEADERS } from "./utils.js";

import { svgNowPlaying, svgNowPlayingIdle } from "./svg/now-playing.js";
import { svgTopArtists, svgTopArtistsError } from "./svg/top-artists.js";
import { svgTopTracks, svgTopTracksError } from "./svg/top-tracks.js";

import { pageNowPlaying } from "./pages/now-playing.js";
import { pageTopArtists } from "./pages/top-artists.js";
import { pageTopTracks } from "./pages/top-tracks.js";
import { pageCallback } from "./pages/callback.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const origin = url.origin;

    // ── Setup UI pages ───────────────────────────────────────────────
    if (path === "/" || path === "/now-playing") {
      return new Response(pageNowPlaying(origin), { headers: HTML_HEADERS });
    }

    if (path === "/top-artists") {
      return new Response(pageTopArtists(origin), { headers: HTML_HEADERS });
    }

    if (path === "/top-tracks") {
      return new Response(pageTopTracks(origin), { headers: HTML_HEADERS });
    }

    // ── OAuth flow ───────────────────────────────────────────────────
    if (path === "/auth") {
      const scopes = [
        "user-read-currently-playing",
        "user-read-playback-state",
        "user-top-read",
      ].join(" ");

      const params = new URLSearchParams({
        client_id: env.SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: `${origin}/callback`,
        scope: scopes,
        show_dialog: "true",
      });

      return Response.redirect(
        `https://accounts.spotify.com/authorize?${params}`,
        302
      );
    }

    if (path === "/callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error || !code) {
        return new Response(`Authorization error: ${error ?? "missing code"}`, { status: 400 });
      }

      const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: `${origin}/callback`,
        }),
      });

      if (!tokenRes.ok) {
        return new Response(`Token exchange failed: ${await tokenRes.text()}`, { status: 500 });
      }

      const data = await tokenRes.json() as { refresh_token: string };
      return new Response(pageCallback(data.refresh_token), { headers: HTML_HEADERS });
    }

    // ── SVG badge endpoints ──────────────────────────────────────────
    if (path === "/now-playing.svg" || path === "/now-playing-badge") {
      try {
        const token = await getAccessToken(env);
        const playing = await getNowPlaying(token);

        if (!playing || !playing.is_playing || !playing.item) {
          return new Response(svgNowPlayingIdle(), { headers: NO_CACHE_HEADERS });
        }

        const { item, progress_ms } = playing;
        const artists = item.artists.map((a) => a.name).join(", ");
        const imageUrl = item.album.images[1]?.url ?? item.album.images[0]?.url ?? "";
        const art = imageUrl ? await fetchImageAsBase64(imageUrl) : "";

        return new Response(
          svgNowPlaying(item.name, artists, art, progress_ms ?? 0, item.duration_ms),
          { headers: NO_CACHE_HEADERS }
        );
      } catch (err) {
        console.error("now-playing error:", err);
        return new Response(svgNowPlayingIdle(), { headers: NO_CACHE_HEADERS });
      }
    }

    if (path === "/top-artists.svg") {
      const range = sanitizeRange(url.searchParams.get("range"));
      const count = sanitizeCount(url.searchParams.get("count"));

      try {
        const token = await getAccessToken(env);
        // Spotify's API uses "medium_term" not "mid_term" — map it
        const apiRange = range === "mid_term" ? "medium_term" : range;
        const artists = await getTopArtists(token, apiRange as Parameters<typeof getTopArtists>[1], count);

        const withArt = await Promise.all(
          artists.map(async (a) => ({
            name: a.name,
            genres: a.genres,
            art: a.images[1]?.url
              ? await fetchImageAsBase64(a.images[1].url)
              : a.images[0]?.url
              ? await fetchImageAsBase64(a.images[0].url)
              : "",
          }))
        );

        return new Response(svgTopArtists(withArt, range), { headers: NO_CACHE_HEADERS });
      } catch (err) {
        console.error("top-artists error:", err);
        return new Response(svgTopArtistsError(), { headers: NO_CACHE_HEADERS });
      }
    }

    if (path === "/top-tracks.svg") {
      const range = sanitizeRange(url.searchParams.get("range"));
      const count = sanitizeCount(url.searchParams.get("count"));

      try {
        const token = await getAccessToken(env);
        const apiRange = range === "mid_term" ? "medium_term" : range;
        const tracks = await getTopTracks(token, apiRange as Parameters<typeof getTopTracks>[1], count);

        const withArt = await Promise.all(
          tracks.map(async (t) => ({
            name: t.name,
            artists: t.artists.map((a) => a.name).join(", "),
            art: t.album.images[1]?.url
              ? await fetchImageAsBase64(t.album.images[1].url)
              : t.album.images[0]?.url
              ? await fetchImageAsBase64(t.album.images[0].url)
              : "",
          }))
        );

        return new Response(svgTopTracks(withArt, range), { headers: NO_CACHE_HEADERS });
      } catch (err) {
        console.error("top-tracks error:", err);
        return new Response(svgTopTracksError(), { headers: NO_CACHE_HEADERS });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
