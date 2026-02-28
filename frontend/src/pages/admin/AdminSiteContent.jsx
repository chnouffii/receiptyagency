import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Phone, Mail, MapPin, Clock, Building2, FileText, Shield, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default section texts for legal pages
const DEFAULT_PRIVACY_SECTIONS = {
  fr: {
    data_collected: `Nous collectons les données suivantes via notre formulaire de contact :

• Données d'identification : Nom complet, adresse email professionnelle
• Données de contact : Numéro de téléphone (optionnel)
• Données de communication : Sujet et contenu de votre message
• Données techniques : Langue de préférence, date et heure de soumission

Ces données sont collectées uniquement lorsque vous les soumettez volontairement via notre formulaire de contact.`,
    purpose: `Vos données personnelles sont traitées pour les finalités suivantes :

• Prospection commerciale : Répondre à vos demandes d'information et de devis
• Gestion de la relation client : Suivi de vos projets et communications
• Amélioration de nos services : Analyse anonymisée des besoins clients
• Obligations légales : Conservation des données pour raisons comptables et fiscales

La base légale de ce traitement est votre consentement explicite (Article 6.1.a du RGPD) et notre intérêt légitime à répondre à vos demandes (Article 6.1.f du RGPD).`,
    storage: `Vos données sont stockées de manière sécurisée :

• Base de données : MongoDB hébergée sur des serveurs sécurisés
• Chiffrement : Toutes les communications sont chiffrées via HTTPS/TLS
• Accès restreint : Seuls les administrateurs autorisés ont accès aux données
• Durée de conservation : Vos données sont conservées pendant 3 ans à compter de votre dernier contact

Nous ne transférons pas vos données en dehors de l'Union Européenne.`,
    rights: `Conformément au RGPD, vous disposez des droits suivants :

• Droit d'accès (Art. 15) : Obtenir une copie de vos données personnelles
• Droit de rectification (Art. 16) : Corriger des données inexactes
• Droit à l'effacement (Art. 17) : Demander la suppression de vos données
• Droit à la limitation (Art. 18) : Limiter le traitement de vos données
• Droit à la portabilité (Art. 20) : Recevoir vos données dans un format structuré
• Droit d'opposition (Art. 21) : Vous opposer au traitement de vos données`,
    cookies: `Notre site utilise des cookies strictement nécessaires au fonctionnement :

• Cookies de session : Maintien de votre session de navigation
• Cookies de préférence : Mémorisation de votre choix de langue

Nous n'utilisons pas de cookies publicitaires ni de traceurs tiers.`
  },
  en: {
    data_collected: `We collect the following data through our contact form:

• Identification data: Full name, professional email address
• Contact data: Phone number (optional)
• Communication data: Subject and content of your message
• Technical data: Language preference, submission date and time

This data is collected only when you voluntarily submit it through our contact form.`,
    purpose: `Your personal data is processed for the following purposes:

• Commercial prospecting: Responding to your information and quote requests
• Customer relationship management: Tracking your projects and communications
• Service improvement: Anonymous analysis of customer needs
• Legal obligations: Data retention for accounting and tax purposes

The legal basis for this processing is your explicit consent (Article 6.1.a of GDPR) and our legitimate interest in responding to your requests (Article 6.1.f of GDPR).`,
    storage: `Your data is stored securely:

• Database: MongoDB hosted on secure servers
• Encryption: All communications are encrypted via HTTPS/TLS
• Restricted access: Only authorized administrators have access to data
• Retention period: Your data is kept for 3 years from your last contact

We do not transfer your data outside the European Union.`,
    rights: `Under the GDPR, you have the following rights:

• Right of access (Art. 15): Obtain a copy of your personal data
• Right to rectification (Art. 16): Correct inaccurate data
• Right to erasure (Art. 17): Request deletion of your data
• Right to restriction (Art. 18): Limit the processing of your data
• Right to portability (Art. 20): Receive your data in a structured format
• Right to object (Art. 21): Object to the processing of your data`,
    cookies: `Our website uses strictly necessary cookies:

• Session cookies: Maintaining your browsing session
• Preference cookies: Remembering your language choice

We do not use advertising cookies or third-party trackers.`
  }
};

const DEFAULT_TERMS_SECTIONS = {
  fr: {
    services: `Nous proposons des services d'intégration d'intelligence artificielle pour les entreprises :

• Receipty Talent : Automatisation des processus RH et recrutement
• Receipty Spend : Gestion et optimisation des dépenses
• Web-on-Demand : Développement de plateformes web sur mesure

Les audits et diagnostics réalisés sont fournis à titre informatif et de conseil. Ils constituent une analyse basée sur les informations fournies par le client et ne garantissent pas des résultats spécifiques.`,
    intellectual_property: `L'ensemble du contenu présent sur le site (textes, graphiques, logos, images, vidéos, structure, base de données) est la propriété exclusive de Receipty Agency ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication, transmission, totale ou partielle du site ou de son contenu, par quelque procédé que ce soit, est interdite sans autorisation préalable écrite.

Une utilisation du contenu à des fins personnelles et non commerciales est tolérée sous réserve du respect des droits de propriété intellectuelle.`,
    liability: `Nous nous efforçons de fournir des informations exactes et à jour sur notre site. Toutefois, nous ne pouvons garantir l'exactitude, la complétude ou l'actualité des informations diffusées.

Nous déclinons toute responsabilité pour :
• Les dommages directs ou indirects résultant de l'utilisation du site
• Les interruptions temporaires du site pour maintenance
• La présence de virus ou d'éléments nuisibles sur le site
• Les contenus de sites tiers accessibles via des liens hypertextes

Le client reste seul responsable de l'utilisation qu'il fait des services et conseils fournis.`,
    disputes: `Ces CGU sont régies par le droit français.

En cas de litige relatif à l'interprétation ou l'exécution de ces CGU, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.

À défaut de résolution amiable, tout litige sera soumis aux tribunaux compétents de Strasbourg, France.

Conformément aux articles L.616-1 et R.616-1 du code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation.`
  },
  en: {
    services: `We provide artificial intelligence integration services for businesses:

• Receipty Talent: HR and recruitment process automation
• Receipty Spend: Expense management and optimization
• Web-on-Demand: Custom web platform development

Audits and diagnostics are provided for informational and advisory purposes. They constitute an analysis based on information provided by the client and do not guarantee specific results.`,
    intellectual_property: `All content on the website (texts, graphics, logos, images, videos, structure, database) is the exclusive property of Receipty Agency or its partners and is protected by French and international intellectual property laws.

Any reproduction, representation, modification, publication, transmission, in whole or in part, of the site or its content, by any means whatsoever, is prohibited without prior written authorization.

Use of content for personal and non-commercial purposes is tolerated subject to respect for intellectual property rights.`,
    liability: `We strive to provide accurate and up-to-date information on our site. However, we cannot guarantee the accuracy, completeness or timeliness of the information provided.

We disclaim all liability for:
• Direct or indirect damages resulting from the use of the site
• Temporary interruptions of the site for maintenance
• The presence of viruses or harmful elements on the site
• Content of third-party sites accessible via hyperlinks

The client remains solely responsible for the use made of the services and advice provided.`,
    disputes: `These Terms of Service are governed by French law.

In case of dispute relating to the interpretation or execution of these Terms, the parties agree to seek an amicable solution before any legal action.

In the absence of amicable resolution, any dispute will be submitted to the competent courts of Strasbourg, France.

In accordance with articles L.616-1 and R.616-1 of the French Consumer Code, any consumer has the right to use a consumer mediator free of charge.`
  }
};

export default function AdminSiteContent({ token }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('contact');
  const [expandedSections, setExpandedSections] = useState({});
  
  const [contactInfo, setContactInfo] = useState({
    phone: '+33 3 88 00 00 00',
    email: 'contact@receipty.ai',
    urgent_email: 'urgent@receipty.ai',
    address_line1: '1 Place de la Gare',
    address_line2: '67000 Strasbourg, France',
    hours_fr: 'Lun - Ven : 9h00 - 18h00',
    hours_en: 'Mon - Fri: 9:00 AM - 6:00 PM'
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: 'Receipty Agency',
    legal_form: 'SARL en cours de formation',
    capital: 'En cours de constitution',
    ceo1_name: 'BOTH Quentin',
    ceo1_role_fr: 'Co-CEO & Expert IA',
    ceo1_role_en: 'Co-CEO & AI Expert',
    ceo2_name: 'DE FURST Valère',
    ceo2_role_fr: 'Co-CEO & Stratégiste Business',
    ceo2_role_en: 'Co-CEO & Business Strategist',
    dpo_email: 'dpo@receipty.ai',
    legal_email: 'juridique@receipty.ai'
  });

  const [trustedCompanies, setTrustedCompanies] = useState([
    'GlobalTech', 'BioPharm', 'NeoRetail', 'MedStaff', 'InvestCorp'
  ]);
  const [newCompany, setNewCompany] = useState('');

  const [privacyContent, setPrivacyContent] = useState({
    data_retention_years: '3',
    last_update_fr: 'Février 2026',
    last_update_en: 'February 2026',
    sections_fr: DEFAULT_PRIVACY_SECTIONS.fr,
    sections_en: DEFAULT_PRIVACY_SECTIONS.en
  });

  const [termsContent, setTermsContent] = useState({
    last_update_fr: 'Février 2026',
    last_update_en: 'February 2026',
    sections_fr: DEFAULT_TERMS_SECTIONS.fr,
    sections_en: DEFAULT_TERMS_SECTIONS.en
  });

  const fetchContent = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/site-content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.contact) setContactInfo(res.data.contact);
      if (res.data.company) setCompanyInfo(res.data.company);
      if (res.data.trusted_companies && res.data.trusted_companies.length > 0) {
        setTrustedCompanies(res.data.trusted_companies);
      }
      if (res.data.privacy) {
        setPrivacyContent({
          ...res.data.privacy,
          sections_fr: res.data.privacy.sections_fr || DEFAULT_PRIVACY_SECTIONS.fr,
          sections_en: res.data.privacy.sections_en || DEFAULT_PRIVACY_SECTIONS.en
        });
      }
      if (res.data.terms) {
        setTermsContent({
          ...res.data.terms,
          sections_fr: res.data.terms.sections_fr || DEFAULT_TERMS_SECTIONS.fr,
          sections_en: res.data.terms.sections_en || DEFAULT_TERMS_SECTIONS.en
        });
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const saveContent = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/site-content`, {
        contact: contactInfo,
        company: companyInfo,
        privacy: privacyContent,
        terms: termsContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Contenu sauvegardé avec succès');
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'contact', label: 'Informations Contact', icon: Phone },
    { id: 'company', label: 'Informations Société', icon: Building2 },
    { id: 'privacy', label: 'Politique Confidentialité', icon: Shield },
    { id: 'terms', label: 'CGU', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === section.id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Contact Info Section */}
      {activeSection === 'contact' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F0F10] border border-white/5 rounded-xl p-6"
        >
          <h3 className="font-heading text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-400" />
            Informations de Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Téléphone</label>
              <input
                type="text"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email principal</label>
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email urgent</label>
              <input
                type="email"
                value={contactInfo.urgent_email}
                onChange={(e) => setContactInfo({ ...contactInfo, urgent_email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Adresse (ligne 1)</label>
              <input
                type="text"
                value={contactInfo.address_line1}
                onChange={(e) => setContactInfo({ ...contactInfo, address_line1: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Adresse (ligne 2)</label>
              <input
                type="text"
                value={contactInfo.address_line2}
                onChange={(e) => setContactInfo({ ...contactInfo, address_line2: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Horaires (FR)</label>
              <input
                type="text"
                value={contactInfo.hours_fr}
                onChange={(e) => setContactInfo({ ...contactInfo, hours_fr: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Horaires (EN)</label>
              <input
                type="text"
                value={contactInfo.hours_en}
                onChange={(e) => setContactInfo({ ...contactInfo, hours_en: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Company Info Section */}
      {activeSection === 'company' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F0F10] border border-white/5 rounded-xl p-6"
        >
          <h3 className="font-heading text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Informations Société
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nom de la société</label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Forme juridique</label>
              <input
                type="text"
                value={companyInfo.legal_form}
                onChange={(e) => setCompanyInfo({ ...companyInfo, legal_form: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Capital social</label>
              <input
                type="text"
                value={companyInfo.capital}
                onChange={(e) => setCompanyInfo({ ...companyInfo, capital: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2">
              <h4 className="text-sm font-medium text-white mb-4">Co-CEO 1</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nom</label>
                  <input
                    type="text"
                    value={companyInfo.ceo1_name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ceo1_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rôle (FR)</label>
                  <input
                    type="text"
                    value={companyInfo.ceo1_role_fr}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ceo1_role_fr: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rôle (EN)</label>
                  <input
                    type="text"
                    value={companyInfo.ceo1_role_en}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ceo1_role_en: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2">
              <h4 className="text-sm font-medium text-white mb-4">Co-CEO 2</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nom</label>
                  <input
                    type="text"
                    value={companyInfo.ceo2_name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ceo2_name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rôle (FR)</label>
                  <input
                    type="text"
                    value={companyInfo.ceo2_role_fr}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ceo2_role_fr: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rôle (EN)</label>
                  <input
                    type="text"
                    value={companyInfo.ceo2_role_en}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ceo2_role_en: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2">
              <h4 className="text-sm font-medium text-white mb-4">Emails légaux</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email DPO (RGPD)</label>
                  <input
                    type="email"
                    value={companyInfo.dpo_email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, dpo_email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email juridique</label>
                  <input
                    type="email"
                    value={companyInfo.legal_email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, legal_email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Privacy Policy Section */}
      {activeSection === 'privacy' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#0F0F10] border border-white/5 rounded-xl p-6">
            <h3 className="font-heading text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Politique de Confidentialité - Paramètres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Durée conservation (années)</label>
                <input
                  type="number"
                  value={privacyContent.data_retention_years}
                  onChange={(e) => setPrivacyContent({ ...privacyContent, data_retention_years: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Dernière MAJ (FR)</label>
                <input
                  type="text"
                  value={privacyContent.last_update_fr}
                  onChange={(e) => setPrivacyContent({ ...privacyContent, last_update_fr: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Dernière MAJ (EN)</label>
                <input
                  type="text"
                  value={privacyContent.last_update_en}
                  onChange={(e) => setPrivacyContent({ ...privacyContent, last_update_en: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Privacy Sections Editor */}
          <div className="bg-[#0F0F10] border border-white/5 rounded-xl p-6">
            <h4 className="font-heading text-md font-semibold text-white mb-4">Sections détaillées (FR)</h4>
            {[
              { key: 'data_collected', label: '1. Données collectées' },
              { key: 'purpose', label: '2. Finalité du traitement' },
              { key: 'storage', label: '3. Stockage et sécurité' },
              { key: 'rights', label: '4. Vos droits (RGPD)' },
              { key: 'cookies', label: '5. Cookies' }
            ].map(({ key, label }) => (
              <div key={key} className="mb-4">
                <button
                  type="button"
                  onClick={() => setExpandedSections({ ...expandedSections, [`privacy_fr_${key}`]: !expandedSections[`privacy_fr_${key}`] })}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 hover:text-white py-2"
                >
                  {label}
                  {expandedSections[`privacy_fr_${key}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections[`privacy_fr_${key}`] && (
                  <textarea
                    value={privacyContent.sections_fr?.[key] || ''}
                    onChange={(e) => setPrivacyContent({
                      ...privacyContent,
                      sections_fr: { ...privacyContent.sections_fr, [key]: e.target.value }
                    })}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none resize-y mt-2"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#0F0F10] border border-white/5 rounded-xl p-6">
            <h4 className="font-heading text-md font-semibold text-white mb-4">Sections détaillées (EN)</h4>
            {[
              { key: 'data_collected', label: '1. Data Collected' },
              { key: 'purpose', label: '2. Purpose of Processing' },
              { key: 'storage', label: '3. Storage and Security' },
              { key: 'rights', label: '4. Your Rights (GDPR)' },
              { key: 'cookies', label: '5. Cookies' }
            ].map(({ key, label }) => (
              <div key={key} className="mb-4">
                <button
                  type="button"
                  onClick={() => setExpandedSections({ ...expandedSections, [`privacy_en_${key}`]: !expandedSections[`privacy_en_${key}`] })}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 hover:text-white py-2"
                >
                  {label}
                  {expandedSections[`privacy_en_${key}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections[`privacy_en_${key}`] && (
                  <textarea
                    value={privacyContent.sections_en?.[key] || ''}
                    onChange={(e) => setPrivacyContent({
                      ...privacyContent,
                      sections_en: { ...privacyContent.sections_en, [key]: e.target.value }
                    })}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none resize-y mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Terms Section */}
      {activeSection === 'terms' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#0F0F10] border border-white/5 rounded-xl p-6">
            <h3 className="font-heading text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              CGU - Paramètres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Dernière MAJ (FR)</label>
                <input
                  type="text"
                  value={termsContent.last_update_fr}
                  onChange={(e) => setTermsContent({ ...termsContent, last_update_fr: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Dernière MAJ (EN)</label>
                <input
                  type="text"
                  value={termsContent.last_update_en}
                  onChange={(e) => setTermsContent({ ...termsContent, last_update_en: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Terms Sections Editor */}
          <div className="bg-[#0F0F10] border border-white/5 rounded-xl p-6">
            <h4 className="font-heading text-md font-semibold text-white mb-4">Sections détaillées (FR)</h4>
            {[
              { key: 'services', label: '3. Services proposés' },
              { key: 'intellectual_property', label: '4. Propriété intellectuelle' },
              { key: 'liability', label: '5. Responsabilité' },
              { key: 'disputes', label: '6. Droit applicable et litiges' }
            ].map(({ key, label }) => (
              <div key={key} className="mb-4">
                <button
                  type="button"
                  onClick={() => setExpandedSections({ ...expandedSections, [`terms_fr_${key}`]: !expandedSections[`terms_fr_${key}`] })}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 hover:text-white py-2"
                >
                  {label}
                  {expandedSections[`terms_fr_${key}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections[`terms_fr_${key}`] && (
                  <textarea
                    value={termsContent.sections_fr?.[key] || ''}
                    onChange={(e) => setTermsContent({
                      ...termsContent,
                      sections_fr: { ...termsContent.sections_fr, [key]: e.target.value }
                    })}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none resize-y mt-2"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#0F0F10] border border-white/5 rounded-xl p-6">
            <h4 className="font-heading text-md font-semibold text-white mb-4">Sections détaillées (EN)</h4>
            {[
              { key: 'services', label: '3. Services Offered' },
              { key: 'intellectual_property', label: '4. Intellectual Property' },
              { key: 'liability', label: '5. Liability' },
              { key: 'disputes', label: '6. Applicable Law and Disputes' }
            ].map(({ key, label }) => (
              <div key={key} className="mb-4">
                <button
                  type="button"
                  onClick={() => setExpandedSections({ ...expandedSections, [`terms_en_${key}`]: !expandedSections[`terms_en_${key}`] })}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-300 hover:text-white py-2"
                >
                  {label}
                  {expandedSections[`terms_en_${key}`] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSections[`terms_en_${key}`] && (
                  <textarea
                    value={termsContent.sections_en?.[key] || ''}
                    onChange={(e) => setTermsContent({
                      ...termsContent,
                      sections_en: { ...termsContent.sections_en, [key]: e.target.value }
                    })}
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none resize-y mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveContent}
          disabled={saving}
          data-testid="save-content-btn"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-6 py-3 font-semibold text-sm transition-all duration-200"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  );
}
