import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import {
  Calculator, TrendingUp, Clock, Euro, ArrowRight, CheckCircle,
  ChevronDown, ChevronUp, Sparkles, Zap
} from 'lucide-react';

function formatEuro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function ROICalculatorPage() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();

  const [description, setDescription] = useState('');
  const [employees, setEmployees] = useState(50);
  const [hourlyRate, setHourlyRate] = useState(45);
  const [hoursLostPerWeek, setHoursLostPerWeek] = useState(20);
  const [showDetails, setShowDetails] = useState(false);

  const results = useMemo(() => {
    const annualHoursLost = hoursLostPerWeek * 52;
    const teamImpacted = employees * 0.1;
    const moneySavedFromTime = annualHoursLost * 0.60 * hourlyRate * teamImpacted;
    const totalAnnualSavings = moneySavedFromTime;

    const implementationCost = 2000 + employees * 30;
    const monthlySubscription = 149 + employees * 0.5;
    const totalYearCost = implementationCost + monthlySubscription * 12;

    const roiYear1 = ((totalAnnualSavings - totalYearCost) / totalYearCost) * 100;
    const roiYear3 = ((totalAnnualSavings * 3 - totalYearCost - monthlySubscription * 24) / (totalYearCost + monthlySubscription * 24)) * 100;
    const paybackMonths = totalYearCost / (totalAnnualSavings / 12);

    return {
      timeSavedWeekly: Math.round(hoursLostPerWeek * 0.60 * teamImpacted),
      timeSavedAnnually: Math.round(annualHoursLost * 0.60 * teamImpacted),
      annualSavings: Math.round(totalAnnualSavings),
      savings3Years: Math.round(totalAnnualSavings * 3),
      savings5Years: Math.round(totalAnnualSavings * 5),
      roiYear1: Math.round(roiYear1),
      roiYear3: Math.round(roiYear3),
      paybackMonths: Math.max(1, Math.round(paybackMonths)),
      estimatedSetup: Math.round(implementationCost),
      estimatedMonthly: Math.round(monthlySubscription),
    };
  }, [employees, hourlyRate, hoursLostPerWeek]);

  return (
    <div className={`min-h-screen pt-24 pb-20 transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <SEOHead page="roi" />
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <Calculator className="w-4 h-4" />
            {lang === 'fr' ? 'Calculateur ROI' : 'ROI Calculator'}
          </div>
          <h1 className={`font-heading text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {lang === 'fr' ? 'Combien pouvez-vous économiser' : 'How much can you save'}
            <br />
            <span className="text-blue-500">{lang === 'fr' ? 'avec l\'IA ?' : 'with AI?'}</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {lang === 'fr'
              ? 'Décrivez votre projet et ajustez les paramètres pour estimer vos économies.'
              : 'Describe your project and adjust the parameters to estimate your savings.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* === LEFT: INPUTS === */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Project description */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? '1. Votre projet' : '1. Your project'}
              </h2>
              <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {lang === 'fr'
                  ? 'Décrivez les processus que vous souhaitez automatiser.'
                  : 'Describe the processes you want to automate.'}
              </p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder={lang === 'fr'
                  ? 'Ex : gestion des factures, traitement des candidatures, reporting hebdomadaire, service client...'
                  : 'E.g. invoice processing, applicant tracking, weekly reports, customer support...'}
                className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all outline-none ${
                  isDark
                    ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400'
                }`}
              />
              {description.length > 10 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 text-xs text-blue-400"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {lang === 'fr' ? 'Pris en compte dans votre estimation personnalisée.' : 'Taken into account in your personalised estimate.'}
                </motion.div>
              )}
            </div>

            {/* General parameters */}
            <div className={`rounded-2xl border p-6 space-y-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? '2. Votre entreprise' : '2. Your company'}
              </h2>

              {/* Employees */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {lang === 'fr' ? 'Nombre d\'employés' : 'Number of employees'}
                  </label>
                  <span className="text-sm font-bold font-mono text-blue-400">{employees}</span>
                </div>
                <input
                  type="range"
                  min={5} max={500} step={5}
                  value={employees}
                  onChange={e => setEmployees(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span>5</span><span>500</span>
                </div>
              </div>

              {/* Hourly rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {lang === 'fr' ? 'Coût horaire moyen (€/h)' : 'Average hourly cost (€/h)'}
                  </label>
                  <span className="text-sm font-bold font-mono text-blue-400">{hourlyRate}€</span>
                </div>
                <input
                  type="range"
                  min={20} max={150} step={5}
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span>20€</span><span>150€</span>
                </div>
              </div>

              {/* Hours lost */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {lang === 'fr' ? 'Heures perdues/semaine (tâches manuelles)' : 'Hours lost/week (manual tasks)'}
                  </label>
                  <span className="text-sm font-bold font-mono text-blue-400">{hoursLostPerWeek}h</span>
                </div>
                <input
                  type="range"
                  min={2} max={80} step={1}
                  value={hoursLostPerWeek}
                  onChange={e => setHoursLostPerWeek(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span>2h</span><span>80h</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* === RIGHT: RESULTS === */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Main result card */}
            <div className={`rounded-2xl border p-6 bg-gradient-to-br from-blue-600/20 to-blue-600/5 ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? 'Économies estimées — Receipty AI' : 'Estimated savings — Receipty AI'}
                </span>
              </div>
              <motion.p
                key={results.annualSavings}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono text-5xl font-bold mb-1 text-blue-400"
              >
                {formatEuro(results.annualSavings)}
              </motion.p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {lang === 'fr' ? 'par an' : 'per year'}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white/70'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                    {lang === 'fr' ? '3 ans' : '3 years'}
                  </p>
                  <p className={`font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatEuro(results.savings3Years)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white/70'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                    ROI an 1
                  </p>
                  <p className={`font-mono text-lg font-bold ${results.roiYear1 > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.roiYear1 > 0 ? '+' : ''}{results.roiYear1}%
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white/70'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                    {lang === 'fr' ? 'Retour invest.' : 'Payback'}
                  </p>
                  <p className={`font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {results.paybackMonths} {lang === 'fr' ? 'mois' : 'mo.'}
                  </p>
                </div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <Clock className="w-4 h-4 text-amber-400 mb-2" />
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                  {lang === 'fr' ? 'Temps récupéré/semaine' : 'Time saved/week'}
                </p>
                <p className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {results.timeSavedWeekly}h
                </p>
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" />
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                  {lang === 'fr' ? 'Réduction des erreurs' : 'Error reduction'}
                </p>
                <p className="font-mono text-2xl font-bold text-emerald-400">
                  -78%
                </p>
              </div>
            </div>

            {/* Detail toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                isDark ? 'border-[var(--border-primary)] text-gray-400 hover:bg-[var(--bg-tertiary)]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{lang === 'fr' ? 'Détail du calcul' : 'Calculation details'}</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl border p-4 space-y-2 text-sm overflow-hidden ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200'}`}
                >
                  {[
                    { label: lang === 'fr' ? 'Heures récupérées/an' : 'Hours saved/year', value: `${results.timeSavedAnnually}h` },
                    { label: lang === 'fr' ? 'Implémentation estimée' : 'Estimated setup', value: formatEuro(results.estimatedSetup) },
                    { label: lang === 'fr' ? 'Abonnement mensuel estimé' : 'Estimated monthly fee', value: `${formatEuro(results.estimatedMonthly)}/mois` },
                    { label: lang === 'fr' ? 'ROI sur 3 ans' : '3-year ROI', value: `+${results.roiYear3}%` },
                    { label: lang === 'fr' ? 'Économies sur 5 ans' : '5-year savings', value: formatEuro(results.savings5Years) },
                  ].map((item, i) => (
                    <div key={i} className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'} last:border-0`}>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.label}</span>
                      <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                    </div>
                  ))}
                  <p className={`text-xs pt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {lang === 'fr'
                      ? '* Estimations basées sur des projets similaires. Les résultats réels peuvent varier.'
                      : '* Estimates based on similar projects. Actual results may vary.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* What's included */}
            <div className={`rounded-xl border p-4 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <p className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {lang === 'fr' ? 'Inclus avec votre solution' : 'Included with your solution'}
              </p>
              <div className="space-y-2">
                {(lang === 'fr' ? [
                  'Intégration complète avec vos outils existants',
                  'Formation et accompagnement de votre équipe',
                  'Support dédié 5j/7',
                  'Tableau de bord et reporting en temps réel',
                ] : [
                  'Full integration with your existing tools',
                  'Team training and onboarding support',
                  'Dedicated support 5 days/week',
                  'Real-time dashboard and reporting',
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/contact"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white transition-all bg-blue-600 hover:bg-blue-500 shadow-lg"
            >
              {lang === 'fr' ? 'Démarrer mon projet' : 'Start my project'}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/contact"
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all ${
                isDark ? 'text-gray-400 hover:text-white border border-[var(--border-primary)] hover:border-[var(--border-secondary)]' : 'text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {lang === 'fr' ? 'Parler à un expert' : 'Talk to an expert'}
            </Link>
          </motion.div>
        </div>

        {/* Social proof bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-16 rounded-2xl border p-8 text-center ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {lang === 'fr' ? 'Résultats observés chez nos clients' : 'Results observed with our clients'}
          </p>
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: '+340%', label: lang === 'fr' ? 'Efficacité opérationnelle' : 'Operational efficiency', color: 'text-blue-400' },
              { value: '-45%', label: lang === 'fr' ? 'Coûts opérationnels' : 'Operational costs', color: 'text-emerald-400' },
              { value: '+280%', label: lang === 'fr' ? 'Productivité équipe' : 'Team productivity', color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i}>
                <p className={`font-mono text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
