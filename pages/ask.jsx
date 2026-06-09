import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import SiteHeader from '../components/SiteHeader';
import styles from '../styles/Ask.module.css';

const SOURCE_TYPES = {
  podcast:    { color: '#c45e2a', bg: '#FDF3EE', label: 'Podcast' },
  whitepaper: { color: '#2a5ec4', bg: '#EEF3FD', label: 'Whitepaper' },
  page:       { color: '#2a5ec4', bg: '#EEF3FD', label: 'Page' },
  article:    { color: '#1a7a4a', bg: '#EEFAF5', label: 'Article' },
};

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
        <svg viewBox="0 0 24 24" fill="none" stroke="#1c7293" strokeWidth="1.8" width="16" height="16">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <div className={styles.assistantContent}>
        {message.sources && message.sources.length > 0 && (
          <div className={styles.sources}>
            {message.sources.map((s, i) => <SourcePill key={i} source={s} />)}
          </div>
        )}
        <div className={styles.messageText}>
          {message.content}
          {message.streaming && <span className={styles.cursor} />}
        </div>
      </div>
    </div>
  );
}

export default function Ask() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const query = (text || input).trim();
    if (!query || loading) return;

    setInput('');
    setLoading(true);

    // Add user message
    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);

    // Add placeholder assistant message
    const assistantId = Date.now();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      sources: [],
      streaming: true,
    }]);

    try {
      const allMessages = [...messages, userMsg];

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, query }),
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
        <SiteHeader currentTool="Ask GS" />

        <main className={styles.main}>
          {isEmpty ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1c7293" strokeWidth="1.5" width="32" height="32">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h1 className={styles.emptyTitle}>Ask GS</h1>
              <p className={styles.emptySubtitle}>
                Ask anything about learning innovation, school design, or education transformation —
                grounded in Getting Smart&apos;s content library.
              </p>
              <div className={styles.suggested}>
                {SUGGESTED.map(s => (
                  <button key={s} className={styles.suggestedBtn} onClick={() => sendMessage(s)}>
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
