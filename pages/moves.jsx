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
  // WHY · Community Vision
  { id: 'community-need',          lif: 'WHY',       name: 'Community Need Assessment',         desc: 'Surface and document community challenges and assets to shape school vision and learner outcomes.' },
  { id: 'mission',                 lif: 'WHY',       name: 'Mission Definition',                desc: 'Define the school\'s mission to guide how the community vision will be achieved.' },
  { id: 'vision',                  lif: 'WHY',       name: 'Long-Term Vision Articulation',     desc: 'Co-create an inspiring long-term vision that guides all school and system decisions.' },
  { id: 'values-norms',            lif: 'WHY',       name: 'Values & Norms Design',             desc: 'Establish shared values and behavioral norms that shape a positive school culture.' },
  // WHAT · Outcomes
  { id: 'learner-portrait',        lif: 'WHAT',      name: 'Learner Portrait Design',           desc: 'Collaboratively define the knowledge, skills, and dispositions every graduate will embody.' },
  { id: 'standards',               lif: 'WHAT',      name: 'Standards Alignment',               desc: 'Align rubrics and proficiency scales with discipline standards to clarify learning expectations.' },
  { id: 'competencies',            lif: 'WHAT',      name: 'Competency Framework Design',       desc: 'Define a future-ready competency framework equipping all students for complex real-world challenges.' },
  { id: 'learning-progressions',   lif: 'WHAT',      name: 'Learning Progressions Mapping',     desc: 'Build flexible learning pathways so students advance by demonstrating mastery, not seat time.' },
  { id: 'educator-leader-portraits', lif: 'WHAT',    name: 'Educator & Leader Portraits',       desc: 'Define the competencies educators and leaders need to enable a learner-centered model.' },
  // HOW · Learning Model
  { id: 'climate-culture',         lif: 'HOW',       name: 'Climate & Culture Design',          desc: 'Cultivate a belonging-centered, growth-oriented culture where every learner feels safe and included.' },
  { id: 'design-principles',       lif: 'HOW',       name: 'Design Principles Development',     desc: 'Define guiding design principles that ensure coherent and innovative learning experiences.' },
  { id: 'learning-experience',     lif: 'HOW',       name: 'Learning Experience Design',        desc: 'Design purposeful, real-world learning experiences that inspire curiosity and develop critical skills.' },
  { id: 'instruction-facilitation', lif: 'HOW',      name: 'Instruction & Facilitation Shift',  desc: 'Shift to facilitative, learner-centered instructional strategies that build student independence and agency.' },
  { id: 'assessment',              lif: 'HOW',       name: 'Equitable Assessment Design',       desc: 'Design authentic, equity-centered assessments that reveal the full range of student strengths.' },
  { id: 'professional-learning',   lif: 'HOW',       name: 'Professional Learning Ecosystem',   desc: 'Build a personalized professional learning ecosystem that continuously grows educator capacity and impact.' },
  // FOR WHOM · Signals
  { id: 'reports',                 lif: 'FOR WHOM',  name: 'Holistic Progress Reports',         desc: 'Create holistic progress reports capturing student growth across academic and competency-based metrics.' },
  { id: 'portfolios',              lif: 'FOR WHOM',  name: 'Portfolio Implementation',          desc: 'Launch portfolio systems empowering learners to document, reflect on, and share their growth.' },
  { id: 'transcripts',             lif: 'FOR WHOM',  name: 'Whole-Learner Transcript Design',   desc: 'Redesign transcripts to showcase the full breadth of student competencies and experiences.' },
  { id: 'credentials',             lif: 'FOR WHOM',  name: 'Credentialing System Design',       desc: 'Build micro-credentialing systems that validate and signal specific student skills and expertise.' },
  // WHERE · Learning Ecosystem
  { id: 'technology',              lif: 'WHERE',     name: 'Future-Ready Technology Integration', desc: 'Leverage cutting-edge technology to personalize learning and prepare students for a digital world.' },
  { id: 'facilities',              lif: 'WHERE',     name: 'Adaptable Facilities Design',       desc: 'Transform facilities into flexible, inspiring spaces that support diverse and innovative pedagogies.' },
  { id: 'staffing-scheduling',     lif: 'WHERE',     name: 'Staffing & Scheduling Innovation',  desc: 'Design flexible staffing and schedules that enable personalized learning and sustain educator well-being.' },
  { id: 'transportation',          lif: 'WHERE',     name: 'Equitable Transportation Planning', desc: 'Build equitable transportation systems enabling all learners to access diverse learning opportunities.' },
  { id: 'partnerships',            lif: 'WHERE',     name: 'Community Partnership Development', desc: 'Cultivate reciprocal community partnerships that expand authentic learning opportunities beyond school walls.' },
  { id: 'networks',                lif: 'WHERE',     name: 'Learning Network Building',         desc: 'Connect to diverse learning networks to source and accelerate high-impact educational innovations.' },
  // WHEN · Strategy
  { id: 'strategic-direction',     lif: 'WHEN',      name: 'Strategic Direction Setting',       desc: 'Develop a vision-aligned multi-year strategy guiding all school decisions and resource allocation.' },
  { id: 'leading-change',          lif: 'WHEN',      name: 'Leading Change Initiative',         desc: 'Lead systemic change initiatives that empower every stakeholder to drive learning model innovation.' },
  { id: 'implementation',          lif: 'WHEN',      name: 'Implementation Science Application', desc: 'Apply implementation science and project management to maximize outcomes for strategic initiatives.' },
  { id: 'measuring-success',       lif: 'WHEN',      name: 'Measuring Success Framework',       desc: 'Build transparent accountability systems using clear metrics to drive continuous improvement.' },
  { id: 'research-development',    lif: 'WHEN',      name: 'Research & Development Culture',    desc: 'Foster a culture of iterative piloting and evidence-based innovation to improve learning continuously.' },
  // WHAT NEXT · Sharing and Scaling
  { id: 'codifying',               lif: 'WHAT NEXT', name: 'Best Practice Codification',        desc: 'Build systems to document, codify, and share best practices for consistent quality and scalability.' },
  { id: 'sharing',                 lif: 'WHAT NEXT', name: 'System-Wide Knowledge Sharing',     desc: 'Spread successful practices and R&D learnings system-wide through structured knowledge-sharing channels.' },
  { id: 'landscape-analysis',      lif: 'WHAT NEXT', name: 'Landscape Analysis',                desc: 'Analyze the education landscape to identify promising external practices before committing to scaling.' },
  { id: 'theory-of-change',        lif: 'WHAT NEXT', name: 'Theory of Change Development',      desc: 'Develop a clear, vision-aligned theory of change connecting initiatives to desired outcomes.' },
  { id: 'scaling',                 lif: 'WHAT NEXT', name: 'Sustainable Scaling Strategy',      desc: 'Sustainably expand proven, high-impact initiatives to benefit more learners across the system.' },
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
