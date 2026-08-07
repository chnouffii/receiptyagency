import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, Clock, Zap, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import { schemaContact, valider, estEmailPersonnel } from '../lib/formSchemas';
import { Honeypot } from '../components/Honeypot';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fieldStyle = {
  width: '100%', borderRadius: 12, height: 48, padding: '0 16px', fontSize: 14,
  outline: 'none', background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text)', transition: 'border-color .2s, box-shadow .2s',
};
const onFocus = (e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--glow)'; };
const onBlur = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; };
const label = { display: 'block', fontSize: 13.5, fontWeight: 500, marginBottom: 6, color: 'var(--text2)' };
const card = { borderRadius: 18, padding: 28, background: 'var(--surface)', border: '1px solid var(--border)' };

export default function ContactPage() {
  const { t, lang } = useLanguage();
  const [siteContent, setSiteContent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [erreurs, setErreurs] = useState({});
  const [piege, setPiege] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get(`${API}/site-content`).then((res) => setSiteContent(res.data)).catch(() => {});
  }, []);

  const contact = siteContent?.contact || {
    phone: '06 19 51 89 63', email: 'contact@receipty.fr', urgent_email: 'contact@receipty.fr',
    address_line1: 'Uniquement sur rendez-vous', address_line2: '',
    hours_fr: 'Lundi au samedi : 9h - 19h', hours_en: 'Monday to Saturday: 9am - 7pm',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // L'erreur disparaît dès que le champ est retouché, plutôt qu'à la
    // prochaine soumission.
    if (erreurs[name]) setErreurs((p) => ({ ...p, [name]: undefined }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ok, errors } = valider(schemaContact(lang), form);
    setErreurs(errors);
    if (!ok) {
      // Focus sur le premier champ fautif : sur mobile, un message
      // d'erreur plus haut dans la page passerait inaperçu.
      document.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, { ...form, website: piege, language: lang });
      setSubmitted(true);
      toast.success(t.contact.success);
    } catch {
      toast.error(lang === 'fr' ? "Erreur lors de l'envoi" : 'Error sending message');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div data-testid="contact-success" style={{ paddingTop: 96, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Send style={{ width: 30, height: 30, color: 'var(--success)' }} />
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t.contact.success}</h2>
          <p style={{ marginTop: 12, color: 'var(--text2)' }}>{t.contact.success_desc}</p>
        </motion.div>
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, title, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 20, height: 20, color: 'var(--accent)' }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{title}</p>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 2 }}>{children}</div>
      </div>
    </div>
  );

  return (
    <div data-testid="contact-page" style={{ paddingTop: 96, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SEOHead page="contact" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6" style={{ padding: '48px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56, opacity: 0, animation: 'riseIn .8s cubic-bezier(.2,.7,.2,1) .05s forwards' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2.2rem,5vw,3.6rem)', fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>{t.contact.title}</h1>
          <p style={{ marginTop: 16, fontSize: 16, maxWidth: 640, margin: '16px auto 0', color: 'var(--text2)' }}>{t.contact.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} data-testid="contact-form" noValidate style={{ ...card, position: 'relative' }}>
            <Honeypot value={piege} onChange={setPiege} />
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 22, color: 'var(--text)' }}>{t.contact.form_title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={label}>{t.contact.name} <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" name="name" value={form.name} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} aria-invalid={!!erreurs.name} placeholder={t.contact.name_placeholder} data-testid="contact-input-name" style={fieldStyle} required />
                {erreurs.name && (
                  <p role="alert" data-testid="contact-err-name" style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{erreurs.name}</p>
                )}
              </div>
              <div>
                <label style={label}>{t.contact.email} <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} aria-invalid={!!erreurs.email} placeholder={t.contact.email_placeholder} data-testid="contact-input-email" style={fieldStyle} required />
                {erreurs.email && (
                  <p role="alert" data-testid="contact-err-email" style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{erreurs.email}</p>
                )}
              </div>
              <div>
                <label style={label}>{t.contact.phone}</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} aria-invalid={!!erreurs.phone} placeholder="+33 6 12 34 56 78" data-testid="contact-input-phone" style={fieldStyle} />
                {erreurs.phone && (
                  <p role="alert" data-testid="contact-err-phone" style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{erreurs.phone}</p>
                )}
              </div>
              <div>
                <label style={label}>{t.contact.subject}</label>
                <input type="text" name="subject" value={form.subject} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} aria-invalid={!!erreurs.subject} placeholder={t.contact.subject_placeholder} data-testid="contact-input-subject" style={fieldStyle} />
                {erreurs.subject && (
                  <p role="alert" data-testid="contact-err-subject" style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{erreurs.subject}</p>
                )}
              </div>
              <div>
                <label style={label}>{t.contact.message} <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea name="message" value={form.message} onChange={handleChange} onFocus={onFocus} onBlur={onBlur} aria-invalid={!!erreurs.message} placeholder={t.contact.message_placeholder} rows={5} data-testid="contact-input-message" style={{ ...fieldStyle, height: 'auto', padding: '12px 16px', resize: 'none' }} required />
                {erreurs.message && (
                  <p role="alert" data-testid="contact-err-message" style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>{erreurs.message}</p>
                )}
              </div>
              <button type="submit" disabled={submitting} data-testid="contact-submit-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--accent2)', color: '#fff', borderRadius: 12, height: 48, fontWeight: 700, fontSize: 15, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, boxShadow: '0 0 0 1px var(--accent2), 0 12px 40px -8px var(--glow)' }}>
                {submitting ? (lang === 'fr' ? 'Envoi...' : 'Sending...') : (<>{t.contact.send} <Send style={{ width: 16, height: 16 }} /></>)}
              </button>
            </div>
          </form>

          {/* Info & urgent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={card}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 22, color: 'var(--text)' }}>{t.contact.info_title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <InfoRow icon={Phone} title={t.contact.phone_label}>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: 'var(--text2)' }}>{contact.phone}</a>
                </InfoRow>
                <InfoRow icon={Mail} title={t.contact.email_label}>
                  <a href={`mailto:${contact.email}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: 'var(--text2)' }}>{contact.email}</a>
                </InfoRow>
                <InfoRow icon={MapPin} title={t.contact.address_label}>
                  {contact.address_line1}{contact.address_line2 && (<><br />{contact.address_line2}</>)}
                </InfoRow>
                <InfoRow icon={Clock} title={t.contact.hours_label}>
                  {lang === 'fr' ? contact.hours_fr : contact.hours_en}
                </InfoRow>
              </div>
            </div>

            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: 28, background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap style={{ width: 20, height: 20, color: '#fff' }} />
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{t.contact.urgent_title}</h3>
                </div>
                <p style={{ color: 'rgba(255,255,255,.9)', fontSize: 14, marginBottom: 20 }}>{t.contact.urgent_desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} data-testid="urgent-call-btn" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#6d28d9', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    <PhoneCall style={{ width: 16, height: 16 }} /> {t.contact.call_now}
                  </a>
                  <a href={`mailto:${contact.urgent_email}`} data-testid="urgent-email-btn" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    <Mail style={{ width: 16, height: 16 }} /> {t.contact.urgent_email}
                  </a>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s ease-in-out infinite' }} />
              <p style={{ fontSize: 14, color: 'var(--success)', fontWeight: 500, margin: 0 }}>{t.contact.response_time}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
