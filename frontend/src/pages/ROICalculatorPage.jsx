import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Calculator, TrendingUp, Clock, Euro, ArrowRight, CheckCircle,
  Users, CreditCard, Globe, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

const sectors = [
  {
    id: 'rh',
    labelFr: 'Ressources Humaines',
    labelEn: 'Human Resources',
    solution: 'Receipty Talent',
    icon: Users,
    color: 'blue',
    params: {
      labelFr: 'Candidatures traitées par semaine',
      labelEn: 'Applications processed per week',
      min: 10, max: 500, default: 100, step: 10,
    },
    savingsRate: 0.65,   // 65% time saved
    errorReductionRate: 0.80,
    implementationWeeks: 8,
  },
  {
    id: 'finance',
    labelFr: 'Finance & Dépenses',
    labelEn: 'Finance & Expenses',
    solution: 'Receipty Spend',
    icon: CreditCard,
    color: 'emerald',
    params: {
      labelFr: 'Budget annuel géré (€)',
      labelEn: 'Annual budget managed (€)',
      min: 100000, max: 10000000, default: 1000000, step: 100000,
    },
    savingsRate: 0.12,   // 12% of budget recovered
    errorReductionRate: 0.92,
    implementationWeeks: 10,
  },
  {
    id: 'web',
    labelFr: 'E-commerce / Web',
    labelEn: 'E-commerce / Web',
    solution: 'Web-on-Demand',
    icon: Globe,
    color: 'purple',
    params: {
      labelFr: 'Visiteurs mensuels actuels',
      labelEn: 'Current monthly visitors',
      min: 500, max: 100000, default: 5000, step: 500,
    },
    savingsRate: 0.35,   // 35% conversion rate improvement
    errorReductionRate: 0.70,
    implementationWeeks: 14,
  },
];

const colorMap = {
  blue: {
    bg: 'bg-blue-600/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-500',
    ring: 'ring-blue-500',
    gradient: 'from-blue-600/20 to-blue-600/5',
  },
  emerald: {
    bg: 'bg-emerald-600/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
    ring: 'ring-emerald-500',
    gradient: 'from-emerald-600/20 to-emerald-600/5',
  },
  purple: {
    bg: 'bg-purple-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    btn: 'bg-purple-600 hover:bg-purple-500',
    ring: 'ring-purple-500',
    gradient: 'from-purple-600/20 to-purple-600/5',
  },
};

function formatEuro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export default function ROICalculatorPage() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();

  const [selectedSector, setSelectedSector] = useState('rh');
  const [employees, setEmployees] = useState(50);
  const [hourlyRate, setHourlyRate] = useState(45);
  const [hoursLostPerWeek, setHoursLostPerWeek] = useState(20);
  const [sectorParam, setSectorParam] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const sector = sectors.find(s => s.id === selectedSector);
  const colors = colorMap[sector.color];
  const SectorIcon = sector.icon;

  const paramValue = sectorParam ?? sector.params.default;

  const results = useMemo(() => {
    const annualHoursLost = hoursLostPerWeek * 52;
    const annualCostOfLostTime = annualHoursLost * hourlyRate * employees * 0.1; // 10% of team impacted
    const timeSavedAnnually = annualHoursLost * sector.savingsRate;
    const moneySavedFromTime = timeSavedAnnually * hourlyRate * employees * 0.1;

    let sectorBonus = 0;
    if (selectedSector === 'rh') {
      // Savings from faster hiring (reduced time-to-hire costs)
      sectorBonus = paramValue * 2 * 52 * sector.savingsRate * 0.5;
    } else if (selectedSector === 'finance') {
      // Direct budget recovery
      sectorBonus = paramValue * sector.savingsRate;
    } else if (selectedSector === 'web') {
      // Conversion rate improvement → revenue assumption: avg basket 80€, 2% conversion baseline
      const currentRevenue = paramValue * 0.02 * 80 * 12;
      sectorBonus = currentRevenue * sector.savingsRate;
    }

    const totalAnnualSavings = moneySavedFromTime + sectorBonus;
    const implementationCost = 2000 + employees * 30; // rough estimate
    const monthlySubscription = 149 + employees * 0.5;
    const totalYearCost = implementationCost + monthlySubscription * 12;

    const roiYear1 = ((totalAnnualSavings - totalYearCost) / totalYearCost) * 100;
    const roiYear3 = ((totalAnnualSavings * 3 - totalYearCost - monthlySubscription * 24) / (totalYearCost + monthlySubscription * 24)) * 100;
    const paybackMonths = totalYearCost / (totalAnnualSavings / 12);

    return {
      timeSavedWeekly: Math.round(hoursLostPerWeek * sector.savingsRate * employees * 0.1),
      timeSavedAnnually: Math.round(timeSavedAnnually * employees * 0.1),
      annualSavings: Math.round(totalAnnualSavings),
      savings3Years: Math.round(totalAnnualSavings * 3),
      savings5Years: Math.round(totalAnnualSavings * 5),
      roiYear1: Math.round(roiYear1),
      roiYear3: Math.round(roiYear3),
      paybackMonths: Math.max(1, Math.round(paybackMonths)),
      estimatedSetup: Math.round(implementationCost),
      estimatedMonthly: Math.round(monthlySubscription),
      errorReduction: Math.round(sector.errorReductionRate * 100),
      implementationWeeks: sector.implementationWeeks,
    };
  }, [selectedSector, employees, hourlyRate, hoursLostPerWeek, paramValue, sector]);

  return (
    <div className={`min-h-screen pt-24 pb-20 transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
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
              ? 'Estimez vos économies potentielles en quelques secondes. Ajustez les paramètres selon votre situation.'
              : 'Estimate your potential savings in seconds. Adjust the parameters to your situation.'}
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
            {/* Sector selection */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? '1. Votre secteur' : '1. Your sector'}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {sectors.map(s => {
                  const c = colorMap[s.color];
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSector(s.id); setSectorParam(null); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                        selectedSector === s.id
                          ? `${c.bg} ${c.border} ${c.text} ring-2 ${c.ring} ring-offset-1 ring-offset-transparent`
                          : isDark
                            ? 'border-[var(--border-primary)] text-gray-400 hover:border-[var(--border-secondary)]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs text-center leading-tight">
                        {lang === 'fr' ? s.labelFr : s.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                  <span className={`text-sm font-bold font-mono ${colors.text}`}>{employees}</span>
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
                  <span className={`text-sm font-bold font-mono ${colors.text}`}>{hourlyRate}€</span>
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
                  <span className={`text-sm font-bold font-mono ${colors.text}`}>{hoursLostPerWeek}h</span>
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

              {/* Sector specific param */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {lang === 'fr' ? sector.params.labelFr : sector.params.labelEn}
                  </label>
                  <span className={`text-sm font-bold font-mono ${colors.text}`}>
                    {selectedSector === 'finance' ? formatEuro(paramValue) : formatNumber(paramValue)}
                  </span>
                </div>
                <input
                  type="range"
                  min={sector.params.min}
                  max={sector.params.max}
                  step={sector.params.step}
                  value={paramValue}
                  onChange={e => setSectorParam(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span>{selectedSector === 'finance' ? formatEuro(sector.params.min) : formatNumber(sector.params.min)}</span>
                  <span>{selectedSector === 'finance' ? formatEuro(sector.params.max) : formatNumber(sector.params.max)}</span>
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
            <div className={`rounded-2xl border p-6 bg-gradient-to-br ${colors.gradient} ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`w-5 h-5 ${colors.text}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? `Économies estimées — ${sector.solution}` : `Estimated savings — ${sector.solution}`}
                </span>
              </div>
              <motion.p
                key={results.annualSavings}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-mono text-5xl font-bold mb-1 ${colors.text}`}
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
              <span>{lang === 'fr' ? 'Détail du calcul' : 'Calculation details'}</span>
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
                    { label: lang === 'fr' ? 'Heures récupérées/an' : 'Hours saved/year', value: `${results.timeSavedAnnually}h` },
                    { label: lang === 'fr' ? 'Implémentation estimée' : 'Estimated setup', value: formatEuro(results.estimatedSetup) },
                    { label: lang === 'fr' ? 'Abonnement mensuel estimé' : 'Estimated monthly fee', value: `${formatEuro(results.estimatedMonthly)}/mois` },
                    { label: lang === 'fr' ? 'Durée d\'implémentation' : 'Implementation time', value: `~${results.implementationWeeks} ${lang === 'fr' ? 'semaines' : 'weeks'}` },
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
              to="/quote"
              className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white transition-all ${colors.btn} shadow-lg`}
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
              { value: '+340%', label: lang === 'fr' ? 'Efficacité RH' : 'HR efficiency', color: 'text-blue-400' },
              { value: '-45%', label: lang === 'fr' ? 'Coûts opérationnels' : 'Operational costs', color: 'text-emerald-400' },
              { value: '+280%', label: lang === 'fr' ? 'Taux de conversion' : 'Conversion rate', color: 'text-purple-400' },
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
