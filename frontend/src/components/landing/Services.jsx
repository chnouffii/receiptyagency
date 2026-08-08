import { motion } from 'framer-motion';
import { Brain, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useMotionSafe, riseItem, VIEWPORT } from '../../lib/motionPresets';

const ICONS = [Brain, Zap, TrendingUp, ShieldCheck];

/**
 * Composition volontairement inégale : une carte principale haute à gauche,
 * deux cartes courtes empilées à droite, une bande large en pied. Trois
 * colonnes identiques donnent une page qui se lit d'un seul coup d'œil, donc
 * qu'on ne lit pas — l'inégalité des surfaces impose un ordre de lecture.
 *
 *   md ≥ :  ┌───────────┬─────┐
 *           │           │  2  │
 *           │     1     ├─────┤
 *           │           │  3  │
 *           ├───────────┴─────┤
 *           │        4        │
 *           └─────────────────┘
 */
const SPANS = [
  'md:col-span-7 md:row-span-2',
  'md:col-span-5',
  'md:col-span-5',
  'md:col-span-12',
];

function ServiceCard({ item, index, m }) {
  const Icon = ICONS[index] || Brain;
  const wide = index === 3;
  const tall = index === 0;

  return (
    <motion.article
      variants={m.v(riseItem(24))}
      data-testid={`feature-card-${index}`}
      whileHover={m.hover({ y: -4 })}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`${SPANS[index] || 'md:col-span-6'} group relative flex flex-col overflow-hidden`}
      style={{
        borderRadius: 20,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: 'clamp(24px,3vw,36px)',
        transition: 'border-color .3s ease, background .3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border2)';
        e.currentTarget.style.background = 'var(--surface2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--surface)';
      }}
    >
      {/* Filet d'accent qui se déploie depuis la gauche au survol. Une seule
          couleur, deux pixels, aucun halo : l'accent se remarque parce qu'il
          est rare, pas parce qu'il brille. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-px w-full origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
        style={{ background: 'linear-gradient(90deg,var(--accent),transparent)' }}
      />

      <div
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: tall ? 32 : 22,
        }}
      >
        <Icon aria-hidden="true" style={{ width: 19, height: 19, color: 'var(--text2)' }} />
      </div>

      <h3
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: tall ? 'clamp(1.5rem,2.4vw,2rem)' : 19,
          fontWeight: 700,
          letterSpacing: '-.02em',
          margin: '0 0 12px',
          color: 'var(--text)',
        }}
      >
        {item.title}
      </h3>

      <p
        style={{
          margin: 0,
          maxWidth: wide ? 620 : 460,
          fontSize: tall ? 16 : 14.5,
          lineHeight: 1.65,
          color: 'var(--text2)',
        }}
      >
        {item.desc}
      </p>

      {item.points?.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            margin: 'auto 0 0',
            padding: tall ? '32px 0 0' : '20px 0 0',
          }}
        >
          {item.points.map((p) => (
            <li
              key={p}
              style={{
                padding: '5px 11px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                fontSize: 12.5,
                fontWeight: 500,
                color: 'var(--text3)',
              }}
            >
              {p}
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  );
}

export default function Services() {
  const { t } = useLanguage();
  const m = useMotionSafe();
  const copy = t.home.services;

  return (
    <section style={{ background: 'var(--bg)', padding: 'clamp(80px,10vw,140px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* En-tête décalé : intitulé et titre à gauche, chapeau à droite en
            colonne étroite. Un titre centré au-dessus d'une grille centrée est
            exactement le rythme qu'on cherche à casser. */}
        <motion.header
          variants={m.container(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6 items-end"
          style={{ marginBottom: 'clamp(40px,5vw,64px)' }}
        >
          <div className="lg:col-span-7">
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
          </div>
          <motion.p
            variants={m.v(riseItem(22))}
            className="lg:col-span-4 lg:col-start-9"
            style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7, color: 'var(--text2)' }}
          >
            {copy.lead}
          </motion.p>
        </motion.header>

        <motion.div
          variants={m.container(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="grid grid-cols-1 md:grid-cols-12 md:auto-rows-fr gap-4"
        >
          {copy.items.map((item, i) => (
            <ServiceCard key={item.title} item={item} index={i} m={m} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
