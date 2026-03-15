import {
  Env,
  TimeRange,
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
import {
  SocialDataset,
  SocialFormat,
  svgSocialCard,
  svgSocialCardError,
} from "./svg/social-card.js";

import { pageNowPlaying } from "./pages/now-playing.js";
import { pageTopArtists } from "./pages/top-artists.js";
import { pageTopTracks } from "./pages/top-tracks.js";
import { pageCallback } from "./pages/callback.js";
import { pageSocialExport } from "./pages/social-export.js";

const JSON_NO_CACHE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

let lastNowPlayingState: {
  trackKey: string;
  progressMs: number;
  observedAtMs: number;
} | null = null;

function sanitizeDataset(raw: string | null): SocialDataset {
  return raw === "top-tracks" ? "top-tracks" : "top-artists";
}

function sanitizeFormat(raw: string | null): SocialFormat {
  if (raw === "story" || raw === "square" || raw === "portrait") return raw;
  return "story";
}

function clampSocialCount(count: number, format: SocialFormat): number {
  const max = format === "story" ? 7 : 5;
  return Math.min(count, max);
}

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

    if (path === "/social-export") {
      return new Response(pageSocialExport(origin), { headers: HTML_HEADERS });
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
        const nowPlayingFetchStartedMs = Date.now();
        const playing = await getNowPlaying(token);
        const nowPlayingFetchEndedMs = Date.now();

        if (!playing || !playing.is_playing || !playing.item) {
          return new Response(svgNowPlayingIdle(), { headers: NO_CACHE_HEADERS });
        }

        const { item, progress_ms } = playing;
        const artists = item.artists.map((a) => a.name).join(", ");
        const imageUrl = item.album.images[1]?.url ?? item.album.images[0]?.url ?? "";
        const art = imageUrl ? await fetchImageAsBase64(imageUrl) : "";
        const renderMs = Date.now();
        const spotifySampleMs = Math.round((nowPlayingFetchStartedMs + nowPlayingFetchEndedMs) / 2);
        const clientRenderLeadMs = 300;
        const apiProgressMs = Math.min(
          item.duration_ms,
          Math.max(
            0,
            progress_ms ?? 0
          )
        );
        let correctedProgressMs = Math.min(
          item.duration_ms,
          apiProgressMs + (playing.is_playing ? Math.max(0, renderMs - spotifySampleMs + clientRenderLeadMs) : 0)
        );
        const trackKey = item.id ?? `${item.name}:${item.duration_ms}`;

        // Use API progress as truth and only smooth small jitter around expected progression.
        if (lastNowPlayingState && lastNowPlayingState.trackKey === trackKey) {
          const expectedProgressMs = Math.min(
            item.duration_ms,
            lastNowPlayingState.progressMs + Math.max(0, renderMs - lastNowPlayingState.observedAtMs)
          );
          const behindByMs = expectedProgressMs - correctedProgressMs;
          if (behindByMs > 0 && behindByMs <= 2500) {
            correctedProgressMs = expectedProgressMs;
          }
          const aheadByMs = correctedProgressMs - expectedProgressMs;
          if (aheadByMs > 2500) {
            correctedProgressMs = expectedProgressMs;
          }
        }

        lastNowPlayingState = {
          trackKey,
          progressMs: correctedProgressMs,
          observedAtMs: renderMs,
        };

        return new Response(
          svgNowPlaying(item.name, artists, item.album?.name ?? "", art, correctedProgressMs, item.duration_ms),
          { headers: NO_CACHE_HEADERS }
        );
      } catch (err) {
        console.error("now-playing error:", err);
        return new Response(svgNowPlayingIdle(), { headers: NO_CACHE_HEADERS });
      }
    }

    // State + debug endpoints
    if (path === "/now-playing-state.json") {
      try {
        const token = await getAccessToken(env);
        const playing = await getNowPlaying(token);

        if (!playing || !playing.is_playing || !playing.item) {
          return new Response(
            JSON.stringify({ isPlaying: false, trackKey: null }),
            { headers: JSON_NO_CACHE_HEADERS }
          );
        }

        const { item } = playing;
        const trackKey = item.id ?? `${item.name}:${item.duration_ms}`;
        return new Response(
          JSON.stringify({ isPlaying: true, trackKey }),
          { headers: JSON_NO_CACHE_HEADERS }
        );
      } catch {
        return new Response(
          JSON.stringify({ isPlaying: false, trackKey: null }),
          { headers: JSON_NO_CACHE_HEADERS }
        );
      }
    }

    if (path === "/debug") {
      try {
        const token = await getAccessToken(env);
        const res = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=1", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const body = await res.text();
        return new Response(
          JSON.stringify({ status: res.status, headers: Object.fromEntries(res.headers), body: JSON.parse(body) }, null, 2),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }, null, 2), {
          headers: { "Content-Type": "application/json" }, status: 500
        });
      }
    }

    if (path === "/top-artists.svg") {
      const range = sanitizeRange(url.searchParams.get("range"));
      const count = sanitizeCount(url.searchParams.get("count"));

      try {
        const token = await getAccessToken(env);
        // Spotify's API uses "medium_term" not "mid_term" — map it
        const apiRange = range === "mid_term" ? "medium_term" : range;
        const artists = await getTopArtists(token, apiRange as TimeRange, count);

        const withArt = await Promise.all(
          artists.map(async (a) => ({
            name: a.name,
            genres: a.genres ?? [],
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
        const tracks = await getTopTracks(token, apiRange as TimeRange, count);

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

    if (path === "/social-card.svg") {
      const dataset = sanitizeDataset(url.searchParams.get("dataset"));
      const format = sanitizeFormat(url.searchParams.get("format"));
      const range = sanitizeRange(url.searchParams.get("range"));
      const count = clampSocialCount(sanitizeCount(url.searchParams.get("count")), format);

      try {
        const token = await getAccessToken(env);
        const apiRange = range === "mid_term" ? "medium_term" : range;

        if (dataset === "top-artists") {
          const artists = await getTopArtists(token, apiRange as TimeRange, count);
          const items = await Promise.all(
            artists.map(async (a, i) => ({
              rank: i + 1,
              title: a.name,
              subtitle: a.genres?.[0] || "Spotify Artist",
              art: a.images[1]?.url
                ? await fetchImageAsBase64(a.images[1].url)
                : a.images[0]?.url
                ? await fetchImageAsBase64(a.images[0].url)
                : "",
            }))
          );

          return new Response(
            svgSocialCard({
              dataset,
              range,
              format,
              generatedAt: new Date().toISOString(),
              items,
            }),
            { headers: NO_CACHE_HEADERS }
          );
        }

        const tracks = await getTopTracks(token, apiRange as TimeRange, count);
        const items = await Promise.all(
          tracks.map(async (t, i) => ({
            rank: i + 1,
            title: t.name,
            subtitle: t.artists.map((a) => a.name).join(", "),
            art: t.album.images[1]?.url
              ? await fetchImageAsBase64(t.album.images[1].url)
              : t.album.images[0]?.url
              ? await fetchImageAsBase64(t.album.images[0].url)
              : "",
          }))
        );

        return new Response(
          svgSocialCard({
            dataset,
            range,
            format,
            generatedAt: new Date().toISOString(),
            items,
          }),
          { headers: NO_CACHE_HEADERS }
        );
      } catch (err) {
        console.error("social-card error:", err);
        return new Response(svgSocialCardError(format), { headers: NO_CACHE_HEADERS });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
