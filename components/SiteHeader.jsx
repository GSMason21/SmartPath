import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/SiteHeader.module.css';

export default function SiteHeader({ currentTool = null }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Left — GS logo linking back to main site */}
        <a
          href="https://www.gettingsmart.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.logoLink}
        >
          <Image
            src="/logo-teal.svg"
            alt="Getting Smart"
            width={160}
            height={45}
            priority
            className={styles.logo}
          />
        </a>

        {/* Center — breadcrumb on tool pages */}
        {currentTool && (
          <div className={styles.breadcrumb}>
            <span className={styles.divider}>/</span>
            <Link href="/" className={styles.toolsLink}>Tools</Link>
            <span className={styles.divider}>/</span>
            <span className={styles.current}>{currentTool}</span>
          </div>
        )}

        {/* Right — return button */}
        <a
          href="https://www.gettingsmart.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.returnBtn}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          GettingSmart.com
        </a>
      </div>
    </header>
  );
}
