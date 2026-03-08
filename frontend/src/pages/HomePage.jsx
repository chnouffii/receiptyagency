import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Infinite scrolling marquee component
function TrustedCompaniesMarquee({ companies, isDark }) {
  if (!companies || companies.length === 0) return null;
  
  // Duplicate companies for seamless loop
  const duplicatedCompanies = [...companies, ...companies, ...companies];
  
  return (
    <div className="relative overflow-hidden">
      {/* Gradient masks */}
      <div className={`absolute left-0 top-0 bottom-0 w-24 z-10 ${
        isDark 
          ? 'bg-gradient-to-r from-[#050505] to-transparent' 
          : 'bg-gradient-to-r from-[#F9FAFB] to-transparent'
      }`} />
      <div className={`absolute right-0 top-0 bottom-0 w-24 z-10 ${
        isDark 
          ? 'bg-gradient-to-l from-[#050505] to-transparent' 
          : 'bg-gradient-to-l from-[#F9FAFB] to-transparent'
      }`} />
      
      {/* Scrolling container */}
      <div className="flex animate-marquee">
        {duplicatedCompanies.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className="flex-shrink-0 px-8 md:px-12"
          >
            <span className={`font-heading text-sm md:text-base font-bold tracking-wide whitespace-nowrap opacity-50 hover:opacity-80 transition-opacity ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const [trustedCompanies, setTrustedCompanies] = useState(['GlobalTech', 'BioPharm', 'NeoRetail', 'MedStaff', 'InvestCorp']);

  useEffect(() => {
    const fetchTrustedCompanies = async () => {
      try {
        const res = await axios.get(`${API}/site-content`);
        if (res.data.trusted_companies && res.data.trusted_companies.length > 0) {
          setTrustedCompanies(res.data.trusted_companies);
        }
      } catch (err) {
        // Keep default companies on error
      }
    };
    fetchTrustedCompanies();
  }, []);

  const featureItems = [
    { icon: Brain, ...t.features.ai },
    { icon: Zap, ...t.features.auto },
    { icon: TrendingUp, ...t.features.perf },
  ];

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section className={`relative min-h-screen flex items-center justify-center overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#050505]' : 'bg-[#F9FAFB]'
      }`}>
        {/* Background */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 ${
            isDark 
              ? 'bg-gradient-to-b from-blue-950/20 via-transparent to-transparent' 
              : 'bg-gradient-to-b from-blue-100/30 via-transparent to-transparent'
          }`} />
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(800px,100vw)] h-[800px] rounded-full blur-[120px] ${
            isDark ? 'bg-blue-600/5' : 'bg-blue-400/10'
          }`} />
        </div>

        <div className="relative z-10 w-full max-w-[90%] sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24">
          {/* Animated Title */}
          <motion.h1
            className={`font-heading text-[1.5rem] leading-tight sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 80, damping: 20 }}
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            className={`mt-8 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2 transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <Link
              to="/contact"
              data-testid="hero-cta-button"
              className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-4 font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-105"
            >
              {t.hero.cta}
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/cases"
              data-testid="hero-secondary-btn"
              className={`flex items-center gap-2 border rounded-full px-6 py-3.5 text-sm font-medium backdrop-blur-md transition-all duration-200 ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                  : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 shadow-sm'
              }`}
            >
              {t.nav.cases}
            </Link>
          </motion.div>

          {/* Trust logos with infinite scroll */}
          <motion.div
            className={`mt-24 pt-12 border-t transition-colors duration-300 ${
              isDark ? 'border-white/5' : 'border-gray-200'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <p className={`text-xs uppercase tracking-widest mb-8 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`}>{t.hero.trusted}</p>
            <TrustedCompaniesMarquee companies={trustedCompanies} isDark={isDark} />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className={`relative py-24 md:py-32 transition-colors duration-300 ${
        isDark ? 'bg-[#050505]' : 'bg-[#F9FAFB]'
      }`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureItems.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`group relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 ${
                  isDark 
                    ? 'border-white/5 bg-white/[0.02] hover:border-blue-500/20 hover:bg-white/[0.04]' 
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                }`}
                data-testid={`feature-card-${i}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                  isDark ? 'bg-blue-600/10' : 'bg-blue-50'
                }`}>
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className={`font-heading text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-500' : 'text-gray-600'
                }`}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
