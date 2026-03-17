import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../context/LanguageContext';

const SITE_URL = 'https://receipty.fr';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const SEO_DATA = {
  home: {
    fr: {
      title: "Receipty | Agence IA Strasbourg — Automatisation & Intelligence Artificielle",
      description: "Receipty, agence IA basée à Strasbourg (Alsace), automatise vos processus métier. Solutions ML sur mesure, automatisation des workflows et ROI mesurable dès le premier mois.",
      keywords: "agence IA Strasbourg, agence intelligence artificielle Strasbourg, automatisation entreprise Strasbourg, agence IA Alsace, agence IA Grand Est, machine learning Strasbourg, intégration IA, transformation digitale Alsace, agence IA France",
    },
    en: {
      title: "Receipty | AI Agency Strasbourg — Business Automation & Artificial Intelligence",
      description: "Receipty, AI agency based in Strasbourg (Alsace, France), automates your business processes. Custom ML solutions, workflow automation and measurable ROI from the first month.",
      keywords: "AI agency Strasbourg, artificial intelligence agency Alsace, business automation Strasbourg, machine learning Strasbourg, AI integration France, digital transformation Grand Est",
    },
    path: '/',
  },
  adn: {
    fr: {
      title: "ADN & Vision — Qui sommes-nous | Receipty Agence IA Strasbourg",
      description: "Découvrez l'ADN de Receipty : notre équipe d'experts en IA basée à Strasbourg qui transforme vos défis business en systèmes automatisés performants.",
      keywords: "équipe Receipty, agence IA Strasbourg, experts intelligence artificielle Alsace, Data Science Strasbourg, transformation digitale Grand Est",
    },
    en: {
      title: "DNA & Vision — Who We Are | Receipty AI Agency Strasbourg",
      description: "Discover Receipty's DNA: our AI expert team based in Strasbourg turning your business challenges into high-performance automated systems.",
      keywords: "Receipty team, AI agency Strasbourg, artificial intelligence experts Alsace, Data Science, digital transformation Grand Est",
    },
    path: '/adn',
  },
  solutions: {
    fr: {
      title: "Solutions IA Strasbourg — Talent, Spend & Web-on-Demand | Receipty",
      description: "Receipty Talent pour le recrutement IA, Receipty Spend pour la finance intelligente, Web-on-Demand pour vos plateformes web. Trois solutions IA à Strasbourg pour automatiser votre entreprise.",
      keywords: "Receipty Talent, Receipty Spend, Web-on-Demand, automatisation RH Strasbourg, gestion financière IA Alsace, développement web IA Strasbourg",
    },
    en: {
      title: "AI Solutions Strasbourg — Talent, Spend & Web-on-Demand | Receipty",
      description: "Receipty Talent for AI recruitment, Receipty Spend for intelligent finance, Web-on-Demand for web platforms. Three AI solutions in Strasbourg to automate your business.",
      keywords: "Receipty Talent, Receipty Spend, Web-on-Demand, HR automation Strasbourg, AI financial management Alsace, AI web development Strasbourg",
    },
    path: '/solutions',
  },
  cases: {
    fr: {
      title: "Études de Cas — Résultats Clients IA | Receipty Strasbourg",
      description: "Découvrez comment Receipty (Strasbourg) a transformé des entreprises grâce à l'IA : gains de temps, réduction des coûts et automatisation mesurable pour nos clients.",
      keywords: "études de cas IA Strasbourg, résultats automatisation Alsace, ROI intelligence artificielle, projets IA Grand Est",
    },
    en: {
      title: "Case Studies — AI Client Results | Receipty Strasbourg",
      description: "Discover how Receipty (Strasbourg) has transformed businesses with AI: time savings, cost reductions and measurable automation for our clients.",
      keywords: "AI case studies Strasbourg, automation results Alsace, artificial intelligence ROI Grand Est, completed AI projects France",
    },
    path: '/cases',
  },
  contact: {
    fr: {
      title: "Contactez Receipty à Strasbourg — Diagnostic IA Gratuit",
      description: "Contactez notre agence IA à Strasbourg. Diagnostic gratuit sous 24h pour automatiser vos processus métier. Rendez-vous en présentiel ou visio.",
      keywords: "contact agence IA Strasbourg, diagnostic IA gratuit Alsace, consultation intelligence artificielle Strasbourg, automatisation entreprise Bas-Rhin",
    },
    en: {
      title: "Contact Receipty in Strasbourg — Free AI Audit",
      description: "Contact our AI agency in Strasbourg. Free AI audit within 24h to automate your business processes. In-person or online meeting.",
      keywords: "contact AI agency Strasbourg, free AI audit Alsace, artificial intelligence consultation Strasbourg, business automation Bas-Rhin",
    },
    path: '/contact',
  },
  roi: {
    fr: {
      title: "Calculateur ROI IA — Estimez vos Gains | Receipty Strasbourg",
      description: "Calculez le retour sur investissement de l'automatisation IA pour votre entreprise. Estimation personnalisée en 2 minutes — agence IA Receipty, Strasbourg.",
      keywords: "calculateur ROI IA Strasbourg, retour investissement intelligence artificielle, estimation automatisation Alsace, gains IA entreprise Grand Est",
    },
    en: {
      title: "AI ROI Calculator — Estimate Your Gains | Receipty Strasbourg",
      description: "Calculate the return on investment of AI automation for your business. Personalized estimate in 2 minutes — Receipty AI agency, Strasbourg.",
      keywords: "AI ROI calculator Strasbourg, artificial intelligence investment return Alsace, automation estimate Grand Est, business AI gains France",
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

  const title = customTitle || localData.title || "Receipty | Agence IA Strasbourg";
  const description = customDescription || localData.description || "Receipty — Agence IA basée à Strasbourg, Alsace";
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

      {/* hreflang */}
      <link rel="alternate" hrefLang="fr" href={`${SITE_URL}${path}`} />
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${path}`} />
    </Helmet>
  );
}

// JSON-LD helpers

/**
 * LocalBusiness schema — critical pour le SEO local "Agence IA Strasbourg"
 * Remplace l'ancien OrganizationSchema générique
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "ProfessionalService"],
    "name": "Receipty",
    "legalName": "Receipty Agency",
    "url": SITE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/favicon.png`,
      "width": 512,
      "height": 512
    },
    "image": `${SITE_URL}/og-image.png`,
    "description": "Agence IA basée à Strasbourg spécialisée dans l'automatisation des processus métier, l'intégration de l'intelligence artificielle et le machine learning sur mesure.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "91 Route des Romains",
      "postalCode": "67000",
      "addressLocality": "Strasbourg",
      "addressRegion": "Alsace",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 48.5850,
      "longitude": 7.7341
    },
    "telephone": "+33388000000",
    "email": "contact@receipty.fr",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "areaServed": [
      { "@type": "City", "name": "Strasbourg" },
      { "@type": "AdministrativeArea", "name": "Alsace" },
      { "@type": "AdministrativeArea", "name": "Grand Est" },
      { "@type": "Country", "name": "France" }
    ],
    "knowsAbout": [
      "Intelligence Artificielle",
      "Automatisation des processus",
      "Machine Learning",
      "Intégration IA",
      "Transformation digitale",
      "Recrutement IA",
      "Finance intelligente"
    ],
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
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["French", "English"],
      "url": `${SITE_URL}/contact`
    },
    "sameAs": [
      "https://www.google.com/maps/search/Receipty+Strasbourg",
      "https://www.linkedin.com/company/receipty"
    ],
    "priceRange": "€€"
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
    "name": "Agence IA Strasbourg — Receipty",
    "description": "Services d'intégration IA et d'automatisation des processus métier pour les entreprises en Alsace et dans le Grand Est.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Receipty",
      "url": SITE_URL,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "91 Route des Romains",
        "postalCode": "67000",
        "addressLocality": "Strasbourg",
        "addressCountry": "FR"
      }
    },
    "areaServed": [
      { "@type": "City", "name": "Strasbourg" },
      { "@type": "AdministrativeArea", "name": "Alsace" },
      { "@type": "AdministrativeArea", "name": "Grand Est" }
    ],
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
      "name": "Receipty",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Strasbourg",
        "addressCountry": "FR"
      }
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
