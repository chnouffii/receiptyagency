import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Shield, User, Clock, Search, RefreshCw, Eye, EyeOff, UserPlus, Activity } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminUserManagement({ token }) {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('admins');
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logFilter, setLogFilter] = useState({ email: '', action: '' });
  
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'admin',
    is_active: true
  });

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des admins');
    }
  }, [token]);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (logFilter.email) params.append('admin_email', logFilter.email);
      if (logFilter.action) params.append('action', logFilter.action);
      const res = await axios.get(`${API}/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }, [token, logFilter]);

  useEffect(() => {
    Promise.all([fetchAdmins(), fetchLogs()]).finally(() => setLoading(false));
  }, [fetchAdmins, fetchLogs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        const updates = { ...form };
        if (!updates.password) delete updates.password;
        await axios.put(`${API}/admin/admins/${editingAdmin.id}`, updates, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Admin modifié avec succès');
      } else {
        await axios.post(`${API}/admin/admins`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Admin créé avec succès');
      }
      setShowForm(false);
      setEditingAdmin(null);
      setForm({ email: '', name: '', password: '', role: 'admin', is_active: true });
      fetchAdmins();
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setForm({
      email: admin.email,
      name: admin.name || '',
      password: '',
      role: admin.role || 'admin',
      is_active: admin.is_active !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (admin) => {
    if (!confirm(`Supprimer le compte de ${admin.email} ?`)) return;
    try {
      await axios.delete(`${API}/admin/admins/${admin.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin supprimé');
      fetchAdmins();
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const colors = {
      login: 'bg-green-500/20 text-green-400',
      create: 'bg-blue-500/20 text-blue-400',
      update: 'bg-yellow-500/20 text-yellow-400',
      delete: 'bg-red-500/20 text-red-400',
      view: 'bg-gray-500/20 text-gray-400'
    };
    return colors[action] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'admins'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
          }`}
        >
          <User className="w-4 h-4" />
          Comptes Admin ({admins.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'logs'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
          }`}
        >
          <Activity className="w-4 h-4" />
          Logs d'activité ({logs.length})
        </button>
      </div>

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-lg font-semibold text-white">Gestion des comptes</h3>
            <button
              onClick={() => { setShowForm(true); setEditingAdmin(null); setForm({ email: '', name: '', password: '', role: 'admin', is_active: true }); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
              data-testid="add-admin-btn"
            >
              <UserPlus className="w-4 h-4" />
              Nouvel admin
            </button>
          </div>

          {/* Form Modal */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0F0F10] border border-white/10 rounded-xl p-6 mb-6"
            >
              <h4 className="font-heading text-md font-semibold text-white mb-4">
                {editingAdmin ? 'Modifier l\'admin' : 'Créer un admin'}
              </h4>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Mot de passe {editingAdmin && '(laisser vide pour ne pas modifier)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none pr-10"
                      required={!editingAdmin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Rôle</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                {editingAdmin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-white/5"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-400">Compte actif</label>
                  </div>
                )}
                <div className="md:col-span-2 flex gap-3 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingAdmin(null); }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-2 text-sm font-medium transition-all"
                  >
                    {editingAdmin ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Admins List */}
          <div className="bg-[#0F0F10] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Admin</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Rôle</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Statut</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Créé le</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{admin.name || 'Sans nom'}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        admin.role === 'super_admin' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        admin.is_active !== false 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {admin.is_active !== false ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Filtrer par email..."
                value={logFilter.email}
                onChange={(e) => setLogFilter({ ...logFilter, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
              />
            </div>
            <select
              value={logFilter.action}
              onChange={(e) => setLogFilter({ ...logFilter, action: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500/50 outline-none"
            >
              <option value="">Toutes les actions</option>
              <option value="login">Connexion</option>
              <option value="create">Création</option>
              <option value="update">Modification</option>
              <option value="delete">Suppression</option>
            </select>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg px-4 py-2 text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          {/* Logs List */}
          <div className="bg-[#0F0F10] border border-white/5 rounded-xl overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#0F0F10]">
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Admin</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Action</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Cible</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {log.admin_email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {log.target_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Aucun log trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
