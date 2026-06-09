import { useState } from 'react';
import styles from '../styles/SearchBox.module.css';

export default function SearchBox({ onSearch, chips = [], disabled }) {
  const [value, setValue] = useState('');

  function handleSubmit() {
    const q = value.trim();
    if (!q || disabled) return;
    onSearch(q);
  }

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="text"
          placeholder="What do you want to learn about? e.g. 'How can AI support personalized learning?'"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={disabled}
        />
        <button
          className={styles.btn}
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          Generate
        </button>
      </div>

      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map(chip => (
            <button
              key={chip}
              className={styles.chip}
              onClick={() => { setValue(chip); onSearch(chip); }}
              disabled={disabled}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
