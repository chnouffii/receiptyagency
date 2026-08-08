import { useRef, useEffect } from 'react';
import { ShieldCheck, Landmark, GraduationCap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import { mountPageFx } from '../lib/designAnimations';

const SOV_ICONS = { shield: ShieldCheck, landmark: Landmark, graduation: GraduationCap };

export default function AdnVisionPage() {
  const { t } = useLanguage();
  const pageRef = useRef(null);

  useEffect(() => {
    const cleanup = mountPageFx(pageRef.current);
    return cleanup;
  }, []);

  const stats = [
    { value: 10, suffix: '+', label: t.adn.stats.projects },
    { value: 2000, suffix: '+', label: t.adn.stats.hours },
    { value: 90, suffix: '%', label: t.adn.stats.automation },
  ];
  // Le troisième chiffre était en violet saturé (#6d5cf0), codé en dur et donc
  // resté en place après le retrait du token `--violet`. On passe par les
  // tokens du thème : le violet disparaît de tout le site public, et les deux
  // thèmes restent lisibles sans valeur par thème à maintenir ici.
  const colors = ['var(--accent)', 'var(--cyan)', 'var(--text)'];

  const card = { position: 'relative', overflow: 'hidden', borderRadius: 22, border: '1px solid var(--border)', background: 'var(--surface)', padding: 30 };
  const spot = { position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', transition: 'opacity .3s', background: 'radial-gradient(320px circle at var(--mx) var(--my), rgba(59,130,246,.12), transparent 70%)' };

  return (
    <div ref={pageRef} data-testid="adn-page" style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="adn" />

      {/* Manifesto */}
      <section className="max-w-5xl mx-auto px-6" style={{ padding: '64px 24px 40px' }}>
        <div style={{ opacity: 0, animation: 'riseIn .8s cubic-bezier(.2,.7,.2,1) .05s forwards' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.6rem,7vw,4.6rem)', fontWeight: 700, letterSpacing: '-.03em', margin: 0, color: 'var(--text)' }}>{t.adn.title}</h1>
          <p style={{ marginTop: 22, fontSize: 18, maxWidth: 720, lineHeight: 1.6, color: 'var(--text2)' }}>{t.adn.subtitle}</p>
        </div>
        <blockquote data-reveal style={{ margin: '56px 0 0', paddingLeft: 24, borderLeft: '2px solid var(--accent)' }}>
          <p style={{ fontSize: 'clamp(1.15rem,2vw,1.5rem)', lineHeight: 1.55, fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', margin: 0 }}>
            "{t.adn.manifesto}"
          </p>
        </blockquote>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6" style={{ padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          {stats.map((stat, i) => (
            <div key={i} data-reveal data-reveal-delay={i * 120} data-testid={`stat-card-${i}`} style={card}>
              <span
                data-counter
                data-target={stat.value}
                data-suffix={stat.suffix}
                style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.4rem,5vw,3.2rem)', fontWeight: 700, color: colors[i], letterSpacing: '-.02em', display: 'block' }}
              >
                {stat.value.toLocaleString('fr-FR')}{stat.suffix}
              </span>
              <span style={{ marginTop: 10, fontSize: 14, fontWeight: 500, color: 'var(--text2)', display: 'block' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Souveraineté & accompagnement */}
      <section className="max-w-6xl mx-auto px-6" style={{ padding: '48px 24px' }}>
        <div data-reveal style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>{t.adn.sovereignty.title}</h2>
          <p style={{ marginTop: 14, fontSize: 16, maxWidth: 620, color: 'var(--text2)' }}>{t.adn.sovereignty.subtitle}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {t.adn.sovereignty.items.map((item, i) => {
            const Icon = SOV_ICONS[item.icon] || ShieldCheck;
            return (
              <div key={i} data-reveal data-reveal-delay={i * 110} data-tilt data-testid={`sovereignty-card-${i}`} style={card}>
                <div data-spot style={spot} />
                <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon style={{ width: 24, height: 24, color: 'var(--accent)' }} />
                </div>
                <h3 style={{ position: 'relative', fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>{item.title}</h3>
                <p style={{ position: 'relative', fontSize: 14, lineHeight: 1.6, color: 'var(--text2)', margin: 0 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Équipe */}
      <section className="max-w-6xl mx-auto px-6" style={{ padding: '48px 24px 96px' }}>
        <h2 data-reveal style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.7rem,3.5vw,2.4rem)', fontWeight: 700, marginBottom: 32, color: 'var(--text)' }}>{t.adn.team}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
          {t.adn.members.map((member, i) => (
            <div key={i} data-reveal data-reveal-delay={i * 120} data-tilt data-testid={`team-member-${i}`} style={card}>
              <div data-spot style={spot} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${colors[i % colors.length]}, var(--cyan))`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17 }}>
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)' }}>{member.name}</h3>
                  <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 500, margin: '2px 0 0' }}>{member.role}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, color: 'var(--text2)' }}>{member.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
