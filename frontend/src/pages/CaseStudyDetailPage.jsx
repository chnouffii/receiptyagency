import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Target, Lightbulb, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CaseVisual } from '../components/CaseVisual';
import SEOHead, { CaseStudySchema, BreadcrumbSchema } from '../components/SEOHead';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CaseStudyDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [cs, setCs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/case-studies/${id}`)
      .then((res) => { setCs(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const center = { paddingTop: 96, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text3)' };
  if (loading) return <div style={center}><p>{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p></div>;
  if (!cs) return <div style={center}><p>{lang === 'fr' ? 'Étude de cas introuvable.' : 'Case study not found.'}</p></div>;

  const title = lang === 'fr' ? cs.title_fr : (cs.title_en || cs.title_fr);
  const desc = lang === 'fr' ? cs.desc_fr : (cs.desc_en || cs.desc_fr);
  const challenge = lang === 'fr' ? cs.challenge_fr : (cs.challenge_en || cs.challenge_fr);
  const solution = lang === 'fr' ? cs.solution_fr : (cs.solution_en || cs.solution_fr);
  const results = lang === 'fr' ? (cs.results_fr || []) : (cs.results_en || cs.results_fr || []);
  const duration = lang === 'fr' ? (cs.duration_fr || '') : (cs.duration_en || cs.duration_fr || '');
  const team = lang === 'fr' ? (cs.team_fr || '') : (cs.team_en || cs.team_fr || '');

  const L = {
    challenge: lang === 'fr' ? 'Le Défi' : 'The Challenge',
    solution: lang === 'fr' ? 'Notre Solution' : 'Our Solution',
    results: lang === 'fr' ? 'Résultats' : 'Results',
    duration: lang === 'fr' ? 'Durée' : 'Duration',
    team: lang === 'fr' ? 'Équipe' : 'Team',
    tech: lang === 'fr' ? 'Technologies' : 'Technologies',
    cta: lang === 'fr' ? 'Démarrer un projet similaire' : 'Start a similar project',
  };
  const caseTitle = lang === 'fr' ? (cs.title_fr || cs.title) : (cs.title_en || cs.title);
  const caseDesc = lang === 'fr' ? (cs.summary_fr || cs.summary || '') : (cs.summary_en || cs.summary || '');

  const statCard = { borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', padding: 20 };
  const statLabel = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text3)', margin: 0 };
  const statVal = { marginTop: 4, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text)' };
  const h2 = { fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 };
  const body = { lineHeight: 1.7, color: 'var(--text2)', paddingLeft: 32, margin: 0 };

  return (
    <div data-testid="case-detail-page" style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="cases" customTitle={`${caseTitle} — Étude de Cas | Receipty`} customDescription={caseDesc.slice(0, 160)} canonicalPath={`/cases/${id}`} />
      <CaseStudySchema title={caseTitle} description={caseDesc} url={`https://receipty.fr/cases/${id}`} />
      <BreadcrumbSchema items={[
        { name: 'Accueil', url: 'https://receipty.fr/' },
        { name: 'Études de Cas', url: 'https://receipty.fr/cases' },
        { name: caseTitle, url: `https://receipty.fr/cases/${id}` },
      ]} />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link to="/cases" data-testid="back-to-cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)', marginBottom: 40, textDecoration: 'none' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> {lang === 'fr' ? 'Retour aux études de cas' : 'Back to case studies'}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--accent2)', borderRadius: 100, padding: '3px 11px' }}>{cs.roi}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', border: '1px solid var(--border2)', borderRadius: 100, padding: '3px 10px' }}>{cs.category}</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>{title}</h1>
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, maxWidth: 640, color: 'var(--text2)' }}>{desc}</p>
        </motion.div>

        <div style={{ marginTop: 40, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <CaseVisual roi={cs.roi} category={cs.category} title={title} imageUrl={cs.image_url} hauteur={320} />
        </div>

        {(duration || team) && (
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(160px,100%),1fr))', gap: 16 }}>
            {duration && (<div style={statCard}><p style={statLabel}>{L.duration}</p><p style={statVal}>{duration}</p></div>)}
            {team && (<div style={statCard}><p style={statLabel}>{L.team}</p><p style={statVal}>{team}</p></div>)}
            <div style={statCard}><p style={statLabel}>ROI</p><p style={{ ...statVal, color: 'var(--accent)' }}>{cs.roi}</p></div>
          </div>
        )}

        {challenge && (
          <section style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><Target style={{ width: 20, height: 20, color: 'var(--danger)' }} /><h2 style={h2}>{L.challenge}</h2></div>
            <p style={body}>{challenge}</p>
          </section>
        )}
        {solution && (
          <section style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><Lightbulb style={{ width: 20, height: 20, color: '#e0a153' }} /><h2 style={h2}>{L.solution}</h2></div>
            <p style={body}>{solution}</p>
          </section>
        )}
        {results.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><TrendingUp style={{ width: 20, height: 20, color: 'var(--success)' }} /><h2 style={h2}>{L.results}</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 32 }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--success)', marginTop: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{r}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        {cs.tech?.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <p style={{ ...statLabel, paddingLeft: 32, marginBottom: 12 }}>{L.tech}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 32 }}>
              {cs.tech.map((tech) => (
                <span key={tech} style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(59,130,246,.1)', border: '1px solid var(--border2)', borderRadius: 100, padding: '3px 11px' }}>{tech}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <Link to="/contact" data-testid="case-detail-cta" data-magnetic style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--accent2)', color: '#fff', borderRadius: 100, padding: '16px 30px', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 0 1px var(--accent2), 0 12px 40px -8px var(--glow)' }}>
            {L.cta} <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
