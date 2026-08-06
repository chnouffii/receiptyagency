import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  Check,
  Globe,
  Layers3,
  Mail,
  Radar,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { S, T, TAP, staggerContainer, staggerItem } from './demoTokens';
import { CopyButton, DemoButton, EmptyState, Panel, SectionLabel, StatusBadge } from './DemoUI';
import { useProcessingSequence } from './useProcessingSequence';
import { PROSPECT_SAMPLES, SCAN_STEPS } from './data/prospectsData';

/**
 * Démo 4 — Enrichment & scoring de prospect.
 *
 * L'URL d'un site suffit : la démo reconstitue la fiche d'entreprise, détecte
 * la stack technique, note la maturité digitale et rédige l'email d'approche.
 */
export function ProspectScoringDemo() {
  const [url, setUrl] = useState('');
  const [prospect, setProspect] = useState(null);
  const { status, currentStep, start, reset } = useProcessingSequence(SCAN_STEPS);

  const runScan = (sample, typedUrl) => {
    setUrl(typedUrl ?? sample.domain);
    setProspect(null);
    // TODO: Remplacer par POST /api/prospects/enrich → webhook n8n
    // `receipty-prospect-enrich` (crawl + Wappalyzer + Pappers + GPT-4o).
    start(() => setProspect(sample));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (status === 'running' || url.trim().length < 4) return;
    const normalized = url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const matched =
      PROSPECT_SAMPLES.find((sample) => sample.domain === normalized) ||
      PROSPECT_SAMPLES.find((sample) => normalized.includes(sample.id)) ||
      PROSPECT_SAMPLES[0];
    runScan(matched, normalized);
  };

  const handleReset = () => {
    reset();
    setProspect(null);
    setUrl('');
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={staggerItem} className={`${S.panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="max-w-2xl">
          <h1 className={T.h1}>Enrichment &amp; scoring de prospect</h1>
          <p className={`${T.body} mt-1.5`}>
            À partir d’une simple adresse de site, l’assistant reconstitue la fiche entreprise, détecte les outils en
            place, note le potentiel d’automatisation et rédige l’email d’approche correspondant.
          </p>
        </div>
        <DemoButton
          variant="success"
          icon={Sparkles}
          onClick={() => runScan(PROSPECT_SAMPLES[0])}
          disabled={status === 'running'}
          data-testid="prospect-prefill"
        >
          Remplir avec un exemple réel
        </DemoButton>
      </motion.div>

      {/* ── Saisie du domaine ────────────────────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <Panel
          title="Site à analyser"
          subtitle="Saisissez un domaine ou partez d’un exemple"
          icon={Globe}
          action={
            prospect && (
              <motion.button
                whileTap={TAP}
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800/70 hover:text-slate-200"
                data-testid="prospect-reset"
              >
                <RotateCcw size={14} strokeWidth={1.75} />
                Réinitialiser
              </motion.button>
            )
          }
        >
          <div className="space-y-4 p-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Globe
                  size={16}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="exemple-entreprise.fr"
                  disabled={status === 'running'}
                  data-testid="prospect-url"
                  className="w-full rounded-lg border border-slate-800/80 bg-[#080B12] py-2.5 pl-10 pr-3.5 font-data text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>
              <DemoButton
                type="submit"
                icon={Search}
                loading={status === 'running'}
                disabled={status === 'running' || url.trim().length < 4}
                data-testid="prospect-analyze"
              >
                {status === 'running' ? 'Analyse en cours' : 'Analyser le site'}
              </DemoButton>
            </form>

            <div>
              <SectionLabel>Exemples pré-remplis</SectionLabel>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                {PROSPECT_SAMPLES.map((sample) => (
                  <motion.button
                    key={sample.id}
                    whileTap={TAP}
                    type="button"
                    disabled={status === 'running'}
                    onClick={() => runScan(sample)}
                    data-testid={`prospect-sample-${sample.id}`}
                    className={`${S.cardInteractive} flex items-center gap-3 p-3.5 text-left disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
                      <Building2 size={16} strokeWidth={1.5} className="text-slate-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-data text-sm text-slate-100">{sample.domain}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400">
                        {sample.company.name} · {sample.company.employees}
                      </span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* ── Scan / résultat ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {status === 'running' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RadarScanner url={url} currentStep={currentStep} />
          </motion.div>
        )}

        {status === 'idle' && !prospect && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className={S.panel}>
              <EmptyState
                icon={Radar}
                title="Aucune analyse lancée"
                description="Choisissez l’un des deux exemples ou saisissez un domaine pour lancer le scan."
              />
            </div>
          </motion.div>
        )}

        {prospect && status === 'done' && (
          <motion.div
            key={prospect.id}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]"
          >
            {/* Colonne gauche : score + identité */}
            <div className="space-y-5">
              <motion.div variants={staggerItem}>
                <Panel title="Score de pertinence" icon={Target}>
                  <div className="flex flex-col items-center p-5">
                    <ScoreGauge score={prospect.score.global} />
                    <StatusBadge tone={prospect.score.global >= 80 ? 'success' : 'warning'} className="mt-4">
                      {prospect.score.verdict}
                    </StatusBadge>

                    <div className="mt-5 w-full space-y-3.5">
                      {prospect.score.breakdown.map((item, index) => (
                        <div key={item.label}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-xs font-medium text-slate-300">{item.label}</span>
                            <span className="font-data text-xs font-semibold tabular-nums text-slate-100">
                              {item.value}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <motion.div
                              className={`h-full rounded-full ${
                                item.value >= 80 ? 'bg-emerald-500' : item.value >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              initial={{ width: '0%' }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 0.7, delay: 0.15 + index * 0.08, ease: 'easeOut' }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] leading-snug text-slate-400">{item.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Panel title="Fiche entreprise" subtitle="Données légales consolidées" icon={Building2}>
                  <dl className="divide-y divide-slate-800/80">
                    {[
                      ['Raison sociale', `${prospect.company.name} (${prospect.company.legalForm})`, false],
                      ['SIREN', prospect.company.siren, true],
                      ['Code NAF', prospect.company.naf, false],
                      ['Localisation', prospect.company.city, false],
                      ['Effectif', prospect.company.employees, true],
                      ['Chiffre d’affaires', prospect.company.revenue, true],
                      ['Création', prospect.company.founded, true],
                      ['Décideur identifié', prospect.company.decisionMaker, false],
                    ].map(([label, value, mono]) => (
                      <div key={label} className="flex items-start justify-between gap-4 px-5 py-2.5">
                        <dt className="shrink-0 text-xs text-slate-400">{label}</dt>
                        <dd className={`text-right text-xs text-slate-100 ${mono ? 'font-data tabular-nums' : ''}`}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              </motion.div>
            </div>

            {/* Colonne droite : stack, signaux, opportunités, email */}
            <div className="space-y-5">
              <motion.div variants={staggerItem}>
                <Panel
                  title="Stack technique détectée"
                  subtitle={`${prospect.stack.length} technologies identifiées sur ${prospect.domain}`}
                  icon={Layers3}
                >
                  <div className="flex flex-wrap gap-2 p-5">
                    {prospect.stack.map((tech, index) => (
                      <motion.span
                        key={tech.name}
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${
                          tech.negative
                            ? 'border-amber-500/30 bg-amber-500/10'
                            : 'border-slate-800/80 bg-slate-800/40'
                        }`}
                      >
                        {tech.negative ? (
                          <X size={13} strokeWidth={2.5} className="text-amber-400" />
                        ) : (
                          <Check size={13} strokeWidth={2.5} className="text-emerald-400" />
                        )}
                        <span className="text-xs font-medium text-slate-100">{tech.name}</span>
                        <span className="text-[10px] text-slate-400">{tech.category}</span>
                        <span className="font-data text-[10px] tabular-nums text-slate-400">{tech.confidence} %</span>
                      </motion.span>
                    ))}
                  </div>
                </Panel>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Panel title="Signaux relevés sur le site" icon={Search}>
                  <ul className="space-y-2 p-5">
                    {prospect.signals.map((signal) => (
                      <li key={signal} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
                        <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Panel
                  title="Opportunités d’automatisation"
                  subtitle="Identifiées par croisement des signaux et de la stack"
                  icon={Zap}
                >
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    {prospect.opportunities.map((opportunity) => (
                      <div key={opportunity.title} className={`${S.card} flex flex-col p-4`}>
                        <h3 className="font-heading text-sm font-semibold text-slate-100">{opportunity.title}</h3>
                        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">
                          {opportunity.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <StatusBadge tone={opportunity.impact === 'Fort' ? 'success' : 'info'}>
                            Impact {opportunity.impact.toLowerCase()}
                          </StatusBadge>
                          <StatusBadge tone={opportunity.effort === 'Faible' ? 'success' : 'warning'}>
                            Effort {opportunity.effort.toLowerCase()}
                          </StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Panel
                  title="Email de prospection généré"
                  subtitle="Personnalisé à partir des signaux relevés"
                  icon={Mail}
                  action={
                    <CopyButton
                      text={`Objet : ${prospect.email.subject}\n\n${prospect.email.body}`}
                      label="Copier l’email"
                      copiedLabel="Copié"
                      testId="prospect-copy-email"
                    />
                  }
                >
                  <div className="space-y-3 p-5">
                    <div className={`${S.well} p-4`}>
                      <p className={T.label}>Objet</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">{prospect.email.subject}</p>
                    </div>
                    <div className={`${S.well} p-4`}>
                      <p className={T.label}>Corps du message</p>
                      <p
                        className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300"
                        data-testid="prospect-email-body"
                      >
                        {prospect.email.body}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Chaque email reprend au moins deux éléments factuels observés sur le site : c’est ce qui fait la
                      différence entre une approche personnalisée et un publipostage.
                    </p>
                  </div>
                </Panel>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ────────────────────────────── Sous-composants ────────────────────────── */

/** Scanner radar : balayage circulaire + progression des étapes d'analyse. */
function RadarScanner({ url, currentStep }) {
  return (
    <div className={`${S.panel} grid items-center gap-8 p-8 md:grid-cols-[220px_minmax(0,1fr)]`}>
      <div className="relative mx-auto h-[220px] w-[220px]">
        {/* Cercles concentriques et croisillon */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {[92, 68, 44, 20].map((radius) => (
            <circle
              key={radius}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(148,163,184,0.16)"
              strokeWidth="1"
            />
          ))}
          <line x1="100" y1="8" x2="100" y2="192" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
          <line x1="8" y1="100" x2="192" y2="100" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
        </svg>

        {/* Balayage */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(59,130,246,0) 0deg, rgba(59,130,246,0) 300deg, rgba(59,130,246,0.28) 360deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        />

        {/* Points détectés, révélés au fil des étapes */}
        {[
          { top: '28%', left: '62%' },
          { top: '58%', left: '34%' },
          { top: '44%', left: '74%' },
          { top: '70%', left: '58%' },
          { top: '36%', left: '42%' },
        ].map((position, index) => (
          <AnimatePresence key={`${position.top}-${position.left}`}>
            {index <= currentStep && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400"
                style={position}
                aria-hidden="true"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
              </motion.span>
            )}
          </AnimatePresence>
        ))}

        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-800/80 bg-[#0B0F17]">
          <Radar size={18} strokeWidth={1.75} className="text-blue-400" />
        </span>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge tone="info" live>
            Analyse en cours
          </StatusBadge>
          <span className="font-data text-sm tabular-nums text-slate-300">{url}</span>
        </div>

        <ol className="mt-5 space-y-3">
          {SCAN_STEPS.map((step, index) => {
            const isDone = index < currentStep;
            const isActive = index === currentStep;
            return (
              <li key={step.id} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {isDone ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check size={12} strokeWidth={2.5} className="text-emerald-400" />
                    </span>
                  ) : isActive ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-700" />
                  )}
                </span>
                <span
                  className={`text-sm transition-colors duration-300 ${
                    isDone ? 'text-slate-300' : isActive ? 'text-slate-100' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Jauge circulaire animée + compteur du score. */
function ScoreGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const displayed = useCountUp(score, 1100);
  const stroke = score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : '#F59E0B';

  return (
    <div className="relative h-[140px] w-[140px]" data-testid="prospect-score">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="9" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-data text-3xl font-bold tabular-nums text-slate-100">{displayed}</span>
        <span className="font-data text-xs tabular-nums text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

/** Compteur animé, calé sur la même durée que la jauge. */
function useCountUp(target, duration) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    const startedAt = performance.now();
    const tick = (now) => {
      const ratio = Math.min((now - startedAt) / duration, 1);
      // easeOutCubic : la valeur ralentit en approchant de la cible.
      setValue(Math.round(target * (1 - Math.pow(1 - ratio, 3))));
      if (ratio < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}
