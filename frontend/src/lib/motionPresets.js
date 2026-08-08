/**
 * Presets Framer Motion partagés par les sections de la landing.
 *
 * Deux règles portent tout le reste :
 *
 *  1. Une seule courbe d'assouplissement pour tout le site — cubic-bezier
 *     (.16,1,.3,1), une sortie longue et calme. Mélanger les easings est ce
 *     qui donne aux pages leur air « assemblé à la va-vite » : chaque bloc
 *     bouge selon sa propre physique.
 *
 *  2. Les entrées au scroll sont déclenchées par `whileInView` avec
 *     `once: true`. Un élément qui rejoue son animation à chaque passage
 *     transforme le défilement en clignotement.
 *
 * `prefers-reduced-motion` : la règle CSS globale de design.css ne couvre que
 * les animations CSS. Framer Motion écrit des styles inline en JS, elle ne
 * peut donc rien contre lui — d'où `useMotionSafe()`, qui neutralise les
 * décalages côté JS et ne laisse qu'un fondu d'opacité.
 */
import { useReducedMotion } from 'framer-motion';

export const EASE = [0.16, 1, 0.3, 1];

/** Conteneur : cadence l'entrée de ses enfants `riseItem`. */
export const staggerContainer = (stagger = 0.08, delay = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** Enfant : monte et se révèle. `y` négatif pour descendre depuis le haut. */
export const riseItem = (y = 24, duration = 0.7) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
});

/** Glissement latéral, pour les colonnes d'une composition asymétrique. */
export const slideItem = (x = 32, duration = 0.75) => ({
  hidden: { opacity: 0, x },
  show: { opacity: 1, x: 0, transition: { duration, ease: EASE } },
});

/** Trait de séparation qui se dessine sur sa largeur. */
export const drawRule = (duration = 0.9) => ({
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: 1,
    transition: { duration, ease: EASE },
  },
});

/** Réglage de `whileInView` réutilisé partout : déclenche un peu avant. */
export const VIEWPORT = { once: true, margin: '-80px 0px -80px 0px' };

/**
 * Variantes neutralisées quand l'utilisateur demande moins d'animations.
 * On garde le fondu : sans lui, les éléments apparaissent d'un coup et on
 * perd le repère visuel « ce bloc vient d'entrer ».
 */
const FADE_ONLY = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export function useMotionSafe() {
  const reduced = useReducedMotion();
  return {
    reduced,
    /** Enveloppe une variante : la remplace par un simple fondu si besoin. */
    v: (variants) => (reduced ? FADE_ONLY : variants),
    /** Conteneur : supprime aussi la cadence, tout entre ensemble. */
    container: (stagger, delay) =>
      reduced ? { hidden: {}, show: {} } : staggerContainer(stagger, delay),
    /** Valeur d'animation au survol, désactivée en mode sobre. */
    hover: (value) => (reduced ? undefined : value),
  };
}
