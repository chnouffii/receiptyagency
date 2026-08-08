import { useRef, useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import { CaseVisual } from '../components/CaseVisual';
import { mountPageFx } from '../lib/designAnimations';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function CaseCard({ item, index, lang }) {
  const title = lang === 'fr' ? item.title_fr : (item.title_en || item.title_fr);
  const desc = lang === 'fr' ? item.desc_fr : (item.desc_en || item.desc_fr);

  return (
    <Link to={`/cases/${item.id}`} data-testid={`case-card-${index}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        data-case
        data-reveal
        data-reveal-delay={index * 80}
        className="group break-inside-avoid mb-6"
        style={{ overflow: 'hidden', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
          <CaseVisual roi={item.roi} category={item.category} title={title} imageUrl={item.image_url} />
          {/* Pastille ROI réservée aux visuels photo : sans image, le chiffre
              est déjà l'élément principal du composant, l'afficher deux fois
              serait redondant. */}
          {item.image_url && (
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--accent2)', borderRadius: 100, padding: '4px 11px' }}>{item.roi}</span>
            </div>
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.5)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 500 }}>
              {lang === 'fr' ? 'Voir le cas' : 'View case'} <ArrowUpRight style={{ width: 16, height: 16 }} />
            </span>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, margin: '0 0 8px' }}>{item.category}</p>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 600, lineHeight: 1.25, margin: 0, color: 'var(--text)' }}>{title}</h3>
          <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: 'var(--text2)' }}>{desc}</p>
          {item.tags?.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {item.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 12, borderRadius: 100, padding: '3px 10px', color: 'var(--text3)', background: 'var(--surface2)' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CaseStudiesPage() {
  const { t, lang } = useLanguage();
  const pageRef = useRef(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/case-studies`)
      .then((res) => { setCases(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const cleanup = mountPageFx(pageRef.current);
    return cleanup;
  }, [loading]);

  return (
    <div ref={pageRef} data-testid="cases-page" style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="cases" />
      <section className="max-w-6xl mx-auto px-6" style={{ padding: '64px 24px 96px' }}>
        <div style={{ marginBottom: 56, opacity: 0, animation: 'riseIn .8s cubic-bezier(.2,.7,.2,1) .05s forwards' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.4rem,6vw,4rem)', fontWeight: 700, letterSpacing: '-.03em', margin: 0, color: 'var(--text)' }}>{t.cases.title}</h1>
          <p style={{ marginTop: 20, fontSize: 17, maxWidth: 620, color: 'var(--text2)' }}>{t.cases.subtitle}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '80px 0' }}>{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '80px 0' }}>{lang === 'fr' ? 'Aucune étude de cas pour le moment.' : 'No case studies yet.'}</div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {cases.map((item, i) => (
              <CaseCard key={item.id} item={item} index={i} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
