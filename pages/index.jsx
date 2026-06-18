import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Home.module.css';

const TOOLS = [
  {
    href: '/discover',
    label: 'Discover',
    tagline: 'Stumble upon articles, podcasts, and whitepapers from Getting Smart’s library.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/ask',
    label: 'Ask',
    tagline: 'Get answers about learning innovation grounded in Getting Smart’s content library.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/smartpath',
    label: 'Learn',
    tagline: 'Generate structured professional learning modules grounded in the Learning Innovation Framework.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Getting Smart Tools</title>
        <meta name="description" content="AI-powered tools from Getting Smart for learning innovation." />
      </Head>
      <div className={styles.page}>
        <header className={styles.homeHeader}>
          <a
            href="https://www.gettingsmart.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.logoLink}
          >
            <Image
              src="/logo-teal.svg"
              alt="Getting Smart"
              width={140}
              height={40}
              priority
              className={styles.logoImg}
            />
          </a>
        </header>

        <main className={styles.main}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>AI-Powered Tools</p>
            <h1 className={styles.introTitle}>Tools for Learning Innovation</h1>
          </div>

          <div className={styles.toolGrid}>
            {TOOLS.map(tool => (
              <Link key={tool.href} href={tool.href} className={styles.toolCard}>
                <div className={styles.toolIcon}>{tool.icon}</div>
                <p className={styles.toolLabel}>{tool.label}</p>
                <p className={styles.toolTagline}>{tool.tagline}</p>
                <div className={styles.toolCta}>
                  Get started
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </main>

        <footer className={styles.footer}>
          <a href="https://www.gettingsmart.com" target="_blank" rel="noopener noreferrer">
            GettingSmart.com
          </a>
        </footer>
      </div>
    </>
  );
}
