import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { BTN, S, T, TAP, staggerItem } from './demoTokens';

/**
 * Primitives partagées par les 4 démos.
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
