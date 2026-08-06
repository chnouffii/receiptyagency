import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Bot,
  ChevronDown,
  CornerDownLeft,
  Database,
  FileText,
  MessagesSquare,
  Quote,
  RefreshCw,
  Sparkles,
  User,
  UserCog,
} from 'lucide-react';
import { S, T, TAP, staggerContainer, staggerItem } from './demoTokens';
import { ConfidenceMeter, DemoButton, Panel, SectionLabel, SideDrawer, StatusBadge } from './DemoUI';
import {
  KNOWLEDGE_BASE,
  KNOWLEDGE_STATS,
  RAG_PERSONAS,
  RAG_SUGGESTIONS,
  RAG_THINKING_STEPS,
  resolveRagAnswer,
} from './data/ragData';

/** Vitesse de la simulation de frappe : caractères révélés par tick de 12 ms. */
const TYPING_CHUNK = 9;
const TYPING_INTERVAL = 12;

/**
 * Démo 2 — Assistant RAG interne sur la base documentaire de l'entreprise.
 *
 * Le point clé à démontrer n'est pas le chat, c'est la traçabilité : chaque
 * réponse porte un score de confiance, cite ses sources, et le passage exact
 * est consultable surligné dans sa page d'origine.
 */
export function RagAssistantDemo() {
  const [persona, setPersona] = useState('employee');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinkingStep, setThinkingStep] = useState(-1);
  const [streaming, setStreaming] = useState(null);
  const [openSource, setOpenSource] = useState(null);
  const scrollRef = useRef(null);
  const timers = useRef([]);

  const isBusy = thinkingStep >= 0 || streaming !== null;

  const clearTimers = () => {
    timers.current.forEach((timer) => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  // Suit la conversation sans jamais faire sauter la page entière.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, streaming, thinkingStep]);

  const ask = useCallback(
    (question) => {
      if (isBusy || !question.trim()) return;

      const result = resolveRagAnswer(question, persona);
      const personaLabel = RAG_PERSONAS.find((item) => item.id === persona)?.label ?? '';

      setMessages((current) => [
        ...current,
        { id: `u-${Date.now()}`, role: 'user', content: question.trim(), persona: personaLabel },
      ]);
      setInput('');
      clearTimers();

      // ── Phase 1 : indicateur de réflexion (étapes du pipeline RAG) ───────
      setThinkingStep(0);
      RAG_THINKING_STEPS.forEach((_, index) => {
        if (index === 0) return;
        timers.current.push(setTimeout(() => setThinkingStep(index), index * 520));
      });

      // ── Phase 2 : streaming de la réponse (simulation de frappe) ─────────
      // TODO: Remplacer par un vrai flux SSE depuis POST /api/rag/query
      // (webhook n8n `receipty-rag-query`) — le rendu ci-dessous est déjà
      // incrémental, il suffit de pousser les tokens reçus dans `revealed`.
      timers.current.push(
        setTimeout(() => {
          setThinkingStep(-1);
          setStreaming({ revealed: '' });

          let cursor = 0;
          const interval = setInterval(() => {
            cursor += TYPING_CHUNK;
            if (cursor >= result.answer.length) {
              clearInterval(interval);
              setStreaming(null);
              setMessages((current) => [
                ...current,
                {
                  id: `a-${Date.now()}`,
                  role: 'assistant',
                  content: result.answer,
                  sources: result.sources,
                  confidence: result.confidence,
                  verdict: result.verdict,
                },
              ]);
              return;
            }
            setStreaming({ revealed: result.answer.slice(0, cursor) });
          }, TYPING_INTERVAL);
          timers.current.push(interval);
        }, RAG_THINKING_STEPS.length * 520),
      );
    },
    [isBusy, persona],
  );

  const handleReset = () => {
    clearTimers();
    setMessages([]);
    setStreaming(null);
    setThinkingStep(-1);
    setInput('');
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={staggerItem} className={`${S.panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="max-w-2xl">
          <h1 className={T.h1}>Assistant interne &amp; base de connaissances</h1>
          <p className={`${T.body} mt-1.5`}>
            Vos procédures internes deviennent interrogeables en langage naturel. Chaque réponse porte un score de
            confiance et cite ses sources : document, page et section, consultables en un clic.
          </p>
        </div>
        <DemoButton
          variant="success"
          icon={Sparkles}
          onClick={() => ask(RAG_SUGGESTIONS[0].question)}
          disabled={isBusy}
          data-testid="rag-prefill"
        >
          Remplir avec un exemple réel
        </DemoButton>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Conversation ────────────────────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel
            title="Assistant Receipty"
            subtitle="Connecté à 5 documents internes · 584 extraits indexés"
            icon={Bot}
            action={
              messages.length > 0 && (
                <motion.button
                  whileTap={TAP}
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800/70 hover:text-slate-200"
                  data-testid="rag-reset"
                >
                  <RefreshCw size={14} strokeWidth={1.75} />
                  Nouvelle conversation
                </motion.button>
              )
            }
          >
            {/* Perspective de lecture */}
            <div className="border-b border-slate-800/80 p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="min-w-0 flex-1">
                  <span className={`${T.label} flex items-center gap-1.5`}>
                    <UserCog size={12} strokeWidth={2} />
                    Perspective de lecture
                  </span>
                  <select
                    value={persona}
                    onChange={(event) => setPersona(event.target.value)}
                    disabled={isBusy}
                    data-testid="rag-persona"
                    className="mt-1.5 w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                  >
                    {RAG_PERSONAS.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#111827]">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {RAG_PERSONAS.find((item) => item.id === persona)?.hint} — même base documentaire, angle de
                restitution différent.
              </p>
            </div>

            {/* Questions suggérées */}
            <div className="border-b border-slate-800/80 p-5">
              <SectionLabel>Questions fréquentes — cliquez pour interroger la base</SectionLabel>
              <div className="mt-2.5 grid gap-2">
                {RAG_SUGGESTIONS.map((suggestion) => (
                  <motion.button
                    key={suggestion.id}
                    whileTap={TAP}
                    type="button"
                    disabled={isBusy}
                    onClick={() => ask(suggestion.question)}
                    data-testid={`rag-suggestion-${suggestion.id}`}
                    className={`${S.cardInteractive} flex items-center gap-3 p-3 text-left disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <MessagesSquare size={16} strokeWidth={1.75} className="shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 text-sm text-slate-200">{suggestion.label}</span>
                    <span className="hidden shrink-0 rounded-full border border-slate-800/80 bg-slate-800/50 px-2 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">
                      {suggestion.topic}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Fil de discussion */}
            <div ref={scrollRef} className="h-[460px] space-y-5 overflow-y-auto p-5">
              {messages.length === 0 && !isBusy && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-800/40">
                    <Bot size={20} className="text-slate-400" strokeWidth={1.5} />
                  </span>
                  <h3 className={`${T.h3} mt-4`}>Posez votre première question</h3>
                  <p className="mt-1.5 max-w-sm text-sm text-slate-400">
                    L’assistant ne répond que sur la base de vos documents internes. S’il ne trouve pas
                    l’information, il le dit — il n’invente jamais.
                  </p>
                </div>
              )}

              {messages.map((message) =>
                message.role === 'user' ? (
                  <UserMessage key={message.id} content={message.content} persona={message.persona} />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    content={message.content}
                    sources={message.sources}
                    confidence={message.confidence}
                    verdict={message.verdict}
                    onOpenSource={setOpenSource}
                  />
                ),
              )}

              <AnimatePresence>
                {thinkingStep >= 0 && <ThinkingIndicator step={thinkingStep} />}
              </AnimatePresence>

              {streaming && <AssistantMessage content={streaming.revealed} streaming />}
            </div>

            {/* Saisie libre */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2.5 border-t border-slate-800/80 p-4"
            >
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Posez une question sur vos procédures internes…"
                disabled={isBusy}
                data-testid="rag-input"
                className="w-full rounded-lg border border-slate-800/80 bg-[#080B12] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
              <DemoButton
                type="submit"
                icon={CornerDownLeft}
                disabled={isBusy || input.trim().length === 0}
                data-testid="rag-send"
                className="shrink-0"
              >
                <span className="hidden sm:inline">Envoyer</span>
              </DemoButton>
            </form>
          </Panel>
        </motion.div>

        {/* ── Base documentaire ───────────────────────────────────────────── */}
        <motion.div variants={staggerItem}>
          <Panel title="Base de connaissances" subtitle="Corpus indexé pour cette démonstration" icon={Database}>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Documents', value: KNOWLEDGE_STATS.documents },
                  { label: 'Pages', value: KNOWLEDGE_STATS.pages },
                  { label: 'Extraits', value: KNOWLEDGE_STATS.chunks },
                ].map((stat) => (
                  <div key={stat.label} className={`${S.card} p-3 text-center`}>
                    <p className="font-data text-lg font-bold tabular-nums text-slate-100">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <SectionLabel>Documents indexés</SectionLabel>
                <StatusBadge tone="success" live>
                  Synchronisé
                </StatusBadge>
              </div>

              <ul className="space-y-2">
                {KNOWLEDGE_BASE.map((doc) => (
                  <li key={doc.id} className={`${S.card} flex items-start gap-3 p-3`}>
                    <FileText size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate font-data text-xs text-slate-200">{doc.name}</p>
                      <p className="mt-1 font-data text-[11px] tabular-nums text-slate-400">
                        {doc.pages} p. · {doc.chunks} extraits · maj {doc.updatedAt}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                Dernière synchronisation : <span className="font-data tabular-nums">{KNOWLEDGE_STATS.lastSync}</span>.
                En production, l’indexation se déclenche automatiquement à chaque dépôt ou modification de document.
              </p>
            </div>
          </Panel>
        </motion.div>
      </div>

      {/* ── Volet d'aperçu du document source ─────────────────────────────── */}
      <SideDrawer
        open={Boolean(openSource)}
        onClose={() => setOpenSource(null)}
        title={openSource?.document ?? ''}
        subtitle={openSource ? `Page ${openSource.page} · ${openSource.section}` : ''}
        icon={FileText}
        testId="rag-source-drawer"
      >
        {openSource && <SourcePreview source={openSource} />}
      </SideDrawer>
    </motion.div>
  );
}

/* ────────────────────────────── Sous-composants ────────────────────────── */

function UserMessage({ content, persona }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end gap-3">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-blue-500/25 bg-blue-500/10 px-4 py-3">
        <p className="text-sm leading-relaxed text-slate-100">{content}</p>
        {persona && <p className="mt-1.5 text-[11px] text-blue-300">{persona}</p>}
      </div>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
        <User size={15} strokeWidth={1.75} className="text-slate-300" />
      </span>
    </motion.div>
  );
}

function AssistantMessage({ content, sources, confidence, verdict, streaming = false, onOpenSource }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
        <Bot size={15} strokeWidth={1.75} className="text-blue-400" />
      </span>
      <div className="min-w-0 max-w-[85%] flex-1">
        <div className="rounded-2xl rounded-tl-sm border border-slate-800/80 bg-slate-800/30 px-4 py-3">
          <RichText text={content} />
          {streaming && (
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-blue-400"
            />
          )}
        </div>

        {confidence !== undefined && (
          <div className={`${S.card} mt-2.5 p-3`} data-testid="rag-confidence">
            <ConfidenceMeter label="Pertinence de la source" value={confidence} verdict={verdict} />
          </div>
        )}

        {sources && sources.length > 0 && <SourceList sources={sources} onOpenSource={onOpenSource} />}
      </div>
    </motion.div>
  );
}

/** Rendu léger : paragraphes + puces « • », sans dépendance markdown. */
function RichText({ text }) {
  const blocks = text.split('\n').filter((line) => line.trim().length > 0);
  return (
    <div className="space-y-2">
      {blocks.map((line, index) =>
        line.trimStart().startsWith('•') ? (
          <p key={index} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
            <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
            <span>{line.trimStart().slice(1).trim()}</span>
          </p>
        ) : (
          <p key={index} className="text-sm leading-relaxed text-slate-300">
            {line}
          </p>
        ),
      )}
    </div>
  );
}

/**
 * Tags de sources. Le chevron déplie l'extrait cité ; le libellé ouvre le
 * volet latéral avec la page entière, passage surligné.
 */
function SourceList({ sources, onOpenSource }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-2.5 space-y-2">
      <motion.p variants={staggerItem} className={`${T.label} flex items-center gap-1.5`}>
        <BookOpen size={12} strokeWidth={2} />
        Sources citées ({sources.length})
      </motion.p>

      {sources.map((source, index) => {
        const isOpen = openIndex === index;
        return (
          <motion.div key={`${source.document}-${source.page}`} variants={staggerItem}>
            <div className={`${S.cardInteractive} flex items-center gap-1`}>
              <button
                type="button"
                onClick={() => onOpenSource?.(source)}
                data-testid={`rag-source-${index}`}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-l-xl px-3 py-2 text-left focus-visible:outline-none"
              >
                <Quote size={13} strokeWidth={2} className="shrink-0 text-emerald-400" />
                <span className="min-w-0 flex-1 truncate font-data text-[11px] text-slate-300">
                  {source.document} — Page {source.page}, {source.section}
                </span>
                <span className="hidden shrink-0 font-data text-[10px] tabular-nums text-emerald-400 sm:inline">
                  {source.relevance} %
                </span>
              </button>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-label={isOpen ? 'Replier l’extrait' : 'Déplier l’extrait'}
                className="shrink-0 rounded-md p-2 text-slate-400 transition-colors duration-200 hover:text-slate-200"
              >
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p className="mt-1.5 rounded-lg border-l-2 border-emerald-500/50 bg-[#080B12] px-3.5 py-2.5 text-xs italic leading-relaxed text-slate-300">
                    « {source.excerpt} »
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/** Aperçu de la page source, passage cité surligné dans son contexte. */
function SourcePreview({ source }) {
  return (
    <div className="space-y-5">
      <div className={`${S.card} p-4`}>
        <ConfidenceMeter label="Pertinence de ce passage" value={source.relevance} />
        <dl className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-3">
          {[
            ['Document', source.document],
            ['Page', String(source.page)],
            ['Section', source.section],
            ['Dernière mise à jour', source.updatedAt],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-right font-data text-xs text-slate-200">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <SectionLabel>Extrait du document — passage cité surligné</SectionLabel>
        {/* Fond clair volontaire : on reproduit la page telle qu'elle serait lue. */}
        <div className="mt-2.5 rounded-xl border border-slate-800/80 bg-[#F8FAFC] p-6 shadow-inner">
          <div className="space-y-3">
            {source.pageContent?.map((block, index) =>
              block.highlight ? (
                <motion.p
                  key={index}
                  initial={{ backgroundColor: 'rgba(250, 204, 21, 0)' }}
                  animate={{ backgroundColor: 'rgba(250, 204, 21, 0.45)' }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="-mx-1.5 rounded px-1.5 py-1 text-sm font-medium leading-relaxed text-slate-900"
                >
                  {block.text}
                </motion.p>
              ) : block.heading ? (
                <p key={index} className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {block.text}
                </p>
              ) : (
                <p key={index} className="text-sm leading-relaxed text-slate-700">
                  {block.text}
                </p>
              ),
            )}
          </div>
          <p className="mt-6 border-t border-slate-200 pt-3 text-center font-data text-[10px] tabular-nums text-slate-400">
            {source.document} — page {source.page}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate-400">
        En production, ce volet ouvre le document réel à la bonne page depuis votre GED, SharePoint ou Drive, avec les
        droits d’accès de l’utilisateur connecté : personne ne voit un extrait d’un document qu’il n’a pas le droit de
        consulter.
      </p>
    </div>
  );
}

/** Indicateur de réflexion : les étapes du pipeline RAG défilent une à une. */
function ThinkingIndicator({ step }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-800/50">
        <Bot size={15} strokeWidth={1.75} className="text-blue-400" />
      </span>
      <div className="rounded-2xl rounded-tl-sm border border-slate-800/80 bg-slate-800/30 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-sm text-slate-300"
            >
              {RAG_THINKING_STEPS[step]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
