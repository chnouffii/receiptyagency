import { z } from 'zod';

/**
 * Schémas de validation des formulaires publics.
 *
 * Zod était déclaré dans package.json depuis le début mais jamais importé : la
 * validation se faisait à la main, avec des règles différentes selon les pages
 * (`if (!form.name || !form.email)` sur Contact, aucune sur /quote). Un seul
 * endroit désormais, et des messages bilingues.
 *
 * Cette validation est un confort d'usage, pas une sécurité : le backend
 * revalide tout via Pydantic. Un formulaire soumis depuis un script contourne
 * évidemment ces règles.
 */

const M = {
  fr: {
    name: 'Indiquez votre nom (2 caractères minimum).',
    email: 'Indiquez une adresse email valide.',
    emailPro: 'Utilisez votre adresse professionnelle.',
    company: 'Indiquez le nom de votre entreprise.',
    phone: 'Ce numéro de téléphone ne semble pas valide.',
    message: 'Décrivez votre demande en 10 caractères minimum.',
    messageLong: 'Message trop long (5000 caractères maximum).',
  },
  en: {
    name: 'Please enter your name (2 characters minimum).',
    email: 'Please enter a valid email address.',
    emailPro: 'Please use your work email address.',
    company: 'Please enter your company name.',
    phone: 'This phone number does not look valid.',
    message: 'Please describe your request in at least 10 characters.',
    messageLong: 'Message too long (5000 characters maximum).',
  },
};

// Domaines grand public : sur un site B2B, une adresse personnelle est presque
// toujours une erreur de saisie ou un lead non qualifié. On avertit sans jamais
// bloquer — un indépendant peut légitimement utiliser gmail.
const PERSO = ['gmail.com', 'yahoo.fr', 'yahoo.com', 'hotmail.fr', 'hotmail.com', 'outlook.fr', 'live.fr', 'free.fr', 'orange.fr', 'wanadoo.fr', 'sfr.fr', 'laposte.net', 'icloud.com'];

export function estEmailPersonnel(email) {
  const domaine = String(email || '').split('@')[1]?.toLowerCase();
  return !!domaine && PERSO.includes(domaine);
}

// Souple à dessein : formats français et internationaux, espaces et points
// tolérés. Un filtre strict rejetterait des numéros valides.
const TELEPHONE = /^[+]?[\d\s().-]{6,20}$/;

const champTelephone = (m) =>
  z.string().trim().refine((v) => v === '' || TELEPHONE.test(v), { message: m.phone });

export function schemaContact(lang = 'fr') {
  const m = M[lang] || M.fr;
  return z.object({
    name: z.string().trim().min(2, m.name),
    email: z.string().trim().email(m.email),
    phone: champTelephone(m),
    subject: z.string().trim().max(200).optional().or(z.literal('')),
    message: z.string().trim().min(10, m.message).max(5000, m.messageLong),
  });
}

export function schemaDevis(lang = 'fr') {
  const m = M[lang] || M.fr;
  return z.object({
    name: z.string().trim().min(2, m.name),
    email: z.string().trim().email(m.email),
    company: z.string().trim().min(1, m.company),
    phone: champTelephone(m),
  });
}

/**
 * Valide et renvoie les erreurs par champ.
 * @returns {{ ok: boolean, errors: Record<string,string> }}
 */
export function valider(schema, valeurs) {
  const r = schema.safeParse(valeurs);
  if (r.success) return { ok: true, errors: {} };
  const errors = {};
  for (const issue of r.error.issues) {
    const champ = issue.path[0];
    if (champ && !errors[champ]) errors[champ] = issue.message;
  }
  return { ok: false, errors };
}
