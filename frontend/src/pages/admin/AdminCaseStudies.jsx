import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY_CASE = {
  title_fr: '', title_en: '', category: 'Receipty Talent', roi: '',
  desc_fr: '', desc_en: '', challenge_fr: '', challenge_en: '',
  solution_fr: '', solution_en: '',
  results_fr: [''], results_en: [''],
  image_url: '', tags: [''], duration_fr: '', duration_en: '',
  team_fr: '', team_en: '', tech: [''], published: true
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

export default function AdminCaseStudies({ token, isDark }) {
  const { lang } = useLanguage();
  const [cases, setCases] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_CASE });
  const headers = { Authorization: `Bearer ${token}` };

  const fetchCases = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/case-studies?published_only=false`);
      setCases(res.data);
    } catch {}
  }, []);

  const fetchSolutions = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/solutions?published_only=false`);
      setSolutions(res.data);
    } catch {}
  }, []);

  useEffect(() => { 
    fetchCases(); 
    fetchSolutions();
  }, [fetchCases, fetchSolutions]);

  const openCreate = () => {
    setEditingCase(null);
    const defaultCategory = solutions.length > 0 
      ? (lang === 'fr' ? solutions[0].name_fr : (solutions[0].name_en || solutions[0].name_fr))
      : 'Receipty Talent';
    setForm({ ...EMPTY_CASE, category: defaultCategory, results_fr: [''], results_en: [''], tags: [''], tech: [''] });
    setDialogOpen(true);
  };

  const openEdit = (cs) => {
    setEditingCase(cs);
    setForm({
      ...cs,
      results_fr: cs.results_fr?.length ? cs.results_fr : [''],
      results_en: cs.results_en?.length ? cs.results_en : [''],
      tags: cs.tags?.length ? cs.tags : [''],
      tech: cs.tech?.length ? cs.tech : [''],
    });
    setDialogOpen(true);
  };

  const cleanArrayField = (arr) => arr.filter(s => s.trim() !== '');

  const handleSubmit = async () => {
    const payload = {
      ...form,
      results_fr: cleanArrayField(form.results_fr),
      results_en: cleanArrayField(form.results_en),
      tags: cleanArrayField(form.tags),
      tech: cleanArrayField(form.tech),
    };
    try {
      if (editingCase) {
        await axios.put(`${API}/admin/case-studies/${editingCase.id}`, payload, { headers });
        toast.success(lang === 'fr' ? 'Etude de cas mise a jour' : 'Case study updated');
      } else {
        await axios.post(`${API}/admin/case-studies`, payload, { headers });
        toast.success(lang === 'fr' ? 'Etude de cas creee' : 'Case study created');
      }
      setDialogOpen(false);
      fetchCases();
    } catch {
      toast.error('Error');
    }
  };

  const deleteCase = async (id) => {
    if (!window.confirm(lang === 'fr' ? 'Supprimer cette etude de cas ?' : 'Delete this case study?')) return;
    try {
      await axios.delete(`${API}/admin/case-studies/${id}`, { headers });
      toast.success(lang === 'fr' ? 'Supprimee' : 'Deleted');
      fetchCases();
    } catch { toast.error('Error'); }
  };

  const togglePublish = async (cs) => {
    try {
      await axios.put(`${API}/admin/case-studies/${cs.id}`, { published: !cs.published }, { headers });
      toast.success(cs.published ? 'Depubliee' : 'Publiee');
      fetchCases();
    } catch { toast.error('Error'); }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div data-testid="case-studies-admin-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-lg font-semibold text-white">
          {lang === 'fr' ? 'Gestion des etudes de cas' : 'Case studies management'}
          <span className="text-sm font-normal text-gray-500 ml-2">({cases.length})</span>
        </h2>
        <button
          onClick={openCreate}
          data-testid="create-case-btn"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> {lang === 'fr' ? 'Nouvelle etude' : 'New case study'}
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((cs, i) => (
          <motion.div
            key={cs.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border bg-[#0F0F10] overflow-hidden transition-all duration-200 ${cs.published ? 'border-white/5' : 'border-amber-500/20 opacity-60'}`}
            data-testid={`admin-case-card-${i}`}
          >
            {cs.image_url && (
              <div className="h-32 overflow-hidden">
                <img src={cs.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold text-white truncate">
                    {lang === 'fr' ? cs.title_fr : (cs.title_en || cs.title_fr)}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">{cs.category}</Badge>
                    <Badge className="bg-blue-600/80 text-white border-0 text-[10px] px-1.5">{cs.roi}</Badge>
                  </div>
                </div>
                {!cs.published && (
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 flex-shrink-0">Draft</Badge>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                {lang === 'fr' ? cs.desc_fr : (cs.desc_en || cs.desc_fr)}
              </p>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                <button onClick={() => openEdit(cs)} data-testid={`edit-case-${cs.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors duration-200">
                  <Pencil className="w-3 h-3" /> {lang === 'fr' ? 'Modifier' : 'Edit'}
                </button>
                <button onClick={() => togglePublish(cs)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors duration-200">
                  {cs.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {cs.published ? (lang === 'fr' ? 'Depublier' : 'Unpublish') : (lang === 'fr' ? 'Publier' : 'Publish')}
                </button>
                <button onClick={() => deleteCase(cs.id)} data-testid={`delete-case-${cs.id}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors duration-200 ml-auto">
                  <Trash2 className="w-3 h-3" /> {lang === 'fr' ? 'Supprimer' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0B] border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-white text-lg">
              {editingCase ? (lang === 'fr' ? 'Modifier l\'etude de cas' : 'Edit case study') : (lang === 'fr' ? 'Nouvelle etude de cas' : 'New case study')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Image Preview */}
            {form.image_url && (
              <div className="rounded-xl overflow-hidden border border-white/5 h-40">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-gray-500" />
              <FormField label="" value={form.image_url} onChange={(e) => updateField('image_url', e.target.value)} placeholder="https://images.unsplash.com/..." />
            </div>

            {/* General */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Titre (FR)" value={form.title_fr} onChange={(e) => updateField('title_fr', e.target.value)} placeholder="Automatisation RH chez..." />
              <FormField label="Title (EN)" value={form.title_en} onChange={(e) => updateField('title_en', e.target.value)} placeholder="HR Automation at..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Catégorie (Solution)</label>
                <select 
                  value={form.category} 
                  onChange={(e) => updateField('category', e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm h-10 px-3 outline-none focus:border-blue-500/50 transition-all"
                >
                  {solutions.length > 0 ? (
                    solutions.map((sol) => (
                      <option key={sol.id} value={lang === 'fr' ? sol.name_fr : (sol.name_en || sol.name_fr)} className="bg-[#0F0F10]">
                        {lang === 'fr' ? sol.name_fr : (sol.name_en || sol.name_fr)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Receipty Talent" className="bg-[#0F0F10]">Receipty Talent</option>
                      <option value="Receipty Spend" className="bg-[#0F0F10]">Receipty Spend</option>
                      <option value="Web-on-Demand" className="bg-[#0F0F10]">Web-on-Demand</option>
                    </>
                  )}
                </select>
              </div>
              <FormField label="ROI" value={form.roi} onChange={(e) => updateField('roi', e.target.value)} placeholder="+340% efficacite" />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={(e) => updateField('published', e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600" />
                  <span className="text-sm text-gray-400">{lang === 'fr' ? 'Publiée' : 'Published'}</span>
                </label>
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Description (FR)" value={form.desc_fr} onChange={(e) => updateField('desc_fr', e.target.value)} multiline placeholder="Resume du projet..." />
              <FormField label="Description (EN)" value={form.desc_en} onChange={(e) => updateField('desc_en', e.target.value)} multiline placeholder="Project summary..." />
            </div>

            {/* Challenge */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Le Defi (FR)" value={form.challenge_fr} onChange={(e) => updateField('challenge_fr', e.target.value)} multiline placeholder="Le probleme du client..." />
              <FormField label="The Challenge (EN)" value={form.challenge_en} onChange={(e) => updateField('challenge_en', e.target.value)} multiline placeholder="Client's problem..." />
            </div>

            {/* Solution */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Notre Solution (FR)" value={form.solution_fr} onChange={(e) => updateField('solution_fr', e.target.value)} multiline placeholder="Comment nous avons resolu..." />
              <FormField label="Our Solution (EN)" value={form.solution_en} onChange={(e) => updateField('solution_en', e.target.value)} multiline placeholder="How we solved..." />
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-4">
              <ArrayField label="Resultats (FR)" items={form.results_fr} onChange={(v) => updateField('results_fr', v)} />
              <ArrayField label="Results (EN)" items={form.results_en} onChange={(v) => updateField('results_en', v)} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Duree (FR)" value={form.duration_fr} onChange={(e) => updateField('duration_fr', e.target.value)} placeholder="8 semaines" />
              <FormField label="Duration (EN)" value={form.duration_en} onChange={(e) => updateField('duration_en', e.target.value)} placeholder="8 weeks" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Equipe (FR)" value={form.team_fr} onChange={(e) => updateField('team_fr', e.target.value)} placeholder="4 consultants" />
              <FormField label="Team (EN)" value={form.team_en} onChange={(e) => updateField('team_en', e.target.value)} placeholder="4 consultants" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ArrayField label="Tags" items={form.tags} onChange={(v) => updateField('tags', v)} />
              <ArrayField label="Technologies" items={form.tech} onChange={(v) => updateField('tech', v)} />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button onClick={() => setDialogOpen(false)} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors duration-200">
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title_fr || !form.roi}
                data-testid="save-case-btn"
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200"
              >
                {editingCase ? (lang === 'fr' ? 'Mettre a jour' : 'Update') : (lang === 'fr' ? 'Creer' : 'Create')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
