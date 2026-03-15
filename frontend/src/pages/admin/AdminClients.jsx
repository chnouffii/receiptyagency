import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Send, FileUp, Trash2, X,
  MessageCircle, FolderOpen, BarChart2, CheckCircle, Clock,
  Eye, ExternalLink, User, Building, Mail, Lock, AlertCircle,
  BookOpen, Zap, Flag, Rocket, ArrowRight, Pencil, Sparkles, Star,
  Calendar, Settings, ChevronLeft, ChevronRight, Video, RefreshCw,
  XCircle, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PROJECT_STATUSES = [
  { value: 'en_attente', labelFr: 'En attente', labelEn: 'Pending', color: 'text-gray-400' },
  { value: 'en_cours', labelFr: 'En cours', labelEn: 'In Progress', color: 'text-blue-400' },
  { value: 'revue', labelFr: 'En revue', labelEn: 'In Review', color: 'text-yellow-400' },
  { value: 'livre', labelFr: 'Livré', labelEn: 'Delivered', color: 'text-emerald-400' },
  { value: 'termine', labelFr: 'Terminé', labelEn: 'Completed', color: 'text-purple-400' },
];

const DOC_TYPES = ['document', 'devis', 'contrat', 'rapport', 'livrable'];
const DOC_EMOJIS = { document: '📄', devis: '💰', contrat: '📝', rapport: '📊', livrable: '📦' };

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const UPDATE_TYPES = [
  { value: 'action',    emoji: '🔨', labelFr: 'Ce qu\'on fait',      labelEn: 'What we\'re doing',  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { value: 'milestone', emoji: '🎯', labelFr: 'Jalon',               labelEn: 'Milestone',          color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { value: 'info',      emoji: '💡', labelFr: 'Information',         labelEn: 'Information',        color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  { value: 'delivery',  emoji: '🚀', labelFr: 'Livraison',           labelEn: 'Delivery',           color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
  { value: 'next',      emoji: '⏭️', labelFr: 'Prochaine étape',    labelEn: 'Next step',          color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
];

const EVOLUTION_TYPES_ADMIN = [
  { value: 'bug',           emoji: '🐛', labelFr: 'Bug',             labelEn: 'Bug',         color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  { value: 'amelioration',  emoji: '✨', labelFr: 'Amélioration',    labelEn: 'Improvement', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { value: 'fonctionnalite',emoji: '🚀', labelFr: 'Nouvelle feature','labelEn': 'New feature',color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

const EVOLUTION_STATUSES_ADMIN = [
  { value: 'en_attente', labelFr: 'En attente',    labelEn: 'Pending',      color: 'text-gray-400' },
  { value: 'en_etude',   labelFr: 'En étude',      labelEn: 'Under review', color: 'text-amber-400' },
  { value: 'planifie',   labelFr: 'Planifiée',     labelEn: 'Planned',      color: 'text-blue-400' },
  { value: 'en_cours',   labelFr: 'En cours',      labelEn: 'In progress',  color: 'text-purple-400' },
  { value: 'livre',      labelFr: 'Livrée',        labelEn: 'Delivered',    color: 'text-emerald-400' },
  { value: 'refuse',     labelFr: 'Refusée',       labelEn: 'Declined',     color: 'text-red-400' },
];

export default function AdminClients({ token, isDark }) {
  const { lang } = useLanguage();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activePanel, setActivePanel] = useState('messages'); // messages | project | documents | journal | evolutions | appointments
  const [showCreate, setShowCreate] = useState(false);
  const [leads, setLeads] = useState([]);

  // Message state
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);

  // Document state
  const [documents, setDocuments] = useState([]);
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('document');
  const [addingDoc, setAddingDoc] = useState(false);

  // Project state
  const [projectStatus, setProjectStatus] = useState('en_attente');
  const [projectProgress, setProjectProgress] = useState(0);
  const [projectNotes, setProjectNotes] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const [projectData, setProjectData] = useState(null);

  // Journal / Updates state
  const [updates, setUpdates] = useState([]);
  const [updateType, setUpdateType] = useState('action');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [addingUpdate, setAddingUpdate] = useState(false);

  // Evolutions state
  const [evolutions, setEvolutions] = useState([]);
  const [editingEvo, setEditingEvo] = useState(null); // {id, status, response}
  const [savingEvo, setSavingEvo] = useState(false);

  // Satisfaction state
  const [satisfaction, setSatisfaction] = useState(null);

  // Appointments state
  const [allAppointments, setAllAppointments] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState({
    working_days: [0, 1, 2, 3, 4],
    start_time: '09:00',
    end_time: '18:00',
    slot_duration: 30,
    meeting_link: '',
    notes: ''
  });
  const [updatingApt, setUpdatingApt] = useState(null);
  const [aptMeetingLink, setAptMeetingLink] = useState('');
  const [aptAdminNotes, setAptAdminNotes] = useState('');

  // Document requires_approval state
  const [docRequiresApproval, setDocRequiresApproval] = useState(false);

  // Create client form
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', lead_id: '' });
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchClients = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/clients`, { headers });
      setClients(res.data);
    } catch {
      toast.error(lang === 'fr' ? 'Erreur chargement clients' : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/leads`, { headers });
      setLeads(res.data);
    } catch {}
  }, [token]);

  const fetchAllAppointments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/appointments`, { headers });
      setAllAppointments(res.data);
    } catch {}
  }, [token]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/appointments/availability`, { headers });
      setAvailability(res.data);
      setAvailabilityForm({
        working_days: res.data.working_days ?? [0, 1, 2, 3, 4],
        start_time: res.data.start_time || '09:00',
        end_time: res.data.end_time || '18:00',
        slot_duration: res.data.slot_duration || 30,
        meeting_link: res.data.meeting_link || '',
        notes: res.data.notes || ''
      });
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchClients();
    fetchLeads();
    fetchAllAppointments();
    fetchAvailability();
  }, [fetchClients, fetchLeads, fetchAllAppointments, fetchAvailability]);

  const fetchMessages = useCallback(async (clientId) => {
    try {
      const res = await axios.get(`${API}/admin/clients/${clientId}/messages`, { headers });
      setMessages(res.data);
    } catch {}
  }, [token]);

  const fetchDocuments = useCallback(async (clientId) => {
    try {
      const res = await axios.get(`${API}/admin/clients/${clientId}/documents`, { headers });
      setDocuments(res.data);
    } catch {}
  }, [token]);

  const fetchProject = useCallback(async (clientId) => {
    try {
      const res = await axios.get(`${API}/admin/clients/${clientId}/project`, { headers });
      setProjectData(res.data);
      setProjectStatus(res.data.status || 'en_attente');
      setProjectProgress(res.data.progress || 0);
      setProjectNotes(res.data.notes || '');
    } catch {}
  }, [token]);

  const fetchUpdates = useCallback(async (clientId) => {
    try {
      const res = await axios.get(`${API}/admin/clients/${clientId}/updates`, { headers });
      setUpdates(res.data);
    } catch {}
  }, [token]);

  const fetchEvolutions = useCallback(async (clientId) => {
    try {
      const res = await axios.get(`${API}/admin/clients/${clientId}/evolutions`, { headers });
      setEvolutions(res.data);
    } catch {}
  }, [token]);

  const fetchSatisfaction = useCallback(async (clientId) => {
    try {
      const res = await axios.get(`${API}/admin/clients/${clientId}/satisfaction`, { headers });
      setSatisfaction(res.data?.rating ? res.data : null);
    } catch {}
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectClient = (client) => {
    setSelectedClient(client);
    setActivePanel('messages');
    setEditingEvo(null);
    // Reset stale data from previous client
    setMessages([]);
    setDocuments([]);
    setUpdates([]);
    setEvolutions([]);
    setSatisfaction(null);
    setProjectData(null);
    setMsgInput('');
    fetchMessages(client.id);
    fetchDocuments(client.id);
    fetchProject(client.id);
    fetchUpdates(client.id);
    fetchEvolutions(client.id);
    fetchSatisfaction(client.id);
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      await axios.put(`${API}/admin/appointments/availability`, availabilityForm, { headers });
      toast.success(lang === 'fr' ? 'Disponibilités mises à jour !' : 'Availability updated!');
      await fetchAvailability();
    } catch {
      toast.error(lang === 'fr' ? 'Erreur sauvegarde' : 'Save failed');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleUpdateAppointment = async (aptId, status) => {
    setUpdatingApt(aptId);
    try {
      await axios.patch(`${API}/admin/appointments/${aptId}`, {
        status,
        admin_notes: aptAdminNotes.trim(),
        meeting_link: aptMeetingLink.trim()
      }, { headers });
      toast.success(status === 'confirmed'
        ? (lang === 'fr' ? 'Rendez-vous confirmé !' : 'Appointment confirmed!')
        : (lang === 'fr' ? 'Rendez-vous annulé.' : 'Appointment cancelled.'));
      setAptAdminNotes('');
      setAptMeetingLink('');
      await fetchAllAppointments();
    } catch {
      toast.error(lang === 'fr' ? 'Erreur' : 'Error');
    } finally {
      setUpdatingApt(null);
    }
  };

  const handleDeleteAppointment = async (aptId) => {
    try {
      await axios.delete(`${API}/admin/appointments/${aptId}`, { headers });
      toast.success(lang === 'fr' ? 'Supprimé' : 'Deleted');
      await fetchAllAppointments();
    } catch {
      toast.error(lang === 'fr' ? 'Erreur suppression' : 'Delete failed');
    }
  };

  const toggleWorkingDay = (day) => {
    setAvailabilityForm(f => ({
      ...f,
      working_days: f.working_days.includes(day)
        ? f.working_days.filter(d => d !== day)
        : [...f.working_days, day].sort()
    }));
  };

  const handleAddUpdate = async () => {
    if (!updateTitle.trim() || !updateContent.trim()) {
      toast.error(lang === 'fr' ? 'Titre et contenu requis' : 'Title and content required');
      return;
    }
    setAddingUpdate(true);
    try {
      await axios.post(`${API}/admin/clients/${selectedClient.id}/updates`, {
        type: updateType, title: updateTitle.trim(), content: updateContent.trim()
      }, { headers });
      setUpdateTitle(''); setUpdateContent(''); setUpdateType('action');
      await fetchUpdates(selectedClient.id);
      toast.success(lang === 'fr' ? 'Mise à jour publiée !' : 'Update published!');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur publication' : 'Failed to publish');
    } finally {
      setAddingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    try {
      await axios.delete(`${API}/admin/clients/${selectedClient.id}/updates/${updateId}`, { headers });
      await fetchUpdates(selectedClient.id);
    } catch {
      toast.error(lang === 'fr' ? 'Erreur suppression' : 'Delete failed');
    }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || sendingMsg || !selectedClient) return;
    const text = msgInput.trim();
    setMsgInput('');
    setSendingMsg(true);
    try {
      await axios.post(`${API}/admin/clients/${selectedClient.id}/messages`, { content: text }, { headers });
      await fetchMessages(selectedClient.id);
    } catch {
      toast.error(lang === 'fr' ? 'Erreur envoi message' : 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAddDoc = async () => {
    if (!docName.trim() || !docUrl.trim()) {
      toast.error(lang === 'fr' ? 'Nom et URL requis' : 'Name and URL required');
      return;
    }
    setAddingDoc(true);
    try {
      await axios.post(`${API}/admin/clients/${selectedClient.id}/documents`, {
        name: docName.trim(), url: docUrl.trim(), doc_type: docType, requires_approval: docRequiresApproval
      }, { headers });
      setDocName(''); setDocUrl(''); setDocType('document'); setDocRequiresApproval(false);
      await fetchDocuments(selectedClient.id);
      toast.success(lang === 'fr' ? 'Document partagé !' : 'Document shared!');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur partage document' : 'Failed to share document');
    } finally {
      setAddingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await axios.delete(`${API}/admin/clients/${selectedClient.id}/documents/${docId}`, { headers });
      await fetchDocuments(selectedClient.id);
      toast.success(lang === 'fr' ? 'Document supprimé' : 'Document deleted');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur suppression' : 'Delete failed');
    }
  };

  const handleSaveProject = async () => {
    setSavingProject(true);
    try {
      await axios.patch(`${API}/admin/clients/${selectedClient.id}/project`, {
        status: projectStatus, progress: Number(projectProgress), notes: projectNotes
      }, { headers });
      toast.success(lang === 'fr' ? 'Projet mis à jour !' : 'Project updated!');
      await fetchProject(selectedClient.id);
    } catch {
      toast.error(lang === 'fr' ? 'Erreur mise à jour projet' : 'Failed to update project');
    } finally {
      setSavingProject(false);
    }
  };

  const handleSaveEvolution = async (evoId) => {
    if (!editingEvo) return;
    setSavingEvo(true);
    try {
      await axios.patch(`${API}/admin/clients/${selectedClient.id}/evolutions/${evoId}`, {
        status: editingEvo.status,
        admin_response: editingEvo.response || ''
      }, { headers });
      await fetchEvolutions(selectedClient.id);
      setEditingEvo(null);
      toast.success(lang === 'fr' ? 'Évolution mise à jour !' : 'Evolution updated!');
    } catch {
      toast.error(lang === 'fr' ? 'Erreur mise à jour' : 'Update failed');
    } finally {
      setSavingEvo(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error(lang === 'fr' ? 'Nom, email et mot de passe requis' : 'Name, email and password required');
      return;
    }
    setCreating(true);
    try {
      await axios.post(`${API}/admin/clients`, form, { headers });
      toast.success(lang === 'fr' ? 'Compte client créé !' : 'Client account created!');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', company: '', lead_id: '' });
      await fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.detail || (lang === 'fr' ? 'Erreur création compte' : 'Failed to create account'));
    } finally {
      setCreating(false);
    }
  };

  const cardClass = isDark
    ? 'bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
    : 'bg-white border border-gray-200 shadow-sm';

  const inputClass = isDark
    ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] placeholder:text-gray-600 focus:border-blue-500/50'
    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-400';

  const labelClass = isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-lg font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
            {lang === 'fr' ? 'Espace Clients' : 'Client Portal'}
          </h2>
          <span className={`text-sm px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
            {clients.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          {lang === 'fr' ? 'Créer un compte client' : 'Create Client Account'}
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-2xl p-6 ${cardClass}`}
          >
            <h3 className={`font-semibold mb-4 ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
              {lang === 'fr' ? 'Nouveau compte client' : 'New Client Account'}
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelClass}`}>
                  <User className="w-3 h-3 inline mr-1" />{lang === 'fr' ? 'Nom complet' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelClass}`}>
                  <Mail className="w-3 h-3 inline mr-1" />Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="client@exemple.com"
                  className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelClass}`}>
                  <Lock className="w-3 h-3 inline mr-1" />{lang === 'fr' ? 'Mot de passe' : 'Password'} *
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={lang === 'fr' ? 'Mot de passe temporaire' : 'Temporary password'}
                  className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${labelClass}`}>
                  <Building className="w-3 h-3 inline mr-1" />{lang === 'fr' ? 'Entreprise' : 'Company'}
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Acme Corp"
                  className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-xs font-medium mb-1 ${labelClass}`}>
                  {lang === 'fr' ? 'Lier à un lead existant (optionnel)' : 'Link to existing lead (optional)'}
                </label>
                <select
                  value={form.lead_id}
                  onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                >
                  <option value="">{lang === 'fr' ? '— Aucun —' : '— None —'}</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} — {lead.email} {lead.company ? `(${lead.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                >
                  {creating ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Plus className="w-4 h-4" />}
                  {lang === 'fr' ? 'Créer le compte' : 'Create Account'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className={`rounded-2xl p-4 ${cardClass} lg:col-span-1 space-y-2`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {lang === 'fr' ? 'Aucun client pour l\'instant' : 'No clients yet'}
              </p>
            </div>
          ) : (
            clients.map(client => (
              <button
                key={client.id}
                onClick={() => selectClient(client)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  selectedClient?.id === client.id
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : isDark
                      ? 'hover:bg-white/5 border border-transparent'
                      : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                      {client.name}
                    </p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {client.company || client.email}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ml-2 ${
                    client.unread_messages > 0 ? 'bg-blue-400' : 'bg-transparent'
                  }`} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selectedClient ? (
            <div className={`rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] ${cardClass}`}>
              <Eye className={`w-10 h-10 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {lang === 'fr' ? 'Sélectionnez un client pour gérer son espace' : 'Select a client to manage their space'}
              </p>
            </div>
          ) : (
            <div className={`rounded-2xl overflow-hidden ${cardClass}`}>
              {/* Client header */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                      {selectedClient.name}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {selectedClient.email}{selectedClient.company ? ` · ${selectedClient.company}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className={`${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Satisfaction stars */}
                {satisfaction?.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= satisfaction.rating ? 'text-amber-400 fill-amber-400' : isDark ? 'text-gray-700' : 'text-gray-200'}`} />
                    ))}
                    <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {satisfaction.comment ? `"${satisfaction.comment.slice(0, 40)}${satisfaction.comment.length > 40 ? '…' : ''}"` : ''}
                    </span>
                  </div>
                )}

                {/* Panel tabs */}
                <div className="flex flex-wrap gap-1 mt-4">
                  {[
                    { key: 'messages', icon: MessageCircle, label: lang === 'fr' ? 'Messages' : 'Messages' },
                    { key: 'project', icon: BarChart2, label: lang === 'fr' ? 'Projet' : 'Project' },
                    { key: 'documents', icon: FolderOpen, label: lang === 'fr' ? 'Documents' : 'Documents' },
                    { key: 'journal', icon: BookOpen, label: lang === 'fr' ? 'Journal' : 'Journal' },
                    { key: 'evolutions', icon: Sparkles, label: lang === 'fr' ? `Évolutions${evolutions.length > 0 ? ` (${evolutions.length})` : ''}` : `Evolutions${evolutions.length > 0 ? ` (${evolutions.length})` : ''}` },
                    { key: 'appointments', icon: Calendar, label: lang === 'fr' ? `RDV${allAppointments.filter(a => a.client_id === selectedClient?.id && a.status === 'pending').length > 0 ? ' 🔴' : ''}` : `Apts${allAppointments.filter(a => a.client_id === selectedClient?.id && a.status === 'pending').length > 0 ? ' 🔴' : ''}` },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setActivePanel(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activePanel === key
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : isDark
                            ? 'text-gray-500 hover:text-gray-300'
                            : 'text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages panel */}
              {activePanel === 'messages' && (
                <div className="flex flex-col">
                  <div className={`overflow-y-auto px-6 py-4 space-y-3 min-h-[280px] max-h-[360px]`}>
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full py-8">
                        <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {lang === 'fr' ? 'Aucun message' : 'No messages yet'}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, i) => {
                        const isAdmin = msg.author_type === 'admin';
                        const isSystem = msg.author_type === 'system';
                        if (isSystem) {
                          return (
                            <div key={i} className="flex justify-center">
                              <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                                {msg.content}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={i} className={`flex gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            {!isAdmin && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                <User className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                              </div>
                            )}
                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                              isAdmin
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : isDark
                                  ? 'bg-white/5 text-gray-300 rounded-tl-sm'
                                  : 'bg-gray-100 text-gray-700 rounded-tl-sm'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isAdmin ? 'text-blue-200/70' : isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {msg.created_at ? new Date(msg.created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                            {isAdmin && (
                              <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertCircle className="w-3 h-3 text-blue-400" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className={`px-6 py-4 border-t ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder={lang === 'fr' ? 'Votre message...' : 'Your message...'}
                        disabled={sendingMsg}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!msgInput.trim() || sendingMsg}
                        className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white flex items-center justify-center transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Project panel */}
              {activePanel === 'project' && (
                <div className="px-6 py-5 space-y-5">
                  {/* Status */}
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${labelClass}`}>
                      {lang === 'fr' ? 'Statut du projet' : 'Project Status'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_STATUSES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setProjectStatus(s.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            projectStatus === s.value
                              ? `border-current ${s.color} bg-current/10`
                              : isDark
                                ? 'border-white/10 text-gray-500 hover:border-white/20'
                                : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {lang === 'fr' ? s.labelFr : s.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-xs font-medium ${labelClass}`}>
                        {lang === 'fr' ? 'Avancement' : 'Progress'}
                      </label>
                      <span className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {projectProgress}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={projectProgress}
                      onChange={e => setProjectProgress(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className={`mt-2 h-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${projectProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${labelClass}`}>
                      {lang === 'fr' ? 'Notes internes / message au client' : 'Internal notes / client message'}
                    </label>
                    <textarea
                      value={projectNotes}
                      onChange={e => setProjectNotes(e.target.value)}
                      rows={3}
                      placeholder={lang === 'fr' ? 'Informations visibles par le client...' : 'Information visible to client...'}
                      className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none ${inputClass}`}
                    />
                  </div>

                  <button
                    onClick={handleSaveProject}
                    disabled={savingProject}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                  >
                    {savingProject ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : <CheckCircle className="w-4 h-4" />}
                    {lang === 'fr' ? 'Enregistrer' : 'Save'}
                  </button>

                  {projectData && (
                    <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {lang === 'fr' ? 'Dernière mise à jour : ' : 'Last updated: '}
                      {projectData.updated_at ? new Date(projectData.updated_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—'}
                    </div>
                  )}
                </div>
              )}

              {/* Documents panel */}
              {activePanel === 'documents' && (
                <div className="px-6 py-5 space-y-5">
                  {/* Add doc form */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} space-y-3`}>
                    <p className={`text-xs font-medium ${labelClass}`}>
                      {lang === 'fr' ? 'Partager un document' : 'Share a document'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={docName}
                        onChange={e => setDocName(e.target.value)}
                        placeholder={lang === 'fr' ? 'Nom du document' : 'Document name'}
                        className={`px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                      />
                      <select
                        value={docType}
                        onChange={e => setDocType(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                      >
                        {DOC_TYPES.map(t => (
                          <option key={t} value={t}>
                            {DOC_EMOJIS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="url"
                      value={docUrl}
                      onChange={e => setDocUrl(e.target.value)}
                      placeholder="https://..."
                      className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                    />
                    <label className={`flex items-center gap-2 cursor-pointer text-xs ${labelClass}`}>
                      <input
                        type="checkbox"
                        checked={docRequiresApproval}
                        onChange={e => setDocRequiresApproval(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-blue-500"
                      />
                      {lang === 'fr' ? '✅ Requiert validation du client (livrable)' : '✅ Requires client approval (deliverable)'}
                    </label>
                    <button
                      onClick={handleAddDoc}
                      disabled={addingDoc || !docName.trim() || !docUrl.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                    >
                      {addingDoc ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <FileUp className="w-4 h-4" />}
                      {lang === 'fr' ? 'Partager' : 'Share'}
                    </button>
                  </div>

                  {/* Doc list */}
                  <div className="space-y-2">
                    {documents.length === 0 ? (
                      <p className={`text-sm text-center py-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {lang === 'fr' ? 'Aucun document partagé' : 'No documents shared yet'}
                      </p>
                    ) : (
                      documents.map(doc => {
                        const approvalBadge = {
                          pending:               { text: lang === 'fr' ? '⏳ En attente' : '⏳ Pending',     cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                          approved:              { text: '✅ Validé',                                         cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                          corrections_requested: { text: lang === 'fr' ? '✏️ Corrections' : '✏️ Corrections', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                        }[doc.approval_status];
                        return (
                          <div
                            key={doc.id}
                            className={`px-4 py-3 rounded-xl ${
                              isDark ? 'bg-white/5 hover:bg-white/[0.07]' : 'bg-gray-50 hover:bg-gray-100'
                            } transition-all`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-lg flex-shrink-0">{doc.requires_approval ? '📦' : (DOC_EMOJIS[doc.doc_type] || '📄')}</span>
                                <div className="min-w-0">
                                  <p className={`text-sm font-medium truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-800'}`}>
                                    {doc.name}
                                  </p>
                                  <p className={`text-xs truncate ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {doc.doc_type} · {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                {approvalBadge && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${approvalBadge.cls}`}>
                                    {approvalBadge.text}
                                  </span>
                                )}
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-600'}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {doc.approval_status === 'corrections_requested' && doc.approval_comment && (
                              <p className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-orange-500/10 text-orange-300' : 'bg-orange-50 text-orange-700'}`}>
                                💬 {doc.approval_comment}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Evolutions panel */}
              {activePanel === 'evolutions' && (
                <div className="px-6 py-5 space-y-4">
                  {evolutions.length === 0 ? (
                    <div className="text-center py-10">
                      <Sparkles className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                      <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {lang === 'fr' ? 'Aucune demande d\'évolution pour l\'instant.' : 'No evolution requests yet.'}
                      </p>
                    </div>
                  ) : (
                    evolutions.map(evo => {
                      const typeInfo = EVOLUTION_TYPES_ADMIN.find(t => t.value === evo.type) || EVOLUTION_TYPES_ADMIN[1];
                      const isEditing = editingEvo?.id === evo.id;
                      return (
                        <div
                          key={evo.id}
                          className={`rounded-xl border p-4 ${typeInfo.bg} ${typeInfo.border}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0 mt-0.5">{typeInfo.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={`text-sm font-semibold ${typeInfo.color}`}>{evo.title}</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    evo.priority === 'haute' ? 'text-amber-400 bg-amber-500/10' :
                                    evo.priority === 'faible' ? 'text-gray-400 bg-gray-500/10' :
                                    'text-blue-400 bg-blue-500/10'
                                  }`}>
                                    {evo.priority === 'haute' ? (lang === 'fr' ? 'Haute' : 'High') :
                                     evo.priority === 'faible' ? (lang === 'fr' ? 'Faible' : 'Low') :
                                     (lang === 'fr' ? 'Normale' : 'Normal')}
                                  </span>
                                  <button
                                    onClick={() => setEditingEvo(isEditing ? null : { id: evo.id, status: evo.status, response: evo.admin_response || '' })}
                                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                      isEditing
                                        ? isDark ? 'border-white/20 text-white bg-white/10' : 'border-gray-300 text-gray-900 bg-gray-100'
                                        : isDark ? 'border-white/10 text-gray-400 hover:border-white/20' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                  >
                                    {isEditing ? (lang === 'fr' ? 'Annuler' : 'Cancel') : (lang === 'fr' ? 'Répondre' : 'Respond')}
                                  </button>
                                </div>
                              </div>
                              <p className={`text-xs leading-relaxed whitespace-pre-wrap mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {evo.description}
                              </p>
                              <p className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {evo.created_at ? new Date(evo.created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                              </p>

                              {/* Inline edit form */}
                              {isEditing && (
                                <div className={`mt-3 p-3 rounded-xl space-y-3 ${isDark ? 'bg-black/20' : 'bg-white/60'}`}>
                                  <div>
                                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {lang === 'fr' ? 'Statut' : 'Status'}
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {EVOLUTION_STATUSES_ADMIN.map(s => (
                                        <button
                                          key={s.value}
                                          onClick={() => setEditingEvo(e => ({ ...e, status: s.value }))}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                            editingEvo.status === s.value
                                              ? `${s.color} border-current bg-current/10`
                                              : isDark ? 'border-white/10 text-gray-500 hover:border-white/20' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                          }`}
                                        >
                                          {lang === 'fr' ? s.labelFr : s.labelEn}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {lang === 'fr' ? 'Réponse client' : 'Client response'}
                                    </label>
                                    <textarea
                                      value={editingEvo.response}
                                      onChange={e => setEditingEvo(ev => ({ ...ev, response: e.target.value }))}
                                      rows={2}
                                      placeholder={lang === 'fr' ? 'Expliquez votre décision au client...' : 'Explain your decision to the client...'}
                                      className={`w-full px-3 py-2 rounded-lg text-xs outline-none resize-none transition-all ${inputClass}`}
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleSaveEvolution(evo.id)}
                                    disabled={savingEvo}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
                                  >
                                    {savingEvo ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    {lang === 'fr' ? 'Enregistrer' : 'Save'}
                                  </button>
                                </div>
                              )}

                              {/* Existing response */}
                              {!isEditing && evo.admin_response && (
                                <div className={`mt-2 p-2 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                                  <p className="text-[11px] font-semibold text-blue-400 mb-0.5">
                                    {lang === 'fr' ? 'Votre réponse' : 'Your response'}
                                  </p>
                                  <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{evo.admin_response}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Journal panel */}
              {activePanel === 'journal' && (
                <div className="px-6 py-5 space-y-5">
                  {/* Add update form */}
                  <div className={`p-4 rounded-xl space-y-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-medium ${labelClass}`}>
                      {lang === 'fr' ? 'Publier une mise à jour' : 'Publish an update'}
                    </p>
                    {/* Type selector */}
                    <div className="flex flex-wrap gap-2">
                      {UPDATE_TYPES.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setUpdateType(t.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            updateType === t.value
                              ? `${t.color} ${t.bg} ${t.border}`
                              : isDark
                                ? 'border-white/10 text-gray-500 hover:border-white/20'
                                : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          <span>{t.emoji}</span>
                          {lang === 'fr' ? t.labelFr : t.labelEn}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={updateTitle}
                      onChange={e => setUpdateTitle(e.target.value)}
                      placeholder={lang === 'fr' ? 'Titre de la mise à jour...' : 'Update title...'}
                      className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}
                    />
                    <textarea
                      value={updateContent}
                      onChange={e => setUpdateContent(e.target.value)}
                      rows={3}
                      placeholder={lang === 'fr'
                        ? 'Expliquez ce que vous faites, ce que vous avez mis en place, ce qui arrive...'
                        : 'Explain what you\'re doing, what you\'ve set up, what\'s coming...'
                      }
                      className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none ${inputClass}`}
                    />
                    <button
                      onClick={handleAddUpdate}
                      disabled={addingUpdate || !updateTitle.trim() || !updateContent.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
                    >
                      {addingUpdate ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <Pencil className="w-4 h-4" />}
                      {lang === 'fr' ? 'Publier' : 'Publish'}
                    </button>
                  </div>

                  {/* Updates list */}
                  {updates.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                      <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {lang === 'fr' ? 'Aucune mise à jour publiée' : 'No updates published yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {updates.map(upd => {
                        const typeInfo = UPDATE_TYPES.find(t => t.value === upd.type) || UPDATE_TYPES[0];
                        return (
                          <div
                            key={upd.id}
                            className={`flex gap-3 p-4 rounded-xl border ${typeInfo.bg} ${typeInfo.border}`}
                          >
                            <span className="text-xl flex-shrink-0 mt-0.5">{typeInfo.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-semibold ${typeInfo.color}`}>{upd.title}</p>
                                <button
                                  onClick={() => handleDeleteUpdate(upd.id)}
                                  className={`flex-shrink-0 p-1 rounded transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className={`text-xs mt-1 leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {upd.content}
                              </p>
                              <p className={`text-[11px] mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {lang === 'fr' ? 'Publié par' : 'Published by'} {upd.author_name} · {upd.created_at ? new Date(upd.created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Appointments panel */}
              {activePanel === 'appointments' && (
                <div className="px-6 py-5 space-y-5">
                  {/* Client appointments */}
                  <div>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {lang === 'fr' ? 'Rendez-vous du client' : 'Client appointments'}
                    </h4>
                    {allAppointments.filter(a => a.client_id === selectedClient?.id).length === 0 ? (
                      <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {lang === 'fr' ? 'Aucun rendez-vous' : 'No appointments'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {allAppointments.filter(a => a.client_id === selectedClient?.id).map(apt => {
                          const statusStyle = {
                            pending:   { cls: 'bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400',   label: lang === 'fr' ? 'En attente' : 'Pending' },
                            confirmed: { cls: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', label: lang === 'fr' ? 'Confirmé' : 'Confirmed' },
                            cancelled: { cls: 'bg-red-500/10 border-red-500/20',         dot: 'bg-red-400',     label: lang === 'fr' ? 'Annulé' : 'Cancelled' },
                          }[apt.status] || { cls: '', dot: 'bg-gray-400', label: apt.status };
                          return (
                            <div key={apt.id} className={`rounded-xl border p-4 ${statusStyle.cls}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                      {new Date(apt.slot_date + 'T00:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })} · {apt.slot_time}
                                    </span>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{statusStyle.label}</span>
                                  </div>
                                  {apt.notes && <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>📝 {apt.notes}</p>}
                                  {apt.meeting_link && <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">🔗 {apt.meeting_link}</a>}
                                </div>
                                {apt.status !== 'cancelled' && (
                                  <button onClick={() => handleDeleteAppointment(apt.id)} className={`p-1.5 rounded-lg ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'} transition-colors`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {apt.status === 'pending' && (
                                <div className={`mt-3 pt-3 border-t space-y-2 ${isDark ? 'border-amber-500/20' : 'border-amber-200'}`}>
                                  <input
                                    type="text"
                                    placeholder={lang === 'fr' ? 'Lien réunion (Zoom, Meet...) — optionnel' : 'Meeting link (Zoom, Meet...) — optional'}
                                    value={updatingApt === apt.id ? aptMeetingLink : ''}
                                    onChange={e => { setUpdatingApt(apt.id); setAptMeetingLink(e.target.value); }}
                                    onClick={() => setUpdatingApt(apt.id)}
                                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-all ${inputClass}`}
                                  />
                                  <textarea
                                    placeholder={lang === 'fr' ? 'Note pour le client (optionnel)...' : 'Note to client (optional)...'}
                                    value={updatingApt === apt.id ? aptAdminNotes : ''}
                                    onChange={e => { setUpdatingApt(apt.id); setAptAdminNotes(e.target.value); }}
                                    onClick={() => setUpdatingApt(apt.id)}
                                    rows={1}
                                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none resize-none transition-all ${inputClass}`}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUpdateAppointment(apt.id, 'confirmed')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-lg transition-all"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      {lang === 'fr' ? 'Confirmer' : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={() => handleUpdateAppointment(apt.id, 'cancelled')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium rounded-lg transition-all"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      {lang === 'fr' ? 'Refuser' : 'Decline'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Appointments Overview */}
      <div className={`rounded-2xl p-6 space-y-4 mt-6 ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <h3 className={`font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
              {lang === 'fr' ? 'Tous les rendez-vous' : 'All Appointments'}
            </h3>
            {allAppointments.filter(a => a.status === 'pending').length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                {allAppointments.filter(a => a.status === 'pending').length} {lang === 'fr' ? 'en attente' : 'pending'}
              </span>
            )}
          </div>
          <button
            onClick={fetchAllAppointments}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}
            title={lang === 'fr' ? 'Actualiser' : 'Refresh'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {allAppointments.length === 0 ? (
          <p className={`text-sm text-center py-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {lang === 'fr' ? 'Aucun rendez-vous pour l\'instant' : 'No appointments yet'}
          </p>
        ) : (
          <div className="space-y-3">
            {[...allAppointments]
              .sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return (a.slot_date + a.slot_time).localeCompare(b.slot_date + b.slot_time);
              })
              .map(apt => {
                const statusStyle = {
                  pending:   { cls: 'bg-amber-500/10 border-amber-500/20',    dot: 'bg-amber-400',   label: lang === 'fr' ? 'En attente' : 'Pending' },
                  confirmed: { cls: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', label: lang === 'fr' ? 'Confirmé' : 'Confirmed' },
                  cancelled: { cls: 'bg-red-500/10 border-red-500/20',         dot: 'bg-red-400',     label: lang === 'fr' ? 'Annulé' : 'Cancelled' },
                }[apt.status] || { cls: '', dot: 'bg-gray-400', label: apt.status };
                const isEditingThis = updatingApt === apt.id;
                return (
                  <div key={apt.id} className={`rounded-xl border p-4 ${statusStyle.cls}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
                          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {new Date(apt.slot_date + 'T00:00:00').toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {apt.slot_time}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{statusStyle.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{apt.client_name}</span>
                          {apt.client_company && <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>· {apt.client_company}</span>}
                        </div>
                        {apt.notes && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>📝 {apt.notes}</p>}
                        {apt.admin_notes && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>💬 {apt.admin_notes}</p>}
                        {apt.meeting_link && <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">🔗 {apt.meeting_link}</a>}
                      </div>
                      <button
                        onClick={() => handleDeleteAppointment(apt.id)}
                        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                        title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {apt.status === 'pending' && (
                      <div className={`mt-3 pt-3 border-t space-y-2 ${isDark ? 'border-amber-500/20' : 'border-amber-200'}`}>
                        <input
                          type="text"
                          placeholder={lang === 'fr' ? 'Lien réunion (Zoom, Meet...) — optionnel' : 'Meeting link (Zoom, Meet...) — optional'}
                          value={isEditingThis ? aptMeetingLink : ''}
                          onChange={e => { setUpdatingApt(apt.id); setAptMeetingLink(e.target.value); }}
                          onClick={() => { if (!isEditingThis) { setUpdatingApt(apt.id); setAptMeetingLink(''); setAptAdminNotes(''); } }}
                          className={`w-full px-3 py-2 rounded-xl text-xs outline-none transition-all ${inputClass}`}
                        />
                        <textarea
                          placeholder={lang === 'fr' ? 'Note pour le client (optionnel)...' : 'Note to client (optional)...'}
                          value={isEditingThis ? aptAdminNotes : ''}
                          onChange={e => { setUpdatingApt(apt.id); setAptAdminNotes(e.target.value); }}
                          onClick={() => { if (!isEditingThis) { setUpdatingApt(apt.id); setAptMeetingLink(''); setAptAdminNotes(''); } }}
                          rows={1}
                          className={`w-full px-3 py-2 rounded-xl text-xs outline-none resize-none transition-all ${inputClass}`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateAppointment(apt.id, 'confirmed')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-lg transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {lang === 'fr' ? 'Confirmer' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => handleUpdateAppointment(apt.id, 'cancelled')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium rounded-lg transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {lang === 'fr' ? 'Refuser' : 'Decline'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Global Availability Config */}
      <div className={`rounded-2xl p-6 space-y-4 mt-6 ${cardClass}`}>
        <div className="flex items-center gap-3">
          <Settings className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
            {lang === 'fr' ? 'Configuration des disponibilités' : 'Availability Configuration'}
          </h3>
        </div>

        {/* Working days */}
        <div>
          <label className={`block text-xs font-medium mb-2 ${labelClass}`}>{lang === 'fr' ? 'Jours ouvrés' : 'Working days'}</label>
          <div className="flex flex-wrap gap-2">
            {(lang === 'fr' ? DAYS_FR : DAYS_EN).map((day, i) => (
              <button
                key={i}
                onClick={() => toggleWorkingDay(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  availabilityForm.working_days.includes(i)
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : isDark ? 'border-[var(--border-secondary)] text-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-400 hover:text-gray-700'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time range + slot duration */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${labelClass}`}>{lang === 'fr' ? 'Début' : 'Start'}</label>
            <input type="time" value={availabilityForm.start_time} onChange={e => setAvailabilityForm(f => ({...f, start_time: e.target.value}))}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`} />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${labelClass}`}>{lang === 'fr' ? 'Fin' : 'End'}</label>
            <input type="time" value={availabilityForm.end_time} onChange={e => setAvailabilityForm(f => ({...f, end_time: e.target.value}))}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`} />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${labelClass}`}>{lang === 'fr' ? 'Durée (min)' : 'Duration (min)'}</label>
            <select value={availabilityForm.slot_duration} onChange={e => setAvailabilityForm(f => ({...f, slot_duration: Number(e.target.value)}))}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`}>
              {[15,20,30,45,60,90].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${labelClass}`}>{lang === 'fr' ? 'Lien réunion' : 'Meeting link'}</label>
            <input type="text" value={availabilityForm.meeting_link} onChange={e => setAvailabilityForm(f => ({...f, meeting_link: e.target.value}))}
              placeholder="https://meet.google.com/..."
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`} />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${labelClass}`}>{lang === 'fr' ? 'Message affiché aux clients (optionnel)' : 'Message shown to clients (optional)'}</label>
          <input type="text" value={availabilityForm.notes} onChange={e => setAvailabilityForm(f => ({...f, notes: e.target.value}))}
            placeholder={lang === 'fr' ? 'Ex: Pensez à préparer vos questions...' : 'E.g.: Please prepare your questions...'}
            className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-all ${inputClass}`} />
        </div>

        <button
          onClick={handleSaveAvailability}
          disabled={savingAvailability}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
        >
          {savingAvailability ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Settings className="w-4 h-4" />}
          {lang === 'fr' ? 'Sauvegarder les disponibilités' : 'Save availability'}
        </button>
      </div>
    </div>
  );
}
