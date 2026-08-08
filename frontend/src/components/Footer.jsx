import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useMotionSafe, riseItem, VIEWPORT } from '../lib/motionPresets';

/**
 * Pied de page éditorial : la marque tient une colonne large à gauche, les
 * liens se rangent en deux colonnes thématiques à droite. Le rang unique de
 * liens alignés de l'ancienne version ne hiérarchisait rien — « Contact » et
 * « FAQ » y pesaient exactement le même poids.
 */
export const Footer = () => {
  const { t, lang } = useLanguage();
  const m = useMotionSafe();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: lang === 'fr' ? 'Agence' : 'Agency',
      links: [
        { to: '/adn', label: t.nav.adn },
        { to: '/solutions', label: t.nav.solutions },
        { to: '/cases', label: t.nav.cases },
      ],
    },
    {
      title: lang === 'fr' ? 'Démarrer' : 'Get started',
      links: [
        { to: '/contact', label: t.nav.contact },
        { to: '/quote', label: t.footer.budget },
        { to: '/roi', label: lang === 'fr' ? 'Calculateur de ROI' : 'ROI calculator' },
        { to: '/faq', label: 'FAQ' },
      ],
    },
  ];

  // WCAG 2.5.5 : 44px de zone cliquable. `inline-flex` + `minHeight` agrandit
  // la cible sans modifier l'apparence du lien.
  const linkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 44,
    fontSize: 14.5,
    color: 'var(--text2)',
    textDecoration: 'none',
    transition: 'color .2s',
  };
  const hover = (e) => { e.currentTarget.style.color = 'var(--text)'; };
  const unhover = (e) => { e.currentTarget.style.color = 'var(--text2)'; };

  return (
    <footer data-testid="footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
      <motion.div
        variants={m.container(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="max-w-7xl mx-auto px-6"
        style={{ paddingTop: 'clamp(56px,7vw,88px)', paddingBottom: 32 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-14">
          <motion.div variants={m.v(riseItem(20))} className="lg:col-span-5">
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: '-.04em', color: 'var(--text)' }}>
              Receipty<span style={{ color: 'var(--accent-text)' }}>.</span>
            </span>
            <p style={{ marginTop: 14, fontSize: 15, maxWidth: 320, lineHeight: 1.65, color: 'var(--text2)' }}>
              {t.footer.tagline}
            </p>

            <Link
              to="/contact"
              className="group"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 26,
                minHeight: 44,
                fontFamily: "'Syne', sans-serif",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: 'var(--text)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border2)',
              }}
            >
              {t.hero.cta}
              <ArrowUpRight
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                style={{ width: 17, height: 17 }}
              />
            </Link>
          </motion.div>

          {columns.map((col) => (
            <motion.nav
              key={col.title}
              variants={m.v(riseItem(20))}
              aria-label={col.title}
              className="lg:col-span-3"
            >
              <p style={{ margin: '0 0 8px' }}>
                <span className="rule-label">{col.title}</span>
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
          style={{ marginTop: 'clamp(48px,6vw,72px)', paddingTop: 24, borderTop: '1px solid var(--border)' }}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text3)' }}>
            &copy; {year} Receipty Agency. {t.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy" style={{ ...linkStyle, fontSize: 12.5, color: 'var(--text3)' }} onMouseEnter={hover} onMouseLeave={unhover}>
              {t.footer.privacy}
            </Link>
            <Link to="/terms" style={{ ...linkStyle, fontSize: 12.5, color: 'var(--text3)' }} onMouseEnter={hover} onMouseLeave={unhover}>
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};
