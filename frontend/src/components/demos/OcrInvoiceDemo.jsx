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
  Layers,
  RotateCcw,
  ScanLine,
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
  INVOICE_FORM_FIELDS,
  INVOICE_SAMPLES,
  OCR_PIPELINE_STEPS,
  buildErpPayload,
} from './data/invoicesData';

/**
 * Démo 1 — Saisie & extraction OCR de factures.
 *
 * Split-screen : dépôt du document à gauche, extraction structurée à droite.
 * Le formulaire de droite est éditable : le prospect doit sentir qu'il garde la
 * main sur la donnée avant l'export vers son ERP.
 */
export function OcrInvoiceDemo() {
  const [sample, setSample] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [activeTab, setActiveTab] = useState('form');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { status, currentStep, progress, currentDuration, start, reset } = useProcessingSequence(OCR_PIPELINE_STEPS);

  const runExtraction = useCallback(
    (nextSample, meta) => {
      setSample(nextSample);
      setFileMeta(meta ?? { name: nextSample.fileName, size: nextSample.fileSize, pages: nextSample.pages });
      setExtracted(null);
      setActiveTab('form');
      // TODO: Remplacer par POST /api/ocr/extract (multipart) → webhook n8n
      // `receipty-ocr-invoice`, puis alimenter `setExtracted` avec la réponse.
      start(() => setExtracted({ ...nextSample.extracted }));
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
  };

  const updateField = (key, value) => setExtracted((current) => ({ ...current, [key]: value }));

  const erpPayload = useMemo(
    () => (sample && extracted ? buildErpPayload(sample, extracted) : null),
    [sample, extracted],
  );

  /** Export CSV réellement téléchargé — simulation du connecteur comptable. */
  const handleExport = (target) => {
    if (!sample || !extracted) return;

    const rows = [
      ['Fournisseur', 'SIREN', 'N° facture', 'Date', 'Échéance', 'Désignation', 'Quantité', 'PU HT', 'Total HT', 'Taux TVA', 'TVA', 'TTC'],
      ...sample.lines.map((line) => [
        extracted.supplier,
        extracted.siren,
        extracted.invoiceNumber,
        extracted.invoiceDate,
        extracted.dueDate,
        line.designation,
        line.qty,
        line.unitPrice,
        line.total,
        extracted.vatRate,
        '',
        '',
      ]),
      ['', '', '', '', '', 'TOTAL', '', '', extracted.amountHT, extracted.vatRate, extracted.vatAmount, extracted.amountTTC],
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
    // Sage / Pennylane) via le webhook n8n `receipty-erp-push`.
    toast.success(`Écriture transmise à ${target} (simulation)`, {
      description: `${extracted.invoiceNumber} — ${extracted.amountTTC} € TTC · export CSV téléchargé`,
    });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      {/* ── Bandeau d'amorçage ────────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className={`${S.panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="max-w-2xl">
          <h1 className={T.h1}>Saisie &amp; extraction OCR de factures</h1>
          <p className={`${T.body} mt-1.5`}>
            Déposez une facture fournisseur : les entités comptables sont extraites, contrôlées et prêtes à partir
            vers votre outil de comptabilité. Aucune ressaisie, aucun copier-coller.
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
                <p className="mt-3 text-sm font-medium text-slate-200">
                  Glissez votre facture ici
                </p>
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
            subtitle="Champs identifiés par le modèle, éditables avant export"
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
                      <StatusBadge tone="success" icon={Check}>
                        Contrôles TVA validés
                      </StatusBadge>
                    </div>

                    {activeTab === 'form' ? (
                      <div className="space-y-5">
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
                                {sample.confidence[field.key] !== undefined && (
                                  <span className="font-data text-[10px] tabular-nums text-emerald-400">
                                    {sample.confidence[field.key].toFixed(1)} %
                                  </span>
                                )}
                              </span>
                              <span className="relative mt-1.5 block">
                                <input
                                  type="text"
                                  value={extracted[field.key] ?? ''}
                                  onChange={(event) => updateField(field.key, event.target.value)}
                                  data-testid={`ocr-field-${field.key}`}
                                  className={`w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3 py-2.5 text-sm
                                    text-slate-100 outline-none transition-colors duration-200 focus:border-blue-500/60
                                    focus:ring-2 focus:ring-blue-500/20 ${field.mono ? 'font-data tabular-nums' : ''}
                                    ${field.suffix ? 'pr-14' : ''}`}
                                />
                                {field.suffix && (
                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                    {field.suffix}
                                  </span>
                                )}
                              </span>
                            </motion.label>
                          ))}
                        </motion.div>

                        {/* Lignes de facturation */}
                        <div>
                          <SectionLabel>Lignes de facturation</SectionLabel>
                          <div className={`${S.well} mt-2.5 overflow-x-auto`}>
                            <table className="w-full min-w-[520px] text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-800/80">
                                  <th className={`${T.label} px-4 py-2.5 font-semibold`}>Désignation</th>
                                  <th className={`${T.label} px-4 py-2.5 text-right font-semibold`}>Qté</th>
                                  <th className={`${T.label} px-4 py-2.5 text-right font-semibold`}>PU HT</th>
                                  <th className={`${T.label} px-4 py-2.5 text-right font-semibold`}>Total HT</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sample.lines.map((line) => (
                                  <tr key={line.designation} className="border-b border-slate-800/50 last:border-0">
                                    <td className="px-4 py-2.5 text-slate-300">{line.designation}</td>
                                    <td className="px-4 py-2.5 text-right font-data tabular-nums text-slate-300">
                                      {line.qty}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-data tabular-nums text-slate-300">
                                      {line.unitPrice}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-data font-semibold tabular-nums text-slate-100">
                                      {line.total}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
                      <div className={`${S.well} overflow-x-auto p-4`}>
                        <pre
                          className="font-data text-xs leading-relaxed text-slate-300"
                          data-testid="ocr-json-output"
                        >
                          {JSON.stringify(erpPayload, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2.5 border-t border-slate-800/80 pt-5">
                      <DemoButton icon={FileSpreadsheet} onClick={() => handleExport('QuickBooks')} data-testid="ocr-export-quickbooks">
                        Exporter vers QuickBooks
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
