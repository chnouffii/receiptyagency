/**
 * Jeux de données de la Démo 2 — Assistant RAG interne (RH & procédures).
 *
 * Le corpus simule une base documentaire d'entreprise indexée (vector store).
 * Chaque réponse cite les documents réellement utilisés pour la générer.
 *
 * TODO: Remplacer par l'appel API réelle (POST /api/rag/query → n8n webhook
 * `receipty-rag-query` : embeddings text-embedding-3-large, recherche hybride
 * Qdrant, puis génération GPT-4o avec citations obligatoires).
 */

/** Documents indexés, affichés dans le panneau « Base de connaissances ». */
export const KNOWLEDGE_BASE = [
  { id: 'rh', name: 'Manuel_RH_2026.pdf', pages: 48, updatedAt: '12/01/2026', chunks: 214 },
  { id: 'notes', name: 'Politique_Notes_de_frais_v4.pdf', pages: 12, updatedAt: '03/12/2025', chunks: 61 },
  { id: 'conges', name: 'Accord_Temps_de_travail_2025.pdf', pages: 27, updatedAt: '18/09/2025', chunks: 128 },
  { id: 'it', name: 'Procedures_IT_Support.pdf', pages: 19, updatedAt: '27/01/2026', chunks: 84 },
  { id: 'onboarding', name: 'Guide_Onboarding_Collaborateur.pdf', pages: 22, updatedAt: '05/11/2025', chunks: 97 },
];

/** Statistiques du corpus, affichées en en-tête de la démo. */
export const KNOWLEDGE_STATS = {
  documents: 5,
  pages: 128,
  chunks: 584,
  lastSync: '27/01/2026 · 04:12',
};

/** Étapes de « réflexion » affichées avant le streaming de la réponse. */
export const RAG_THINKING_STEPS = [
  'Reformulation de la question',
  'Recherche vectorielle dans 584 extraits',
  'Reclassement des 6 passages les plus pertinents',
  'Rédaction de la réponse sourcée',
];

export const RAG_SUGGESTIONS = [
  {
    id: 'notes-de-frais',
    label: 'Quelle est la procédure exacte pour les notes de frais de déplacement ?',
    topic: 'Finance & RH',
    question: 'Quelle est la procédure exacte pour les notes de frais de déplacement ?',
    answer: `La procédure de remboursement des frais de déplacement se déroule en quatre étapes, toutes dématérialisées depuis janvier 2026.

• Étape 1 — Validation préalable. Tout déplacement supérieur à 150 € doit faire l'objet d'une demande dans l'outil «Expensya», validée par le manager avant l'engagement de la dépense. En dessous de ce seuil, aucune validation préalable n'est requise.
• Étape 2 — Collecte des justificatifs. Chaque dépense doit être accompagnée d'un justificatif original photographié. Les tickets de carte bancaire seuls ne sont pas acceptés : la facture nominative est obligatoire pour l'hébergement et la restauration.
• Étape 3 — Saisie de la note. La note de frais est déposée au plus tard le 5 du mois suivant le déplacement. Passé ce délai, elle est reportée sur la paie du mois d'après.
• Étape 4 — Validation et remboursement. Le manager valide sous 5 jours ouvrés, la comptabilité contrôle sous 3 jours, et le remboursement intervient avec le virement de paie du mois en cours.

Barèmes applicables en 2026 : indemnité kilométrique de 0,636 €/km pour un véhicule de 5 CV, plafond de 19,40 € par repas et de 145 € par nuitée hors Île-de-France (190 € en Île-de-France). Le train est obligatoire pour tout trajet de moins de 3 heures de porte à porte.`,
    sources: [
      {
        document: 'Politique_Notes_de_frais_v4.pdf',
        page: 4,
        section: 'Section 2.1 — Circuit de validation',
        excerpt:
          'Toute dépense engagée au-delà de 150 € TTC nécessite une validation managériale préalable saisie dans l\'outil de gestion des frais.',
        relevance: 96,
      },
      {
        document: 'Politique_Notes_de_frais_v4.pdf',
        page: 7,
        section: 'Section 3.4 — Barèmes 2026',
        excerpt:
          'Indemnité kilométrique : 0,636 €/km (5 CV). Plafond restauration : 19,40 €/repas. Plafond hébergement : 145 € province, 190 € Île-de-France.',
        relevance: 93,
      },
      {
        document: 'Manuel_RH_2026.pdf',
        page: 31,
        section: 'Section 6.2 — Délais de remboursement',
        excerpt:
          'Les notes déposées après le 5 du mois sont traitées sur la paie du mois suivant, sans exception.',
        relevance: 88,
      },
    ],
  },
  {
    id: 'conges',
    label: 'Combien de jours de préavis faut-il poser pour les congés payés ?',
    topic: 'Congés & absences',
    question: 'Combien de jours de préavis faut-il poser pour les congés payés ?',
    answer: `Le délai de prévenance dépend de la durée de l'absence demandée.

• 1 à 2 jours : préavis de 7 jours calendaires, validation par le manager direct.
• 3 à 5 jours : préavis de 15 jours calendaires, validation par le manager direct.
• Plus de 5 jours : préavis de 30 jours calendaires, validation conjointe du manager et de la direction des ressources humaines.

Deux règles complémentaires s'appliquent. D'une part, les congés de la période estivale (1er juin — 30 septembre) doivent être posés avant le 15 avril, afin de permettre l'arbitrage collectif au sein de chaque équipe. D'autre part, un taux de présence minimum de 50 % de l'effectif doit être maintenu dans chaque service : au-delà, les demandes sont arbitrées par ordre d'ancienneté dans l'entreprise.

Le solde de congés payés est consultable en temps réel dans l'espace collaborateur. Les jours non pris au 31 mai N+1 sont perdus, sauf report exceptionnel accordé par écrit par la DRH.`,
    sources: [
      {
        document: 'Manuel_RH_2026.pdf',
        page: 14,
        section: 'Section 3.2 — Délais de prévenance',
        excerpt:
          'Absence de 1 à 2 jours : 7 jours de préavis. De 3 à 5 jours : 15 jours. Au-delà de 5 jours : 30 jours et validation DRH.',
        relevance: 98,
      },
      {
        document: 'Accord_Temps_de_travail_2025.pdf',
        page: 9,
        section: 'Article 5 — Période estivale',
        excerpt:
          'Les souhaits de congés pour la période du 1er juin au 30 septembre sont déposés au plus tard le 15 avril de l\'année en cours.',
        relevance: 91,
      },
      {
        document: 'Accord_Temps_de_travail_2025.pdf',
        page: 11,
        section: 'Article 7 — Continuité de service',
        excerpt:
          'Un effectif minimum de 50 % est maintenu dans chaque service. Les arbitrages se font par ordre d\'ancienneté.',
        relevance: 85,
      },
    ],
  },
  {
    id: 'panne-it',
    label: 'Quelle est la démarche en cas de panne du matériel informatique ?',
    topic: 'Support IT',
    question: 'Quelle est la démarche en cas de panne du matériel informatique ?',
    answer: `La démarche dépend du niveau de criticité, évalué par le collaborateur au moment de la déclaration.

• Panne bloquante (poste inutilisable, perte d'accès aux outils métier). Appeler directement le support au 03 88 12 45 90, disponible de 8 h à 19 h. Un ticket «P1» est ouvert automatiquement, avec une garantie d'intervention en 2 heures ouvrées et la mise à disposition d'un poste de prêt sous 4 heures.
• Panne non bloquante (périphérique défectueux, lenteurs, imprimante). Ouvrir un ticket depuis le portail interne support.entreprise.fr en joignant une photo ou une capture d'écran. Prise en charge sous 1 jour ouvré, résolution cible sous 3 jours ouvrés.
• Matériel endommagé ou perdu. Déclarer sous 24 heures auprès du service IT et de son manager. Un formulaire de déclaration est à compléter ; en cas de vol, le dépôt de plainte est obligatoire et doit être transmis à la DRH.

Dans tous les cas, ne jamais confier son poste à un prestataire externe ni tenter une réparation soi-même : cela rompt la garantie constructeur et le contrat d'infogérance. Les données du poste sont sauvegardées automatiquement toutes les 4 heures, aucune action de sauvegarde manuelle n'est nécessaire avant remise du matériel.`,
    sources: [
      {
        document: 'Procedures_IT_Support.pdf',
        page: 6,
        section: 'Section 2.3 — Niveaux de criticité',
        excerpt:
          'Un incident P1 (poste inutilisable) donne lieu à une intervention sous 2 heures ouvrées et à un poste de prêt sous 4 heures.',
        relevance: 97,
      },
      {
        document: 'Procedures_IT_Support.pdf',
        page: 13,
        section: 'Section 5.1 — Matériel perdu ou volé',
        excerpt:
          'Toute perte ou vol doit être déclarée sous 24 heures. En cas de vol, le récépissé de dépôt de plainte est transmis à la DRH.',
        relevance: 90,
      },
      {
        document: 'Manuel_RH_2026.pdf',
        page: 40,
        section: 'Section 8.5 — Usage du matériel professionnel',
        excerpt:
          'Toute intervention par un tiers non agréé sur le matériel de l\'entreprise entraîne la rupture du contrat d\'infogérance.',
        relevance: 82,
      },
    ],
  },
];

/** Réponse générique lorsqu'aucune question suggérée n'est reconnue. */
export const RAG_FALLBACK = {
  answer: `Cette démonstration s'appuie sur un corpus restreint de 5 documents internes indexés. Je n'ai pas trouvé de passage suffisamment pertinent pour répondre avec certitude à cette question précise.

Sur un déploiement réel, l'assistant est branché sur l'intégralité de votre base documentaire (SharePoint, Google Drive, Notion, GED métier) et applique la même règle : aucune réponse sans citation de source. En l'absence de passage pertinent, il le dit explicitement plutôt que d'inventer.

Essayez l'une des trois questions proposées ci-dessus pour voir le mécanisme de citation à l'œuvre.`,
  sources: [
    {
      document: 'Guide_Onboarding_Collaborateur.pdf',
      page: 3,
      section: 'Section 1.1 — Périmètre du corpus',
      excerpt:
        'La base de démonstration contient 5 documents et 584 extraits indexés. Toute question hors périmètre reçoit une réponse d\'abstention.',
      relevance: 41,
    },
  ],
};
