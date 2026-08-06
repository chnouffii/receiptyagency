import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Joue une séquence d'étapes de traitement (chaque étape a sa propre durée) et
 * expose l'état courant pour l'affichage.
 *
 * Statuts possibles : 'idle' | 'running' | 'done'.
 *
 * TODO: Lors du branchement backend, remplacer les `setTimeout` par les
 * événements réels du webhook n8n (Server-Sent Events ou polling du statut de
 * job) — l'interface n'a alors pas à changer.
 */
export function useProcessingSequence(steps) {
  const [status, setStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const start = useCallback(
    (onComplete) => {
      clearTimers();
      setStatus('running');
      setCurrentStep(0);

      let elapsed = 0;
      steps.forEach((step, index) => {
        elapsed += step.duration;
        const isLast = index === steps.length - 1;
        timers.current.push(
          setTimeout(() => {
            if (isLast) {
              setCurrentStep(steps.length);
              setStatus('done');
              onComplete?.();
            } else {
              setCurrentStep(index + 1);
            }
          }, elapsed),
        );
      });
    },
    [steps, clearTimers],
  );

  const reset = useCallback(() => {
    clearTimers();
    setStatus('idle');
    setCurrentStep(-1);
  }, [clearTimers]);

  /** Progression cible en % : la barre s'anime jusqu'à cette valeur. */
  const progress = status === 'done' ? 100 : status === 'idle' ? 0 : ((currentStep + 1) / steps.length) * 100;

  /** Durée de l'étape en cours, pour caler l'animation de la barre dessus. */
  const currentDuration = status === 'running' ? (steps[currentStep]?.duration ?? 600) : 300;

  return { status, currentStep, progress, currentDuration, start, reset };
}
