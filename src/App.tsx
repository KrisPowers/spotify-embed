import { useState, useEffect } from "react";
import styles from "./App.module.css";

const SpotifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5L5.5 10L11 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15,3 21,3 21,9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.codeBlock}>
      {label && <span className={styles.codeLabel}>{label}</span>}
      <pre className={styles.codePre}><code>{code}</code></pre>
      <button className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`} onClick={copy} aria-label="Copy">
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

function EnvVar({ name }: { name: string }) {
  return <span className={styles.envVar}>{name}</span>;
}

function StepNumber({ n }: { n: number }) {
  return <div className={styles.stepNum}>{n}</div>;
}

type PreviewStatus = "loading" | "playing" | "idle" | "error";

interface TrackState {
  name: string;
  artists: string;
  artUrl: string;
  progressMs: number;
  durationMs: number;
  fetchedAt: number; // performance.now() when we got the data
}

function BadgePreview() {
  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [track, setTrack] = useState<TrackState | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  

  // Parse the raw SVG text to extract track data so we can animate locally
  const parseSvg = (svg: string): TrackState | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, "image/svg+xml");

      const texts = Array.from(doc.querySelectorAll("text")).map(t => t.textContent ?? "");
      // SVG structure: [0]=SPOTIFY, [1]=track, [2]=artists, [3]=elapsed, [4]=total
      const elapsed = texts[3] ?? "0:00";
      const total = texts[4] ?? "0:00";

      const parseTime = (t: string) => {
        const [m, s] = t.split(":").map(Number);
        return ((m || 0) * 60 + (s || 0)) * 1000;
      };

      // Extract image href for album art
      const img = doc.querySelector("image");
      const artHref = img?.getAttribute("href") ?? "";

      return {
        name: texts[1] ?? "",
        artists: texts[2] ?? "",
        artUrl: artHref,
        progressMs: parseTime(elapsed),
        durationMs: parseTime(total),
        fetchedAt: performance.now(),
      };
    } catch {
      return null;
    }
  };

  // Fetch fresh data from the API every 5 seconds
  const fetchBadge = async () => {
    try {
      const res = await fetch(`/now-playing.svg?nocache=1&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache" },
      });
      if (!res.ok) { setStatus("error"); return; }
      const svg = await res.text();

      if (svg.includes("Not playing")) {
        setStatus("idle");
        setTrack(null);
        return;
      }

      const parsed = parseSvg(svg);
      if (parsed) {
        setTrack(parsed);
        setDisplayProgress(parsed.progressMs);
        setStatus("playing");
      }
    } catch {
      setStatus("error");
    }
  };

  // Poll API every 5s
  useEffect(() => {
    fetchBadge();
    const interval = setInterval(fetchBadge, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tick the progress bar every second locally — no API calls
  useEffect(() => {
    if (status !== "playing" || !track) return;
    const ticker = setInterval(() => {
      setDisplayProgress(() => {
        const elapsed = performance.now() - track.fetchedAt;
        const newProgress = track.progressMs + elapsed;
        return Math.min(newProgress, track.durationMs);
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [track, status]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const progressPct = track && track.durationMs > 0
    ? Math.min(displayProgress / track.durationMs, 1) * 100
    : 0;

  return (
    <div className={styles.previewWrap}>
      <div className={styles.previewLabel}>
        <div className={styles.liveIndicator}>
          <span className={`${styles.liveDot} ${status === "playing" ? styles.liveDotPlaying : ""}`} />
          <span>
            {status === "loading" ? "FETCHING…" : status === "playing" ? "NOW PLAYING" : status === "error" ? "ERROR" : "LIVE PREVIEW"}
          </span>
        </div>
        <button className={styles.refreshBtn} onClick={fetchBadge}>
          ↻ Refresh
        </button>
      </div>
      <div className={styles.previewCard}>
        {status === "playing" && track ? (
          <div className={styles.liveCard}>
            {/* Album art */}
            {track.artUrl ? (
              <img src={track.artUrl} className={styles.liveArt} alt="Album art" />
            ) : (
              <div className={styles.liveArtEmpty} />
            )}
            {/* Info */}
            <div className={styles.liveInfo}>
              <span className={styles.liveSpotifyLabel}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                SPOTIFY
              </span>
              <div className={styles.liveTrack}>{track.name}</div>
              <div className={styles.liveArtists}>{track.artists}</div>
              <div className={styles.liveProgressWrap}>
                <div className={styles.liveProgressTrack}>
                  <div
                    className={styles.liveProgressFill}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className={styles.liveTimes}>
                  <span>{formatTime(displayProgress)}</span>
                  <span>{formatTime(track.durationMs)}</span>
                </div>
              </div>
            </div>
            {/* Animated bars */}
            <div className={styles.liveViz}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className={styles.liveVizBar} style={{ animationDelay: `${i * 0.13}s` }} />
              ))}
            </div>
          </div>
        ) : status === "idle" ? (
          <div className={styles.idleCard}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#2a2a2a"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            <span>Not playing anything right now</span>
          </div>
        ) : status === "loading" ? (
          <div className={styles.previewSkeleton}>
            <div className={styles.skeletonArt} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonLine} style={{ width: "60%" }} />
              <div className={styles.skeletonLine} style={{ width: "40%" }} />
              <div className={styles.skeletonLine} style={{ width: "80%", height: "4px", marginTop: "12px" }} />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: "13px", color: "var(--text-3)" }}>Could not connect to Spotify</span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-project.pages.dev";
  const embedCode = `![Now Playing](${origin}/now-playing.svg)`;
  const redirectUri = `${origin}/callback`;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <div className={styles.logoDot} />
            <SpotifyIcon />
          </div>
          <div>
            <h1 className={styles.title}>Spotify Now Playing</h1>
            <p className={styles.tagline}>GitHub README badge · Cloudflare Pages</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Badge Preview */}
        <section className={styles.section}>
          <BadgePreview />
        </section>

        {/* Embed snippet */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Embed in your README</h2>
          <CodeBlock code={embedCode} />
        </section>

        <div className={styles.divider} />

        {/* Setup steps */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Setup</h2>

          <div className={styles.steps}>
            {/* Step 1 */}
            <div className={styles.step}>
              <StepNumber n={1} />
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Create a Spotify App</h3>
                <p className={styles.stepDesc}>
                  Go to the{" "}
                  <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener" className={styles.link}>
                    Spotify Developer Dashboard <ExternalIcon />
                  </a>{" "}
                  and create a new app. Under <strong>Redirect URIs</strong>, add:
                </p>
                <CodeBlock code={redirectUri} />
                <p className={styles.stepNote}>
                  Note your <strong>Client ID</strong> and <strong>Client Secret</strong> — you'll need them next.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={styles.step}>
              <StepNumber n={2} />
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Add environment variables</h3>
                <p className={styles.stepDesc}>
                  In <strong>Cloudflare Pages → Settings → Variables &amp; Secrets</strong>, add these three variables. Mark the last two as <strong>Secrets</strong>.
                </p>
                <div className={styles.envTable}>
                  <div className={styles.envRow}>
                    <EnvVar name="SPOTIFY_CLIENT_ID" />
                    <span className={styles.envDesc}>Your app's Client ID</span>
                    <span className={styles.envBadge}>Plain text</span>
                  </div>
                  <div className={styles.envRow}>
                    <EnvVar name="SPOTIFY_CLIENT_SECRET" />
                    <span className={styles.envDesc}>Your app's Client Secret</span>
                    <span className={`${styles.envBadge} ${styles.envBadgeSecret}`}>Secret</span>
                  </div>
                  <div className={styles.envRow}>
                    <EnvVar name="SPOTIFY_REFRESH_TOKEN" />
                    <span className={styles.envDesc}>From step 4 below</span>
                    <span className={`${styles.envBadge} ${styles.envBadgeSecret}`}>Secret</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={styles.step}>
              <StepNumber n={3} />
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Deploy to Cloudflare Pages</h3>
                <p className={styles.stepDesc}>
                  Push this repo to GitHub, then connect it in Cloudflare Pages. Set the build command and output directory:
                </p>
                <div className={styles.buildInfo}>
                  <div className={styles.buildRow}>
                    <span className={styles.buildKey}>Build command</span>
                    <code className={styles.buildVal}>npm run build</code>
                  </div>
                  <div className={styles.buildRow}>
                    <span className={styles.buildKey}>Output directory</span>
                    <code className={styles.buildVal}>dist</code>
                  </div>
                  <div className={styles.buildRow}>
                    <span className={styles.buildKey}>Functions directory</span>
                    <code className={styles.buildVal}>functions</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className={styles.step}>
              <StepNumber n={4} />
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Authorize &amp; get your refresh token</h3>
                <p className={styles.stepDesc}>
                  Visit <code className={styles.inlineCode}>/auth</code> on your deployed site. After authorizing with Spotify, you'll be shown your refresh token. Copy it into <EnvVar name="SPOTIFY_REFRESH_TOKEN" /> and redeploy.
                </p>
                <a href="/auth" className={styles.authBtn}>
                  <SpotifyIcon />
                  Authorize with Spotify
                </a>
              </div>
            </div>

            {/* Step 5 */}
            <div className={styles.step}>
              <StepNumber n={5} />
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Add the badge to your README</h3>
                <p className={styles.stepDesc}>
                  Copy the embed snippet at the top of this page and paste it into your <code className={styles.inlineCode}>README.md</code>.
                </p>
                <CodeBlock code={embedCode} />
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        <p className={styles.footer}>
          Badge refreshes every ~60s via Cloudflare's edge cache. GitHub caches images through its Camo proxy — there may be a short lag on GitHub itself.
        </p>
      </main>
    </div>
  );
}
