import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../context/LanguageContext';

const SITE_URL = 'https://receipty.fr';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const SEO_DATA = {
  home: {
    fr: {
      title: "Receipty | Agence IA — Automatisation & Intégration Intelligence Artificielle",
      description: "Receipty est l'agence IA qui automatise vos processus métier. Solutions ML sur mesure, automatisation des workflows et ROI mesurable dès le premier mois.",
      keywords: "agence IA, intelligence artificielle, automatisation, machine learning, intégration IA, workflows intelligents, transformation digitale",
    },
    en: {
      title: "Receipty | AI Agency — Business Automation & Artificial Intelligence",
      description: "Receipty is the AI agency that automates your business processes. Custom ML solutions, workflow automation and measurable ROI from the first month.",
      keywords: "AI agency, artificial intelligence, automation, machine learning, AI integration, intelligent workflows, digital transformation",
    },
    path: '/',
  },
  adn: {
    fr: {
      title: "ADN & Vision — Qui sommes-nous | Receipty Agence IA",
      description: "Découvrez l'ADN de Receipty : notre équipe d'experts en IA et International Business qui transforme vos défis business en systèmes automatisés performants.",
      keywords: "équipe Receipty, agence IA Paris, experts intelligence artificielle, Data Science, transformation digitale",
    },
    en: {
      title: "DNA & Vision — Who We Are | Receipty AI Agency",
      description: "Discover Receipty's DNA: our team of AI and International Business experts who turn your business challenges into high-performance automated systems.",
      keywords: "Receipty team, AI agency, artificial intelligence experts, Data Science, digital transformation",
    },
    path: '/adn',
  },
  solutions: {
    fr: {
      title: "Solutions IA — Talent, Spend & Web-on-Demand | Receipty",
      description: "Receipty Talent pour le recrutement IA, Receipty Spend pour la finance intelligente, Web-on-Demand pour vos plateformes web. Trois solutions pour automatiser votre entreprise.",
      keywords: "Receipty Talent, Receipty Spend, Web-on-Demand, automatisation RH, gestion financière IA, développement web IA",
    },
    en: {
      title: "AI Solutions — Talent, Spend & Web-on-Demand | Receipty",
      description: "Receipty Talent for AI recruitment, Receipty Spend for intelligent finance, Web-on-Demand for web platforms. Three solutions to automate your business.",
      keywords: "Receipty Talent, Receipty Spend, Web-on-Demand, HR automation, AI financial management, AI web development",
    },
    path: '/solutions',
  },
  cases: {
    fr: {
      title: "Études de Cas — Résultats Clients IA | Receipty",
      description: "Découvrez comment Receipty a transformé des entreprises grâce à l'IA : gains de temps, réduction des coûts et automatisation mesurable pour nos clients.",
      keywords: "études de cas IA, résultats automatisation, ROI intelligence artificielle, projets IA réalisés",
    },
    en: {
      title: "Case Studies — AI Client Results | Receipty",
      description: "Discover how Receipty has transformed businesses with AI: time savings, cost reductions and measurable automation results for our clients.",
      keywords: "AI case studies, automation results, artificial intelligence ROI, completed AI projects",
    },
    path: '/cases',
  },
  contact: {
    fr: {
      title: "Contactez-nous — Diagnostic IA Gratuit | Receipty",
      description: "Lancez votre diagnostic IA avec Receipty. Réponse sous 24h pour discuter de l'automatisation de vos processus métier. Consultation gratuite.",
      keywords: "contact agence IA, diagnostic IA gratuit, consultation intelligence artificielle, automatisation entreprise",
    },
    en: {
      title: "Contact Us — Free AI Audit | Receipty",
      description: "Start your AI audit with Receipty. Response within 24h to discuss automating your business processes. Free consultation.",
      keywords: "contact AI agency, free AI audit, artificial intelligence consultation, business automation",
    },
    path: '/contact',
  },
  roi: {
    fr: {
      title: "Calculateur ROI IA — Estimez vos Gains | Receipty",
      description: "Calculez le retour sur investissement de l'automatisation IA pour votre entreprise. Estimation personnalisée en 2 minutes avec le calculateur ROI Receipty.",
      keywords: "calculateur ROI IA, retour investissement intelligence artificielle, estimation automatisation, gains IA entreprise",
    },
    en: {
      title: "AI ROI Calculator — Estimate Your Gains | Receipty",
      description: "Calculate the return on investment of AI automation for your business. Personalized estimate in 2 minutes with the Receipty ROI calculator.",
      keywords: "AI ROI calculator, artificial intelligence investment return, automation estimate, business AI gains",
    },
    path: '/roi',
  },
  privacy: {
    fr: {
      title: "Politique de Confidentialité | Receipty",
      description: "Politique de confidentialité de Receipty — comment nous collectons, utilisons et protégeons vos données personnelles.",
      keywords: "politique confidentialité, RGPD, données personnelles, Receipty",
    },
    en: {
      title: "Privacy Policy | Receipty",
      description: "Receipty's privacy policy — how we collect, use and protect your personal data.",
      keywords: "privacy policy, GDPR, personal data, Receipty",
    },
    path: '/privacy',
  },
  terms: {
    fr: {
      title: "Conditions Générales d'Utilisation | Receipty",
      description: "Conditions générales d'utilisation et de vente de Receipty — droits, obligations et modalités de nos services IA.",
      keywords: "CGU, conditions générales, mentions légales, Receipty",
    },
    en: {
      title: "Terms of Service | Receipty",
      description: "Receipty terms of service and sale — rights, obligations and modalities of our AI services.",
      keywords: "terms of service, terms and conditions, legal notices, Receipty",
    },
    path: '/terms',
  },
};

export default function SEOHead({ page, customTitle, customDescription, customImage, canonicalPath, noIndex = false }) {
  const { lang } = useLanguage();
  const data = SEO_DATA[page];
  const localData = data?.[lang] || data?.fr || {};

  const title = customTitle || localData.title || "Receipty | Agence d'IA";
  const description = customDescription || localData.description || "Receipty — Agence d'intégration IA";
  const keywords = localData.keywords || '';
  const image = customImage || DEFAULT_OG_IMAGE;
  const path = canonicalPath || data?.path || '/';
  const canonicalUrl = `${SITE_URL}${path}`;
  const altLang = lang === 'fr' ? 'en' : 'fr';
  const altUrl = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Receipty" />
      <meta property="og:locale" content={lang === 'fr' ? 'fr_FR' : 'en_US'} />
      <meta property="og:locale:alternate" content={lang === 'fr' ? 'en_US' : 'fr_FR'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Note: pas de hreflang fr/en distincts — le site sert la même URL pour
          les deux langues (bascule côté client). Des balises hreflang pointant
          vers une URL identique sont trompeuses pour Google, on ne les met donc
          pas. À réintroduire le jour où des routes localisées (/en/...) existent. */}
    </Helmet>
  );
}

// JSON-LD helpers
// ── Coordonnées de référence (NAP) — source unique pour les schémas ──────────
const ORG_PHONE = "+33619518963";        // 06 19 51 89 63
const ORG_EMAIL = "contact@receipty.fr";
// Renseignez ici vos profils publics (LinkedIn, X, etc.) — améliore le GEO/E-E-A-T.
const ORG_SAME_AS = [];

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    "name": "Receipty",
    "legalName": "Receipty Agency",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.png`,
    "image": DEFAULT_OG_IMAGE,
    "description": "Agence d'intégration IA spécialisée dans l'automatisation des processus métier : recrutement, finance et développement web sur mesure.",
    "email": ORG_EMAIL,
    "telephone": ORG_PHONE,
    "priceRange": "€€",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR"
    },
    "areaServed": {
      "@type": "Country",
      "name": "France"
    },
    "founder": [
      { "@type": "Person", "name": "Quentin Both", "jobTitle": "Co-CEO & Expert IA" },
      { "@type": "Person", "name": "Valère de Furst", "jobTitle": "Co-CEO & Stratégiste Business" }
    ],
    "knowsAbout": [
      "Intelligence artificielle", "Automatisation des processus", "Machine Learning",
      "Automatisation RH", "Gestion financière IA", "Développement web IA"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "telephone": ORG_PHONE,
      "email": ORG_EMAIL,
      "availableLanguage": ["fr", "en"],
      "url": `${SITE_URL}/contact`
    },
    "sameAs": ORG_SAME_AS
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function ServiceSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Intelligence Artificielle & Automatisation",
    "provider": {
      "@type": "Organization",
      "name": "Receipty",
      "url": SITE_URL
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Solutions IA Receipty",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Receipty Talent",
            "description": "Automatisation du recrutement et matching IA de candidats"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Receipty Spend",
            "description": "Gestion financière intelligente et détection d'anomalies"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Web-on-Demand",
            "description": "Développement web sur mesure avec intégration IA"
          }
        }
      ]
    }
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function FAQSchema({ faqs }) {
  if (!faqs || faqs.length === 0) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function BreadcrumbSchema({ items }) {
  if (!items || items.length === 0) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function CaseStudySchema({ title, description, url }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": url,
    "author": {
      "@type": "Organization",
      "name": "Receipty"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Receipty",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/favicon.png`
      }
    }
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
