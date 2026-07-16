import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import SEOHead, { FAQSchema, BreadcrumbSchema } from '../components/SEOHead';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SITE_URL = 'https://receipty.fr';

function FAQItem({ question, answer, isDark, isOpen, onToggle }) {
  return (
    <div className={`rounded-xl border transition-colors ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
        aria-expanded={isOpen}
      >
        <span className={`font-medium text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{question}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <p className={`px-5 pb-5 text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {answer}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    axios.get(`${API}/faq`).then(res => setFaqs(res.data || [])).catch(() => {});
  }, []);

  const localized = faqs.map(f => ({
    id: f.id,
    question: lang === 'fr' ? f.question_fr : (f.question_en || f.question_fr),
    answer: lang === 'fr' ? f.answer_fr : (f.answer_en || f.answer_fr),
  }));

  const intro = lang === 'fr'
    ? "Les réponses aux questions les plus fréquentes sur Receipty, nos solutions d'automatisation IA, notre méthode et nos tarifs. Une question sans réponse ici ? Contactez-nous, on répond sous 24h."
    : "Answers to the most common questions about Receipty, our AI automation solutions, our method and our pricing. Can't find your answer? Contact us — we reply within 24h.";

  return (
    <div className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <SEOHead page="faq" />
      <FAQSchema faqs={localized} />
      <BreadcrumbSchema items={[
        { name: 'Receipty', url: `${SITE_URL}/` },
        { name: lang === 'fr' ? 'FAQ' : 'FAQ', url: `${SITE_URL}/faq` },
      ]} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </div>
          <h1 className={`font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.faq?.title || (lang === 'fr' ? 'Questions fréquentes' : 'Frequently asked questions')}
          </h1>
          <p className={`mt-5 text-base max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {intro}
          </p>
        </motion.div>

        {localized.length > 0 ? (
          <div className="space-y-3">
            {localized.map((faq) => (
              <FAQItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                isDark={isDark}
                isOpen={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              />
            ))}
          </div>
        ) : (
          <p className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {lang === 'fr' ? 'Les questions fréquentes arrivent bientôt.' : 'Frequently asked questions are coming soon.'}
          </p>
        )}

        {/* CTA */}
        <div className={`mt-14 rounded-2xl border p-8 text-center ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <h2 className={`font-heading text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {lang === 'fr' ? 'Une autre question ?' : 'Another question?'}
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {lang === 'fr' ? "Parlons de votre projet d'automatisation." : "Let's talk about your automation project."}
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200"
          >
            {lang === 'fr' ? 'Contactez-nous' : 'Contact us'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
