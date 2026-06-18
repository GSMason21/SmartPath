import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Home.module.css';

const JOURNEYS = [
  {
    id: 'ask',
    n: '01',
    href: '/ask',
    title: 'Ask',
    desc: 'Chat with an AI assistant grounded in our full library.',
    cta: 'Ask a question',
    icon: (
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#1C7293" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
        <path d="M9.5 9.5l1 1"/>
        <path d="M14 8l.7 1.6L16.3 10l-1.6.7L14 12.3l-.7-1.6L11.7 10l1.6-.7z"/>
      </svg>
    ),
  },
  {
    id: 'discover',
    n: '02',
    href: '/discover',
    title: 'Discover',
    desc: 'Surface a resource from across our library at random.',
    cta: 'Surprise me',
    icon: (
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#2E97A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
  },
  {
    id: 'learn',
    n: '03',
    href: '/smartpath',
    title: 'Learn',
    desc: 'Develop a personalized learning module around your goals.',
    cta: 'Build my module',
    icon: (
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#1A1740" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/>
        <path d="M22 10v6"/>
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Getting Smart Tool Library</title>
        <meta name="description" content="Three ways into everything Getting Smart has built — Ask, Discover, or Learn." />
      </Head>

      <div className={styles.page}>

        {/* ── Nav ──────────────────────────────────────── */}
        <header className={styles.nav}>
          <a href="https://www.gettingsmart.com" target="_blank" rel="noopener noreferrer" className={styles.navLogo}>
            <Image src="/logo-wordmark.png" alt="Getting Smart" width={160} height={45} priority />
          </a>
          <a href="https://www.gettingsmart.com" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
            Visit GettingSmart.com
          </a>
        </header>

        {/* ── Hero ─────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={`${styles.bub} ${styles.b1}`} />
          <div className={`${styles.bub} ${styles.b2}`} />
          <div className={`${styles.bub} ${styles.b3}`} />
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>The Getting Smart Tool Library</p>
            <h1 className={styles.heroH1}>Start where it matters most.</h1>
            <p className={styles.subhead}>
              Every leader&apos;s path looks different. Choose the one that fits the work in front of you — three ways into everything we&apos;ve built.
            </p>
          </div>
        </section>

        {/* ── Journey selector cards ────────────────────── */}
        <section className={styles.selectors}>
          {JOURNEYS.map(j => (
            <Link key={j.id} href={j.href} className={`${styles.card} ${styles[j.id]}`}>
              <div className={styles.bar} />
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <div className={styles.ic}>{j.icon}</div>
                  <div className={styles.num}>{j.n}</div>
                </div>
                <h2 className={styles.cardTitle}>{j.title}</h2>
                <p className={styles.desc}>{j.desc}</p>
                <div className={styles.cta}>{j.cta} <span>&rarr;</span></div>
              </div>
            </Link>
          ))}
        </section>

      </div>
    </>
  );
}
