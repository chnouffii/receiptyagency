import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Target, Lightbulb, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CaseStudyDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const [cs, setCs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/case-studies/${id}`)
      .then(res => { setCs(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className={`pt-24 min-h-screen flex items-center justify-center ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}><p className="text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p></div>;
  }

  if (!cs) {
    return <div className={`pt-24 min-h-screen flex items-center justify-center ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}><p className="text-gray-400">{lang === 'fr' ? 'Etude de cas introuvable.' : 'Case study not found.'}</p></div>;
  }

  const title = lang === 'fr' ? cs.title_fr : (cs.title_en || cs.title_fr);
  const desc = lang === 'fr' ? cs.desc_fr : (cs.desc_en || cs.desc_fr);
  const challenge = lang === 'fr' ? cs.challenge_fr : (cs.challenge_en || cs.challenge_fr);
  const solution = lang === 'fr' ? cs.solution_fr : (cs.solution_en || cs.solution_fr);
  const results = lang === 'fr' ? (cs.results_fr || []) : (cs.results_en || cs.results_fr || []);
  const duration = lang === 'fr' ? (cs.duration_fr || '') : (cs.duration_en || cs.duration_fr || '');
  const team = lang === 'fr' ? (cs.team_fr || '') : (cs.team_en || cs.team_fr || '');

  const sectionLabel = {
    challenge: lang === 'fr' ? 'Le Defi' : 'The Challenge',
    solution: lang === 'fr' ? 'Notre Solution' : 'Our Solution',
    results: lang === 'fr' ? 'Resultats' : 'Results',
    duration: lang === 'fr' ? 'Duree' : 'Duration',
    team: lang === 'fr' ? 'Equipe' : 'Team',
    tech: lang === 'fr' ? 'Technologies' : 'Technologies',
    cta: lang === 'fr' ? 'Demarrer un projet similaire' : 'Start a similar project',
  };

  return (
    <div data-testid="case-detail-page" className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link to="/cases" className={`inline-flex items-center gap-2 text-sm transition-colors duration-200 mb-10 ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`} data-testid="back-to-cases">
            <ArrowLeft className="w-4 h-4" /> {lang === 'fr' ? 'Retour aux etudes de cas' : 'Back to case studies'}
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-600/90 text-white border-0 font-mono text-xs px-3 py-1">{cs.roi}</Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-xs">{cs.category}</Badge>
          </div>
          <h1 className={`font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
          <p className={`mt-4 text-base leading-relaxed max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
        </motion.div>

        {cs.image_url && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className={`mt-10 rounded-2xl overflow-hidden border ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <img src={cs.image_url} alt={title} className="w-full h-64 md:h-80 object-cover" loading="lazy" />
          </motion.div>
        )}

        {(duration || team) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-8 grid grid-cols-3 gap-4">
            {duration && (
              <div className={`rounded-xl border p-5 ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white'}`}>
                <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>{sectionLabel.duration}</p>
                <p className={`mt-1 font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{duration}</p>
              </div>
            )}
            {team && (
              <div className={`rounded-xl border p-5 ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white'}`}>
                <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>{sectionLabel.team}</p>
                <p className={`mt-1 font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{team}</p>
              </div>
            )}
            <div className={`rounded-xl border p-5 ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white'}`}>
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>ROI</p>
              <p className="mt-1 font-mono text-lg font-bold text-blue-400">{cs.roi}</p>
            </div>
          </motion.div>
        )}

        {challenge && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="mt-12">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-red-400" />
              <h2 className={`font-heading text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{sectionLabel.challenge}</h2>
            </div>
            <p className={`leading-relaxed pl-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{challenge}</p>
          </motion.section>
        )}

        {solution && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h2 className={`font-heading text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{sectionLabel.solution}</h2>
            </div>
            <p className={`leading-relaxed pl-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{solution}</p>
          </motion.section>
        )}

        {results.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className={`font-heading text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{sectionLabel.results}</h2>
            </div>
            <div className="space-y-3 pl-8">
              {results.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{r}</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {cs.tech?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }} className="mt-10">
            <p className={`text-xs uppercase tracking-wider mb-3 pl-8 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>{sectionLabel.tech}</p>
            <div className="flex flex-wrap gap-2 pl-8">
              {cs.tech.map((t) => (
                <span key={t} className="text-xs text-blue-400 bg-blue-600/10 border border-blue-500/20 rounded-full px-3 py-1">{t}</span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }} className={`mt-16 pt-10 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
          <Link to="/contact" data-testid="case-detail-cta" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-4 font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-105">
            {sectionLabel.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
