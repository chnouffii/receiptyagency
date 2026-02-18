import { motion } from 'framer-motion';
import { Shield, Database, Lock, UserCheck, Mail, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();

  const content = {
    fr: {
      title: 'Politique de Confidentialité',
      lastUpdate: 'Dernière mise à jour : Février 2026',
      intro: 'Receipty Agency (ci-après "Receipty", "nous", "notre") s\'engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD) et à la législation française en vigueur.',
      sections: [
        {
          icon: Database,
          title: '1. Données collectées',
          content: `Nous collectons les données suivantes via notre formulaire de contact :
          
• **Données d'identification** : Nom complet, adresse email professionnelle
• **Données de contact** : Numéro de téléphone (optionnel)
• **Données de communication** : Sujet et contenu de votre message
• **Données techniques** : Langue de préférence, date et heure de soumission

Ces données sont collectées uniquement lorsque vous les soumettez volontairement via notre formulaire de contact.`
        },
        {
          icon: FileText,
          title: '2. Finalité du traitement',
          content: `Vos données personnelles sont traitées pour les finalités suivantes :

• **Prospection commerciale** : Répondre à vos demandes d'information et de devis
• **Gestion de la relation client** : Suivi de vos projets et communications
• **Amélioration de nos services** : Analyse anonymisée des besoins clients
• **Obligations légales** : Conservation des données pour raisons comptables et fiscales

La base légale de ce traitement est votre consentement explicite (Article 6.1.a du RGPD) et notre intérêt légitime à répondre à vos demandes (Article 6.1.f du RGPD).`
        },
        {
          icon: Lock,
          title: '3. Stockage et sécurité',
          content: `Vos données sont stockées de manière sécurisée :

• **Base de données** : MongoDB hébergée sur des serveurs sécurisés
• **Chiffrement** : Toutes les communications sont chiffrées via HTTPS/TLS
• **Accès restreint** : Seuls les administrateurs autorisés ont accès aux données
• **Durée de conservation** : Vos données sont conservées pendant 3 ans à compter de votre dernier contact, sauf obligation légale contraire

Nous ne transférons pas vos données en dehors de l'Union Européenne.`
        },
        {
          icon: UserCheck,
          title: '4. Vos droits (RGPD)',
          content: `Conformément au RGPD, vous disposez des droits suivants :

• **Droit d'accès** (Art. 15) : Obtenir une copie de vos données personnelles
• **Droit de rectification** (Art. 16) : Corriger des données inexactes
• **Droit à l'effacement** (Art. 17) : Demander la suppression de vos données
• **Droit à la limitation** (Art. 18) : Limiter le traitement de vos données
• **Droit à la portabilité** (Art. 20) : Recevoir vos données dans un format structuré
• **Droit d'opposition** (Art. 21) : Vous opposer au traitement de vos données

Pour exercer ces droits, contactez-nous à : **dpo@receipty.ai**`
        },
        {
          icon: Shield,
          title: '5. Cookies et traceurs',
          content: `Notre site utilise des cookies strictement nécessaires au fonctionnement :

• **Cookies de session** : Maintien de votre session de navigation
• **Cookies de préférence** : Mémorisation de votre choix de langue

Nous n'utilisons pas de cookies publicitaires ni de traceurs tiers. Aucune donnée n'est partagée avec des réseaux sociaux ou des services de publicité.`
        },
        {
          icon: Mail,
          title: '6. Contact et réclamations',
          content: `Pour toute question concernant cette politique ou vos données :

**Responsable du traitement :**
Receipty Agency (SARL en cours de formation)
1 Place de la Gare, 67000 Strasbourg, France
Email : dpo@receipty.ai

Vous avez également le droit d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : www.cnil.fr`
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      lastUpdate: 'Last updated: February 2026',
      intro: 'Receipty Agency (hereinafter "Receipty", "we", "our") is committed to protecting the privacy of its users in accordance with the General Data Protection Regulation (GDPR) and applicable French law.',
      sections: [
        {
          icon: Database,
          title: '1. Data Collected',
          content: `We collect the following data through our contact form:
          
• **Identification data**: Full name, professional email address
• **Contact data**: Phone number (optional)
• **Communication data**: Subject and content of your message
• **Technical data**: Language preference, submission date and time

This data is collected only when you voluntarily submit it through our contact form.`
        },
        {
          icon: FileText,
          title: '2. Purpose of Processing',
          content: `Your personal data is processed for the following purposes:

• **Commercial prospecting**: Responding to your information and quote requests
• **Customer relationship management**: Tracking your projects and communications
• **Service improvement**: Anonymous analysis of customer needs
• **Legal obligations**: Data retention for accounting and tax purposes

The legal basis for this processing is your explicit consent (Article 6.1.a of GDPR) and our legitimate interest in responding to your requests (Article 6.1.f of GDPR).`
        },
        {
          icon: Lock,
          title: '3. Storage and Security',
          content: `Your data is stored securely:

• **Database**: MongoDB hosted on secure servers
• **Encryption**: All communications are encrypted via HTTPS/TLS
• **Restricted access**: Only authorized administrators have access to data
• **Retention period**: Your data is kept for 3 years from your last contact, unless otherwise required by law

We do not transfer your data outside the European Union.`
        },
        {
          icon: UserCheck,
          title: '4. Your Rights (GDPR)',
          content: `Under the GDPR, you have the following rights:

• **Right of access** (Art. 15): Obtain a copy of your personal data
• **Right to rectification** (Art. 16): Correct inaccurate data
• **Right to erasure** (Art. 17): Request deletion of your data
• **Right to restriction** (Art. 18): Limit the processing of your data
• **Right to portability** (Art. 20): Receive your data in a structured format
• **Right to object** (Art. 21): Object to the processing of your data

To exercise these rights, contact us at: **dpo@receipty.ai**`
        },
        {
          icon: Shield,
          title: '5. Cookies and Trackers',
          content: `Our website uses strictly necessary cookies:

• **Session cookies**: Maintaining your browsing session
• **Preference cookies**: Remembering your language choice

We do not use advertising cookies or third-party trackers. No data is shared with social networks or advertising services.`
        },
        {
          icon: Mail,
          title: '6. Contact and Complaints',
          content: `For any questions regarding this policy or your data:

**Data Controller:**
Receipty Agency (SARL under formation)
1 Place de la Gare, 67000 Strasbourg, France
Email: dpo@receipty.ai

You also have the right to lodge a complaint with the CNIL (Commission Nationale de l'Informatique et des Libertés): www.cnil.fr`
        }
      ]
    }
  };

  const t = content[lang] || content.fr;

  return (
    <div data-testid="privacy-page" className="pt-24 bg-[#050505] min-h-screen">
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
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white">
              {t.title}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{t.lastUpdate}</p>
          <p className="mt-6 text-gray-400 leading-relaxed">{t.intro}</p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#0F0F10] border border-white/5 rounded-xl p-6 sm:p-8"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="font-heading text-lg font-semibold text-white">
                  {section.title}
                </h2>
              </div>
              <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-line pl-14">
                {section.content.split('**').map((part, i) => 
                  i % 2 === 1 ? <strong key={i} className="text-white font-medium">{part}</strong> : part
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
