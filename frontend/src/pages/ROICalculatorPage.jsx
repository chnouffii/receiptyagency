import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import {
  Calculator, TrendingUp, Clock, Euro, ArrowRight, CheckCircle,
  Users, ChevronDown, ChevronUp, Sparkles, Zap, PiggyBank
} from 'lucide-react';

function formatEuro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function ROICalculatorPage() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();

  // Inputs simplifiés et parlants
  const [employeesOnTask, setEmployeesOnTask] = useState(3);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(35);
  const [errorCostPerMonth, setErrorCostPerMonth] = useState(500);
  const [showDetails, setShowDetails] = useState(false);

  const results = useMemo(() => {
    // Calculs simples et réalistes
    const weeksPerYear = 52;
    const currentCostPerYear = employeesOnTask * hoursPerWeek * hourlyRate * weeksPerYear;
    const errorCostPerYear = errorCostPerMonth * 12;
    const totalCurrentCost = currentCostPerYear + errorCostPerYear;

    // Avec automatisation: 70% de temps gagné, 85% d'erreurs en moins
    const automationRate = 0.70;
    const errorReductionRate = 0.85;
    
    const timeSavedPerWeek = hoursPerWeek * automationRate;
    const timeSavedPerYear = timeSavedPerWeek * weeksPerYear;
    const moneySavedFromTime = timeSavedPerYear * hourlyRate * employeesOnTask;
    const moneySavedFromErrors = errorCostPerYear * errorReductionRate;
    
    const totalSavingsYear1 = moneySavedFromTime + moneySavedFromErrors;
    
    // Coût estimé de la solution (réaliste)
    const setupCost = 1500 + (employeesOnTask * 200);
    const monthlyCost = 99 + (employeesOnTask * 15);
    const yearlyCost = setupCost + (monthlyCost * 12);
    
    const netSavingsYear1 = totalSavingsYear1 - yearlyCost;
    const roiPercent = Math.round((netSavingsYear1 / yearlyCost) * 100);
    const paybackMonths = Math.max(1, Math.round(yearlyCost / (totalSavingsYear1 / 12)));

    return {
      currentCostPerYear: Math.round(totalCurrentCost),
      timeSavedPerWeek: Math.round(timeSavedPerWeek * employeesOnTask),
      timeSavedPerYear: Math.round(timeSavedPerYear * employeesOnTask),
      savingsYear1: Math.round(totalSavingsYear1),
      savingsYear3: Math.round(totalSavingsYear1 * 3 - setupCost),
      netSavingsYear1: Math.round(netSavingsYear1),
      roi: roiPercent,
      paybackMonths,
      setupCost: Math.round(setupCost),
      monthlyCost: Math.round(monthlyCost),
      errorReduction: Math.round(errorReductionRate * 100),
    };
  }, [employeesOnTask, hoursPerWeek, hourlyRate, errorCostPerMonth]);

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
            {lang === 'fr' ? 'Calculez vos économies' : 'Calculate your savings'}
            <br />
            <span className="text-blue-500">{lang === 'fr' ? 'en 30 secondes' : 'in 30 seconds'}</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {lang === 'fr'
              ? 'Répondez à 4 questions simples sur vos tâches répétitives pour découvrir combien vous pourriez économiser.'
              : 'Answer 4 simple questions about your repetitive tasks to discover how much you could save.'}
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
            {/* Question 1 */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className={`font-heading text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Combien de personnes font cette tâche ?' : 'How many people do this task?'}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1} max={20} step={1}
                  value={employeesOnTask}
                  onChange={e => setEmployeesOnTask(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-2xl font-mono font-bold text-blue-400 w-12 text-right">{employeesOnTask}</span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {lang === 'fr' ? 'personne(s) concernée(s)' : 'person(s) involved'}
              </p>
            </div>

            {/* Question 2 */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className={`font-heading text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Combien d\'heures par semaine par personne ?' : 'How many hours per week per person?'}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1} max={40} step={1}
                  value={hoursPerWeek}
                  onChange={e => setHoursPerWeek(Number(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-2xl font-mono font-bold text-amber-400 w-16 text-right">{hoursPerWeek}h</span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {lang === 'fr' ? 'sur des tâches répétitives/manuelles' : 'on repetitive/manual tasks'}
              </p>
            </div>

            {/* Question 3 */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Euro className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className={`font-heading text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Quel est le coût horaire moyen ?' : 'What is the average hourly cost?'}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={15} max={100} step={5}
                  value={hourlyRate}
                  onChange={e => setHourlyRate(Number(e.target.value))}
                  className="flex-1 accent-emerald-500"
                />
                <span className="text-2xl font-mono font-bold text-emerald-400 w-16 text-right">{hourlyRate}€</span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {lang === 'fr' ? 'coût chargé de l\'employé' : 'loaded employee cost'}
              </p>
            </div>

            {/* Question 4 */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-red-400" />
                </div>
                <h2 className={`font-heading text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Combien coûtent les erreurs par mois ?' : 'How much do errors cost per month?'}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0} max={5000} step={100}
                  value={errorCostPerMonth}
                  onChange={e => setErrorCostPerMonth(Number(e.target.value))}
                  className="flex-1 accent-red-500"
                />
                <span className="text-2xl font-mono font-bold text-red-400 w-20 text-right">{errorCostPerMonth}€</span>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {lang === 'fr' ? 'corrections, retards, pertes...' : 'corrections, delays, losses...'}
              </p>
            </div>
          </motion.div>

          {/* === RIGHT: RESULTS === */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Situation actuelle */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                {lang === 'fr' ? 'Coût actuel de ces tâches' : 'Current cost of these tasks'}
              </p>
              <p className="font-mono text-3xl font-bold text-red-400">
                {formatEuro(results.currentCostPerYear)}
                <span className={`text-sm font-normal ml-2 ${isDark ? 'text-red-300/60' : 'text-red-400'}`}>/{lang === 'fr' ? 'an' : 'year'}</span>
              </p>
            </div>

            {/* Économies */}
            <div className={`rounded-2xl border p-6 bg-gradient-to-br from-emerald-600/10 to-blue-600/5 ${isDark ? 'border-emerald-500/20' : 'border-emerald-300'}`}>
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? 'Économies avec automatisation IA' : 'Savings with AI automation'}
                </span>
              </div>
              <motion.p
                key={results.savingsYear1}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono text-5xl font-bold text-emerald-400 mb-1"
              >
                {formatEuro(results.savingsYear1)}
              </motion.p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {lang === 'fr' ? 'économisés par an' : 'saved per year'}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white/80'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                    {lang === 'fr' ? 'Sur 3 ans' : 'Over 3 years'}
                  </p>
                  <p className={`font-mono text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatEuro(results.savingsYear3)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white/80'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                    ROI
                  </p>
                  <p className={`font-mono text-lg font-bold ${results.roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.roi > 0 ? '+' : ''}{results.roi}%
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white/80'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                    {lang === 'fr' ? 'Rentabilisé en' : 'Payback in'}
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
                  {lang === 'fr' ? 'Temps libéré/semaine' : 'Time freed/week'}
                </p>
                <p className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {results.timeSavedPerWeek}h
                </p>
              </div>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" />
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-1`}>
                  {lang === 'fr' ? 'Erreurs évitées' : 'Errors avoided'}
                </p>
                <p className="font-mono text-2xl font-bold text-emerald-400">
                  -{results.errorReduction}%
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
              <span>{lang === 'fr' ? 'Voir le détail' : 'View details'}</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl border p-4 space-y-2 text-sm ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200'}`}
                >
                  {[
                    { label: lang === 'fr' ? 'Heures libérées/an' : 'Hours freed/year', value: `${results.timeSavedPerYear}h` },
                    { label: lang === 'fr' ? 'Mise en place estimée' : 'Estimated setup', value: formatEuro(results.setupCost) },
                    { label: lang === 'fr' ? 'Abonnement mensuel' : 'Monthly fee', value: `${formatEuro(results.monthlyCost)}/mois` },
                    { label: lang === 'fr' ? 'Économie nette an 1' : 'Net savings year 1', value: formatEuro(results.netSavingsYear1) },
                  ].map((item, i) => (
                    <div key={i} className={`flex justify-between py-1.5 border-b ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'} last:border-0`}>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.label}</span>
                      <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                    </div>
                  ))}
                  <p className={`text-xs pt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {lang === 'fr'
                      ? '* Basé sur 70% d\'automatisation et 85% de réduction des erreurs (moyennes observées).'
                      : '* Based on 70% automation and 85% error reduction (observed averages).'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <Link
              to="/contact"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 transition-all shadow-lg"
            >
              {lang === 'fr' ? 'Discuter de mon projet' : 'Discuss my project'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        {/* Ce que vous gagnez */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-12 rounded-2xl border p-8 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <h3 className={`font-heading text-xl font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {lang === 'fr' ? 'Ce que l\'automatisation vous apporte' : 'What automation brings you'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(lang === 'fr' ? [
              { icon: Clock, title: 'Du temps retrouvé', desc: 'Vos équipes se concentrent sur des tâches à valeur ajoutée' },
              { icon: Sparkles, title: 'Moins d\'erreurs', desc: 'L\'IA ne fait pas de fautes d\'inattention' },
              { icon: TrendingUp, title: 'Plus de croissance', desc: 'Scalez vos opérations sans recruter' },
            ] : [
              { icon: Clock, title: 'Time recovered', desc: 'Your teams focus on high-value tasks' },
              { icon: Sparkles, title: 'Fewer errors', desc: 'AI doesn\'t make careless mistakes' },
              { icon: TrendingUp, title: 'More growth', desc: 'Scale your operations without hiring' },
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <item.icon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
