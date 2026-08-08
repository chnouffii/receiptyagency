import { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useMotionSafe, riseItem, drawRule, VIEWPORT, EASE } from '../../lib/motionPresets';

/**
 * Compteur : le chiffre se construit à l'entrée dans le viewport.
 *
 * `fontVariantNumeric: tabular-nums` est indispensable — sans lui les
 * chiffres n'ont pas la même chasse et le nombre tressaute latéralement
 * pendant toute l'animation.
 */
function CountUp({ value, suffix, reduced }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  // Le signe est porté par la copie ('+340', '-45') : on l'extrait pour
  // n'animer que la magnitude, et on le réaffiche tel quel.
  const sign = value.startsWith('-') ? '-' : value.startsWith('+') ? '+' : '';
  const target = Math.abs(parseFloat(value)) || 0;
  const [display, setDisplay] = useState(reduced ? target : 0);

  useEffect(() => {
    if (!inView || reduced) return undefined;
    const controls = animate(0, target, {
      duration: 1.5,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target, reduced]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {sign}
      {display}
      <span style={{ color: 'var(--text3)' }}>{suffix}</span>
    </span>
  );
}

export default function Proof() {
  const { t } = useLanguage();
  const m = useMotionSafe();
  const copy = t.home.proof;

  return (
    <section
      style={{
        // Fond légèrement décollé du reste de la page : le bloc de preuve est
        // le seul à changer de valeur, ce qui suffit à l'isoler sans encadré.
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: 'clamp(80px,10vw,140px) 24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.header
          variants={m.container(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          style={{ marginBottom: 'clamp(48px,6vw,80px)', maxWidth: 640 }}
        >
          <motion.p variants={m.v(riseItem(14, 0.5))} style={{ margin: '0 0 20px' }}>
            <span className="rule-label">{copy.label}</span>
          </motion.p>
          <motion.h2
            variants={m.v(riseItem(22))}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(2rem,4.2vw,3.25rem)',
              fontWeight: 700,
              letterSpacing: '-.03em',
              lineHeight: 1.05,
              margin: 0,
              color: 'var(--text)',
            }}
          >
            {copy.title}
          </motion.h2>
          <motion.p
            variants={m.v(riseItem(18))}
            style={{ margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.7, color: 'var(--text2)' }}
          >
            {copy.lead}
          </motion.p>
        </motion.header>

        {/* Les résultats en lignes plutôt qu'en cartes : le chiffre occupe la
            moitié gauche à une taille que rien d'autre sur la page n'atteint,
            l'intitulé et le contexte suivent en corps courant. L'indentation
            croissante crée une diagonale de lecture. */}
        <motion.ol
          variants={m.container(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          {copy.stats.map((stat, i) => (
            <motion.li key={stat.label} variants={m.v(riseItem(28))}>
              <motion.span
                aria-hidden="true"
                variants={m.v(drawRule())}
                style={{ display: 'block', height: 1, background: 'var(--border)', transformOrigin: 'left' }}
              />
              <div
                className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-3 items-baseline"
                style={{
                  padding: 'clamp(28px,3.4vw,44px) 0',
                  // Décalage progressif — désactivé sous md, où l'indentation
                  // grignoterait la largeur de lecture.
                  paddingLeft: `min(${i * 3}vw, 96px)`,
                }}
              >
                {/* `minWidth: 0` : sans lui une cellule de grille prend pour
                    largeur minimale celle de son contenu, et un nombre de
                    cette taille déborde sur la colonne de l'intitulé au lieu
                    de la repousser. */}
                <div className="md:col-span-6" style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 'clamp(3rem,6vw,4.75rem)',
                      fontWeight: 800,
                      letterSpacing: '-.05em',
                      lineHeight: 0.9,
                      color: 'var(--text)',
                      display: 'block',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CountUp value={stat.value} suffix={stat.suffix} reduced={m.reduced} />
                  </span>
                </div>
                <p
                  className="md:col-span-3"
                  style={{
                    margin: 0,
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 'clamp(1.05rem,1.6vw,1.35rem)',
                    fontWeight: 600,
                    letterSpacing: '-.015em',
                    color: 'var(--text)',
                  }}
                >
                  {stat.label}
                </p>
                <p className="md:col-span-3" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text3)' }}>
                  {stat.detail}
                </p>
              </div>
            </motion.li>
          ))}
          <motion.span
            aria-hidden="true"
            variants={m.v(drawRule())}
            style={{ display: 'block', height: 1, background: 'var(--border)', transformOrigin: 'left' }}
          />
        </motion.ol>

        {/* Citation en pied, calée à droite pour clore la diagonale ouverte
            par l'indentation des chiffres. */}
        <motion.figure
          variants={m.container(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="md:ml-auto"
          style={{ margin: 'clamp(48px,6vw,80px) 0 0', maxWidth: 620 }}
        >
          <motion.blockquote
            variants={m.v(riseItem(22))}
            style={{
              margin: 0,
              paddingLeft: 24,
              borderLeft: '1px solid var(--border2)',
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(1.25rem,2.4vw,1.75rem)',
              fontWeight: 500,
              lineHeight: 1.35,
              letterSpacing: '-.02em',
              color: 'var(--text2)',
            }}
          >
            {copy.quote}
          </motion.blockquote>
          <motion.div variants={m.v(riseItem(16))} style={{ marginTop: 26, paddingLeft: 25 }}>
            <Link
              to="/cases"
              className="group"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 44,
                fontSize: 14.5,
                fontWeight: 600,
                color: 'var(--text)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border2)',
              }}
            >
              {copy.cta}
              <ArrowUpRight
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                style={{ width: 16, height: 16 }}
              />
            </Link>
          </motion.div>
        </motion.figure>
      </div>
    </section>
  );
}
