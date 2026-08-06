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
      iban: 'FR76 1741 8000 0100 9876 5432 101',
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
    anomalies: [
      {
        id: 'iban-change',
        severity: 'critical',
        title: 'Changement d’IBAN détecté',
        detail:
          'L’IBAN de cette facture diffère de celui utilisé pour les 14 derniers règlements à OVH SAS. C’est le mode opératoire le plus courant de la fraude au faux fournisseur.',
        evidence: [
          { label: 'IBAN habituel', value: 'FR76 3000 4008 2800 0112 3456 789' },
          { label: 'IBAN de cette facture', value: 'FR76 1741 8000 0100 9876 5432 101' },
        ],
        recommendation:
          'Confirmer par téléphone auprès d’un contact connu, en composant un numéro déjà enregistré — jamais celui indiqué sur la facture, ni par réponse à l’email reçu.',
        blocking: true,
      },
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
    anomalies: [
      {
        id: 'duplicate',
        severity: 'warning',
        title: 'Facture potentiellement en double',
        detail:
          'Une facture du même fournisseur, pour un montant identique, a déjà été enregistrée ce trimestre. Les deux documents couvrent des périodes qui se recouvrent partiellement.',
        evidence: [
          { label: 'Déjà enregistrée', value: 'FA-2026-0188 · 2 820,00 € TTC · 03/01/2026' },
          { label: 'Document en cours', value: 'FA-2026-0219 · 2 820,00 € TTC · 31/01/2026' },
        ],
        recommendation:
          'Comparer les périodes de prestation avant validation. Sur un portefeuille fournisseurs classique, les doublons représentent 0,8 à 1,3 % des montants réglés.',
        blocking: false,
      },
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
    anomalies: [
      {
        id: 'price-variance',
        severity: 'info',
        title: 'Écart de prix unitaire sur une ligne',
        detail:
          'Le ciment CEM II est facturé 8,45 € l’unité contre 8,19 € sur la commande précédente, soit +3,2 %. L’écart reste sous le seuil d’alerte fixé à 5 %.',
        evidence: [
          { label: 'Commande précédente', value: '8,19 € · 15/11/2025' },
          { label: 'Facture en cours', value: '8,45 € · 12/01/2026' },
        ],
        recommendation:
          'Signalé pour information : aucune action requise. L’écart est tracé pour alimenter la prochaine négociation annuelle.',
        blocking: false,
      },
    ],
  },
];

/**
 * Champs d'identité affichés dans l'onglet « Formulaire ».
 * Les montants n'y figurent pas : ils sont recalculés à partir des lignes et
 * du taux de TVA, jamais saisis en double (voir `computeTotals`).
 */
export const INVOICE_FORM_FIELDS = [
  { key: 'supplier', label: 'Nom du fournisseur' },
  { key: 'siren', label: 'Numéro SIREN', mono: true },
  { key: 'vatNumber', label: 'N° TVA intracommunautaire', mono: true },
  { key: 'invoiceNumber', label: 'Numéro de facture', mono: true },
  { key: 'invoiceDate', label: 'Date de facture', mono: true },
  { key: 'dueDate', label: 'Date d’échéance', mono: true },
  { key: 'paymentTerms', label: 'Conditions de règlement' },
  { key: 'purchaseOrder', label: 'Bon de commande', mono: true },
];

/* ──────────────── Recalcul en direct (correction humaine) ──────────────── */

/** « 1 248,50 » → 1248.5 (gère l'espace fine insécable des formats français). */
export function parseAmount(value) {
  if (typeof value === 'number') return value;
  const normalized = String(value ?? '').replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 1248.5 → « 1 248,50 ». */
export function formatAmount(value) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Recalcule les totaux à partir des lignes et du taux de TVA.
 * Utilisé à chaque correction manuelle : le HT découle des lignes, la TVA du
 * taux, le TTC de la somme des deux. Aucune valeur n'est saisie deux fois.
 */
export function computeTotals(lines, vatRate) {
  const amountHT = lines.reduce((sum, line) => sum + parseAmount(line.qty) * parseAmount(line.unitPrice), 0);
  const rate = parseAmount(vatRate);
  // Arrondi au centime à chaque étape, comme le fait un logiciel comptable.
  const roundedHT = Math.round(amountHT * 100) / 100;
  const vatAmount = Math.round(roundedHT * rate) / 100;
  return {
    amountHT: roundedHT,
    vatAmount,
    amountTTC: Math.round((roundedHT + vatAmount) * 100) / 100,
  };
}

/* ───────────────────────── Exports multi-ERP ───────────────────────────── */

/** Cibles proposées dans le sélecteur d'export. */
export const ERP_TARGETS = [
  { id: 'receipty', label: 'Format Standard Receipty' },
  { id: 'pennylane', label: 'Pennylane' },
  { id: 'quickbooks', label: 'QuickBooks' },
  { id: 'sage100', label: 'Sage 100' },
];

/**
 * Construit la charge utile pour la cible choisie.
 *
 * Les quatre structures diffèrent réellement — c'est tout l'intérêt de la
 * démonstration : le connecteur absorbe les spécificités de chaque outil et le
 * client n'a rien à remapper.
 *
 * TODO: Ces charges utiles sont posées côté client pour l'aperçu. En
 * production, elles sont fabriquées par le webhook n8n `receipty-erp-push` qui
 * appelle ensuite l'API du logiciel cible.
 */
export function buildErpPayload(target, sample, extracted, lines, totals) {
  const siren = String(extracted.siren).replace(/\s/g, '');
  const maskedIban = `${extracted.iban.slice(0, 9)} •••• •••• ${extracted.iban.slice(-4)}`;
  const rate = parseAmount(extracted.vatRate);
  const isoDate = (french) => {
    const [day, month, year] = String(french).split('/');
    return year && month && day ? `${year}-${month}-${day}` : french;
  };

  if (target === 'pennylane') {
    return {
      supplier_invoice: {
        external_id: `receipty-${extracted.invoiceNumber}`,
        invoice_number: extracted.invoiceNumber,
        date: isoDate(extracted.invoiceDate),
        deadline: isoDate(extracted.dueDate),
        currency: extracted.currency,
        currency_amount_before_tax: totals.amountHT,
        currency_tax: totals.vatAmount,
        currency_amount: totals.amountTTC,
        journal_code: 'ACH',
        supplier: { name: extracted.supplier, reg_no: siren, vat_number: extracted.vatNumber },
        line_items: lines.map((line) => ({
          label: line.designation,
          quantity: parseAmount(line.qty),
          unit_price: parseAmount(line.unitPrice),
          amount: Math.round(parseAmount(line.qty) * parseAmount(line.unitPrice) * 100) / 100,
          vat_rate: `${rate.toFixed(2)}`,
          ledger_account_number: extracted.analyticAccount.split(' — ')[0],
        })),
        payment: { method: extracted.paymentMethod, iban: maskedIban },
      },
    };
  }

  if (target === 'quickbooks') {
    return {
      Bill: {
        DocNumber: extracted.invoiceNumber,
        TxnDate: isoDate(extracted.invoiceDate),
        DueDate: isoDate(extracted.dueDate),
        CurrencyRef: { value: extracted.currency },
        VendorRef: { name: extracted.supplier, value: siren },
        PrivateNote: `Importé par Receipty — BC ${extracted.purchaseOrder}`,
        Line: lines.map((line, index) => ({
          Id: String(index + 1),
          DetailType: 'AccountBasedExpenseLineDetail',
          Description: line.designation,
          Amount: Math.round(parseAmount(line.qty) * parseAmount(line.unitPrice) * 100) / 100,
          AccountBasedExpenseLineDetail: {
            AccountRef: { name: extracted.category, value: extracted.analyticAccount.split(' — ')[0] },
            TaxCodeRef: { value: `TVA${rate.toFixed(0)}` },
            BillableStatus: 'NotBillable',
          },
        })),
        TxnTaxDetail: {
          TotalTax: totals.vatAmount,
          TaxLine: [
            {
              Amount: totals.vatAmount,
              DetailType: 'TaxLineDetail',
              TaxLineDetail: { TaxPercent: rate, NetAmountTaxable: totals.amountHT },
            },
          ],
        },
        TotalAmt: totals.amountTTC,
      },
    };
  }

  if (target === 'sage100') {
    const chargeAccount = extracted.analyticAccount.split(' — ')[0];
    return {
      ecriture: {
        journal: 'ACH',
        codeJournal: 'ACHATS',
        dateEcriture: extracted.invoiceDate,
        dateEcheance: extracted.dueDate,
        piece: extracted.invoiceNumber,
        libelle: `${extracted.supplier} — ${extracted.invoiceNumber}`,
        devise: extracted.currency,
        reference: extracted.purchaseOrder,
      },
      tiers: {
        compteTiers: `401${siren.slice(0, 3)}`,
        intitule: extracted.supplier,
        numeroSiren: siren,
        numeroTva: extracted.vatNumber,
        modeReglement: extracted.paymentMethod,
      },
      // Écriture équilibrée : charge + TVA déductible au débit, fournisseur au crédit.
      lignes: [
        {
          compteGeneral: chargeAccount,
          libelle: extracted.category,
          sens: 'D',
          montant: totals.amountHT,
        },
        {
          compteGeneral: '445660',
          libelle: `TVA déductible ${rate.toFixed(2)} %`,
          sens: 'D',
          montant: totals.vatAmount,
        },
        {
          compteGeneral: `401${siren.slice(0, 3)}`,
          libelle: extracted.supplier,
          sens: 'C',
          montant: totals.amountTTC,
        },
      ],
      controleEquilibre: {
        totalDebit: Math.round((totals.amountHT + totals.vatAmount) * 100) / 100,
        totalCredit: totals.amountTTC,
        equilibre: Math.abs(totals.amountHT + totals.vatAmount - totals.amountTTC) < 0.01,
      },
    };
  }

  // Format standard Receipty — pivot neutre, indépendant de tout éditeur.
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
      siren,
      vat_number: extracted.vatNumber,
      address: extracted.supplierAddress,
      iban_masked: maskedIban,
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
      amount_excl_vat: totals.amountHT,
      vat_rate: rate,
      vat_amount: totals.vatAmount,
      amount_incl_vat: totals.amountTTC,
    },
    lines: lines.map((line, index) => ({
      position: index + 1,
      designation: line.designation,
      quantity: parseAmount(line.qty),
      unit_price: parseAmount(line.unitPrice),
      total_excl_vat: Math.round(parseAmount(line.qty) * parseAmount(line.unitPrice) * 100) / 100,
    })),
    controls: sample.checks.map((check) => ({ rule: check.label, status: check.status, detail: check.detail })),
    anomalies: (sample.anomalies ?? []).map((anomaly) => ({
      code: anomaly.id,
      severity: anomaly.severity,
      label: anomaly.title,
      blocking: anomaly.blocking,
    })),
    confidence: sample.confidence,
  };
}
