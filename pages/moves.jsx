import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import SiteHeader from '../components/SiteHeader';
import styles from '../styles/Moves.module.css';

const LIF_SECTIONS = [
  { key: 'WHEN',      subtitle: 'Strategy',            bg: '#EFEFEC', color: '#3A3935' },
  { key: 'WHY',       subtitle: 'Community Vision',    bg: '#E3EFF4', color: '#145670' },
  { key: 'WHAT',      subtitle: 'Outcomes',            bg: '#EEEDFE', color: '#3C3489' },
  { key: 'HOW',       subtitle: 'Learning Model',      bg: '#E6F1FB', color: '#0C447C' },
  { key: 'FOR WHOM',  subtitle: 'Signals',             bg: '#F1DDCF', color: '#7A4A2E' },
  { key: 'WHERE',     subtitle: 'Learning Ecosystem',  bg: '#F5E6D8', color: '#6B3D1A' },
  { key: 'WHAT NEXT', subtitle: 'Sharing and Scaling', bg: '#D4EAE0', color: '#145670' },
];

const TYPE_STYLES = {
  article:    { bg: '#EFEFEC', color: '#3A3935', label: 'Article' },
  podcast:    { bg: '#E3EFF4', color: '#145670', label: 'Podcast' },
  whitepaper: { bg: '#EEEDFE', color: '#3C3489', label: 'Whitepaper' },
};

const MOVES = [
  // WHEN · Strategy
  { id: 'north-star',       lif: 'WHEN',      name: 'North Star Design Session',     desc: 'Facilitate a team workshop to articulate a bold, inspiring vision that guides all future design decisions.' },
  { id: 'theory-of-change', lif: 'WHEN',      name: 'Theory of Change Mapping',      desc: 'Map the causal chain from current conditions to desired outcomes, identifying key leverage points for transformation.' },
  { id: 'strategy-sprint',  lif: 'WHEN',      name: 'Strategy Sprint',               desc: 'Run a focused 3–5 day intensive to prototype and pressure-test strategic priorities before committing resources.' },
  // WHY · Community Vision
  { id: 'listening-tour',   lif: 'WHY',       name: 'Community Listening Tour',      desc: 'Conduct structured conversations with students, families, and neighbors to surface authentic needs and aspirations.' },
  { id: 'value-canvas',     lif: 'WHY',       name: 'Value Proposition Canvas',      desc: 'Define the unique value your school creates for learners and families by mapping student jobs, pains, and gains.' },
  { id: 'asset-mapping',    lif: 'WHY',       name: 'Community Asset Mapping',       desc: 'Identify and catalog the strengths, resources, and local opportunities that can power your school design.' },
  // WHAT · Outcomes
  { id: 'grad-profile',     lif: 'WHAT',      name: 'Graduate Profile Design',       desc: 'Collaboratively define the knowledge, skills, and dispositions every graduate will carry into the world.' },
  { id: 'competency-map',   lif: 'WHAT',      name: 'Competency Framework Mapping',  desc: 'Develop a clear, measurable set of competencies aligned to your graduate profile and future-ready demands.' },
  { id: 'outcomes-audit',   lif: 'WHAT',      name: 'Learning Outcomes Audit',       desc: 'Assess current results against your desired graduate profile to identify gaps and opportunities for redesign.' },
  // HOW · Learning Model
  { id: 'pbl-design',       lif: 'HOW',       name: 'Project-Based Learning Design', desc: 'Design rigorous, authentic projects that integrate academic content with real-world application and student agency.' },
  { id: 'mastery-map',      lif: 'HOW',       name: 'Mastery Progression Mapping',   desc: 'Create clear progressions so learners advance based on demonstrated mastery rather than seat time.' },
  { id: 'advisory-design',  lif: 'HOW',       name: 'Advisory System Design',        desc: 'Build a structured advisory program so every student has a trusted advocate supporting their growth and belonging.' },
  // FOR WHOM · Signals
  { id: 'learner-personas', lif: 'FOR WHOM',  name: 'Learner Persona Development',   desc: 'Create rich, research-based portraits of the diverse students your school serves to ground all design decisions.' },
  { id: 'equity-audit',     lif: 'FOR WHOM',  name: 'Equity Audit',                  desc: 'Systematically examine policies, practices, and outcomes to identify and address disparities across student groups.' },
  { id: 'student-voice',    lif: 'FOR WHOM',  name: 'Student Voice Design Sprint',   desc: 'Center student perspectives using structured protocols that give young people genuine decision-making power.' },
  // WHERE · Learning Ecosystem
  { id: 'space-walk',       lif: 'WHERE',     name: 'Space Reimagination Walk',      desc: 'Conduct an observation and ideation exercise to redesign physical environments to better support your learning model.' },
  { id: 'partner-map',      lif: 'WHERE',     name: 'Partnership Ecosystem Mapping', desc: 'Identify and cultivate community partnerships that expand learning opportunities beyond the classroom walls.' },
  { id: 'hybrid-design',    lif: 'WHERE',     name: 'Hybrid Learning Design',        desc: 'Thoughtfully blend in-person and digital learning to maximize flexibility, access, and depth for all learners.' },
  // WHAT NEXT · Sharing and Scaling
  { id: 'scale-readiness',  lif: 'WHAT NEXT', name: 'Scale Readiness Assessment',    desc: 'Evaluate your school readiness to grow or replicate by examining core conditions for sustainable expansion.' },
  { id: 'replication',      lif: 'WHAT NEXT', name: 'Replication Playbook',          desc: 'Document the essential elements of your model in a transferable guide that others can adapt and implement.' },
  { id: 'impact-framework', lif: 'WHAT NEXT', name: 'Impact Measurement Framework',  desc: 'Design a rigorous, mixed-methods approach to measuring and communicating the impact of your school design.' },
];

export default function Moves() {
  const [selectedMove, setSelectedMove] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSelectMove = useCallback((move) => {
    if (selectedMove?.id === move.id) return;
    setPanelOpen(false);
    setSelectedMove(move);
    setResources([]);
    setError(false);
    setTimeout(() => setPanelOpen(true), 16);
  }, [selectedMove]);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => setSelectedMove(null), 260);
  }, []);

  useEffect(() => {
    if (!selectedMove) return;
    setLoading(true);
    setError(false);
    fetch('/api/moves-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moveName: selectedMove.name, moveDesc: selectedMove.desc }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setResources(data.matches || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [selectedMove]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  const lifSection = selectedMove
    ? LIF_SECTIONS.find(s => s.key === selectedMove.lif)
    : null;

  return (
    <>
      <Head>
        <title>School Design Moves — Getting Smart Tools</title>
        <meta name="description" content="Explore actionable school design moves organized by the 7 elements of the Learning Innovation Framework." />
      </Head>
      <div className={styles.page}>
        <SiteHeader currentTool="School Design Moves" />

        <main className={styles.main}>
          <div className={styles.intro}>
            <h1 className={styles.title}>School Design Moves</h1>
            <p className={styles.subtitle}>
              Actionable moves for school design, organized by the{' '}
              <strong>Learning Innovation Framework</strong>. Click any move to
              explore curated Getting Smart resources.
            </p>
          </div>

          <div className={styles.sections}>
            {LIF_SECTIONS.map(section => {
              const sectionMoves = MOVES.filter(m => m.lif === section.key);
              return (
                <div key={section.key} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <span
                      className={styles.sectionTag}
                      style={{ background: section.bg, color: section.color }}
                    >
                      {section.key}
                    </span>
                    <span className={styles.sectionDot}>·</span>
                    <span className={styles.sectionSubtitle}>{section.subtitle}</span>
                  </div>
                  <div className={styles.cardGrid}>
                    {sectionMoves.map(move => (
                      <button
                        key={move.id}
                        className={`${styles.moveCard} ${selectedMove?.id === move.id ? styles.active : ''}`}
                        onClick={() => handleSelectMove(move)}
                        style={selectedMove?.id === move.id ? {
                          borderColor: section.color,
                          boxShadow: `0 0 0 3px ${section.bg}`,
                        } : undefined}
                      >
                        <span
                          className={styles.lifTag}
                          style={{ background: section.bg, color: section.color }}
                        >
                          {section.key}
                        </span>
                        <h3 className={styles.moveName}>{move.name}</h3>
                        <p className={styles.moveDesc}>{move.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {selectedMove && (
          <>
            <div className={styles.backdrop} onClick={handleClose} />
            <div className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close panel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {lifSection && (
                <span
                  className={styles.panelLif}
                  style={{ background: lifSection.bg, color: lifSection.color }}
                >
                  {lifSection.key} · {lifSection.subtitle}
                </span>
              )}
              <h2 className={styles.panelTitle}>{selectedMove.name}</h2>
              <p className={styles.panelDesc}>{selectedMove.desc}</p>

              <div className={styles.divider} />

              <h3 className={styles.resourcesLabel}>Getting Smart Resources</h3>

              {loading ? (
                <div className={styles.skeletonList}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className={styles.skItem}>
                      <div className={`${styles.skBlock} ${styles.skBadge}`} />
                      <div className={`${styles.skBlock} ${styles.skTitle}`} />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <p className={styles.stateMsg}>Could not load resources. Please try again.</p>
              ) : resources.length === 0 ? (
                <p className={styles.stateMsg}>No matching resources found.</p>
              ) : (
                <div className={styles.resourceList}>
                  {resources.map((r, i) => {
                    const tc = TYPE_STYLES[r.type] || TYPE_STYLES.article;
                    return (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.resourceCard}
                      >
                        <span
                          className={styles.typeBadge}
                          style={{ background: tc.bg, color: tc.color }}
                        >
                          {tc.label}
                        </span>
                        <span className={styles.resourceTitle}>{r.title}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" className={styles.arrowIcon}>
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
