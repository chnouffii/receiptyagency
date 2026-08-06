import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { BTN, INPUT, T } from './demoTokens';

/**
 * Porte d'entrée de l'espace démo prospect.
 *
 * ⚠️ Il s'agit d'un verrou de confort, entièrement côté client : il évite qu'un
 * lien partagé soit indexé ou ouvert par hasard, ce n'est pas un mécanisme de
 * sécurité. Aucune donnée sensible ne doit transiter par cet espace.
 *
 * TODO: Pour un vrai contrôle d'accès, valider le mot de passe côté serveur
 * (POST /api/demos/access) et poser un cookie httpOnly signé côté backend.
 */

const ACCESS_PASSWORD = 'RECEIPTY2026';
export const ACCESS_STORAGE_KEY = 'receipty-demos-access';

/** Lit l'accès déjà accordé sur cet appareil (persistant) ou cet onglet (session). */
export function readStoredAccess() {
  try {
    return (
      window.localStorage.getItem(ACCESS_STORAGE_KEY) === 'granted' ||
      window.sessionStorage.getItem(ACCESS_STORAGE_KEY) === 'granted'
    );
  } catch {
    return false;
  }
}

export function clearStoredAccess() {
  try {
    window.localStorage.removeItem(ACCESS_STORAGE_KEY);
    window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
  } catch {
    /* storage indisponible (navigation privée stricte) — sans effet */
  }
}

export function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef(null);
  const shake = useAnimationControls();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (checking) return;

    setChecking(true);
    setError('');

    // Petit délai volontaire : la vérification instantanée donne l'impression
    // d'un champ cassé quand le mot de passe est correct.
    setTimeout(() => {
      if (password.trim() === ACCESS_PASSWORD) {
        try {
          const store = remember ? window.localStorage : window.sessionStorage;
          store.setItem(ACCESS_STORAGE_KEY, 'granted');
        } catch {
          /* storage indisponible — l'accès reste valable pour la session en cours */
        }
        onUnlock();
        return;
      }

      setChecking(false);
      setAttempts((count) => count + 1);
      setError('Mot de passe incorrect. Vérifiez le code transmis par votre interlocuteur Receipty.');
      shake.start({
        x: [0, -10, 9, -7, 5, -3, 0],
        transition: { duration: 0.42, ease: 'easeInOut' },
      });
      inputRef.current?.select();
    }, 420);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0F17] px-5 py-16">
      {/* Trame de fond discrète : grille technique, aucun halo coloré. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="relative w-full max-w-md"
      >
        <motion.div
          animate={shake}
          className="rounded-2xl border border-slate-800/80 bg-[#111827]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-800/60">
              <Lock size={20} className="text-blue-400" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">Receipty</p>
              <h1 className="font-heading text-xl font-bold tracking-tight text-slate-100">
                Espace Prospect Privé
              </h1>
            </div>
          </div>

          <p className={`${T.body} mt-4`}>
            Cet espace regroupe quatre démonstrations interactives préparées pour votre entreprise.
            Saisissez le code d’accès qui vous a été transmis pour y accéder.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-testid="demos-gate-form">
            <div>
              <label htmlFor="demo-access-code" className={T.label}>
                Code d’accès
              </label>
              <div className="relative mt-1.5">
                <KeyRound
                  size={16}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="demo-access-code"
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Votre code d’accès"
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'demo-access-error' : undefined}
                  data-testid="demos-gate-input"
                  className={`${INPUT} pl-10 pr-11 font-data tracking-[0.12em] ${
                    error ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Masquer le code' : 'Afficher le code'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors duration-200 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* Hauteur réservée : l'apparition du message ne décale pas le formulaire. */}
            <div className="min-h-[36px]">
              {error && (
                <motion.p
                  id="demo-access-error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                >
                  <AlertCircle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                  <span>
                    {error}
                    {attempts >= 3 && (
                      <>
                        {' '}
                        Besoin d’aide ?{' '}
                        <a href="mailto:contact@receipty.fr" className="underline underline-offset-2 hover:text-red-200">
                          contact@receipty.fr
                        </a>
                      </>
                    )}
                  </span>
                </motion.p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                data-testid="demos-gate-remember"
                className="h-4 w-4 rounded border-slate-700 bg-[#080B12] text-blue-600 accent-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              />
              Se souvenir de cet appareil
            </label>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={checking || password.length === 0}
              data-testid="demos-gate-submit"
              className={`${BTN.primary} w-full`}
            >
              {checking ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  />
                  Vérification
                </>
              ) : (
                <>
                  Accéder aux démonstrations
                  <ArrowRight size={16} strokeWidth={1.75} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 flex items-start gap-2 border-t border-slate-800/80 pt-5">
            <ShieldCheck size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs text-slate-400">
              Espace privé, non référencé. Les démonstrations fonctionnent sur des données fictives :
              aucune donnée de votre entreprise n’y est stockée.
            </p>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Vous n’avez pas de code ?{' '}
          <a
            href="/contact"
            className="text-blue-400 underline-offset-2 transition-colors duration-200 hover:text-blue-300 hover:underline"
          >
            Demandez un accès
          </a>
        </p>
      </motion.div>
    </div>
  );
}
