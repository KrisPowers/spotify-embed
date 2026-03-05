# 🎵 Spotify Now Playing — GitHub README Badge

A Cloudflare Pages app (Vite + React + TypeScript) that serves a live SVG badge showing your currently playing Spotify track.

```markdown
![Now Playing](https://your-project.pages.dev/now-playing.svg)
```

## Routes

| Route | Description |
|---|---|
| `/` | Setup guide + live badge preview |
| `/now-playing.svg` | Live SVG badge (embed this) |
| `/auth` | One-time Spotify OAuth flow |
| `/callback` | OAuth redirect handler (shows refresh token) |

## Quick start

### 1. Spotify Developer Dashboard
- Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
- Add `https://your-project.pages.dev/callback` as a Redirect URI
- Note your **Client ID** and **Client Secret**

### 2. Cloudflare Pages — deploy
Push this repo to GitHub, connect in Cloudflare Pages:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Functions directory:** `functions` (auto-detected)

### 3. Environment variables
In **Cloudflare Pages → Settings → Variables & Secrets**:

| Variable | Type |
|---|---|
| `SPOTIFY_CLIENT_ID` | Plain text |
| `SPOTIFY_CLIENT_SECRET` | Secret |
| `SPOTIFY_REFRESH_TOKEN` | Secret (get from step 4) |

### 4. Get your refresh token
Visit `https://your-project.pages.dev/auth` → authorize → copy the token shown → paste into `SPOTIFY_REFRESH_TOKEN` → redeploy.

### 5. Embed
```markdown
![Now Playing](https://your-project.pages.dev/now-playing.svg)
```

## Local development

```bash
npm install
npm run dev       # Vite dev server — UI only
npm run build     # Build to dist/
```

For local function testing, use `wrangler pages dev dist` with a `.dev.vars` file:
```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REFRESH_TOKEN=...
```
