/**
 * Jeux de données de la Démo 1 — Saisie & extraction OCR de factures.
 *
 * Chaque entrée simule le retour d'un pipeline OCR + structuration LLM :
 *   document brut → entités extraites → contrôle de cohérence TVA.
 *
 * TODO: Remplacer par l'appel API réelle (POST /api/ocr/extract → n8n webhook
 * `receipty-ocr-invoice`, qui orchestre Mistral OCR puis GPT-4o pour le
 * structuring, et renvoie exactement ce schéma).
 */

/** Étapes affichées pendant le traitement (durées en ms, cumulatives côté UI). */
export const OCR_PIPELINE_STEPS = [
  {
    id: 'ocr',
    label: 'Analyse du document OCR',
    detail: 'Lecture des blocs de texte, tables et zones tamponnées',
    duration: 1100,
  },
  {
    id: 'structuring',
    label: 'Structuration IA des entités',
    detail: 'Identification fournisseur, SIREN, dates, lignes de facturation',
    duration: 1300,
  },
  {
    id: 'validation',
    label: 'Validation des totaux TVA',
    detail: 'Contrôle HT + TVA = TTC et cohérence des taux par ligne',
    duration: 900,
  },
];

export const INVOICE_SAMPLES = [
  {
    id: 'ovh',
    category: 'Cloud & Tech',
    label: 'Facture OVH Cloud',
    fileName: 'OVH_FR-2026-0071842.pdf',
    fileSize: '184 Ko',
    pages: 2,
    accent: 'info',
    extracted: {
      supplier: 'OVH SAS',
      supplierAddress: '2 rue Kellermann, 59100 Roubaix',
      siren: '424 761 419',
      vatNumber: 'FR22424761419',
      invoiceNumber: 'FR-2026-0071842',
      invoiceDate: '05/01/2026',
      dueDate: '04/02/2026',
      paymentTerms: '30 jours nets',
      paymentMethod: 'Prélèvement SEPA',
      iban: 'FR76 3000 4008 2800 0112 3456 789',
      purchaseOrder: 'BC-2026-014',
      currency: 'EUR',
      amountHT: '1 248,50',
      vatRate: '20,00',
      vatAmount: '249,70',
      amountTTC: '1 498,20',
      category: 'Infrastructure & hébergement',
      analyticAccount: '613200 — Locations informatiques',
    },
    lines: [
      { designation: 'Serveur dédié Advance-2 (janvier 2026)', qty: 2, unitPrice: '89,99', total: '179,98' },
      { designation: 'Hébergement Web Performance 3', qty: 1, unitPrice: '22,99', total: '22,99' },
      { designation: 'Renouvellement noms de domaine .fr', qty: 3, unitPrice: '7,99', total: '23,97' },
      { designation: 'Public Cloud — instances B2-15 (à l’usage)', qty: 1, unitPrice: '921,56', total: '921,56' },
      { designation: 'Licence Plesk Web Pro', qty: 2, unitPrice: '50,00', total: '100,00' },
    ],
    /** Score de confiance renvoyé par le modèle, par champ clé. */
    confidence: { supplier: 99.8, siren: 99.4, invoiceDate: 99.9, amountTTC: 100, dueDate: 98.7 },
    checks: [
      { label: 'HT + TVA = TTC', status: 'ok', detail: '1 248,50 + 249,70 = 1 498,20' },
      { label: 'SIREN vérifié (base Sirene)', status: 'ok', detail: 'OVH SAS — actif' },
      { label: 'Doublon dans l’ERP', status: 'ok', detail: 'Aucune facture identique sur 24 mois' },
    ],
  },
  {
    id: 'comptable',
    category: 'Prestation intellectuelle',
    label: 'Facture Cabinet Comptable',
    fileName: 'Delaunay_FA-2026-0219.pdf',
    fileSize: '96 Ko',
    pages: 1,
    accent: 'success',
    extracted: {
      supplier: 'Cabinet Delaunay & Associés',
      supplierAddress: '14 avenue de la Marseillaise, 67000 Strasbourg',
      siren: '812 447 903',
      vatNumber: 'FR61812447903',
      invoiceNumber: 'FA-2026-0219',
      invoiceDate: '31/01/2026',
      dueDate: '15/02/2026',
      paymentTerms: '15 jours date de facture',
      paymentMethod: 'Virement bancaire',
      iban: 'FR76 1027 8010 2000 0208 7654 321',
      purchaseOrder: 'Contrat annuel 2026',
      currency: 'EUR',
      amountHT: '2 350,00',
      vatRate: '20,00',
      vatAmount: '470,00',
      amountTTC: '2 820,00',
      category: 'Honoraires & conseil',
      analyticAccount: '622600 — Honoraires',
    },
    lines: [
      { designation: 'Tenue comptable — 4e trimestre 2025', qty: 3, unitPrice: '450,00', total: '1 350,00' },
      { designation: 'Établissement des comptes annuels 2025', qty: 1, unitPrice: '650,00', total: '650,00' },
      { designation: 'Déclarations de TVA (CA3) mensuelles', qty: 3, unitPrice: '90,00', total: '270,00' },
      { designation: 'Conseil fiscal — optimisation IS', qty: 1, unitPrice: '80,00', total: '80,00' },
    ],
    confidence: { supplier: 99.1, siren: 98.9, invoiceDate: 100, amountTTC: 99.9, dueDate: 97.2 },
    checks: [
      { label: 'HT + TVA = TTC', status: 'ok', detail: '2 350,00 + 470,00 = 2 820,00' },
      { label: 'SIREN vérifié (base Sirene)', status: 'ok', detail: 'Cabinet Delaunay & Associés — actif' },
      { label: 'Échéance rapprochée', status: 'warn', detail: 'Paiement à 15 jours — à prioriser dans le run hebdo' },
    ],
  },
  {
    id: 'btp',
    category: 'BTP & Matériaux',
    label: 'Facture Fournisseur Matériel',
    fileName: 'MateriauxDuRhin_BTP-26-004417.pdf',
    fileSize: '312 Ko',
    pages: 3,
    accent: 'warning',
    extracted: {
      supplier: 'Matériaux du Rhin SAS',
      supplierAddress: 'ZI Rue du Port 12, 67150 Erstein',
      siren: '793 508 461',
      vatNumber: 'FR40793508461',
      invoiceNumber: 'BTP-26-004417',
      invoiceDate: '12/01/2026',
      dueDate: '12/03/2026',
      paymentTerms: '60 jours date de facture',
      paymentMethod: 'Virement bancaire',
      iban: 'FR76 1470 6041 0060 0512 3456 782',
      purchaseOrder: 'CH-2026-STG-07 (chantier Meinau)',
      currency: 'EUR',
      amountHT: '4 872,60',
      vatRate: '20,00',
      vatAmount: '974,52',
      amountTTC: '5 847,12',
      category: 'Achats de matériaux',
      analyticAccount: '601000 — Achats stockés',
    },
    lines: [
      { designation: 'Ciment CEM II/B 32,5 R — sac 35 kg', qty: 120, unitPrice: '8,45', total: '1 014,00' },
      { designation: 'Parpaing creux 20 × 20 × 50', qty: 480, unitPrice: '1,32', total: '633,60' },
      { designation: 'Treillis soudé ST25C 4,80 × 2,40 m', qty: 36, unitPrice: '27,90', total: '1 004,40' },
      { designation: 'Location mini-pelle 1,8 T (3 jours)', qty: 3, unitPrice: '145,00', total: '435,00' },
      { designation: 'Sable stabilisé 0/4 — big bag 1 T', qty: 14, unitPrice: '62,90', total: '880,60' },
      { designation: 'Livraison chantier — camion grue', qty: 1, unitPrice: '905,00', total: '905,00' },
    ],
    confidence: { supplier: 97.6, siren: 96.8, invoiceDate: 99.5, amountTTC: 99.8, dueDate: 99.1 },
    checks: [
      { label: 'HT + TVA = TTC', status: 'ok', detail: '4 872,60 + 974,52 = 5 847,12' },
      { label: 'Rapprochement bon de commande', status: 'ok', detail: 'CH-2026-STG-07 — 6/6 lignes rapprochées' },
      { label: 'Écart de prix unitaire', status: 'warn', detail: 'Ciment : +3,2 % vs dernière commande' },
    ],
  },
];

/** Champs affichés dans l'onglet « Formulaire », dans l'ordre de saisie métier. */
export const INVOICE_FORM_FIELDS = [
  { key: 'supplier', label: 'Nom du fournisseur' },
  { key: 'siren', label: 'Numéro SIREN', mono: true },
  { key: 'vatNumber', label: 'N° TVA intracommunautaire', mono: true },
  { key: 'invoiceNumber', label: 'Numéro de facture', mono: true },
  { key: 'invoiceDate', label: 'Date de facture', mono: true },
  { key: 'dueDate', label: 'Date d’échéance', mono: true },
  { key: 'paymentTerms', label: 'Conditions de règlement' },
  { key: 'purchaseOrder', label: 'Bon de commande', mono: true },
  { key: 'amountHT', label: 'Montant HT', mono: true, suffix: 'EUR' },
  { key: 'vatRate', label: 'Taux de TVA', mono: true, suffix: '%' },
  { key: 'vatAmount', label: 'Montant TVA', mono: true, suffix: 'EUR' },
  { key: 'amountTTC', label: 'Montant TTC', mono: true, suffix: 'EUR' },
];

/** Construit la charge utile envoyée à l'ERP (onglet « JSON brut ERP »). */
export function buildErpPayload(sample, extracted) {
  const toNumber = (value) => Number(String(value).replace(/\s/g, '').replace(',', '.')) || 0;

  return {
    schema: 'receipty.invoice.v2',
    source: {
      file_name: sample.fileName,
      pages: sample.pages,
      ingested_at: '2026-02-03T09:14:22+01:00',
      channel: 'upload_manuel',
    },
    supplier: {
      name: extracted.supplier,
      siren: extracted.siren.replace(/\s/g, ''),
      vat_number: extracted.vatNumber,
      address: extracted.supplierAddress,
      iban_masked: `${extracted.iban.slice(0, 9)} •••• •••• ${extracted.iban.slice(-4)}`,
    },
    document: {
      number: extracted.invoiceNumber,
      issue_date: extracted.invoiceDate,
      due_date: extracted.dueDate,
      payment_terms: extracted.paymentTerms,
      payment_method: extracted.paymentMethod,
      purchase_order: extracted.purchaseOrder,
      currency: extracted.currency,
    },
    accounting: {
      category: extracted.category,
      analytic_account: extracted.analyticAccount,
      amount_excl_vat: toNumber(extracted.amountHT),
      vat_rate: toNumber(extracted.vatRate),
      vat_amount: toNumber(extracted.vatAmount),
      amount_incl_vat: toNumber(extracted.amountTTC),
    },
    lines: sample.lines.map((line, index) => ({
      position: index + 1,
      designation: line.designation,
      quantity: line.qty,
      unit_price: toNumber(line.unitPrice),
      total_excl_vat: toNumber(line.total),
    })),
    controls: sample.checks.map((check) => ({ rule: check.label, status: check.status, detail: check.detail })),
    confidence: sample.confidence,
  };
}
