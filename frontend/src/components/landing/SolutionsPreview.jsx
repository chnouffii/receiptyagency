import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useMotionSafe, riseItem, VIEWPORT } from '../../lib/motionPresets';

/**
 * Les trois solutions en bandes pleine largeur plutôt qu'en cartes.
 *
 * Une rangée de trois cartes met les trois offres sur un pied d'égalité
 * absolue et n'aide personne à choisir. En lignes numérotées, l'œil descend,
 * lit un titre à la fois, et la surface disponible permet enfin d'écrire une
 * phrase utile à côté de chaque nom.
 */
function SolutionRow({ item, m }) {
  return (
    <motion.div variants={m.v(riseItem(24))}>
      <Link
        to="/solutions"
        data-testid={`landing-solution-${item.index}`}
        className="group block"
        style={{
          position: 'relative',
          display: 'block',
          borderTop: '1px solid var(--border)',
          textDecoration: 'none',
          transition: 'background .35s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 items-center"
          style={{ padding: 'clamp(26px,3.2vw,40px) clamp(0px,1.5vw,20px)' }}
        >
          <span
            className="md:col-span-1"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.08em',
              color: 'var(--text3)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {item.index}
          </span>

          <h3
            className="md:col-span-4 transition-transform duration-500 ease-out md:group-hover:translate-x-1.5"
            style={{
              margin: 0,
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(1.35rem,2.8vw,2.1rem)',
              fontWeight: 700,
              letterSpacing: '-.03em',
              color: 'var(--text)',
            }}
          >
            {item.name}
          </h3>

          <span
            className="md:col-span-2"
            style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text3)' }}
          >
            {item.tag}
          </span>

          <p className="md:col-span-4" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--text2)' }}>
            {item.desc}
          </p>

          <span
            aria-hidden="true"
            className="hidden md:flex md:col-span-1 justify-end opacity-0 -translate-x-2 transition-all duration-400 ease-out group-hover:opacity-100 group-hover:translate-x-0"
            style={{ color: 'var(--text)' }}
          >
            <ArrowRight style={{ width: 20, height: 20 }} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SolutionsPreview() {
  const { t } = useLanguage();
  const m = useMotionSafe();
  const copy = t.home.solutions;

  return (
    <section style={{ background: 'var(--bg)', padding: 'clamp(80px,10vw,140px) 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.header
          variants={m.container(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6 items-end"
          style={{ marginBottom: 'clamp(36px,4.5vw,56px)' }}
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
          variants={m.container(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {copy.items.map((item) => (
            <SolutionRow key={item.index} item={item} m={m} />
          ))}
        </motion.div>

        <motion.div
          initial={m.reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ marginTop: 32 }}
        >
          <Link
            to="/solutions"
            className="group"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--text2)',
              textDecoration: 'none',
              transition: 'color .25s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text2)'; }}
          >
            {copy.cta}
            <ArrowRight
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
              style={{ width: 16, height: 16 }}
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
