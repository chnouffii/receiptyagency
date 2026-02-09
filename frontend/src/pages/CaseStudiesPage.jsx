import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function CaseCard({ item, index, lang }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const title = lang === 'fr' ? item.title_fr : (item.title_en || item.title_fr);
  const desc = lang === 'fr' ? item.desc_fr : (item.desc_en || item.desc_fr);

  return (
    <Link to={`/cases/${item.id}`} data-testid={`case-card-${index}`}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="group break-inside-avoid mb-6 overflow-hidden rounded-2xl border border-white/5 bg-[#0F0F10] transition-all duration-300 hover:border-blue-500/20"
      >
        {item.image_url && (
          <div className="relative overflow-hidden aspect-[16/10]">
            <img src={item.image_url} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] via-transparent to-transparent opacity-60" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-blue-600/90 text-white border-0 backdrop-blur-sm font-mono text-xs px-3 py-1">{item.roi}</Badge>
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="flex items-center gap-2 text-white text-sm font-medium">
                {lang === 'fr' ? 'Voir le cas' : 'View case'} <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        )}
        <div className="p-6">
          <p className="text-xs text-blue-400 font-medium mb-2">{item.category}</p>
          <h3 className="font-heading text-lg font-semibold text-white leading-tight">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{desc}</p>
          {item.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs text-gray-600 bg-white/5 rounded-full px-3 py-1">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function CaseStudiesPage() {
  const { t, lang } = useLanguage();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/case-studies`).then(res => {
      setCases(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div data-testid="cases-page" className="pt-24 bg-[#050505] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            {t.cases.title}
          </h1>
          <p className="mt-6 text-base md:text-lg text-gray-400 max-w-2xl">
            {t.cases.subtitle}
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
        ) : cases.length === 0 ? (
          <div className="text-center text-gray-500 py-20">{lang === 'fr' ? 'Aucune etude de cas pour le moment.' : 'No case studies yet.'}</div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {cases.map((item, i) => (
              <CaseCard key={item.id} item={item} index={i} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
