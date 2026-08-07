import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import SEOHead, { FAQSchema, BreadcrumbSchema } from '../components/SEOHead';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SITE_URL = 'https://receipty.fr';

function FAQItem({ question, answer, isOpen, onToggle, id }) {
  const panelId = `faq-panel-${id}`;
  const buttonId = `faq-button-${id}`;
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${isOpen ? 'var(--border2)' : 'var(--border)'}`, background: 'var(--surface)', overflow: 'hidden', transition: 'border-color .2s' }}>
      <button
        onClick={onToggle}
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 44, padding: '18px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
      >
        <span style={{ fontWeight: 600, fontSize: 15.5 }}>{question}</span>
        <ChevronDown style={{ width: 20, height: 20, flexShrink: 0, color: 'var(--text3)', transition: 'transform .3s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>
      {isOpen && (
        <motion.div id={panelId} role="region" aria-labelledby={buttonId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
          <p style={{ padding: '2px 20px 20px', margin: 0, fontSize: 14.5, lineHeight: 1.65, color: 'var(--text2)', whiteSpace: 'pre-line' }}>{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { t, lang } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    axios.get(`${API}/faq`).then((res) => setFaqs(res.data || [])).catch(() => {});
  }, []);

  const localized = faqs.map((f) => ({
    id: f.id,
    question: lang === 'fr' ? f.question_fr : (f.question_en || f.question_fr),
    answer: lang === 'fr' ? f.answer_fr : (f.answer_en || f.answer_fr),
  }));

  const intro = lang === 'fr'
    ? "Les réponses aux questions les plus fréquentes sur Receipty, nos solutions d'automatisation IA, notre méthode et nos tarifs. Une question sans réponse ici ? Contactez-nous, on répond sous 24h."
    : "Answers to the most common questions about Receipty, our AI automation solutions, our method and our pricing. Can't find your answer? Contact us — we reply within 24h.";

  return (
    <div data-testid="faq-page" style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="faq" />
      <FAQSchema faqs={localized} />
      <BreadcrumbSchema items={[{ name: 'Receipty', url: `${SITE_URL}/` }, { name: 'FAQ', url: `${SITE_URL}/faq` }]} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6" style={{ padding: '64px 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48, opacity: 0, animation: 'riseIn .8s cubic-bezier(.2,.7,.2,1) .05s forwards' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
            <HelpCircle style={{ width: 15, height: 15 }} /> FAQ
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.2rem,5vw,3.4rem)', fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>
            {t.faq?.title || (lang === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions')}
          </h1>
          <p style={{ marginTop: 18, fontSize: 16, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6, color: 'var(--text2)' }}>{intro}</p>
        </div>

        {localized.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {localized.map((faq) => (
              <FAQItem key={faq.id} id={faq.id} question={faq.question} answer={faq.answer} isOpen={openId === faq.id} onToggle={() => setOpenId(openId === faq.id ? null : faq.id)} />
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text3)' }}>{lang === 'fr' ? 'Les questions fréquentes arrivent bientôt.' : 'Frequently asked questions are coming soon.'}</p>
        )}

        <div style={{ marginTop: 56, borderRadius: 22, border: '1px solid var(--border)', background: 'var(--surface)', padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{lang === 'fr' ? 'Une autre question ?' : 'Another question?'}</h2>
          <p style={{ marginTop: 8, fontSize: 14.5, color: 'var(--text2)' }}>{lang === 'fr' ? "Parlons de votre projet d'automatisation." : "Let's talk about your automation project."}</p>
          <Link to="/contact" data-magnetic style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent2)', color: '#fff', borderRadius: 100, padding: '14px 26px', fontSize: 14.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 0 1px var(--accent2), 0 12px 40px -8px var(--glow)' }}>
            {lang === 'fr' ? 'Contactez-nous' : 'Contact us'} <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}
