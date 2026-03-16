import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, Clock, Zap, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import SEOHead from '../components/SEOHead';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContactPage() {
  const { t, lang } = useLanguage();
  const { isDark } = useTheme();
  const [siteContent, setSiteContent] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get(`${API}/site-content`).then(res => {
      setSiteContent(res.data);
    }).catch(() => {});
  }, []);

  const contact = siteContent?.contact || {
    phone: '+33 3 88 00 00 00',
    email: 'contact@receipty.ai',
    urgent_email: 'urgent@receipty.ai',
    address_line1: '91 Route des Romains',
    address_line2: '67000 Strasbourg, France',
    hours_fr: 'Lun - Ven : 9h00 - 18h00',
    hours_en: 'Mon - Fri: 9:00 AM - 6:00 PM'
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(lang === 'fr' ? 'Veuillez remplir les champs obligatoires' : 'Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        language: lang
      });
      setSubmitted(true);
      toast.success(t.contact.success);
    } catch {
      toast.error(lang === 'fr' ? 'Erreur lors de l\'envoi' : 'Error sending message');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div data-testid="contact-success" className={`pt-24 min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.contact.success}</h2>
          <p className={`mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.contact.success_desc}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-testid="contact-page" className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <SEOHead page="contact" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className={`font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.contact.title}
          </h1>
          <p className={`mt-4 text-base max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t.contact.subtitle}
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form 
              onSubmit={handleSubmit}
              className={`rounded-xl p-6 sm:p-8 ${isDark ? 'bg-[#0F0F10] border border-white/10' : 'bg-white shadow-[0_4px_30px_rgba(0,0,0,0.1)]'}`}
              data-testid="contact-form"
            >
              <h2 className={`font-heading text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t.contact.form_title}
              </h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t.contact.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t.contact.name_placeholder}
                    data-testid="contact-input-name"
                    className={`w-full rounded-xl h-12 px-4 text-sm outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-600' 
                        : 'bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400'
                    }`}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t.contact.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t.contact.email_placeholder}
                    data-testid="contact-input-email"
                    className={`w-full rounded-xl h-12 px-4 text-sm outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-600' 
                        : 'bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400'
                    }`}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t.contact.phone}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+33 6 12 34 56 78"
                    data-testid="contact-input-phone"
                    className={`w-full rounded-xl h-12 px-4 text-sm outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-600' 
                        : 'bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t.contact.subject}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder={t.contact.subject_placeholder}
                    data-testid="contact-input-subject"
                    className={`w-full rounded-xl h-12 px-4 text-sm outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-600' 
                        : 'bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t.contact.message} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t.contact.message_placeholder}
                    rows={5}
                    data-testid="contact-input-message"
                    className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 resize-none ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-600' 
                        : 'bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900 placeholder:text-gray-400'
                    }`}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="contact-submit-btn"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-12 font-semibold transition-all duration-200 shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? (
                    <span className="animate-pulse">{lang === 'fr' ? 'Envoi...' : 'Sending...'}</span>
                  ) : (
                    <>
                      {t.contact.send}
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Right Column - Info & Urgent */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Contact Info Card */}
            <div className={`rounded-xl p-6 sm:p-8 ${isDark ? 'bg-[#0F0F10] border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t.contact.info_title}
              </h2>
              
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.contact.phone_label}</p>
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>
                      {contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.contact.email_label}</p>
                    <a href={`mailto:${contact.email}`} className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>
                      {contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.contact.address_label}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact.address_line1}<br />
                      {contact.address_line2}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.contact.hours_label}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {lang === 'fr' ? contact.hours_fr : contact.hours_en}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Urgent Banner */}
            <div className="relative overflow-hidden rounded-xl p-6 sm:p-8" style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)'
            }}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white">
                    {t.contact.urgent_title}
                  </h3>
                </div>
                
                <p className="text-white/90 text-sm mb-6">
                  {t.contact.urgent_desc}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    data-testid="urgent-call-btn"
                    className="flex items-center justify-center gap-2 bg-white text-violet-700 hover:bg-white/90 rounded-xl px-5 py-3 font-semibold text-sm transition-all duration-200"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {t.contact.call_now}
                  </a>
                  <a
                    href={`mailto:${contact.urgent_email}`}
                    data-testid="urgent-email-btn"
                    className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl px-5 py-3 font-semibold text-sm transition-all duration-200"
                  >
                    <Mail className="w-4 h-4" />
                    {t.contact.urgent_email}
                  </a>
                </div>
              </div>
            </div>

            {/* Response Time Badge */}
            <div className="flex items-center gap-3 p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm text-emerald-400 font-medium">
                {t.contact.response_time}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
