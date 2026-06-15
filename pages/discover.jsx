import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import SiteHeader from '../components/SiteHeader';
import styles from '../styles/Discover.module.css';

const LIF_COLORS = {
  'WHY':       { bg: '#E3EFF4', color: '#145670' },
  'WHAT':      { bg: '#EEEDFE', color: '#3C3489' },
  'HOW':       { bg: '#E6F1FB', color: '#0C447C' },
  'FOR WHOM':  { bg: '#F1DDCF', color: '#7A4A2E' },
  'WHERE':     { bg: '#F5E6D8', color: '#6B3D1A' },
  'WHEN':      { bg: '#EFEFEC', color: '#3A3935' },
  'WHAT NEXT': { bg: '#D4EAE0', color: '#145670' },
};

const TYPE_LABELS = { podcast: 'Podcast', whitepaper: 'Whitepaper', article: 'Article', page: 'Page' };

export default function Discover() {
  const [resource, setResource]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fading, setFading]       = useState(false);
  const [error, setError]         = useState(false);
  const [seen, setSeen]           = useState([]);
  const [count, setCount]         = useState(0);
  const seenRef                   = useRef([]);

  const fetchResource = useCallback(async (seenIds) => {
    setError(false);
    setLoading(true);
    try {
      const res  = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seen: seenIds }),
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setResource(data);
      setCount(c => c + 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResource([]); }, [fetchResource]);

  const handleRate = async () => {
    if (!resource || loading || fading) return;
    const currentId = resource.id;

    setFading(true);
    await new Promise(r => setTimeout(r, 240));

    setFading(false);
    setLoading(true);
    setResource(null);

    const newSeen = [...seenRef.current, currentId].slice(-60);
    seenRef.current = newSeen;
    setSeen(newSeen);

    await fetchResource(newSeen);
  };

  const lifStyle = resource ? (LIF_COLORS[resource.lifElement] || LIF_COLORS['HOW']) : null;
  const typeLabel = resource ? (TYPE_LABELS[resource.type] || 'Resource') : '';
  const isVisible = !loading && !fading && resource;

  return (
    <>
      <Head>
        <title>Discover — Getting Smart Tools</title>
        <meta name="description" content="Stumble upon resources from Getting Smart's content library, tagged by the Learning Innovation Framework." />
      </Head>
      <div className={styles.page}>
        <SiteHeader currentTool="Discover" />

        <main className={styles.main}>
          <div className={styles.intro}>
            <h1 className={styles.title}>Discover</h1>
            <p className={styles.subtitle}>Explore Getting Smart&apos;s library, one resource at a time.</p>
          </div>

          <div className={`${styles.cardWrap} ${fading ? styles.out : ''} ${isVisible ? styles.in : ''}`}>
            {loading ? (
              <div className={styles.skeleton}>
                <div className={styles.skRow}>
                  <div className={`${styles.skBlock} ${styles.skBadge}`} />
                  <div className={`${styles.skBlock} ${styles.skDate}`} />
                </div>
                <div className={`${styles.skBlock} ${styles.skLif}`} />
                <div className={`${styles.skBlock} ${styles.skTitle}`} />
                <div className={`${styles.skBlock} ${styles.skLine}`} />
                <div className={`${styles.skBlock} ${styles.skLine}`} style={{ width: '75%' }} />
                <div className={`${styles.skBlock} ${styles.skBtn}`} />
              </div>
            ) : error ? (
              <div className={styles.errorCard}>
                <p>Something went wrong loading a resource.</p>
                <button className={styles.retryBtn} onClick={() => fetchResource(seenRef.current)}>
                  Try again
                </button>
              </div>
            ) : resource ? (
              <div className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.typeBadge}>{typeLabel}</span>
                  {resource.date && (
                    <span className={styles.date}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {resource.date.slice(0, 4)}
                    </span>
                  )}
                </div>

                <div
                  className={styles.lifBadge}
                  style={{ background: lifStyle?.bg, color: lifStyle?.color }}
                >
                  {resource.lifElement}
                </div>

                <h2 className={styles.cardTitle}>{resource.title}</h2>
                <p className={styles.description}>{resource.description}</p>

                <div className={styles.cardFooter}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.readBtn}
                    style={{ background: lifStyle?.color }}
                  >
                    {resource.type === 'podcast' ? 'Listen' : 'Read'}&nbsp;&rarr;
                  </a>
                  <button
                    className={styles.nextBtn}
                    onClick={handleRate}
                    disabled={loading || fading}
                    title="Next resource"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {!loading && !error && (
            <div className={styles.ratingRow}>
              <button
                className={`${styles.rateBtn} ${styles.up}`}
                onClick={handleRate}
                disabled={loading || fading}
                title="Useful — show me more like this"
              >
                <ThumbUp />
                <span>Useful</span>
              </button>
              <button
                className={`${styles.rateBtn} ${styles.mid}`}
                onClick={handleRate}
                disabled={loading || fading}
                title="Interesting — keep going"
              >
                <ThumbMid />
                <span>Interesting</span>
              </button>
              <button
                className={`${styles.rateBtn} ${styles.down}`}
                onClick={handleRate}
                disabled={loading || fading}
                title="Not for me — next"
              >
                <ThumbDown />
                <span>Not for me</span>
              </button>
            </div>
          )}

          {count > 1 && (
            <p className={styles.counter}>{count} resources explored this session</p>
          )}
        </main>
      </div>
    </>
  );
}

function ThumbUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  );
}

function ThumbMid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" style={{ transform: 'rotate(90deg)' }}>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  );
}

function ThumbDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  );
}
