import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Trash2, Users, UserPlus, UserCheck, Trophy, DollarSign, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  new: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  contacted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  qualified: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  converted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const token = localStorage.getItem('receipty-admin-token');

  const fetchData = useCallback(async () => {
    if (!token) { navigate('/admin'); return; }
    const authHeaders = { Authorization: `Bearer ${token}` };
    try {
      const [leadsRes, statsRes] = await Promise.all([
        axios.get(`${API}/leads`, { headers: authHeaders }),
        axios.get(`${API}/admin/stats`, { headers: authHeaders }),
      ]);
      setLeads(leadsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('receipty-admin-token');
        navigate('/admin');
      }
    }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (leadId, status) => {
    try {
      await axios.patch(`${API}/leads/${leadId}/status`, { status }, { headers });
      toast.success('Status updated');
      fetchData();
    } catch {
      toast.error('Error updating status');
    }
  };

  const deleteLead = async (leadId) => {
    try {
      await axios.delete(`${API}/leads/${leadId}`, { headers });
      toast.success('Lead deleted');
      fetchData();
    } catch {
      toast.error('Error deleting lead');
    }
  };

  const logout = () => {
    localStorage.removeItem('receipty-admin-token');
    localStorage.removeItem('receipty-admin-email');
    navigate('/admin');
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
    <div data-testid="admin-dashboard" className="pt-24 bg-[#050505] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-heading text-2xl font-bold text-white">{t.admin.dashboard}</h1>
          <button
            onClick={logout}
            data-testid="admin-logout-btn"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" /> {t.admin.logout}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/5 bg-[#0F0F10] p-4"
              data-testid={`admin-stat-${i}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="font-mono text-xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Leads Table */}
        <div className="rounded-xl border border-white/5 bg-[#0F0F10] overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-heading text-lg font-semibold text-white">{t.admin.leads}</h2>
          </div>

          {leads.length === 0 ? (
            <div className="p-12 text-center text-gray-500" data-testid="no-leads-msg">
              {t.admin.no_leads}
            </div>
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
                    <TableCell>
                      <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 capitalize">
                        {lead.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-300">{lead.estimated_setup} EUR</TableCell>
                    <TableCell className="font-mono text-sm text-gray-300">{lead.estimated_monthly} EUR/mo</TableCell>
                    <TableCell>
                      <Select value={lead.status} onValueChange={(val) => updateStatus(lead.id, val)}>
                        <SelectTrigger
                          className={`w-[130px] h-8 text-xs border ${STATUS_COLORS[lead.status] || ''} bg-transparent`}
                          data-testid={`status-select-${lead.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0F0F10] border-white/10">
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        data-testid={`delete-lead-${lead.id}`}
                        className="text-gray-600 hover:text-red-400 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
