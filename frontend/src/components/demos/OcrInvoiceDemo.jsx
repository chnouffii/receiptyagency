import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Braces,
  Check,
  FileSpreadsheet,
  FileText,
  Gauge,
  Info,
  Layers,
  Pencil,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Table2,
  Timer,
  Upload,
} from 'lucide-react';
import { S, T, TAP, staggerContainer, staggerItem } from './demoTokens';
import { DemoButton, EmptyState, MetricTile, Panel, SectionLabel, SegmentedTabs, StatusBadge } from './DemoUI';
import { ProcessingPipeline } from './ProcessingPipeline';
import { useProcessingSequence } from './useProcessingSequence';
import {
  ERP_TARGETS,
  INVOICE_FORM_FIELDS,
  INVOICE_SAMPLES,
  OCR_PIPELINE_STEPS,
  buildErpPayload,
  computeTotals,
  formatAmount,
  parseAmount,
} from './data/invoicesData';

/**
 * Démo 1 — Saisie & extraction OCR de factures.
 *
 * Split-screen : dépôt du document à gauche, extraction structurée à droite.
 *
 * Trois messages à faire passer :
 *   1. la détection d'anomalies (fraude à l'IBAN, doublon) tourne avant tout
 *      paiement, pas après ;
 *   2. l'humain garde la main — toute valeur est corrigeable et les totaux se
 *      recalculent en direct ;
 *   3. l'export s'adapte à l'outil comptable du client, pas l'inverse.
 */
export function OcrInvoiceDemo() {
  const [sample, setSample] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [lines, setLines] = useState([]);
  const [touched, setTouched] = useState({});
  const [activeTab, setActiveTab] = useState('form');
  const [erpTarget, setErpTarget] = useState('receipty');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { status, currentStep, progress, currentDuration, start, reset } = useProcessingSequence(OCR_PIPELINE_STEPS);

  const runExtraction = useCallback(
    (nextSample, meta) => {
      setSample(nextSample);
      setFileMeta(meta ?? { name: nextSample.fileName, size: nextSample.fileSize, pages: nextSample.pages });
      setExtracted(null);
      setLines([]);
      setTouched({});
      setActiveTab('form');
      // TODO: Remplacer par POST /api/ocr/extract (multipart) → webhook n8n
      // `receipty-ocr-invoice`, puis alimenter `setExtracted` avec la réponse.
      start(() => {
        setExtracted({ ...nextSample.extracted });
        setLines(nextSample.lines.map((line) => ({ ...line })));
      });
    },
    [start],
  );

  /**
   * Un vrai fichier déposé est routé vers le jeu de données le plus proche
   * (heuristique sur le nom), afin que la démo reste cohérente hors ligne.
   */
  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file) return;

      const name = file.name.toLowerCase();
      const matched =
        INVOICE_SAMPLES.find((item) => name.includes(item.id)) ||
        (/ovh|cloud|serveur|host/.test(name) ? INVOICE_SAMPLES[0] : null) ||
        (/compta|honoraire|cabinet|expert/.test(name) ? INVOICE_SAMPLES[1] : null) ||
        (/materiaux|btp|chantier|ciment/.test(name) ? INVOICE_SAMPLES[2] : null) ||
        INVOICE_SAMPLES[0];

      runExtraction(matched, {
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} Ko`,
        pages: matched.pages,
      });
    },
    [runExtraction],
  );

  const handleReset = () => {
    reset();
    setSample(null);
    setFileMeta(null);
    setExtracted(null);
    setLines([]);
    setTouched({});
  };

  // ── Correction humaine : chaque édition marque le champ et relance le calcul
  const updateField = (key, value) => {
    setExtracted((current) => ({ ...current, [key]: value }));
    setTouched((current) => ({ ...current, [key]: true }));
  };

  const updateLine = (index, key, value) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
    setTouched((current) => ({ ...current, [`line-${index}-${key}`]: true }));
  };

  /** Totaux dérivés : recalculés à chaque frappe, jamais saisis à la main. */
  const totals = useMemo(
    () => (extracted ? computeTotals(lines, extracted.vatRate) : { amountHT: 0, vatAmount: 0, amountTTC: 0 }),
    [lines, extracted],
  );

  /** Écart avec le montant lu sur le document : signale une correction réelle. */
  const originalTTC = sample ? parseAmount(sample.extracted.amountTTC) : 0;
  const hasDrift = sample && Math.abs(totals.amountTTC - originalTTC) >= 0.01;
  const correctionCount = Object.keys(touched).length;

  const erpPayload = useMemo(
    () => (sample && extracted ? buildErpPayload(erpTarget, sample, extracted, lines, totals) : null),
    [erpTarget, sample, extracted, lines, totals],
  );

  /** Export CSV réellement téléchargé — simulation du connecteur comptable. */
  const handleExport = (target) => {
    if (!sample || !extracted) return;

    const rows = [
      ['Fournisseur', 'SIREN', 'N° facture', 'Date', 'Échéance', 'Désignation', 'Quantité', 'PU HT', 'Total HT', 'Taux TVA', 'TVA', 'TTC'],
      ...lines.map((line) => [
        extracted.supplier,
        extracted.siren,
        extracted.invoiceNumber,
        extracted.invoiceDate,
        extracted.dueDate,
        line.designation,
        line.qty,
        line.unitPrice,
        formatAmount(parseAmount(line.qty) * parseAmount(line.unitPrice)),
        extracted.vatRate,
        '',
        '',
      ]),
      ['', '', '', '', '', 'TOTAL', '', '', formatAmount(totals.amountHT), extracted.vatRate, formatAmount(totals.vatAmount), formatAmount(totals.amountTTC)],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    // BOM UTF-8 : sans lui, Excel casse les accents à l'ouverture.
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipty_${extracted.invoiceNumber.replace(/[^\w-]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // TODO: Remplacer par l'appel réel au connecteur (QuickBooks Online API /
    // Pennylane / Sage) via le webhook n8n `receipty-erp-push`.
    toast.success(`Écriture transmise à ${target} (simulation)`, {
      description: `${extracted.invoiceNumber} — ${formatAmount(totals.amountTTC)} € TTC · export CSV téléchargé`,
    });
  };

  const blockingAnomaly = sample?.anomalies?.some((anomaly) => anomaly.blocking);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      {/* ── Bandeau d'amorçage ────────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className={`${S.panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="max-w-2xl">
          <h1 className={T.h1}>Saisie &amp; extraction OCR de factures</h1>
          <p className={`${T.body} mt-1.5`}>
            Déposez une facture fournisseur : les entités comptables sont extraites, contrôlées contre les fraudes
            courantes, corrigeables à la main, et prêtes à partir vers votre outil de comptabilité.
          </p>
        </div>
        <DemoButton
          variant="success"
          icon={Sparkles}
          onClick={() => runExtraction(INVOICE_SAMPLES[0])}
          data-testid="ocr-prefill"
        >
          Remplir avec un exemple réel
        </DemoButton>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Colonne gauche : dépôt du document ──────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel
            title="Document source"
            subtitle="PDF, JPG ou PNG — 10 Mo maximum"
            icon={Upload}
            action={
              sample && (
                <motion.button
                  whileTap={TAP}
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800/70 hover:text-slate-200"
                  data-testid="ocr-reset"
                >
                  <RotateCcw size={14} strokeWidth={1.75} />
                  Réinitialiser
                </motion.button>
              )
            }
          >
            <div className="space-y-5 p-5">
              {/* Zone de dépôt : la bordure change, jamais les dimensions. */}
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  handleFiles(event.dataTransfer.files);
                }}
                className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-9 text-center transition-colors duration-200 ${
                  isDragging ? 'border-blue-500/70 bg-blue-500/5' : 'border-slate-700 bg-[#080B12]'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-800/50">
                  <FileText size={20} className="text-slate-300" strokeWidth={1.5} />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-200">Glissez votre facture ici</p>
                <p className="mt-1 text-xs text-slate-400">ou sélectionnez un fichier depuis votre poste</p>
                <DemoButton
                  variant="ghost"
                  icon={Upload}
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="ocr-upload"
                >
                  Parcourir
                </DemoButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </div>

              {/* Exemples pré-chargés */}
              <div>
                <SectionLabel>Ou testez avec un document pré-chargé</SectionLabel>
                <div className="mt-2.5 space-y-2">
                  {INVOICE_SAMPLES.map((item) => {
                    const isSelected = sample?.id === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={TAP}
                        type="button"
                        onClick={() => runExtraction(item)}
                        data-testid={`ocr-sample-${item.id}`}
                        className={`${S.cardInteractive} flex w-full items-center gap-3 p-3.5 text-left ${
                          isSelected ? 'border-blue-500/50 bg-blue-500/5' : ''
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
                          <FileText size={16} className="text-slate-300" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-100">{item.label}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-400">
                            {item.category} · {item.fileName}
                          </span>
                        </span>
                        {isSelected ? (
                          <Check size={16} strokeWidth={2} className="shrink-0 text-blue-400" />
                        ) : (
                          <ScanLine size={16} strokeWidth={1.75} className="shrink-0 text-slate-400" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Fiche du document en cours de traitement */}
              <AnimatePresence mode="wait">
                {fileMeta && (
                  <motion.div
                    key={fileMeta.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`${S.card} p-4`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <SectionLabel>Document en traitement</SectionLabel>
                      {status === 'done' ? (
                        <StatusBadge tone="success" icon={Check}>Extrait</StatusBadge>
                      ) : (
                        <StatusBadge tone="info" live>En cours</StatusBadge>
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm font-medium text-slate-100">{fileMeta.name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="font-data tabular-nums">{fileMeta.size}</span>
                      <span className="font-data tabular-nums">{fileMeta.pages} page(s)</span>
                      <span>{sample?.category}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Détection d'anomalies ─────────────────────────────────── */}
              {status === 'done' && sample?.anomalies?.length > 0 && (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2.5">
                  <SectionLabel>Contrôle anti-fraude</SectionLabel>
                  {sample.anomalies.map((anomaly) => (
                    <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                  ))}
                </motion.div>
              )}

              {/* Carte métrique : la promesse chiffrée */}
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
                <MetricTile
                  label="Gain de temps calculé"
                  value="5 min 30"
                  unit="/ facture"
                  hint="Saisie, contrôle et classement inclus"
                  icon={Timer}
                  tone="success"
                />
                <MetricTile
                  label="Taux d’erreur"
                  value="0"
                  unit="%"
                  hint="Contrôle TVA bloquant avant export"
                  icon={Gauge}
                  tone="success"
                />
              </motion.div>
            </div>
          </Panel>
        </motion.div>

        {/* ── Colonne droite : extraction structurée ──────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel
            title="Extraction structurée"
            subtitle="Toute valeur est corrigeable — les totaux se recalculent"
            icon={Layers}
            className="h-full"
          >
            <div className="h-full p-5">
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EmptyState
                      icon={ScanLine}
                      title="En attente d’un document"
                      description="Déposez une facture ou choisissez l’un des trois exemples pour lancer l’extraction."
                    />
                  </motion.div>
                )}

                {status === 'running' && (
                  <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ProcessingPipeline
                      steps={OCR_PIPELINE_STEPS}
                      status={status}
                      currentStep={currentStep}
                      progress={progress}
                      currentDuration={currentDuration}
                    />
                  </motion.div>
                )}

                {status === 'done' && extracted && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <SegmentedTabs
                        testId="ocr-result-tabs"
                        active={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                          { id: 'form', label: 'Formulaire', icon: Table2 },
                          { id: 'json', label: 'JSON brut ERP', icon: Braces },
                        ]}
                      />
                      {blockingAnomaly ? (
                        <StatusBadge tone="warning" icon={ShieldAlert}>
                          Paiement à confirmer
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="success" icon={Check}>
                          Contrôles TVA validés
                        </StatusBadge>
                      )}
                    </div>

                    {activeTab === 'form' ? (
                      <div className="space-y-5">
                        {/* Bandeau de correction humaine */}
                        <AnimatePresence>
                          {correctionCount > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex items-start gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3.5 py-2.5"
                              data-testid="ocr-correction-banner"
                            >
                              <Pencil size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-blue-300" />
                              <p className="text-xs leading-relaxed text-blue-200">
                                <span className="font-data tabular-nums">{correctionCount}</span> correction
                                {correctionCount > 1 ? 's' : ''} manuelle{correctionCount > 1 ? 's' : ''}.
                                {hasDrift ? (
                                  <>
                                    {' '}
                                    Total recalculé :{' '}
                                    <span className="font-data font-semibold tabular-nums">
                                      {formatAmount(totals.amountTTC)} €
                                    </span>{' '}
                                    au lieu de{' '}
                                    <span className="font-data tabular-nums">{sample.extracted.amountTTC} €</span>{' '}
                                    sur le document.
                                  </>
                                ) : (
                                  ' Les totaux restent conformes au document.'
                                )}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Champs d'identité */}
                        <motion.div
                          variants={staggerContainer}
                          initial="hidden"
                          animate="show"
                          className="grid gap-3.5 sm:grid-cols-2"
                        >
                          {INVOICE_FORM_FIELDS.map((field) => (
                            <motion.label key={field.key} variants={staggerItem} className="block">
                              <span className="flex items-center justify-between gap-2">
                                <span className={T.label}>{field.label}</span>
                                {touched[field.key] ? (
                                  <span className="font-data text-[10px] tabular-nums text-blue-400">corrigé</span>
                                ) : (
                                  sample.confidence[field.key] !== undefined && (
                                    <span className="font-data text-[10px] tabular-nums text-emerald-400">
                                      {sample.confidence[field.key].toFixed(1)} %
                                    </span>
                                  )
                                )}
                              </span>
                              <span className="relative mt-1.5 block">
                                <input
                                  type="text"
                                  value={extracted[field.key] ?? ''}
                                  onChange={(event) => updateField(field.key, event.target.value)}
                                  data-testid={`ocr-field-${field.key}`}
                                  className={`w-full rounded-lg border bg-[#080B12] px-3 py-2.5 text-sm text-slate-100
                                    outline-none transition-colors duration-200 focus:border-blue-500/60
                                    focus:ring-2 focus:ring-blue-500/20 ${field.mono ? 'font-data tabular-nums' : ''}
                                    ${touched[field.key] ? 'border-blue-500/50' : 'border-slate-800/80'}`}
                                />
                              </span>
                            </motion.label>
                          ))}
                        </motion.div>

                        {/* Lignes de facturation éditables */}
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <SectionLabel>Lignes de facturation</SectionLabel>
                            <span className="text-[11px] text-slate-400">Quantités et prix modifiables</span>
                          </div>
                          <div className={`${S.well} mt-2.5 overflow-x-auto`}>
                            <table className="w-full min-w-[560px] text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-800/80">
                                  <th className={`${T.label} px-4 py-2.5 font-semibold`}>Désignation</th>
                                  <th className={`${T.label} px-3 py-2.5 text-right font-semibold`}>Qté</th>
                                  <th className={`${T.label} px-3 py-2.5 text-right font-semibold`}>PU HT</th>
                                  <th className={`${T.label} px-4 py-2.5 text-right font-semibold`}>Total HT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lines.map((line, index) => {
                                  const lineTotal = parseAmount(line.qty) * parseAmount(line.unitPrice);
                                  return (
                                    <tr key={line.designation} className="border-b border-slate-800/50 last:border-0">
                                      <td className="px-4 py-2 text-slate-300">{line.designation}</td>
                                      <td className="px-3 py-2 text-right">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={line.qty}
                                          onChange={(event) => updateLine(index, 'qty', event.target.value)}
                                          data-testid={`ocr-line-qty-${index}`}
                                          className={`w-16 rounded-md border bg-[#0B0F17] px-2 py-1 text-right font-data text-sm tabular-nums text-slate-100 outline-none transition-colors duration-200 focus:border-blue-500/60 ${
                                            touched[`line-${index}-qty`] ? 'border-blue-500/50' : 'border-slate-800/80'
                                          }`}
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={line.unitPrice}
                                          onChange={(event) => updateLine(index, 'unitPrice', event.target.value)}
                                          data-testid={`ocr-line-price-${index}`}
                                          className={`w-24 rounded-md border bg-[#0B0F17] px-2 py-1 text-right font-data text-sm tabular-nums text-slate-100 outline-none transition-colors duration-200 focus:border-blue-500/60 ${
                                            touched[`line-${index}-unitPrice`]
                                              ? 'border-blue-500/50'
                                              : 'border-slate-800/80'
                                          }`}
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-right font-data font-semibold tabular-nums text-slate-100">
                                        {formatAmount(lineTotal)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Totaux recalculés */}
                        <div>
                          <SectionLabel>Totaux — recalculés en direct</SectionLabel>
                          <div className={`${S.well} mt-2.5 divide-y divide-slate-800/60`}>
                            <TotalRow label="Montant HT" value={formatAmount(totals.amountHT)} suffix="EUR" />
                            <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                              <span className="text-sm text-slate-300">Taux de TVA</span>
                              <span className="flex items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={extracted.vatRate}
                                  onChange={(event) => updateField('vatRate', event.target.value)}
                                  data-testid="ocr-field-vatRate"
                                  className={`w-20 rounded-md border bg-[#0B0F17] px-2 py-1 text-right font-data text-sm tabular-nums text-slate-100 outline-none transition-colors duration-200 focus:border-blue-500/60 ${
                                    touched.vatRate ? 'border-blue-500/50' : 'border-slate-800/80'
                                  }`}
                                />
                                <span className="w-8 text-xs text-slate-400">%</span>
                              </span>
                            </div>
                            <TotalRow label="Montant TVA" value={formatAmount(totals.vatAmount)} suffix="EUR" />
                            <TotalRow
                              label="Montant TTC"
                              value={formatAmount(totals.amountTTC)}
                              suffix="EUR"
                              emphasis
                              testId="ocr-total-ttc"
                            />
                          </div>
                        </div>

                        {/* Contrôles automatiques */}
                        <div>
                          <SectionLabel>Contrôles automatiques</SectionLabel>
                          <ul className="mt-2.5 space-y-2">
                            {sample.checks.map((check) => (
                              <li key={check.label} className={`${S.card} flex items-start gap-3 p-3`}>
                                {check.status === 'ok' ? (
                                  <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-400" />
                                ) : (
                                  <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-400" />
                                )}
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-slate-100">{check.label}</span>
                                  <span className="mt-0.5 block text-xs text-slate-400">{check.detail}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <SectionLabel>Structure d’export</SectionLabel>
                          <SegmentedTabs
                            testId="ocr-erp-tabs"
                            active={erpTarget}
                            onChange={setErpTarget}
                            tabs={ERP_TARGETS.map((target) => ({ id: target.id, label: target.label }))}
                          />
                        </div>
                        <div className={`${S.well} overflow-x-auto p-4`}>
                          <pre
                            className="font-data text-xs leading-relaxed text-slate-300"
                            data-testid="ocr-json-output"
                          >
                            {JSON.stringify(erpPayload, null, 2)}
                          </pre>
                        </div>
                        <p className="text-xs text-slate-400">
                          La même facture, quatre structures. Le mapping vers votre outil est fait une fois à
                          l’intégration : vos équipes ne voient jamais ce JSON.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2.5 border-t border-slate-800/80 pt-5">
                      <DemoButton
                        icon={FileSpreadsheet}
                        onClick={() => handleExport(ERP_TARGETS.find((t) => t.id === erpTarget)?.label ?? 'QuickBooks')}
                        data-testid="ocr-export-erp"
                      >
                        Exporter vers {ERP_TARGETS.find((t) => t.id === erpTarget)?.label}
                      </DemoButton>
                      <DemoButton variant="ghost" icon={Table2} onClick={() => handleExport('Excel')} data-testid="ocr-export-excel">
                        Exporter vers Excel
                      </DemoButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────── Sous-composants ────────────────────────── */

/** Ligne de total : libellé à gauche, valeur alignée à droite. */
function TotalRow({ label, value, suffix, emphasis = false, testId }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className={`text-sm ${emphasis ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>{label}</span>
      <span className="flex items-center gap-2">
        <span
          data-testid={testId}
          className={`font-data tabular-nums ${emphasis ? 'text-base font-bold text-slate-100' : 'text-sm text-slate-100'}`}
        >
          {value}
        </span>
        <span className="w-8 text-right text-xs text-slate-400">{suffix}</span>
      </span>
    </div>
  );
}

/**
 * Carte d'anomalie. La sévérité pilote uniquement la couleur de la bordure et
 * de l'icône : la carte garde exactement les mêmes dimensions dans les trois
 * cas, aucun saut de mise en page à l'affichage.
 */
function AnomalyCard({ anomaly }) {
  const tones = {
    critical: {
      wrapper: 'border-red-500/40 bg-red-500/[0.07]',
      icon: 'text-red-400',
      label: 'border-red-500/40 text-red-300',
      badge: 'Critique',
      Icon: ShieldAlert,
    },
    warning: {
      wrapper: 'border-amber-500/40 bg-amber-500/[0.07]',
      icon: 'text-amber-400',
      label: 'border-amber-500/40 text-amber-300',
      badge: 'À vérifier',
      Icon: AlertTriangle,
    },
    info: {
      wrapper: 'border-slate-800/80 bg-slate-800/30',
      icon: 'text-slate-400',
      label: 'border-slate-700 text-slate-300',
      badge: 'Information',
      Icon: Info,
    },
  };
  const tone = tones[anomaly.severity] ?? tones.info;

  return (
    <motion.div
      variants={staggerItem}
      className={`rounded-xl border p-4 ${tone.wrapper}`}
      data-testid={`ocr-anomaly-${anomaly.id}`}
    >
      <div className="flex items-start gap-3">
        <tone.Icon size={16} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${tone.icon}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">{anomaly.title}</h3>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone.label}`}
            >
              {tone.badge}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{anomaly.detail}</p>

          {anomaly.evidence?.length > 0 && (
            <dl className="mt-2.5 space-y-1.5 rounded-lg border border-slate-800/80 bg-[#080B12] p-3">
              {anomaly.evidence.map((item) => (
                <div key={item.label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <dt className="text-[11px] text-slate-400">{item.label}</dt>
                  <dd className="font-data text-[11px] tabular-nums text-slate-200">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">Marche à suivre — </span>
            {anomaly.recommendation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
