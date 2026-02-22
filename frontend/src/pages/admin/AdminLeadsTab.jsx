import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Users, UserPlus, UserCheck, Trophy, DollarSign, CalendarClock, Search, Download, Filter, FileText, CheckCircle } from 'lucide-react';
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

export default function AdminLeadsTab({ token, stats, onRefresh, onCreateQuote }) {
  const { t, lang } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const headers = { Authorization: `Bearer ${token}` };

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
      toast.success(lang === 'fr' ? 'CSV telecharge' : 'CSV downloaded');
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
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-[#0F0F10] p-4" data-testid={`admin-stat-${i}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className="font-mono text-xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0F0F10] overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-semibold text-white">{t.admin.leads}</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'} data-testid="admin-search-input" className="w-full sm:w-48 bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-lg text-white text-sm h-9 pl-9 pr-3 placeholder:text-gray-600 outline-none transition-all duration-200" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9 text-xs border-white/10 bg-white/5" data-testid="admin-status-filter">
                <Filter className="w-3 h-3 mr-1.5 text-gray-500" /><SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F0F10] border-white/10">
                <SelectItem value="all">{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={exportCSV} data-testid="admin-export-csv-btn" className="flex items-center gap-1.5 h-9 px-3 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200">
              <Download className="w-3.5 h-3.5" /> CSV
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
                  <TableCell className="text-white font-medium text-sm">{lead.name}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{lead.email}</TableCell>
                  <TableCell className="text-gray-400 text-sm">{lead.company}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 capitalize">{lead.category}</Badge></TableCell>
                  <TableCell className="font-mono text-sm text-gray-300">{lead.estimated_setup} EUR</TableCell>
                  <TableCell className="font-mono text-sm text-gray-300">{lead.estimated_monthly} EUR/mo</TableCell>
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
                    <button onClick={() => deleteLead(lead.id)} data-testid={`delete-lead-${lead.id}`} className="text-gray-600 hover:text-red-400 transition-colors duration-200"><Trash2 className="w-4 h-4" /></button>
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
