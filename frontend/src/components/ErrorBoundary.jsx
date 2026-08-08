import { Component } from 'react';

/**
 * Filet de sécurité global : sans lui, une seule exception non rattrapée dans
 * n'importe quel composant démonte tout l'arbre React et laisse une page
 * entièrement blanche — sans message, sans moyen de repartir.
 *
 * Doit rester une classe : React n'expose pas encore `componentDidCatch` aux
 * composants fonction.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Remontée vers Sentry si le SDK est chargé (il ne l'est qu'avec
    // REACT_APP_SENTRY_DSN défini et le consentement accordé).
    window.Sentry?.captureException?.(error, { extra: { componentStack: info?.componentStack } });
    // Toujours tracer en console : c'est la seule information disponible en
    // développement, et en production si Sentry n'est pas configuré.
    console.error('Erreur non rattrapée :', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#050506',
          color: '#f4f5f7',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 12px',
            }}
          >
            Une erreur est survenue
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#9aa0ac', margin: '0 0 24px' }}>
            Cette page n’a pas pu s’afficher correctement. Nos équipes en sont informées.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                minHeight: 44,
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Recharger la page
            </button>
            <a
              href="/"
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 20px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,.16)',
                color: '#f4f5f7',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Retour à l’accueil
            </a>
          </div>
        </div>
      </div>
    );
  }
}
