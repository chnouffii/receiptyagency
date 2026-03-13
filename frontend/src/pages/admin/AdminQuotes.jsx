import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Euro, Calculator, Trash2, Eye, RefreshCw, Plus, User, Building2, Mail, Link2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminQuotes({ token, leadData, onLeadDataUsed, isDark }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [linkedLead, setLinkedLead] = useState(null);

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_company: '',
    service_description: '',
    price_ht: '',
    notes: '',
    lead_id: null
  });

  // Pre-fill form when leadData is provided
  useEffect(() => {
    if (leadData) {
      setForm({
        client_name: leadData.name || '',
        client_email: leadData.email || '',
        client_company: leadData.company || '',
        service_description: leadData.category ? `Solution ${leadData.category}\n\nBesoins identifiés: ${leadData.message || 'À préciser'}` : '',
        price_ht: leadData.estimated_setup || '',
        notes: leadData.message || '',
        lead_id: leadData.id
      });
      setLinkedLead(leadData);
      setShowForm(true);
      toast.info(`Création de devis pour ${leadData.name}`);
      // Clear the leadData from parent after using it
      if (onLeadDataUsed) {
        onLeadDataUsed();
      }
    }
  }, [leadData, onLeadDataUsed]);

  // Real-time calculation
  const priceHT = parseFloat(form.price_ht) || 0;
  const tvaRate = 0.20;
  const tvaAmount = Math.round(priceHT * tvaRate * 100) / 100;
  const priceTTC = Math.round((priceHT + tvaAmount) * 100) / 100;

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotes(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.client_name || !form.service_description || !form.price_ht) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (priceHT <= 0) {
      toast.error('Le prix HT doit être supérieur à 0');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post(`${API}/admin/quotes/generate`, {
        client_name: form.client_name,
        client_email: form.client_email,
        client_company: form.client_company,
        service_description: form.service_description,
        price_ht: priceHT,
        notes: form.notes,
        lead_id: form.lead_id
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      // Check if we received valid PDF data
      if (response.data.size === 0) {
        throw new Error('Empty PDF received');
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';

      // Extract filename from Content-Disposition header or use default with timestamp
      const contentDisposition = response.headers['content-disposition'];
      let filename = `Devis_${new Date().toISOString().split('T')[0]}.pdf`;
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success('Devis généré et téléchargé avec succès !');

      // Reset form and refresh list
      setForm({
        client_name: '',
        client_email: '',
        client_company: '',
        service_description: '',
        price_ht: '',
        notes: '',
        lead_id: null
      });
      setLinkedLead(null);
      setShowForm(false);
      fetchQuotes();
    } catch (err) {
      toast.error('Erreur lors de la génération du devis');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (quote) => {
    if (!confirm(`Supprimer le devis ${quote.quote_number} ?`)) return;
    try {
      await axios.delete(`${API}/admin/quotes/${quote.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Devis supprimé');
      fetchQuotes();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)]">Génération de Devis PDF</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
          data-testid="new-quote-btn"
        >
          <Plus className="w-4 h-4" />
          Nouveau devis
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-heading text-md font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Créer un nouveau devis
            </h4>
            {linkedLead && (
              <div className="flex items-center gap-2 text-sm bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5">
                <Link2 className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300">Lié au lead: <strong>{linkedLead.name}</strong></span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Nom du client <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="Jean Dupont"
                  data-testid="quote-client-name"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Société
                </label>
                <input
                  type="text"
                  value={form.client_company}
                  onChange={(e) => setForm({ ...form, client_company: e.target.value })}
                  placeholder="Entreprise SAS"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  placeholder="client@email.com"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                />
              </div>
            </div>

            {/* Service Description */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Description des services <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.service_description}
                onChange={(e) => setForm({ ...form, service_description: e.target.value })}
                placeholder="Décrivez en détail les services proposés..."
                rows={4}
                data-testid="quote-service-desc"
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none resize-y"
                required
              />
            </div>

            {/* Price and Calculation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                  <Euro className="w-3 h-3" />
                  Prix HT (€) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={form.price_ht}
                  onChange={(e) => setForm({ ...form, price_ht: e.target.value })}
                  placeholder="1000.00"
                  data-testid="quote-price-ht"
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                  required
                />
              </div>

              {/* Real-time Price Calculation */}
              <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Calcul automatique</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Prix HT</span>
                    <span className="text-[var(--text-primary)] font-mono">{formatPrice(priceHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">TVA (20%)</span>
                    <span className="text-[var(--text-primary)] font-mono">{formatPrice(tvaAmount)}</span>
                  </div>
                  <div className="border-t border-[var(--border-secondary)] pt-2 flex justify-between">
                    <span className="text-[var(--text-primary)] font-semibold">Total TTC</span>
                    <span className="text-blue-400 font-bold font-mono">{formatPrice(priceTTC)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Notes additionnelles</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Conditions particulières, remarques..."
                rows={2}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none resize-y"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={generating}
                data-testid="generate-quote-btn"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-all"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Générer et Télécharger
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Quotes List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <h4 className="text-sm font-medium text-[var(--text-secondary)]">Historique des devis ({quotes.length})</h4>
        </div>

        {quotes.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">Aucun devis généré</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Créez votre premier devis en cliquant sur "Nouveau devis"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase px-4 py-3">N° Devis</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase px-4 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase px-4 py-3">Montant TTC</th>
                  <th className="text-left text-xs font-medium text-[var(--text-muted)] uppercase px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-[var(--text-muted)] uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-blue-400">{quote.quote_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                          {quote.client_name}
                          {quote.lead_id && (
                            <span title="Lié à un lead" className="text-blue-400">
                              <Link2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </p>
                        {quote.client_company && (
                          <p className="text-xs text-[var(--text-muted)]">{quote.client_company}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-emerald-400">{formatPrice(quote.price_ttc)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatDate(quote.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(quote)}
                        className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
