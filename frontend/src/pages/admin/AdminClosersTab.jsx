import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Edit2, Trash2, Check, X, Target, TrendingUp, 
  DollarSign, Award, BarChart3, Search, Percent, 
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Eye,
  Shield, Activity, FileText, BookOpen, Layers, Settings, UserCog, MessageCircle, FileSearch,
  Calendar, Filter, RefreshCw, Globe, Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Status badges
const statusConfig = {
  en_cours: { label: 'En cours', labelEn: 'In progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  signe: { label: 'Signé', labelEn: 'Signed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  perdu: { label: 'Perdu', labelEn: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

// Available modules with their icons and labels
const AVAILABLE_MODULES = [
  { id: 'leads', labelFr: 'Leads', labelEn: 'Leads', icon: Users },
  { id: 'chat', labelFr: 'Chat Analytics', labelEn: 'Chat Analytics', icon: MessageCircle },
  { id: 'cases', labelFr: 'Études de cas', labelEn: 'Case Studies', icon: BookOpen },
  { id: 'solutions', labelFr: 'Solutions', labelEn: 'Solutions', icon: Layers },
  { id: 'content', labelFr: 'Contenu Site', labelEn: 'Site Content', icon: Settings },
  { id: 'users', labelFr: 'Utilisateurs', labelEn: 'Users', icon: UserCog },
  { id: 'quotes', labelFr: 'Devis', labelEn: 'Quotes', icon: FileText },
  { id: 'audits', labelFr: 'Audit ROI', labelEn: 'Audit ROI', icon: FileSearch },
];

// Activity Log Section Component
function ActivityLogSection({ isDark, lang, headers, closers, selectedCloserActivity, setSelectedCloserActivity }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    timeRange: 'all', // 'today', '7days', 'all'
    closerId: 'all',
    action: 'all'
  });
  const [limit, setLimit] = useState(50);

  const actionLabels = {
    create: { fr: 'Création', en: 'Create', color: 'bg-emerald-500/20 text-emerald-400' },
    update: { fr: 'Modification', en: 'Update', color: 'bg-blue-500/20 text-blue-400' },
    delete: { fr: 'Suppression', en: 'Delete', color: 'bg-red-500/20 text-red-400' },
    view: { fr: 'Consultation', en: 'View', color: 'bg-gray-500/20 text-gray-400' },
    validate: { fr: 'Validation', en: 'Validate', color: 'bg-amber-500/20 text-amber-400' },
    reject: { fr: 'Rejet', en: 'Reject', color: 'bg-red-500/20 text-red-400' },
  };

  useEffect(() => {
    if (selectedCloserActivity) {
      setLogs(selectedCloserActivity.activity || []);
      setLoading(false);
    } else {
      fetchAllLogs();
    }
  }, [selectedCloserActivity]);

  const fetchAllLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.closerId !== 'all') params.append('user_id', filter.closerId);
      if (filter.action !== 'all') params.append('action', filter.action);
      params.append('limit', limit.toString());
      
      const res = await axios.get(`${API}/admin/activity-logs?${params.toString()}`, { headers });
      let filtered = res.data;
      
      // Client-side time filtering
      if (filter.timeRange !== 'all') {
        const now = new Date();
        const cutoff = filter.timeRange === 'today' 
          ? new Date(now.setHours(0, 0, 0, 0))
          : new Date(now.setDate(now.getDate() - 7));
        filtered = filtered.filter(log => new Date(log.created_at) >= cutoff);
      }
      
      setLogs(filtered);
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur de chargement' : 'Loading error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSelectedCloserActivity(null);
    fetchAllLogs();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`} data-testid="activity-log-section">
      <div className={`p-4 border-b ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
            {selectedCloserActivity 
              ? `${lang === 'fr' ? 'Activité de' : 'Activity of'} ${selectedCloserActivity.closer?.name || selectedCloserActivity.closer?.email}`
              : (lang === 'fr' ? 'Journal d\'Activité' : 'Activity Log')
            }
          </h2>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
              isDark ? 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={filter.timeRange}
              onChange={(e) => { setFilter({ ...filter, timeRange: e.target.value }); }}
              className={`text-sm rounded-lg px-3 py-1.5 ${
                isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">{lang === 'fr' ? 'Tout l\'historique' : 'All history'}</option>
              <option value="today">{lang === 'fr' ? 'Aujourd\'hui' : 'Today'}</option>
              <option value="7days">{lang === 'fr' ? '7 derniers jours' : 'Last 7 days'}</option>
            </select>
          </div>

          {/* Closer Filter */}
          {!selectedCloserActivity && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={filter.closerId}
                onChange={(e) => setFilter({ ...filter, closerId: e.target.value })}
                className={`text-sm rounded-lg px-3 py-1.5 ${
                  isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'
                }`}
              >
                <option value="all">{lang === 'fr' ? 'Tous les closers' : 'All closers'}</option>
                {closers.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.email}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className={`text-sm rounded-lg px-3 py-1.5 ${
                isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">{lang === 'fr' ? 'Toutes les actions' : 'All actions'}</option>
              <option value="create">{lang === 'fr' ? 'Création' : 'Create'}</option>
              <option value="update">{lang === 'fr' ? 'Modification' : 'Update'}</option>
              <option value="delete">{lang === 'fr' ? 'Suppression' : 'Delete'}</option>
              <option value="view">{lang === 'fr' ? 'Consultation' : 'View'}</option>
              <option value="validate">{lang === 'fr' ? 'Validation' : 'Validate'}</option>
            </select>
          </div>

          {/* Limit */}
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className={`text-sm rounded-lg px-3 py-1.5 ${
                isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'
              }`}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-xs text-gray-500">{lang === 'fr' ? 'entrées' : 'entries'}</span>
          </div>

          <button
            onClick={fetchAllLogs}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all"
          >
            {lang === 'fr' ? 'Appliquer' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">{lang === 'fr' ? 'Aucune activité enregistrée' : 'No activity recorded'}</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-primary)] max-h-[600px] overflow-y-auto">
          {logs.map((log, index) => {
            const actionStyle = actionLabels[log.action] || { fr: log.action, en: log.action, color: 'bg-gray-500/20 text-gray-400' };
            return (
              <motion.div
                key={log.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`p-4 ${isDark ? 'hover:bg-[var(--bg-hover)]' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${actionStyle.color}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium text-sm ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                          {log.user_name || log.user_email}
                        </span>
                        <Badge className={actionStyle.color}>
                          {lang === 'fr' ? actionStyle.fr : actionStyle.en}
                        </Badge>
                        {log.target_type && (
                          <span className="text-xs text-gray-500">
                            → {log.target_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{log.details}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </span>
                        {log.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.ip_address}
                          </span>
                        )}
                        {log.user_agent && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]" title={log.user_agent}>
                            <Monitor className="w-3 h-3" />
                            {log.user_agent.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer with count */}
      <div className={`p-3 border-t text-xs text-gray-500 ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200'}`}>
        {logs.length} {lang === 'fr' ? 'entrées affichées' : 'entries displayed'}
      </div>
    </div>
  );
}

export default function AdminClosersTab({ token, isDark }) {
  const { lang } = useLanguage();
  const [activeSection, setActiveSection] = useState('closers'); // 'closers', 'deals', 'tiers', 'activity'
  const [closers, setClosers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedCloserActivity, setSelectedCloserActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCloserForm, setShowCloserForm] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingCloser, setEditingCloser] = useState(null);
  const [editingTier, setEditingTier] = useState(null);
  const [expandedCloser, setExpandedCloser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states with permissions
  const [closerForm, setCloserForm] = useState({ 
    email: '', 
    password: '', 
    name: '',
    permissions: {
      modules: [],
      can_view_all_data: false
    }
  });
  const [tierForm, setTierForm] = useState({ name: '', min_deals: 0, rate: 10 });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [closersRes, dealsRes, tiersRes] = await Promise.all([
        axios.get(`${API}/admin/closers`, { headers }),
        axios.get(`${API}/admin/deals`, { headers }),
        axios.get(`${API}/admin/commission-tiers`, { headers }),
      ]);
      setClosers(closersRes.data);
      setDeals(dealsRes.data);
      setTiers(tiersRes.data);
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur de chargement' : 'Loading error');
    } finally {
      setLoading(false);
    }
  };

  // === CLOSER CRUD ===
  const handleCreateCloser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/closers`, closerForm, { headers });
      toast.success(lang === 'fr' ? 'Closer créé' : 'Closer created');
      setShowCloserForm(false);
      resetCloserForm();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleUpdateCloser = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        permissions: closerForm.permissions
      };
      if (closerForm.name) updates.name = closerForm.name;
      if (closerForm.email) updates.email = closerForm.email;
      if (closerForm.password) updates.password = closerForm.password;
      
      await axios.put(`${API}/admin/closers/${editingCloser.id}`, updates, { headers });
      toast.success(lang === 'fr' ? 'Closer mis à jour' : 'Closer updated');
      setEditingCloser(null);
      resetCloserForm();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const resetCloserForm = () => {
    setCloserForm({ 
      email: '', 
      password: '', 
      name: '',
      permissions: {
        modules: [],
        can_view_all_data: false
      }
    });
  };

  const toggleModule = (moduleId) => {
    const currentModules = closerForm.permissions.modules || [];
    const newModules = currentModules.includes(moduleId)
      ? currentModules.filter(m => m !== moduleId)
      : [...currentModules, moduleId];
    setCloserForm({
      ...closerForm,
      permissions: {
        ...closerForm.permissions,
        modules: newModules
      }
    });
  };

  const fetchCloserActivity = async (closerId) => {
    try {
      const res = await axios.get(`${API}/admin/closer-activity/${closerId}`, { headers });
      setSelectedCloserActivity(res.data);
      setActiveSection('activity');
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur de chargement' : 'Loading error');
    }
  };

  const handleDeleteCloser = async (id) => {
    if (!window.confirm(lang === 'fr' ? 'Supprimer ce closer ?' : 'Delete this closer?')) return;
    try {
      await axios.delete(`${API}/admin/closers/${id}`, { headers });
      toast.success(lang === 'fr' ? 'Closer supprimé' : 'Closer deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  // === TIER CRUD ===
  const handleCreateTier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/commission-tiers`, tierForm, { headers });
      toast.success(lang === 'fr' ? 'Palier créé' : 'Tier created');
      setShowTierForm(false);
      setTierForm({ name: '', min_deals: 0, rate: 10 });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleUpdateTier = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/commission-tiers/${editingTier.id}`, tierForm, { headers });
      toast.success(lang === 'fr' ? 'Palier mis à jour' : 'Tier updated');
      setEditingTier(null);
      setTierForm({ name: '', min_deals: 0, rate: 10 });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleDeleteTier = async (id) => {
    if (!window.confirm(lang === 'fr' ? 'Supprimer ce palier ?' : 'Delete this tier?')) return;
    try {
      await axios.delete(`${API}/admin/commission-tiers/${id}`, { headers });
      toast.success(lang === 'fr' ? 'Palier supprimé' : 'Tier deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  // === DEAL ACTIONS ===
  const handleValidateDeal = async (dealId) => {
    try {
      await axios.post(`${API}/admin/deals/${dealId}/validate`, {}, { headers });
      toast.success(lang === 'fr' ? 'Deal validé !' : 'Deal validated!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleRejectDeal = async (dealId) => {
    if (!window.confirm(lang === 'fr' ? 'Marquer comme perdu ?' : 'Mark as lost?')) return;
    try {
      await axios.post(`${API}/admin/deals/${dealId}/reject`, {}, { headers });
      toast.success(lang === 'fr' ? 'Deal marqué perdu' : 'Deal marked as lost');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  // Stats summary
  const totalSignedDeals = deals.filter(d => d.status === 'signe').length;
  const totalCA = deals.filter(d => d.status === 'signe').reduce((sum, d) => sum + d.amount_ht, 0);
  const totalCommissions = deals.filter(d => d.status === 'signe').reduce((sum, d) => sum + d.commission_amount, 0);
  const pendingDeals = deals.filter(d => d.status === 'en_cours');

  const filteredDeals = deals.filter(d => 
    d.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.closer_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-gray-500 py-12">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-closers-tab">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-4 ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500">{lang === 'fr' ? 'Closers Actifs' : 'Active Closers'}</span>
          </div>
          <p className={`font-mono text-2xl font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{closers.length}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`rounded-xl border p-4 ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-500">{lang === 'fr' ? 'Deals Signés' : 'Signed Deals'}</span>
          </div>
          <p className={`font-mono text-2xl font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{totalSignedDeals}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-xl border p-4 ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-500">{lang === 'fr' ? 'CA Total' : 'Total Revenue'}</span>
          </div>
          <p className={`font-mono text-2xl font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{totalCA.toLocaleString()}€</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`rounded-xl border p-4 ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-500">{lang === 'fr' ? 'Commissions' : 'Commissions'}</span>
          </div>
          <p className={`font-mono text-2xl font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{totalCommissions.toLocaleString()}€</p>
        </motion.div>
      </div>

      {/* Section Tabs */}
      <div className={`flex gap-2 p-1 rounded-lg ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-gray-100'}`}>
        {[
          { id: 'closers', label: 'Closers', icon: Users },
          { id: 'deals', label: 'Deals', icon: Target, badge: pendingDeals.length },
          { id: 'tiers', label: lang === 'fr' ? 'Paliers' : 'Tiers', icon: Percent },
          { id: 'activity', label: lang === 'fr' ? 'Activité' : 'Activity', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSection === tab.id
                ? 'bg-blue-600 text-white'
                : isDark ? 'text-gray-400 hover:text-[var(--text-primary)]' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* === CLOSERS SECTION === */}
      {activeSection === 'closers' && (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200'}`}>
            <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
              {lang === 'fr' ? 'Gestion des Closers' : 'Closer Management'}
            </h2>
            <button
              onClick={() => setShowCloserForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all"
              data-testid="add-closer-btn"
            >
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Nouveau Closer' : 'New Closer'}
            </button>
          </div>

          {closers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {lang === 'fr' ? 'Aucun closer. Créez-en un pour commencer.' : 'No closers. Create one to start.'}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-primary)]">
              {closers.map((closer) => (
                <div key={closer.id} className={`p-4 ${isDark ? 'hover:bg-[var(--bg-hover)]' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)] font-bold ${
                        closer.stats.current_tier_name === 'Gold' ? 'bg-amber-500' :
                        closer.stats.current_tier_name === 'Silver' ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {closer.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{closer.name || closer.email}</h3>
                        <p className="text-sm text-gray-500">{closer.email}</p>
                      </div>
                      <Badge className={`ml-4 ${
                        closer.stats.current_tier_name === 'Gold' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        closer.stats.current_tier_name === 'Silver' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' :
                        'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {closer.stats.current_tier_name} ({closer.stats.current_tier_rate}%)
                      </Badge>
                      {/* Permissions badges */}
                      {closer.permissions?.modules?.length > 0 && (
                        <div className="flex items-center gap-1 ml-2">
                          <Shield className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs text-blue-400">{closer.permissions.modules.length} modules</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-4">
                        <p className={`font-mono text-lg font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                          {closer.stats.total_ca.toLocaleString()}€
                        </p>
                        <p className="text-xs text-gray-500">
                          {closer.stats.deals_signes} {lang === 'fr' ? 'signés' : 'signed'} · {closer.stats.conversion_rate}%
                        </p>
                      </div>
                      <button
                        onClick={() => fetchCloserActivity(closer.id)}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-blue-500/20' : 'hover:bg-blue-50'}`}
                        title={lang === 'fr' ? 'Voir activité' : 'View activity'}
                      >
                        <Activity className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => setExpandedCloser(expandedCloser === closer.id ? null : closer.id)}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-[var(--bg-tertiary)]' : 'hover:bg-gray-100'}`}
                      >
                        {expandedCloser === closer.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                      <button
                        onClick={() => { 
                          setEditingCloser(closer); 
                          setCloserForm({ 
                            name: closer.name, 
                            email: closer.email, 
                            password: '',
                            permissions: closer.permissions || { modules: [], can_view_all_data: false }
                          }); 
                        }}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-[var(--bg-tertiary)]' : 'hover:bg-gray-100'}`}
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteCloser(closer.id)}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded stats */}
                  <AnimatePresence>
                    {expandedCloser === closer.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-[var(--border-primary)]"
                      >
                        <div className="grid grid-cols-4 gap-4">
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-gray-50'}`}>
                            <p className="text-xs text-gray-500">{lang === 'fr' ? 'Total Deals' : 'Total Deals'}</p>
                            <p className={`font-mono text-lg font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{closer.stats.total_deals}</p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                            <p className="text-xs text-emerald-500">{lang === 'fr' ? 'Signés' : 'Signed'}</p>
                            <p className="font-mono text-lg font-bold text-emerald-400">{closer.stats.deals_signes}</p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                            <p className="text-xs text-amber-500">{lang === 'fr' ? 'En cours' : 'In progress'}</p>
                            <p className="font-mono text-lg font-bold text-amber-400">{closer.stats.deals_en_cours}</p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                            <p className="text-xs text-purple-500">{lang === 'fr' ? 'Commission' : 'Commission'}</p>
                            <p className="font-mono text-lg font-bold text-purple-400">{closer.stats.total_commission.toLocaleString()}€</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === DEALS SECTION === */}
      {activeSection === 'deals' && (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200'}`}>
            <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
              {lang === 'fr' ? 'Tous les Deals' : 'All Deals'}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
                className={`w-64 pl-9 pr-4 py-2 rounded-lg text-sm ${
                  isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>

          {filteredDeals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {lang === 'fr' ? 'Aucun deal' : 'No deals'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'bg-[var(--bg-hover)]' : 'bg-gray-50'}>
                    <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Client</th>
                    <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Closer</th>
                    <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Montant HT</th>
                    <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Statut</th>
                    <th className={`text-left text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Commission</th>
                    <th className={`text-right text-xs font-medium uppercase tracking-wider px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'divide-y divide-[var(--border-primary)]' : 'divide-y divide-gray-100'}>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className={isDark ? 'hover:bg-[var(--bg-hover)]' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{deal.client_name}</p>
                        <p className="text-xs text-gray-500">{deal.client_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-500">{deal.closer_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-mono font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{deal.amount_ht.toLocaleString()}€</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusConfig[deal.status]?.color}>
                          {lang === 'fr' ? statusConfig[deal.status]?.label : statusConfig[deal.status]?.labelEn}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {deal.status === 'signe' ? (
                          <div>
                            <p className="font-mono text-sm text-emerald-400">{deal.commission_amount.toLocaleString()}€</p>
                            <p className="text-xs text-gray-500">({deal.commission_rate}%)</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {deal.status === 'en_cours' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleValidateDeal(deal.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-all"
                              data-testid={`validate-deal-${deal.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {lang === 'fr' ? 'Valider' : 'Validate'}
                            </button>
                            <button
                              onClick={() => handleRejectDeal(deal.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded-lg transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              {lang === 'fr' ? 'Perdu' : 'Lost'}
                            </button>
                          </div>
                        )}
                        {deal.status === 'signe' && (
                          <span className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle className="w-4 h-4" /> {lang === 'fr' ? 'Validé' : 'Validated'}
                          </span>
                        )}
                        {deal.status === 'perdu' && (
                          <span className="text-xs text-red-400 flex items-center justify-end gap-1">
                            <XCircle className="w-4 h-4" /> {lang === 'fr' ? 'Perdu' : 'Lost'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === TIERS SECTION === */}
      {activeSection === 'tiers' && (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200'}`}>
            <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
              {lang === 'fr' ? 'Paliers de Commission' : 'Commission Tiers'}
            </h2>
            <button
              onClick={() => setShowTierForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all"
              data-testid="add-tier-btn"
            >
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Nouveau Palier' : 'New Tier'}
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-xl border p-6 ${
                  tier.name === 'Gold' ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent' :
                  tier.name === 'Silver' ? 'border-gray-500/30 bg-gradient-to-br from-gray-500/10 to-transparent' :
                  isDark ? 'border-[var(--border-primary)] bg-[var(--bg-hover)]' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`font-heading text-xl font-bold ${
                      tier.name === 'Gold' ? 'text-amber-400' :
                      tier.name === 'Silver' ? 'text-gray-300' :
                      isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'
                    }`}>{tier.name}</h3>
                    <p className="text-sm text-gray-500">
                      {lang === 'fr' ? 'À partir de' : 'From'} {tier.min_deals} {lang === 'fr' ? 'deals' : 'deals'}
                    </p>
                  </div>
                  <Award className={`w-8 h-8 ${
                    tier.name === 'Gold' ? 'text-amber-400' :
                    tier.name === 'Silver' ? 'text-gray-400' : 'text-orange-400'
                  }`} />
                </div>
                <p className={`font-mono text-4xl font-bold mb-4 ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                  {tier.rate}%
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingTier(tier); setTierForm({ name: tier.name, min_deals: tier.min_deals, rate: tier.rate }); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                      isDark ? 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {lang === 'fr' ? 'Modifier' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* === ACTIVITY SECTION === */}
      {activeSection === 'activity' && (
        <ActivityLogSection 
          isDark={isDark} 
          lang={lang} 
          headers={headers} 
          closers={closers}
          selectedCloserActivity={selectedCloserActivity}
          setSelectedCloserActivity={setSelectedCloserActivity}
        />
      )}

      {/* === CLOSER FORM DIALOG === */}
      <Dialog open={showCloserForm || editingCloser !== null} onOpenChange={(open) => { if (!open) { setShowCloserForm(false); setEditingCloser(null); resetCloserForm(); }}}>
        <DialogContent className={`max-w-lg ${isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-secondary)]' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}>
              {editingCloser ? (lang === 'fr' ? 'Modifier Closer' : 'Edit Closer') : (lang === 'fr' ? 'Nouveau Closer' : 'New Closer')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingCloser ? handleUpdateCloser : handleCreateCloser} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{lang === 'fr' ? 'Nom' : 'Name'}</label>
              <input
                type="text"
                value={closerForm.name}
                onChange={(e) => setCloserForm({ ...closerForm, name: e.target.value })}
                className={`w-full rounded-lg h-10 px-3 text-sm ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required={!editingCloser}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={closerForm.email}
                onChange={(e) => setCloserForm({ ...closerForm, email: e.target.value })}
                className={`w-full rounded-lg h-10 px-3 text-sm ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required={!editingCloser}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                {lang === 'fr' ? 'Mot de passe' : 'Password'} {editingCloser && <span className="text-gray-600">({lang === 'fr' ? 'laisser vide pour garder' : 'leave empty to keep'})</span>}
              </label>
              <input
                type="password"
                value={closerForm.password}
                onChange={(e) => setCloserForm({ ...closerForm, password: e.target.value })}
                className={`w-full rounded-lg h-10 px-3 text-sm ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required={!editingCloser}
              />
            </div>

            {/* Permissions Section */}
            <div className={`rounded-lg border p-4 ${isDark ? 'border-[var(--border-secondary)] bg-[var(--bg-hover)]' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <label className={`text-sm font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Permissions' : 'Permissions'}
                </label>
              </div>

              {/* Modules checkboxes */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {AVAILABLE_MODULES.map((module) => {
                  const isSelected = closerForm.permissions?.modules?.includes(module.id);
                  const ModuleIcon = module.icon;
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                          : isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-gray-400 hover:border-[var(--border-hover)]' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <ModuleIcon className="w-3.5 h-3.5" />
                      {lang === 'fr' ? module.labelFr : module.labelEn}
                      {isSelected && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>

              {/* Can view all data toggle */}
              <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white'}`}>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                    {lang === 'fr' ? 'Accès à toutes les données' : 'Access all data'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Voir les devis/audits de tous' : 'View all quotes/audits'}
                  </p>
                </div>
                <Switch
                  checked={closerForm.permissions?.can_view_all_data || false}
                  onCheckedChange={(checked) => setCloserForm({
                    ...closerForm,
                    permissions: {
                      ...closerForm.permissions,
                      can_view_all_data: checked
                    }
                  })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all"
            >
              {editingCloser ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer' : 'Create')}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* === TIER FORM DIALOG === */}
      <Dialog open={showTierForm || editingTier !== null} onOpenChange={(open) => { if (!open) { setShowTierForm(false); setEditingTier(null); setTierForm({ name: '', min_deals: 0, rate: 10 }); }}}>
        <DialogContent className={isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-secondary)]' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}>
              {editingTier ? (lang === 'fr' ? 'Modifier Palier' : 'Edit Tier') : (lang === 'fr' ? 'Nouveau Palier' : 'New Tier')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingTier ? handleUpdateTier : handleCreateTier} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{lang === 'fr' ? 'Nom du palier' : 'Tier Name'}</label>
              <input
                type="text"
                value={tierForm.name}
                onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                placeholder="ex: Bronze, Silver, Gold..."
                className={`w-full rounded-lg h-10 px-3 text-sm ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{lang === 'fr' ? 'Nombre minimum de deals signés' : 'Minimum signed deals'}</label>
              <input
                type="number"
                min="0"
                value={tierForm.min_deals}
                onChange={(e) => setTierForm({ ...tierForm, min_deals: parseInt(e.target.value) })}
                className={`w-full rounded-lg h-10 px-3 text-sm ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{lang === 'fr' ? 'Taux de commission (%)' : 'Commission rate (%)'}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={tierForm.rate}
                onChange={(e) => setTierForm({ ...tierForm, rate: parseFloat(e.target.value) })}
                className={`w-full rounded-lg h-10 px-3 text-sm ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)]' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all"
            >
              {editingTier ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer' : 'Create')}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
