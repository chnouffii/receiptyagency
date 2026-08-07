/**
 * Design tokens de l'Espace Démos Receipty.
 *
 * Un seul endroit pour les surfaces, bordures, couleurs de texte et variantes
 * Framer Motion, afin que les 4 démos partagent rigoureusement le même langage
 * visuel (B2B SaaS premium, dark mode profond).
 *
 * Articulation avec le design system du site (design.css) :
 *   - les titres réutilisent `.font-heading` (Space Grotesk), le texte hérite
 *     de Manrope — la typographie de l'espace démo est celle du site ;
 *   - l'accent bleu #3B82F6 est exactement le `--accent` du site ;
 *   - seules les surfaces diffèrent : l'espace démo assume un fond plus
 *     profond et des bordures plus marquées, adaptés à la densité des
 *     tableaux et formulaires. Rien n'est redéfini globalement.
 *
 * Règles de contraste appliquées (fond #0B0F17) :
 *   - text.primary   #F1F5F9  ~ 15:1  → titres et valeurs
 *   - text.body      #CBD5E1  ~ 12:1  → paragraphes
 *   - text.muted     #94A3B8  ~ 7.4:1 → labels, métadonnées (plancher AAA)
 * On n'utilise jamais slate-500/600 pour du texte lisible.
 */

// ── Palette brute (utile pour les styles inline / SVG) ──────────────────────
export const PALETTE = {
  base: '#0B0F17',
  panel: '#111827',
  emerald: '#10B981',
  indigo: '#6366F1',
  cobalt: '#2563EB',
  amber: '#F59E0B',
  slate100: '#F1F5F9',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
};

// ── Surfaces & bordures ─────────────────────────────────────────────────────
export const S = {
  /** Fond général de l'espace démo. */
  page: 'bg-[#0B0F17]',
  /** Panneau de premier niveau (colonnes, grandes zones). */
  panel: 'bg-[#111827]/70 border border-slate-800/80 rounded-2xl',
  /** Carte de contenu à l'intérieur d'un panneau. */
  card: 'bg-slate-800/30 border border-slate-800/80 rounded-xl',
  /** Carte cliquable : la bordure et le fond changent, jamais la taille. */
  cardInteractive:
    'bg-slate-800/30 border border-slate-800/80 rounded-xl transition-colors duration-200 ' +
    'hover:border-slate-700 hover:bg-slate-800/60 focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]',
  /** Zone technique (JSON, logs, aperçu document). */
  well: 'bg-[#080B12] border border-slate-800/80 rounded-xl',
  divider: 'border-slate-800/80',
};

// ── Typographie ─────────────────────────────────────────────────────────────
export const T = {
  h1: 'font-heading text-2xl md:text-3xl font-bold tracking-tight text-slate-100',
  h2: 'font-heading text-lg font-semibold tracking-tight text-slate-100',
  h3: 'font-heading text-sm font-semibold text-slate-100',
  body: 'text-sm leading-relaxed text-slate-300',
  muted: 'text-sm text-slate-400',
  /** Label de champ / colonne : petites capitales espacées. */
  label: 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400',
  /** Toute donnée chiffrée : montants, dates, SIREN, scores, durées. */
  data: 'font-data tabular-nums text-slate-100',
};

// ── Boutons ─────────────────────────────────────────────────────────────────
export const BTN = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold ' +
    'text-white transition-colors duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]',
  success:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold ' +
    'text-white transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800/80 bg-slate-800/30 px-4 py-2.5 ' +
    'text-sm font-medium text-slate-200 transition-colors duration-200 hover:border-slate-700 hover:bg-slate-800/70 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F17]',
  subtle:
    'inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 ' +
    'transition-colors duration-200 hover:bg-slate-800/70 hover:text-slate-200 focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-blue-500/60',
};

// ── Champs de formulaire ────────────────────────────────────────────────────
export const INPUT =
  'w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm text-slate-100 ' +
  'placeholder:text-slate-500 transition-colors duration-200 outline-none focus:border-blue-500/60 ' +
  'focus:ring-2 focus:ring-blue-500/20';

// ── Variantes Framer Motion partagées ───────────────────────────────────────
/** Conteneur qui fait apparaître ses enfants en cascade. */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

/** Enfant d'une cascade : léger glissement vers le haut. */
export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 220, damping: 26 },
  },
};

/** Transition d'un panneau de démo à l'autre (onglets). */
export const panelSwap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/** Ressenti d'appui commun à tous les boutons de l'espace démo. */
export const TAP = { scale: 0.98 };
