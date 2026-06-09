import styles from '../styles/SummaryCard.module.css';

export default function SummaryCard({ summary, onSelectOption, onReset }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Getting Smart on: {summary.query}</h2>

      <div className={styles.paragraphs}>
        {summary.summary.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <p className={styles.prompt}>Which angle would you like to explore?</p>

      <div className={styles.options}>
        {summary.options.map((option, i) => (
          <button
            key={i}
            className={styles.optionBtn}
            onClick={() => onSelectOption(option.title, option.description)}
          >
            <span className={styles.optionNumber}>{i + 1}</span>
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>{option.title}</span>
              <span className={styles.optionDesc}>{option.description}</span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className={styles.optionArrow}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        ))}
      </div>

      <button className={styles.back} onClick={onReset}>← Start over</button>
    </div>
  );
}
