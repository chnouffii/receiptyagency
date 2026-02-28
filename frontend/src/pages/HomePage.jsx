import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Infinite scrolling marquee component
function TrustedCompaniesMarquee({ companies }) {
  if (!companies || companies.length === 0) return null;
  
  // Duplicate companies for seamless loop
  const duplicatedCompanies = [...companies, ...companies, ...companies];
  
  return (
    <div className="relative overflow-hidden">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050505] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050505] to-transparent z-10" />
      
      {/* Scrolling container */}
      <div className="flex animate-marquee">
        {duplicatedCompanies.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className="flex-shrink-0 px-8 md:px-12"
          >
            <span className="font-heading text-sm md:text-base font-bold text-gray-400 tracking-wide whitespace-nowrap opacity-50 hover:opacity-80 transition-opacity">
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#050505]">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(800px,100vw)] h-[800px] rounded-full bg-blue-600/5 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[90%] sm:max-w-2xl md:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24">
          {/* Animated Title */}
          <motion.h1
            className="font-heading text-[1.5rem] leading-tight sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 80, damping: 20 }}
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            className="mt-8 text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-2"
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
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full px-6 py-3.5 text-sm font-medium backdrop-blur-md transition-all duration-200"
            >
              {t.nav.cases}
            </Link>
          </motion.div>

          {/* Trust logos with infinite scroll */}
          <motion.div
            className="mt-24 pt-12 border-t border-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-8">{t.hero.trusted}</p>
            <TrustedCompaniesMarquee companies={trustedCompanies} />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-24 md:py-32 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureItems.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-blue-500/20 hover:bg-white/[0.04]"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
