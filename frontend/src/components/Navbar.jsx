import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Shield, Sun, Moon, Calculator, Building } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useMotionSafe, EASE } from '../lib/motionPresets';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { lang, toggleLang, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const m = useMotionSafe();

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/solutions', label: t.nav.solutions },
    { to: '/cases', label: t.nav.cases },
    { to: '/adn', label: t.nav.adn },
    { to: '/contact', label: t.nav.contact },
  ];

  const isActive = (path) => location.pathname === path;

  // Au repos la barre est transparente et se fond dans le héros ; elle ne
  // prend son fond flouté et son filet qu'une fois le défilement engagé.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Le menu mobile ouvert verrouille le défilement de la page : sinon le
  // fond continue de glisser sous le panneau.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  // Fermer le menu à chaque navigation, y compris via les boutons du
  // navigateur — sinon il reste ouvert par-dessus la page d'arrivée.
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const pill = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    // WCAG 2.5.5 : 44px de haut minimum. Le padding vertical reste visuellement
    // discret, c'est `minHeight` qui agrandit la zone cliquable.
    minHeight: 44, padding: '6px 12px',
    borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: 'none',
    border: '1px solid var(--border)', color: 'var(--text2)', background: 'transparent',
    cursor: 'pointer', transition: 'color .2s, border-color .2s, background .2s',
  };
  // --accent-text est la déclinaison du bleu lisible sur le fond de chaque
  // thème (--accent échouait en clair, --accent2 en sombre).
  const pillActive = { ...pill, color: 'var(--accent-text)', borderColor: 'var(--border2)', background: 'var(--surface2)' };

  const mobileItem = {
    hidden: { opacity: 0, y: 14 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.045, duration: 0.45, ease: EASE } }),
  };

  const barLit = scrolled || isOpen;
  // Menu mobile ouvert : fond pleinement opaque. Le `--navbg` translucide
  // convient à une barre de 60px de haut, pas à un panneau qui couvre la
  // moitié de l'écran — le texte de la page se lisait au travers.
  const barBackground = isOpen ? 'var(--bg)' : (scrolled ? 'var(--navbg)' : 'transparent');

  return (
    <nav
      data-testid="navbar"
      aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'}
      className="fixed top-0 left-0 right-0 z-50 px-6"
      style={{
        paddingTop: 14,
        paddingBottom: 14,
        background: barBackground,
        borderBottom: `1px solid ${barLit ? 'var(--border)' : 'transparent'}`,
        backdropFilter: barLit ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: barLit ? 'blur(16px)' : 'none',
        transition: 'background .35s ease, border-color .35s ease',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-.04em', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
        >
          Receipty<span style={{ color: 'var(--accent-text)' }}>.</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`nav-link-${link.to.replace('/', '') || 'home'}`}
              className="group relative"
              style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 14, fontWeight: 500, color: isActive(link.to) ? 'var(--text)' : 'var(--text2)', transition: 'color .2s' }}
              onMouseEnter={(e) => { if (!isActive(link.to)) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { if (!isActive(link.to)) e.currentTarget.style.color = 'var(--text2)'; }}
            >
              {link.label}
              {/* Soulignement au trait : il se déploie au survol et reste
                  déployé sur la page courante. L'état actif ne repose donc pas
                  sur la seule couleur (WCAG 1.4.1). */}
              <span
                aria-hidden="true"
                className={`absolute bottom-1.5 left-0 h-px w-full origin-left transition-transform duration-300 ease-out ${isActive(link.to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                style={{ background: 'var(--border2)' }}
              />
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle"
            title={isDark ? 'Mode clair' : 'Mode sombre'}
            aria-label={isDark ? (lang === 'fr' ? 'Passer en mode clair' : 'Switch to light mode') : (lang === 'fr' ? 'Passer en mode sombre' : 'Switch to dark mode')}
            style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button onClick={toggleLang} data-testid="lang-switcher" aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'} style={pill}>
            <Globe className="w-3.5 h-3.5" />
            {lang.toUpperCase()}
          </button>

          <Link to="/roi" data-testid="nav-roi-link" style={isActive('/roi') ? pillActive : pill}>
            <Calculator className="w-3.5 h-3.5" />
            ROI
          </Link>

          <Link to="/client" data-testid="nav-client-link" style={(isActive('/client') || isActive('/client/dashboard')) ? pillActive : pill}>
            <Building className="w-3.5 h-3.5" />
            {lang === 'fr' ? 'Espace Client' : 'Client Portal'}
          </Link>

          <Link to="/admin" data-testid="nav-admin-link" aria-label={lang === 'fr' ? 'Espace administration' : 'Admin area'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', width: 44, height: 44 }} title="Admin">
            <Shield className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          // `display` doit rester piloté par les classes : `flex md:hidden`.
          // Un `display: flex` en style inline écraserait `md:hidden` — les
          // styles inline battent les classes — et le hamburger réapparaîtrait
          // sur desktop, à côté du menu complet.
          className="flex md:hidden items-center justify-center"
          style={{ color: 'var(--text)', background: 'transparent', border: 'none', cursor: 'pointer', width: 44, height: 44 }}
          onClick={() => setIsOpen(!isOpen)}
          data-testid="mobile-menu-toggle"
          aria-label={isOpen ? (lang === 'fr' ? 'Fermer le menu' : 'Close menu') : (lang === 'fr' ? 'Ouvrir le menu' : 'Open menu')}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
        >
          {/* Bascule hamburger/croix par rotation croisée : `mode="wait"` pour
              que la sortante finisse avant que l'entrante démarre, sinon les
              deux icônes se superposent une fraction de seconde. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isOpen ? 'close' : 'open'}
              initial={m.reduced ? false : { opacity: 0, rotate: -60 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={m.reduced ? undefined : { opacity: 0, rotate: 60 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav"
            className="md:hidden"
            initial={m.reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={m.reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={m.reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="flex flex-col"
              style={{ marginTop: 14, paddingTop: 18, paddingBottom: 10, borderTop: '1px solid var(--border)' }}
            >
              {/* Les entrées mobiles sont composées en Syne, grandes et
                  numérotées : sur un panneau plein écran, une liste de liens
                  de 14px reproduit la barre desktop en plus petit au lieu de
                  tirer parti de la place disponible. */}
              {links.map((link, i) => (
                <motion.div key={link.to} custom={i} variants={mobileItem} initial="hidden" animate="show">
                  <Link
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 12,
                      minHeight: 52,
                      paddingTop: 8,
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 26,
                      fontWeight: 700,
                      letterSpacing: '-.03em',
                      color: isActive(link.to) ? 'var(--text)' : 'var(--text2)',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                custom={links.length}
                variants={mobileItem}
                initial="hidden"
                animate="show"
                className="flex items-center flex-wrap gap-5"
                style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}
              >
                <button onClick={toggleTheme} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, gap: 7, fontSize: 14, color: 'var(--text2)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? 'Clair' : 'Sombre'}
                </button>
                <button onClick={toggleLang} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, gap: 7, fontSize: 14, color: 'var(--text2)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Globe className="w-4 h-4" /> {lang.toUpperCase()}
                </button>
                <Link to="/roi" onClick={() => setIsOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, gap: 7, fontSize: 14, color: 'var(--text2)' }}>
                  <Calculator className="w-4 h-4" /> ROI
                </Link>
                <Link to="/client" onClick={() => setIsOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, gap: 7, fontSize: 14, color: 'var(--text2)' }}>
                  <Building className="w-4 h-4" /> {lang === 'fr' ? 'Client' : 'Client'}
                </Link>
                <Link to="/admin" onClick={() => setIsOpen(false)} aria-label={lang === 'fr' ? 'Espace administration' : 'Admin area'} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text3)', minHeight: 44, minWidth: 44, justifyContent: 'center' }}>
                  <Shield className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
