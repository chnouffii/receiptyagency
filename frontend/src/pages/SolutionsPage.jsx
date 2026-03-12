import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Wallet, Globe, Cpu, ShoppingCart, Mail, Shield, BarChart3, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Badge } from '../components/ui/badge';
import SEOHead from '../components/SEOHead';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICON_MAP = { users: Users, wallet: Wallet, globe: Globe, cpu: Cpu, 'shopping-cart': ShoppingCart, mail: Mail, shield: Shield, 'bar-chart': BarChart3 };


function SolutionCard({ sol, index, lang, isDark }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = ICON_MAP[sol.icon] || Users;
  const name = lang === 'fr' ? sol.name_fr : (sol.name_en || sol.name_fr);
  const tag = lang === 'fr' ? sol.tag_fr : (sol.tag_en || sol.tag_fr);
  const desc = lang === 'fr' ? sol.desc_fr : (sol.desc_en || sol.desc_fr);
  const features = lang === 'fr' ? (sol.features_fr || []) : (sol.features_en || sol.features_fr || []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:border-blue-500/20 ${
        isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'
      }`}
      data-testid={`solution-card-${index}`}
    >
      <div className="p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className={`font-heading text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
            <Badge variant="outline" className="mt-1 text-xs text-blue-400 border-blue-500/30">{tag}</Badge>
          </div>
        </div>
        <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature, i) => (
            <div key={i} className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500/60 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SolutionsPage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/solutions`).then(res => {
      setSolutions(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div data-testid="solutions-page" className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <SEOHead page="solutions" />
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16">
          <h1 className={`font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.solutions.title}</h1>
          <p className={`mt-6 text-base md:text-lg max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.solutions.subtitle}</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
        ) : solutions.length === 0 ? (
          <div className="text-center text-gray-500 py-20">{lang === 'fr' ? 'Aucune solution pour le moment.' : 'No solutions yet.'}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {solutions.map((sol, i) => (
              <SolutionCard key={sol.id} sol={sol} index={i} lang={lang} isDark={isDark} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
