/**
 * Jeux de données de la Démo 2 — Assistant RAG interne (RH & procédures).
 *
 * Le corpus simule une base documentaire d'entreprise indexée (vector store).
 * Chaque réponse cite les documents réellement utilisés pour la générer, avec
 * un score de pertinence et le passage exact surligné dans sa page d'origine.
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

/**
 * Perspectives de lecture. La base documentaire est la même : seul l'angle de
 * restitution change — ce que l'employé doit faire, ou ce que le dirigeant doit
 * arbitrer, contrôler et budgéter.
 */
export const RAG_PERSONAS = [
  {
    id: 'employee',
    label: 'Perspective Employé',
    hint: 'Ce que je dois faire, concrètement',
  },
  {
    id: 'manager',
    label: 'Perspective Manager / Dirigeant',
    hint: 'Ce que je dois arbitrer, contrôler et budgéter',
  },
];

/* ─────────────────── Contenus de page pour l'aperçu source ─────────────── */
/**
 * Rendu simplifié de la page citée : le passage repris par l'assistant est
 * marqué `highlight`, le reste donne le contexte de lecture.
 */
const PAGE_NOTES_FRAIS_4 = [
  { text: 'Section 2 — Engagement de la dépense' },
  {
    text:
      'Le collaborateur engage une dépense professionnelle dans le cadre strict de sa mission. Toute dépense doit pouvoir être rattachée à un client, un projet ou un centre de coût identifié.',
  },
  { text: '2.1 — Circuit de validation', heading: true },
  {
    text:
      'Toute dépense engagée au-delà de 150 € TTC nécessite une validation managériale préalable saisie dans l’outil de gestion des frais.',
    highlight: true,
  },
  {
    text:
      'En deçà de ce seuil, aucune validation préalable n’est requise ; le contrôle s’effectue a posteriori lors de la validation de la note de frais mensuelle.',
  },
  {
    text:
      'Le manager dispose de 5 jours ouvrés pour statuer. Passé ce délai, la demande est escaladée au niveau N+2.',
  },
];

const PAGE_NOTES_FRAIS_7 = [
  { text: 'Section 3 — Barèmes et plafonds' },
  { text: '3.4 — Barèmes 2026', heading: true },
  {
    text:
      'Indemnité kilométrique : 0,636 €/km (5 CV). Plafond restauration : 19,40 €/repas. Plafond hébergement : 145 € province, 190 € Île-de-France.',
    highlight: true,
  },
  {
    text:
      'Les barèmes sont revalorisés chaque année au 1er janvier, sur la base du barème fiscal publié par l’administration.',
  },
  {
    text:
      'Le train est obligatoire pour tout trajet de moins de 3 heures de porte à porte. L’usage du véhicule personnel sur ces trajets n’est remboursé qu’en cas d’impossibilité justifiée.',
  },
];

const PAGE_RH_31 = [
  { text: 'Section 6 — Rémunération et remboursements' },
  { text: '6.2 — Délais de remboursement', heading: true },
  {
    text:
      'Les notes déposées après le 5 du mois sont traitées sur la paie du mois suivant, sans exception.',
    highlight: true,
  },
  {
    text:
      'Le remboursement apparaît sur le bulletin de paie en ligne distincte, non soumise à cotisations dès lors que les justificatifs sont conformes.',
  },
];

const PAGE_RH_14 = [
  { text: 'Section 3 — Congés payés' },
  { text: '3.2 — Délais de prévenance', heading: true },
  {
    text:
      'Absence de 1 à 2 jours : 7 jours de préavis. De 3 à 5 jours : 15 jours. Au-delà de 5 jours : 30 jours et validation DRH.',
    highlight: true,
  },
  {
    text:
      'Les délais s’entendent en jours calendaires et courent à compter de la date de saisie de la demande dans l’espace collaborateur.',
  },
  {
    text:
      'En cas de circonstance exceptionnelle (décès, hospitalisation d’un proche), ces délais ne s’appliquent pas et la demande est traitée sous 24 heures.',
  },
];

const PAGE_CONGES_9 = [
  { text: 'Article 5 — Période estivale' },
  {
    text:
      'Les souhaits de congés pour la période du 1er juin au 30 septembre sont déposés au plus tard le 15 avril de l’année en cours.',
    highlight: true,
  },
  {
    text:
      'L’arbitrage est réalisé au niveau de chaque service dans les 15 jours suivant la clôture des souhaits, puis communiqué à l’ensemble des collaborateurs concernés.',
  },
];

const PAGE_CONGES_11 = [
  { text: 'Article 7 — Continuité de service' },
  {
    text:
      'Un effectif minimum de 50 % est maintenu dans chaque service. Les arbitrages se font par ordre d’ancienneté.',
    highlight: true,
  },
  {
    text:
      'Le responsable de service est garant de cette continuité et peut refuser une demande dont l’acceptation ferait passer l’effectif présent sous ce seuil.',
  },
];

const PAGE_IT_6 = [
  { text: 'Section 2 — Traitement des incidents' },
  { text: '2.3 — Niveaux de criticité', heading: true },
  {
    text:
      'Un incident P1 (poste inutilisable) donne lieu à une intervention sous 2 heures ouvrées et à un poste de prêt sous 4 heures.',
    highlight: true,
  },
  {
    text:
      'Un incident P2 (dégradation sans blocage) est pris en charge sous 1 jour ouvré, avec une résolution cible sous 3 jours ouvrés.',
  },
  {
    text:
      'Le support est joignable au 03 88 12 45 90 de 8 h à 19 h, et par le portail interne en dehors de ces horaires.',
  },
];

const PAGE_IT_13 = [
  { text: 'Section 5 — Matériel perdu ou volé' },
  {
    text:
      'Toute perte ou vol doit être déclarée sous 24 heures. En cas de vol, le récépissé de dépôt de plainte est transmis à la DRH.',
    highlight: true,
  },
  {
    text:
      'Le poste est verrouillé et effacé à distance dès la déclaration. Les données sauvegardées sont restaurées sur le matériel de remplacement.',
  },
];

const PAGE_RH_40 = [
  { text: 'Section 8 — Usage des moyens de l’entreprise' },
  { text: '8.5 — Usage du matériel professionnel', heading: true },
  {
    text:
      'Toute intervention par un tiers non agréé sur le matériel de l’entreprise entraîne la rupture du contrat d’infogérance.',
    highlight: true,
  },
  {
    text:
      'Le parc est couvert par un contrat d’infogérance incluant la garantie constructeur et le remplacement sous 48 heures.',
  },
];

const PAGE_ONBOARDING_3 = [
  { text: 'Section 1 — Périmètre' },
  { text: '1.1 — Périmètre du corpus', heading: true },
  {
    text:
      'La base de démonstration contient 5 documents et 584 extraits indexés. Toute question hors périmètre reçoit une réponse d’abstention.',
    highlight: true,
  },
];

/* ─────────────────────────── Questions suggérées ───────────────────────── */

export const RAG_SUGGESTIONS = [
  {
    id: 'notes-de-frais',
    label: 'Quelle est la procédure exacte pour les notes de frais de déplacement ?',
    topic: 'Finance & RH',
    question: 'Quelle est la procédure exacte pour les notes de frais de déplacement ?',
    variants: {
      employee: {
        confidence: 96,
        verdict: 'Élevée',
        answer: `La procédure de remboursement des frais de déplacement se déroule en quatre étapes, toutes dématérialisées depuis janvier 2026.

• Étape 1 — Validation préalable. Tout déplacement supérieur à 150 € doit faire l'objet d'une demande dans l'outil «Expensya», validée par votre manager avant l'engagement de la dépense. En dessous de ce seuil, aucune validation préalable n'est requise.
• Étape 2 — Collecte des justificatifs. Chaque dépense doit être accompagnée d'un justificatif original photographié. Les tickets de carte bancaire seuls ne sont pas acceptés : la facture nominative est obligatoire pour l'hébergement et la restauration.
• Étape 3 — Saisie de la note. Déposez votre note au plus tard le 5 du mois suivant le déplacement. Passé ce délai, elle est reportée sur la paie du mois d'après.
• Étape 4 — Remboursement. Votre manager valide sous 5 jours ouvrés, la comptabilité contrôle sous 3 jours, et le remboursement arrive avec le virement de paie du mois en cours.

Barèmes applicables en 2026 : indemnité kilométrique de 0,636 €/km pour un véhicule de 5 CV, plafond de 19,40 € par repas et de 145 € par nuitée hors Île-de-France (190 € en Île-de-France). Le train est obligatoire pour tout trajet de moins de 3 heures de porte à porte.`,
        sources: [
          {
            document: 'Politique_Notes_de_frais_v4.pdf',
            page: 4,
            section: 'Section 2.1 — Circuit de validation',
            excerpt:
              'Toute dépense engagée au-delà de 150 € TTC nécessite une validation managériale préalable saisie dans l’outil de gestion des frais.',
            relevance: 96,
            pageContent: PAGE_NOTES_FRAIS_4,
            updatedAt: '03/12/2025',
          },
          {
            document: 'Politique_Notes_de_frais_v4.pdf',
            page: 7,
            section: 'Section 3.4 — Barèmes 2026',
            excerpt:
              'Indemnité kilométrique : 0,636 €/km (5 CV). Plafond restauration : 19,40 €/repas. Plafond hébergement : 145 € province, 190 € Île-de-France.',
            relevance: 93,
            pageContent: PAGE_NOTES_FRAIS_7,
            updatedAt: '03/12/2025',
          },
          {
            document: 'Manuel_RH_2026.pdf',
            page: 31,
            section: 'Section 6.2 — Délais de remboursement',
            excerpt:
              'Les notes déposées après le 5 du mois sont traitées sur la paie du mois suivant, sans exception.',
            relevance: 88,
            pageContent: PAGE_RH_31,
            updatedAt: '12/01/2026',
          },
        ],
      },
      manager: {
        confidence: 91,
        verdict: 'Élevée',
        answer: `Sur les notes de frais, votre rôle se joue à trois endroits : le seuil d'engagement, le délai de validation et le contrôle de conformité.

• Le seuil de 150 € est votre point de contrôle amont. En deçà, la dépense est engagée sans votre accord et vous ne la découvrez qu'à la validation mensuelle. Au-delà, rien ne peut être engagé sans votre validation préalable.
• Vous disposez de 5 jours ouvrés pour statuer. Au-delà, la demande est automatiquement escaladée au N+2 — c'est le principal motif de remontée vers la direction sur ce processus.
• Le refus de justificatif est de votre ressort. Un ticket de carte bancaire seul n'est pas recevable pour l'hébergement et la restauration : sans facture nominative, le remboursement est requalifiable en avantage en nature lors d'un contrôle URSSAF.

Sur le plan budgétaire, les barèmes 2026 sont de 0,636 €/km (5 CV), 19,40 € par repas et 145 € par nuitée hors Île-de-France (190 € en Île-de-France). Le point de tension habituel est la règle du train obligatoire sous 3 heures de porte à porte : c'est là que se concentrent les demandes de dérogation, et elles doivent être justifiées par écrit.

Point d'attention de pilotage : toute note déposée après le 5 du mois bascule sur la paie suivante. Un dépôt tardif systématique dans une équipe décale sa trésorerie personnelle et génère des relances — c'est un indicateur à suivre.`,
        sources: [
          {
            document: 'Politique_Notes_de_frais_v4.pdf',
            page: 4,
            section: 'Section 2.1 — Circuit de validation',
            excerpt:
              'Toute dépense engagée au-delà de 150 € TTC nécessite une validation managériale préalable saisie dans l’outil de gestion des frais.',
            relevance: 94,
            pageContent: PAGE_NOTES_FRAIS_4,
            updatedAt: '03/12/2025',
          },
          {
            document: 'Manuel_RH_2026.pdf',
            page: 31,
            section: 'Section 6.2 — Délais de remboursement',
            excerpt:
              'Les notes déposées après le 5 du mois sont traitées sur la paie du mois suivant, sans exception.',
            relevance: 90,
            pageContent: PAGE_RH_31,
            updatedAt: '12/01/2026',
          },
          {
            document: 'Politique_Notes_de_frais_v4.pdf',
            page: 7,
            section: 'Section 3.4 — Barèmes 2026',
            excerpt:
              'Indemnité kilométrique : 0,636 €/km (5 CV). Plafond restauration : 19,40 €/repas. Plafond hébergement : 145 € province, 190 € Île-de-France.',
            relevance: 86,
            pageContent: PAGE_NOTES_FRAIS_7,
            updatedAt: '03/12/2025',
          },
        ],
      },
    },
  },
  {
    id: 'conges',
    label: 'Combien de jours de préavis faut-il poser pour les congés payés ?',
    topic: 'Congés & absences',
    question: 'Combien de jours de préavis faut-il poser pour les congés payés ?',
    variants: {
      employee: {
        confidence: 98,
        verdict: 'Très élevée',
        answer: `Le délai de prévenance dépend de la durée de l'absence que vous demandez.

• 1 à 2 jours : préavis de 7 jours calendaires, validation par votre manager direct.
• 3 à 5 jours : préavis de 15 jours calendaires, validation par votre manager direct.
• Plus de 5 jours : préavis de 30 jours calendaires, validation conjointe de votre manager et de la direction des ressources humaines.

Deux règles complémentaires s'appliquent. D'une part, les congés de la période estivale (1er juin — 30 septembre) doivent être posés avant le 15 avril. D'autre part, un taux de présence minimum de 50 % de l'effectif doit être maintenu dans chaque service : au-delà, les demandes sont arbitrées par ordre d'ancienneté dans l'entreprise.

Votre solde est consultable en temps réel dans l'espace collaborateur. Les jours non pris au 31 mai N+1 sont perdus, sauf report exceptionnel accordé par écrit par la DRH. En cas de circonstance exceptionnelle — décès ou hospitalisation d'un proche — ces délais ne s'appliquent pas et votre demande est traitée sous 24 heures.`,
        sources: [
          {
            document: 'Manuel_RH_2026.pdf',
            page: 14,
            section: 'Section 3.2 — Délais de prévenance',
            excerpt:
              'Absence de 1 à 2 jours : 7 jours de préavis. De 3 à 5 jours : 15 jours. Au-delà de 5 jours : 30 jours et validation DRH.',
            relevance: 98,
            pageContent: PAGE_RH_14,
            updatedAt: '12/01/2026',
          },
          {
            document: 'Accord_Temps_de_travail_2025.pdf',
            page: 9,
            section: 'Article 5 — Période estivale',
            excerpt:
              'Les souhaits de congés pour la période du 1er juin au 30 septembre sont déposés au plus tard le 15 avril de l’année en cours.',
            relevance: 91,
            pageContent: PAGE_CONGES_9,
            updatedAt: '18/09/2025',
          },
          {
            document: 'Accord_Temps_de_travail_2025.pdf',
            page: 11,
            section: 'Article 7 — Continuité de service',
            excerpt:
              'Un effectif minimum de 50 % est maintenu dans chaque service. Les arbitrages se font par ordre d’ancienneté.',
            relevance: 85,
            pageContent: PAGE_CONGES_11,
            updatedAt: '18/09/2025',
          },
        ],
      },
      manager: {
        confidence: 94,
        verdict: 'Élevée',
        answer: `Sur les congés, vous arbitrez sur deux critères cumulatifs : le respect du préavis et le maintien de la continuité de service.

• Préavis à faire respecter : 7 jours calendaires pour 1 à 2 jours d'absence, 15 jours pour 3 à 5 jours, 30 jours au-delà de 5 jours. À partir de 5 jours, la validation est conjointe avec la DRH — vous ne décidez pas seul.
• Continuité de service : vous devez maintenir 50 % de l'effectif présent dans votre service. C'est ce seuil qui fonde un refus, et c'est le seul motif opposable sans discussion.
• Règle d'arbitrage en cas de conflit : l'ancienneté dans l'entreprise prime. Ce critère est objectif et vous protège d'un contentieux sur l'équité de traitement.

Le point de charge annuel est la campagne estivale : les souhaits pour la période du 1er juin au 30 septembre sont clos le 15 avril, et vous disposez de 15 jours pour arbitrer et communiquer. Anticiper cette fenêtre évite la négociation au cas par cas en mai.

Deux limites à connaître. Les circonstances exceptionnelles — décès, hospitalisation d'un proche — échappent aux délais de prévenance et se traitent sous 24 heures. Et les jours non pris au 31 mai N+1 sont perdus : un solde élevé en fin de période est un risque social autant qu'un risque de désorganisation.`,
        sources: [
          {
            document: 'Accord_Temps_de_travail_2025.pdf',
            page: 11,
            section: 'Article 7 — Continuité de service',
            excerpt:
              'Un effectif minimum de 50 % est maintenu dans chaque service. Les arbitrages se font par ordre d’ancienneté.',
            relevance: 95,
            pageContent: PAGE_CONGES_11,
            updatedAt: '18/09/2025',
          },
          {
            document: 'Manuel_RH_2026.pdf',
            page: 14,
            section: 'Section 3.2 — Délais de prévenance',
            excerpt:
              'Absence de 1 à 2 jours : 7 jours de préavis. De 3 à 5 jours : 15 jours. Au-delà de 5 jours : 30 jours et validation DRH.',
            relevance: 93,
            pageContent: PAGE_RH_14,
            updatedAt: '12/01/2026',
          },
          {
            document: 'Accord_Temps_de_travail_2025.pdf',
            page: 9,
            section: 'Article 5 — Période estivale',
            excerpt:
              'Les souhaits de congés pour la période du 1er juin au 30 septembre sont déposés au plus tard le 15 avril de l’année en cours.',
            relevance: 89,
            pageContent: PAGE_CONGES_9,
            updatedAt: '18/09/2025',
          },
        ],
      },
    },
  },
  {
    id: 'panne-it',
    label: 'Quelle est la démarche en cas de panne du matériel informatique ?',
    topic: 'Support IT',
    question: 'Quelle est la démarche en cas de panne du matériel informatique ?',
    variants: {
      employee: {
        confidence: 97,
        verdict: 'Très élevée',
        answer: `La démarche dépend du niveau de criticité, que vous évaluez au moment de la déclaration.

• Panne bloquante (poste inutilisable, perte d'accès aux outils métier). Appelez directement le support au 03 88 12 45 90, de 8 h à 19 h. Un ticket «P1» est ouvert automatiquement, avec une intervention garantie en 2 heures ouvrées et un poste de prêt sous 4 heures.
• Panne non bloquante (périphérique défectueux, lenteurs, imprimante). Ouvrez un ticket depuis le portail interne support.entreprise.fr en joignant une photo ou une capture d'écran. Prise en charge sous 1 jour ouvré, résolution cible sous 3 jours ouvrés.
• Matériel endommagé ou perdu. Déclarez-le sous 24 heures auprès du service IT et de votre manager. En cas de vol, le dépôt de plainte est obligatoire et le récépissé doit être transmis à la DRH.

Dans tous les cas, ne confiez jamais votre poste à un prestataire externe et ne tentez pas de réparation vous-même : cela rompt la garantie constructeur et le contrat d'infogérance. Vos données sont sauvegardées automatiquement toutes les 4 heures, aucune action de votre part n'est nécessaire avant de remettre le matériel.`,
        sources: [
          {
            document: 'Procedures_IT_Support.pdf',
            page: 6,
            section: 'Section 2.3 — Niveaux de criticité',
            excerpt:
              'Un incident P1 (poste inutilisable) donne lieu à une intervention sous 2 heures ouvrées et à un poste de prêt sous 4 heures.',
            relevance: 97,
            pageContent: PAGE_IT_6,
            updatedAt: '27/01/2026',
          },
          {
            document: 'Procedures_IT_Support.pdf',
            page: 13,
            section: 'Section 5.1 — Matériel perdu ou volé',
            excerpt:
              'Toute perte ou vol doit être déclarée sous 24 heures. En cas de vol, le récépissé de dépôt de plainte est transmis à la DRH.',
            relevance: 90,
            pageContent: PAGE_IT_13,
            updatedAt: '27/01/2026',
          },
          {
            document: 'Manuel_RH_2026.pdf',
            page: 40,
            section: 'Section 8.5 — Usage du matériel professionnel',
            excerpt:
              'Toute intervention par un tiers non agréé sur le matériel de l’entreprise entraîne la rupture du contrat d’infogérance.',
            relevance: 82,
            pageContent: PAGE_RH_40,
            updatedAt: '12/01/2026',
          },
        ],
      },
      manager: {
        confidence: 89,
        verdict: 'Élevée',
        answer: `Ce qui vous concerne ici, ce sont les engagements de service contractuels et le risque de rupture de couverture.

• Engagements du contrat d'infogérance. Un incident P1 — poste inutilisable — ouvre une intervention sous 2 heures ouvrées et un poste de prêt sous 4 heures. Un P2 est pris en charge sous 1 jour ouvré, résolution cible sous 3 jours. Ces délais sont contractuels : leur non-respect se documente et se facture.
• Risque à surveiller de près. Toute intervention par un tiers non agréé rompt le contrat d'infogérance sur le matériel concerné. C'est le point où une initiative locale bien intentionnée coûte une immobilisation complète et un remplacement à votre charge.
• Matériel perdu ou volé. Déclaration sous 24 heures, dépôt de plainte obligatoire en cas de vol, récépissé transmis à la DRH. Le poste est verrouillé et effacé à distance dès la déclaration — c'est ce qui limite l'exposition en cas de perte de données clients.

En pilotage, les deux indicateurs qui comptent sont le délai réel de mise à disposition d'un poste de prêt et le taux d'incidents P1 récurrents sur un même poste : un matériel qui repasse en P1 plus de deux fois coûte plus cher à maintenir qu'à remplacer.`,
        sources: [
          {
            document: 'Procedures_IT_Support.pdf',
            page: 6,
            section: 'Section 2.3 — Niveaux de criticité',
            excerpt:
              'Un incident P1 (poste inutilisable) donne lieu à une intervention sous 2 heures ouvrées et à un poste de prêt sous 4 heures.',
            relevance: 93,
            pageContent: PAGE_IT_6,
            updatedAt: '27/01/2026',
          },
          {
            document: 'Manuel_RH_2026.pdf',
            page: 40,
            section: 'Section 8.5 — Usage du matériel professionnel',
            excerpt:
              'Toute intervention par un tiers non agréé sur le matériel de l’entreprise entraîne la rupture du contrat d’infogérance.',
            relevance: 91,
            pageContent: PAGE_RH_40,
            updatedAt: '12/01/2026',
          },
          {
            document: 'Procedures_IT_Support.pdf',
            page: 13,
            section: 'Section 5.1 — Matériel perdu ou volé',
            excerpt:
              'Toute perte ou vol doit être déclarée sous 24 heures. En cas de vol, le récépissé de dépôt de plainte est transmis à la DRH.',
            relevance: 87,
            pageContent: PAGE_IT_13,
            updatedAt: '27/01/2026',
          },
        ],
      },
    },
  },
];

/** Réponse générique lorsqu'aucune question suggérée n'est reconnue. */
export const RAG_FALLBACK = {
  confidence: 41,
  verdict: 'Insuffisante',
  answer: `Cette démonstration s'appuie sur un corpus restreint de 5 documents internes indexés. Je n'ai pas trouvé de passage suffisamment pertinent pour répondre avec certitude à cette question précise.

Sur un déploiement réel, l'assistant est branché sur l'intégralité de votre base documentaire (SharePoint, Google Drive, Notion, GED métier) et applique la même règle : aucune réponse sans citation de source. En l'absence de passage pertinent, il le dit explicitement plutôt que d'inventer.

Essayez l'une des trois questions proposées ci-dessus pour voir le mécanisme de citation à l'œuvre.`,
  sources: [
    {
      document: 'Guide_Onboarding_Collaborateur.pdf',
      page: 3,
      section: 'Section 1.1 — Périmètre du corpus',
      excerpt:
        'La base de démonstration contient 5 documents et 584 extraits indexés. Toute question hors périmètre reçoit une réponse d’abstention.',
      relevance: 41,
      pageContent: PAGE_ONBOARDING_3,
      updatedAt: '05/11/2025',
    },
  ],
};

/** Résout la variante à servir pour une question et une perspective données. */
export function resolveRagAnswer(question, persona) {
  const match = RAG_SUGGESTIONS.find(
    (item) => item.question.toLowerCase() === String(question).trim().toLowerCase(),
  );
  if (!match) return RAG_FALLBACK;
  return match.variants[persona] ?? match.variants.employee;
}
