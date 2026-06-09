import styles from '../styles/ModuleCard.module.css';

const STEP_COLORS = [
  { bg: '#EEEDFE', text: '#3C3489', border: '#C9C7F5' },
  { bg: '#F1DDCF', text: '#7A4A2E', border: '#E8C4A8' },
  { bg: '#E3EFF4', text: '#1c7293', border: '#B6E5EC' },
  { bg: '#F5E6D8', text: '#6B3D1A', border: '#E8C4A8' },
  { bg: '#E6F1FB', text: '#0C447C', border: '#B6D4F0' },
];

const LIF_COLORS = {
  'WHY':       { bg: '#EEEDFE', text: '#3C3489' },
  'WHAT':      { bg: '#F1DDCF', text: '#7A4A2E' },
  'HOW':       { bg: '#E3EFF4', text: '#1c7293' },
  'FOR WHOM':  { bg: '#F5E6D8', text: '#6B3D1A' },
  'WHERE':     { bg: '#E6F1FB', text: '#0C447C' },
  'WHEN':      { bg: '#EEF9F0', text: '#1A5C2E' },
  'WHAT NEXT': { bg: '#FEF0F0', text: '#7A1A1A' },
};

const SOURCE_TYPES = {
  podcast:    { bg: '#FDF3EE', color: '#c45e2a', label: 'Podcast',    icon: 'headphones' },
  whitepaper: { bg: '#EEF3FD', color: '#2a5ec4', label: 'Whitepaper', icon: 'file-text' },
  page:       { bg: '#EEF3FD', color: '#2a5ec4', label: 'Page',       icon: 'file' },
  article:    { bg: '#EEFAF5', color: '#1a7a4a', label: 'Article',    icon: 'book-open' },
};

function Icon({ name, size = 16, color }) {
  const s = { width: size, height: size, stroke: color || 'currentColor', fill: 'none', strokeWidth: 1.8, flexShrink: 0 };
  switch(name) {
    case 'headphones': return <svg viewBox="0 0 24 24" style={s}><path d="M3 18v-2a9 9 0 0 1 18 0v2"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
    case 'file-text':  return <svg viewBox="0 0 24 24" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
    case 'file':       return <svg viewBox="0 0 24 24" style={s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    case 'book-open':  return <svg viewBox="0 0 24 24" style={s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'check':      return <svg viewBox="0 0 24 24" style={s}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'arrow':      return <svg viewBox="0 0 24 24" style={s}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'clock':      return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    default: return null;
  }
}

function getLIFColor(primaryElement) {
  const key = Object.keys(LIF_COLORS).find(k => (primaryElement || '').toUpperCase().includes(k));
  return LIF_COLORS[key] || { bg: '#E3EFF4', text: '#1c7293' };
}

function getThemeColor(theme, index) {
  const keys = Object.keys(LIF_COLORS);
  const matched = keys.find(k => theme.toUpperCase().includes(k));
  return LIF_COLORS[matched] || Object.values(LIF_COLORS)[index % keys.length];
}

export default function ModuleCard({ module: m, onReset }) {
  const lifColor = getLIFColor(m.frameworkAlignment?.primaryElement);

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header} style={{ background: `linear-gradient(135deg, ${lifColor.bg} 0%, #FAFAF8 100%)` }}>
        <div className={styles.headerMeta}>
          {(m.themes || []).map((theme, i) => {
            const tc = getThemeColor(theme, i);
            const isParent = ['WHY','WHAT','HOW','FOR WHOM','WHERE','WHEN','WHAT NEXT'].some(p => theme.toUpperCase().includes(p));
            return (
              <span
                key={theme}
                className={styles.themeTag}
                style={isParent
                  ? { background: tc.bg, color: tc.text, border: `1px solid ${tc.bg}` }
                  : { background: 'transparent', color: tc.text, border: `1px solid ${tc.text}40` }
                }
              >
                {theme}
              </span>
            );
          })}
        </div>

        <h2 className={styles.moduleTitle}>{m.title}</h2>
        <p className={styles.moduleSummary}>{m.summary}</p>

        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Icon name="clock" size={14} color={lifColor.text} />
            {m.estimatedTime}
          </span>
          <span className={styles.metaItem}>
            <Icon name="book-open" size={14} color={lifColor.text} />
            {(m.sources || []).length} sources
          </span>
        </div>
      </div>

      <div className={styles.body}>
        {/* Key Concepts */}
        {(m.keyConcepts || []).length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Key concepts</p>
            <div className={styles.conceptPills}>
              {m.keyConcepts.map(c => (
                <span key={c} className={styles.conceptPill}>{c}</span>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {(m.sources || []).length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Getting Smart sources</p>
            <div className={styles.sourceList}>
              {m.sources.map((s, i) => {
                const t = SOURCE_TYPES[s.type] || SOURCE_TYPES.article;
                return (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                    <span className={styles.sourceIcon} style={{ background: t.bg }}>
                      <Icon name={t.icon} size={15} color={t.color} />
                    </span>
                    <span className={styles.sourceTitle}>{s.title}</span>
                    <span className={styles.sourceLabel}>{t.label}</span>
                    <Icon name="arrow" size={14} color="#9CA3AF" />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Sequence */}
        {(m.sequence || []).length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Learning sequence</p>
            <div className={styles.steps}>
              {m.sequence.map((step, i) => {
                const col = STEP_COLORS[i % STEP_COLORS.length];
                return (
                  <div key={i} className={styles.step} style={{ borderLeft: `3px solid ${col.border}` }}>
                    <div className={styles.stepHeader}>
                      <span className={styles.stepNum} style={{ background: col.bg, color: col.text }}>
                        {i + 1}
                      </span>
                      <div>
                        <h4 className={styles.stepTitle}>{step.title}</h4>
                        <span className={styles.stepDuration}>{step.duration}</span>
                      </div>
                    </div>
                    <p className={styles.stepDesc}>{step.description}</p>

                    {(step.tasks || []).length > 0 && (
                      <div className={styles.tasks}>
                        {step.tasks.map((task, ti) => (
                          <div key={ti} className={styles.task}>
                            <Icon name="check" size={13} color={col.text} />
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {(step.resources || []).filter(r => r.url).map((r, ri) => {
                      const rt = SOURCE_TYPES[r.type] || SOURCE_TYPES.article;
                      return (
                        <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className={styles.stepResource}>
                          <Icon name={rt.icon} size={13} color={rt.color} />
                          <span>{r.title}</span>
                        </a>
                      );
                    })}

                    {step.videoUrl && (
                      <div className={styles.videoWrap}>
                        <iframe
                          src={step.videoUrl}
                          title="Related video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className={styles.videoFrame}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Additional Resources */}
        {(m.additionalResources || []).length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Additional resources</p>
            <div className={styles.addResources}>
              {m.additionalResources.filter(r => r.url).map((r, i) => {
                const t = SOURCE_TYPES[r.type] || SOURCE_TYPES.article;
                return (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className={styles.addResource}>
                    <span className={styles.addIcon} style={{ background: t.bg, color: t.color }}>
                      <Icon name={t.icon} size={16} color={t.color} />
                    </span>
                    <div className={styles.addText}>
                      <span className={styles.addTitle}>{r.title}</span>
                      <span className={styles.addDesc}>{r.description}</span>
                    </div>
                    <Icon name="arrow" size={14} color="#9CA3AF" />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Competencies */}
        {(m.competencies || []).length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionLabel}>Learning outcomes</p>
            <div className={styles.competencies}>
              {m.competencies.map((c, i) => (
                <div key={i} className={styles.competency}>
                  <span className={styles.competencyNum} style={{ background: lifColor.bg, color: lifColor.text }}>
                    {i + 1}
                  </span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.btnSecondary} onClick={onReset}>New module</button>
        <button className={styles.btnPrimary} onClick={() => window.print()}>Save as PDF</button>
      </div>
    </div>
  );
}
