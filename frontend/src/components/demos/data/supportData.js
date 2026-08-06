/**
 * Démo 5 — Agent support client omnicanal & triage intelligent.
 *
 * Simule une boîte de réception unifiée : les messages arrivent d'Email, de
 * WhatsApp Business et du formulaire du site, sont classés automatiquement
 * (sentiment, urgence, catégorie), puis soit résolus par l'agent IA, soit
 * escaladés au bon pôle avec un résumé actionnable.
 *
 * TODO: Remplacer par l'abonnement temps réel (WebSocket /api/support/stream →
 * webhook n8n `receipty-support-triage` : classification GPT-4o, recherche
 * dans la base de connaissances, puis rédaction ou routage).
 */

/** Canaux d'arrivée pris en charge. */
export const SUPPORT_CHANNELS = [
  { id: 'email', label: 'Email', address: 'support@receipty-demo.fr' },
  { id: 'whatsapp', label: 'WhatsApp Business', address: '+33 6 19 51 89 63' },
  { id: 'form', label: 'Formulaire web', address: 'receipty-demo.fr/contact' },
];

/** Indicateurs affichés en en-tête de la démo. */
export const SUPPORT_METRICS = {
  firstResponseBefore: '4 h 20',
  firstResponseAfter: '40 s',
  autoResolutionRate: 68,
  ticketsPerMonth: 340,
};

/** Délai d'arrivée de chaque message dans le flux simulé (ms, cumulatif côté UI). */
export const SUPPORT_ARRIVAL_DELAY = 850;

export const SUPPORT_MESSAGES = [
  {
    id: 'msg-1',
    channel: 'whatsapp',
    from: 'Karim Benali',
    company: 'Transports Benali',
    contact: '+33 6 42 18 77 03',
    receivedAt: '09:02',
    subject: 'Plus personne ne peut se connecter',
    body: `Bonjour, depuis ce matin 8h impossible de se connecter au portail. J'ai 12 personnes bloquées qui ne peuvent pas éditer les bons de livraison. On est en pleine tournée, c'est très urgent.`,
    triage: {
      sentiment: 'frustrated',
      urgency: 'critical',
      category: 'Bug technique',
      confidence: 97,
      signals: ['12 utilisateurs impactés', 'Activité opérationnelle bloquée', 'Panne survenue il y a moins de 2 h'],
    },
    action: {
      type: 'escalate',
      reason:
        'Panne de service affectant plusieurs utilisateurs simultanément : hors périmètre de résolution automatique.',
      summary: [
        'Perte d’accès au portail depuis 08:00 pour l’ensemble des 12 comptes du client Transports Benali.',
        'Impact opérationnel immédiat : édition des bons de livraison impossible en pleine tournée.',
      ],
      assignee: { name: 'Valère de Furst', pole: 'Pôle Technique', sla: 'Intervention sous 2 h ouvrées' },
      acknowledgement: `Bonjour Karim,

Je prends en charge votre demande immédiatement. Le blocage touche l'ensemble de vos 12 comptes, je transmets à notre équipe technique en priorité absolue.

Vous êtes recontacté sous 2 heures maximum, et je vous tiens informé dès que nous avons identifié la cause.`,
    },
  },
  {
    id: 'msg-2',
    channel: 'email',
    from: 'Sophie Kieffer',
    company: 'Alsace Négoce Distribution',
    contact: 's.kieffer@alsace-negoce.fr',
    receivedAt: '09:14',
    subject: 'Facture FA-2026-0412 réglée deux fois',
    body: `Bonjour,

Nous venons de constater que la facture FA-2026-0412 a été prélevée deux fois sur notre compte, le 3 et le 5 février, pour 1 240 € à chaque fois.

Pouvez-vous régulariser rapidement ? Nous avons déjà signalé le problème la semaine dernière sans retour.

Cordialement,
Sophie Kieffer`,
    triage: {
      sentiment: 'frustrated',
      urgency: 'normal',
      category: 'Facturation',
      confidence: 94,
      signals: ['Double prélèvement identifié', 'Relance — premier signalement sans réponse', 'Montant : 1 240 €'],
    },
    action: {
      type: 'auto',
      basis: 'Procédure de remboursement pour double prélèvement — Manuel_Support.pdf, section 4.2',
      draft: `Bonjour Madame Kieffer,

Je confirme le double prélèvement de la facture FA-2026-0412 : deux débits de 1 240 € ont bien été enregistrés les 3 et 5 février.

Le remboursement du prélèvement en double est lancé aujourd'hui. Le montant sera recrédité sur votre compte sous 3 à 5 jours ouvrés, et un avoir vous sera adressé par email d'ici demain.

Je suis désolé que votre premier signalement soit resté sans réponse — j'ai remonté ce point en interne.

Bien cordialement,
L'équipe Receipty`,
      followUp: 'Avoir à générer et remboursement à déclencher côté comptabilité.',
    },
  },
  {
    id: 'msg-3',
    channel: 'form',
    from: 'Thomas Régnier',
    company: 'Menuiserie Régnier',
    contact: 't.regnier@menuiserie-regnier.fr',
    receivedAt: '09:31',
    subject: 'Demande d’information — automatisation des devis',
    body: `Bonjour, j'ai vu votre site et je me demande si vous pouvez automatiser la génération de nos devis. Nous en faisons environ 60 par mois, tous à la main sur Word. Quel serait l'ordre de grandeur budgétaire ?`,
    triage: {
      sentiment: 'neutral',
      urgency: 'normal',
      category: 'Demande commerciale',
      confidence: 96,
      signals: ['Volumétrie communiquée : 60 devis/mois', 'Question budgétaire explicite', 'Nouveau contact'],
    },
    action: {
      type: 'auto',
      basis: 'Grille tarifaire publique et créneaux de rendez-vous disponibles',
      draft: `Bonjour Monsieur Régnier,

Merci pour votre message. Générer automatiquement des devis à partir d'un catalogue structuré est exactement le type de projet que nous menons, et 60 devis par mois est un volume où le gain est immédiatement visible.

Pour un périmètre de cette taille, l'ordre de grandeur se situe entre 2 500 et 4 000 € de mise en place, puis un abonnement mensuel de supervision. Le chiffrage précis dépend de la structure de votre catalogue et de l'outil dans lequel vous souhaitez récupérer les devis.

Je vous propose 20 minutes pour cadrer cela : voici mon agenda, choisissez le créneau qui vous convient.

Bien cordialement,
L'équipe Receipty`,
      followUp: 'Lien de prise de rendez-vous inséré automatiquement dans la réponse.',
    },
  },
  {
    id: 'msg-4',
    channel: 'email',
    from: 'Nathalie Wolff',
    company: 'Cabinet Wolff & Associés',
    contact: 'n.wolff@cabinet-wolff.fr',
    receivedAt: '09:47',
    subject: 'Où retrouver mes factures des mois précédents ?',
    body: `Bonjour, je cherche à télécharger nos factures de novembre et décembre pour notre expert-comptable. Je ne les retrouve pas dans mes emails. Merci d'avance.`,
    triage: {
      sentiment: 'neutral',
      urgency: 'low',
      category: 'Facturation',
      confidence: 99,
      signals: ['Demande documentaire simple', 'Réponse disponible dans la base de connaissances'],
    },
    action: {
      type: 'auto',
      basis: 'Guide utilisateur — accès à l’historique de facturation, section 2.1',
      draft: `Bonjour Madame Wolff,

Toutes vos factures sont disponibles à tout moment dans votre espace client, onglet «Facturation» : elles y sont conservées sans limite de durée et téléchargeables au format PDF.

Voici le lien direct vers vos factures de novembre et décembre. Si votre expert-comptable a besoin d'un accès permanent, vous pouvez lui créer un accès en lecture seule depuis la même page.

Bien cordialement,
L'équipe Receipty`,
      followUp: 'Aucune action humaine requise.',
    },
  },
  {
    id: 'msg-5',
    channel: 'whatsapp',
    from: 'Élodie Faure',
    company: 'Faure Logistique',
    contact: '+33 7 81 03 55 29',
    receivedAt: '10:05',
    subject: 'Merci pour la mise en place',
    body: `Bonjour ! Juste un message pour dire que les relances automatiques tournent nickel depuis 3 semaines. On a récupéré 4 factures en retard sans rien faire. Merci à toute l'équipe 👌`,
    triage: {
      sentiment: 'satisfied',
      urgency: 'low',
      category: 'Retour client',
      confidence: 98,
      signals: ['Sentiment positif explicite', 'Résultat chiffré mentionné', 'Candidat au témoignage client'],
    },
    action: {
      type: 'auto',
      basis: 'Séquence de valorisation des retours positifs',
      draft: `Bonjour Élodie,

Merci beaucoup pour ce retour, il fait plaisir à toute l'équipe. Quatre factures récupérées en trois semaines sans intervention, c'est exactement l'effet recherché.

Si vous êtes d'accord pour en dire un mot publiquement, un avis Google nous aiderait beaucoup — et si vous préférez, un témoignage court sur votre cas suffit largement.

Excellente journée,
L'équipe Receipty`,
      followUp: 'Contact ajouté à la liste des références potentielles.',
    },
  },
  {
    id: 'msg-6',
    channel: 'email',
    from: 'Philippe Marchand',
    company: 'Marchand Industries',
    contact: 'p.marchand@marchand-industries.fr',
    receivedAt: '10:22',
    subject: '3e relance — sans réponse, nous résilierons',
    body: `Bonjour,

C'est la troisième fois que j'écris au sujet de l'écart de facturation sur notre contrat annuel. Aucune réponse depuis le 12 janvier.

Si nous n'avons pas de retour d'ici la fin de semaine, nous engagerons la résiliation du contrat et solliciterons un autre prestataire.

Philippe Marchand
Directeur général`,
    triage: {
      sentiment: 'frustrated',
      urgency: 'critical',
      category: 'Litige contractuel',
      confidence: 95,
      signals: [
        'Troisième relance sans réponse',
        'Menace de résiliation explicite',
        'Émetteur : dirigeant de l’entreprise cliente',
      ],
    },
    action: {
      type: 'escalate',
      reason:
        'Risque de perte de compte avec menace de résiliation formulée : décision commerciale hors périmètre de l’agent.',
      summary: [
        'Écart de facturation sur contrat annuel non traité depuis le 12 janvier, malgré trois relances du client.',
        'Le dirigeant annonce engager la résiliation en l’absence de réponse d’ici la fin de semaine.',
      ],
      assignee: { name: 'Quentin Both', pole: 'Pôle Relation Client', sla: 'Rappel téléphonique sous 4 h' },
      acknowledgement: `Bonjour Monsieur Marchand,

Je vous confirme la bonne réception de votre message et je comprends votre agacement : trois relances sans réponse ne sont pas acceptables.

Votre dossier est transmis en priorité à Quentin Both, qui suit personnellement votre contrat. Il vous rappelle dans la journée, sous 4 heures maximum.`,
    },
  },
];

/** Libellés d'affichage du triage. */
export const SENTIMENT_LABELS = {
  frustrated: { label: 'Frustré', tone: 'warning' },
  neutral: { label: 'Neutre', tone: 'neutral' },
  satisfied: { label: 'Satisfait', tone: 'success' },
};

export const URGENCY_LABELS = {
  critical: { label: 'Critique', tone: 'critical' },
  normal: { label: 'Normale', tone: 'info' },
  low: { label: 'Basse', tone: 'neutral' },
};
