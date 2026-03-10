import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Target, TrendingUp, DollarSign, Award, Plus, Edit2, Trash2,
  LogOut, Clock, CheckCircle, XCircle, ArrowUp, Zap, BarChart3, User,
  FileText, FileSearch, Eye, Calendar, Building2, Download, RefreshCw,
  Euro, AlertTriangle, Sparkles, Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Progress } from '../../components/ui/progress';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  en_cours: { label: 'En cours', labelEn: 'In progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  signe: { label: 'Signé', labelEn: 'Signed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  perdu: { label: 'Perdu', labelEn: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
};

export default function CloserDashboard() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDealForm, setShowDealForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealForm, setDealForm] = useState({ client_name: '', client_email: '', amount_ht: '', notes: '' });
  
  // Permissions state
  const [permissions, setPermissions] = useState({ modules: [], can_view_all_data: false });
  const [activeTab, setActiveTab] = useState('deals'); // 'deals', 'quotes', 'audits'
  const [quotes, setQuotes] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loadingModule, setLoadingModule] = useState(false);
  
  // Quote creation state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    client_name: '', client_email: '', client_company: '',
    service_description: '', price_ht: '', notes: ''
  });
  
  // Audit creation state
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [generatingAudit, setGeneratingAudit] = useState(false);
  const [auditForm, setAuditForm] = useState({
    client_name: '', client_city: '', client_sector: '', client_email: '',
    problem_description: '', hours_lost_per_week: '', hourly_cost: '45',
    complexity: 'medium', notes: ''
  });

  const token = localStorage.getItem('receipty-admin-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchDashboard();
    fetchPermissions();
  }, [token]);

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`${API}/closer/permissions`, { headers });
      setPermissions(res.data.permissions || { modules: [], can_view_all_data: false });
    } catch (err) {
      console.error('Failed to fetch permissions');
    }
  };

  const fetchQuotes = async () => {
    setLoadingModule(true);
    try {
      const res = await axios.get(`${API}/closer/quotes`, { headers });
      setQuotes(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(lang === 'fr' ? 'Accès non autorisé' : 'Access denied');
      }
    } finally {
      setLoadingModule(false);
    }
  };

  const fetchAudits = async () => {
    setLoadingModule(true);
    try {
      const res = await axios.get(`${API}/closer/audits`, { headers });
      setAudits(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(lang === 'fr' ? 'Accès non autorisé' : 'Access denied');
      }
    } finally {
      setLoadingModule(false);
    }
  };

  // Fetch module data when tab changes
  useEffect(() => {
    if (activeTab === 'quotes' && permissions.modules.includes('quotes')) {
      fetchQuotes();
    } else if (activeTab === 'audits' && permissions.modules.includes('audits')) {
      fetchAudits();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      const [dashRes, dealsRes] = await Promise.all([
        axios.get(`${API}/closer/dashboard`, { headers }),
        axios.get(`${API}/deals`, { headers }),
      ]);
      setDashboard(dashRes.data);
      setDeals(dealsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('receipty-admin-token');
        navigate('/admin');
      }
      toast.error(lang === 'fr' ? 'Erreur de chargement' : 'Loading error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/deals`, {
        ...dealForm,
        amount_ht: parseFloat(dealForm.amount_ht)
      }, { headers });
      toast.success(lang === 'fr' ? 'Deal créé !' : 'Deal created!');
      setShowDealForm(false);
      resetForm();
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleUpdateDeal = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/deals/${editingDeal.id}`, {
        client_name: dealForm.client_name,
        client_email: dealForm.client_email,
        amount_ht: parseFloat(dealForm.amount_ht),
        notes: dealForm.notes
      }, { headers });
      toast.success(lang === 'fr' ? 'Deal mis à jour' : 'Deal updated');
      setEditingDeal(null);
      resetForm();
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleDeleteDeal = async (id) => {
    if (!window.confirm(lang === 'fr' ? 'Supprimer ce deal ?' : 'Delete this deal?')) return;
    try {
      await axios.delete(`${API}/deals/${id}`, { headers });
      toast.success(lang === 'fr' ? 'Deal supprimé' : 'Deal deleted');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const handleMarkAsLost = async (id) => {
    if (!window.confirm(lang === 'fr' ? 'Marquer comme perdu ?' : 'Mark as lost?')) return;
    try {
      await axios.put(`${API}/deals/${id}`, { status: 'perdu' }, { headers });
      toast.success(lang === 'fr' ? 'Deal marqué perdu' : 'Deal marked as lost');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  const resetForm = () => {
    setDealForm({ client_name: '', client_email: '', amount_ht: '', notes: '' });
  };

  // Quote creation handler
  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!quoteForm.client_name || !quoteForm.service_description || !quoteForm.price_ht) {
      toast.error(lang === 'fr' ? 'Remplissez tous les champs obligatoires' : 'Fill all required fields');
      return;
    }
    setGeneratingQuote(true);
    try {
      const response = await axios.post(`${API}/closer/quotes/generate`, {
        ...quoteForm,
        price_ht: parseFloat(quoteForm.price_ht)
      }, { headers, responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Devis_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(lang === 'fr' ? 'Devis généré et téléchargé !' : 'Quote generated and downloaded!');
      setShowQuoteForm(false);
      setQuoteForm({ client_name: '', client_email: '', client_company: '', service_description: '', price_ht: '', notes: '' });
      fetchQuotes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    } finally {
      setGeneratingQuote(false);
    }
  };

  // Audit creation handler
  const handleCreateAudit = async (e) => {
    e.preventDefault();
    if (!auditForm.client_name || !auditForm.problem_description || !auditForm.hours_lost_per_week || !auditForm.hourly_cost) {
      toast.error(lang === 'fr' ? 'Remplissez tous les champs obligatoires' : 'Fill all required fields');
      return;
    }
    setGeneratingAudit(true);
    try {
      await axios.post(`${API}/closer/audits`, {
        ...auditForm,
        hours_lost_per_week: parseFloat(auditForm.hours_lost_per_week),
        hourly_cost: parseFloat(auditForm.hourly_cost)
      }, { headers });
      
      toast.success(lang === 'fr' ? 'Audit créé avec succès !' : 'Audit created successfully!');
      setShowAuditForm(false);
      setAuditForm({ client_name: '', client_city: '', client_sector: '', client_email: '', problem_description: '', hours_lost_per_week: '', hourly_cost: '45', complexity: 'medium', notes: '' });
      fetchAudits();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    } finally {
      setGeneratingAudit(false);
    }
  };

  // Real-time calculations
  const quoteHT = parseFloat(quoteForm.price_ht) || 0;
  const quoteTVA = quoteHT * 0.20;
  const quoteTTC = quoteHT + quoteTVA;
  
  const auditHoursPerWeek = parseFloat(auditForm.hours_lost_per_week) || 0;
  const auditHourlyCost = parseFloat(auditForm.hourly_cost) || 0;
  const auditAnnualLoss = auditHoursPerWeek * 52 * auditHourlyCost;

  const logout = () => {
    localStorage.removeItem('receipty-admin-token');
    localStorage.removeItem('receipty-admin-email');
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className={`pt-24 min-h-screen flex items-center justify-center ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
        <div className="text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
      </div>
    );
  }

  const { stats, tiers, next_tier, deals_to_next_tier, user } = dashboard || {};
  const progressToNextTier = next_tier ? ((stats?.deals_signes || 0) / next_tier.min_deals) * 100 : 100;

  return (
    <div data-testid="closer-dashboard" className={`pt-24 min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {lang === 'fr' ? 'Mon Dashboard' : 'My Dashboard'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {lang === 'fr' ? 'Bienvenue' : 'Welcome'}, {user?.name || user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className={`flex items-center gap-2 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <LogOut className="w-4 h-4" />
            {lang === 'fr' ? 'Déconnexion' : 'Logout'}
          </button>
        </div>

        {/* Tier Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 mb-6 ${
            stats?.current_tier_name === 'Gold' ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent' :
            stats?.current_tier_name === 'Silver' ? 'border-gray-500/30 bg-gradient-to-br from-gray-500/10 to-transparent' :
            isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                stats?.current_tier_name === 'Gold' ? 'bg-amber-500/20' :
                stats?.current_tier_name === 'Silver' ? 'bg-gray-500/20' : 'bg-orange-500/20'
              }`}>
                <Award className={`w-7 h-7 ${
                  stats?.current_tier_name === 'Gold' ? 'text-amber-400' :
                  stats?.current_tier_name === 'Silver' ? 'text-gray-400' : 'text-orange-400'
                }`} />
              </div>
              <div>
                <h2 className={`font-heading text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang === 'fr' ? 'Palier' : 'Tier'}: {stats?.current_tier_name}
                </h2>
                <p className="text-gray-500 text-sm">
                  {lang === 'fr' ? 'Taux de commission actuel' : 'Current commission rate'}: <span className="text-blue-400 font-bold">{stats?.current_tier_rate}%</span>
                </p>
              </div>
            </div>
            {next_tier && (
              <div className="text-right">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? 'Prochain palier' : 'Next tier'}: <span className="font-semibold">{next_tier.name}</span> ({next_tier.rate}%)
                </p>
                <p className="text-xs text-gray-500">
                  {deals_to_next_tier} {lang === 'fr' ? 'deals restants' : 'deals remaining'}
                </p>
              </div>
            )}
          </div>
          {next_tier && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{stats?.deals_signes} / {next_tier.min_deals}</span>
                <span>{Math.round(progressToNextTier)}%</span>
              </div>
              <Progress value={progressToNextTier} className="h-2" />
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-xl border p-4 ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-500">{lang === 'fr' ? 'Total Deals' : 'Total Deals'}</span>
            </div>
            <p className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.total_deals || 0}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`rounded-xl border p-4 ${isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-500">{lang === 'fr' ? 'Signés' : 'Signed'}</span>
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-400">{stats?.deals_signes || 0}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-xl border p-4 ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-500">{lang === 'fr' ? 'CA Généré' : 'Revenue Generated'}</span>
            </div>
            <p className={`font-mono text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{(stats?.total_ca || 0).toLocaleString()}€</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`rounded-xl border p-4 ${isDark ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-500">{lang === 'fr' ? 'Commissions' : 'Commissions'}</span>
            </div>
            <p className="font-mono text-2xl font-bold text-purple-400">{(stats?.total_commission || 0).toLocaleString()}€</p>
          </motion.div>
        </div>

        {/* Navigation Tabs - Dynamic based on permissions */}
        <div className={`flex gap-2 p-1 rounded-lg mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
          <button
            onClick={() => setActiveTab('deals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'deals'
                ? 'bg-blue-600 text-white'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="tab-deals"
          >
            <Target className="w-4 h-4" />
            {lang === 'fr' ? 'Mes Deals' : 'My Deals'}
          </button>
          
          {permissions.modules.includes('quotes') && (
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'quotes'
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="tab-quotes"
            >
              <FileText className="w-4 h-4" />
              {lang === 'fr' ? 'Devis' : 'Quotes'}
            </button>
          )}
          
          {permissions.modules.includes('audits') && (
            <button
              onClick={() => setActiveTab('audits')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'audits'
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="tab-audits"
            >
              <FileSearch className="w-4 h-4" />
              {lang === 'fr' ? 'Audits ROI' : 'ROI Audits'}
            </button>
          )}
        </div>

        {/* DEALS TAB */}
        {activeTab === 'deals' && (
          <>
            {/* Quick Add Deal Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowDealForm(true)}
              className="w-full mb-6 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
              data-testid="add-deal-btn"
            >
              <Plus className="w-5 h-5" />
              {lang === 'fr' ? 'Ajouter un nouveau prospect' : 'Add a new prospect'}
            </motion.button>

            {/* Deals List */}
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {lang === 'fr' ? 'Mes Deals' : 'My Deals'}
            </h2>
          </div>

          {deals.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">
                {lang === 'fr' ? 'Aucun deal pour le moment. Commencez par ajouter un prospect !' : 'No deals yet. Start by adding a prospect!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {deals.map((deal, index) => {
                const StatusIcon = statusConfig[deal.status]?.icon || Clock;
                return (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          deal.status === 'signe' ? 'bg-emerald-500/20' :
                          deal.status === 'perdu' ? 'bg-red-500/20' : 'bg-amber-500/20'
                        }`}>
                          <StatusIcon className={`w-5 h-5 ${
                            deal.status === 'signe' ? 'text-emerald-400' :
                            deal.status === 'perdu' ? 'text-red-400' : 'text-amber-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.client_name}</h3>
                          <p className="text-xs text-gray-500">{deal.client_email || 'No email'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className={`font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.amount_ht.toLocaleString()}€</p>
                          {deal.status === 'signe' && (
                            <p className="text-xs text-emerald-400">
                              +{deal.commission_amount.toLocaleString()}€ ({deal.commission_rate}%)
                            </p>
                          )}
                        </div>

                        <Badge className={statusConfig[deal.status]?.color}>
                          {lang === 'fr' ? statusConfig[deal.status]?.label : statusConfig[deal.status]?.labelEn}
                        </Badge>

                        {deal.status === 'en_cours' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingDeal(deal); setDealForm({ client_name: deal.client_name, client_email: deal.client_email, amount_ht: deal.amount_ht.toString(), notes: deal.notes }); }}
                              className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleMarkAsLost(deal.id)}
                              className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                              title={lang === 'fr' ? 'Marquer perdu' : 'Mark as lost'}
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteDeal(deal.id)}
                              className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {deal.notes && (
                      <p className={`mt-2 text-xs pl-14 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                        {deal.notes}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Tiers Display */}
        <div className={`mt-6 rounded-xl border p-4 ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {lang === 'fr' ? 'Paliers de commission' : 'Commission Tiers'}
          </h3>
          <div className="flex gap-4">
            {tiers?.map((tier) => (
              <div
                key={tier.id}
                className={`flex-1 p-3 rounded-lg text-center ${
                  tier.name === stats?.current_tier_name
                    ? tier.name === 'Gold' ? 'bg-amber-500/20 border border-amber-500/30' :
                      tier.name === 'Silver' ? 'bg-gray-500/20 border border-gray-500/30' :
                      'bg-orange-500/20 border border-orange-500/30'
                    : isDark ? 'bg-white/5' : 'bg-gray-50'
                }`}
              >
                <p className={`text-xs ${tier.name === stats?.current_tier_name ? 'text-white' : 'text-gray-500'}`}>
                  {tier.name}
                </p>
                <p className={`font-mono font-bold text-lg ${
                  tier.name === stats?.current_tier_name
                    ? tier.name === 'Gold' ? 'text-amber-400' :
                      tier.name === 'Silver' ? 'text-gray-300' : 'text-orange-400'
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {tier.rate}%
                </p>
                <p className="text-[10px] text-gray-600">
                  {tier.min_deals}+ deals
                </p>
              </div>
            ))}
          </div>
        </div>
          </>
        )}

        {/* QUOTES TAB */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            {/* Header with Create button */}
            <div className="flex justify-between items-center">
              <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Génération de Devis PDF' : 'PDF Quote Generation'}
              </h2>
              <button
                onClick={() => setShowQuoteForm(!showQuoteForm)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
                data-testid="closer-new-quote-btn"
              >
                <Plus className="w-4 h-4" />
                {lang === 'fr' ? 'Nouveau devis' : 'New quote'}
              </button>
            </div>

            {/* Quote Creation Form */}
            <AnimatePresence>
              {showQuoteForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#0F0F10]' : 'border-gray-200 bg-white'}`}
                >
                  <form onSubmit={handleCreateQuote} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {lang === 'fr' ? 'Nom du client' : 'Client name'} *
                        </label>
                        <input
                          type="text"
                          value={quoteForm.client_name}
                          onChange={(e) => setQuoteForm({ ...quoteForm, client_name: e.target.value })}
                          placeholder="Jean Dupont"
                          className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {lang === 'fr' ? 'Société' : 'Company'}
                        </label>
                        <input
                          type="text"
                          value={quoteForm.client_company}
                          onChange={(e) => setQuoteForm({ ...quoteForm, client_company: e.target.value })}
                          placeholder="Entreprise SAS"
                          className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</label>
                        <input
                          type="email"
                          value={quoteForm.client_email}
                          onChange={(e) => setQuoteForm({ ...quoteForm, client_email: e.target.value })}
                          placeholder="client@email.com"
                          className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lang === 'fr' ? 'Description des services' : 'Service description'} *
                      </label>
                      <textarea
                        value={quoteForm.service_description}
                        onChange={(e) => setQuoteForm({ ...quoteForm, service_description: e.target.value })}
                        placeholder={lang === 'fr' ? 'Décrivez les services proposés...' : 'Describe the services...'}
                        rows={4}
                        className={`w-full rounded-lg px-4 py-3 text-sm outline-none resize-y ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                        }`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {lang === 'fr' ? 'Prix HT (€)' : 'Price excl. VAT (€)'} *
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={quoteForm.price_ht}
                          onChange={(e) => setQuoteForm({ ...quoteForm, price_ht: e.target.value })}
                          placeholder="1000.00"
                          className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                      
                      {/* Real-time calculation */}
                      <div className={`rounded-xl p-4 ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Calculator className="w-4 h-4 text-blue-400" />
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {lang === 'fr' ? 'Calcul automatique' : 'Automatic calculation'}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">{lang === 'fr' ? 'Prix HT' : 'Price excl. VAT'}</span>
                            <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{quoteHT.toLocaleString()}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">TVA (20%)</span>
                            <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{quoteTVA.toLocaleString()}€</span>
                          </div>
                          <div className={`border-t pt-2 flex justify-between ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total TTC</span>
                            <span className="font-bold font-mono text-blue-400">{quoteTTC.toLocaleString()}€</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowQuoteForm(false)}
                        className={`px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {lang === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={generatingQuote}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-all"
                      >
                        {generatingQuote ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" />{lang === 'fr' ? 'Génération...' : 'Generating...'}</>
                        ) : (
                          <><Download className="w-4 h-4" />{lang === 'fr' ? 'Générer et Télécharger' : 'Generate and Download'}</>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quotes List */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                <h4 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? `Historique des devis (${quotes.length})` : `Quote history (${quotes.length})`}
                </h4>
              </div>
              
              {loadingModule ? (
                <div className="p-12 text-center text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
              ) : quotes.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">{lang === 'fr' ? 'Aucun devis' : 'No quotes'}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {quotes.map((quote, index) => (
                    <motion.div
                      key={quote.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {quote.company_name || quote.contact_name || quote.client_name || 'Sans nom'}
                            </h3>
                            <p className="text-xs text-gray-500">{quote.contact_email || quote.client_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {(quote.total_setup || quote.price_ttc || 0).toLocaleString()}€
                            </p>
                            {quote.total_monthly > 0 && (
                              <p className="text-xs text-gray-500">+ {(quote.total_monthly || 0).toLocaleString()}€/mois</p>
                            )}
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {quote.category || quote.quote_number || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AUDITS TAB */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            {/* Header with Create button */}
            <div className="flex justify-between items-center">
              <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Audit & ROI Optimizer' : 'Audit & ROI Optimizer'}
              </h2>
              <button
                onClick={() => setShowAuditForm(!showAuditForm)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
                data-testid="closer-new-audit-btn"
              >
                <Plus className="w-4 h-4" />
                {lang === 'fr' ? 'Nouvel audit' : 'New audit'}
              </button>
            </div>

            {/* Audit Creation Form */}
            <AnimatePresence>
              {showAuditForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-[#0F0F10]' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h4 className={`font-heading text-md font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {lang === 'fr' ? 'Créer un nouvel audit' : 'Create a new audit'}
                    </h4>
                  </div>
                  
                  <form onSubmit={handleCreateAudit} className="space-y-6">
                    {/* Client Information */}
                    <div>
                      <h5 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Building2 className="w-4 h-4" />
                        {lang === 'fr' ? 'Informations Client' : 'Client Information'}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className={`block text-xs mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {lang === 'fr' ? 'Nom / Entreprise' : 'Name / Company'} *
                          </label>
                          <input
                            type="text"
                            value={auditForm.client_name}
                            onChange={(e) => setAuditForm({ ...auditForm, client_name: e.target.value })}
                            placeholder="Entreprise SAS"
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                              isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            }`}
                            required
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {lang === 'fr' ? 'Ville' : 'City'}
                          </label>
                          <input
                            type="text"
                            value={auditForm.client_city}
                            onChange={(e) => setAuditForm({ ...auditForm, client_city: e.target.value })}
                            placeholder="Strasbourg"
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                              isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {lang === 'fr' ? 'Secteur' : 'Sector'}
                          </label>
                          <input
                            type="text"
                            value={auditForm.client_sector}
                            onChange={(e) => setAuditForm({ ...auditForm, client_sector: e.target.value })}
                            placeholder="RH, Finance, Logistique..."
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                              isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Email</label>
                          <input
                            type="email"
                            value={auditForm.client_email}
                            onChange={(e) => setAuditForm({ ...auditForm, client_email: e.target.value })}
                            placeholder="contact@client.com"
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                              isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div>
                      <h5 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <AlertTriangle className="w-4 h-4" />
                        {lang === 'fr' ? 'Diagnostic Technique' : 'Technical Diagnosis'}
                      </h5>
                      <textarea
                        value={auditForm.problem_description}
                        onChange={(e) => setAuditForm({ ...auditForm, problem_description: e.target.value })}
                        placeholder={lang === 'fr' 
                          ? "Décrivez le problème manuel identifié chez le client...\nEx: Saisie manuelle des factures, tri des CV, gestion des emails..."
                          : "Describe the manual problem identified..."
                        }
                        rows={4}
                        className={`w-full rounded-lg px-4 py-3 text-sm outline-none resize-y ${
                          isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                        }`}
                        required
                      />
                    </div>

                    {/* Financial Parameters */}
                    <div>
                      <h5 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Euro className="w-4 h-4" />
                        {lang === 'fr' ? 'Paramètres Financiers' : 'Financial Parameters'}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-xs mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {lang === 'fr' ? 'Heures perdues / semaine' : 'Hours lost / week'} *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={auditForm.hours_lost_per_week}
                            onChange={(e) => setAuditForm({ ...auditForm, hours_lost_per_week: e.target.value })}
                            placeholder="10"
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                              isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            }`}
                            required
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {lang === 'fr' ? 'Coût horaire employé (€)' : 'Hourly employee cost (€)'} *
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={auditForm.hourly_cost}
                            onChange={(e) => setAuditForm({ ...auditForm, hourly_cost: e.target.value })}
                            placeholder="35"
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                              isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            }`}
                            required
                          />
                        </div>
                        <div>
                          <label className={`block text-xs mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {lang === 'fr' ? 'Complexité estimée' : 'Estimated complexity'}
                          </label>
                          <select
                            value={auditForm.complexity}
                            onChange={(e) => setAuditForm({ ...auditForm, complexity: e.target.value })}
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${
                              isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                            }`}
                          >
                            <option value="low">{lang === 'fr' ? 'Basse (85% réduction)' : 'Low (85% reduction)'}</option>
                            <option value="medium">{lang === 'fr' ? 'Moyenne (75% réduction)' : 'Medium (75% reduction)'}</option>
                            <option value="high">{lang === 'fr' ? 'Haute (65% réduction)' : 'High (65% reduction)'}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Real-time calculation preview */}
                    {auditAnnualLoss > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl p-4 ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                              {lang === 'fr' ? "Coût de l'inaction estimé" : 'Estimated cost of inaction'}
                            </p>
                            <p className="text-xl font-bold text-red-400">{auditAnnualLoss.toLocaleString()}€ / {lang === 'fr' ? 'an' : 'year'}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAuditForm(false)}
                        className={`px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {lang === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={generatingAudit}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-all"
                      >
                        {generatingAudit ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" />{lang === 'fr' ? 'Génération IA...' : 'AI Generation...'}</>
                        ) : (
                          <><Sparkles className="w-4 h-4" />{lang === 'fr' ? "Générer l'audit" : 'Generate audit'}</>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Audits List */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                <h4 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lang === 'fr' ? `Historique des audits (${audits.length})` : `Audit history (${audits.length})`}
                </h4>
              </div>
              
              {loadingModule ? (
                <div className="p-12 text-center text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</div>
              ) : audits.length === 0 ? (
                <div className="p-12 text-center">
                  <FileSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">{lang === 'fr' ? 'Aucun audit' : 'No audits'}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {audits.map((audit, index) => (
                    <motion.div
                      key={audit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <FileSearch className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {audit.client_name || audit.company_name || 'Audit'}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Building2 className="w-3 h-3" />
                              {audit.client_sector || audit.company_size || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{lang === 'fr' ? 'Économies/an' : 'Savings/year'}</p>
                            <p className="font-mono font-bold text-emerald-400">
                              +{(audit.annual_savings || audit.estimated_roi || 0).toLocaleString()}€
                            </p>
                          </div>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {audit.audit_number || audit.category || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Deal Form Dialog */}
      <Dialog open={showDealForm || editingDeal !== null} onOpenChange={(open) => { if (!open) { setShowDealForm(false); setEditingDeal(null); resetForm(); }}}>
        <DialogContent className={isDark ? 'bg-[#0F0F10] border-white/10' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              {editingDeal ? (lang === 'fr' ? 'Modifier le deal' : 'Edit Deal') : (lang === 'fr' ? 'Nouveau Prospect' : 'New Prospect')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingDeal ? handleUpdateDeal : handleCreateDeal} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{lang === 'fr' ? 'Nom du client / Entreprise' : 'Client Name / Company'} *</label>
              <input
                type="text"
                value={dealForm.client_name}
                onChange={(e) => setDealForm({ ...dealForm, client_name: e.target.value })}
                placeholder="ex: Entreprise ABC"
                className={`w-full rounded-lg h-11 px-4 text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
              <input
                type="email"
                value={dealForm.client_email}
                onChange={(e) => setDealForm({ ...dealForm, client_email: e.target.value })}
                placeholder="contact@entreprise.fr"
                className={`w-full rounded-lg h-11 px-4 text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{lang === 'fr' ? 'Montant du devis HT (€)' : 'Quote Amount excl. VAT (€)'} *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dealForm.amount_ht}
                onChange={(e) => setDealForm({ ...dealForm, amount_ht: e.target.value })}
                placeholder="15000"
                className={`w-full rounded-lg h-11 px-4 text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">{lang === 'fr' ? 'Notes' : 'Notes'}</label>
              <textarea
                value={dealForm.notes}
                onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                placeholder={lang === 'fr' ? 'Contexte, source du lead...' : 'Context, lead source...'}
                rows={3}
                className={`w-full rounded-lg px-4 py-3 text-sm resize-none ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all"
            >
              {editingDeal ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer le deal' : 'Create Deal')}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
