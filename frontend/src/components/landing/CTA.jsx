import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useMotionSafe, riseItem, VIEWPORT } from '../../lib/motionPresets';

/**
 * Bloc de conversion final. Asymétrique lui aussi : l'accroche tient sept
 * colonnes à gauche, les actions se calent à droite en bas de bloc. Le
 * classique « titre centré + gros bouton » est ce qui fait qu'un pied de
 * landing ressemble à tous les autres.
 */
export default function CTA() {
  const { t } = useLanguage();
  const m = useMotionSafe();
  const copy = t.home.cta;

  return (
    <section style={{ background: 'var(--bg)', padding: '0 24px clamp(80px,10vw,140px)' }}>
      <motion.div
        variants={m.container(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        style={{
          position: 'relative',
          overflow: 'hidden',
          maxWidth: 1200,
          margin: '0 auto',
          borderRadius: 28,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: 'clamp(40px,6vw,80px)',
        }}
      >
        {/* Nappe unique en bas à droite, sous le bloc d'action : elle attire
            l'œil vers le bouton au lieu de décorer le fond au hasard. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(700px 420px at 88% 108%, var(--glow), transparent 70%)',
          }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-end">
          <div className="lg:col-span-7">
            <motion.p variants={m.v(riseItem(14, 0.5))} style={{ margin: '0 0 20px' }}>
              <span className="rule-label">{copy.label}</span>
            </motion.p>
            <motion.h2
              variants={m.v(riseItem(24))}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 'clamp(2rem,4.6vw,3.5rem)',
                fontWeight: 700,
                letterSpacing: '-.035em',
                lineHeight: 1.03,
                margin: 0,
                color: 'var(--text)',
                textWrap: 'balance',
              }}
            >
              {copy.title}
            </motion.h2>
            <motion.p
              variants={m.v(riseItem(20))}
              style={{ margin: '22px 0 0', maxWidth: 540, fontSize: 15.5, lineHeight: 1.7, color: 'var(--text2)' }}
            >
              {copy.lead}
            </motion.p>
          </div>

          <motion.div variants={m.v(riseItem(24))} className="lg:col-span-5 lg:col-start-8">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <motion.div whileHover={m.hover({ y: -2 })} whileTap={m.hover({ y: 0, scale: 0.985 })}>
                <Link
                  to="/contact"
                  data-testid="cta-primary"
                  className="group"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    minHeight: 52,
                    padding: '0 26px',
                    borderRadius: 12,
                    background: 'var(--text)',
                    color: 'var(--bg)',
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  {copy.primary}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    style={{ width: 17, height: 17 }}
                  />
                </Link>
              </motion.div>

              <motion.div whileHover={m.hover({ y: -2 })} whileTap={m.hover({ y: 0, scale: 0.985 })}>
                <Link
                  to="/quote"
                  data-testid="cta-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 52,
                    padding: '0 24px',
                    borderRadius: 12,
                    border: '1px solid var(--border2)',
                    color: 'var(--text)',
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background .25s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {copy.secondary}
                </Link>
              </motion.div>
            </div>
            <p style={{ margin: '20px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--text3)' }}>{copy.note}</p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
