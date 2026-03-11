import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Zap, TrendingUp, ChevronDown, HelpCircle, Plus, Minus } from 'lucide-react';
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

function FAQItem({ question, answer, isDark, index, isOpen, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOpen 
          ? isDark 
            ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5 shadow-lg shadow-blue-500/5' 
            : 'border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg shadow-blue-100'
          : isDark 
            ? 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
        data-testid={`faq-question-${index}`}
      >
        <div className="flex items-center gap-4 flex-1 pr-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25'
              : isDark 
                ? 'bg-white/5 group-hover:bg-white/10' 
                : 'bg-gray-100 group-hover:bg-gray-200'
          }`}>
            <span className={`font-heading font-bold text-sm transition-colors duration-300 ${
              isOpen ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <span className={`font-heading font-semibold text-base transition-colors duration-300 ${
            isOpen 
              ? isDark ? 'text-white' : 'text-gray-900'
              : isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
          }`}>
            {question}
          </span>
        </div>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-blue-500 rotate-0'
            : isDark 
              ? 'bg-white/5 group-hover:bg-white/10' 
              : 'bg-gray-100 group-hover:bg-gray-200'
        }`}>
          {isOpen ? (
            <Minus className="w-4 h-4 text-white" />
          ) : (
            <Plus className={`w-4 h-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className={`px-6 pb-6 pl-20`}>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const featuresRef = useRef(null);
  const faqRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' });
  const [trustedCompanies, setTrustedCompanies] = useState(['GlobalTech', 'BioPharm', 'NeoRetail', 'MedStaff', 'InvestCorp']);
  const [faqs, setFaqs] = useState([]);

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
    const fetchFaqs = async () => {
      try {
        const res = await axios.get(`${API}/faq`);
        setFaqs(res.data);
      } catch (err) {
        // silently fail
      }
    };
    fetchTrustedCompanies();
    fetchFaqs();
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

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <FAQSection faqs={faqs} lang={lang} isDark={isDark} faqRef={faqRef} faqInView={faqInView} t={t} />
      )}
    </div>
  );
}

function FAQSection({ faqs, lang, isDark, faqRef, faqInView, t }) {
  const [openIndex, setOpenIndex] = useState(0); // First one open by default

  return (
    <section ref={faqRef} className={`relative py-24 md:py-32 overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#050505]' : 'bg-[#F9FAFB]'
    }`}>
      {/* Decorative elements */}
      <div className={`absolute inset-x-0 top-0 h-px ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
      <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-[100px] ${
        isDark ? 'bg-blue-600/5' : 'bg-blue-200/30'
      }`} />
      <div className={`absolute bottom-20 right-10 w-72 h-72 rounded-full blur-[100px] ${
        isDark ? 'bg-purple-600/5' : 'bg-purple-200/30'
      }`} />

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header - Always visible */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
            isDark 
              ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20' 
              : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
          }`}>
            <HelpCircle className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <span className={`text-sm font-bold tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
              F.A.Q
            </span>
          </div>

          {/* Title */}
          <h2 className={`font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {t.faq.title}
          </h2>
          
          {/* Subtitle */}
          <p className={`text-base md:text-lg max-w-2xl mx-auto ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {t.faq.subtitle}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.id}
              question={lang === 'fr' ? faq.question_fr : (faq.question_en || faq.question_fr)}
              answer={lang === 'fr' ? faq.answer_fr : (faq.answer_en || faq.answer_fr)}
              isDark={isDark}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className={`mt-12 text-center p-8 rounded-2xl border ${
          isDark 
            ? 'bg-gradient-to-br from-white/[0.02] to-white/[0.05] border-white/5' 
            : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
        }`}>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {lang === 'fr' ? "Vous n'avez pas trouvé la réponse à votre question ?" : "Didn't find the answer you were looking for?"}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full px-6 py-3 font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
          >
            {lang === 'fr' ? 'Contactez-nous' : 'Contact us'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
