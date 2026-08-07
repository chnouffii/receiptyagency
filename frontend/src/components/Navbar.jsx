import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Shield, Sun, Moon, Calculator, Building } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/solutions', label: t.nav.solutions },
    { to: '/cases', label: t.nav.cases },
    { to: '/adn', label: t.nav.adn },
    { to: '/contact', label: t.nav.contact },
  ];

  const isActive = (path) => location.pathname === path;

  const pill = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    borderRadius: 100, fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
    border: '1px solid var(--border)', color: 'var(--text2)', background: 'transparent',
    cursor: 'pointer', transition: 'color .2s, border-color .2s, background .2s',
  };
  const pillActive = { ...pill, color: 'var(--accent)', borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)' };

  return (
    <nav
      data-testid="navbar"
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ background: 'var(--navbg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)' }}
        >
          Receipty<span style={{ color: 'var(--accent)' }}>.</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`nav-link-${link.to.replace('/', '') || 'home'}`}
              style={{ fontSize: 14, fontWeight: 500, color: isActive(link.to) ? 'var(--accent)' : 'var(--text2)', transition: 'color .2s' }}
              onMouseEnter={(e) => { if (!isActive(link.to)) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { if (!isActive(link.to)) e.currentTarget.style.color = 'var(--text2)'; }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle"
            title={isDark ? 'Mode clair' : 'Mode sombre'}
            style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer' }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button onClick={toggleLang} data-testid="lang-switcher" style={pill}>
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

          <Link to="/admin" data-testid="nav-admin-link" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text3)', padding: 6 }} title="Admin">
            <Shield className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          className="md:hidden"
          style={{ color: 'var(--text)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => setIsOpen(!isOpen)}
          data-testid="mobile-menu-toggle"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="flex flex-col gap-4 pt-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  style={{ fontSize: 14, color: isActive(link.to) ? 'var(--accent)' : 'var(--text2)' }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center flex-wrap gap-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={toggleTheme} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text2)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? 'Clair' : 'Sombre'}
                </button>
                <button onClick={toggleLang} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text2)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Globe className="w-4 h-4" /> {lang.toUpperCase()}
                </button>
                <Link to="/roi" onClick={() => setIsOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text2)' }}>
                  <Calculator className="w-4 h-4" /> ROI
                </Link>
                <Link to="/client" onClick={() => setIsOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text2)' }}>
                  <Building className="w-4 h-4" /> {lang === 'fr' ? 'Client' : 'Client'}
                </Link>
                <Link to="/admin" onClick={() => setIsOpen(false)} style={{ color: 'var(--text3)' }}>
                  <Shield className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
