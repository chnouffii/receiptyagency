import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { T } from './demoTokens';

/**
 * Affichage d'une séquence de traitement : barre de progression continue +
 * liste d'étapes (terminée / en cours / à venir).
 *
 * Aucune étape ne change de hauteur au fil du traitement : la liste est rendue
 * en entier dès le départ pour éviter tout saut de mise en page.
 */
export function ProcessingPipeline({ steps, status, currentStep, progress, currentDuration }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#080B12] p-5" data-testid="processing-pipeline">
      <div className="flex items-center justify-between gap-3">
        <p className={T.label}>
          {status === 'done' ? 'Traitement terminé' : 'Traitement en cours'}
        </p>
        <span className={`font-data text-xs font-semibold tabular-nums ${status === 'done' ? 'text-emerald-400' : 'text-blue-400'}`}>
          {Math.round(progress)} %
        </span>
      </div>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className={`h-full rounded-full ${status === 'done' ? 'bg-emerald-500' : 'bg-blue-500'}`}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: currentDuration / 1000, ease: 'linear' }}
        />
      </div>

      <ol className="mt-5 space-y-3.5">
        {steps.map((step, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep && status === 'running';

          return (
            <li key={step.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15"
                  >
                    <Check size={12} strokeWidth={2.5} className="text-emerald-400" />
                  </motion.span>
                ) : isActive ? (
                  <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
                    <span className="absolute h-5 w-5 animate-ping rounded-full bg-blue-500/30" />
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-700" />
                )}
              </span>

              <div className="min-w-0">
                <p
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isDone ? 'text-slate-300' : isActive ? 'text-slate-100' : 'text-slate-400'
                  }`}
                >
                  <span className="font-data mr-1.5 text-xs tabular-nums text-slate-400">{index + 1}.</span>
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
