import Head from 'next/head';
import { useState, useRef } from 'react';
import SearchBox from '../components/SearchBox';
import StatusBar from '../components/StatusBar';
import SummaryCard from '../components/SummaryCard';
import ModuleCard from '../components/ModuleCard';
import SiteHeader from '../components/SiteHeader';
import styles from '../styles/SmartPath.module.css';
import {
  trackSmartPathSearch,
  trackSmartPathSummaryShown,
  trackSmartPathFocusSelected,
  trackSmartPathModuleGenerated,
  trackSmartPathPDF,
} from '../lib/analytics';

function parseStreamPreview(text) {
  const out = {};
  const titleM = text.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (titleM) out.title = titleM[1].replace(/\\"/g, '"');
  const summaryM = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (summaryM) out.summary = summaryM[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');
  const themesM = text.match(/"themes"\s*:\s*\[([\s\S]*?)\]/);
  if (themesM) out.themes = [...themesM[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const timeM = text.match(/"estimatedTime"\s*:\s*"([^"]+)"/);
  if (timeM) out.estimatedTime = timeM[1];
  const seqIdx = text.indexOf('"sequence"');
  if (seqIdx !== -1) {
    out.stepsStarted = (text.slice(seqIdx).match(/"title"\s*:/g) || []).length;
  }
  return out;
}

const CHIPS = [
  'Competency-based learning',
  'AI in education',
  'Place-based learning',
  'Microschool design',
  'Student agency',
  'Work-based learning',
  'Portrait of a graduate',
  'Learning ecosystems',
];

export default function SmartPath() {
  const [status, setStatus]         = useState('');
  const [error, setError]           = useState('');
  const [summary, setSummary]       = useState(null);
  const [module, setModule]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');

  // Store search context between summary and module steps
  const searchStore = useRef({ query: '', context: '', matches: [] });

  async function runSearch(query) {
    setError('');
    setSummary(null);
    setModule(null);
    setLoading(true);
    trackSmartPathSearch(query);

    try {
      // Step 1 — Rewrite query
      setStatus('Understanding your query…');
      const rewriteRes = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const { rewritten, podcastIntent } = await rewriteRes.json();

      // Step 2 — Pinecone search
      setStatus('Searching Getting Smart content library…');
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: rewritten, podcastIntent }),
      });
      const { matches, context } = await searchRes.json();
      searchStore.current = { query, context, matches };

      // Step 3 — Summarize
      setStatus('Summarizing Getting Smart content on this topic…');
      const sumRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary({ ...sumData, query });
        trackSmartPathSummaryShown(query, matches?.length || 0);
      } else {
        // Fallback: skip summary, go straight to module
        await buildModule(query, context, matches);
      }
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    } finally {
      setStatus('');
      setLoading(false);
    }
  }

  async function handleFocusOption(optionTitle, optionDesc) {
    trackSmartPathFocusSelected(searchStore.current.query, optionTitle);
    const { query: originalQuery, context, matches } = searchStore.current;
    const refinedQuery = `${originalQuery} — focus: ${optionTitle}: ${optionDesc}`;
    setSummary(null);
    setLoading(true);

    try {
      // Re-search with refined query (skip rewrite — refined query is already well-formed)
      setStatus('Refining search for your chosen focus…');
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: refinedQuery }),
      });
      const refined = await searchRes.json();

      await buildModule(
        refinedQuery,
        refined.context || context,
        refined.matches || matches
      );
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    } finally {
      setStatus('');
      setLoading(false);
    }
  }

  async function buildModule(query, context, matches) {
    setStatus('Building your learning module…');
    setStreamBuffer('');

    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context, matches }),
    });

    if (!genRes.ok) {
      const err = await genRes.json();
      throw new Error(err.error || 'Generation failed');
    }

    const reader = genRes.body.getReader();
    const decoder = new TextDecoder();
    let lineBuffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));

        if (data.type === 'text') {
          accumulatedText += data.text;
          setStreamBuffer(accumulatedText);
        } else if (data.type === 'done') {
          const start = accumulatedText.indexOf('{');
          const end   = accumulatedText.lastIndexOf('}');
          if (start === -1 || end === -1) throw new Error('No JSON in response');
          const mod = JSON.parse(accumulatedText.slice(start, end + 1));
          setStreamBuffer('');
          setModule(mod);
          trackSmartPathModuleGenerated(
            query,
            mod.estimatedTime,
            mod.frameworkAlignment?.primaryElement
          );
        } else if (data.type === 'error') {
          throw new Error(data.error);
        }
      }
    }
  }

  function reset() {
    setSummary(null);
    setModule(null);
    setError('');
    setStatus('');
    setStreamBuffer('');
    searchStore.current = { query: '', context: '', matches: [] };
  }

  return (
    <>
      <Head>
        <title>Learn — Getting Smart</title>
        <meta name="description" content="Generate professional learning modules grounded in the Getting Smart Learning Innovation Framework." />
      </Head>

      <div className={styles.page}>
        <SiteHeader currentTool="Learn" />

        <main className={styles.main}>
          <div className={styles.pageTitle}>
            <h1 className={styles.title}>Learn</h1>
            <p className={styles.subtitle}>Generate professional learning modules grounded in the Getting Smart Learning Innovation Framework.</p>
            <p className={styles.intro}>Describe what you want to learn — a topic, a challenge, or a question — and Learn will surface the most relevant Getting Smart articles, podcasts, and whitepapers, then build you a structured module with a curated reading sequence, key concepts, and actionable outcomes.</p>
          </div>
          <SearchBox
            onSearch={runSearch}
            chips={CHIPS}
            disabled={loading}
          />

          {status && <StatusBar message={status} />}
          {error  && <div className={styles.errorBar}><p>{error}</p></div>}

          {streamBuffer && !module && (() => {
            const p = parseStreamPreview(streamBuffer);
            return (
              <div className={styles.buildingCard}>
                <div className={styles.buildingHeader}>
                  <span className={styles.buildingDot} />
                  <span>Building your module…</span>
                  {p.estimatedTime && <span className={styles.buildingTime}>{p.estimatedTime}</span>}
                </div>

                {p.title
                  ? <h2 className={styles.buildingTitle}>{p.title}</h2>
                  : <div className={`${styles.shimmer} ${styles.shimmerTitle}`} />}

                {p.themes?.length > 0
                  ? <div className={styles.buildingTags}>{p.themes.map(t => <span key={t} className={styles.buildingTag}>{t}</span>)}</div>
                  : <div className={styles.buildingTagRow}>
                      <div className={`${styles.shimmer} ${styles.shimmerTag}`} />
                      <div className={`${styles.shimmer} ${styles.shimmerTag}`} />
                      <div className={`${styles.shimmer} ${styles.shimmerTag}`} />
                    </div>}

                {p.summary
                  ? <p className={styles.buildingSummary}>{p.summary}</p>
                  : <div className={styles.shimmerBlock}>
                      <div className={`${styles.shimmer} ${styles.shimmerLine}`} />
                      <div className={`${styles.shimmer} ${styles.shimmerLine} ${styles.shimmerShort}`} />
                    </div>}

                {p.stepsStarted > 0 && (
                  <p className={styles.buildingMeta}>Assembling sequence — {p.stepsStarted} step{p.stepsStarted !== 1 ? 's' : ''} in progress…</p>
                )}
              </div>
            );
          })()}

          {summary && !module && (
            <SummaryCard
              summary={summary}
              onSelectOption={handleFocusOption}
              onReset={reset}
            />
          )}

          {module && (
            <ModuleCard
              module={module}
              onReset={reset}
            />
          )}
        </main>
      </div>
    </>
  );
}
