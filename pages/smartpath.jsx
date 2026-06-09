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
    trackSmartPathModuleGenerated(
      query,
      module.estimatedTime,
      module.frameworkAlignment?.primaryElement
    );
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
        <SiteHeader currentTool="SmartPath" />

        <main className={styles.main}>
          <div className={styles.pageTitle}>
            <h1 className={styles.title}>SmartPath</h1>
            <p className={styles.subtitle}>Generate professional learning modules grounded in the Getting Smart Learning Innovation Framework.</p>
            <p className={styles.intro}>SmartPath is a professional learning tool powered by Getting Smart&apos;s content library and the Learning Innovation Framework. Describe what you want to learn — a topic, a challenge, or a question — and SmartPath will surface the most relevant Getting Smart articles, podcasts, and whitepapers, then build you a structured learning module complete with a curated reading sequence, key concepts, and actionable outcomes. Whether you&apos;re exploring a new approach to school design or deepening your practice in a specific area, SmartPath turns Getting Smart&apos;s decade of thought leadership into a personalized learning path in seconds.</p>
          </div>
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
