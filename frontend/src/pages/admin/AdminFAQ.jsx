import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X, Check, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY_FORM = {
  question_fr: '',
  question_en: '',
  answer_fr: '',
  answer_en: '',
  order: 0,
  published: true,
};

export default function AdminFAQ({ token, isDark }) {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/faq`, { headers });
      setFaqs(res.data);
    } catch {
      toast.error('Erreur lors du chargement des FAQs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: faqs.length });
    setShowForm(true);
  };

  const openEdit = (faq) => {
    setEditingId(faq.id);
    setForm({
      question_fr: faq.question_fr,
      question_en: faq.question_en,
      answer_fr: faq.answer_fr,
      answer_en: faq.answer_en,
      order: faq.order,
      published: faq.published,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question_fr.trim() || !form.answer_fr.trim()) {
      toast.error('La question et la réponse (FR) sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/admin/faq/${editingId}`, form, { headers });
        toast.success('FAQ mise à jour');
      } else {
        await axios.post(`${API}/admin/faq`, form, { headers });
        toast.success('FAQ créée');
      }
      await fetchFaqs();
      closeForm();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    try {
      await axios.delete(`${API}/admin/faq/${id}`, { headers });
      toast.success('FAQ supprimée');
      await fetchFaqs();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const togglePublished = async (faq) => {
    try {
      await axios.put(`${API}/admin/faq/${faq.id}`, { published: !faq.published }, { headers });
      await fetchFaqs();
    } catch {
      toast.error('Erreur');
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors duration-200 ${
    isDark
      ? 'bg-black/40 border-[var(--border-secondary)] text-[var(--text-primary)] placeholder-gray-600 focus:border-blue-500/50'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400'
  }`;

  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HelpCircle className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h2 className={`font-heading text-lg font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
              Questions Fréquentes
            </h2>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {faqs.length} question{faqs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Nouvelle question
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form
              onSubmit={handleSubmit}
              className={`rounded-xl border p-6 ${isDark ? 'border-[var(--border-secondary)] bg-[var(--bg-secondary)]' : 'border-gray-200 bg-white shadow-sm'}`}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className={`font-semibold text-sm ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>
                  {editingId ? 'Modifier la question' : 'Nouvelle question'}
                </h3>
                <button type="button" onClick={closeForm} className={`${isDark ? 'text-gray-500 hover:text-[var(--text-primary)]' : 'text-gray-400 hover:text-gray-700'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelCls}>Question (FR) *</label>
                  <input
                    className={inputCls}
                    value={form.question_fr}
                    onChange={e => setForm(f => ({ ...f, question_fr: e.target.value }))}
                    placeholder="Quelle est votre question ?"
                  />
                </div>
                <div>
                  <label className={labelCls}>Question (EN)</label>
                  <input
                    className={inputCls}
                    value={form.question_en}
                    onChange={e => setForm(f => ({ ...f, question_en: e.target.value }))}
                    placeholder="What is your question?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelCls}>Réponse (FR) *</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={4}
                    value={form.answer_fr}
                    onChange={e => setForm(f => ({ ...f, answer_fr: e.target.value }))}
                    placeholder="Votre réponse en français..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Réponse (EN)</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={4}
                    value={form.answer_en}
                    onChange={e => setForm(f => ({ ...f, answer_en: e.target.value }))}
                    placeholder="Your answer in English..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 mb-5">
                <div className="flex items-center gap-2">
                  <label className={labelCls + ' mb-0'}>Ordre</label>
                  <input
                    type="number"
                    min="0"
                    className={`${inputCls} w-20`}
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                    className="accent-blue-500"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Publié</span>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeForm} className={`px-4 py-2 text-sm rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-[var(--text-primary)]' : 'text-gray-500 hover:text-gray-900'}`}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className={`text-center py-12 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Chargement...</div>
      ) : faqs.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${isDark ? 'border-[var(--border-primary)] text-gray-600' : 'border-gray-200 text-gray-400'}`}>
          <HelpCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune question pour le moment.</p>
          <p className="text-xs mt-1">Cliquez sur "Nouvelle question" pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-5 ${isDark ? 'border-[var(--border-primary)] bg-[var(--bg-hover)]' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-[var(--bg-tertiary)] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>#{faq.order}</span>
                    {!faq.published && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">Brouillon</span>
                    )}
                  </div>
                  <p className={`font-medium text-sm mb-1 ${isDark ? 'text-[var(--text-primary)]' : 'text-gray-900'}`}>{faq.question_fr}</p>
                  {faq.question_en && (
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{faq.question_en}</p>
                  )}
                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{faq.answer_fr}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePublished(faq)}
                    title={faq.published ? 'Dépublier' : 'Publier'}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[var(--bg-tertiary)] text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                  >
                    {faq.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(faq)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[var(--bg-tertiary)] text-gray-500 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[var(--bg-tertiary)] text-gray-500 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
