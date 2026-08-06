import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2,
  CircleDollarSign,
  Download,
  FileSignature,
  ListChecks,
  NotebookPen,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { S, T, TAP, staggerContainer, staggerItem } from './demoTokens';
import { DemoButton, EmptyState, Panel, SectionLabel, StatusBadge } from './DemoUI';
import { ProcessingPipeline } from './ProcessingPipeline';
import { useProcessingSequence } from './useProcessingSequence';
import { PROPOSAL_PREFILL, PROPOSAL_SECTORS, buildProposal } from './data/proposalData';

/** Étapes affichées pendant la rédaction de la proposition. */
const GENERATION_STEPS = [
  {
    id: 'parse',
    label: 'Lecture des notes de rendez-vous',
    detail: 'Extraction des irritants, de la volumétrie et du budget évoqué',
    duration: 900,
  },
  {
    id: 'plan',
    label: 'Construction du plan d’action',
    detail: 'Sélection des leviers d’automatisation et chiffrage par phase',
    duration: 1100,
  },
  {
    id: 'write',
    label: 'Rédaction et mise en page',
    detail: 'Synthèse des enjeux, indicateurs de succès et conditions',
    duration: 800,
  },
];

const EMPTY_FORM = {
  companyName: '',
  sector: 'services',
  budget: '',
  contactName: '',
  contactRole: '',
  notes: '',
};

/**
 * Démo 3 — Générateur automatique de propositions commerciales.
 *
 * Ce que le prospect doit retenir : des notes de RDV brutes suffisent à sortir
 * une proposition structurée, chiffrée et prête à envoyer en moins d'une minute.
 */
export function ProposalGeneratorDemo() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [proposal, setProposal] = useState(null);
  const { status, currentStep, progress, currentDuration, start, reset } = useProcessingSequence(GENERATION_STEPS);

  const canGenerate = form.companyName.trim().length > 1 && form.notes.trim().length > 20;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleGenerate = () => {
    if (!canGenerate || status === 'running') return;
    setProposal(null);
    // TODO: Remplacer par POST /api/proposals/generate → webhook n8n
    // `receipty-proposal-writer` (GPT-4o + template PDF de l'agence).
    start(() => setProposal(buildProposal(form)));
  };

  const handleReset = () => {
    reset();
    setForm(EMPTY_FORM);
    setProposal(null);
  };

  /** Génère un document imprimable et ouvre la boîte d'impression du navigateur. */
  const handleDownloadPdf = () => {
    if (!proposal) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      toast.error('Impossible d’ouvrir la fenêtre d’impression', {
        description: 'Autorisez les fenêtres pop-up pour ce site, puis relancez le téléchargement.',
      });
      return;
    }

    printWindow.document.write(buildPrintableDocument(proposal));
    printWindow.document.close();
    // `document.write` peut avoir déjà déclenché `load` : on temporise plutôt
    // que de s'appuyer sur l'événement.
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 450);

    toast.success('Proposition prête', {
      description: 'Choisissez « Enregistrer au format PDF » dans la boîte d’impression.',
    });
  };

  const sectorLabel = useMemo(
    () => PROPOSAL_SECTORS.find((item) => item.id === form.sector)?.label ?? '',
    [form.sector],
  );

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={staggerItem} className={`${S.panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="max-w-2xl">
          <h1 className={T.h1}>Générateur de propositions commerciales</h1>
          <p className={`${T.body} mt-1.5`}>
            Saisissez vos notes de rendez-vous telles quelles. L’assistant en extrait les enjeux, construit un plan
            d’action en trois phases et produit une proposition chiffrée, prête à être envoyée.
          </p>
        </div>
        <DemoButton
          variant="success"
          icon={Sparkles}
          onClick={() => {
            setProposal(null);
            reset();
            setForm(PROPOSAL_PREFILL);
          }}
          data-testid="proposal-prefill"
        >
          Remplir avec un exemple réel
        </DemoButton>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* ── Formulaire de saisie rapide ─────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel
            title="Brief commercial"
            subtitle="4 champs suffisent"
            icon={NotebookPen}
            action={
              (proposal || form.companyName) && (
                <motion.button
                  whileTap={TAP}
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800/70 hover:text-slate-200"
                  data-testid="proposal-reset"
                >
                  <RotateCcw size={14} strokeWidth={1.75} />
                  Vider
                </motion.button>
              )
            }
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleGenerate();
              }}
              className="space-y-4 p-5"
            >
              <label className="block">
                <span className={T.label}>Nom de la PME cliente</span>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(event) => update('companyName', event.target.value)}
                  placeholder="Alsace Négoce Distribution"
                  data-testid="proposal-company"
                  className="mt-1.5 w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block">
                  <span className={T.label}>Secteur d’activité</span>
                  <select
                    value={form.sector}
                    onChange={(event) => update('sector', event.target.value)}
                    data-testid="proposal-sector"
                    className="mt-1.5 w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {PROPOSAL_SECTORS.map((sector) => (
                      <option key={sector.id} value={sector.id} className="bg-[#111827]">
                        {sector.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={T.label}>Budget estimé</span>
                  <div className="relative mt-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.budget}
                      onChange={(event) => update('budget', event.target.value)}
                      placeholder="3000"
                      data-testid="proposal-budget"
                      className="w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 pr-12 font-data text-sm tabular-nums text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      EUR
                    </span>
                  </div>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block">
                  <span className={T.label}>Interlocuteur (optionnel)</span>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(event) => update('contactName', event.target.value)}
                    placeholder="Sophie Kieffer"
                    className="mt-1.5 w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="block">
                  <span className={T.label}>Fonction (optionnel)</span>
                  <input
                    type="text"
                    value={form.contactRole}
                    onChange={(event) => update('contactRole', event.target.value)}
                    placeholder="Directrice administrative et financière"
                    className="mt-1.5 w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
              </div>

              <label className="block">
                <span className="flex items-center justify-between gap-2">
                  <span className={T.label}>Notes brutes de rendez-vous</span>
                  <span className="font-data text-[10px] tabular-nums text-slate-400">
                    {form.notes.length} car.
                  </span>
                </span>
                <textarea
                  rows={8}
                  value={form.notes}
                  onChange={(event) => update('notes', event.target.value)}
                  placeholder="Client veut automatiser ses relances de paiement, environ 40 factures/mois, problème de trésorerie, budget 3k…"
                  data-testid="proposal-notes"
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="mt-1.5 block text-xs text-slate-400">
                  Écrivez comme vous le feriez sur un carnet : l’assistant se charge de la mise en forme.
                </span>
              </label>

              <DemoButton
                type="submit"
                icon={Wand2}
                loading={status === 'running'}
                disabled={!canGenerate || status === 'running'}
                className="w-full"
                data-testid="proposal-generate"
              >
                {status === 'running' ? 'Rédaction en cours' : 'Générer la proposition commerciale par IA'}
              </DemoButton>

              {!canGenerate && (
                <p className="text-xs text-slate-400">
                  Renseignez au minimum le nom du client et quelques lignes de notes pour lancer la génération.
                </p>
              )}
            </form>
          </Panel>
        </motion.div>

        {/* ── Proposition générée ─────────────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel
            title="Proposition commerciale"
            subtitle={proposal ? `Référence ${proposal.reference} · ${sectorLabel}` : 'En attente de génération'}
            icon={FileSignature}
            className="h-full"
            action={
              proposal && (
                <DemoButton icon={Download} onClick={handleDownloadPdf} data-testid="proposal-download">
                  <span className="hidden sm:inline">Télécharger en PDF</span>
                  <span className="sm:hidden">PDF</span>
                </DemoButton>
              )
            }
          >
            <div className="h-full p-5">
              <AnimatePresence mode="wait">
                {status === 'idle' && !proposal && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EmptyState
                      icon={FileSignature}
                      title="Aucune proposition générée"
                      description="Remplissez le brief à gauche — ou chargez l’exemple réel — puis lancez la génération."
                    />
                  </motion.div>
                )}

                {status === 'running' && (
                  <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ProcessingPipeline
                      steps={GENERATION_STEPS}
                      status={status}
                      currentStep={currentStep}
                      progress={progress}
                      currentDuration={currentDuration}
                    />
                  </motion.div>
                )}

                {proposal && status === 'done' && (
                  <motion.article
                    key="proposal"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                  >
                    {/* En-tête du document */}
                    <motion.header variants={staggerItem} className="border-b border-slate-800/80 pb-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">
                            Proposition d’accompagnement
                          </p>
                          <h2 className="font-heading mt-1 text-xl font-bold tracking-tight text-slate-100">
                            {proposal.companyName}
                          </h2>
                          {proposal.contactName && (
                            <p className="mt-1 text-sm text-slate-400">
                              À l’attention de {proposal.contactName}
                              {proposal.contactRole ? ` — ${proposal.contactRole}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-data text-xs tabular-nums text-slate-300">{proposal.reference}</p>
                          <p className="mt-1 font-data text-[11px] tabular-nums text-slate-400">
                            Émise le {proposal.issuedAt}
                          </p>
                          <p className="font-data text-[11px] tabular-nums text-slate-400">
                            Valable jusqu’au {proposal.validUntil}
                          </p>
                        </div>
                      </div>
                    </motion.header>

                    {/* Synthèse des enjeux */}
                    <motion.section variants={staggerItem}>
                      <SectionLabel>Synthèse des enjeux</SectionLabel>
                      <div className="mt-2.5 space-y-3">
                        {proposal.synthesis.map((paragraph, index) => (
                          <p key={index} className="text-sm leading-relaxed text-slate-300">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </motion.section>

                    {/* Irritants identifiés */}
                    <motion.section variants={staggerItem}>
                      <SectionLabel>Irritants identifiés &amp; leviers proposés</SectionLabel>
                      <ul className="mt-2.5 space-y-2.5">
                        {proposal.issues.map((item) => (
                          <li key={item.issue} className={`${S.card} p-4`}>
                            <p className="flex items-start gap-2.5 text-sm font-medium text-slate-100">
                              <Target size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-400" />
                              {item.issue}
                            </p>
                            <p className="mt-1.5 pl-[26px] text-xs leading-relaxed text-slate-400">{item.impact}</p>
                            <p className="mt-2 flex items-start gap-2.5 pl-[26px] text-xs leading-relaxed text-emerald-300">
                              <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                              {item.lever}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </motion.section>

                    {/* Plan d'action en 3 phases */}
                    <motion.section variants={staggerItem}>
                      <SectionLabel>Plan d’action en 3 phases</SectionLabel>
                      <div className="mt-2.5 space-y-3">
                        {proposal.phases.map((phase) => (
                          <div key={phase.number} className={`${S.card} p-4`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 font-data text-xs font-bold tabular-nums text-blue-300">
                                  {phase.number}
                                </span>
                                <div>
                                  <h3 className="font-heading text-sm font-semibold text-slate-100">{phase.name}</h3>
                                  <p className="mt-0.5 font-data text-[11px] tabular-nums text-slate-400">
                                    {phase.duration}
                                  </p>
                                </div>
                              </div>
                              <span className="font-data text-sm font-bold tabular-nums text-slate-100">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR',
                                  maximumFractionDigits: 0,
                                }).format(phase.price)}
                              </span>
                            </div>
                            <p className="mt-2.5 pl-10 text-xs leading-relaxed text-slate-400">{phase.objective}</p>
                            <ul className="mt-2.5 space-y-1.5 pl-10">
                              {phase.deliverables.map((deliverable) => (
                                <li key={deliverable} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                                  <ListChecks size={13} strokeWidth={1.75} className="mt-0.5 shrink-0 text-slate-400" />
                                  {deliverable}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </motion.section>

                    {/* Indicateurs de succès */}
                    <motion.section variants={staggerItem}>
                      <SectionLabel>Indicateurs de succès attendus</SectionLabel>
                      <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {proposal.kpis.map((kpi) => (
                          <div key={kpi.label} className={`${S.card} p-4`}>
                            <p className="font-data text-lg font-bold tabular-nums text-emerald-400">
                              {kpi.value}
                              {kpi.unit && <span className="ml-1 text-xs font-medium text-slate-400">{kpi.unit}</span>}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{kpi.label}</p>
                          </div>
                        ))}
                      </div>
                    </motion.section>

                    {/* Chiffrage */}
                    <motion.section variants={staggerItem}>
                      <SectionLabel>Chiffrage</SectionLabel>
                      <div className={`${S.well} mt-2.5 p-4`}>
                        <ul className="space-y-2">
                          {proposal.pricing.breakdown.map((item) => (
                            <li key={item.name} className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-slate-300">{item.name}</span>
                              <span className="font-data shrink-0 tabular-nums text-slate-100">{item.label}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-800/80 pt-3">
                          <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                            <CircleDollarSign size={16} strokeWidth={1.75} className="text-blue-400" />
                            Total mise en place
                          </span>
                          <span className="font-data text-lg font-bold tabular-nums text-slate-100">
                            {proposal.pricing.setupLabel}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-4">
                          <span className="flex items-center gap-2 text-sm text-slate-300">
                            <TrendingUp size={16} strokeWidth={1.75} className="text-emerald-400" />
                            Abonnement mensuel (supervision &amp; support)
                          </span>
                          <span className="font-data text-sm font-semibold tabular-nums text-emerald-400">
                            {proposal.pricing.monthlyLabel} / mois
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">Montants exprimés hors taxes.</p>
                      </div>
                    </motion.section>

                    {/* Outils identifiés */}
                    {proposal.tools.length > 0 && (
                      <motion.section variants={staggerItem}>
                        <SectionLabel>Intégrations à prévoir</SectionLabel>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {proposal.tools.map((tool) => (
                            <StatusBadge key={tool} tone="info" icon={Building2}>
                              {tool}
                            </StatusBadge>
                          ))}
                        </div>
                      </motion.section>
                    )}

                    {/* Conditions */}
                    <motion.section variants={staggerItem} className="border-t border-slate-800/80 pt-5">
                      <SectionLabel>Conditions</SectionLabel>
                      <ul className="mt-2.5 space-y-1.5">
                        {proposal.conditions.map((condition) => (
                          <li key={condition} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                            <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </motion.section>

                    <motion.div variants={staggerItem} className="flex flex-wrap gap-2.5 border-t border-slate-800/80 pt-5">
                      <DemoButton icon={Download} onClick={handleDownloadPdf}>
                        Télécharger la proposition au format PDF
                      </DemoButton>
                    </motion.div>
                  </motion.article>
                )}
              </AnimatePresence>
            </div>
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── Document imprimable (PDF) ─────────────────────── */

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Construit un document autonome, pensé pour l'impression papier (fond clair,
 * typographie sobre) — l'utilisateur choisit « Enregistrer au format PDF ».
 *
 * TODO: Remplacer par la génération serveur du PDF au template de l'agence
 * (GET /api/proposals/:id/pdf) une fois le backend branché.
 */
function buildPrintableDocument(proposal) {
  const euro = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Proposition ${escapeHtml(proposal.reference)} — ${escapeHtml(proposal.companyName)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
         color: #0f172a; line-height: 1.55; font-size: 11pt; margin: 0; }
  h1 { font-size: 20pt; margin: 0 0 4px; letter-spacing: -0.02em; }
  h2 { font-size: 12pt; margin: 26px 0 8px; text-transform: uppercase; letter-spacing: 0.08em;
       color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
  h3 { font-size: 11pt; margin: 0; }
  p { margin: 0 0 9px; }
  .brand { font-size: 10pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #2563eb; }
  .head { display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 2px solid #0f172a; padding-bottom: 14px; }
  .meta { text-align: right; font-size: 9pt; color: #475569; font-variant-numeric: tabular-nums; }
  .muted { color: #475569; font-size: 9.5pt; }
  .issue { border-left: 3px solid #f59e0b; padding: 8px 0 8px 12px; margin-bottom: 10px; }
  .lever { color: #047857; font-size: 9.5pt; margin: 4px 0 0; }
  .phase { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;
           page-break-inside: avoid; }
  .phase-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .price { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  ul { margin: 6px 0 0; padding-left: 18px; }
  li { margin-bottom: 3px; font-size: 9.5pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
  td.right { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tr.total td { border-bottom: none; border-top: 2px solid #0f172a; font-weight: 700; padding-top: 9px; }
  .kpis { display: flex; gap: 10px; margin-top: 8px; }
  .kpi { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
  .kpi b { display: block; font-size: 13pt; color: #047857; font-variant-numeric: tabular-nums; }
  .kpi span { font-size: 8.5pt; color: #475569; }
  footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;
           font-size: 8.5pt; color: #64748b; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <p class="brand">Receipty</p>
      <h1>${escapeHtml(proposal.companyName)}</h1>
      <p class="muted">Proposition d'accompagnement — ${escapeHtml(proposal.sectorLabel)}${
        proposal.contactName
          ? `<br />À l'attention de ${escapeHtml(proposal.contactName)}${
              proposal.contactRole ? ` — ${escapeHtml(proposal.contactRole)}` : ''
            }`
          : ''
      }</p>
    </div>
    <div class="meta">
      <div>${escapeHtml(proposal.reference)}</div>
      <div>Émise le ${escapeHtml(proposal.issuedAt)}</div>
      <div>Valable jusqu'au ${escapeHtml(proposal.validUntil)}</div>
    </div>
  </div>

  <h2>Synthèse des enjeux</h2>
  ${proposal.synthesis.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}

  <h2>Irritants identifiés &amp; leviers proposés</h2>
  ${proposal.issues
    .map(
      (item) => `<div class="issue">
        <h3>${escapeHtml(item.issue)}</h3>
        <p class="muted">${escapeHtml(item.impact)}</p>
        <p class="lever">Levier : ${escapeHtml(item.lever)}</p>
      </div>`,
    )
    .join('')}

  <h2>Plan d'action en 3 phases</h2>
  ${proposal.phases
    .map(
      (phase) => `<div class="phase">
        <div class="phase-head">
          <h3>Phase ${phase.number} — ${escapeHtml(phase.name)}</h3>
          <span class="price">${escapeHtml(euro(phase.price))}</span>
        </div>
        <p class="muted">${escapeHtml(phase.duration)} · ${escapeHtml(phase.objective)}</p>
        <ul>${phase.deliverables.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>`,
    )
    .join('')}

  <h2>Indicateurs de succès attendus</h2>
  <div class="kpis">
    ${proposal.kpis
      .map(
        (kpi) => `<div class="kpi">
          <b>${escapeHtml(kpi.value)}${kpi.unit ? ` ${escapeHtml(kpi.unit)}` : ''}</b>
          <span>${escapeHtml(kpi.label)}</span>
        </div>`,
      )
      .join('')}
  </div>

  <h2>Chiffrage</h2>
  <table>
    ${proposal.pricing.breakdown
      .map(
        (item) => `<tr><td>${escapeHtml(item.name)}</td><td class="right">${escapeHtml(item.label)}</td></tr>`,
      )
      .join('')}
    <tr class="total"><td>Total mise en place (HT)</td><td class="right">${escapeHtml(
      proposal.pricing.setupLabel,
    )}</td></tr>
    <tr><td>Abonnement mensuel — supervision &amp; support (HT)</td><td class="right">${escapeHtml(
      proposal.pricing.monthlyLabel,
    )} / mois</td></tr>
  </table>

  <h2>Conditions</h2>
  <ul>${proposal.conditions.map((condition) => `<li>${escapeHtml(condition)}</li>`).join('')}</ul>

  <footer>
    Receipty — Agence d'intégration IA · contact@receipty.fr · receipty.fr<br />
    Document généré automatiquement à partir des notes de rendez-vous. Sous réserve de validation lors du cadrage.
  </footer>
</body>
</html>`;
}
