# Spotify Now Playing — GitHub README Badge

A Cloudflare Pages app (Vite + React + TypeScript) that serves a live SVG badge showing your currently playing Spotify track.

```markdown
![Now Playing](https://your-project.pages.dev/now-playing.svg)
```

### Preview (if I am listening to music)
![Now Playing](https://now-playing.krispowers.dev/)

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

---

## Worker deploy (recommended for README embeds)

The Pages Function URL goes through Cloudflare's edge cache and GitHub's Camo proxy, which both cache aggressively. For a reliably live embed in **any** GitHub README, deploy `worker.ts` as a standalone Cloudflare Worker instead — Workers bypass the edge cache entirely on every request.

### Deploy

```bash
# Install wrangler if you haven't
npm install -g wrangler
wrangler login

# Deploy the worker
npx wrangler deploy worker.ts --name spotify-now-playing --compatibility-date 2024-01-01

# Add your secrets
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_CLIENT_SECRET
npx wrangler secret put SPOTIFY_REFRESH_TOKEN
```

Your worker will be live at:
`https://spotify-now-playing.<your-subdomain>.workers.dev`

### Embed

```markdown
![Now Playing](https://spotify-now-playing.<your-subdomain>.workers.dev)
```

This URL works in any GitHub README and updates on every page load.