import Head from 'next/head';
import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import styles from '../styles/Home.module.css';

const TOOLS = [
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
