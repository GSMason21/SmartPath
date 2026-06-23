import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import SiteHeader from '../components/SiteHeader';
import styles from '../styles/Ask.module.css';
import {
  trackAskGSMessage,
  trackAskGSSuggestedQuestion,
} from '../lib/analytics';

const SOURCE_TYPES = {
  podcast:    { color: '#c45e2a', bg: '#FDF3EE', label: 'Podcast' },
  whitepaper: { color: '#2a5ec4', bg: '#EEF3FD', label: 'Whitepaper' },
  page:       { color: '#2a5ec4', bg: '#EEF3FD', label: 'Page' },
  article:    { color: '#1a7a4a', bg: '#EEFAF5', label: 'Article' },
};

const LIF_COLORS = {
  'WHY':       { bg: '#EEEDFE', text: '#3C3489' },
  'WHAT':      { bg: '#F1DDCF', text: '#7A4A2E' },
  'HOW':       { bg: '#E3EFF4', text: '#1c7293' },
  'FOR WHOM':  { bg: '#F5E6D8', text: '#6B3D1A' },
  'WHERE':     { bg: '#E6F1FB', text: '#0C447C' },
  'WHEN':      { bg: '#EEF9F0', text: '#1A5C2E' },
  'WHAT NEXT': { bg: '#FEF0F0', text: '#7A1A1A' },
};

function parseInlineText(text, keyOffset = 0) {
  const parts = [];
  const inlineRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m;
  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={keyOffset + m.index}>{m[1]}</strong>);
    } else {
      parts.push(<em key={keyOffset + m.index}>{m[2]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : [text];
}

function renderText(text) {
  const parts = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parseInlineText(text.slice(lastIndex, match.index), lastIndex).forEach(p => parts.push(p));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.inlineLink}
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parseInlineText(text.slice(lastIndex), lastIndex).forEach(p => parts.push(p));
  }

  return parts.length > 0 ? parts : [text];
}

const SUGGESTED = [
  'What does research say about student agency?',
  'How are schools using AI to support teachers?',
  'What makes a strong portrait of a graduate?',
  'Tell me about competency-based education',
  'What are the best examples of place-based learning?',
  'How do microschools approach personalized learning?',
];

function SourcePill({ source }) {
  const t = SOURCE_TYPES[source.type] || SOURCE_TYPES.article;
  if (!source.url) return null;
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles.sourcePill} style={{ background: t.bg, color: t.color }}>
      <span className={styles.sourceLabel}>{t.label}</span>
      <span className={styles.sourceTitle}>{source.title}</span>
    </a>
  );
}

function LIFAlignment({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className={styles.lifAlignment}>
      <span className={styles.lifAlignmentLabel}>Framework</span>
      <div className={styles.lifTags}>
        {tags.map((tag, i) => {
          const color = LIF_COLORS[tag.element] || { bg: '#E3EFF4', text: '#1c7293' };
          return (
            <div key={i} className={styles.lifTag} style={{ background: color.bg, color: color.text }}>
              <span className={styles.lifTagElement}>{tag.element}</span>
              {tag.subElements && tag.subElements.length > 0 && (
                <span className={styles.lifTagSubs}>{tag.subElements.join(' · ')}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Message({ message }) {
  if (message.role === 'user') {
    return (
      <div className={styles.userMessage}>
        <p>{message.content}</p>
      </div>
    );
  }

  return (
    <div className={styles.assistantMessage}>
      <div className={styles.avatar}>
        {isEmbedded ? (
          <img src="/logo-icon-teal.png" width="20" height="20" alt="Getting Smart" style={{ borderRadius: '50%', display: 'block' }} />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="#1c7293" strokeWidth="1.8" width="16" height="16">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        )}
      </div>
      <div className={styles.assistantContent}>
        {message.sources && message.sources.length > 0 && (
          <div className={styles.sources}>
            {message.sources.map((s, i) => <SourcePill key={i} source={s} />)}
          </div>
        )}
        <div className={styles.messageText}>
          {message.content.split('\n').map((line, i) => (
            <span key={i}>
              {renderText(line)}
              {i < message.content.split('\n').length - 1 && <br />}
            </span>
          ))}
          {message.streaming && <span className={styles.cursor} />}
        </div>
        {!message.streaming && <LIFAlignment tags={message.lifTags} />}
      </div>
    </div>
  );
}

export default function Ask() {
  const [messages, setMessages]              = useState([]);
  const [input, setInput]                    = useState('');
  const [loading, setLoading]                = useState(false);
  const [pageContext, setPageContext]         = useState(null);
  const [isEmbedded, setIsEmbedded]          = useState(false);
  const [contextSuggestions, setContextSuggestions] = useState([]);
  const bottomRef                            = useRef(null);
  const inputRef                             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const embedded = window.self !== window.top;
    setIsEmbedded(embedded);

    function handleMessage(e) {
      if (e.data?.type === 'gs-page-context') {
        setPageContext(e.data);
        fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: e.data.title }),
        })
          .then(r => r.json())
          .then(d => { if (Array.isArray(d.questions)) setContextSuggestions(d.questions); })
          .catch(() => {});
      }
    }
    window.addEventListener('message', handleMessage);

    if (embedded) {
      window.parent.postMessage({ type: 'gs-request-context' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function sendMessage(text) {
    const query = (text || input).trim();
    if (!query || loading) return;

    setInput('');
    setLoading(true);
    trackAskGSMessage(query, isEmbedded);

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);

    const assistantId = Date.now();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      lifTags: [],
      streaming: true,
    }]);

    try {
      const allMessages = [...messages, userMsg];

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, query, pageContext }),
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'sources') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, sources: data.sources } : m
            ));
          } else if (data.type === 'text') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + data.text } : m
            ));
          } else if (data.type === 'done') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, streaming: false } : m
            ));
          } else if (data.type === 'lifTags') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, lifTags: data.tags } : m
            ));
          } else if (data.type === 'error') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: 'Something went wrong. Please try again.', streaming: false } : m
            ));
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: 'Something went wrong. Please try again.', streaming: false } : m
      ));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      <Head>
        <title>Ask GS — Getting Smart</title>
        <meta name="description" content="Ask questions about learning innovation, school design, and education transformation — powered by Getting Smart's content library." />
      </Head>

      <div className={styles.page}>
        {!isEmbedded && <SiteHeader currentTool="Ask GS" />}

        <main className={styles.main}>
          {isEmbedded && pageContext && (
            <div className={styles.contextBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Reading: <a href={pageContext.url} target="_blank" rel="noopener noreferrer">{pageContext.title}</a>
            </div>
          )}
          {isEmpty ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                {isEmbedded ? (
                  <img src="/logo-icon-teal.png" width="48" height="48" alt="Getting Smart" style={{ borderRadius: '50%', display: 'block' }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1c7293" strokeWidth="1.5" width="32" height="32">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                )}
              </div>
              <h1 className={styles.emptyTitle}>Ask GS</h1>
              <p className={styles.emptySubtitle}>
                Ask anything about learning innovation, school design, or education transformation —
                grounded in Getting Smart&apos;s content library.
              </p>
              <div className={styles.suggested}>
                {(isEmbedded && contextSuggestions.length > 0 ? contextSuggestions : SUGGESTED).map(s => (
                  <button key={s} className={styles.suggestedBtn} onClick={() => { trackAskGSSuggestedQuestion(s); sendMessage(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((m, i) => <Message key={m.id || i} message={m} />)}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        <div className={styles.inputArea}>
          <div className={styles.inputWrap}>
            <textarea
              ref={inputRef}
              className={styles.input}
              placeholder="Ask about learning innovation, school design, educator development…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <span className={styles.loadingDot} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              )}
            </button>
          </div>
          <p className={styles.inputHint}>Powered by Getting Smart&apos;s content library · Press Enter to send</p>
        </div>
      </div>
    </>
  );
}
