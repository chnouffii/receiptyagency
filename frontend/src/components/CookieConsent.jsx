import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Bannière de consentement à la mesure d'audience (PostHog).
 *
 * Aucun traceur n'est déposé avant un clic explicite sur « Accepter » :
 * `public/index.html` s'arrête tant que la clé ci-dessous ne vaut pas
 * `granted`, et n'expose que `window.__receiptyInitAnalytics()`, appelé ici.
 *
 * La bannière ne s'affiche pas dans les espaces privés (admin, closer, client,
 * démos) : la mesure y est désactivée sans condition, il n'y a donc rien à
 * consentir.
 */

const CONSENT_KEY = 'receipty-analytics-consent';
const PRIVATE_AREAS = ['/admin', '/client', '/closer', '/demos'];

function readConsent() {
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function writeConsent(value) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* stockage indisponible (navigation privée stricte) — sans effet */
  }
}

export function CookieConsent() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const isPrivate = PRIVATE_AREAS.some((p) => path === p || path.startsWith(`${p}/`));
    if (isPrivate) return;
    if (!readConsent()) setVisible(true);
  }, []);

  const accept = () => {
    writeConsent('granted');
    setVisible(false);
    window.__receiptyInitAnalytics?.();
  };

  const refuse = () => {
    writeConsent('denied');
    setVisible(false);
  };

  if (!visible) return null;

  const t = lang === 'fr'
    ? {
        text: 'Nous utilisons une mesure d’audience pour comprendre comment le site est utilisé. Aucun traceur n’est déposé sans votre accord.',
        more: 'En savoir plus',
        accept: 'Accepter',
        refuse: 'Refuser',
        label: 'Consentement à la mesure d’audience',
      }
    : {
        text: 'We use analytics to understand how the site is used. No tracker is set without your consent.',
        more: 'Learn more',
        accept: 'Accept',
        refuse: 'Decline',
        label: 'Analytics consent',
      };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.label}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-700/60 bg-[#0B0F17]/95 px-4 py-4 backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-300">
          {t.text}{' '}
          <a
            href="/privacy"
            className="text-blue-400 underline underline-offset-2 transition-colors duration-200 hover:text-blue-300"
          >
            {t.more}
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={refuse}
            data-testid="cookie-refuse"
            className="min-h-[44px] rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            {t.refuse}
          </button>
          <button
            type="button"
            onClick={accept}
            data-testid="cookie-accept"
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
