import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Phone, Mail, MapPin, Clock, Building2, FileText, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminSiteContent({ token }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('contact');
  
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

  const [privacyContent, setPrivacyContent] = useState({
    data_retention_years: '3',
    last_update_fr: 'Février 2026',
    last_update_en: 'February 2026'
  });

  const [termsContent, setTermsContent] = useState({
    last_update_fr: 'Février 2026',
    last_update_en: 'February 2026'
  });

  const fetchContent = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/site-content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.contact) setContactInfo(res.data.contact);
      if (res.data.company) setCompanyInfo(res.data.company);
      if (res.data.privacy) setPrivacyContent(res.data.privacy);
      if (res.data.terms) setTermsContent(res.data.terms);
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
          className="bg-[#0F0F10] border border-white/5 rounded-xl p-6"
        >
          <h3 className="font-heading text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Politique de Confidentialité
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
          <p className="mt-4 text-xs text-gray-500">
            Note : Les sections détaillées de la politique de confidentialité (RGPD) sont générées automatiquement avec les informations de la société.
          </p>
        </motion.div>
      )}

      {/* Terms Section */}
      {activeSection === 'terms' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F0F10] border border-white/5 rounded-xl p-6"
        >
          <h3 className="font-heading text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Conditions Générales d'Utilisation
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
          <p className="mt-4 text-xs text-gray-500">
            Note : Les sections détaillées des CGU sont générées automatiquement avec les informations de la société.
          </p>
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
