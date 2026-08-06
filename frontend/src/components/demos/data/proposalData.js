/**
 * Démo 3 — Générateur automatique de propositions commerciales.
 *
 * `buildProposal()` compose une proposition structurée à partir des quelques
 * informations saisies par le commercial : la sortie est déterministe et
 * dépend réellement des entrées (secteur, budget, mots-clés des notes de RDV).
 *
 * TODO: Remplacer par l'appel API réelle (POST /api/proposals/generate → n8n
 * webhook `receipty-proposal-writer` : GPT-4o avec le prompt commercial
 * Receipty + fusion dans le template PDF de l'agence).
 */

export const PROPOSAL_SECTORS = [
  {
    id: 'btp',
    label: 'BTP & Construction',
    context: 'la gestion des chantiers, des devis et des situations de travaux',
    benchmark: 'Une PME du BTP consacre en moyenne 11 h par semaine à la saisie administrative de ses chantiers.',
  },
  {
    id: 'commerce',
    label: 'Commerce & E-commerce',
    context: 'le traitement des commandes, du SAV et de la relation client',
    benchmark: 'Un e-commerçant traite en moyenne 62 % de demandes SAV répétitives, entièrement automatisables.',
  },
  {
    id: 'services',
    label: 'Services & Conseil',
    context: 'la production des livrables, le suivi de mission et la facturation au temps passé',
    benchmark: 'Dans les sociétés de services, 1 jour facturable sur 5 est absorbé par des tâches administratives.',
  },
  {
    id: 'industrie',
    label: 'Industrie & Production',
    context: 'les flux fournisseurs, la qualité et la planification de production',
    benchmark: 'Le rapprochement manuel commande / bon de livraison / facture coûte en moyenne 14 € par document.',
  },
  {
    id: 'sante',
    label: 'Santé & Professions libérales',
    context: 'la gestion des rendez-vous, des dossiers patients et des règlements',
    benchmark: 'Un cabinet libéral perd en moyenne 6 h par semaine en prise de rendez-vous et relances téléphoniques.',
  },
  {
    id: 'immobilier',
    label: 'Immobilier & Gestion locative',
    context: 'la qualification des leads, les mandats et la gestion locative',
    benchmark: '48 % des leads immobiliers sont perdus faute de rappel dans l’heure suivant la demande.',
  },
  {
    id: 'transport',
    label: 'Transport & Logistique',
    context: 'la planification des tournées, les lettres de voiture et la facturation client',
    benchmark: 'Le traitement d’un dossier de transport mobilise en moyenne 12 minutes de saisie manuelle.',
  },
  {
    id: 'autre',
    label: 'Autre secteur',
    context: 'les processus administratifs et commerciaux récurrents',
    benchmark: 'Une PME de 10 à 50 salariés automatise en moyenne 30 % de ses tâches administratives en 90 jours.',
  },
];

/** Exemple pré-rempli par le bouton « Remplir avec un exemple réel ». */
export const PROPOSAL_PREFILL = {
  companyName: 'Alsace Négoce Distribution',
  sector: 'commerce',
  budget: '3000',
  contactName: 'Sophie Kieffer',
  contactRole: 'Directrice administrative et financière',
  notes:
    "Client veut automatiser ses relances de paiement, environ 40 factures par mois. Gros problème de trésorerie : "
    + "en moyenne 38 jours de retard de règlement. Aujourd'hui tout est suivi sur un fichier Excel partagé, deux "
    + "personnes ressaisissent les factures dans le logiciel comptable. Ils reçoivent aussi beaucoup de mails "
    + "clients répétitifs (suivi de commande, disponibilité produit). Budget évoqué : 3k. Décision sous 3 semaines, "
    + "il faut convaincre le dirigeant. Ils utilisent Sage et Gmail.",
};

/**
 * Détection de signaux dans les notes brutes de rendez-vous.
 * Chaque signal reconnu devient un enjeu client + un levier d'automatisation.
 */
const SIGNALS = [
  {
    id: 'relances',
    match: /relanc|impay|retard de (r[eè]glement|paiement)|recouvr/i,
    issue: 'Relances de paiement effectuées manuellement, de façon irrégulière',
    impact: 'Allongement du délai moyen de règlement et tension permanente sur la trésorerie',
    lever: 'Séquence de relance automatique (J+3, J+10, J+21) déclenchée sur l’échéance réelle de chaque facture',
  },
  {
    id: 'tresorerie',
    match: /tr[eé]sorerie|cash|bfr|dso/i,
    issue: 'Absence de visibilité consolidée sur les encaissements à venir',
    impact: 'Décisions de trésorerie prises à l’estime, sans prévisionnel fiable',
    lever: 'Tableau de bord d’encaissement prévisionnel mis à jour quotidiennement',
  },
  {
    id: 'facturation',
    match: /factur/i,
    issue: 'Traitement et suivi des factures reposant sur des étapes manuelles',
    impact: 'Temps administratif élevé et risque d’erreur de saisie sur chaque document',
    lever: 'Extraction automatique des factures et injection directe dans l’outil comptable',
  },
  {
    id: 'ressaisie',
    match: /ressais|double saisie|excel|tableur|copier|coller/i,
    issue: 'Double saisie entre le tableur de suivi et le logiciel métier',
    impact: 'Données divergentes entre les deux sources et temps perdu en réconciliation',
    lever: 'Synchronisation bidirectionnelle : une seule source de vérité, plus aucune ressaisie',
  },
  {
    id: 'emails',
    match: /mail|e-mail|courriel|message|sav|support|demande client/i,
    issue: 'Volume important de sollicitations clients répétitives traitées une par une',
    impact: 'Temps de réponse dégradé aux heures de pointe et faible valeur ajoutée du traitement',
    lever: 'Assistant de réponse IA branché sur la boîte partagée, avec validation humaine avant envoi',
  },
  {
    id: 'devis',
    match: /devis|proposition|chiffrage|estimation/i,
    issue: 'Production des devis lente et dépendante d’une seule personne',
    impact: 'Délai de réponse aux prospects supérieur à celui de la concurrence',
    lever: 'Génération assistée des devis à partir d’un catalogue de prix structuré',
  },
  {
    id: 'rdv',
    match: /rendez-vous|rdv|agenda|planning|planif|tourn[ée]e/i,
    issue: 'Planification et confirmation des rendez-vous gérées au téléphone',
    impact: 'Taux de désistement élevé et temps de coordination important',
    lever: 'Prise de rendez-vous en ligne avec rappels automatiques la veille',
  },
  {
    id: 'leads',
    match: /lead|prospect|prospection|crm|pipeline/i,
    issue: 'Leads entrants non qualifiés et non rappelés de façon systématique',
    impact: 'Perte d’opportunités commerciales faute de traitement dans les délais',
    lever: 'Qualification et routage automatiques des leads vers le bon commercial en moins de 5 minutes',
  },
  {
    id: 'stock',
    match: /stock|inventaire|approvisionn|r[eé]assort/i,
    issue: 'Suivi des stocks déclaratif, mis à jour a posteriori',
    impact: 'Ruptures subies et commandes fournisseurs passées dans l’urgence',
    lever: 'Alertes de seuil automatiques et proposition de réassort hebdomadaire',
  },
  {
    id: 'rh',
    match: /recrut|candidat|rh|onboarding|paie/i,
    issue: 'Processus RH (tri des candidatures, intégration) entièrement manuel',
    impact: 'Délai de recrutement allongé et expérience candidat dégradée',
    lever: 'Pré-qualification automatique des candidatures et parcours d’intégration déclenché à la signature',
  },
];

/** Outils cités dans les notes — repris tels quels dans la section intégrations. */
const TOOL_HINTS = [
  { match: /sage/i, name: 'Sage' },
  { match: /quickbooks/i, name: 'QuickBooks' },
  { match: /pennylane/i, name: 'Pennylane' },
  { match: /cegid/i, name: 'Cegid' },
  { match: /ebp\b/i, name: 'EBP' },
  { match: /gmail|google workspace/i, name: 'Gmail / Google Workspace' },
  { match: /outlook|microsoft 365|office 365/i, name: 'Outlook / Microsoft 365' },
  { match: /hubspot/i, name: 'HubSpot' },
  { match: /salesforce/i, name: 'Salesforce' },
  { match: /pipedrive/i, name: 'Pipedrive' },
  { match: /excel|tableur/i, name: 'Excel / Google Sheets' },
  { match: /shopify/i, name: 'Shopify' },
  { match: /woocommerce/i, name: 'WooCommerce' },
  { match: /prestashop/i, name: 'PrestaShop' },
  { match: /slack/i, name: 'Slack' },
  { match: /notion/i, name: 'Notion' },
];

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('fr-FR');

/** Arrondit à la centaine la plus proche, pour des montants présentables. */
const roundTo = (value, step) => Math.round(value / step) * step;

/**
 * Compose la proposition commerciale.
 * @param {{companyName:string, sector:string, budget:string|number, notes:string,
 *          contactName?:string, contactRole?:string}} input
 */
export function buildProposal(input) {
  const sector = PROPOSAL_SECTORS.find((s) => s.id === input.sector) || PROPOSAL_SECTORS[PROPOSAL_SECTORS.length - 1];
  const notes = input.notes || '';
  const companyName = (input.companyName || '').trim() || 'Votre entreprise';

  // ── Budget : borné à la grille tarifaire de l'agence (1 000 € – 10 000 €) ──
  const rawBudget = Number(String(input.budget).replace(/[^\d.]/g, '')) || 3000;
  const setupTotal = roundTo(Math.min(Math.max(rawBudget, 1000), 10000), 100);
  const monthly = roundTo(Math.min(Math.max(setupTotal * 0.09, 99), 499), 10);

  // ── Enjeux détectés dans les notes de rendez-vous ──────────────────────────
  const detected = SIGNALS.filter((signal) => signal.match.test(notes));
  const issues = detected.length > 0 ? detected.slice(0, 4) : SIGNALS.slice(0, 3);

  const tools = TOOL_HINTS.filter((tool) => tool.match.test(notes)).map((tool) => tool.name);

  // ── Volumétrie : on récupère un nombre mensuel cité dans les notes ─────────
  const volumeMatch = notes.match(/(\d[\d\s]{0,6})\s*(?:factures?|commandes?|dossiers?|documents?|demandes?|mails?)/i);
  const monthlyVolume = volumeMatch ? Number(volumeMatch[1].replace(/\s/g, '')) : 40;

  // Modèle de gain retenu par l'agence :
  //   - 5 min 30 économisées par document traité automatiquement ;
  //   - 3 h par mois de travail récurrent supprimées par levier activé
  //     (relances, réconciliation, réponses types…).
  const hoursFromDocuments = (monthlyVolume * 5.5) / 60;
  const hoursFromLevers = issues.length * 3;
  const hoursSavedPerMonth = Math.round(hoursFromDocuments + hoursFromLevers);

  const HOURLY_COST = 38; // coût horaire chargé retenu pour une PME
  const annualSaving = Math.round((hoursSavedPerMonth * 12 * HOURLY_COST) / 100) * 100;

  // Retour sur investissement : mise en place amortie par le gain net mensuel
  // (gain mensuel − abonnement). Si le gain net est nul ou négatif, on ne
  // fabrique pas un chiffre flatteur : on annonce un amortissement long.
  const netMonthlyGain = annualSaving / 12 - monthly;
  const paybackMonths = netMonthlyGain > 0 ? Math.min(24, Math.max(1, Math.ceil(setupTotal / netMonthlyGain))) : null;

  const delayMatch = notes.match(/(\d{1,3})\s*jours?\s*(?:de\s*)?retard/i);
  const paymentDelay = delayMatch ? Number(delayMatch[1]) : null;

  // ── Répartition du chiffrage sur les 3 phases ─────────────────────────────
  const phase1 = roundTo(setupTotal * 0.25, 50);
  const phase2 = roundTo(setupTotal * 0.45, 50);
  const phase3 = setupTotal - phase1 - phase2;

  const reference = `PROP-2026-${String(Math.abs(hashCode(companyName)) % 900 + 100)}`;

  const synthesis = [
    `${companyName} évolue dans ${sector.label.toLowerCase()}, un secteur où ${sector.context} concentrent l'essentiel `
      + `de la charge administrative. Nos échanges ont mis en évidence un point commun à l'ensemble des irritants `
      + `remontés : ce ne sont pas des problèmes d'outils, mais des ruptures de chaîne entre des outils qui ne se `
      + `parlent pas. Chaque rupture est aujourd'hui comblée par une intervention humaine répétitive.`,
    paymentDelay
      ? `Le chiffre le plus parlant reste le délai de règlement observé : ${paymentDelay} jours de retard moyen. `
        + `Sur un volume de ${NUM.format(monthlyVolume)} documents par mois, cet écart n'est pas un problème de `
        + `recouvrement mais un problème de systématicité : les relances existent, elles ne sont simplement pas `
        + `déclenchées de manière fiable et datée.`
      : `Sur un volume estimé à ${NUM.format(monthlyVolume)} documents traités chaque mois, le temps consacré aux `
        + `tâches sans valeur ajoutée représente l'équivalent de ${NUM.format(hoursSavedPerMonth)} heures mensuelles, `
        + `soit près de ${NUM.format(Math.max(1, Math.round(hoursSavedPerMonth / 7)))} journées de travail par mois.`,
    `${sector.benchmark} L'objectif de cette proposition n'est pas de remplacer vos outils existants`
      + `${tools.length > 0 ? ` (${tools.join(', ')})` : ''}, mais de les relier par une couche d'automatisation `
      + `pilotée, mesurable et réversible.`,
  ];

  const phases = [
    {
      number: 1,
      name: 'Cadrage & cartographie des flux',
      duration: '2 semaines',
      price: phase1,
      objective:
        'Documenter précisément les processus concernés et figer les règles métier avant toute ligne de code.',
      deliverables: [
        'Atelier de cadrage de 3 heures avec les équipes concernées',
        'Cartographie des flux actuels et identification des points de rupture',
        'Spécification fonctionnelle des automatisations retenues',
        'Grille de mesure : indicateurs de départ et objectifs chiffrés',
      ],
    },
    {
      number: 2,
      name: 'Construction & intégration',
      duration: '4 à 5 semaines',
      price: phase2,
      objective:
        'Développer les automatisations, les brancher sur vos outils et les valider sur des données réelles.',
      deliverables: [
        ...issues.slice(0, 3).map((issue) => issue.lever),
        tools.length > 0
          ? `Connexion aux outils en place : ${tools.join(', ')}`
          : 'Connexion aux outils en place (comptabilité, messagerie, CRM)',
        'Recette sur un échantillon réel de vos documents des 3 derniers mois',
      ],
    },
    {
      number: 3,
      name: 'Déploiement, formation & pilotage',
      duration: '2 semaines puis suivi mensuel',
      price: phase3,
      objective:
        'Mettre en production progressivement, rendre les équipes autonomes et suivre les gains dans la durée.',
      deliverables: [
        'Bascule progressive avec période de double contrôle de 15 jours',
        'Formation des utilisateurs (2 sessions) et documentation opérationnelle',
        'Tableau de bord de pilotage : volumes traités, taux d’automatisation, temps gagné',
        'Comité de suivi mensuel et ajustement des règles métier',
      ],
    },
  ];

  const kpis = [
    { label: 'Temps administratif économisé', value: `${NUM.format(hoursSavedPerMonth)} h`, unit: '/ mois' },
    { label: 'Documents traités automatiquement', value: NUM.format(monthlyVolume), unit: '/ mois' },
    { label: 'Économie annualisée estimée', value: EUR.format(annualSaving), unit: '' },
    { label: 'Retour sur investissement', value: paybackMonths ? `${paybackMonths}` : '> 24', unit: 'mois' },
  ];

  return {
    reference,
    issuedAt: '06/08/2026',
    validUntil: '05/09/2026',
    companyName,
    contactName: (input.contactName || '').trim(),
    contactRole: (input.contactRole || '').trim(),
    sectorLabel: sector.label,
    synthesis,
    issues: issues.map((issue) => ({ issue: issue.issue, impact: issue.impact, lever: issue.lever })),
    phases,
    pricing: {
      setupTotal,
      setupLabel: EUR.format(setupTotal),
      monthly,
      monthlyLabel: EUR.format(monthly),
      breakdown: phases.map((phase) => ({ name: phase.name, price: phase.price, label: EUR.format(phase.price) })),
    },
    kpis,
    tools,
    conditions: [
      'Prix exprimés hors taxes. TVA applicable au taux de 20 %.',
      'Échelonnement : 40 % à la signature, 40 % à la recette, 20 % à la mise en production.',
      'L’abonnement mensuel couvre l’hébergement, la supervision des flux et le support sous 1 jour ouvré.',
      'Engagement de 12 mois sur l’abonnement, résiliable ensuite avec un préavis de 2 mois.',
      'Le code des automatisations vous appartient et vous est remis en fin de projet.',
    ],
  };
}

/** Hash stable pour générer une référence de proposition reproductible. */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
