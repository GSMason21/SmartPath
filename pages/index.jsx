import Head from 'next/head';
import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import styles from '../styles/Home.module.css';

const TOOLS = [
  {
    href: '/moves',
    title: 'School Design Moves',
    subtitle: 'Learning Innovation Framework',
    description: 'Explore actionable school design moves organized by the 7 elements of the Learning Innovation Framework, with curated Getting Smart resources for each.',
    color: '#1A5C2E',
    bg: '#EEF9F0',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    href: '/smartpath',
    title: 'SmartPath',
    subtitle: 'Learning Module Generator',
    description: 'Generate structured professional learning modules grounded in the Getting Smart Learning Innovation Framework.',
    color: '#1c7293',
    bg: '#E3EFF4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: '/ask',
    title: 'Ask GS',
    subtitle: 'Research Assistant',
    description: 'Ask questions about learning innovation, school design, and education transformation — grounded in Getting Smart\'s content library.',
    color: '#3C3489',
    bg: '#EEEDFE',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/discover',
    title: 'Discover',
    subtitle: 'Resource Discovery',
    description: 'Stumble upon articles, podcasts, and whitepapers from Getting Smart\'s library — each tagged to the Learning Innovation Framework.',
    color: '#7A4A2E',
    bg: '#F1DDCF',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
        <polyline points="16 3 21 3 21 8"/>
        <line x1="4" y1="20" x2="21" y2="3"/>
        <polyline points="21 16 21 21 16 21"/>
        <line x1="15" y1="15" x2="21" y2="21"/>
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Getting Smart Tools</title>
        <meta name="description" content="Interactive tools from Getting Smart for learning innovation." />
      </Head>
      <div className={styles.page}>
        <SiteHeader />

        <main className={styles.main}>
          <div className={styles.intro}>
            <h2 className={styles.introTitle}>Tools for Learning Innovation</h2>
            <p className={styles.introText}>
              Explore Getting Smart&apos;s suite of AI-powered tools designed to help educators,
              leaders, and innovators navigate the future of learning.
            </p>
          </div>

          <div className={styles.toolGrid}>
            {TOOLS.map(tool => (
              <Link key={tool.href} href={tool.href} className={styles.toolCard}>
                <div className={styles.toolIcon} style={{ background: tool.bg, color: tool.color }}>
                  {tool.icon}
                </div>
                <div className={styles.toolText}>
                  <h3 className={styles.toolTitle}>{tool.title}</h3>
                  <p className={styles.toolSubtitle}>{tool.subtitle}</p>
                  <p className={styles.toolDesc}>{tool.description}</p>
                </div>
                <div className={styles.toolArrow} style={{ color: tool.color }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
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
