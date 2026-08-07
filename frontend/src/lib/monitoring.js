/**
 * Remontée d'erreurs (Sentry).
 *
 * Chargé dynamiquement, et seulement si REACT_APP_SENTRY_DSN est défini : sans
 * DSN, aucun octet de SDK n'est téléchargé et le site fonctionne à l'identique.
 *
 * Contraintes RGPD appliquées, cohérentes avec la bannière de consentement :
 *   - `sendDefaultPii: false` — ni adresse IP ni identifiants utilisateur ;
 *   - aucun Session Replay (il rejouerait la saisie des formulaires) ;
 *   - les URL des espaces privés sont réduites à leur préfixe, pour ne pas
 *     transmettre d'identifiants de clients ou de devis dans les chemins.
 */

const DSN = process.env.REACT_APP_SENTRY_DSN;
const PRIVATE_AREAS = ['/admin', '/client', '/closer', '/demos'];

/** Remplace /admin/clients/<uuid> par /admin/<masqué> avant tout envoi. */
function redactUrl(url) {
  if (typeof url !== 'string') return url;
  try {
    const parsed = new URL(url, window.location.origin);
    const area = PRIVATE_AREAS.find(
      (p) => parsed.pathname === p || parsed.pathname.startsWith(`${p}/`)
    );
    if (!area) return url;
    return `${parsed.origin}${area}/<masqué>`;
  } catch {
    return url;
  }
}

export async function initMonitoring() {
  if (!DSN || window.__receiptyMonitoringLoaded) return;
  window.__receiptyMonitoringLoaded = true;

  try {
    const Sentry = await import('@sentry/react');

    Sentry.init({
      dsn: DSN,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_RELEASE || undefined,
      sendDefaultPii: false,
      // Échantillonnage des traces de performance : 10 % suffisent à détecter
      // une régression sans saturer le quota.
      tracesSampleRate: 0.1,
      integrations: [Sentry.browserTracingIntegration()],
      beforeSend(event) {
        if (event.request?.url) event.request.url = redactUrl(event.request.url);
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((crumb) =>
            crumb?.data?.url ? { ...crumb, data: { ...crumb.data, url: redactUrl(crumb.data.url) } } : crumb
          );
        }
        return event;
      },
      // Bruit navigateur sans valeur diagnostique (extensions, réseau coupé).
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        'Network Error',
      ],
    });

    // Rend le SDK accessible à ErrorBoundary, qui ne peut pas être async.
    window.Sentry = Sentry;
  } catch (err) {
    // Une panne de la supervision ne doit jamais casser le site.
    console.warn('Sentry non initialisé :', err);
    window.__receiptyMonitoringLoaded = false;
  }
}
