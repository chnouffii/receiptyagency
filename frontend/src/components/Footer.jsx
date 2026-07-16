import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const Footer = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const year = new Date().getFullYear();

  return (
    <footer 
      data-testid="footer" 
      className={`border-t transition-colors duration-300 ${
        isDark 
          ? 'border-white/5 bg-[#050505]' 
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <span className={`font-heading text-xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Receipty<span className="text-blue-500">.</span>
            </span>
            <p className={`mt-3 text-sm max-w-xs leading-relaxed ${
              isDark ? 'text-gray-500' : 'text-gray-600'
            }`}>{t.footer.tagline}</p>
          </div>
          <div className={`flex gap-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            <Link to="/adn" className={`transition-colors duration-200 ${
              isDark ? 'hover:text-gray-300' : 'hover:text-gray-900'
            }`}>{t.nav.adn}</Link>
            <Link to="/solutions" className={`transition-colors duration-200 ${
              isDark ? 'hover:text-gray-300' : 'hover:text-gray-900'
            }`}>{t.nav.solutions}</Link>
            <Link to="/faq" className={`transition-colors duration-200 ${
              isDark ? 'hover:text-gray-300' : 'hover:text-gray-900'
            }`}>FAQ</Link>
            <Link to="/contact" className={`transition-colors duration-200 ${
              isDark ? 'hover:text-gray-300' : 'hover:text-gray-900'
            }`}>{t.nav.contact}</Link>
          </div>
        </div>
        <div className={`mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${
          isDark ? 'border-white/5' : 'border-gray-200'
        }`}>
          <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
            &copy; {year} Receipty Agency. {t.footer.rights}
          </p>
          <div className={`flex gap-6 text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
            <Link to="/privacy" className={`transition-colors duration-200 ${
              isDark ? 'hover:text-gray-400' : 'hover:text-gray-700'
            }`}>{t.footer.privacy}</Link>
            <Link to="/terms" className={`transition-colors duration-200 ${
              isDark ? 'hover:text-gray-400' : 'hover:text-gray-700'
            }`}>{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
