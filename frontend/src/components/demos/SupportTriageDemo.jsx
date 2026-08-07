import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertOctagon,
  ArrowUpRight,
  Bot,
  Check,
  Clock,
  Inbox,
  Mail,
  MessageCircle,
  MessagesSquare,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Tag,
  UserRound,
} from 'lucide-react';
import { S, T, TAP, staggerContainer, staggerItem } from './demoTokens';
import { DemoButton, EmptyState, MetricTile, Panel, SectionLabel, StatusBadge } from './DemoUI';
import {
  SENTIMENT_LABELS,
  SUPPORT_ARRIVAL_DELAY,
  SUPPORT_CHANNELS,
  SUPPORT_MESSAGES,
  SUPPORT_METRICS,
  URGENCY_LABELS,
} from './data/supportData';

/** Durée de l'analyse affichée avant l'apparition des badges de triage. */
const TRIAGE_DURATION = 700;

const CHANNEL_ICONS = { email: Mail, whatsapp: MessageCircle, form: MessagesSquare };

/**
 * Démo 5 — Agent support omnicanal & triage intelligent.
 *
 * Les messages arrivent de trois canaux dans une boîte unique. Chacun est
 * classé automatiquement, puis l'agent tranche : résolution directe quand le
 * cas est documenté, escalade au bon pôle quand il ne l'est pas. La démo
 * insiste sur ce partage — l'IA ne décide jamais d'un litige commercial.
 */
export function SupportTriageDemo() {
  const [arrived, setArrived] = useState(0);
  const [analyzing, setAnalyzing] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [handled, setHandled] = useState({});
  const [running, setRunning] = useState(false);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** Lance le flux : les messages tombent un par un, puis sont triés. */
  const startFlow = useCallback(() => {
    clearTimers();
    setArrived(0);
    setAnalyzing({});
    setHandled({});
    setSelectedId(null);
    setRunning(true);

    // TODO: Remplacer par l'abonnement WebSocket /api/support/stream — le
    // rendu est déjà incrémental, il suffit de pousser chaque message reçu.
    SUPPORT_MESSAGES.forEach((message, index) => {
      const arrivalAt = (index + 1) * SUPPORT_ARRIVAL_DELAY;

      timers.current.push(
        setTimeout(() => {
          setArrived(index + 1);
          setAnalyzing((current) => ({ ...current, [message.id]: true }));
          // Le premier message arrivé est sélectionné d'office.
          setSelectedId((current) => current ?? message.id);
        }, arrivalAt),
      );

      timers.current.push(
        setTimeout(() => {
          setAnalyzing((current) => ({ ...current, [message.id]: false }));
          if (index === SUPPORT_MESSAGES.length - 1) setRunning(false);
        }, arrivalAt + TRIAGE_DURATION),
      );
    });
  }, [clearTimers]);

  const handleReset = () => {
    clearTimers();
    setArrived(0);
    setAnalyzing({});
    setHandled({});
    setSelectedId(null);
    setRunning(false);
  };

  const visibleMessages = useMemo(() => SUPPORT_MESSAGES.slice(0, arrived), [arrived]);
  const selected = visibleMessages.find((message) => message.id === selectedId) ?? null;
  const isSelectedAnalyzing = selected ? analyzing[selected.id] : false;

  const autoResolved = visibleMessages.filter(
    (message) => message.action.type === 'auto' && !analyzing[message.id],
  ).length;
  const escalated = visibleMessages.filter(
    (message) => message.action.type === 'escalate' && !analyzing[message.id],
  ).length;

  const handleSend = (message) => {
    setHandled((current) => ({ ...current, [message.id]: 'sent' }));
    // TODO: Remplacer par POST /api/support/reply (webhook n8n
    // `receipty-support-reply`) qui poste la réponse sur le canal d'origine.
    toast.success('Réponse envoyée (simulation)', {
      description: `${message.from} — ${SUPPORT_CHANNELS.find((c) => c.id === message.channel)?.label}`,
    });
  };

  const handleAssign = (message) => {
    setHandled((current) => ({ ...current, [message.id]: 'assigned' }));
    toast.success(`Ticket assigné — ${message.action.assignee.pole}`, {
      description: `${message.action.assignee.name} · ${message.action.assignee.sla}`,
    });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      {/* ── Bandeau d'amorçage ────────────────────────────────────────────── */}
      <motion.div variants={staggerItem} className={`${S.panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="max-w-2xl">
          <h1 className={T.h1}>Agent support omnicanal &amp; triage intelligent</h1>
          <p className={`${T.body} mt-1.5`}>
            Email, WhatsApp Business et formulaire web arrivent dans une boîte unique. Chaque message est classé par
            sentiment, urgence et catégorie — puis résolu automatiquement, ou escaladé au bon pôle avec un résumé
            exploitable.
          </p>
        </div>
        <DemoButton
          variant="success"
          icon={Sparkles}
          onClick={startFlow}
          disabled={running}
          data-testid="support-prefill"
        >
          Remplir avec un exemple réel
        </DemoButton>
      </motion.div>

      {/* ── Indicateurs ──────────────────────────────────────────────────── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
        <MetricTile
          label="Délai de première réponse"
          value={SUPPORT_METRICS.firstResponseAfter}
          hint={`Contre ${SUPPORT_METRICS.firstResponseBefore} avant automatisation`}
          icon={Clock}
          tone="success"
        />
        <MetricTile
          label="Résolution automatique"
          value={SUPPORT_METRICS.autoResolutionRate}
          unit="%"
          hint="Le reste est escaladé avec un résumé prêt"
          icon={Bot}
          tone="success"
        />
        <MetricTile
          label="Volume traité"
          value={SUPPORT_METRICS.ticketsPerMonth}
          unit="/ mois"
          hint="Trois canaux confondus"
          icon={Inbox}
        />
        <MetricTile
          label="Traités dans ce flux"
          value={`${autoResolved}/${escalated}`}
          hint="Résolus automatiquement / escaladés"
          icon={Tag}
          tone="info"
        />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] [&>*]:min-w-0">
        {/* ── Boîte de réception unifiée ──────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel
            title="Boîte de réception unifiée"
            subtitle={
              arrived > 0
                ? `${arrived} message${arrived > 1 ? 's' : ''} sur ${SUPPORT_MESSAGES.length}`
                : 'Trois canaux, une seule file'
            }
            icon={Inbox}
            action={
              arrived > 0 && (
                <motion.button
                  whileTap={TAP}
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800/70 hover:text-slate-200"
                  data-testid="support-reset"
                >
                  <RotateCcw size={14} strokeWidth={1.75} />
                  Réinitialiser
                </motion.button>
              )
            }
          >
            {/* Canaux connectés */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800/80 p-5">
              {SUPPORT_CHANNELS.map((channel) => {
                const Icon = CHANNEL_ICONS[channel.id];
                return (
                  <span
                    key={channel.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-800/40 px-2.5 py-1.5"
                  >
                    <Icon size={13} strokeWidth={1.75} className="text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-200">{channel.label}</span>
                    <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  </span>
                );
              })}
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {arrived === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Aucun message en file"
                  description="Lancez le flux pour voir arriver six demandes réelles et leur traitement automatique."
                >
                  <DemoButton icon={Play} onClick={startFlow} data-testid="support-start">
                    Démarrer le flux
                  </DemoButton>
                </EmptyState>
              ) : (
                <ul className="divide-y divide-slate-800/80">
                  <AnimatePresence initial={false}>
                    {visibleMessages.map((message) => (
                      <InboxRow
                        key={message.id}
                        message={message}
                        analyzing={analyzing[message.id]}
                        selected={message.id === selectedId}
                        handled={handled[message.id]}
                        onSelect={() => setSelectedId(message.id)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </Panel>
        </motion.div>

        {/* ── Détail et action de l'agent ─────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel
            title="Analyse et action de l’agent"
            subtitle={selected ? `${selected.company} · reçu à ${selected.receivedAt}` : 'Sélectionnez un message'}
            icon={Bot}
            className="h-full"
          >
            <div className="h-full p-5">
              <AnimatePresence mode="wait">
                {!selected && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EmptyState
                      icon={Bot}
                      title="Aucun message sélectionné"
                      description="Lancez le flux, puis cliquez sur un message pour voir le raisonnement de l’agent."
                    />
                  </motion.div>
                )}

                {selected && (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <MessageDetail message={selected} />

                    {isSelectedAnalyzing ? (
                      <div className={`${S.well} flex items-center gap-3 p-5`} data-testid="support-analyzing">
                        <span className="relative flex h-4 w-4" aria-hidden="true">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500/40" />
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
                        </span>
                        <p className="text-sm text-slate-300">Classification et recherche dans la base de connaissances…</p>
                      </div>
                    ) : (
                      <>
                        <TriagePanel triage={selected.triage} />
                        <ActionPanel
                          message={selected}
                          handledState={handled[selected.id]}
                          onSend={() => handleSend(selected)}
                          onAssign={() => handleAssign(selected)}
                        />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────── Sous-composants ────────────────────────── */

/** Ligne de la boîte de réception. */
function InboxRow({ message, analyzing, selected, handled, onSelect }) {
  const Icon = CHANNEL_ICONS[message.channel];
  const sentiment = SENTIMENT_LABELS[message.triage.sentiment];
  const urgency = URGENCY_LABELS[message.triage.urgency];

  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <button
        type="button"
        onClick={onSelect}
        data-testid={`support-message-${message.id}`}
        className={`w-full px-5 py-3.5 text-left transition-colors duration-200 focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/60
          ${selected ? 'bg-blue-500/[0.07]' : 'hover:bg-slate-800/40'}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
            <Icon size={15} strokeWidth={1.75} className="text-slate-300" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium text-slate-100">{message.from}</p>
              <span className="shrink-0 font-data text-[11px] tabular-nums text-slate-400">{message.receivedAt}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-400">{message.subject}</p>

            {/* Zone de badges à hauteur réservée : aucun décalage au triage. */}
            <div className="mt-2 flex min-h-[24px] flex-wrap items-center gap-1.5">
              {analyzing ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-300">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
                  Analyse en cours
                </span>
              ) : (
                <>
                  <TriageBadge tone={urgency.tone}>{urgency.label}</TriageBadge>
                  <TriageBadge tone={sentiment.tone}>{sentiment.label}</TriageBadge>
                  <TriageBadge tone="neutral">{message.triage.category}</TriageBadge>
                  {handled && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <Check size={11} strokeWidth={2.5} />
                      {handled === 'sent' ? 'Répondu' : 'Assigné'}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}

/** Badge compact de triage — quatre tons, dimensions identiques. */
function TriageBadge({ tone, children }) {
  const tones = {
    critical: 'border-red-500/40 bg-red-500/10 text-red-300',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    info: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    neutral: 'border-slate-700 bg-slate-800/60 text-slate-300',
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tones[tone] ?? tones.neutral}`}>
      {children}
    </span>
  );
}

/** Message d'origine, tel que reçu sur son canal. */
function MessageDetail({ message }) {
  const Icon = CHANNEL_ICONS[message.channel];
  const channel = SUPPORT_CHANNELS.find((item) => item.id === message.channel);

  return (
    <div className={`${S.card} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
            <UserRound size={16} strokeWidth={1.75} className="text-slate-300" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">{message.from}</p>
            <p className="font-data text-[11px] text-slate-400">
              {message.company} · {message.contact}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-800/40 px-2.5 py-1.5">
          <Icon size={13} strokeWidth={1.75} className="text-slate-400" />
          <span className="text-[11px] font-medium text-slate-200">{channel?.label}</span>
        </span>
      </div>

      <p className="mt-3.5 text-sm font-medium text-slate-100">{message.subject}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{message.body}</p>
    </div>
  );
}

/** Résultat de classification : sentiment, urgence, catégorie et signaux. */
function TriagePanel({ triage }) {
  const sentiment = SENTIMENT_LABELS[triage.sentiment];
  const urgency = URGENCY_LABELS[triage.urgency];

  return (
    <div data-testid="support-triage">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Classification automatique</SectionLabel>
        <span className="font-data text-[11px] tabular-nums text-emerald-400">
          Confiance {triage.confidence} %
        </span>
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3 [&>*]:min-w-0">
        {[
          { label: 'Urgence', value: urgency.label, tone: urgency.tone },
          { label: 'Sentiment', value: sentiment.label, tone: sentiment.tone },
          { label: 'Catégorie', value: triage.category, tone: 'neutral' },
        ].map((item) => (
          <div key={item.label} className={`${S.card} p-3`}>
            <p className={T.label}>{item.label}</p>
            <div className="mt-1.5">
              <TriageBadge tone={item.tone}>{item.value}</TriageBadge>
            </div>
          </div>
        ))}
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {triage.signals.map((signal) => (
          <li key={signal} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
            <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
            {signal}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Décision de l'agent : réponse automatique ou escalade humaine. */
function ActionPanel({ message, handledState, onSend, onAssign }) {
  const { action } = message;

  if (action.type === 'auto') {
    return (
      <div data-testid="support-action-auto">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Résolution automatique proposée</SectionLabel>
          <StatusBadge tone="success" icon={Bot}>
            Cas documenté
          </StatusBadge>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Fondée sur — </span>
          {action.basis}
        </p>

        <div className={`${S.well} mt-2.5 p-4`}>
          <p className={T.label}>Réponse rédigée</p>
          <p
            className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300"
            data-testid="support-draft"
          >
            {action.draft}
          </p>
        </div>

        <p className="mt-2.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Suite à donner — </span>
          {action.followUp}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-800/80 pt-4">
          {handledState === 'sent' ? (
            <StatusBadge tone="success" icon={Check}>
              Réponse envoyée
            </StatusBadge>
          ) : (
            <DemoButton icon={Send} onClick={onSend} data-testid="support-send">
              Envoyer la réponse IA
            </DemoButton>
          )}
          <span className="text-xs text-slate-400">
            Rien ne part sans validation : l’agent propose, vous décidez.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="support-action-escalate">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Escalade humaine requise</SectionLabel>
        <StatusBadge tone="warning" icon={AlertOctagon}>
          Hors périmètre de l’agent
        </StatusBadge>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Motif — </span>
        {action.reason}
      </p>

      <div className={`${S.card} mt-2.5 p-4`}>
        <p className={T.label}>Résumé transmis au pôle</p>
        <ul className="mt-2 space-y-2">
          {action.summary.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-300">
              <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-400" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${S.card} mt-2.5 flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
            <ArrowUpRight size={16} strokeWidth={1.75} className="text-amber-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Transmis à {action.assignee.name}
            </p>
            <p className="font-data text-[11px] text-slate-400">
              {action.assignee.pole} · {action.assignee.sla}
            </p>
          </div>
        </div>
      </div>

      <div className={`${S.well} mt-2.5 p-4`}>
        <p className={T.label}>Accusé de réception envoyé au client</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{action.acknowledgement}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-800/80 pt-4">
        {handledState === 'assigned' ? (
          <StatusBadge tone="success" icon={Check}>
            Ticket assigné
          </StatusBadge>
        ) : (
          <DemoButton icon={ArrowUpRight} onClick={onAssign} data-testid="support-assign">
            Confirmer l’assignation
          </DemoButton>
        )}
        <span className="text-xs text-slate-400">
          Un litige contractuel ne se traite jamais automatiquement.
        </span>
      </div>
    </div>
  );
}
