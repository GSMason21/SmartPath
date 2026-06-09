import Head from 'next/head';
import { useState, useRef } from 'react';
import SearchBox from '../components/SearchBox';
import StatusBar from '../components/StatusBar';
import SummaryCard from '../components/SummaryCard';
import ModuleCard from '../components/ModuleCard';
import styles from '../styles/SmartPath.module.css';

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
  const [status, setStatus]       = useState('');
  const [error, setError]         = useState('');
  const [summary, setSummary]     = useState(null);
  const [module, setModule]       = useState(null);
  const [loading, setLoading]     = useState(false);

  // Store search context between summary and module steps
  const searchStore = useRef({ query: '', context: '', matches: [] });

  async function runSearch(query) {
    setError('');
    setSummary(null);
    setModule(null);
    setLoading(true);

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
    const { query: originalQuery, context, matches } = searchStore.current;
    const refinedQuery = `${originalQuery} — focus: ${optionTitle}: ${optionDesc}`;
    setSummary(null);
    setLoading(true);

    try {
      // Re-search with refined query
      setStatus('Refining search for your chosen focus…');
      const rewriteRes = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: refinedQuery }),
      });
      const { rewritten, podcastIntent } = await rewriteRes.json();

      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: rewritten, podcastIntent }),
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
    const genRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context, matches }),
    });
    if (!genRes.ok) {
      const err = await genRes.json();
      throw new Error(err.error || 'Generation failed');
    }
    const { module } = await genRes.json();
    setModule(module);
  }

  function reset() {
    setSummary(null);
    setModule(null);
    setError('');
    setStatus('');
    searchStore.current = { query: '', context: '', matches: [] };
  }

  return (
    <>
      <Head>
        <title>SmartPath — Getting Smart</title>
        <meta name="description" content="Generate professional learning modules grounded in the Getting Smart Learning Innovation Framework." />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#1c7293" strokeWidth="1.8" width="22" height="22">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>SmartPath</h1>
            <p className={styles.subtitle}>Learning Module Generator · Getting Smart</p>
          </div>
        </header>

        <main className={styles.main}>
          <SearchBox
            onSearch={runSearch}
            chips={CHIPS}
            disabled={loading}
          />

          {status && <StatusBar message={status} />}
          {error  && <div className={styles.errorBar}><p>{error}</p></div>}

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
