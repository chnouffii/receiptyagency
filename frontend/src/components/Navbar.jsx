import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();
  const location = useLocation();

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/adn', label: t.nav.adn },
    { to: '/solutions', label: t.nav.solutions },
    { to: '/cases', label: t.nav.cases },
    { to: '/contact', label: t.nav.contact },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav data-testid="navbar" className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="font-heading text-xl font-bold text-white tracking-tight" data-testid="nav-logo">
          Receipty<span className="text-blue-500">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`nav-link-${link.to.replace('/', '') || 'home'}`}
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive(link.to) ? 'text-blue-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleLang}
            data-testid="lang-switcher"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang.toUpperCase()}
          </button>
          <Link
            to="/admin"
            data-testid="nav-admin-link"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
          >
            <Shield className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          className="md:hidden text-white"
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
            className="md:hidden mt-4 pb-4 border-t border-white/10"
          >
            <div className="flex flex-col gap-4 pt-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm ${isActive(link.to) ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                <button onClick={toggleLang} className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Globe className="w-4 h-4" /> {lang.toUpperCase()}
                </button>
                <Link to="/admin" onClick={() => setIsOpen(false)} className="text-sm text-gray-500">
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
