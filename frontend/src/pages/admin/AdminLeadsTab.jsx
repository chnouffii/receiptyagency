import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Users, UserPlus, UserCheck, Trophy, DollarSign, CalendarClock, Search, Download, Filter, FileText, CheckCircle, FileSearch, Plus, X, Building2, Mail, Phone, Euro, Tag, Phone as PhoneIcon, Sparkles, StickyNote, ChevronDown, ChevronUp, RefreshCw, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  new: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  contacted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  qualified: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  converted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const CATEGORIES = [
  { value: 'Receipty Talent', label: 'Receipty Talent (RH)' },
  { value: 'Receipty Spend', label: 'Receipty Spend (Finance)' },
  { value: 'Web-on-Demand', label: 'Web-on-Demand' },
  { value: 'Autre', label: 'Autre' },
];

export default function AdminLeadsTab({ token, stats, onRefresh, onCreateQuote, onCreateAudit, isDark }) {
  const { t, lang } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  // Call notes state
  const [notesLead, setNotesLead] = useState(null); // lead object currently open
  const [callNotes, setCallNotes] = useState('');
  const [callSummary, setCallSummary] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    category: '',
    estimated_setup: '',
    estimated_monthly: '',
    notes: ''
  });

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      company: '',
      phone: '',
      category: '',
      estimated_setup: '',
      estimated_monthly: '',
      notes: ''
    });
  };

  const fetchLeads = useCallback(async () => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (statusFilter && statusFilter !== 'all') params.status_filter = statusFilter;
    try {
      const res = await axios.get(`${API}/leads`, { headers, params });
      setLeads(res.data);
    } catch {}
  }, [searchQuery, statusFilter, token]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error(lang === 'fr' ? 'Nom et email requis' : 'Name and email required');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/admin/leads`, {
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
        category: form.category,
        estimated_setup: parseFloat(form.estimated_setup) || 0,
        estimated_monthly: parseFloat(form.estimated_monthly) || 0,
        notes: form.notes
      }, { headers });
      
      toast.success(lang === 'fr' ? 'Lead créé avec succès' : 'Lead created successfully');
      resetForm();
      setShowForm(false);
      fetchLeads();
      onRefresh();
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur lors de la création' : 'Error creating lead');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (leadId, status) => {
    try {
      await axios.patch(`${API}/leads/${leadId}/status`, { status }, { headers });
      toast.success('Status updated');
      fetchLeads();
      onRefresh();
    } catch { toast.error('Error'); }
  };

  const deleteLead = async (leadId) => {
    try {
      await axios.delete(`${API}/leads/${leadId}`, { headers });
      toast.success('Lead deleted');
      fetchLeads();
      onRefresh();
    } catch { toast.error('Error'); }
  };

  const openCallNotes = async (lead) => {
    setNotesLead(lead);
    setCallNotes('');
    setCallSummary(null);
    try {
      const res = await axios.get(`${API}/admin/leads/${lead.id}/call-notes`, { headers });
      setCallNotes(res.data.notes || '');
      setCallSummary(res.data.summary || null);
    } catch {}
  };

  const saveCallNotes = async (generateSummary = false) => {
    if (!notesLead) return;
    if (generateSummary) {
      setGeneratingSummary(true);
    } else {
      setSavingNotes(true);
    }
    try {
      const res = await axios.put(`${API}/admin/leads/${notesLead.id}/call-notes`, {
        notes: callNotes,
        generate_summary: generateSummary
      }, { headers });
      if (res.data.summary) {
        setCallSummary(res.data.summary);
        toast.success(lang === 'fr' ? 'Résumé IA généré !' : 'AI summary generated!');
      } else {
        toast.success(lang === 'fr' ? 'Notes sauvegardées !' : 'Notes saved!');
      }
    } catch {
      toast.error(lang === 'fr' ? 'Erreur sauvegarde' : 'Save failed');
    } finally {
      setSavingNotes(false);
      setGeneratingSummary(false);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await axios.get(`${API}/leads/export`, { headers, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'receipty_leads.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(lang === 'fr' ? 'CSV téléchargé' : 'CSV downloaded');
    } catch { toast.error('Export failed'); }
  };

  const statCards = stats ? [
    { label: t.admin.total, value: stats.total_leads, icon: Users, color: 'text-gray-300' },
    { label: t.admin.new_label, value: stats.new_leads, icon: UserPlus, color: 'text-sky-400' },
    { label: t.admin.contacted, value: stats.contacted, icon: CalendarClock, color: 'text-amber-400' },
    { label: t.admin.qualified, value: stats.qualified, icon: UserCheck, color: 'text-blue-400' },
    { label: t.admin.converted, value: stats.converted, icon: Trophy, color: 'text-emerald-400' },
    { label: t.admin.revenue, value: `${stats.total_setup_revenue?.toLocaleString() || 0} EUR`, icon: DollarSign, color: 'text-blue-400' },
  ] : [];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl border p-4 ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`} data-testid={`admin-stat-${i}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`font-mono text-xl font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* New Lead Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className={`rounded-xl p-6 ${isDark ? 'bg-[var(--bg-secondary)] border border-[var(--border-secondary)]' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`font-heading text-md font-semibold flex items-center gap-2 ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  {lang === 'fr' ? 'Nouveau Lead' : 'New Lead'}
                </h3>
                <button 
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-2 text-gray-500 hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {lang === 'fr' ? 'Informations Contact' : 'Contact Information'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">
                        {lang === 'fr' ? 'Nom *' : 'Name *'}
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jean Dupont"
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="jean@entreprise.fr"
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg pl-10 pr-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">
                        {lang === 'fr' ? 'Entreprise' : 'Company'}
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          placeholder="Entreprise SAS"
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg pl-10 pr-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">
                        {lang === 'fr' ? 'Téléphone' : 'Phone'}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+33 6 12 34 56 78"
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg pl-10 pr-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {lang === 'fr' ? 'Informations Commerciales' : 'Business Information'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">
                        {lang === 'fr' ? 'Catégorie' : 'Category'}
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                      >
                        <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">
                        {lang === 'fr' ? 'Budget Setup (€)' : 'Setup Budget (€)'}
                      </label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={form.estimated_setup}
                          onChange={(e) => setForm({ ...form, estimated_setup: e.target.value })}
                          placeholder="5000"
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg pl-10 pr-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">
                        {lang === 'fr' ? 'Budget Mensuel (€)' : 'Monthly Budget (€)'}
                      </label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={form.estimated_monthly}
                          onChange={(e) => setForm({ ...form, estimated_monthly: e.target.value })}
                          placeholder="500"
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg pl-10 pr-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    {lang === 'fr' ? 'Notes (optionnel)' : 'Notes (optional)'}
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder={lang === 'fr' ? 'Informations additionnelles sur le prospect...' : 'Additional information about the prospect...'}
                    rows={2}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="px-4 py-2.5 text-sm text-gray-400 hover:text-[var(--text-primary)] transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-5 py-2.5 font-medium text-sm transition-all"
                  >
                    {saving ? (
                      <span className="animate-pulse">{lang === 'fr' ? 'Création...' : 'Creating...'}</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        {lang === 'fr' ? 'Créer le lead' : 'Create Lead'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className={`p-3 sm:p-4 border-b ${isDark ? 'border-[var(--border-primary)]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-0 sm:hidden">
            <h2 className={`font-heading text-base font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{t.admin.leads}</h2>
            <button onClick={() => setShowForm(true)} data-testid="admin-new-lead-btn" className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200">
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Nouveau' : 'New'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-between">
            <h2 className={`hidden sm:block font-heading text-lg font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{t.admin.leads}</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'} data-testid="admin-search-input" className={`w-full sm:w-48 rounded-lg text-sm h-10 sm:h-9 pl-9 pr-3 outline-none transition-all duration-200 ${isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] focus:border-blue-500/50 text-[var(--text-primary)] placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 focus:border-blue-500 text-gray-900 placeholder:text-gray-400'}`} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-[110px] sm:w-[130px] h-10 sm:h-9 text-xs ${isDark ? 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)]' : 'border-gray-200 bg-gray-50'}`} data-testid="admin-status-filter">
                  <Filter className="w-3 h-3 mr-1 text-gray-500 shrink-0" /><SelectValue />
                </SelectTrigger>
                <SelectContent className={isDark ? 'bg-[var(--bg-secondary)] border-[var(--border-secondary)]' : 'bg-white border-gray-200'}>
                  <SelectItem value="all">{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={exportCSV} data-testid="admin-export-csv-btn" className={`flex items-center gap-1.5 h-10 sm:h-9 px-3 text-xs border rounded-lg transition-all duration-200 shrink-0 ${isDark ? 'text-gray-400 hover:text-[var(--text-primary)] border-[var(--border-secondary)] hover:border-[var(--border-hover)]' : 'text-gray-500 hover:text-gray-900 border-gray-200 hover:border-gray-300'}`}>
                <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">CSV</span>
              </button>
              <button onClick={() => setShowForm(true)} data-testid="admin-new-lead-btn" className="hidden sm:flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200">
                <Plus className="w-4 h-4" />
                {lang === 'fr' ? 'Nouveau' : 'New'}
              </button>
            </div>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t.admin.no_leads}</div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-[var(--border-primary)]">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-sm text-[var(--text-primary)]">
                        {lead.name}
                        {lead.has_quote && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" title="Devis créé" />}
                        {lead.has_audit && <FileSearch className="w-3.5 h-3.5 text-purple-400" title="Audit créé" />}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{lead.email}</div>
                      {lead.company && <div className="text-xs text-gray-500 mt-0.5">{lead.company}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openCallNotes(lead)} className={`p-2 rounded-lg transition-all ${lead.call_notes ? 'text-amber-400 hover:bg-amber-500/10' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'}`} title={lang === 'fr' ? 'Notes d\'appel' : 'Call notes'}>
                        <StickyNote className="w-4 h-4" />
                      </button>
                      <button onClick={() => onCreateAudit && onCreateAudit(lead)} data-testid={`create-audit-${lead.id}`} className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all" title="Audit ROI">
                        <FileSearch className="w-4 h-4" />
                      </button>
                      <button onClick={() => onCreateQuote && onCreateQuote(lead)} data-testid={`create-quote-${lead.id}`} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Devis">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteLead(lead.id)} data-testid={`delete-lead-${lead.id}`} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {lead.category ? (
                      <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">{lead.category}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500 border-gray-500/30">{lead.type || 'contact'}</Badge>
                    )}
                    <span className="text-xs font-mono text-gray-400">{lead.estimated_setup || 0}€ setup</span>
                    <span className="text-xs font-mono text-gray-400">{lead.estimated_monthly || 0}€/mo</span>
                  </div>
                  <Select value={lead.status} onValueChange={(val) => updateStatus(lead.id, val)}>
                    <SelectTrigger className={`w-full h-9 text-xs border ${STATUS_COLORS[lead.status] || ''} bg-transparent`} data-testid={`status-select-${lead.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-secondary)]">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--border-primary)] hover:bg-transparent">
                    <TableHead className="text-gray-500">Name</TableHead>
                    <TableHead className="text-gray-500">Email</TableHead>
                    <TableHead className="text-gray-500">Company</TableHead>
                    <TableHead className="text-gray-500">Category</TableHead>
                    <TableHead className="text-gray-500">Setup</TableHead>
                    <TableHead className="text-gray-500">Monthly</TableHead>
                    <TableHead className="text-gray-500">{t.admin.status}</TableHead>
                    <TableHead className="text-gray-500">{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="border-[var(--border-primary)] hover:bg-[var(--bg-hover)]">
                      <TableCell className="text-[var(--text-primary)] font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {lead.name}
                          {lead.has_quote && <span title="Devis créé" className="text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /></span>}
                          {lead.has_audit && <span title="Audit créé" className="text-purple-400"><FileSearch className="w-3.5 h-3.5" /></span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">{lead.email}</TableCell>
                      <TableCell className="text-gray-400 text-sm">{lead.company || '-'}</TableCell>
                      <TableCell>
                        {lead.category ? (
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 capitalize">{lead.category}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500 border-gray-500/30">{lead.type || 'contact'}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-300">{lead.estimated_setup || 0} EUR</TableCell>
                      <TableCell className="font-mono text-sm text-gray-300">{lead.estimated_monthly || 0} EUR/mo</TableCell>
                      <TableCell>
                        <Select value={lead.status} onValueChange={(val) => updateStatus(lead.id, val)}>
                          <SelectTrigger className={`w-[130px] h-8 text-xs border ${STATUS_COLORS[lead.status] || ''} bg-transparent`} data-testid={`status-select-${lead.id}`}><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-secondary)]">
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openCallNotes(lead)} className={`p-2 rounded-lg transition-all ${lead.call_notes ? 'text-amber-400 hover:bg-amber-500/10' : 'text-gray-600 hover:text-amber-400 hover:bg-amber-500/10'}`} title={lang === 'fr' ? 'Notes d\'appel' : 'Call notes'}>
                            <StickyNote className="w-4 h-4" />
                          </button>
                          <button onClick={() => onCreateAudit && onCreateAudit(lead)} data-testid={`create-audit-${lead.id}`} className="p-2 text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all" title={lang === 'fr' ? 'Créer un audit ROI' : 'Create ROI audit'}>
                            <FileSearch className="w-4 h-4" />
                          </button>
                          <button onClick={() => onCreateQuote && onCreateQuote(lead)} data-testid={`create-quote-${lead.id}`} className="p-2 text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title={lang === 'fr' ? 'Créer un devis' : 'Create quote'}>
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteLead(lead.id)} data-testid={`delete-lead-${lead.id}`} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Call Notes Slide-out Panel */}
      <AnimatePresence>
        {notesLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotesLead(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] shrink-0">
                <div>
                  <h2 className="font-heading text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-amber-400" />
                    {lang === 'fr' ? 'Notes d\'appel' : 'Call Notes'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{notesLead.name} {notesLead.company ? `· ${notesLead.company}` : ''}</p>
                </div>
                <button onClick={() => setNotesLead(null)} className="p-2 text-gray-500 hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Notes textarea */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    {lang === 'fr' ? 'Notes brutes de l\'appel' : 'Raw call notes'}
                  </label>
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={10}
                    placeholder={lang === 'fr'
                      ? 'Ex: Client intéressé par Receipty Talent. Budget ~3000€/mois. Principale douleur: gestion des notes de frais. RDV de démo fixé pour jeudi...'
                      : 'e.g.: Client interested in Receipty Talent. Budget ~3000€/month. Main pain point: expense management. Demo scheduled for Thursday...'}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-amber-500/50 outline-none resize-y leading-relaxed"
                  />
                  <p className="text-xs text-gray-600 mt-1 text-right">{callNotes.length}/5000</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => saveCallNotes(false)}
                    disabled={savingNotes || generatingSummary}
                    className="flex items-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] text-[var(--text-primary)] disabled:opacity-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    {savingNotes ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <StickyNote className="w-4 h-4 text-amber-400" />
                    )}
                    {lang === 'fr' ? 'Sauvegarder' : 'Save notes'}
                  </button>
                  <button
                    onClick={() => saveCallNotes(true)}
                    disabled={savingNotes || generatingSummary || !callNotes.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all shadow-lg shadow-violet-900/30"
                  >
                    {generatingSummary ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {lang === 'fr' ? 'Génération IA...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {lang === 'fr' ? 'Résumé IA' : 'AI Summary'}
                      </>
                    )}
                  </button>
                </div>

                {/* AI Summary */}
                <AnimatePresence>
                  {callSummary && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="rounded-xl border border-violet-500/30 bg-violet-500/5 overflow-hidden"
                    >
                      {/* Summary header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <span className="text-sm font-medium text-violet-300">
                            {lang === 'fr' ? 'Analyse IA' : 'AI Analysis'}
                          </span>
                        </div>
                        {typeof callSummary.score === 'number' && (
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-violet-400" />
                            <span className={`text-sm font-bold font-mono ${callSummary.score >= 70 ? 'text-emerald-400' : callSummary.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                              {callSummary.score}/100
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-4 space-y-4">
                        {/* Summary text */}
                        {callSummary.summary && (
                          <p className="text-sm text-gray-300 leading-relaxed italic">"{callSummary.summary}"</p>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          {/* Solution */}
                          {callSummary.solution && (
                            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {lang === 'fr' ? 'Solution' : 'Solution'}
                              </p>
                              <p className="text-xs font-medium text-blue-300">{callSummary.solution}</p>
                            </div>
                          )}
                          {/* Budget */}
                          {callSummary.budget && (
                            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Budget
                              </p>
                              <p className="text-xs font-medium text-emerald-300 font-mono">{callSummary.budget}</p>
                            </div>
                          )}
                        </div>

                        {/* Next step */}
                        {callSummary.next_step && (
                          <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              {lang === 'fr' ? 'Prochaine étape' : 'Next step'}
                            </p>
                            <p className="text-xs text-gray-200">{callSummary.next_step}</p>
                          </div>
                        )}

                        {/* Pain points */}
                        {callSummary.pain_points?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              {lang === 'fr' ? 'Points de douleur' : 'Pain points'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {callSummary.pain_points.map((p, i) => (
                                <span key={i} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full px-2.5 py-0.5">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Objections */}
                        {callSummary.objections?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              {lang === 'fr' ? 'Objections' : 'Objections'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {callSummary.objections.map((o, i) => (
                                <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 rounded-full px-2.5 py-0.5">{o}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
