/**
 * ══════════════════════════════════════════════════════════════════════════
 *  GRILLE TARIFAIRE PUBLIQUE — LE SEUL ENDROIT À MODIFIER
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Alimente uniquement la page /quote, qui affiche une FOURCHETTE INDICATIVE.
 * Ce n'est pas un devis : le devis réel est généré depuis l'espace admin
 * (POST /api/admin/quotes/generate), numéroté et avec TVA.
 *
 * Pourquoi des fourchettes et non un montant précis :
 *   un montant sec affiché sous le mot « devis » constitue une offre qu'un
 *   prospect peut opposer. Une fourchette explicitement indicative situe le
 *   budget sans engager.
 *
 * Pour ajuster vos prix, ne touchez que PALIERS et PAR_OPTION ci-dessous.
 * Aucune autre partie du code ne contient de montant.
 */

/** Paliers par effectif. `setup` et `monthly` sont des bornes [min, max] en euros HT. */
export const PALIERS = [
  { id: 'tpe', maxEffectif: 20, setup: [1500, 3000], monthly: [99, 199] },
  { id: 'pme', maxEffectif: 200, setup: [3000, 6000], monthly: [199, 349] },
  { id: 'eti', maxEffectif: 500, setup: [6000, 12000], monthly: [349, 599] },
  // Au-delà : pas de chiffre affiché, le périmètre se définit en échangeant.
  { id: 'grand_compte', maxEffectif: Infinity, setup: null, monthly: null },
];

/** Chaque option cochée décale la fourchette vers le haut, bornes comprises. */
export const PAR_OPTION = { setup: 500, monthly: 30 };

/** Libellés des paliers, pour l'affichage et pour le lead transmis à l'équipe. */
export const LIBELLES_PALIERS = {
  tpe: { fr: 'TPE (≤ 20 salariés)', en: 'Small business (≤ 20 employees)' },
  pme: { fr: 'PME (21 à 200 salariés)', en: 'SMB (21–200 employees)' },
  eti: { fr: 'ETI (201 à 500 salariés)', en: 'Mid-market (201–500 employees)' },
  grand_compte: { fr: 'Grand compte (> 500 salariés)', en: 'Enterprise (> 500 employees)' },
};

/**
 * Calcule la fourchette pour un effectif et un nombre d'options donnés.
 *
 * @returns {{ palier: string, surMesure: boolean,
 *             setup: [number, number]|null, monthly: [number, number]|null }}
 *          `surMesure: true` ⇒ aucun montant à afficher.
 */
export function calculerFourchette(effectif, nbOptions = 0) {
  const palier = PALIERS.find((p) => effectif <= p.maxEffectif) ?? PALIERS[PALIERS.length - 1];

  if (!palier.setup || !palier.monthly) {
    return { palier: palier.id, surMesure: true, setup: null, monthly: null };
  }

  const decaler = ([min, max], pas) => [min + nbOptions * pas, max + nbOptions * pas];

  return {
    palier: palier.id,
    surMesure: false,
    setup: decaler(palier.setup, PAR_OPTION.setup),
    monthly: decaler(palier.monthly, PAR_OPTION.monthly),
  };
}

/** « 3 000 – 6 000 € », ou « 3 000 € » si les bornes se rejoignent. */
export function formaterFourchette([min, max], locale = 'fr-FR') {
  const f = (n) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  return min === max ? `${f(min)} €` : `${f(min)} – ${f(max)} €`;
}
