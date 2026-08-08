import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useMotionSafe, riseItem, slideItem, VIEWPORT } from '../../lib/motionPresets';

/**
 * Bandeau défilant des références. Masqué en dégradé sur les deux bords pour
 * que les noms n'apparaissent pas tranchés au ras du conteneur.
 */
function TrustedMarquee({ companies }) {
  if (!companies || companies.length === 0) return null;
  const items = [...companies, ...companies, ...companies];
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)',
        maskImage: 'linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)',
      }}
    >
      <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 38s linear infinite' }}>
        {items.map((name, i) => (
          <span
            key={`${name}-${i}`}
            style={{
              flexShrink: 0,
              padding: '0 30px',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: '-.01em',
              color: 'var(--text3)',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Panneau de droite : la chaîne de traitement, en quatre lignes séparées au
 * trait. C'est ce qui remplace l'illustration abstraite habituelle — un
 * visuel qui dit ce que fait l'agence plutôt qu'un dégradé décoratif.
 */
function PipelinePanel({ label, steps, m }) {
  return (
    <motion.div
      variants={m.v(slideItem(28))}
      style={{
        position: 'relative',
        border: '1px solid var(--border)',
        borderRadius: 20,
        background: 'var(--surface)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
        <span className="rule-label">{label}</span>
      </div>

      <motion.ul
        variants={m.container(0.09, 0.15)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {steps.map((s, i) => (
          <motion.li
            key={s.step}
            variants={m.v(riseItem(14, 0.55))}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 16,
              alignItems: 'baseline',
              padding: '18px 22px',
              // Pas de bordure sur la dernière ligne : elle doublerait le
              // bord du panneau.
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '.06em',
                color: 'var(--accent-text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.step}
            </span>
            <span>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
              <span style={{ display: 'block', marginTop: 3, fontSize: 13.5, lineHeight: 1.5, color: 'var(--text3)' }}>
                {s.detail}
              </span>
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

export default function Hero({ trustedCompanies }) {
  const { t } = useLanguage();
  const m = useMotionSafe();

  const pipeline = t.hero.pipeline || [];

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
        padding: '150px 24px 0',
      }}
    >
      {/* Fond : une seule nappe radiale très basse en opacité, décalée en haut
          à gauche pour accompagner la lecture du titre — pas de « blobs »
          multicolores flottants, qui sont la signature visuelle du SaaS
          générique et brouillent la hiérarchie. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(900px 520px at 18% -8%, var(--glow), transparent 68%)',
        }}
      />
      {/* Grille au trait, masquée pour se dissoudre avant les bords. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: 0.6,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
          backgroundSize: '88px 88px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 30% 25%,#000 10%,transparent 70%)',
          maskImage: 'radial-gradient(ellipse 80% 55% at 30% 25%,#000 10%,transparent 70%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
        {/* Composition asymétrique 7/5 : le titre n'est pas centré, il tient
            la colonne de gauche et le panneau lui répond en décalé. */}
        <motion.div
          variants={m.container(0.1)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-16 items-center"
        >
          <div className="lg:col-span-7">
            <motion.div
              variants={m.v(riseItem(16, 0.6))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 14px 7px 12px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 12.5,
                fontWeight: 500,
                color: 'var(--text2)',
                marginBottom: 30,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'pulse 2.4s ease-in-out infinite',
                }}
              />
              {t.hero.badge}
            </motion.div>

            {/* Contraste de graisse dans le titre : le sujet en 400, la
                promesse en 800. Deux tailles auraient cassé la ligne de base ;
                la graisse porte la hiérarchie sans casser le bloc. */}
            <motion.h1
              variants={m.v(riseItem(26, 0.85))}
              style={{
                fontFamily: "'Syne', sans-serif",
                // Syne ExtraBold est très chassée : la seconde ligne se casse
                // de toute façon dans les 7 colonnes de gauche. Plutôt que de
                // rapetisser le titre pour l'y forcer, on assume l'empilement
                // et on prend la taille — c'est le seul bloc de la page qui a
                // le droit d'occuper cette échelle.
                fontSize: 'clamp(2.6rem,5.6vw,4.75rem)',
                lineHeight: 1.02,
                letterSpacing: '-.035em',
                margin: 0,
                color: 'var(--text)',
                textWrap: 'balance',
              }}
            >
              <span style={{ display: 'block', fontWeight: 400, color: 'var(--text2)' }}>
                {t.hero.title_lead}
              </span>
              <span style={{ display: 'block', fontWeight: 800 }}>{t.hero.title_accent}</span>
            </motion.h1>

            <motion.p
              variants={m.v(riseItem(20, 0.7))}
              style={{
                margin: '28px 0 0',
                maxWidth: 520,
                fontSize: 'clamp(1rem,1.4vw,1.15rem)',
                lineHeight: 1.65,
                color: 'var(--text2)',
              }}
            >
              {t.hero.subtitle}
            </motion.p>

            <motion.div
              variants={m.v(riseItem(20, 0.7))}
              style={{ marginTop: 38, display: 'flex', flexWrap: 'wrap', gap: 12 }}
            >
              <motion.div whileHover={m.hover({ y: -2 })} whileTap={m.hover({ y: 0, scale: 0.985 })}>
                <Link
                  to="/contact"
                  data-testid="hero-cta-button"
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
                    transition: 'box-shadow .3s ease',
                  }}
                >
                  {t.hero.cta}
                  <ArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    style={{ width: 17, height: 17 }}
                    aria-hidden="true"
                  />
                </Link>
              </motion.div>

              <motion.div whileHover={m.hover({ y: -2 })} whileTap={m.hover({ y: 0, scale: 0.985 })}>
                <Link
                  to="/cases"
                  data-testid="hero-secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 52,
                    padding: '0 24px',
                    borderRadius: 12,
                    border: '1px solid var(--border2)',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background .25s ease, border-color .25s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {t.nav.cases}
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <PipelinePanel label={t.hero.pipeline_label} steps={pipeline} m={m} />
          </div>
        </motion.div>

        {/* Bande de confiance : séparée au trait, en bas de la section, pour
            fermer le bloc plutôt que de flotter au milieu. */}
        <motion.div
          initial={m.reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ marginTop: 'clamp(56px,6.5vw,92px)', paddingTop: 30, paddingBottom: 34, borderTop: '1px solid var(--border)' }}
        >
          <p style={{ margin: '0 0 22px' }}>
            <span className="rule-label">{t.hero.trusted}</span>
          </p>
          <TrustedMarquee companies={trustedCompanies} />
        </motion.div>
      </div>
    </section>
  );
}
