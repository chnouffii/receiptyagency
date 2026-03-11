import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Users, Wallet, Globe, Cpu, ShoppingCart, Mail, Shield, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICON_OPTIONS = [
  { value: 'users', label: 'Users (RH)', icon: Users },
  { value: 'wallet', label: 'Wallet (Finance)', icon: Wallet },
  { value: 'globe', label: 'Globe (Web)', icon: Globe },
  { value: 'cpu', label: 'CPU (Tech)', icon: Cpu },
  { value: 'shopping-cart', label: 'Cart (E-commerce)', icon: ShoppingCart },
  { value: 'mail', label: 'Mail (Communication)', icon: Mail },
  { value: 'shield', label: 'Shield (Security)', icon: Shield },
  { value: 'bar-chart', label: 'Chart (Analytics)', icon: BarChart3 },
];

const CHART_TYPES = [
  { value: 'area', label: 'Area Chart' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
];

const EMPTY_SOLUTION = {
  name_fr: '', name_en: '', tag_fr: '', tag_en: '',
  desc_fr: '', desc_en: '',
  features_fr: [''], features_en: [''],
  icon: 'users', chart_type: 'area', published: true
};

function FormField({ label, value, onChange, multiline, placeholder }) {
  const cls = "w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-lg text-white text-sm px-3 placeholder:text-gray-600 outline-none transition-all duration-200";
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} className={`${cls} py-2 resize-none`} />
      ) : (
        <input type="text" value={value} onChange={onChange} placeholder={placeholder} className={`${cls} h-10`} />
      )}
    </div>
  );
}

function ArrayField({ label, items, onChange }) {
  const updateItem = (i, val) => { const a = [...items]; a[i] = val; onChange(a); };
  const addItem = () => onChange([...items, '']);
  const removeItem = (i) => { const a = items.filter((_, idx) => idx !== i); onChange(a.length ? a : ['']); };
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item} onChange={(e) => updateItem(i, e.target.value)} className="flex-1 bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-lg text-white text-sm h-9 px-3 placeholder:text-gray-600 outline-none transition-all duration-200" />
            <button onClick={() => removeItem(i)} className="text-gray-600 hover:text-red-400 px-1"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300">+ Ajouter</button>
      </div>
    </div>
  );
}

function getIconComponent(iconName) {
  const map = { users: Users, wallet: Wallet, globe: Globe, cpu: Cpu, 'shopping-cart': ShoppingCart, mail: Mail, shield: Shield, 'bar-chart': BarChart3 };
  return map[iconName] || Users;
}

export default function AdminSolutions({ token, isDark }) {
  const { lang } = useLanguage();
  const [solutions, setSolutions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_SOLUTION });
  const headers = { Authorization: `Bearer ${token}` };

  const fetchSolutions = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/solutions?published_only=false`);
      setSolutions(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchSolutions(); }, [fetchSolutions]);

  const openCreate = () => {
    setEditingSolution(null);
    setForm({ ...EMPTY_SOLUTION, features_fr: [''], features_en: [''] });
    setDialogOpen(true);
  };

  const openEdit = (sol) => {
    setEditingSolution(sol);
    setForm({
      ...sol,
      features_fr: sol.features_fr?.length ? sol.features_fr : [''],
      features_en: sol.features_en?.length ? sol.features_en : [''],
    });
    setDialogOpen(true);
  };

  const cleanArr = (arr) => arr.filter(s => s.trim() !== '');

  const handleSubmit = async () => {
    const payload = {
      ...form,
      features_fr: cleanArr(form.features_fr),
      features_en: cleanArr(form.features_en),
    };
    try {
      if (editingSolution) {
        await axios.put(`${API}/admin/solutions/${editingSolution.id}`, payload, { headers });
        toast.success(lang === 'fr' ? 'Solution mise à jour' : 'Solution updated');
      } else {
        await axios.post(`${API}/admin/solutions`, payload, { headers });
        toast.success(lang === 'fr' ? 'Solution créée' : 'Solution created');
      }
      setDialogOpen(false);
      fetchSolutions();
    } catch { toast.error('Error'); }
  };

  const deleteSolution = async (id) => {
    if (!window.confirm(lang === 'fr' ? 'Supprimer cette solution ?' : 'Delete this solution?')) return;
    try {
      await axios.delete(`${API}/admin/solutions/${id}`, { headers });
      toast.success(lang === 'fr' ? 'Supprimée' : 'Deleted');
      fetchSolutions();
    } catch { toast.error('Error'); }
  };

  const togglePublish = async (sol) => {
    try {
      await axios.put(`${API}/admin/solutions/${sol.id}`, { published: !sol.published }, { headers });
      toast.success(sol.published ? 'Dépubliée' : 'Publiée');
      fetchSolutions();
    } catch { toast.error('Error'); }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div data-testid="solutions-admin-tab">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-lg font-semibold text-white">
          {lang === 'fr' ? 'Gestion des solutions' : 'Solutions management'}
          <span className="text-sm font-normal text-gray-500 ml-2">({solutions.length})</span>
        </h2>
        <button onClick={openCreate} data-testid="create-solution-btn" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200">
          <Plus className="w-4 h-4" /> {lang === 'fr' ? 'Nouvelle solution' : 'New solution'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {solutions.map((sol, i) => {
          const Icon = getIconComponent(sol.icon);
          return (
            <motion.div key={sol.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border bg-[#0F0F10] overflow-hidden transition-all duration-200 ${sol.published ? 'border-white/5' : 'border-amber-500/20 opacity-60'}`}
              data-testid={`admin-solution-card-${i}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-white">
                        {lang === 'fr' ? sol.name_fr : (sol.name_en || sol.name_fr)}
                      </h3>
                      <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30 mt-1">
                        {lang === 'fr' ? sol.tag_fr : (sol.tag_en || sol.tag_fr)}
                      </Badge>
                    </div>
                  </div>
                  {!sol.published && <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 flex-shrink-0">Draft</Badge>}
                </div>

                <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                  {lang === 'fr' ? sol.desc_fr : (sol.desc_en || sol.desc_fr)}
                </p>

                {sol.features_fr?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(lang === 'fr' ? sol.features_fr : (sol.features_en || sol.features_fr)).slice(0, 3).map((f, fi) => (
                      <span key={fi} className="text-[10px] text-gray-600 bg-white/5 rounded-full px-2 py-0.5">{f}</span>
                    ))}
                    {(sol.features_fr?.length || 0) > 3 && (
                      <span className="text-[10px] text-gray-600">+{sol.features_fr.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  <button onClick={() => openEdit(sol)} data-testid={`edit-solution-${sol.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors duration-200">
                    <Pencil className="w-3 h-3" /> {lang === 'fr' ? 'Modifier' : 'Edit'}
                  </button>
                  <button onClick={() => togglePublish(sol)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors duration-200">
                    {sol.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {sol.published ? (lang === 'fr' ? 'Dépublier' : 'Unpublish') : (lang === 'fr' ? 'Publier' : 'Publish')}
                  </button>
                  <button onClick={() => deleteSolution(sol.id)} data-testid={`delete-solution-${sol.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors duration-200 ml-auto">
                    <Trash2 className="w-3 h-3" /> {lang === 'fr' ? 'Supprimer' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0B] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-white text-lg">
              {editingSolution ? (lang === 'fr' ? 'Modifier la solution' : 'Edit solution') : (lang === 'fr' ? 'Nouvelle solution' : 'New solution')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nom (FR)" value={form.name_fr} onChange={(e) => updateField('name_fr', e.target.value)} placeholder="Receipty Talent" />
              <FormField label="Name (EN)" value={form.name_en} onChange={(e) => updateField('name_en', e.target.value)} placeholder="Receipty Talent" />
            </div>

            {/* Tags */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tag (FR)" value={form.tag_fr} onChange={(e) => updateField('tag_fr', e.target.value)} placeholder="RH & Recrutement" />
              <FormField label="Tag (EN)" value={form.tag_en} onChange={(e) => updateField('tag_en', e.target.value)} placeholder="HR & Recruitment" />
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Description (FR)" value={form.desc_fr} onChange={(e) => updateField('desc_fr', e.target.value)} multiline placeholder="Automatisez votre processus..." />
              <FormField label="Description (EN)" value={form.desc_en} onChange={(e) => updateField('desc_en', e.target.value)} multiline placeholder="Automate your process..." />
            </div>

            {/* Icon & Chart */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Icône</label>
                <div className="grid grid-cols-4 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const OptIcon = opt.icon;
                    return (
                      <button key={opt.value} onClick={() => updateField('icon', opt.value)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${form.icon === opt.value ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-white/5 border border-white/10 hover:border-white/20'}`}>
                        <OptIcon className={`w-4 h-4 ${form.icon === opt.value ? 'text-blue-400' : 'text-gray-500'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Type de graphique</label>
                <select value={form.chart_type} onChange={(e) => updateField('chart_type', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm h-10 px-3 outline-none">
                  {CHART_TYPES.map(ct => <option key={ct.value} value={ct.value} className="bg-[#0F0F10]">{ct.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={(e) => updateField('published', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600" />
                  <span className="text-sm text-gray-400">{lang === 'fr' ? 'Publiée' : 'Published'}</span>
                </label>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <ArrayField label="Fonctionnalités (FR)" items={form.features_fr} onChange={(v) => updateField('features_fr', v)} />
              <ArrayField label="Features (EN)" items={form.features_en} onChange={(v) => updateField('features_en', v)} />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button onClick={() => setDialogOpen(false)} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors duration-200">
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button onClick={handleSubmit} disabled={!form.name_fr} data-testid="save-solution-btn"
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200">
                {editingSolution ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer' : 'Create')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
