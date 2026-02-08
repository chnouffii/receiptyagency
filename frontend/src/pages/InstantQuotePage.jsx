import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wallet, Globe, Check, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BASE_PRICES = {
  talent: { setup: 2500, monthly: 179 },
  spend: { setup: 3500, monthly: 229 },
  web: { setup: 1500, monthly: 129 },
};

const FEATURE_OPTIONS = {
  talent: ['Screening automatise', 'Matching IA', 'Onboarding digital', 'Analytics RH', 'Chatbot candidat'],
  spend: ['Detection anomalies', 'Previsions budget', 'Reporting auto', 'Conformite', 'OCR factures'],
  web: ['Site sur mesure', 'E-commerce IA', 'SEO automatise', 'Analytics', 'CMS headless'],
};

function getScaleMultiplier(size) {
  if (size <= 20) return 0.8;
  if (size <= 50) return 1.0;
  if (size <= 200) return 1.3;
  if (size <= 500) return 1.6;
  return 2.0;
}

function calculatePrice(category, companySize, features) {
  if (!category) return { setup: 0, monthly: 0 };
  const base = BASE_PRICES[category];
  const multiplier = getScaleMultiplier(companySize);
  const featureCount = features.length;
  const rawSetup = base.setup * multiplier + featureCount * 600;
  const rawMonthly = base.monthly * multiplier + featureCount * 40;
  return {
    setup: Math.min(10000, Math.max(1000, Math.round(rawSetup))),
    monthly: Math.min(499, Math.max(99, Math.round(rawMonthly))),
  };
}

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function InstantQuotePage() {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [companySize, setCompanySize] = useState(50);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const price = useMemo(() => calculatePrice(category, companySize, selectedFeatures), [category, companySize, selectedFeatures]);

  const categories = [
    { key: 'talent', icon: Users, label: t.solutions.talent.name, desc: t.solutions.talent.tag },
    { key: 'spend', icon: Wallet, label: t.solutions.spend.name, desc: t.solutions.spend.tag },
    { key: 'web', icon: Globe, label: t.solutions.web.name, desc: t.solutions.web.tag },
  ];

  const toggleFeature = (f) => {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const canNext = () => {
    if (step === 0) return !!category;
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return form.name && form.email && form.company;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
        category,
        company_size: companySize,
        features: selectedFeatures,
        estimated_setup: price.setup,
        estimated_monthly: price.monthly,
        language: lang,
      });
      setSubmitted(true);
      toast.success(t.quote.success);
    } catch {
      toast.error('Error submitting quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div data-testid="quote-success" className="pt-24 bg-[#050505] min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-white">{t.quote.success}</h2>
          <p className="mt-3 text-gray-400">{t.quote.success_desc}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-testid="quote-page" className="pt-24 bg-[#050505] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight">{t.quote.title}</h1>
          <p className="mt-4 text-base text-gray-400">{t.quote.subtitle}</p>
        </motion.div>

        {/* Progress */}
        <div className="mt-10 mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-3">
            {t.quote.steps.map((s, i) => (
              <span key={i} className={`${i <= step ? 'text-blue-400' : ''} transition-colors duration-200`}>{s}</span>
            ))}
          </div>
          <Progress value={(step + 1) * 25} className="h-1 bg-white/5" data-testid="quote-progress" />
        </div>

        {/* Step Content */}
        <div className="mt-10 min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-6">{t.quote.category_label}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => { setCategory(cat.key); setSelectedFeatures([]); }}
                        data-testid={`category-${cat.key}`}
                        className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-200 ${
                          category === cat.key
                            ? 'border-blue-500/50 bg-blue-600/10 shadow-[0_0_15px_rgba(0,122,255,0.15)]'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                        }`}
                      >
                        <cat.icon className={`w-8 h-8 ${category === cat.key ? 'text-blue-400' : 'text-gray-500'}`} />
                        <span className="font-heading font-semibold text-white text-sm">{cat.label}</span>
                        <span className="text-xs text-gray-500">{cat.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-6">{t.quote.scale_label}</h3>
                  <div className="bg-[#0F0F10] border border-white/5 rounded-2xl p-8">
                    <div className="text-center mb-8">
                      <span className="font-mono text-5xl font-bold text-blue-400">{companySize}</span>
                      <span className="text-gray-500 ml-2">{t.quote.employees}</span>
                    </div>
                    <Slider
                      data-testid="company-size-slider"
                      value={[companySize]}
                      onValueChange={(v) => setCompanySize(v[0])}
                      min={1}
                      max={500}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>1</span>
                      <span>100</span>
                      <span>250</span>
                      <span>500+</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-6">{t.quote.features_label}</h3>
                  <div className="space-y-3">
                    {(FEATURE_OPTIONS[category] || []).map((feature, i) => (
                      <label
                        key={feature}
                        data-testid={`feature-option-${i}`}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedFeatures.includes(feature)
                            ? 'border-blue-500/30 bg-blue-600/5'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                        }`}
                      >
                        <Checkbox
                          checked={selectedFeatures.includes(feature)}
                          onCheckedChange={() => toggleFeature(feature)}
                          className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-white mb-6">{t.quote.contact}</h3>
                      <div className="space-y-4">
                        {['name', 'email', 'company', 'phone'].map((field) => (
                          <input
                            key={field}
                            type={field === 'email' ? 'email' : 'text'}
                            placeholder={t.quote[field]}
                            value={form[field]}
                            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                            data-testid={`quote-input-${field}`}
                            className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-lg text-white placeholder:text-gray-600 h-12 px-4 text-sm outline-none transition-all duration-200"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Price Display */}
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-white mb-6">{t.quote.your_estimate}</h3>
                      <div className="rounded-2xl border border-blue-500/20 bg-blue-600/5 p-6 space-y-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.quote.setup_fee}</p>
                          <p className="font-mono text-3xl font-bold text-white mt-1" data-testid="setup-price">
                            {price.setup.toLocaleString()} &euro;
                          </p>
                        </div>
                        <div className="border-t border-white/5 pt-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{t.quote.monthly_fee}</p>
                          <p className="font-mono text-3xl font-bold text-blue-400 mt-1" data-testid="monthly-price">
                            {price.monthly.toLocaleString()} &euro;<span className="text-sm text-gray-500 font-normal">/mo</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-10 flex justify-between items-center">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            data-testid="quote-prev-btn"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> {t.quote.prev}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              data-testid="quote-next-btn"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              {t.quote.next} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              data-testid="quote-submit-btn"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              {submitting ? '...' : t.quote.submit} <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
