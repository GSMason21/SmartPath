import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import styles from '../styles/AskHome.module.css';
import {
  trackAskGSQuery,
  trackAskGSCampaignReveal,
  trackAskGSCampaignClick,
  trackAskGSSourceClick,
  trackAskGSDeeperClick,
} from '../lib/analytics';

const SOURCE = 'homepage_embed';

// Relay analytics events to the parent page via postMessage so they fire
// in the gettingsmart.com GA4 context rather than the tools subdomain.
function relayEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  const payload = { event_category: 'tools', ...params };
  if (window.self === window.top && window.gtag) {
    window.gtag('event', eventName, payload);
    return;
  }
  window.parent.postMessage({ type: 'gs-analytics', event: eventName, params: payload }, '*');
}

const SOURCE_TYPES = {
  podcast:    { color: '#c45e2a', bg: '#FDF3EE', label: 'Podcast' },
  whitepaper: { color: '#2a5ec4', bg: '#EEF3FD', label: 'Whitepaper' },
  page:       { color: '#2a5ec4', bg: '#EEF3FD', label: 'Resource' },
  article:    { color: '#1a7a4a', bg: '#EEFAF5', label: 'Article' },
};

const CAMPAIGNS = [
  {
    theme: 'Credentials',
    description: 'What is the future of measuring, capturing, and communicating experience? How do we make transcripts empowering?',
    query: 'What is Getting Smart\'s thinking on the future of credentials and transcripts?',
  },
  {
    theme: 'Coherence',
    description: 'How can systems truly transform toward a common vision?',
    query: 'What has Getting Smart written about system coherence and transformation?',
  },
  {
    theme: 'Abundance',
    description: 'It\'s time to rethink learning as an abundant good rather than a scarce one. All learning counts, everyone is a learner, and everything is an opportunity.',
    query: 'What does Getting Smart say about treating learning as an abundant good?',
  },
  {
    theme: 'What is a Pathway?',
    description: 'A real pathway is personalized, fluid, and helps set up a young person to navigate what\'s next with confidence.',
    query: 'What makes a real pathway? What does Getting Smart think about personalized pathways for young people?',
  },
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
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.sourceCard}
      onClick={() => {
        relayEvent('ask_gs_source_click', { source_title: source.title, source_type: source.type, source: SOURCE });
        trackAskGSSourceClick(source.title, source.type, SOURCE);
      }}
    >
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
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const inputRef                      = useRef(null);

  useEffect(() => { notifyHeight(); }, [result, showCampaigns]);

  async function ask(text, campaignTheme) {
    const query = (text || input).trim();
    if (!query || loading) return;

    relayEvent('ask_gs_query', { query_length: query.length, source: SOURCE });
    trackAskGSQuery(query, SOURCE);
    if (campaignTheme) {
      relayEvent('ask_gs_campaign_click', { theme: campaignTheme, source: SOURCE });
      trackAskGSCampaignClick(campaignTheme, SOURCE);
    }

    setInput('');
    setShowCampaigns(false);
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
    setShowCampaigns(false);
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
                <a
                  href="https://tools.gettingsmart.com/ask"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.deeperLink}
                  onClick={() => {
                    relayEvent('ask_gs_deeper_click', { source: SOURCE });
                    trackAskGSDeeperClick(SOURCE);
                  }}
                >
                  Explore deeper with Ask GS →
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.idle}>
            <p className={styles.eyebrow}>Ask GS</p>
            <h2 className={styles.heading}>What do you want to learn today?</h2>
            {showCampaigns ? (
              <div className={styles.campaigns}>
                {CAMPAIGNS.map(c => (
                  <button key={c.theme} className={styles.campaignCard} onClick={() => ask(c.query, c.theme)} disabled={loading}>
                    <span className={styles.campaignTheme}>{c.theme}</span>
                    <span className={styles.campaignDesc}>{c.description}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.prompt}>
                Feel free to ask us any question or search any topic related to learning, leadership, or community.{' '}
                Not sure what to ask?{' '}
                <button className={styles.thinkingBtn} onClick={() => {
                  relayEvent('ask_gs_campaign_reveal', { source: SOURCE });
                  trackAskGSCampaignReveal(SOURCE);
                  setShowCampaigns(true);
                }}>
                  Check out what we&rsquo;ve been thinking about lately.
                </button>
              </p>
            )}
          </div>
        )}

        <div className={styles.inputArea}>
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Ask anything about learning innovation..."
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
