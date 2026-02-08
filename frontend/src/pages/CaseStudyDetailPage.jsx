import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Target, Lightbulb, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '../components/ui/badge';

const IMAGES = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=1200&auto=format&fit=crop',
];

const DETAILS_FR = [
  {
    challenge: "GlobalTech faisait face a un volume de 500+ candidatures par semaine avec seulement 3 recruteurs. Le tri manuel prenait 80% de leur temps.",
    solution: "Deploiement de Receipty Talent avec screening automatise par IA, matching semantique des competences et un pipeline de recrutement entierement digitalise.",
    results: ["Temps de tri des CV reduit de 75%", "Taux de matching candidat/poste ameliore de 340%", "Onboarding reduit a 3 jours au lieu de 2 semaines", "ROI atteint en 6 semaines"],
    duration: "8 semaines", team: "4 consultants", tech: ["NLP", "Machine Learning", "API Integration"]
  },
  {
    challenge: "BioPharm perdait en moyenne 2.3M EUR par an en anomalies financieres non detectees et processus de reporting manuels.",
    solution: "Implementation de Receipty Spend avec detection d'anomalies en temps reel, previsions budgetaires par ML et reporting automatise conforme aux normes pharmaceutiques.",
    results: ["Reduction de 45% des couts operationnels", "Detection de 98% des anomalies financieres", "Reporting mensuel passe de 5 jours a 4 heures", "Conformite reglementaire automatisee"],
    duration: "12 semaines", team: "6 consultants", tech: ["Anomaly Detection", "Forecasting ML", "Compliance Engine"]
  },
  {
    challenge: "NeoRetail avait un taux de conversion de 1.2% sur leur ancien site e-commerce avec zero personnalisation de l'experience client.",
    solution: "Creation complete d'une plateforme e-commerce avec Web-on-Demand, integrant un moteur de recommandation IA, un search intelligent et une UX optimisee pour la conversion.",
    results: ["Taux de conversion passe de 1.2% a 4.6% (+280%)", "Panier moyen augmente de 35%", "Taux de retour clients +60%", "SEO organique +150% en 6 mois"],
    duration: "16 semaines", team: "5 consultants", tech: ["Recommendation Engine", "Semantic Search", "UX Optimization"]
  },
  {
    challenge: "MedStaff devait recruter 200+ professionnels de sante par mois dans un marche en tension extreme avec des criteres de qualification stricts.",
    solution: "Pipeline de recrutement medical automatise avec Receipty Talent, incluant verification automatique des certifications, matching par specialite et scoring predictif de retention.",
    results: ["85% du pipeline entierement automatise", "Temps de placement reduit de 60%", "Taux de retention a 12 mois ameliore de 40%", "Couverture de 95% des postes ouverts"],
    duration: "10 semaines", team: "5 consultants", tech: ["Credential Verification AI", "Predictive Analytics", "Healthcare APIs"]
  },
  {
    challenge: "InvestCorp gerait 50+ portefeuilles avec des tableaux Excel et des processus de reporting qui prenaient 2 semaines par trimestre.",
    solution: "Dashboard financier temps reel avec Receipty Spend, integrant predictions budgetaires par ML, alertes automatisees et reporting interactif pour les investisseurs.",
    results: ["Productivite de l'equipe finance +200%", "Reporting passe de 2 semaines a 2 heures", "Predictions budgetaires precises a 94%", "Satisfaction investisseurs +85%"],
    duration: "14 semaines", team: "4 consultants", tech: ["Real-time Analytics", "ML Forecasting", "Interactive Dashboards"]
  }
];

const DETAILS_EN = [
  {
    challenge: "GlobalTech was handling 500+ applications per week with only 3 recruiters. Manual screening took 80% of their time.",
    solution: "Deployment of Receipty Talent with AI-powered automated screening, semantic skills matching and a fully digitized recruitment pipeline.",
    results: ["CV screening time reduced by 75%", "Candidate/position matching rate improved by 340%", "Onboarding reduced to 3 days instead of 2 weeks", "ROI achieved in 6 weeks"],
    duration: "8 weeks", team: "4 consultants", tech: ["NLP", "Machine Learning", "API Integration"]
  },
  {
    challenge: "BioPharm was losing an average of 2.3M EUR per year in undetected financial anomalies and manual reporting processes.",
    solution: "Implementation of Receipty Spend with real-time anomaly detection, ML budget forecasting and automated reporting compliant with pharmaceutical standards.",
    results: ["45% reduction in operational costs", "98% financial anomaly detection rate", "Monthly reporting from 5 days to 4 hours", "Automated regulatory compliance"],
    duration: "12 weeks", team: "6 consultants", tech: ["Anomaly Detection", "Forecasting ML", "Compliance Engine"]
  },
  {
    challenge: "NeoRetail had a 1.2% conversion rate on their old e-commerce site with zero customer experience personalization.",
    solution: "Complete e-commerce platform creation with Web-on-Demand, integrating an AI recommendation engine, intelligent search and conversion-optimized UX.",
    results: ["Conversion rate from 1.2% to 4.6% (+280%)", "Average basket increased by 35%", "Customer return rate +60%", "Organic SEO +150% in 6 months"],
    duration: "16 weeks", team: "5 consultants", tech: ["Recommendation Engine", "Semantic Search", "UX Optimization"]
  },
  {
    challenge: "MedStaff needed to recruit 200+ healthcare professionals per month in an extremely tight market with strict qualification criteria.",
    solution: "Automated medical recruitment pipeline with Receipty Talent, including automatic certification verification, specialty matching and predictive retention scoring.",
    results: ["85% of pipeline fully automated", "Placement time reduced by 60%", "12-month retention rate improved by 40%", "95% coverage of open positions"],
    duration: "10 weeks", team: "5 consultants", tech: ["Credential Verification AI", "Predictive Analytics", "Healthcare APIs"]
  },
  {
    challenge: "InvestCorp managed 50+ portfolios with Excel spreadsheets and reporting processes that took 2 weeks per quarter.",
    solution: "Real-time financial dashboard with Receipty Spend, integrating ML budget predictions, automated alerts and interactive investor reporting.",
    results: ["Finance team productivity +200%", "Reporting from 2 weeks to 2 hours", "Budget predictions accurate to 94%", "Investor satisfaction +85%"],
    duration: "14 weeks", team: "4 consultants", tech: ["Real-time Analytics", "ML Forecasting", "Interactive Dashboards"]
  }
];

export default function CaseStudyDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const index = parseInt(id) || 0;
  const item = t.cases.items[index];
  const detail = lang === 'fr' ? DETAILS_FR[index] : DETAILS_EN[index];
  const image = IMAGES[index % IMAGES.length];

  if (!item || !detail) {
    return (
      <div className="pt-24 bg-[#050505] min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Case study not found.</p>
      </div>
    );
  }

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
    <div data-testid="case-detail-page" className="pt-24 bg-[#050505] min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Back link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link to="/cases" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors duration-200 mb-10" data-testid="back-to-cases">
            <ArrowLeft className="w-4 h-4" /> {lang === 'fr' ? 'Retour aux etudes de cas' : 'Back to case studies'}
          </Link>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-600/90 text-white border-0 font-mono text-xs px-3 py-1">{item.roi}</Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-xs">{item.category}</Badge>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            {item.title}
          </h1>
          <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-2xl">{item.desc}</p>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-10 rounded-2xl overflow-hidden border border-white/5"
        >
          <img src={image} alt={item.title} className="w-full h-64 md:h-80 object-cover" loading="lazy" />
        </motion.div>

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <div className="rounded-xl border border-white/5 bg-[#0F0F10] p-5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">{sectionLabel.duration}</p>
            <p className="mt-1 font-mono text-lg font-bold text-white">{detail.duration}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#0F0F10] p-5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">{sectionLabel.team}</p>
            <p className="mt-1 font-mono text-lg font-bold text-white">{detail.team}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#0F0F10] p-5">
            <p className="text-xs text-gray-600 uppercase tracking-wider">ROI</p>
            <p className="mt-1 font-mono text-lg font-bold text-blue-400">{item.roi}</p>
          </div>
        </motion.div>

        {/* Challenge */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-red-400" />
            <h2 className="font-heading text-xl font-bold text-white">{sectionLabel.challenge}</h2>
          </div>
          <p className="text-gray-400 leading-relaxed pl-8">{detail.challenge}</p>
        </motion.section>

        {/* Solution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="font-heading text-xl font-bold text-white">{sectionLabel.solution}</h2>
          </div>
          <p className="text-gray-400 leading-relaxed pl-8">{detail.solution}</p>
        </motion.section>

        {/* Results */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading text-xl font-bold text-white">{sectionLabel.results}</h2>
          </div>
          <div className="space-y-3 pl-8">
            {detail.results.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Technologies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-10"
        >
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-3 pl-8">{sectionLabel.tech}</p>
          <div className="flex flex-wrap gap-2 pl-8">
            {detail.tech.map((t) => (
              <span key={t} className="text-xs text-blue-400 bg-blue-600/10 border border-blue-500/20 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 pt-10 border-t border-white/5"
        >
          <Link
            to="/quote"
            data-testid="case-detail-cta"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-4 font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-105"
          >
            {sectionLabel.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
