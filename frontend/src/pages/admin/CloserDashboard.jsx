import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Target, TrendingUp, DollarSign, Award, Plus, Edit2, Trash2,
  LogOut, Clock, CheckCircle, XCircle, ArrowUp, Zap, BarChart3, User,
  FileText, FileSearch, Eye, Calendar, Building2
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
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
              <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Devis' : 'Quotes'}
                {!permissions.can_view_all_data && (
                  <span className="ml-2 text-xs text-gray-500">({lang === 'fr' ? 'Mes devis uniquement' : 'My quotes only'})</span>
                )}
              </h2>
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
                            {quote.company_name || quote.contact_name || 'Sans nom'}
                          </h3>
                          <p className="text-xs text-gray-500">{quote.contact_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {(quote.total_setup || 0).toLocaleString()}€
                          </p>
                          <p className="text-xs text-gray-500">
                            + {(quote.total_monthly || 0).toLocaleString()}€/mois
                          </p>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {quote.category || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDITS TAB */}
        {activeTab === 'audits' && (
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
              <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lang === 'fr' ? 'Audits ROI' : 'ROI Audits'}
                {!permissions.can_view_all_data && (
                  <span className="ml-2 text-xs text-gray-500">({lang === 'fr' ? 'Mes audits uniquement' : 'My audits only'})</span>
                )}
              </h2>
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
                            {audit.company_name || 'Audit'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Building2 className="w-3 h-3" />
                            {audit.company_size || 'N/A'} employés
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{lang === 'fr' ? 'ROI estimé' : 'Estimated ROI'}</p>
                          <p className="font-mono font-bold text-emerald-400">
                            +{(audit.estimated_roi || 0).toLocaleString()}%
                          </p>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {audit.category || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
