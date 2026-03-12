import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Building2, Scale, Shield, AlertTriangle, Gavel } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import SEOHead from '../components/SEOHead';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TermsPage() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    axios.get(`${API}/site-content`).then(res => {
      setSiteContent(res.data);
    }).catch(() => {});
  }, []);

  const company = siteContent?.company || {
    name: 'Receipty Agency',
    legal_form: 'SARL en cours de formation',
    capital: 'En cours de constitution',
    ceo1_name: 'BOTH Quentin',
    ceo1_role_fr: 'Co-CEO',
    ceo2_name: 'DE FURST Valère',
    ceo2_role_fr: 'Co-CEO',
    legal_email: 'juridique@receipty.ai'
  };
  const contact = siteContent?.contact || {
    phone: '+33 3 88 00 00 00',
    email: 'contact@receipty.ai',
    address_line1: '1 Place de la Gare',
    address_line2: '67000 Strasbourg, France'
  };
  const terms = siteContent?.terms || {
    last_update_fr: 'Février 2026',
    last_update_en: 'February 2026'
  };

  const content = {
    fr: {
      title: "Conditions Générales d'Utilisation",
      lastUpdate: `Dernière mise à jour : ${terms.last_update_fr}`,
      intro: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site web receipty.ai ainsi que les services proposés par ${company.name}.`,
      sections: [
        {
          icon: Building2,
          title: '1. Mentions légales',
          content: `**Éditeur du site :**
${company.name}
${company.legal_form}
Capital social : ${company.capital}

**Siège social :**
${contact.address_line1}
${contact.address_line2}

**Co-gérants :**
• ${company.ceo1_name} - ${company.ceo1_role_fr}
• ${company.ceo2_name} - ${company.ceo2_role_fr}

**Contact :**
Email : ${contact.email}
Téléphone : ${contact.phone}

**Hébergement :**
Le site est hébergé sur des serveurs sécurisés au sein de l'Union Européenne.`
        },
        {
          icon: FileText,
          title: '2. Objet et acceptation',
          content: `Les présentes CGU ont pour objet de définir les conditions d'accès et d'utilisation du site receipty.ai.

**Acceptation des CGU :**
L'accès et l'utilisation du site impliquent l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre site.

**Modification des CGU :**
${company.name} se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur le site. Il est recommandé de consulter régulièrement cette page.`
        },
        {
          icon: Scale,
          title: '3. Services proposés',
          content: `Receipty Agency propose des services d'intégration d'intelligence artificielle pour les entreprises :

**Nos solutions :**
• **Receipty Talent** : Automatisation des processus RH et recrutement
• **Receipty Spend** : Gestion et optimisation des dépenses
• **Web-on-Demand** : Développement de plateformes web sur mesure

**Audits et diagnostics IA :**
Les audits et diagnostics réalisés par Receipty Agency sont fournis à titre informatif et de conseil. Ils constituent une analyse basée sur les informations fournies par le client et ne garantissent pas des résultats spécifiques.

**Limitation :**
Les estimations de ROI et de performance présentées sur le site sont basées sur des études de cas réels mais peuvent varier selon le contexte de chaque entreprise.`
        },
        {
          icon: Shield,
          title: '4. Propriété intellectuelle',
          content: `**Contenu du site :**
L'ensemble du contenu présent sur le site receipty.ai (textes, graphiques, logos, images, vidéos, structure, base de données) est la propriété exclusive de Receipty Agency ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.

**Marques :**
Les marques "Receipty", "Receipty Agency", "Receipty Talent", "Receipty Spend" et "Web-on-Demand" sont des marques déposées ou en cours de dépôt de Receipty Agency.

**Interdictions :**
Toute reproduction, représentation, modification, publication, transmission, dénaturation, totale ou partielle du site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce soit est interdite sans autorisation préalable écrite de Receipty Agency.

**Utilisation autorisée :**
Une utilisation du contenu à des fins personnelles et non commerciales est tolérée sous réserve du respect des droits de propriété intellectuelle.`
        },
        {
          icon: AlertTriangle,
          title: '5. Responsabilité',
          content: `**Limitation de responsabilité :**
${company.name} s'efforce de fournir des informations exactes et à jour sur son site. Toutefois, nous ne pouvons garantir l'exactitude, la complétude ou l'actualité des informations diffusées.

**Exclusions :**
${company.name} décline toute responsabilité pour :
• Les dommages directs ou indirects résultant de l'utilisation du site
• Les interruptions temporaires du site pour maintenance
• La présence de virus ou d'éléments nuisibles sur le site (bien que nous prenions toutes les précautions nécessaires)
• Les contenus de sites tiers accessibles via des liens hypertextes

**Responsabilité du client :**
Le client reste seul responsable de l'utilisation qu'il fait des services et conseils fournis par ${company.name}. La mise en œuvre des recommandations relève de la décision et de la responsabilité du client.`
        },
        {
          icon: Gavel,
          title: '6. Droit applicable et litiges',
          content: `**Droit applicable :**
Les présentes CGU sont régies par le droit français.

**Résolution des litiges :**
En cas de litige relatif à l'interprétation ou l'exécution des présentes CGU, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.

**Juridiction compétente :**
À défaut de résolution amiable, tout litige sera soumis aux tribunaux compétents de Strasbourg, France.

**Médiation :**
Conformément aux articles L.616-1 et R.616-1 du code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige.

**Contact pour les litiges :**
${company.legal_email}`
        }
      ]
    },
    en: {
      title: 'Terms of Service',
      lastUpdate: `Last updated: ${terms.last_update_en}`,
      intro: `These Terms of Service govern access to and use of the receipty.ai website and services offered by ${company.name}.`,
      sections: [
        {
          icon: Building2,
          title: '1. Legal Notice',
          content: `**Website Publisher:**
${company.name}
${company.legal_form}
Share capital: ${company.capital}

**Registered Office:**
${contact.address_line1}
${contact.address_line2}

**Co-managers:**
• ${company.ceo1_name} - ${company.ceo1_role_en || 'Co-CEO'}
• ${company.ceo2_name} - ${company.ceo2_role_en || 'Co-CEO'}

**Contact:**
Email: ${contact.email}
Phone: ${contact.phone}

**Hosting:**
The website is hosted on secure servers within the European Union.`
        },
        {
          icon: FileText,
          title: '2. Purpose and Acceptance',
          content: `These Terms of Service define the conditions of access and use of the receipty.ai website.

**Acceptance of Terms:**
Access to and use of the site implies full acceptance of these Terms of Service. If you do not accept these conditions, please do not use our site.

**Modification of Terms:**
${company.name} reserves the right to modify these Terms at any time. Modifications take effect upon publication on the site. It is recommended to regularly check this page.`
        },
        {
          icon: Scale,
          title: '3. Services Offered',
          content: `${company.name} provides artificial intelligence integration services for businesses:

**Our solutions:**
• **Receipty Talent**: HR and recruitment process automation
• **Receipty Spend**: Expense management and optimization
• **Web-on-Demand**: Custom web platform development

**AI audits and diagnostics:**
Audits and diagnostics performed by ${company.name} are provided for informational and advisory purposes. They constitute an analysis based on information provided by the client and do not guarantee specific results.

**Limitation:**
ROI and performance estimates presented on the site are based on real case studies but may vary depending on each company's context.`
        },
        {
          icon: Shield,
          title: '4. Intellectual Property',
          content: `**Website Content:**
All content on the receipty.ai website (texts, graphics, logos, images, videos, structure, database) is the exclusive property of ${company.name} or its partners and is protected by French and international intellectual property laws.

**Trademarks:**
The trademarks "Receipty", "Receipty Agency", "Receipty Talent", "Receipty Spend" and "Web-on-Demand" are registered or pending trademarks of ${company.name}.

**Prohibitions:**
Any reproduction, representation, modification, publication, transmission, distortion, in whole or in part, of the site or its content, by any means whatsoever, and on any medium whatsoever, is prohibited without prior written authorization from Receipty Agency.

**Authorized Use:**
Use of content for personal and non-commercial purposes is tolerated subject to respect for intellectual property rights.`
        },
        {
          icon: AlertTriangle,
          title: '5. Liability',
          content: `**Limitation of Liability:**
${company.name} strives to provide accurate and up-to-date information on its site. However, we cannot guarantee the accuracy, completeness or timeliness of the information provided.

**Exclusions:**
${company.name} disclaims all liability for:
• Direct or indirect damages resulting from the use of the site
• Temporary interruptions of the site for maintenance
• The presence of viruses or harmful elements on the site (although we take all necessary precautions)
• Content of third-party sites accessible via hyperlinks

**Client Responsibility:**
The client remains solely responsible for the use made of the services and advice provided by ${company.name}. Implementation of recommendations is at the client's decision and responsibility.`
        },
        {
          icon: Gavel,
          title: '6. Applicable Law and Disputes',
          content: `**Applicable Law:**
These Terms of Service are governed by French law.

**Dispute Resolution:**
In case of dispute relating to the interpretation or execution of these Terms, the parties agree to seek an amicable solution before any legal action.

**Competent Jurisdiction:**
In the absence of amicable resolution, any dispute will be submitted to the competent courts of Strasbourg, France.

**Mediation:**
In accordance with articles L.616-1 and R.616-1 of the French Consumer Code, any consumer has the right to use a consumer mediator free of charge for the amicable resolution of a dispute.

**Contact for Disputes:**
${company.legal_email}`
        }
      ]
    }
  };

  const t = content[lang] || content.fr;

  return (
    <div data-testid="terms-page" className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <SEOHead page="terms" noIndex={true} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className={`font-heading text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.title}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{t.lastUpdate}</p>
          <p className={`mt-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.intro}</p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-xl p-6 sm:p-8 ${isDark ? 'bg-[#0F0F10] border border-white/5' : 'bg-white border border-gray-200 shadow-sm'}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {section.title}
                </h2>
              </div>
              <div className={`text-sm leading-relaxed whitespace-pre-line pl-14 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {section.content.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i} className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{part}</strong> : part
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
