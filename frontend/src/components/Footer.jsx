import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer data-testid="footer" className="border-t border-white/5 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <span className="font-heading text-xl font-bold text-white tracking-tight">
              Receipty<span className="text-blue-500">.</span>
            </span>
            <p className="mt-3 text-sm text-gray-500 max-w-xs leading-relaxed">{t.footer.tagline}</p>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link to="/adn" className="hover:text-gray-300 transition-colors duration-200">{t.nav.adn}</Link>
            <Link to="/solutions" className="hover:text-gray-300 transition-colors duration-200">{t.nav.solutions}</Link>
            <Link to="/contact" className="hover:text-gray-300 transition-colors duration-200">{t.nav.contact}</Link>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">&copy; {year} Receipty Agency. {t.footer.rights}</p>
          <div className="flex gap-6 text-xs text-gray-600">
            <Link to="/privacy" className="hover:text-gray-400 transition-colors duration-200">{t.footer.privacy}</Link>
            <Link to="/terms" className="hover:text-gray-400 transition-colors duration-200">{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
