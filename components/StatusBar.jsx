import styles from '../styles/StatusBar.module.css';

export default function StatusBar({ message }) {
  if (!message) return null;
  return (
    <div className={styles.bar}>
      <span className={styles.dot} />
      <p>{message}</p>
    </div>
  );
}
