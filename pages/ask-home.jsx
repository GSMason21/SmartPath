import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import styles from '../styles/AskHome.module.css';

const SOURCE_TYPES = {
  podcast:    { color: '#c45e2a', bg: '#FDF3EE', label: 'Podcast' },
  whitepaper: { color: '#2a5ec4', bg: '#EEF3FD', label: 'Whitepaper' },
  page:       { color: '#2a5ec4', bg: '#EEF3FD', label: 'Resource' },
  article:    { color: '#1a7a4a', bg: '#EEFAF5', label: 'Article' },
};

const SUGGESTED = [
  'What have you published on AI in schools?',
  'Find me resources on project-based learning',
  'What should I read about microschools?',
  'Show me podcasts about student agency',
];

function renderText(text) {
  const parts = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function SourceCard({ source }) {
  const t = SOURCE_TYPES[source.type] || SOURCE_TYPES.article;
  if (!source.url) return null;
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles.sourceCard}>
      <span className={styles.sourceType} style={{ background: t.bg, color: t.color }}>{t.label}</span>
      <span className={styles.sourceTitle}>{source.title}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={styles.sourceArrow} aria-hidden="true">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>
  );
}

function notifyHeight() {
  if (window.self === window.top) return;
  const h = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: 'gs-ask-resize', height: h }, '*');
}

export default function AskHome() {
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null); // { text, sources, streaming }
  const inputRef              = useRef(null);

  useEffect(() => { notifyHeight(); }, [result]);

  async function ask(text) {
    const query = (text || input).trim();
    if (!query || loading) return;

    setInput('');
    setLoading(true);
    setResult({ text: '', sources: [], streaming: true });

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          query,
          isEmbedded: true,
          isNavigate: true,
        }),
      });

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'sources') {
            setResult(prev => ({ ...prev, sources: data.sources }));
          } else if (data.type === 'text') {
            setResult(prev => ({ ...prev, text: (prev?.text || '') + data.text }));
          } else if (data.type === 'done') {
            setResult(prev => ({ ...prev, streaming: false }));
          } else if (data.type === 'error') {
            setResult({ text: 'Something went wrong. Please try again.', sources: [], streaming: false });
          }
        }
      }
    } catch {
      setResult({ text: 'Something went wrong. Please try again.', sources: [], streaming: false });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); ask(); }
  }

  function reset() {
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <>
      <Head>
        <title>Ask GS</title>
      </Head>

      <div className={styles.widget}>
        {result ? (
          <div className={styles.result}>
            <div className={styles.responseText}>
              {result.text.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {renderText(line)}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
              {result.streaming && <span className={styles.cursor} />}
            </div>

            {result.sources.length > 0 && (
              <div className={styles.sources}>
                {result.sources.slice(0, 4).map((s, i) => <SourceCard key={i} source={s} />)}
              </div>
            )}

            {!result.streaming && (
              <div className={styles.resultActions}>
                <button className={styles.askAgain} onClick={reset}>Ask another question</button>
                <a href="https://tools.gettingsmart.com/ask" target="_blank" rel="noopener noreferrer" className={styles.deeperLink}>
                  Explore deeper with Ask GS →
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.idle}>
            <p className={styles.eyebrow}>Ask GS</p>
            <h2 className={styles.heading}>What do you want to learn today?</h2>
            <div className={styles.suggested}>
              {SUGGESTED.map(s => (
                <button key={s} className={styles.suggestedBtn} onClick={() => ask(s)} disabled={loading}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.inputArea}>
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="e.g. What have you written about competency-based learning?"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={() => ask()} disabled={loading || !input.trim()} aria-label="Ask">
              {loading
                ? <span className={styles.loadingDot} />
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
