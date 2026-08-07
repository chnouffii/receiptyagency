import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Zap, TrendingUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEOHead, { OrganizationSchema, ServiceSchema, FAQSchema } from '../components/SEOHead';
import { mountPageFx } from '../lib/designAnimations';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Infinite marquee of trusted company names (design system: masked, tokenized)
function TrustedMarquee({ companies }) {
  if (!companies || companies.length === 0) return null;
  const items = [...companies, ...companies, ...companies];
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)',
        maskImage: 'linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)',
      }}
    >
      <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 32s linear infinite' }}>
        {items.map((name, i) => (
          <span
            key={`${name}-${i}`}
            style={{
              flexShrink: 0, padding: '0 34px', fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600, fontSize: 15, color: 'var(--text3)', whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function FAQItem({ question, answer, index }) {
  const [open, setOpen] = useState(false);
  const panelId = `home-faq-panel-${index}`;
  const buttonId = `home-faq-button-${index}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      style={{
        borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, minHeight: 44, padding: '20px 22px', textAlign: 'left', background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'var(--text)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15.5 }}>{question}</span>
        <ChevronDown
          className={open ? 'rotate-180' : ''}
          style={{ width: 20, height: 20, flexShrink: 0, color: 'var(--text3)', transition: 'transform .3s' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="a"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p style={{ padding: '4px 22px 20px', margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--text2)' }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const RISE = (delay) => ({
  opacity: 0,
  animation: `riseIn .8s cubic-bezier(.2,.7,.2,1) ${delay}s forwards`,
});

export default function HomePage() {
  const { t, lang } = useLanguage();
  const pageRef = useRef(null);
  const faqRef = useRef(null);
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' });
  const [trustedCompanies, setTrustedCompanies] = useState(['GlobalTech', 'BioPharm', 'NeoRetail', 'MedStaff', 'InvestCorp']);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    // Design interaction layer (particles, magnetic, tilt, reveal)
    const cleanup = mountPageFx(pageRef.current);
    return cleanup;
  }, []);

  useEffect(() => {
    axios.get(`${API}/site-content`)
      .then((res) => {
        if (res.data.trusted_companies && res.data.trusted_companies.length > 0) {
          setTrustedCompanies(res.data.trusted_companies);
        }
      })
      .catch(() => {});
    axios.get(`${API}/faq`).then((res) => setFaqs(res.data)).catch(() => {});
  }, []);

  const featureItems = [
    { icon: Brain, ...t.features.ai },
    { icon: Zap, ...t.features.auto },
    { icon: TrendingUp, ...t.features.perf },
  ];

  const primaryBtn = {
    display: 'inline-flex', alignItems: 'center', gap: 9, padding: '16px 30px',
    borderRadius: 100, background: 'var(--accent2)', color: '#fff', fontSize: 15,
    fontWeight: 700, textDecoration: 'none',
    boxShadow: '0 0 0 1px var(--accent2), 0 12px 40px -8px var(--glow)',
    transition: 'box-shadow .4s, transform .2s',
  };
  const secondaryBtn = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 26px',
    borderRadius: 100, border: '1px solid var(--border2)', background: 'var(--surface)',
    backdropFilter: 'blur(10px)', color: 'var(--text)', fontSize: 15, fontWeight: 600,
    textDecoration: 'none',
  };

  return (
    <div ref={pageRef} data-testid="home-page" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="home" />
      <OrganizationSchema />
      <ServiceSchema />
      <FAQSchema faqs={faqs} />

      {/* ===== HERO ===== */}
      <section
        style={{
          position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden', background: 'var(--bg)',
          padding: '120px 24px 60px',
        }}
      >
        {/* Animated blobs */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '50%', width: 'min(760px,95vw)', height: 760, borderRadius: '50%', filter: 'blur(130px)', opacity: 0.6, background: 'radial-gradient(circle,var(--accent),transparent 65%)', animation: 'blobA 16s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '22%', right: '2%', width: 520, height: 520, borderRadius: '50%', filter: 'blur(140px)', opacity: 0.4, background: 'radial-gradient(circle,var(--cyan),transparent 62%)', animation: 'blobB 20s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-6%', left: '6%', width: 560, height: 560, borderRadius: '50%', filter: 'blur(150px)', opacity: 0.35, background: 'radial-gradient(circle,var(--violet),transparent 62%)', animation: 'blobC 24s ease-in-out infinite' }} />
        </div>
        {/* Particle field */}
        <canvas data-particles style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', pointerEvents: 'none' }} />
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1, opacity: 0.5,
            backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
            backgroundSize: '64px 64px',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 42%,#000 30%,transparent 75%)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 42%,#000 30%,transparent 75%)',
          }}
        />
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 980, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ ...RISE(0.05), display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 15px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--surface)', backdropFilter: 'blur(10px)', fontSize: 12.5, fontWeight: 600, color: 'var(--text2)', marginBottom: 30 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)', animation: 'pulse 2s ease-in-out infinite' }} />
            <span>{t.hero.badge || "Agence d'intégration IA · Infrastructure française"}</span>
          </div>

          <h1
            style={{
              ...RISE(0.15),
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 'clamp(2.6rem,7vw,5.2rem)', lineHeight: 1.02, letterSpacing: '-.035em',
              margin: 0, textWrap: 'balance',
              background: 'linear-gradient(100deg,var(--text) 20%,var(--accent) 45%,var(--cyan) 55%,var(--text) 80%)',
              backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'riseIn .8s cubic-bezier(.2,.7,.2,1) .15s forwards, shimmer 7s linear infinite',
            }}
          >
            {t.hero.title}
          </h1>

          <p style={{ ...RISE(0.3), margin: '28px auto 0', maxWidth: 600, fontSize: 'clamp(1rem,1.6vw,1.2rem)', lineHeight: 1.6, color: 'var(--text2)' }}>
            {t.hero.subtitle}
          </p>

          <div style={{ ...RISE(0.45), marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <Link
              to="/contact"
              data-testid="hero-cta-button"
              data-magnetic
              style={primaryBtn}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), 0 16px 50px -6px var(--glow)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent2), 0 12px 40px -8px var(--glow)'; }}
            >
              <span>{t.hero.cta}</span>
              <span data-arrow aria-hidden="true" style={{ display: 'inline-block', transition: 'transform .25s' }}>→</span>
            </Link>
            <Link to="/cases" data-testid="hero-secondary-btn" data-magnetic style={secondaryBtn}>
              <span>{t.nav.cases}</span>
            </Link>
          </div>

          <div style={{ marginTop: 82, paddingTop: 34, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11.5, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text3)', margin: '0 0 26px' }}>
              {t.hero.trusted}
            </p>
            <TrustedMarquee companies={trustedCompanies} />
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section style={{ background: 'var(--bg)', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
          {featureItems.map((feature, i) => (
            <div
              key={i}
              data-reveal
              data-reveal-delay={i * 110}
              data-tilt
              data-testid={`feature-card-${i}`}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', padding: 32, transformStyle: 'preserve-3d' }}
            >
              <div data-spot style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', transition: 'opacity .3s', background: 'radial-gradient(320px circle at var(--mx) var(--my), rgba(59,130,246,.12), transparent 70%)' }} />
              <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
                <feature.icon style={{ width: 24, height: 24, color: 'var(--accent)' }} />
              </div>
              <h3 style={{ position: 'relative', fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>{feature.title}</h3>
              <p style={{ position: 'relative', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text2)', margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      {faqs.length > 0 && (
        <section ref={faqRef} style={{ background: 'var(--bg)', padding: '40px 24px 100px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={faqInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: 36 }}
            >
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.9rem,4vw,2.6rem)', fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>
                {t.faq.title}
              </h2>
              <p style={{ marginTop: 14, fontSize: 16, color: 'var(--text2)' }}>{t.faq.subtitle}</p>
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, i) => (
                <FAQItem
                  key={faq.id}
                  index={i}
                  question={lang === 'fr' ? faq.question_fr : (faq.question_en || faq.question_fr)}
                  answer={lang === 'fr' ? faq.answer_fr : (faq.answer_en || faq.answer_fr)}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
