import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, X } from 'lucide-react';
import { BTN, S, T, TAP, staggerItem } from './demoTokens';

/**
 * Primitives partagées par les 5 démos.
 * Tout est en export nommé (convention du projet), les pages restent en export
 * par défaut.
 */

/** Panneau de premier niveau, avec en-tête optionnel. */
export function Panel({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`${S.panel} flex flex-col overflow-hidden ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
                <Icon size={16} className="text-slate-300" strokeWidth={1.75} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className={T.h2}>{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className="flex-1">{children}</div>
    </section>
  );
}

/** Petit intitulé de section à l'intérieur d'un panneau. */
export function SectionLabel({ children, className = '' }) {
  return <p className={`${T.label} ${className}`}>{children}</p>;
}

/** Bouton principal / secondaire avec retour tactile homogène. */
export function DemoButton({
  variant = 'primary',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  children,
  className = '',
  ...props
}) {
  return (
    <motion.button
      whileTap={props.disabled || loading ? undefined : TAP}
      className={`${BTN[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
      ) : (
        Icon && <Icon size={16} strokeWidth={1.75} />
      )}
      {children}
      {IconRight && !loading && <IconRight size={16} strokeWidth={1.75} />}
    </motion.button>
  );
}

/**
 * Badge de statut. `tone` : neutral | success | info | warning.
 * `live` ajoute une pastille pulsante (processus en cours).
 */
export function StatusBadge({ tone = 'neutral', live = false, icon: Icon, children, className = '' }) {
  const tones = {
    neutral: 'border-slate-800/80 bg-slate-800/50 text-slate-300',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  };
  const dots = {
    neutral: 'bg-slate-400',
    success: 'bg-emerald-400',
    info: 'bg-blue-400',
    warning: 'bg-amber-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]} ${className}`}
    >
      {live && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dots[tone]}`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
        </span>
      )}
      {Icon && !live && <Icon size={12} strokeWidth={2} />}
      {children}
    </span>
  );
}

/**
 * Champ de donnée extraite (lecture seule ou éditable).
 * `mono` force la police de données + tabular-nums pour les montants et dates.
 */
export function DataField({ label, value, onChange, mono = false, suffix, readOnly = false, testId }) {
  return (
    <label className="block">
      <span className={T.label}>{label}</span>
      <div className="relative mt-1.5">
        <input
          type="text"
          value={value ?? ''}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly || !onChange}
          data-testid={testId}
          className={`w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3 py-2.5 text-sm text-slate-100
            outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20
            ${mono ? 'font-data tabular-nums' : ''} ${suffix ? 'pr-12' : ''} ${readOnly ? 'cursor-default' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

/** Tuile de métrique : grande valeur en police de données + légende. */
export function MetricTile({ label, value, unit, hint, icon: Icon, tone = 'neutral' }) {
  const accents = {
    neutral: 'text-slate-100',
    success: 'text-emerald-400',
    info: 'text-blue-400',
    warning: 'text-amber-400',
  };
  return (
    <motion.div variants={staggerItem} className={`${S.card} p-4`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-slate-400" strokeWidth={1.75} />}
        <span className={T.label}>{label}</span>
      </div>
      <p className="mt-2 flex items-baseline gap-1">
        <span className={`font-data text-2xl font-bold tabular-nums ${accents[tone]}`}>{value}</span>
        {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </motion.div>
  );
}

/** Bouton « copier » avec confirmation visuelle de 2 s. */
export function CopyButton({ text, label = 'Copier', copiedLabel = 'Copié', className = '', testId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Repli pour les contextes non sécurisés (http) où l'API Clipboard est absente.
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={TAP}
      onClick={handleCopy}
      data-testid={testId}
      className={`${BTN.ghost} ${className}`}
    >
      {copied ? (
        <Check size={16} strokeWidth={1.75} className="text-emerald-400" />
      ) : (
        <Copy size={16} strokeWidth={1.75} />
      )}
      {copied ? copiedLabel : label}
    </motion.button>
  );
}

/** Barre d'onglets secondaires (Formulaire / JSON, etc.). */
export function SegmentedTabs({ tabs, active, onChange, testId }) {
  return (
    <div
      role="tablist"
      data-testid={testId}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-800/80 bg-[#080B12] p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
              ${isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab.icon && <tab.icon size={14} strokeWidth={1.75} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Jauge horizontale de score (confiance, pertinence, maturité…).
 * `value` est un pourcentage ; le seuil colore la barre sans jamais recourir
 * au rouge tant que le score reste exploitable.
 */
export function ConfidenceMeter({ label, value, verdict, className = '' }) {
  const tone = value >= 90 ? 'emerald' : value >= 70 ? 'blue' : 'amber';
  const bars = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500' };
  const texts = { emerald: 'text-emerald-400', blue: 'text-blue-400', amber: 'text-amber-400' };

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={T.label}>{label}</span>
        <span className={`font-data text-xs font-semibold tabular-nums ${texts[tone]}`}>
          {value} %{verdict ? ` · ${verdict}` : ''}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className={`h-full rounded-full ${bars[tone]}`}
          initial={{ width: '0%' }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/**
 * Volet latéral (drawer). Sert à consulter un document source sans quitter la
 * conversation. Fermeture au clic sur le fond, au bouton ou avec Échap.
 */
export function SideDrawer({ open, onClose, title, subtitle, icon: Icon, children, testId }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Le fond ne défile pas pendant que le volet est ouvert.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" data-testid={testId}>
          <motion.button
            type="button"
            aria-label="Fermer le volet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-800/80 bg-[#0B0F17] shadow-2xl shadow-black/50"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
                    <Icon size={16} className="text-slate-300" strokeWidth={1.75} />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className={T.h2}>{title}</h2>
                  {subtitle && <p className="mt-0.5 font-data text-xs text-slate-400">{subtitle}</p>}
                </div>
              </div>
              <motion.button
                whileTap={TAP}
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-md p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-800/70 hover:text-slate-200"
              >
                <X size={16} strokeWidth={1.75} />
              </motion.button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Fenêtre modale centrée, pour une confirmation d'action. */
export function ConfirmModal({ open, onClose, title, icon: Icon, children, footer, testId }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" data-testid={testId}>
          <motion.button
            type="button"
            aria-label="Fermer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-[#111827] p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start gap-3">
              {Icon && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/60">
                  <Icon size={18} className="text-blue-400" strokeWidth={1.75} />
                </span>
              )}
              <h2 className={`${T.h2} mt-1`}>{title}</h2>
            </div>
            <div className="mt-4">{children}</div>
            {footer && <div className="mt-6 flex flex-wrap justify-end gap-2.5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** État vide d'un panneau de résultat, avant toute interaction. */
export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-800/40">
        <Icon size={20} className="text-slate-400" strokeWidth={1.5} />
      </span>
      <h3 className={`${T.h3} mt-4`}>{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-400">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
