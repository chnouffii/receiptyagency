import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import { Calculator, TrendingUp, Clock, ArrowRight, CheckCircle, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react';

function formatEuro(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const card = { borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', padding: 24 };
const mono = "'Syne', ui-monospace, monospace";

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>
        <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        // WCAG 2.5.5 : la piste ne fait que 16px de haut. `height: 44` agrandit
        // la zone de saisie ; le navigateur centre la piste dedans.
        style={{ width: '100%', height: 44, accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4, color: 'var(--text3)' }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function ROICalculatorPage() {
  const { lang } = useLanguage();
  const [description, setDescription] = useState('');
  const [employees, setEmployees] = useState(50);
  const [hourlyRate, setHourlyRate] = useState(45);
  const [hoursLostPerWeek, setHoursLostPerWeek] = useState(20);
  const [showDetails, setShowDetails] = useState(false);

  const results = useMemo(() => {
    const annualHoursLost = hoursLostPerWeek * 52;
    const teamImpacted = employees * 0.1;
    const moneySavedFromTime = annualHoursLost * 0.6 * hourlyRate * teamImpacted;
    const totalAnnualSavings = moneySavedFromTime;
    const implementationCost = 2000 + employees * 30;
    const monthlySubscription = 149 + employees * 0.5;
    const totalYearCost = implementationCost + monthlySubscription * 12;
    const roiYear1 = ((totalAnnualSavings - totalYearCost) / totalYearCost) * 100;
    const roiYear3 = ((totalAnnualSavings * 3 - totalYearCost - monthlySubscription * 24) / (totalYearCost + monthlySubscription * 24)) * 100;
    const paybackMonths = totalYearCost / (totalAnnualSavings / 12);
    return {
      timeSavedWeekly: Math.round(hoursLostPerWeek * 0.6 * teamImpacted),
      timeSavedAnnually: Math.round(annualHoursLost * 0.6 * teamImpacted),
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
    <div style={{ paddingTop: 96, paddingBottom: 80, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="roi" />
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ textAlign: 'center', marginBottom: 48, opacity: 0, animation: 'riseIn .8s cubic-bezier(.2,.7,.2,1) .05s forwards' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
            <Calculator style={{ width: 15, height: 15 }} /> {lang === 'fr' ? 'Calculateur ROI' : 'ROI Calculator'}
          </div>
          <h1 style={{ fontFamily: mono, fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>
            {lang === 'fr' ? 'Combien pouvez-vous économiser' : 'How much can you save'}<br />
            <span style={{ color: 'var(--accent)' }}>{lang === 'fr' ? "avec l'IA ?" : 'with AI?'}</span>
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, maxWidth: 560, margin: '16px auto 0', color: 'var(--text2)' }}>
            {lang === 'fr' ? 'Décrivez votre projet et ajustez les paramètres pour estimer vos économies.' : 'Describe your project and adjust the parameters to estimate your savings.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={card}>
              <h2 style={{ fontFamily: mono, fontSize: 17, fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>{lang === 'fr' ? '1. Votre projet' : '1. Your project'}</h2>
              <p style={{ fontSize: 12.5, margin: '0 0 14px', color: 'var(--text3)' }}>{lang === 'fr' ? 'Décrivez les processus que vous souhaitez automatiser.' : 'Describe the processes you want to automate.'}</p>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                placeholder={lang === 'fr' ? 'Ex : gestion des factures, traitement des candidatures, reporting hebdomadaire...' : 'E.g. invoice processing, applicant tracking, weekly reports...'}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, fontSize: 14, resize: 'none', outline: 'none', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', transition: 'border-color .2s, box-shadow .2s' }} />
              {description.length > 10 && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--accent)' }}>
                  <Zap style={{ width: 14, height: 14 }} /> {lang === 'fr' ? 'Pris en compte dans votre estimation.' : 'Taken into account in your estimate.'}
                </div>
              )}
            </div>

            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 22 }}>
              <h2 style={{ fontFamily: mono, fontSize: 17, fontWeight: 600, margin: 0, color: 'var(--text)' }}>{lang === 'fr' ? '2. Votre entreprise' : '2. Your company'}</h2>
              <Slider label={lang === 'fr' ? "Nombre d'employés" : 'Number of employees'} value={employees} min={5} max={500} step={5} unit="" onChange={setEmployees} />
              <Slider label={lang === 'fr' ? 'Coût horaire moyen (€/h)' : 'Average hourly cost (€/h)'} value={hourlyRate} min={20} max={150} step={5} unit="€" onChange={setHourlyRate} />
              <Slider label={lang === 'fr' ? 'Heures perdues/semaine' : 'Hours lost/week'} value={hoursLostPerWeek} min={2} max={80} step={1} unit="h" onChange={setHoursLostPerWeek} />
            </div>
          </div>

          {/* Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...card, background: 'linear-gradient(135deg, rgba(59,130,246,.18), rgba(59,130,246,.04))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles style={{ width: 18, height: 18, color: 'var(--accent)' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>{lang === 'fr' ? 'Économies estimées — Receipty AI' : 'Estimated savings — Receipty AI'}</span>
              </div>
              <motion.p key={results.annualSavings} initial={{ scale: 0.96, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} style={{ fontFamily: mono, fontSize: 44, fontWeight: 700, margin: '0 0 2px', color: 'var(--accent)' }}>
                {formatEuro(results.annualSavings)}
              </motion.p>
              <p style={{ fontSize: 14, color: 'var(--text3)', margin: 0 }}>{lang === 'fr' ? 'par an' : 'per year'}</p>
              <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(110px,100%),1fr))', gap: 12 }}>
                {[
                  { l: lang === 'fr' ? '3 ans' : '3 years', v: formatEuro(results.savings3Years), c: 'var(--text)' },
                  { l: 'ROI an 1', v: `${results.roiYear1 > 0 ? '+' : ''}${results.roiYear1}%`, c: results.roiYear1 > 0 ? 'var(--success)' : 'var(--danger)' },
                  { l: lang === 'fr' ? 'Retour invest.' : 'Payback', v: `${results.paybackMonths} ${lang === 'fr' ? 'mois' : 'mo.'}`, c: 'var(--text)' },
                ].map((k, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 12, background: 'var(--surface2)' }}>
                    <p style={{ fontSize: 11.5, color: 'var(--text3)', margin: '0 0 4px' }}>{k.l}</p>
                    <p style={{ fontFamily: mono, fontSize: 17, fontWeight: 700, color: k.c, margin: 0 }}>{k.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              <div style={card}>
                <Clock style={{ width: 16, height: 16, color: '#e0a153', marginBottom: 8 }} />
                <p style={{ fontSize: 11.5, color: 'var(--text3)', margin: '0 0 4px' }}>{lang === 'fr' ? 'Temps récupéré/semaine' : 'Time saved/week'}</p>
                <p style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{results.timeSavedWeekly}h</p>
              </div>
              <div style={card}>
                <TrendingUp style={{ width: 16, height: 16, color: 'var(--success)', marginBottom: 8 }} />
                <p style={{ fontSize: 11.5, color: 'var(--text3)', margin: '0 0 4px' }}>{lang === 'fr' ? 'Réduction des erreurs' : 'Error reduction'}</p>
                <p style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: 'var(--success)', margin: 0 }}>-78%</p>
              </div>
            </div>

            <button onClick={() => setShowDetails(!showDetails)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text2)', fontSize: 14, cursor: 'pointer' }}>
              <span>{lang === 'fr' ? 'Détail du calcul' : 'Calculation details'}</span>
              {showDetails ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ ...card, overflow: 'hidden' }}>
                  {[
                    { label: lang === 'fr' ? 'Heures récupérées/an' : 'Hours saved/year', value: `${results.timeSavedAnnually}h` },
                    { label: lang === 'fr' ? 'Implémentation estimée' : 'Estimated setup', value: formatEuro(results.estimatedSetup) },
                    { label: lang === 'fr' ? 'Abonnement mensuel estimé' : 'Estimated monthly fee', value: `${formatEuro(results.estimatedMonthly)}/mois` },
                    { label: lang === 'fr' ? 'ROI sur 3 ans' : '3-year ROI', value: `+${results.roiYear3}%` },
                    { label: lang === 'fr' ? 'Économies sur 5 ans' : '5-year savings', value: formatEuro(results.savings5Years) },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13.5, color: 'var(--text2)' }}>{item.label}</span>
                      <span style={{ fontFamily: mono, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{item.value}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, paddingTop: 10, margin: 0, color: 'var(--text3)' }}>
                    {lang === 'fr' ? '* Estimations basées sur des projets similaires. Les résultats réels peuvent varier.' : '* Estimates based on similar projects. Actual results may vary.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={card}>
              <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12, color: 'var(--text2)' }}>{lang === 'fr' ? 'Inclus avec votre solution' : 'Included with your solution'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(lang === 'fr'
                  ? ['Intégration complète avec vos outils existants', 'Formation et accompagnement de votre équipe', 'Support dédié 5j/7', 'Tableau de bord et reporting en temps réel']
                  : ['Full integration with your existing tools', 'Team training and onboarding support', 'Dedicated support 5 days/week', 'Real-time dashboard and reporting']
                ).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle style={{ width: 15, height: 15, color: 'var(--success)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/contact" data-magnetic style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '16px', borderRadius: 12, fontWeight: 700, color: '#fff', background: 'var(--accent2)', textDecoration: 'none', boxShadow: '0 0 0 1px var(--accent2), 0 12px 40px -8px var(--glow)' }}>
              {lang === 'fr' ? 'Démarrer mon projet' : 'Start my project'} <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
            <Link to="/contact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--text2)', border: '1px solid var(--border)', textDecoration: 'none' }}>
              {lang === 'fr' ? 'Parler à un expert' : 'Talk to an expert'}
            </Link>
          </div>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 64, borderRadius: 22, border: '1px solid var(--border)', background: 'var(--surface)', padding: 'clamp(20px,5vw,32px)', textAlign: 'center' }}>
          <p style={{ fontSize: 14, marginBottom: 24, color: 'var(--text3)' }}>{lang === 'fr' ? 'Résultats observés chez nos clients' : 'Results observed with our clients'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(150px,100%),1fr))', gap: 'clamp(16px,4vw,32px)' }}>
            {[
              { value: '+340%', label: lang === 'fr' ? 'Efficacité opérationnelle' : 'Operational efficiency', color: 'var(--accent)' },
              { value: '-45%', label: lang === 'fr' ? 'Coûts opérationnels' : 'Operational costs', color: 'var(--success)' },
              { value: '+280%', label: lang === 'fr' ? 'Productivité équipe' : 'Team productivity', color: 'var(--cyan)' },
            ].map((stat, i) => (
              <div key={i}>
                <p style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 13.5, marginTop: 4, color: 'var(--text3)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
