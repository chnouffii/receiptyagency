import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, FileText, FolderOpen, LogOut, Send, Download,
  CheckCircle, Clock, Loader, Package, Star, ChevronRight,
  User, Building2, RefreshCw, ExternalLink, AlertCircle
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

function formatDate(dateStr, lang) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function renderMessageContent(content) {
  // Convert **bold** markdown to <strong>
  return content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export default function ClientDashboardPage() {
  const { isDark } = useTheme();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('messages');
  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('receipty-client-token');
  const clientName = localStorage.getItem('receipty-client-name') || '';
  const clientCompany = localStorage.getItem('receipty-client-company') || '';

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const logout = () => {
    localStorage.removeItem('receipty-client-token');
    localStorage.removeItem('receipty-client-name');
    localStorage.removeItem('receipty-client-email');
    localStorage.removeItem('receipty-client-company');
    navigate('/client');
  };

  const fetchAll = useCallback(async () => {
    if (!token) { navigate('/client'); return; }
    try {
      const [profileRes, projectRes, messagesRes, docsRes] = await Promise.all([
        axios.get(`${API}/client/profile`, { headers }),
        axios.get(`${API}/client/project`, { headers }),
        axios.get(`${API}/client/messages`, { headers }),
        axios.get(`${API}/client/documents`, { headers }),
      ]);
      setProfile(profileRes.data);
      setProject(projectRes.data);
      setMessages(messagesRes.data);
      setDocuments(docsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error(lang === 'fr' ? 'Session expirée. Reconnectez-vous.' : 'Session expired. Please log in again.');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-scroll messages
  useEffect(() => {
    if (activeTab === 'messages') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, activeTab]);

  // Refresh messages every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'messages') {
        axios.get(`${API}/client/messages`, { headers })
          .then(res => setMessages(res.data))
          .catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, headers]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/client/messages`, { content }, { headers });
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
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

  const tabs = [
    { id: 'messages', labelFr: 'Messages', labelEn: 'Messages', icon: MessageCircle },
    { id: 'project', labelFr: 'Mon Projet', labelEn: 'My Project', icon: CheckCircle },
    { id: 'documents', labelFr: 'Documents', labelEn: 'Documents', icon: FolderOpen },
  ];

  return (
    <div className={`min-h-screen pt-20 transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-600`}>
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
          </div>
          <button
            onClick={logout}
            className={`flex items-center gap-2 text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <LogOut className="w-4 h-4" />
            {lang === 'fr' ? 'Déconnexion' : 'Sign out'}
          </button>
        </div>

        {/* Project status banner */}
        <div className={`rounded-2xl border p-5 mb-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusInfo.bg}`}>
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
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
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
            />
          </div>

          {/* Steps */}
          <div className="flex justify-between mt-3">
            {Object.entries(projectStatuses).map(([key, info]) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${info.step <= statusInfo.step ? 'bg-blue-400' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <span className={`text-[10px] hidden md:block ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {lang === 'fr' ? info.labelFr.split(' ')[0] : info.labelEn.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 ${isDark ? 'bg-[var(--bg-secondary)]' : 'bg-white border border-gray-200 shadow-sm'}`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'fr' ? tab.labelFr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* === TAB: MESSAGES === */}
        {activeTab === 'messages' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border flex flex-col ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}
            style={{ height: '520px' }}
          >
            {/* Header */}
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

            {/* Messages */}
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
                        <p
                          className="leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                        />
                        <p className={`text-[10px] mt-1 opacity-50`}>{formatDate(msg.created_at, lang)}</p>
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
                      <p
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                      />
                      <p className={`text-[10px] mt-1 ${isClient ? 'opacity-70' : 'opacity-50'}`}>
                        {formatDate(msg.created_at, lang)}
                      </p>
                    </div>
                    {isClient && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white bg-blue-600`}>
                        {clientName?.charAt(0) || 'C'}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`p-3 border-t ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-100'}`}>
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={lang === 'fr' ? 'Votre message... (Entrée pour envoyer)' : 'Your message... (Enter to send)'}
                  rows={1}
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
            {/* Status detail */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Statut du projet' : 'Project status'}
              </h2>
              <div className="space-y-3">
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
                          : <Icon className={`w-4 h-4 ${isActive ? info.color : isDark ? 'text-gray-600' : 'text-gray-400'} ${isActive && key === 'en_cours' ? 'animate-spin' : ''}`} />
                        }
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isActive ? info.color : isDone ? 'text-emerald-400' : isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {lang === 'fr' ? info.labelFr : info.labelEn}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight className={`w-4 h-4 ${info.color}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile info */}
            <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-primary)]' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`font-heading text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                  {documents.map((doc, i) => (
                    <motion.div
                      key={doc.id || i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-4 p-4 ${isDark ? 'hover:bg-[var(--bg-hover)]' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <span className="text-2xl">{docTypeIcons[doc.doc_type] || '📎'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.name}</p>
                        {doc.description && (
                          <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{doc.description}</p>
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
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
