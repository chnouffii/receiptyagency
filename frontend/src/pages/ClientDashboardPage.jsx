import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, FileText, FolderOpen, LogOut, Send, Download,
  CheckCircle, Clock, Loader, Package, Star, ChevronRight,
  User, Building2, RefreshCw, ExternalLink, AlertCircle, BookOpen,
  Sparkles, Lightbulb, Wrench, Zap, Plus, X, ChevronDown, ChevronUp,
  ThumbsUp, Heart, Flame, StickyNote, Calendar, ChevronLeft, Video,
  ThumbsDown, MessageSquare, XCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const projectStatuses = {
  en_attente: {
    labelFr: 'En attente de démarrage',
    labelEn: 'Waiting to start',
    icon: Clock,
    color: 'text-gray-400',
    bg: 'bg-gray-500/20',
    step: 1,
  },
  en_cours: {
    labelFr: 'En cours de développement',
    labelEn: 'In development',
    icon: Loader,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    step: 2,
  },
  revue: {
    labelFr: 'En phase de revue',
    labelEn: 'Under review',
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    step: 3,
  },
  livre: {
    labelFr: 'Livré — tests en cours',
    labelEn: 'Delivered — testing',
    icon: Package,
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    step: 4,
  },
  termine: {
    labelFr: 'Projet terminé',
    labelEn: 'Project completed',
    icon: Star,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    step: 5,
  },
};

const docTypeIcons = {
  devis: '📄',
  contrat: '📝',
  rapport: '📊',
  document: '📎',
};

const EVOLUTION_TYPES = [
  { value: 'bug',           emoji: '🐛', labelFr: 'Correction bug',      labelEn: 'Bug fix',         color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  { value: 'amelioration',  emoji: '✨', labelFr: 'Amélioration',        labelEn: 'Improvement',     color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  { value: 'fonctionnalite',emoji: '🚀', labelFr: 'Nouvelle feature',    labelEn: 'New feature',     color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
];

const EVOLUTION_PRIORITIES = [
  { value: 'faible',   labelFr: 'Faible',   labelEn: 'Low',    color: 'text-gray-400' },
  { value: 'normale',  labelFr: 'Normale',  labelEn: 'Normal', color: 'text-blue-400' },
  { value: 'haute',    labelFr: 'Haute',    labelEn: 'High',   color: 'text-amber-400' },
];

const EVOLUTION_STATUSES = {
  en_attente:  { labelFr: 'En attente',    labelEn: 'Pending',      color: 'text-gray-400',    bg: 'bg-gray-500/10' },
  en_etude:    { labelFr: 'En étude',      labelEn: 'Under review', color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  planifie:    { labelFr: 'Planifiée',     labelEn: 'Planned',      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  en_cours:    { labelFr: 'En cours',      labelEn: 'In progress',  color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  livre:       { labelFr: 'Livrée ✅',    labelEn: 'Delivered ✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  refuse:      { labelFr: 'Refusée',       labelEn: 'Declined',     color: 'text-red-400',     bg: 'bg-red-500/10' },
};

const REACTIONS = ['👍', '❤️', '🔥'];

function formatDate(dateStr, lang) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMessageContent(content) {
  return escapeHtml(content).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// ─── Confetti component ───────────────────────────────────────────────────────
function Confetti({ onDone }) {
  const particles = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 7)],
      size: Math.random() * 10 + 5,
      duration: Math.random() * 2.5 + 2,
      delay: Math.random() * 1.8,
      rotate: Math.random() * 720 - 360,
      isCircle: Math.random() > 0.5,
    })), []
  );

  useEffect(() => {
    const timeout = setTimeout(onDone, 5000);
    return () => clearTimeout(timeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -30, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '115vh', opacity: [1, 1, 1, 0], rotate: p.rotate, scale: [1, 1, 0.5] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ─── Celebration Banner ───────────────────────────────────────────────────────
function CelebrationBanner({ isDark, lang }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      className={`relative overflow-hidden rounded-2xl border p-6 mb-6 text-center ${
        isDark
          ? 'bg-gradient-to-br from-emerald-900/30 to-blue-900/20 border-emerald-500/30'
          : 'bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200'
      }`}
    >
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      <div className="relative z-10">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className={`font-heading text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {lang === 'fr' ? 'Félicitations !' : 'Congratulations!'}
        </h2>
        <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {lang === 'fr'
            ? 'Votre projet est officiellement terminé. Merci pour votre confiance — ce fut un vrai plaisir de travailler avec vous !'
            : 'Your project is officially complete. Thank you for your trust — it was a real pleasure working with you!'}
        </p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">100%</div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {lang === 'fr' ? 'Complété' : 'Completed'}
            </div>
          </div>
          <div className={`w-px h-8 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className="text-center">
            <div className="text-2xl">✅</div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {lang === 'fr' ? 'Livré' : 'Delivered'}
            </div>
          </div>
          <div className={`w-px h-8 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className="text-center">
            <div className="text-2xl">🚀</div>
            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {lang === 'fr' ? 'En ligne' : 'Live'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── NPS Modal ────────────────────────────────────────────────────────────────
function NPSModal({ isDark, lang, onSubmit, onSkip }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
  };

  const stars = [1, 2, 3, 4, 5];
  const ratingLabels = {
    fr: ['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Exceptionnel !'],
    en: ['', 'Disappointing', 'Okay', 'Good', 'Very good', 'Exceptional!'],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280 }}
        className={`w-full max-w-md rounded-2xl p-8 relative ${
          isDark ? 'bg-[#111] border border-white/10' : 'bg-white border border-gray-200 shadow-2xl'
        }`}
      >
        <button
          onClick={onSkip}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-600 hover:text-gray-300' : 'text-gray-300 hover:text-gray-600'}`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⭐</div>
          <h3 className={`font-heading text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {lang === 'fr' ? 'Votre avis nous tient à cœur' : 'Your feedback matters to us'}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {lang === 'fr'
              ? 'Comment évaluez-vous votre expérience Receipty ?'
              : 'How would you rate your Receipty experience?'}
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {stars.map(s => (
            <button
              key={s}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  s <= (hovered || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : isDark ? 'text-gray-700' : 'text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Rating label */}
        <div className="h-6 text-center mb-4">
          <AnimatePresence mode="wait">
            {(hovered || rating) > 0 && (
              <motion.p
                key={hovered || rating}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-sm font-medium ${
                  (hovered || rating) >= 4 ? 'text-emerald-400' :
                  (hovered || rating) >= 3 ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {ratingLabels[lang]?.[hovered || rating] || ratingLabels['fr'][hovered || rating]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={lang === 'fr'
            ? 'Un commentaire ? (optionnel)'
            : 'Any comment? (optional)'}
          rows={3}
          maxLength={500}
          className={`w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all mb-4 ${
            isDark
              ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50'
              : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-400'
          }`}
        />

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
          >
            {lang === 'fr' ? 'Plus tard' : 'Later'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {lang === 'fr' ? 'Envoyer' : 'Submit'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientDashboardPage() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('updates');
  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [evolutions, setEvolutions] = useState([]);
  const [satisfaction, setSatisfaction] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Confetti & celebration
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // NPS
  const [showNPS, setShowNPS] = useState(false);

  // Unread badges
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newUpdates, setNewUpdates] = useState(0);
  const [newEvolutions, setNewEvolutions] = useState(0);

  // Évolutions form
  const [showEvoForm, setShowEvoForm] = useState(false);
  const [evoType, setEvoType] = useState('amelioration');
  const [evoTitle, setEvoTitle] = useState('');
  const [evoDescription, setEvoDescription] = useState('');
  const [evoPriority, setEvoPriority] = useState('normale');
  const [submittingEvo, setSubmittingEvo] = useState(false);

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsConfig, setSlotsConfig] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [bookingSlot, setBookingSlot] = useState(null); // {date, time}
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Document review
  const [reviewingDoc, setReviewingDoc] = useState(null); // doc object
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const token = localStorage.getItem('receipty-client-token');
  const clientName = localStorage.getItem('receipty-client-name') || '';
  const clientCompany = localStorage.getItem('receipty-client-company') || '';

  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const logout = () => {
    localStorage.removeItem('receipty-client-token');
    localStorage.removeItem('receipty-client-name');
    localStorage.removeItem('receipty-client-email');
    localStorage.removeItem('receipty-client-company');
    localStorage.removeItem('receipty-celebrated');
    navigate('/client');
  };

  // ── Unread tracking helpers ──────────────────────────────────────────────
  const getLastSeen = (key) => localStorage.getItem(`receipty-lastseen-${key}`) || '1970-01-01';
  const markSeen = (key) => localStorage.setItem(`receipty-lastseen-${key}`, new Date().toISOString());

  const computeUnreads = useCallback((msgs, upds, evos) => {
    const lastMsg = getLastSeen('messages');
    const lastUpd = getLastSeen('updates');
    const lastEvo = getLastSeen('evolutions');
    setUnreadMessages(msgs.filter(m =>
      m.author_type !== 'client' && m.created_at > lastMsg
    ).length);
    setNewUpdates(upds.filter(u => u.created_at > lastUpd).length);
    setNewEvolutions(evos.filter(e => e.updated_at && e.updated_at > lastEvo && e.status !== 'en_attente').length);
  }, []);

  // Get Monday of current week
  const getMondayOfWeek = (offset = 0) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff + offset * 7);
    return d.toISOString().split('T')[0];
  };

  const fetchSlots = useCallback(async (weekStart) => {
    setSlotsLoading(true);
    try {
      const res = await axios.get(`${API}/client/appointments/slots`, {
        headers, params: { week_start: weekStart }
      });
      setAvailableSlots(res.data.slots || []);
      setSlotsConfig(res.data.config || {});
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [headers]);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/client/appointments`, { headers });
      setAppointments(res.data);
    } catch {}
  }, [headers]);

  const fetchAll = useCallback(async () => {
    if (!token) { navigate('/client'); return; }
    try {
      const [profileRes, projectRes, messagesRes, docsRes, updatesRes, evosRes, satRes] = await Promise.all([
        axios.get(`${API}/client/profile`, { headers }),
        axios.get(`${API}/client/project`, { headers }),
        axios.get(`${API}/client/messages`, { headers }),
        axios.get(`${API}/client/documents`, { headers }),
        axios.get(`${API}/client/updates`, { headers }),
        axios.get(`${API}/client/evolutions`, { headers }),
        axios.get(`${API}/client/satisfaction`, { headers }),
      ]);
      setProfile(profileRes.data);
      setProject(projectRes.data);
      setMessages(messagesRes.data);
      setDocuments(docsRes.data);
      setUpdates(updatesRes.data);
      setEvolutions(evosRes.data);
      setSatisfaction(satRes.data);
      computeUnreads(messagesRes.data, updatesRes.data, evosRes.data);

      // Celebration logic — first visit on termine
      const status = projectRes.data?.status;
      if (status === 'termine') {
        const celebKey = 'receipty-celebrated';
        if (!localStorage.getItem(celebKey)) {
          setShowConfetti(true);
          setShowCelebration(true);
          localStorage.setItem(celebKey, '1');
        }
        // NPS — show if not yet submitted and not skipped this session
        if (!satRes.data?.rating && !sessionStorage.getItem('receipty-nps-skipped')) {
          setTimeout(() => setShowNPS(true), 2000);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error(lang === 'fr' ? 'Session expirée. Reconnectez-vous.' : 'Session expired. Please log in again.');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
    fetchAppointments();
    const ws = getMondayOfWeek(0);
    setCurrentWeekStart(ws);
    fetchSlots(ws);
  }, [fetchAll, fetchAppointments, fetchSlots]);

  // Auto-scroll messages
  useEffect(() => {
    if (activeTab === 'messages') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, activeTab]);

  // Mark tab as seen when switching
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    markSeen(tabId);
    if (tabId === 'messages') setUnreadMessages(0);
    if (tabId === 'updates') setNewUpdates(0);
    if (tabId === 'evolutions') setNewEvolutions(0);
  };

  const changeWeek = (offset) => {
    if (!currentWeekStart) return;
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + offset * 7);
    const newWs = d.toISOString().split('T')[0];
    setCurrentWeekStart(newWs);
    fetchSlots(newWs);
  };

  const handleBookSlot = async () => {
    if (!bookingSlot) return;
    setBookingLoading(true);
    try {
      await axios.post(`${API}/client/appointments`, {
        slot_date: bookingSlot.date,
        slot_time: bookingSlot.time,
        notes: bookingNotes.trim()
      }, { headers });
      toast.success(lang === 'fr' ? 'Demande de rendez-vous envoyée !' : 'Appointment request sent!');
      setBookingSlot(null);
      setBookingNotes('');
      await fetchAppointments();
      fetchSlots(currentWeekStart);
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === 'fr' ? 'Erreur lors de la réservation.' : 'Booking failed.'));
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (aptId) => {
    try {
      await axios.delete(`${API}/client/appointments/${aptId}`, { headers });
      toast.success(lang === 'fr' ? 'Rendez-vous annulé.' : 'Appointment cancelled.');
      await fetchAppointments();
      fetchSlots(currentWeekStart);
    } catch {
      toast.error(lang === 'fr' ? 'Erreur annulation.' : 'Cancel failed.');
    }
  };

  const handleReviewDoc = async (action) => {
    if (!reviewingDoc) return;
    setReviewSubmitting(true);
    try {
      await axios.post(`${API}/client/documents/${reviewingDoc.id}/review`, {
        action,
        comment: reviewComment.trim()
      }, { headers });
      toast.success(action === 'approved'
        ? (lang === 'fr' ? 'Livrable validé !' : 'Deliverable approved!')
        : (lang === 'fr' ? 'Corrections demandées.' : 'Corrections requested.')
      );
      setReviewingDoc(null);
      setReviewComment('');
      // Refresh docs
      const res = await axios.get(`${API}/client/documents`, { headers });
      setDocuments(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === 'fr' ? 'Erreur.' : 'Error.'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Auto-refresh messages every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (activeTab === 'messages') {
        try {
          const res = await axios.get(`${API}/client/messages`, { headers });
          setMessages(res.data);
          setUnreadMessages(0);
          markSeen('messages');
        } catch {}
      } else {
        // Silently fetch messages to update badge
        try {
          const res = await axios.get(`${API}/client/messages`, { headers });
          const lastMsg = getLastSeen('messages');
          setUnreadMessages(res.data.filter(m => m.author_type !== 'client' && m.created_at > lastMsg).length);
        } catch {}
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/client/messages`, { content }, { headers });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur lors de l\'envoi.' : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleReaction = async (updateId, emoji) => {
    try {
      const res = await axios.post(`${API}/client/updates/${updateId}/react`, { emoji }, { headers });
      setUpdates(prev => prev.map(u => u.id === updateId ? { ...u, reactions: res.data.reactions } : u));
    } catch {}
  };

  const submitEvolution = async () => {
    if (!evoTitle.trim() || !evoDescription.trim()) {
      toast.error(lang === 'fr' ? 'Titre et description requis' : 'Title and description required');
      return;
    }
    setSubmittingEvo(true);
    try {
      const res = await axios.post(`${API}/client/evolutions`, {
        type: evoType, title: evoTitle.trim(), description: evoDescription.trim(), priority: evoPriority
      }, { headers });
      setEvolutions(prev => [res.data, ...prev]);
      setShowEvoForm(false);
      setEvoTitle(''); setEvoDescription(''); setEvoType('amelioration'); setEvoPriority('normale');
      toast.success(lang === 'fr' ? 'Demande envoyée ! Notre équipe va l\'étudier.' : 'Request sent! Our team will review it.');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur lors de l\'envoi.' : 'Failed to send.');
    } finally {
      setSubmittingEvo(false);
    }
  };

  const submitSatisfaction = async (rating, comment) => {
    try {
      const res = await axios.post(`${API}/client/satisfaction`, { rating, comment }, { headers });
      setSatisfaction(res.data);
      setShowNPS(false);
      toast.success(lang === 'fr' ? 'Merci pour votre retour ! 🙏' : 'Thank you for your feedback! 🙏');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur envoi.' : 'Failed to submit.');
    }
  };

  const skipNPS = () => {
    setShowNPS(false);
    sessionStorage.setItem('receipty-nps-skipped', '1');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  const statusInfo = projectStatuses[project?.status || 'en_attente'];
  const StatusIcon = statusInfo.icon;
  const progressPercent = project?.progress || 0;
  const isDelivered = ['livre', 'termine'].includes(project?.status);

  const UPDATE_TYPE_META = {
    action:    { emoji: '🔨', labelFr: 'En cours',         labelEn: 'In progress',  color: 'text-blue-400',    bg: isDark ? 'bg-blue-500/10'    : 'bg-blue-50',    border: isDark ? 'border-blue-500/20'    : 'border-blue-200' },
    milestone: { emoji: '🎯', labelFr: 'Jalon',            labelEn: 'Milestone',    color: 'text-purple-400',  bg: isDark ? 'bg-purple-500/10'  : 'bg-purple-50',  border: isDark ? 'border-purple-500/20'  : 'border-purple-200' },
    info:      { emoji: '💡', labelFr: 'Information',      labelEn: 'Information',  color: 'text-amber-400',   bg: isDark ? 'bg-amber-500/10'   : 'bg-amber-50',   border: isDark ? 'border-amber-500/20'   : 'border-amber-200' },
    delivery:  { emoji: '🚀', labelFr: 'Livraison',        labelEn: 'Delivery',     color: 'text-emerald-400', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50', border: isDark ? 'border-emerald-500/20' : 'border-emerald-200' },
    next:      { emoji: '⏭️', labelFr: 'Prochaine étape', labelEn: 'Next step',    color: 'text-gray-400',    bg: isDark ? 'bg-gray-500/10'    : 'bg-gray-50',    border: isDark ? 'border-gray-500/20'    : 'border-gray-200' },
  };

  const pendingApprovalCount = documents.filter(d => d.requires_approval && d.approval_status === 'pending').length;

  const tabs = [
    { id: 'updates',      labelFr: 'Journal',       labelEn: 'Journal',       icon: BookOpen,      badge: newUpdates },
    { id: 'messages',     labelFr: 'Messages',      labelEn: 'Messages',      icon: MessageCircle, badge: unreadMessages },
    { id: 'project',      labelFr: 'Mon Projet',    labelEn: 'My Project',    icon: CheckCircle,   badge: 0 },
    { id: 'documents',    labelFr: 'Documents',     labelEn: 'Documents',     icon: FolderOpen,    badge: pendingApprovalCount },
    { id: 'appointment',  labelFr: 'Rendez-vous',   labelEn: 'Appointment',   icon: Calendar,      badge: 0 },
    ...(isDelivered ? [{ id: 'evolutions', labelFr: 'Évolutions', labelEn: 'Evolutions', icon: Sparkles, badge: newEvolutions }] : []),
  ];

  return (
    <div className={`min-h-screen pt-20 transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>

      {/* Confetti */}
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* NPS Modal */}
      {showNPS && (
        <NPSModal
          isDark={isDark}
          lang={lang}
          onSubmit={submitSatisfaction}
          onSkip={skipNPS}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-600`}>
              {clientName?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className={`font-heading text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Bonjour,' : 'Hello,'} {clientName}
              </h1>
              {clientCompany && (
                <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <Building2 className="w-3 h-3" />
                  {clientCompany}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Satisfaction stars (if submitted) */}
            {satisfaction?.rating && (
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= satisfaction.rating ? 'text-amber-400 fill-amber-400' : isDark ? 'text-gray-700' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={logout}
              className={`flex items-center gap-2 text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'fr' ? 'Déconnexion' : 'Sign out'}</span>
            </button>
          </div>
        </div>

        {/* Celebration banner */}
        {showCelebration && <CelebrationBanner isDark={isDark} lang={lang} />}

        {/* Project status banner */}
        <div className={`rounded-2xl border p-5 mb-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusInfo.bg}`}>
                <StatusIcon className={`w-5 h-5 ${statusInfo.color} ${project?.status === 'en_cours' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? statusInfo.labelFr : statusInfo.labelEn}
                </p>
                {project?.description && (
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <span className={`font-mono text-2xl font-bold ${statusInfo.color}`}>
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-2 rounded-full ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-gray-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${
                project?.status === 'termine'
                  ? 'from-emerald-500 to-emerald-400'
                  : 'from-blue-500 to-blue-400'
              }`}
            />
          </div>

          {/* Steps */}
          <div className="flex justify-between mt-3">
            {Object.entries(projectStatuses).map(([key, info]) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  info.step < statusInfo.step
                    ? 'bg-emerald-400'
                    : info.step === statusInfo.step
                      ? statusInfo.color.replace('text-', 'bg-')
                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
                <span className={`text-[10px] hidden md:block ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {lang === 'fr' ? info.labelFr.split(' ')[0] : info.labelEn.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Project notes (if any) */}
          {project?.notes && (
            <div className={`mt-4 pt-4 border-t flex gap-2 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <StickyNote className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {project.notes}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto ${isDark ? 'bg-[var(--bg-secondary)]' : 'bg-white border border-gray-200 shadow-sm'}`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all relative ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'fr' ? tab.labelFr : tab.labelEn}</span>
                {tab.badge > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                  }`}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* === TAB: JOURNAL === */}
        {activeTab === 'updates' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {updates.length === 0 ? (
              <div className={`rounded-2xl border p-16 text-center ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <BookOpen className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? 'Votre journal de projet est vide pour l\'instant.' : 'Your project journal is empty for now.'}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {lang === 'fr' ? 'Votre équipe publiera bientôt des mises à jour ici.' : 'Your team will publish updates here soon.'}
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className={`absolute left-[27px] top-6 bottom-6 w-px ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
                <div className="space-y-4">
                  {updates.map((upd, i) => {
                    const meta = UPDATE_TYPE_META[upd.type] || UPDATE_TYPE_META.info;
                    const reactions = upd.reactions || {};
                    return (
                      <motion.div
                        key={upd.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative flex gap-4"
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-xl border ${meta.bg} ${meta.border}`}>
                          {meta.emoji}
                        </div>

                        {/* Card */}
                        <div className={`flex-1 rounded-2xl border p-4 ${meta.bg} ${meta.border}`}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${meta.color} ${isDark ? 'bg-white/5' : 'bg-white/60'}`}>
                                {lang === 'fr' ? meta.labelFr : meta.labelEn}
                              </span>
                              <h3 className={`text-sm font-semibold leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {upd.title}
                              </h3>
                            </div>
                            <p className={`text-[11px] flex-shrink-0 mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                              {upd.created_at ? new Date(upd.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            </p>
                          </div>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {upd.content}
                          </p>

                          {/* Footer: author + reactions */}
                          <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-2.5 h-2.5 text-blue-400" />
                              </div>
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {upd.author_name} · {upd.created_at ? new Date(upd.created_at).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>

                            {/* Reactions */}
                            <div className="flex items-center gap-1">
                              {REACTIONS.map(emoji => {
                                const reactors = reactions[emoji] || [];
                                const hasReacted = reactors.length > 0; // simplified — no client_id in storage
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(upd.id, emoji)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                                      reactors.length > 0
                                        ? isDark ? 'bg-white/10 border border-white/20' : 'bg-white/80 border border-gray-200 shadow-sm'
                                        : isDark ? 'hover:bg-white/5' : 'hover:bg-white/60'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    {reactors.length > 0 && (
                                      <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {reactors.length}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* === TAB: MESSAGES === */}
        {activeTab === 'messages' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border flex flex-col ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}
            style={{ height: '520px' }}
          >
            <div className={`p-4 border-b flex items-center gap-3 ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Équipe Receipty' : 'Receipty Team'}
                </p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                  {lang === 'fr' ? 'En ligne — répond en quelques heures' : 'Online — responds within hours'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {lang === 'fr' ? 'Aucun message pour le moment.' : 'No messages yet.'}
                  </p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isClient = msg.author_type === 'client';
                const isSystem = msg.author_type === 'system';
                if (isSystem) {
                  return (
                    <div key={msg.id || i} className="flex justify-center">
                      <div className={`rounded-xl px-4 py-3 max-w-[85%] text-sm ${isDark ? 'bg-blue-600/10 border border-blue-500/20 text-blue-300' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                        <p className="leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }} />
                        <p className="text-[10px] mt-1 opacity-50">{formatDate(msg.created_at, lang)}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id || i} className={`flex gap-2 ${isClient ? 'justify-end' : 'justify-start'}`}>
                    {!isClient && (
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 max-w-[75%] ${
                      isClient
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : isDark ? 'bg-[var(--bg-tertiary)] text-gray-200 rounded-tl-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {!isClient && (
                        <p className="text-xs font-medium text-blue-400 mb-1">{msg.author_name}</p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }} />
                      <p className={`text-[10px] mt-1 ${isClient ? 'opacity-70' : 'opacity-50'}`}>
                        {formatDate(msg.created_at, lang)}
                      </p>
                    </div>
                    {isClient && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white bg-blue-600">
                        {clientName?.charAt(0) || 'C'}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className={`p-3 border-t ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={lang === 'fr' ? 'Votre message... (Entrée pour envoyer)' : 'Your message... (Enter to send)'}
                  rows={1}
                  maxLength={2000}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm resize-none outline-none transition-all ${
                    isDark
                      ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-400'
                  }`}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white flex items-center justify-center transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* === TAB: PROJECT === */}
        {activeTab === 'project' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Avancement du projet' : 'Project progress'}
              </h2>
              <div className="space-y-2">
                {Object.entries(projectStatuses).map(([key, info]) => {
                  const isActive = key === project?.status;
                  const isDone = info.step < statusInfo.step;
                  const Icon = info.icon;
                  return (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isActive ? `${info.bg} border ${isDark ? 'border-[var(--border-secondary)]' : 'border-gray-200'}` : ''
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone ? 'bg-emerald-500/20' : isActive ? info.bg : isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-gray-100'
                      }`}>
                        {isDone
                          ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                          : <Icon className={`w-4 h-4 ${isActive ? info.color : isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        }
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isActive ? info.color : isDone ? 'text-emerald-400' : isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {lang === 'fr' ? info.labelFr : info.labelEn}
                        </p>
                      </div>
                      {isActive && <ChevronRight className={`w-4 h-4 ${info.color}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones from journal */}
            {updates.filter(u => u.type === 'milestone').length > 0 && (
              <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`font-heading text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span>🎯</span> {lang === 'fr' ? 'Jalons atteints' : 'Milestones reached'}
                </h2>
                <div className="space-y-2">
                  {updates.filter(u => u.type === 'milestone').map((upd, i) => (
                    <div key={upd.id || i} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'}`}>
                      <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{upd.title}</p>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {upd.created_at ? new Date(upd.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile info */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Vos informations' : 'Your information'}
              </h2>
              <div className="space-y-3">
                {[
                  { icon: User, label: lang === 'fr' ? 'Nom' : 'Name', value: profile?.name },
                  { icon: Building2, label: lang === 'fr' ? 'Société' : 'Company', value: profile?.company },
                ].filter(item => item.value).map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
                      <span className={`text-sm font-medium ml-auto ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* === TAB: DOCUMENTS === */}
        {activeTab === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
                <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Documents partagés' : 'Shared documents'}
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {lang === 'fr' ? 'Documents partagés par votre équipe Receipty' : 'Documents shared by your Receipty team'}
                </p>
              </div>
              {documents.length === 0 ? (
                <div className="p-16 text-center">
                  <FolderOpen className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {lang === 'fr' ? 'Aucun document partagé pour le moment.' : 'No documents shared yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-primary)]">
                  {documents.map((doc, i) => {
                    const needsApproval = doc.requires_approval;
                    const approvalStatus = doc.approval_status;
                    const isPending = needsApproval && approvalStatus === 'pending';
                    const isApproved = approvalStatus === 'approved';
                    const isCorrections = approvalStatus === 'corrections_requested';

                    return (
                      <motion.div
                        key={doc.id || i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 ${isDark ? 'hover:bg-[var(--bg-hover)]' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{needsApproval ? '📦' : (docTypeIcons[doc.doc_type] || '📎')}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.name}</p>
                              {isPending && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                                  {lang === 'fr' ? '⏳ En attente' : '⏳ Pending'}
                                </span>
                              )}
                              {isApproved && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                                  ✅ {lang === 'fr' ? 'Validé' : 'Approved'}
                                </span>
                              )}
                              {isCorrections && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex-shrink-0">
                                  ✏️ {lang === 'fr' ? 'Corrections demandées' : 'Corrections requested'}
                                </span>
                              )}
                            </div>
                            {doc.description && (
                              <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{doc.description}</p>
                            )}
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                              {lang === 'fr' ? 'Partagé par' : 'Shared by'} {doc.uploaded_by} · {formatDate(doc.uploaded_at, lang)}
                            </p>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg transition-all flex-shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {lang === 'fr' ? 'Ouvrir' : 'Open'}
                          </a>
                        </div>

                        {/* Approval block */}
                        {isPending && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className={`mt-3 pt-3 border-t ${isDark ? 'border-amber-500/20' : 'border-amber-200'}`}
                          >
                            <p className={`text-xs mb-3 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                              {lang === 'fr'
                                ? '📋 Ce livrable nécessite votre validation. Consultez-le et donnez votre réponse.'
                                : '📋 This deliverable requires your approval. Review it and share your response.'}
                            </p>
                            {reviewingDoc?.id === doc.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={reviewComment}
                                  onChange={e => setReviewComment(e.target.value)}
                                  placeholder={lang === 'fr' ? 'Votre commentaire (optionnel)...' : 'Your comment (optional)...'}
                                  rows={2}
                                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none resize-none transition-all ${
                                    isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500/50' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-amber-400'
                                  }`}
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleReviewDoc('approved')}
                                    disabled={reviewSubmitting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    {lang === 'fr' ? 'Valider' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleReviewDoc('corrections')}
                                    disabled={reviewSubmitting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {lang === 'fr' ? 'Demander corrections' : 'Request changes'}
                                  </button>
                                  <button
                                    onClick={() => { setReviewingDoc(null); setReviewComment(''); }}
                                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setReviewingDoc(doc); setReviewComment(''); }}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-medium rounded-xl transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                {lang === 'fr' ? 'Répondre à ce livrable' : 'Respond to this deliverable'}
                              </button>
                            )}
                          </motion.div>
                        )}

                        {/* Comment display if corrections were requested */}
                        {isCorrections && doc.approval_comment && (
                          <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-orange-500/10 text-orange-300' : 'bg-orange-50 text-orange-700'}`}>
                            💬 {doc.approval_comment}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* === TAB: ÉVOLUTIONS === */}
        {activeTab === 'evolutions' && isDelivered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header card */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className={`font-heading text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {lang === 'fr' ? 'Demandes d\'évolution' : 'Evolution requests'}
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {lang === 'fr'
                        ? 'Proposez des améliorations, nouvelles fonctionnalités ou corrections. Notre équipe les étudiera et vous répondra.'
                        : 'Suggest improvements, new features or bug fixes. Our team will review them and respond.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEvoForm(f => !f)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all flex-shrink-0"
                >
                  {showEvoForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {lang === 'fr' ? 'Nouvelle demande' : 'New request'}
                </button>
              </div>
            </div>

            {/* Evolution form */}
            <AnimatePresence>
              {showEvoForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}
                >
                  <div className="p-6 space-y-4">
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {lang === 'fr' ? 'Décrire votre demande' : 'Describe your request'}
                    </h3>

                    {/* Type selector */}
                    <div>
                      <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lang === 'fr' ? 'Type de demande' : 'Request type'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {EVOLUTION_TYPES.map(t => (
                          <button
                            key={t.value}
                            onClick={() => setEvoType(t.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                              evoType === t.value
                                ? `${t.color} ${t.bg} ${t.border}`
                                : isDark ? 'border-white/10 text-gray-500 hover:border-white/20' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            <span>{t.emoji}</span>
                            {lang === 'fr' ? t.labelFr : t.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lang === 'fr' ? 'Priorité' : 'Priority'}
                      </label>
                      <div className="flex gap-2">
                        {EVOLUTION_PRIORITIES.map(p => (
                          <button
                            key={p.value}
                            onClick={() => setEvoPriority(p.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              evoPriority === p.value
                                ? `${p.color} border-current bg-current/10`
                                : isDark ? 'border-white/10 text-gray-500 hover:border-white/20' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                            }`}
                          >
                            {lang === 'fr' ? p.labelFr : p.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lang === 'fr' ? 'Titre' : 'Title'} *
                      </label>
                      <input
                        type="text"
                        value={evoTitle}
                        onChange={e => setEvoTitle(e.target.value)}
                        placeholder={lang === 'fr' ? 'Résumez votre demande en quelques mots...' : 'Summarize your request in a few words...'}
                        maxLength={200}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${
                          isDark
                            ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                            : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-400'
                        }`}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lang === 'fr' ? 'Description détaillée' : 'Detailed description'} *
                      </label>
                      <textarea
                        value={evoDescription}
                        onChange={e => setEvoDescription(e.target.value)}
                        placeholder={lang === 'fr'
                          ? 'Expliquez en détail ce que vous souhaitez : comportement actuel, comportement attendu, contexte d\'utilisation...'
                          : 'Explain in detail what you want: current behavior, expected behavior, usage context...'}
                        rows={4}
                        maxLength={2000}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all ${
                          isDark
                            ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-white placeholder:text-gray-600 focus:border-blue-500/50'
                            : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-400'
                        }`}
                      />
                      <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {evoDescription.length}/2000
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowEvoForm(false)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        {lang === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                      <button
                        onClick={submitEvolution}
                        disabled={submittingEvo || !evoTitle.trim() || !evoDescription.trim()}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-all"
                      >
                        {submittingEvo ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <Send className="w-4 h-4" />}
                        {lang === 'fr' ? 'Envoyer la demande' : 'Send request'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Evolutions list */}
            {evolutions.length === 0 && !showEvoForm ? (
              <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <Sparkles className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? 'Aucune demande pour l\'instant.' : 'No requests yet.'}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {lang === 'fr' ? 'Cliquez sur "Nouvelle demande" pour soumettre une amélioration.' : 'Click "New request" to submit an improvement.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evolutions.map((evo, i) => {
                  const typeInfo = EVOLUTION_TYPES.find(t => t.value === evo.type) || EVOLUTION_TYPES[1];
                  const statusInfo = EVOLUTION_STATUSES[evo.status] || EVOLUTION_STATUSES.en_attente;
                  const priorityInfo = EVOLUTION_PRIORITIES.find(p => p.value === evo.priority) || EVOLUTION_PRIORITIES[1];

                  return (
                    <motion.div
                      key={evo.id || i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`rounded-2xl border p-5 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{typeInfo.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {evo.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Priority badge */}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityInfo.color} ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {lang === 'fr' ? priorityInfo.labelFr : priorityInfo.labelEn}
                              </span>
                              {/* Status badge */}
                              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusInfo.color} ${statusInfo.bg}`}>
                                {lang === 'fr' ? statusInfo.labelFr : statusInfo.labelEn}
                              </span>
                            </div>
                          </div>

                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {evo.description}
                          </p>

                          {/* Admin response */}
                          {evo.admin_response && (
                            <div className={`mt-3 p-3 rounded-xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className="w-4 h-4 rounded-full bg-blue-600/20 flex items-center justify-center">
                                  <MessageCircle className="w-2.5 h-2.5 text-blue-400" />
                                </div>
                                <span className="text-xs font-semibold text-blue-400">
                                  {lang === 'fr' ? 'Réponse de l\'équipe' : 'Team response'}
                                </span>
                              </div>
                              <p className={`text-xs leading-relaxed ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                                {evo.admin_response}
                              </p>
                            </div>
                          )}

                          <p className={`text-[11px] mt-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {lang === 'fr' ? 'Soumise le' : 'Submitted on'} {evo.created_at ? new Date(evo.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                            {evo.updated_at && ` · ${lang === 'fr' ? 'Mis à jour' : 'Updated'} ${new Date(evo.updated_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* === TAB: RENDEZ-VOUS === */}
        {activeTab === 'appointment' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Upcoming appointments */}
            {appointments.filter(a => a.status !== 'cancelled').length > 0 && (
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h2 className={`font-heading text-base font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Calendar className="w-4 h-4 text-blue-400" />
                  {lang === 'fr' ? 'Mes rendez-vous' : 'My appointments'}
                </h2>
                <div className="space-y-3">
                  {appointments.filter(a => a.status !== 'cancelled').map(apt => {
                    const statusColors = {
                      pending:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   label: lang === 'fr' ? '⏳ En attente' : '⏳ Pending' },
                      confirmed: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: lang === 'fr' ? '✅ Confirmé' : '✅ Confirmed' },
                      cancelled: { bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400',     label: lang === 'fr' ? '❌ Annulé' : '❌ Cancelled' },
                    };
                    const s = statusColors[apt.status] || statusColors.pending;
                    return (
                      <div key={apt.id} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className={`w-4 h-4 ${s.text}`} />
                              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {new Date(apt.slot_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {apt.slot_time}
                              </span>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}>{s.label}</span>
                            {apt.notes && <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>📝 {apt.notes}</p>}
                            {apt.admin_notes && <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>💬 {apt.admin_notes}</p>}
                            {apt.meeting_link && (
                              <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                                <Video className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Rejoindre la réunion' : 'Join meeting'}
                              </a>
                            )}
                          </div>
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleCancelAppointment(apt.id)}
                              className={`text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                            >
                              <XCircle className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Annuler' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slot booking */}
            {!appointments.find(a => ['pending', 'confirmed'].includes(a.status) && a.slot_date >= new Date().toISOString().split('T')[0]) ? (
              <div className={`rounded-2xl border ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className={`p-5 border-b ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                        <Calendar className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className={`font-heading text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {lang === 'fr' ? 'Prendre un rendez-vous' : 'Book an appointment'}
                        </h2>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {lang === 'fr' ? 'Choisissez un créneau disponible' : 'Choose an available time slot'}
                        </p>
                      </div>
                    </div>
                    {/* Week navigation */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeWeek(-1)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {currentWeekStart ? new Date(currentWeekStart + 'T00:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' }) : ''}
                      </span>
                      <button onClick={() => changeWeek(1)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {slotsLoading ? (
                    <div className="py-8 text-center">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-8 text-center">
                      <Calendar className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {lang === 'fr' ? 'Aucun créneau disponible cette semaine.' : 'No available slots this week.'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Group slots by date */}
                      {Object.entries(
                        availableSlots.reduce((acc, slot) => {
                          if (!acc[slot.date]) acc[slot.date] = [];
                          acc[slot.date].push(slot.time);
                          return acc;
                        }, {})
                      ).map(([date, times]) => (
                        <div key={date} className="mb-4">
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(date + 'T00:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {times.map(time => {
                              const isSelected = bookingSlot?.date === date && bookingSlot?.time === time;
                              return (
                                <button
                                  key={time}
                                  onClick={() => setBookingSlot(isSelected ? null : { date, time })}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-500'
                                      : isDark
                                        ? 'bg-white/5 text-gray-300 border-white/10 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Booking form */}
                  <AnimatePresence>
                    {bookingSlot && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mt-4 pt-4 border-t space-y-3 ${isDark ? 'border-white/10' : 'border-gray-100'}`}
                      >
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          📅 {new Date(bookingSlot.date + 'T00:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })} à {bookingSlot.time}
                        </p>
                        <textarea
                          value={bookingNotes}
                          onChange={e => setBookingNotes(e.target.value)}
                          placeholder={lang === 'fr' ? 'Notes pour l\'équipe (optionnel)...' : 'Notes for the team (optional)...'}
                          rows={2}
                          className={`w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all ${
                            isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-400'
                          }`}
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleBookSlot}
                            disabled={bookingLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                          >
                            {bookingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                            {lang === 'fr' ? 'Confirmer le rendez-vous' : 'Confirm appointment'}
                          </button>
                          <button
                            onClick={() => { setBookingSlot(null); setBookingNotes(''); }}
                            className={`text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
                          >
                            {lang === 'fr' ? 'Annuler' : 'Cancel'}
                          </button>
                        </div>
                        {slotsConfig?.meeting_link && (
                          <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Video className="w-3 h-3" /> {lang === 'fr' ? 'La réunion se fera via' : 'Meeting via'}: <span className="text-blue-400">{slotsConfig.meeting_link}</span>
                          </p>
                        )}
                        {slotsConfig?.notes && (
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ℹ️ {slotsConfig.notes}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className={`rounded-2xl border p-5 text-center ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <Calendar className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Vous avez déjà un rendez-vous à venir.' : 'You already have an upcoming appointment.'}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {lang === 'fr' ? 'Annulez-le ci-dessus si vous souhaitez en choisir un autre.' : 'Cancel it above if you\'d like to reschedule.'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
