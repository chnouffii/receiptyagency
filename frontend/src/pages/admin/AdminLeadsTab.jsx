import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Users, UserPlus, UserCheck, Trophy, DollarSign, CalendarClock, Search, Download, Filter, FileText, CheckCircle, FileSearch, Plus, X, Building2, Mail, Phone, Euro, Tag } from 'lucide-react';
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
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl border p-4 ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`} data-testid={`admin-stat-${i}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`font-mono text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
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
            <div className={`rounded-xl p-6 ${isDark ? 'bg-[#0F0F10] border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`font-heading text-md font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  {lang === 'fr' ? 'Nouveau Lead' : 'New Lead'}
                </h3>
                <button 
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
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
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
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
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
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
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
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
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
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
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
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
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
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
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-500/50 outline-none resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
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

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/5 bg-[#0F0F10]' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className={`p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
          <h2 className={`font-heading text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.admin.leads}</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'} data-testid="admin-search-input" className={`w-full sm:w-48 rounded-lg text-sm h-9 pl-9 pr-3 outline-none transition-all duration-200 ${isDark ? 'bg-white/5 border border-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 focus:border-blue-500 text-gray-900 placeholder:text-gray-400'}`} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`w-[130px] h-9 text-xs ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`} data-testid="admin-status-filter">
                <Filter className="w-3 h-3 mr-1.5 text-gray-500" /><SelectValue />
              </SelectTrigger>
              <SelectContent className={isDark ? 'bg-[#0F0F10] border-white/10' : 'bg-white border-gray-200'}>
                <SelectItem value="all">{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={exportCSV} data-testid="admin-export-csv-btn" className={`flex items-center gap-1.5 h-9 px-3 text-xs border rounded-lg transition-all duration-200 ${isDark ? 'text-gray-400 hover:text-white border-white/10 hover:border-white/20' : 'text-gray-500 hover:text-gray-900 border-gray-200 hover:border-gray-300'}`}>
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button 
              onClick={() => setShowForm(true)} 
              data-testid="admin-new-lead-btn" 
              className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Nouveau' : 'New'}
            </button>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t.admin.no_leads}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
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
                <TableRow key={lead.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="text-white font-medium text-sm">
                    <div className="flex items-center gap-2">
                      {lead.name}
                      {lead.has_quote && (
                        <span title="Devis créé" className="text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {lead.has_audit && (
                        <span title="Audit créé" className="text-purple-400">
                          <FileSearch className="w-3.5 h-3.5" />
                        </span>
                      )}
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
                      <SelectContent className="bg-[#0F0F10] border-white/10">
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => onCreateAudit && onCreateAudit(lead)} 
                        data-testid={`create-audit-${lead.id}`} 
                        className="p-2 text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                        title={lang === 'fr' ? 'Créer un audit ROI' : 'Create ROI audit'}
                      >
                        <FileSearch className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onCreateQuote && onCreateQuote(lead)} 
                        data-testid={`create-quote-${lead.id}`} 
                        className="p-2 text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title={lang === 'fr' ? 'Créer un devis' : 'Create quote'}
                      >
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
        )}
      </div>
    </>
  );
}
