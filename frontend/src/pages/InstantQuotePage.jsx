import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Wallet, Globe, Cpu, ShoppingCart, Mail, Shield, BarChart3,
  Check, ArrowRight, ArrowLeft, Send, Info, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import { calculerFourchette, formaterFourchette, LIBELLES_PALIERS } from '../lib/pricing';
import axios from 'axios';

/**
 * /quote — Estimation de budget.
 *
 * Ce n'est PAS un devis : la page affiche une fourchette explicitement
 * indicative, sans montant sec, et ne génère aucun PDF. Le devis réel est
 * produit depuis l'espace admin (POST /api/admin/quotes/generate), numéroté et
 * avec TVA. Toute la grille tarifaire vit dans `lib/pricing.js`.
 *
 * Le lead transmis porte la BORNE BASSE dans `estimated_setup` /
 * `estimated_monthly` — l'agrégat de pipeline reste prudent — et la borne haute
 * plus le palier dans les champs `*_max` / `budget_tier`.
 */

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICON_MAP = {
  users: Users, wallet: Wallet, globe: Globe, cpu: Cpu,
  'shopping-cart': ShoppingCart, mail: Mail, shield: Shield, 'bar-chart': BarChart3,
};

const PALIERS_EFFECTIF = [10, 20, 50, 100, 200, 350, 500, 1000];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const carte = {
  borderRadius: 18,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
};

const champ = {
  width: '100%',
  minHeight: 48,
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--bg2)',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
};

const onFocus = (e) => {
  e.target.style.borderColor = 'var(--accent)';
  e.target.style.boxShadow = '0 0 0 3px var(--glow)';
};
const onBlur = (e) => {
  e.target.style.borderColor = 'var(--border)';
  e.target.style.boxShadow = 'none';
};

export default function InstantQuotePage() {
  const { t, lang } = useLanguage();
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedSolutionId, setSelectedSolutionId] = useState('');
  const [companySize, setCompanySize] = useState(50);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get(`${API}/solutions`)
      .then((res) => { setSolutions(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const selectedSolution = useMemo(
    () => solutions.find((s) => s.id === selectedSolutionId),
    [solutions, selectedSolutionId],
  );

  const availableFeatures = useMemo(() => {
    if (!selectedSolution) return [];
    return lang === 'fr'
      ? (selectedSolution.features_fr || [])
      : (selectedSolution.features_en || selectedSolution.features_fr || []);
  }, [selectedSolution, lang]);

  const fourchette = useMemo(
    () => calculerFourchette(companySize, selectedFeatures.length),
    [companySize, selectedFeatures.length],
  );

  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

  const toggleFeature = (f) =>
    setSelectedFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const selectSolution = (id) => {
    setSelectedSolutionId(id);
    setSelectedFeatures([]);
  };

  const canNext = () => {
    if (step === 0) return !!selectedSolutionId;
    if (step === 3) return form.name && form.email && form.company;
    return true;
  };

  const handleSubmit = async () => {
    if (!canNext()) return;
    setSubmitting(true);
    const catName = selectedSolution
      ? (lang === 'fr' ? selectedSolution.name_fr : (selectedSolution.name_en || selectedSolution.name_fr))
      : '';
    try {
      await axios.post(`${API}/leads`, {
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
        category: catName,
        company_size: companySize,
        features: selectedFeatures,
        // Borne basse dans les champs historiques, borne haute à côté.
        estimated_setup: fourchette.surMesure ? 0 : fourchette.setup[0],
        estimated_monthly: fourchette.surMesure ? 0 : fourchette.monthly[0],
        estimated_setup_max: fourchette.surMesure ? 0 : fourchette.setup[1],
        estimated_monthly_max: fourchette.surMesure ? 0 : fourchette.monthly[1],
        budget_tier: LIBELLES_PALIERS[fourchette.palier]?.fr || fourchette.palier,
        language: lang,
      });
      setSubmitted(true);
      toast.success(t.quote.success);
    } catch {
      toast.error(lang === 'fr' ? "Erreur lors de l'envoi" : 'Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Écran de confirmation ────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        data-testid="quote-success"
        style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}
        className="flex items-center justify-center"
      >
        <SEOHead page="quote" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div
            style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check style={{ width: 30, height: 30, color: 'var(--accent-text)' }} />
          </div>
          <h1 className="font-heading" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
            {t.quote.success}
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, color: 'var(--text2)' }}>
            {t.quote.success_desc}
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 44, marginTop: 28, padding: '12px 22px', borderRadius: 100,
              border: '1px solid var(--border2)', color: 'var(--text)',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            {lang === 'fr' ? "Retour à l'accueil" : 'Back to home'}
          </Link>
        </motion.div>
      </div>
    );
  }

  const etapes = t.quote.steps;

  return (
    <div
      data-testid="quote-page"
      style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}
    >
      <SEOHead page="quote" />
      <div className="max-w-4xl mx-auto px-5 sm:px-6" style={{ paddingBottom: 96 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1
            className="font-heading"
            style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}
          >
            {t.quote.title}
          </h1>
          <p style={{ marginTop: 14, fontSize: 16, color: 'var(--text2)' }}>{t.quote.subtitle}</p>
        </div>

        {/* Progression — les libellés restent lisibles à toutes les étapes */}
        <div style={{ marginTop: 40, marginBottom: 8 }}>
          <ol
            className="flex justify-between"
            style={{ fontSize: 12, listStyle: 'none', padding: 0, margin: '0 0 12px', gap: 8 }}
          >
            {etapes.map((s, i) => (
              <li
                key={s}
                aria-current={i === step ? 'step' : undefined}
                style={{
                  color: i <= step ? 'var(--accent-text)' : 'var(--text3)',
                  fontWeight: i <= step ? 600 : 500,
                  transition: 'color .2s',
                }}
              >
                {s}
              </li>
            ))}
          </ol>
          <div
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={etapes.length}
            aria-label={lang === 'fr' ? 'Progression' : 'Progress'}
            style={{ height: 4, borderRadius: 100, background: 'var(--surface2)', overflow: 'hidden' }}
          >
            <motion.div
              animate={{ width: `${((step + 1) / etapes.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%', background: 'var(--accent)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 40, minHeight: 360 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
            >
              {/* ── Étape 0 : besoin ─────────────────────────────────────── */}
              {step === 0 && (
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend className="font-heading" style={{ fontSize: 19, fontWeight: 600, marginBottom: 18 }}>
                    {t.quote.category_label}
                  </legend>
                  {loading ? (
                    <p style={{ color: 'var(--text3)' }}>{lang === 'fr' ? 'Chargement…' : 'Loading…'}</p>
                  ) : (
                    <div
                      className="grid gap-3"
                      style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))' }}
                    >
                      {solutions.map((sol) => {
                        const Icon = ICON_MAP[sol.icon] || Users;
                        const actif = selectedSolutionId === sol.id;
                        const nom = lang === 'fr' ? sol.name_fr : (sol.name_en || sol.name_fr);
                        const desc = lang === 'fr' ? sol.desc_fr : (sol.desc_en || sol.desc_fr);
                        return (
                          <button
                            key={sol.id}
                            type="button"
                            onClick={() => selectSolution(sol.id)}
                            aria-pressed={actif}
                            data-testid={`quote-solution-${sol.id}`}
                            style={{
                              ...carte,
                              minHeight: 44,
                              padding: 18,
                              textAlign: 'left',
                              cursor: 'pointer',
                              borderColor: actif ? 'var(--accent)' : 'var(--border)',
                              background: actif
                                ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                                : 'var(--surface)',
                              transition: 'border-color .2s, background .2s',
                            }}
                          >
                            <Icon style={{ width: 22, height: 22, color: 'var(--accent-text)', marginBottom: 10 }} />
                            <span
                              className="font-heading"
                              style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}
                            >
                              {nom}
                            </span>
                            <span
                              style={{ display: 'block', marginTop: 6, fontSize: 13, lineHeight: 1.5, color: 'var(--text2)' }}
                            >
                              {desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              )}

              {/* ── Étape 1 : taille ─────────────────────────────────────── */}
              {step === 1 && (
                <div>
                  <label
                    htmlFor="quote-size"
                    className="font-heading"
                    style={{ display: 'block', fontSize: 19, fontWeight: 600, marginBottom: 18 }}
                  >
                    {t.quote.scale_label}
                  </label>
                  <div style={{ ...carte, padding: 24 }}>
                    <p
                      className="font-heading"
                      style={{ fontSize: 34, fontWeight: 700, color: 'var(--accent-text)', margin: 0 }}
                    >
                      {companySize >= 1000 ? '1000+' : companySize}{' '}
                      <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text2)' }}>
                        {t.quote.employees}
                      </span>
                    </p>
                    <input
                      id="quote-size"
                      type="range"
                      min={0}
                      max={PALIERS_EFFECTIF.length - 1}
                      step={1}
                      value={PALIERS_EFFECTIF.indexOf(companySize) === -1 ? 2 : PALIERS_EFFECTIF.indexOf(companySize)}
                      onChange={(e) => setCompanySize(PALIERS_EFFECTIF[Number(e.target.value)])}
                      aria-label={t.quote.scale_label}
                      aria-valuetext={`${companySize} ${t.quote.employees}`}
                      style={{ width: '100%', height: 44, marginTop: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)' }}>
                      <span>10</span>
                      <span>1000+</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Étape 2 : options ────────────────────────────────────── */}
              {step === 2 && (
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend className="font-heading" style={{ fontSize: 19, fontWeight: 600, marginBottom: 18 }}>
                    {t.quote.features_label}
                  </legend>
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))' }}
                  >
                    {availableFeatures.map((f) => {
                      const actif = selectedFeatures.includes(f);
                      return (
                        <label
                          key={f}
                          style={{
                            ...carte,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            minHeight: 56,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderColor: actif ? 'var(--accent)' : 'var(--border)',
                            background: actif
                              ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                              : 'var(--surface)',
                            transition: 'border-color .2s, background .2s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={actif}
                            onChange={() => toggleFeature(f)}
                            style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 14, color: 'var(--text)' }}>{f}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* ── Étape 3 : fourchette + coordonnées ───────────────────── */}
              {step === 3 && (
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))' }}>
                  <div>
                    <h2 className="font-heading" style={{ fontSize: 19, fontWeight: 600, marginBottom: 18 }}>
                      {t.quote.contact}
                    </h2>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {[
                        { k: 'name', label: t.quote.name, type: 'text', autoComplete: 'name', req: true },
                        { k: 'email', label: t.quote.email, type: 'email', autoComplete: 'email', req: true },
                        { k: 'company', label: t.quote.company, type: 'text', autoComplete: 'organization', req: true },
                        { k: 'phone', label: t.quote.phone, type: 'tel', autoComplete: 'tel', req: false },
                      ].map((f) => (
                        <div key={f.k}>
                          <label
                            htmlFor={`quote-${f.k}`}
                            style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}
                          >
                            {f.label}
                            {f.req && (
                              <span style={{ color: 'var(--danger)' }} aria-label={t.quote.required}> *</span>
                            )}
                          </label>
                          <input
                            id={`quote-${f.k}`}
                            type={f.type}
                            autoComplete={f.autoComplete}
                            required={f.req}
                            value={form[f.k]}
                            onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            style={champ}
                            data-testid={`quote-input-${f.k}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="font-heading" style={{ fontSize: 19, fontWeight: 600, marginBottom: 18 }}>
                      {t.quote.your_estimate}
                    </h2>

                    {fourchette.surMesure ? (
                      <div style={{ ...carte, padding: 24 }}>
                        <MessageSquare style={{ width: 24, height: 24, color: 'var(--accent-text)', marginBottom: 12 }} />
                        <p className="font-heading" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                          {t.quote.custom_quote}
                        </p>
                        <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: 'var(--text2)' }}>
                          {t.quote.custom_desc}
                        </p>
                      </div>
                    ) : (
                      <div style={{ ...carte, padding: 24 }} data-testid="quote-range">
                        {selectedSolution && (
                          <p
                            style={{
                              fontSize: 13, fontWeight: 600, color: 'var(--accent-text)',
                              margin: '0 0 16px', paddingBottom: 14, borderBottom: '1px solid var(--border)',
                            }}
                          >
                            {lang === 'fr' ? selectedSolution.name_fr : (selectedSolution.name_en || selectedSolution.name_fr)}
                          </p>
                        )}
                        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)', margin: 0 }}>
                          {t.quote.setup_fee}
                        </p>
                        <p
                          className="font-heading"
                          style={{ fontSize: 'clamp(1.4rem,4vw,1.9rem)', fontWeight: 700, margin: '4px 0 0' }}
                          data-testid="setup-range"
                        >
                          {formaterFourchette(fourchette.setup, locale)}
                        </p>

                        <p
                          style={{
                            fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em',
                            color: 'var(--text2)', margin: '20px 0 0', paddingTop: 16, borderTop: '1px solid var(--border)',
                          }}
                        >
                          {t.quote.monthly_fee}
                        </p>
                        <p
                          className="font-heading"
                          style={{ fontSize: 'clamp(1.4rem,4vw,1.9rem)', fontWeight: 700, color: 'var(--accent-text)', margin: '4px 0 0' }}
                          data-testid="monthly-range"
                        >
                          {formaterFourchette(fourchette.monthly, locale)}
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>{t.quote.per_month}</span>
                        </p>
                      </div>
                    )}

                    {/* Mention non contractuelle — obligatoire dès qu'un montant apparaît */}
                    <div
                      style={{
                        display: 'flex', gap: 10, marginTop: 14, padding: 14,
                        borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)',
                      }}
                    >
                      <Info style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: 'var(--text2)' }} />
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text2)' }}>
                        <strong style={{ color: 'var(--text)' }}>{t.quote.disclaimer_title}.</strong>{' '}
                        {t.quote.disclaimer_body}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            data-testid="quote-prev-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '10px 16px',
              background: 'transparent', border: 'none', color: 'var(--text2)', fontSize: 14,
              cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.35 : 1,
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} /> {t.quote.prev}
          </button>

          <button
            type="button"
            onClick={() => (step < 3 ? setStep((s) => s + 1) : handleSubmit())}
            disabled={!canNext() || submitting}
            data-testid={step < 3 ? 'quote-next-btn' : 'quote-submit-btn'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '12px 24px',
              borderRadius: 100, border: 'none', background: 'var(--accent2)', color: '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: !canNext() || submitting ? 'not-allowed' : 'pointer',
              opacity: !canNext() || submitting ? 0.45 : 1,
              boxShadow: '0 0 0 1px var(--accent2), 0 12px 40px -8px var(--glow)',
            }}
          >
            {step < 3
              ? <>{t.quote.next} <ArrowRight style={{ width: 16, height: 16 }} /></>
              : <>{submitting ? '…' : t.quote.submit} <Send style={{ width: 16, height: 16 }} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
