import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const linkStyle = { color: 'var(--text2)', fontSize: 14, transition: 'color .2s', textDecoration: 'none' };
  const hover = (e) => { e.currentTarget.style.color = 'var(--text)'; };
  const unhover = (e) => { e.currentTarget.style.color = 'var(--text2)'; };

  return (
    <footer data-testid="footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)' }}>
              Receipty<span style={{ color: 'var(--accent)' }}>.</span>
            </span>
            <p style={{ marginTop: 12, fontSize: 14, maxWidth: 280, lineHeight: 1.6, color: 'var(--text3)' }}>{t.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-8">
            <Link to="/adn" style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{t.nav.adn}</Link>
            <Link to="/solutions" style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{t.nav.solutions}</Link>
            <Link to="/faq" style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>FAQ</Link>
            <Link to="/contact" style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{t.nav.contact}</Link>
          </div>
        </div>
        <div className="mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text3)' }}>
            &copy; {year} Receipty Agency. {t.footer.rights}
          </p>
          <div className="flex gap-6" style={{ fontSize: 12.5 }}>
            <Link to="/privacy" style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{t.footer.privacy}</Link>
            <Link to="/terms" style={linkStyle} onMouseEnter={hover} onMouseLeave={unhover}>{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
