import { motion } from 'framer-motion';
import { CalendarCheck, LogOut, Sparkles } from 'lucide-react';
import { BTN, TAP } from './demoTokens';

/**
 * En-tête permanent de l'espace démo : identité Receipty, statut du visiteur,
 * CTA de prise de rendez-vous et sortie de l'espace.
 */

// TODO: Remplacer par le lien Calendly réel de l'agence (ou la variable
// d'environnement REACT_APP_CALENDLY_URL une fois définie côté déploiement).
export const CALENDLY_URL =
  process.env.REACT_APP_CALENDLY_URL || 'https://calendly.com/receipty/audit-sur-mesure';

export function DemosHeader({ onExit }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      {/* `flex-nowrap` volontaire : avec `flex-wrap`, la barre passait sur deux
          lignes tant que la police de repli était active, puis revenait sur une
          seule dès que Plus Jakarta Sans se chargeait (`font-display: swap`). Tout le
          contenu remontait alors de 44 px — un CLS de 0,123 sur mobile, au-delà
          du seuil de 0,1. La hauteur ne doit dépendre d'aucune métrique de
          police : une seule ligne, et le texte s'efface par paliers. */}
      <div className="mx-auto flex max-w-[1400px] flex-nowrap items-center justify-between gap-3 px-5 py-3.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/"
            className="truncate font-heading text-lg font-bold tracking-tight text-slate-100 transition-colors duration-200 hover:text-white"
          >
            Receipty<span className="text-blue-500">.</span>
          </a>
          <span className="hidden h-5 w-px bg-slate-800 sm:block" aria-hidden="true" />
          <span className="hidden items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300 sm:inline-flex">
            <Sparkles size={12} strokeWidth={2} />
            Prospect Premium — Accès Privilégié
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <motion.a
            whileTap={TAP}
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="demos-cta-calendly"
            className={BTN.primary}
          >
            <CalendarCheck size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">Réserver un audit sur-mesure</span>
            <span className="hidden min-[360px]:inline sm:hidden">Réserver un audit</span>
            <span className="min-[360px]:hidden">Audit</span>
          </motion.a>
          <motion.button
            whileTap={TAP}
            type="button"
            onClick={onExit}
            data-testid="demos-exit"
            className={`${BTN.ghost} px-3`}
            aria-label="Quitter l’espace démo"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span className="hidden md:inline">Quitter l’espace démo</span>
          </motion.button>
        </div>
      </div>

      {/* Badge repliable pour les petits écrans, sous la barre principale. */}
      <div className="border-t border-slate-800/80 px-5 py-2 sm:hidden">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-300">
          <Sparkles size={12} strokeWidth={2} />
          Prospect Premium — Accès Privilégié
        </span>
      </div>
    </header>
  );
}
