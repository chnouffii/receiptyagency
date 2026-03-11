export const translations = {
  fr: {
    nav: {
      home: 'Accueil',
      adn: 'ADN & Vision',
      solutions: 'Solutions',
      cases: 'Études de Cas',
      contact: 'Contact',
      admin: 'Admin'
    },
    hero: {
      title: 'Nous automatisons votre entreprise.',
      subtitle: "L'agence d'intégration IA qui transforme vos processus métier en systèmes intelligents.",
      cta: 'Lancer mon diagnostic IA',
      trusted: 'Entreprises qui nous font confiance'
    },
    features: {
      ai: { title: 'Intelligence Artificielle', desc: 'Modèles ML sur mesure pour vos besoins' },
      auto: { title: 'Automatisation', desc: 'Workflows intelligents et optimisés' },
      perf: { title: 'Performance', desc: 'ROI mesurable dès le premier mois' }
    },
    adn: {
      title: 'ADN & Vision',
      subtitle: 'Notre expertise en International Business et Data Science au service de votre transformation digitale.',
      manifesto: "Nous croyons que l'intelligence artificielle n'est pas un luxe, c'est une nécessité compétitive. Chaque processus métier peut être optimisé, chaque décision peut être éclairée par les données.",
      team: 'Notre Équipe',
      stats: {
        projects: 'Projets Livrés',
        hours: 'Heures Économisées',
        automation: "Taux d'Automatisation"
      },
      members: [
        { name: 'BOTH Quentin', role: 'Co-CEO & Expert IA', desc: 'Entrepreneur visionnaire spécialisé en intelligence artificielle. Expert en déploiement de solutions ML/Deep Learning à grande échelle, il pilote la stratégie technologique et l\'innovation produit. Certifié en Data Science et architectures cloud, il transforme les défis business complexes en systèmes automatisés performants.' },
        { name: 'DE FURST Valère', role: 'Co-CEO & Stratégiste Business', desc: 'Entrepreneur aguerri avec une expertise pointue en International Business et développement stratégique. Diplômé en commerce international, il orchestre les partenariats clés, le développement commercial et la croissance de l\'agence. Sa vision globale et son sens aigu du marché garantissent des solutions alignées sur les enjeux réels des entreprises.' }
      ]
    },
    solutions: {
      title: 'Solutions Verticales',
      subtitle: 'Trois piliers technologiques pour transformer votre organisation.',
      talent: {
        name: 'Receipty Talent',
        tag: 'RH & Recrutement',
        desc: 'Automatisez votre processus de recrutement, de la sélection des CV à l\'onboarding.',
        features: ['Screening automatisé', 'Matching IA candidats', 'Onboarding digital', 'Analytics RH']
      },
      spend: {
        name: 'Receipty Spend',
        tag: 'Finance & Dépenses',
        desc: 'Optimisez vos dépenses avec notre plateforme de gestion financière intelligente.',
        features: ['Détection anomalies', 'Prévisions budgétaires', 'Reporting automatisé', 'Conformité']
      },
      web: {
        name: 'Web-on-Demand',
        tag: 'Développement Web',
        desc: 'Créez des plateformes web performantes avec notre solution modulaire.',
        features: ['Sites sur mesure', 'E-commerce IA', 'SEO automatisé', 'Analytics avancés']
      }
    },
    quote: {
      title: 'Devis Instantané',
      subtitle: 'Configurez votre solution en quelques clics.',
      steps: ['Catégorie', 'Échelle', 'Fonctionnalités', 'Votre Devis'],
      category_label: 'Sélectionnez votre besoin',
      scale_label: 'Taille de votre entreprise',
      employees: 'employés',
      features_label: 'Fonctionnalités souhaitées',
      contact: 'Vos coordonnées',
      name: 'Nom complet',
      email: 'Email professionnel',
      company: 'Entreprise',
      phone: 'Téléphone',
      setup_fee: 'Frais de mise en place',
      monthly_fee: 'Abonnement mensuel',
      submit: 'Envoyer ma demande',
      next: 'Suivant',
      prev: 'Précédent',
      success: 'Demande envoyée avec succès !',
      success_desc: 'Notre équipe vous contactera sous 24h.',
      your_estimate: 'Votre estimation'
    },
    cases: {
      title: 'Études de Cas',
      subtitle: 'Découvrez comment nous avons transformé nos clients.',
      read_more: 'Voir le cas',
      items: [
        {
          title: 'Automatisation RH chez GlobalTech',
          category: 'Receipty Talent',
          roi: '+340% efficacité',
          desc: 'Réduction de 75% du temps de recrutement pour une entreprise de 2000 employés.',
          tags: ['RH', 'IA', 'Automatisation']
        },
        {
          title: 'Optimisation financière BioPharm',
          category: 'Receipty Spend',
          roi: '-45% coûts',
          desc: 'Détection d\'anomalies financières et optimisation des dépenses opérationnelles.',
          tags: ['Finance', 'Analytics', 'Compliance']
        },
        {
          title: 'Plateforme E-commerce NeoRetail',
          category: 'Web-on-Demand',
          roi: '+280% conversion',
          desc: 'Création d\'une plateforme e-commerce avec recommandations IA personnalisées.',
          tags: ['E-commerce', 'UX', 'IA']
        },
        {
          title: 'Pipeline de recrutement MedStaff',
          category: 'Receipty Talent',
          roi: '85% automatisé',
          desc: 'Automatisation complète du pipeline de recrutement médical avec matching IA.',
          tags: ['Santé', 'RH', 'Pipeline']
        },
        {
          title: 'Dashboard financier InvestCorp',
          category: 'Receipty Spend',
          roi: '+200% productivité',
          desc: 'Dashboard temps réel avec prédictions budgétaires et alertes automatisées.',
          tags: ['Dashboard', 'Prédiction', 'Finance']
        }
      ]
    },
    admin: {
      login_title: 'Espace Administration',
      login_subtitle: 'Connectez-vous pour gérer les leads.',
      email: 'Email',
      password: 'Mot de passe',
      login: 'Se connecter',
      dashboard: 'Tableau de bord',
      leads: 'Leads',
      logout: 'Déconnexion',
      total: 'Total Leads',
      new_label: 'Nouveaux',
      contacted: 'Contactés',
      qualified: 'Qualifiés',
      converted: 'Convertis',
      revenue: 'Revenue Setup',
      monthly_rev: 'Revenue Mensuel',
      status: 'Statut',
      actions: 'Actions',
      no_leads: 'Aucun lead pour le moment.'
    },
    contact: {
      title: 'Contactez-nous',
      subtitle: 'Une question ? Un projet ? Notre équipe est à votre écoute pour transformer vos idées en solutions IA performantes.',
      form_title: 'Envoyez-nous un message',
      name: 'Nom complet',
      name_placeholder: 'Jean Dupont',
      email: 'Email',
      email_placeholder: 'jean@entreprise.com',
      phone: 'Téléphone',
      subject: 'Sujet',
      subject_placeholder: 'Demande de renseignements',
      message: 'Message',
      message_placeholder: 'Décrivez votre projet ou votre question...',
      send: 'Envoyer le message',
      success: 'Message envoyé avec succès !',
      success_desc: 'Notre équipe vous répondra sous 24h ouvrées.',
      info_title: 'Nos coordonnées',
      phone_label: 'Téléphone',
      email_label: 'Email',
      address_label: 'Adresse',
      hours_label: 'Horaires',
      urgent_title: 'Besoin Urgent ?',
      urgent_desc: 'Pour les demandes urgentes, notre équipe peut intervenir sous 24-48h. Contactez-nous directement.',
      call_now: 'Appeler maintenant',
      urgent_email: 'Email urgent',
      response_time: 'Temps de réponse moyen : moins de 24h'
    },
    faq: {
      title: 'Questions Fréquentes',
      subtitle: 'Tout ce que vous devez savoir sur nos services.',
      no_questions: 'Aucune question pour le moment.',
    },
    footer: {
      tagline: "L'agence d'intégration IA qui fait la différence.",
      rights: 'Tous droits réservés.',
      privacy: 'Politique de confidentialité',
      terms: "Conditions d'utilisation"
    }
  },
  en: {
    nav: {
      home: 'Home',
      adn: 'DNA & Vision',
      solutions: 'Solutions',
      cases: 'Case Studies',
      contact: 'Contact',
      admin: 'Admin'
    },
    hero: {
      title: 'We automate your business.',
      subtitle: 'The AI integration agency that transforms your business processes into intelligent systems.',
      cta: 'Start my AI diagnostic',
      trusted: 'Companies that trust us'
    },
    features: {
      ai: { title: 'Artificial Intelligence', desc: 'Custom ML models for your needs' },
      auto: { title: 'Automation', desc: 'Smart and optimized workflows' },
      perf: { title: 'Performance', desc: 'Measurable ROI from day one' }
    },
    adn: {
      title: 'DNA & Vision',
      subtitle: 'Our expertise in International Business and Data Science at the service of your digital transformation.',
      manifesto: 'We believe artificial intelligence is not a luxury, it\'s a competitive necessity. Every business process can be optimized, every decision can be informed by data.',
      team: 'Our Team',
      stats: {
        projects: 'Projects Delivered',
        hours: 'Hours Saved',
        automation: 'Automation Rate'
      },
      members: [
        { name: 'BOTH Quentin', role: 'Co-CEO & AI Expert', desc: 'Visionary entrepreneur specialized in artificial intelligence. Expert in deploying ML/Deep Learning solutions at scale, he drives the technological strategy and product innovation. Certified in Data Science and cloud architectures, he transforms complex business challenges into high-performance automated systems.' },
        { name: 'DE FURST Valere', role: 'Co-CEO & Business Strategist', desc: 'Seasoned entrepreneur with sharp expertise in International Business and strategic development. Graduate in international commerce, he orchestrates key partnerships, business development and agency growth. His global vision and keen market sense ensure solutions aligned with real business challenges.' }
      ]
    },
    solutions: {
      title: 'Vertical Solutions',
      subtitle: 'Three technological pillars to transform your organization.',
      talent: {
        name: 'Receipty Talent',
        tag: 'HR & Recruitment',
        desc: 'Automate your recruitment process, from CV screening to onboarding.',
        features: ['Automated screening', 'AI candidate matching', 'Digital onboarding', 'HR Analytics']
      },
      spend: {
        name: 'Receipty Spend',
        tag: 'Finance & Expenses',
        desc: 'Optimize your expenses with our intelligent financial management platform.',
        features: ['Anomaly detection', 'Budget forecasting', 'Automated reporting', 'Compliance']
      },
      web: {
        name: 'Web-on-Demand',
        tag: 'Web Development',
        desc: 'Build high-performance web platforms with our modular solution.',
        features: ['Custom sites', 'AI E-commerce', 'Automated SEO', 'Advanced analytics']
      }
    },
    quote: {
      title: 'Instant Quote',
      subtitle: 'Configure your solution in a few clicks.',
      steps: ['Category', 'Scale', 'Features', 'Your Quote'],
      category_label: 'Select your need',
      scale_label: 'Company size',
      employees: 'employees',
      features_label: 'Desired features',
      contact: 'Your contact info',
      name: 'Full name',
      email: 'Professional email',
      company: 'Company',
      phone: 'Phone',
      setup_fee: 'Setup fee',
      monthly_fee: 'Monthly subscription',
      submit: 'Submit my request',
      next: 'Next',
      prev: 'Previous',
      success: 'Request sent successfully!',
      success_desc: 'Our team will contact you within 24h.',
      your_estimate: 'Your estimate'
    },
    cases: {
      title: 'Case Studies',
      subtitle: 'Discover how we transformed our clients.',
      read_more: 'View case',
      items: [
        {
          title: 'HR Automation at GlobalTech',
          category: 'Receipty Talent',
          roi: '+340% efficiency',
          desc: '75% reduction in recruitment time for a 2000+ employee company.',
          tags: ['HR', 'AI', 'Automation']
        },
        {
          title: 'Financial Optimization at BioPharm',
          category: 'Receipty Spend',
          roi: '-45% costs',
          desc: 'Financial anomaly detection and operational expense optimization.',
          tags: ['Finance', 'Analytics', 'Compliance']
        },
        {
          title: 'E-commerce Platform NeoRetail',
          category: 'Web-on-Demand',
          roi: '+280% conversion',
          desc: 'AI-powered e-commerce platform with personalized recommendations.',
          tags: ['E-commerce', 'UX', 'AI']
        },
        {
          title: 'Recruitment Pipeline MedStaff',
          category: 'Receipty Talent',
          roi: '85% automated',
          desc: 'Full automation of the medical recruitment pipeline with AI matching.',
          tags: ['Healthcare', 'HR', 'Pipeline']
        },
        {
          title: 'Financial Dashboard InvestCorp',
          category: 'Receipty Spend',
          roi: '+200% productivity',
          desc: 'Real-time dashboard with budget predictions and automated alerts.',
          tags: ['Dashboard', 'Prediction', 'Finance']
        }
      ]
    },
    admin: {
      login_title: 'Admin Area',
      login_subtitle: 'Sign in to manage leads.',
      email: 'Email',
      password: 'Password',
      login: 'Sign in',
      dashboard: 'Dashboard',
      leads: 'Leads',
      logout: 'Logout',
      total: 'Total Leads',
      new_label: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      converted: 'Converted',
      revenue: 'Setup Revenue',
      monthly_rev: 'Monthly Revenue',
      status: 'Status',
      actions: 'Actions',
      no_leads: 'No leads yet.'
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'A question? A project? Our team is here to transform your ideas into high-performance AI solutions.',
      form_title: 'Send us a message',
      name: 'Full name',
      name_placeholder: 'John Smith',
      email: 'Email',
      email_placeholder: 'john@company.com',
      phone: 'Phone',
      subject: 'Subject',
      subject_placeholder: 'Information request',
      message: 'Message',
      message_placeholder: 'Describe your project or question...',
      send: 'Send message',
      success: 'Message sent successfully!',
      success_desc: 'Our team will respond within 24 business hours.',
      info_title: 'Contact Information',
      phone_label: 'Phone',
      email_label: 'Email',
      address_label: 'Address',
      hours_label: 'Hours',
      urgent_title: 'Urgent Need?',
      urgent_desc: 'For urgent requests, our team can intervene within 24-48h. Contact us directly.',
      call_now: 'Call now',
      urgent_email: 'Urgent email',
      response_time: 'Average response time: less than 24h'
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about our services.',
      no_questions: 'No questions yet.',
    },
    footer: {
      tagline: 'The AI integration agency that makes the difference.',
      rights: 'All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    }
  }
};
