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

function BadgePreview() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<PreviewStatus>("loading");

  const fetchBadge = async () => {
    setStatus("loading");
    try {
      // ?nocache=1 tells the CF function to respond with no-store headers.
      // We also add a timestamp so the browser never serves from its own cache.
      const res = await fetch(`/now-playing.svg?nocache=1&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache" },
      });
      if (!res.ok) { setStatus("error"); return; }
      const svg = await res.text();
      // Revoke previous blob to avoid memory leaks
      setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setStatus(svg.includes("Not playing") ? "idle" : "playing");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchBadge();
    const interval = setInterval(fetchBadge, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup blob on unmount
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

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
        {blobUrl ? (
          <img
            src={blobUrl}
            alt="Now Playing badge preview"
            style={{ maxWidth: "100%", borderRadius: "4px", display: "block" }}
          />
        ) : (
          <div className={styles.previewSkeleton}>
            <div className={styles.skeletonArt} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonLine} style={{ width: "60%" }} />
              <div className={styles.skeletonLine} style={{ width: "40%" }} />
              <div className={styles.skeletonLine} style={{ width: "80%", height: "4px", marginTop: "12px" }} />
            </div>
          </div>
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
