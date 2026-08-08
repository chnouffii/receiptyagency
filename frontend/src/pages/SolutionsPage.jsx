import { useRef, useState, useEffect } from 'react';
import { Users, Wallet, Globe, Cpu, ShoppingCart, Mail, Shield, BarChart3, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import { mountPageFx } from '../lib/designAnimations';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ICON_MAP = { users: Users, wallet: Wallet, globe: Globe, cpu: Cpu, 'shopping-cart': ShoppingCart, mail: Mail, shield: Shield, 'bar-chart': BarChart3 };

function SolutionCard({ sol, index, lang }) {
  const Icon = ICON_MAP[sol.icon] || Users;
  const name = lang === 'fr' ? sol.name_fr : (sol.name_en || sol.name_fr);
  const tag = lang === 'fr' ? sol.tag_fr : (sol.tag_en || sol.tag_fr);
  const desc = lang === 'fr' ? sol.desc_fr : (sol.desc_en || sol.desc_fr);
  const features = lang === 'fr' ? (sol.features_fr || []) : (sol.features_en || sol.features_fr || []);

  return (
    <div
      data-reveal
      data-reveal-delay={index * 90}
      data-tilt
      data-testid={`solution-card-${index}`}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, border: '1px solid var(--border)', background: 'var(--surface)', padding: 32 }}
    >
      <div data-spot style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', transition: 'opacity .3s', background: 'radial-gradient(320px circle at var(--mx) var(--my), rgba(59,130,246,.12), transparent 70%)' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 24, height: 24, color: 'var(--accent)' }} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{name}</h3>
          <span style={{ display: 'inline-block', marginTop: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent)', border: '1px solid var(--border2)', borderRadius: 100, padding: '2px 10px' }}>{tag}</span>
        </div>
      </div>
      <p style={{ position: 'relative', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text2)', margin: '0 0 22px' }}>{desc}</p>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {features.map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text2)' }}>
            <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--accent)', opacity: 0.7, flexShrink: 0 }} />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SolutionsPage() {
  const { t, lang } = useLanguage();
  const pageRef = useRef(null);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/solutions`)
      .then((res) => { setSolutions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const cleanup = mountPageFx(pageRef.current);
    return cleanup;
  }, [loading]);

  return (
    <div ref={pageRef} data-testid="solutions-page" style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="solutions" />
      <section className="max-w-6xl mx-auto px-6" style={{ padding: '64px 24px 96px' }}>
        <div style={{ marginBottom: 56, ...({ opacity: 0, animation: 'riseIn .8s cubic-bezier(.2,.7,.2,1) .05s forwards' }) }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.4rem,6vw,4rem)', fontWeight: 700, letterSpacing: '-.03em', margin: 0, color: 'var(--text)' }}>{t.solutions.title}</h1>
          <p style={{ marginTop: 20, fontSize: 17, maxWidth: 620, color: 'var(--text2)' }}>{t.solutions.subtitle}</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '80px 0' }}>{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
        ) : solutions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '80px 0' }}>{lang === 'fr' ? 'Aucune solution pour le moment.' : 'No solutions yet.'}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 22 }}>
            {solutions.map((sol, i) => (
              <SolutionCard key={sol.id} sol={sol} index={i} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
