import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useMotionSafe, riseItem, VIEWPORT, EASE } from '../../lib/motionPresets';

/**
 * FAQ en accordéon au trait, sans encadré par question : les cartes
 * empilées fabriquent une échelle de gris parasite qui concurrence le reste
 * de la page. Un filet horizontal suffit à séparer deux questions.
 */
function FaqItem({ question, answer, index, m }) {
  const [open, setOpen] = useState(false);
  const panelId = `home-faq-panel-${index}`;
  const buttonId = `home-faq-button-${index}`;

  return (
    <motion.div variants={m.v(riseItem(18))} style={{ borderTop: '1px solid var(--border)' }}>
      <button
        id={buttonId}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          minHeight: 44,
          padding: '24px 0',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: open ? 'var(--text)' : 'var(--text2)',
          transition: 'color .25s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = 'var(--text2)'; }}
      >
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 'clamp(1rem,1.6vw,1.15rem)', letterSpacing: '-.015em' }}>
          {question}
        </span>
        {/* Un « + » qui pivote en « × » : la rotation dit l'état ouvert sans
            recourir à une seconde icône. */}
        <Plus
          aria-hidden="true"
          className={open ? 'rotate-45' : ''}
          style={{ width: 20, height: 20, flexShrink: 0, color: 'var(--text3)', transition: 'transform .35s cubic-bezier(.16,1,.3,1)' }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ margin: 0, padding: '0 0 26px', maxWidth: 640, fontSize: 15, lineHeight: 1.7, color: 'var(--text2)' }}>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Faq({ faqs }) {
  const { t, lang } = useLanguage();
  const m = useMotionSafe();

  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return (
    <section
      style={{
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        padding: 'clamp(80px,10vw,140px) 24px',
      }}
    >
      <div
        style={{ maxWidth: 1200, margin: '0 auto' }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10"
      >
        {/* Titre en colonne fixe à gauche, questions à droite : la lecture
            garde son repère pendant qu'on déroule l'accordéon. */}
        <motion.header
          variants={m.container(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="lg:col-span-4"
        >
          <motion.p variants={m.v(riseItem(14, 0.5))} style={{ margin: '0 0 20px' }}>
            <span className="rule-label">FAQ</span>
          </motion.p>
          <motion.h2
            variants={m.v(riseItem(22))}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(1.85rem,3.4vw,2.75rem)',
              fontWeight: 700,
              letterSpacing: '-.03em',
              lineHeight: 1.05,
              margin: 0,
              color: 'var(--text)',
            }}
          >
            {t.faq.title}
          </motion.h2>
          <motion.p
            variants={m.v(riseItem(18))}
            style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.7, color: 'var(--text2)' }}
          >
            {t.faq.subtitle}
          </motion.p>
        </motion.header>

        <motion.div
          variants={m.container(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="lg:col-span-7 lg:col-start-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {faqs.map((faq, i) => (
            <FaqItem
              key={faq.id}
              index={i}
              m={m}
              question={lang === 'fr' ? faq.question_fr : (faq.question_en || faq.question_fr)}
              answer={lang === 'fr' ? faq.answer_fr : (faq.answer_en || faq.answer_fr)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
