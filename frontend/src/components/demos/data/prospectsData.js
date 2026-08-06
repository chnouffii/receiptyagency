/**
 * Démo 4 — Enrichment & scoring de prospect.
 *
 * Simule le retour d'un pipeline d'enrichissement : crawl du site, détection de
 * la stack technique, croisement avec les données légales (Sirene / Pappers),
 * scoring de maturité puis rédaction d'un email de prospection personnalisé.
 *
 * TODO: Remplacer par l'appel API réelle (POST /api/prospects/enrich → n8n
 * webhook `receipty-prospect-enrich` : crawl Playwright + Wappalyzer, API
 * Pappers pour les données légales, puis GPT-4o pour l'email personnalisé).
 */

/** Étapes du scanner radar, jouées séquentiellement pendant l'analyse. */
export const SCAN_STEPS = [
  { id: 'reach', label: 'Résolution du domaine et lecture des en-têtes', duration: 700 },
  { id: 'crawl', label: 'Exploration des pages publiques', duration: 1100 },
  { id: 'stack', label: 'Détection de la stack technique', duration: 900 },
  { id: 'legal', label: 'Croisement avec les données légales (Sirene)', duration: 800 },
  { id: 'score', label: 'Scoring de maturité et rédaction de l’approche', duration: 1000 },
];

export const PROSPECT_SAMPLES = [
  {
    id: 'logistique',
    domain: 'strasbourg-logistique.fr',
    company: {
      name: 'Strasbourg Logistique',
      legalForm: 'SAS',
      siren: '452 118 730',
      naf: '5229B — Affrètement et organisation des transports',
      city: 'Strasbourg (67200)',
      employees: '34 salariés',
      revenue: '6,2 M€ (exercice 2024)',
      founded: '2009',
      decisionMaker: 'Marc Dietrich — Directeur général',
    },
    score: {
      global: 85,
      verdict: 'Prospect prioritaire',
      breakdown: [
        { label: 'Maturité digitale', value: 62, comment: 'Site vitrine à jour, aucun outil métier connecté' },
        { label: 'Potentiel d’automatisation', value: 94, comment: 'Volume documentaire élevé, processus manuels visibles' },
        { label: 'Capacité d’investissement', value: 88, comment: 'CA et effectif compatibles avec un projet à 5 chiffres' },
        { label: 'Accessibilité du décideur', value: 79, comment: 'Dirigeant identifié, structure à décision courte' },
      ],
    },
    stack: [
      { name: 'WordPress 6.4', category: 'CMS', confidence: 99 },
      { name: 'Elementor Pro', category: 'Page builder', confidence: 97 },
      { name: 'Contact Form 7', category: 'Formulaires', confidence: 94 },
      { name: 'Google Analytics 4', category: 'Analytics', confidence: 99 },
      { name: 'Google Workspace', category: 'Messagerie (MX)', confidence: 100 },
      { name: 'OVH Cloud', category: 'Hébergement', confidence: 96 },
      { name: 'Aucun CRM détecté', category: 'CRM', confidence: 88, negative: true },
      { name: 'Aucun espace client', category: 'Portail', confidence: 91, negative: true },
    ],
    signals: [
      'Formulaire de demande de cotation renvoyant vers une simple adresse email générique',
      'Mention « réponse sous 48 h » affichée en page d’accueil — délai long sur ce marché',
      '3 offres d’emploi actives dont un poste d’assistant(e) d’exploitation',
      'Aucune page de suivi d’expédition : les clients appellent pour connaître le statut',
      'Actualité récente : ouverture d’une seconde plateforme à Colmar (janvier 2026)',
    ],
    opportunities: [
      {
        title: 'Portail de suivi d’expédition client',
        description:
          'Un espace de consultation en libre-service alimenté par le TMS supprimerait l’essentiel des appels entrants de suivi.',
        impact: 'Fort',
        effort: 'Moyen',
      },
      {
        title: 'Cotation automatisée depuis le formulaire',
        description:
          'La demande de cotation est qualifiée, tarifée selon la grille kilométrique puis renvoyée en moins de 10 minutes.',
        impact: 'Fort',
        effort: 'Faible',
      },
      {
        title: 'Extraction des lettres de voiture et CMR',
        description:
          'Lecture automatique des documents de transport et alimentation du dossier de facturation sans ressaisie.',
        impact: 'Fort',
        effort: 'Moyen',
      },
      {
        title: 'Relance automatique des factures clients',
        description:
          'Séquence de relance datée sur l’échéance réelle, avec remontée des litiges vers l’exploitation.',
        impact: 'Moyen',
        effort: 'Faible',
      },
    ],
    email: {
      subject: 'Suivi d’expédition — l’ouverture de Colmar va multiplier vos appels entrants',
      body: `Bonjour Monsieur Dietrich,

J'ai vu que Strasbourg Logistique venait d'ouvrir une seconde plateforme à Colmar. Félicitations — c'est aussi le moment où le volume d'appels « où en est mon envoi ? » explose, parce qu'il n'existe pas encore de page de suivi côté client.

Deux points m'ont marqué sur votre site : la demande de cotation arrive sur une adresse email générique, et vous annoncez une réponse sous 48 h. Sur votre marché, les transporteurs qui répondent en moins de 2 h captent une part significative des dossiers urgents.

Nous avons traité exactement ce sujet pour un affréteur de taille comparable : cotation renvoyée automatiquement en 9 minutes, et un espace de suivi qui a fait baisser les appels de suivi de 61 % en deux mois.

Est-ce que 20 minutes la semaine prochaine vous iraient pour que je vous montre concrètement à quoi cela ressemblerait chez vous ?

Bien à vous,
Quentin Both — Receipty`,
    },
  },
  {
    id: 'menuiserie',
    domain: 'menuiserie-alsace.fr',
    company: {
      name: 'Menuiserie d’Alsace',
      legalForm: 'SARL',
      siren: '388 704 552',
      naf: '4332A — Travaux de menuiserie bois et PVC',
      city: 'Obernai (67210)',
      employees: '12 salariés',
      revenue: '1,8 M€ (exercice 2024)',
      founded: '1994',
      decisionMaker: 'Christine Muller — Gérante',
    },
    score: {
      global: 71,
      verdict: 'Prospect à travailler',
      breakdown: [
        { label: 'Maturité digitale', value: 44, comment: 'Site Wix, aucun outil de mesure d’audience' },
        { label: 'Potentiel d’automatisation', value: 87, comment: 'Devis et prise de RDV entièrement téléphoniques' },
        { label: 'Capacité d’investissement', value: 63, comment: 'Structure artisanale : projet à cadrer sur un périmètre court' },
        { label: 'Accessibilité du décideur', value: 90, comment: 'Gérante joignable directement, décision immédiate' },
      ],
    },
    stack: [
      { name: 'Wix', category: 'CMS', confidence: 99 },
      { name: 'Formulaire Wix natif', category: 'Formulaires', confidence: 95 },
      { name: 'Meta Pixel', category: 'Publicité', confidence: 82 },
      { name: 'OVH Mail', category: 'Messagerie (MX)', confidence: 97 },
      { name: 'Aucun outil d’analytics', category: 'Analytics', confidence: 89, negative: true },
      { name: 'Aucune prise de RDV en ligne', category: 'Prise de rendez-vous', confidence: 93, negative: true },
      { name: 'Aucun devis en ligne', category: 'Devis', confidence: 90, negative: true },
    ],
    signals: [
      'Demande de devis uniquement par téléphone, affichée sur les 4 pages du site',
      'Galerie de réalisations non mise à jour depuis mars 2024',
      'Campagne Meta active détectée — trafic payant envoyé vers une page sans conversion mesurée',
      'Avis Google : 4,7/5 sur 128 avis, plusieurs mentionnant un délai de réponse au devis',
      'Zone d’intervention affichée : Bas-Rhin et Haut-Rhin',
    ],
    opportunities: [
      {
        title: 'Qualification automatique des demandes de devis',
        description:
          'Un formulaire structuré (type de menuiserie, dimensions, matériau, délai) qualifie la demande et produit un pré-chiffrage.',
        impact: 'Fort',
        effort: 'Faible',
      },
      {
        title: 'Prise de rendez-vous de métrage en ligne',
        description:
          'Le prospect réserve directement un créneau de métrage selon la zone géographique et la tournée du poseur.',
        impact: 'Fort',
        effort: 'Faible',
      },
      {
        title: 'Relance automatique des devis sans réponse',
        description:
          'Relance à J+5 et J+15 avec rappel du chiffrage : sur ce métier, elle récupère en moyenne 18 % des devis dormants.',
        impact: 'Moyen',
        effort: 'Faible',
      },
      {
        title: 'Suivi de chantier photo automatisé',
        description:
          'Les photos envoyées par les poseurs alimentent le dossier client et la galerie du site sans intervention.',
        impact: 'Moyen',
        effort: 'Moyen',
      },
    ],
    email: {
      subject: 'Vos campagnes Meta envoient du trafic sur une page sans demande de devis',
      body: `Bonjour Madame Muller,

J'ai remarqué que Menuiserie d'Alsace fait actuellement de la publicité sur Meta. Le trafic arrive bien sur votre site, mais la seule façon d'obtenir un devis reste l'appel téléphonique — ce qui veut dire que tout ce qui arrive le soir ou le week-end est perdu.

Vos 128 avis Google à 4,7/5 montrent que la qualité du travail n'est pas le sujet. Plusieurs clients évoquent en revanche l'attente avant d'avoir un chiffrage.

Chez un menuisier de taille comparable, nous avons mis en place un formulaire de demande structuré (type de pose, dimensions, matériau) qui renvoie un pré-chiffrage immédiat et propose un créneau de métrage. Résultat : 3 fois plus de demandes qualifiées, et plus aucune demande perdue hors horaires.

C'est un chantier court, quelques semaines. Seriez-vous disponible 20 minutes pour en parler ?

Bien cordialement,
Quentin Both — Receipty`,
    },
  },
];
