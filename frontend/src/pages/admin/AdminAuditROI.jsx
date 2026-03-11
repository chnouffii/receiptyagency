import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSearch, Download, Plus, Trash2, RefreshCw, Calculator, TrendingUp, 
  Lock, DollarSign, Target, Building2, MapPin, Briefcase, Clock, Euro,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FileText, Sparkles, Link2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminAuditROI({ token, leadData, onLeadDataUsed, onCreateQuote, isDark }) {
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showStrategy, setShowStrategy] = useState(false);
  const [linkedLead, setLinkedLead] = useState(null);
  
  const [form, setForm] = useState({
    client_name: '',
    client_city: '',
    client_sector: '',
    client_email: '',
    problem_description: '',
    hours_lost_per_week: '',
    hourly_cost: '',
    complexity: 'medium',
    notes: '',
    lead_id: null
  });

  // Pre-fill form when leadData is provided
  useEffect(() => {
    if (leadData) {
      // Map category to sector
      const sectorMap = {
        'Receipty Talent': 'RH / Recrutement',
        'Receipty Spend': 'Finance / Comptabilité',
        'Web-on-Demand': 'Digital / Web',
        'Talent': 'RH / Recrutement'
      };
      
      setForm({
        client_name: leadData.company || leadData.name || '',
        client_city: '',
        client_sector: sectorMap[leadData.category] || leadData.category || '',
        client_email: leadData.email || '',
        problem_description: leadData.message || `Processus manuel à optimiser pour ${leadData.company || leadData.name}`,
        hours_lost_per_week: '',
        hourly_cost: '45',
        complexity: 'medium',
        notes: `Lead: ${leadData.name} - ${leadData.email}`,
        lead_id: leadData.id
      });
      setLinkedLead(leadData);
      setShowForm(true);
      toast.info(`Création d'audit pour ${leadData.name}`);
      
      if (onLeadDataUsed) {
        onLeadDataUsed();
      }
    }
  }, [leadData, onLeadDataUsed]);

  // Real-time cost calculation
  const hoursPerWeek = parseFloat(form.hours_lost_per_week) || 0;
  const hourlyCost = parseFloat(form.hourly_cost) || 0;
  const annualLoss = hoursPerWeek * 52 * hourlyCost;

  const fetchAudits = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/audits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAudits(res.data);
    } catch (err) {
      console.error('Error fetching audits:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.client_name || !form.problem_description || !form.hours_lost_per_week || !form.hourly_cost) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setGenerating(true);
    try {
      const res = await axios.post(`${API}/admin/audits`, {
        ...form,
        hours_lost_per_week: parseFloat(form.hours_lost_per_week),
        hourly_cost: parseFloat(form.hourly_cost)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Audit créé avec succès !');
      setSelectedAudit(res.data);
      setShowStrategy(true);
      setShowForm(false);
      setLinkedLead(null);
      setForm({
        client_name: '',
        client_city: '',
        client_sector: '',
        client_email: '',
        problem_description: '',
        hours_lost_per_week: '',
        hourly_cost: '',
        complexity: 'medium',
        notes: '',
        lead_id: null
      });
      fetchAudits();
    } catch (err) {
      console.error('Error creating audit:', err);
      toast.error('Erreur lors de la création de l\'audit');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async (audit) => {
    try {
      const response = await axios.get(`${API}/admin/audits/${audit.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Check if we received valid PDF data
      if (response.data.size === 0) {
        throw new Error('Empty PDF received');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      link.setAttribute('download', `Audit_${audit.audit_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('PDF téléchargé');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async (audit) => {
    if (!confirm(`Supprimer l'audit ${audit.audit_number} ?`)) return;
    try {
      await axios.delete(`${API}/admin/audits/${audit.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Audit supprimé');
      if (selectedAudit?.id === audit.id) {
        setSelectedAudit(null);
        setShowStrategy(false);
      }
      fetchAudits();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const complexityLabels = {
    low: { label: 'Basse', color: 'text-green-400 bg-green-500/20' },
    medium: { label: 'Moyenne', color: 'text-yellow-400 bg-yellow-500/20' },
    high: { label: 'Haute', color: 'text-red-400 bg-red-500/20' }
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
        <div>
          <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-blue-400" />
            Audit & ROI Optimizer
          </h3>
          <p className="text-sm text-gray-500 mt-1">Analysez les besoins clients et calculez le ROI potentiel</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSelectedAudit(null); setShowStrategy(false); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
          data-testid="new-audit-btn"
        >
          <Plus className="w-4 h-4" />
          Nouvel audit
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-heading text-md font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Créer un nouvel audit
              </h4>
              {linkedLead && (
                <div className="flex items-center gap-2 text-sm bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5">
                  <Link2 className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300">Lié au lead: <strong>{linkedLead.name}</strong></span>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Information */}
              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informations Client
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Nom / Entreprise *</label>
                    <input
                      type="text"
                      value={form.client_name}
                      onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                      placeholder="Entreprise SAS"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Ville</label>
                    <input
                      type="text"
                      value={form.client_city}
                      onChange={(e) => setForm({ ...form, client_city: e.target.value })}
                      placeholder="Strasbourg"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Secteur</label>
                    <input
                      type="text"
                      value={form.client_sector}
                      onChange={(e) => setForm({ ...form, client_sector: e.target.value })}
                      placeholder="RH, Finance, Logistique..."
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                      placeholder="contact@client.com"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Diagnosis */}
              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Diagnostic Technique
                </h5>
                <textarea
                  value={form.problem_description}
                  onChange={(e) => setForm({ ...form, problem_description: e.target.value })}
                  placeholder="Décrivez le problème manuel identifié chez le client...&#10;Ex: Saisie manuelle des factures, tri des CV, gestion des emails..."
                  rows={4}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none resize-y"
                  required
                />
              </div>

              {/* Financial Parameters */}
              <div>
                <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Paramètres Financiers
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Heures perdues / semaine *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.hours_lost_per_week}
                      onChange={(e) => setForm({ ...form, hours_lost_per_week: e.target.value })}
                      placeholder="10"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Coût horaire employé (€) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={form.hourly_cost}
                      onChange={(e) => setForm({ ...form, hourly_cost: e.target.value })}
                      placeholder="35"
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Complexité estimée</label>
                    <select
                      value={form.complexity}
                      onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none"
                    >
                      <option value="low">Basse (85% réduction)</option>
                      <option value="medium">Moyenne (75% réduction)</option>
                      <option value="high">Haute (65% réduction)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Real-time calculation preview */}
              {annualLoss > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-red-300">Coût de l'inaction estimé</p>
                      <p className="text-xl font-bold text-red-400">{formatPrice(annualLoss)} / an</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Notes additionnelles</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes internes..."
                  rows={2}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-blue-500/50 outline-none resize-y"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-[var(--text-primary)] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg px-6 py-2.5 font-semibold text-sm transition-all"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Génération IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer l'audit
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strategy Panel (Admin Only) */}
      <AnimatePresence>
        {selectedAudit && showStrategy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Public Audit Summary */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-heading text-md font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-blue-400" />
                    {selectedAudit.audit_number} - {selectedAudit.client_name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">{selectedAudit.client_sector} • {selectedAudit.client_city}</p>
                </div>
                <button
                  onClick={() => handleDownloadPDF(selectedAudit)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs text-red-300">Perte annuelle</p>
                  <p className="text-lg font-bold text-red-400">{formatPrice(selectedAudit.annual_loss)}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-xs text-green-300">Économies An 1</p>
                  <p className="text-lg font-bold text-green-400">{formatPrice(selectedAudit.roi_year1)}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-xs text-green-300">Économies An 2</p>
                  <p className="text-lg font-bold text-green-400">{formatPrice(selectedAudit.roi_year2)}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-300">Temps gagné</p>
                  <p className="text-lg font-bold text-blue-400">{selectedAudit.hours_lost_per_week - selectedAudit.hours_after_optimization}h/sem</p>
                </div>
              </div>

              {/* AI Report Preview */}
              {selectedAudit.ai_report && (
                <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Analyse IA</p>
                  <p className="text-sm text-gray-300 whitespace-pre-line">{selectedAudit.ai_report.substring(0, 500)}...</p>
                </div>
              )}
            </div>

            {/* INTERNAL STRATEGY - Admin Only */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-purple-400" />
                <h4 className="font-heading text-md font-semibold text-[var(--text-primary)]">Stratégie Commerciale</h4>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Admin uniquement</span>
              </div>
              
              {/* Suggested Prices */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Prix Suggérés (Value-Based)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedAudit.strategy?.suggested_prices && Object.entries({
                    essential: { label: 'Essentiel', pct: '15%', color: 'blue' },
                    business: { label: 'Business', pct: '25%', color: 'purple' },
                    premium: { label: 'Premium', pct: '40%', color: 'amber' }
                  }).map(([key, config]) => (
                    <div key={key} className={`bg-${config.color}-500/10 border border-${config.color}-500/30 rounded-xl p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{config.label}</span>
                        <span className="text-xs text-gray-400">{config.pct} économie</span>
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{formatPrice(selectedAudit.strategy.suggested_prices[key])}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Couvre {selectedAudit.strategy.profitability[`${key}_months`]} mois de frais fixes
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Closing Arguments */}
              {selectedAudit.strategy?.closing_arguments && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Argumentaire de Closing (IA)
                  </h5>
                  <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                    <p className="text-sm text-gray-300 whitespace-pre-line">{selectedAudit.strategy.closing_arguments}</p>
                  </div>
                </div>
              )}

              {/* Convert to Quote */}
              <div className="mt-6 pt-4 border-t border-[var(--border-secondary)] flex justify-end gap-3">
                <button
                  onClick={() => { setSelectedAudit(null); setShowStrategy(false); }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-[var(--text-primary)] transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    if (onCreateQuote && selectedAudit) {
                      // Create a lead-like object from the audit for the quote form
                      const quoteData = {
                        id: selectedAudit.lead_id || null,
                        name: selectedAudit.client_name,
                        email: selectedAudit.client_email,
                        company: selectedAudit.client_name,
                        category: selectedAudit.client_sector,
                        message: `Basé sur l'audit ${selectedAudit.audit_number}\n\nProblème identifié: ${selectedAudit.problem_description}\n\nÉconomies annuelles estimées: ${formatPrice(selectedAudit.annual_savings)}`,
                        estimated_setup: selectedAudit.strategy?.suggested_prices?.business || 0,
                        audit_id: selectedAudit.id,
                        audit_number: selectedAudit.audit_number
                      };
                      onCreateQuote(quoteData);
                      toast.success('Redirection vers le formulaire de devis...');
                    }
                  }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Convertir en Devis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audits List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <h4 className="text-sm font-medium text-gray-400">Historique des audits ({audits.length})</h4>
        </div>
        
        {audits.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <FileSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Aucun audit créé</p>
            <p className="text-gray-600 text-sm mt-1">Créez votre premier audit en cliquant sur "Nouvel audit"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">N° Audit</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Perte/an</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Économie/an</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Complexité</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr 
                    key={audit.id} 
                    className={`border-b border-[var(--border-primary)] hover:bg-[var(--bg-hover)] cursor-pointer ${selectedAudit?.id === audit.id ? 'bg-blue-500/10' : ''}`}
                    onClick={() => { setSelectedAudit(audit); setShowStrategy(true); setShowForm(false); }}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-blue-400">{audit.audit_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                          {audit.client_name}
                          {audit.lead_id && (
                            <span title="Lié à un lead" className="text-purple-400">
                              <Link2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </p>
                        {audit.client_sector && (
                          <p className="text-xs text-gray-500">{audit.client_sector}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-red-400">{formatPrice(audit.annual_loss)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-green-400">{formatPrice(audit.annual_savings)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${complexityLabels[audit.complexity]?.color || 'text-gray-400 bg-gray-500/20'}`}>
                        {complexityLabels[audit.complexity]?.label || audit.complexity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(audit.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDownloadPDF(audit)}
                          className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(audit)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Supprimer"
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
        )}
      </div>
    </div>
  );
}
