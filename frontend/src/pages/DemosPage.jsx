import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Bot, FileSignature, Radar, ScanLine } from 'lucide-react';
import SEOHead from '../components/SEOHead';
// Styles propres à l'espace démo (police de données, scrollbars) — confinés
// sous `.demo-root`, aucun impact sur le design system du site.
import '../components/demos/demos.css';
import { DemosHeader } from '../components/demos/DemosHeader';
import { DemoTabsNav } from '../components/demos/DemoTabsNav';
import { PasswordGate, clearStoredAccess, readStoredAccess } from '../components/demos/PasswordGate';
import { OcrInvoiceDemo } from '../components/demos/OcrInvoiceDemo';
import { RagAssistantDemo } from '../components/demos/RagAssistantDemo';
import { ProposalGeneratorDemo } from '../components/demos/ProposalGeneratorDemo';
import { ProspectScoringDemo } from '../components/demos/ProspectScoringDemo';
import { panelSwap } from '../components/demos/demoTokens';

/**
 * Espace démo prospect — /demos
 *
 * Quatre démonstrations interactives, protégées par un code d'accès et
 * présentées dans un dark mode B2B autonome (l'espace ne suit pas le thème
 * clair du site public : c'est une salle de démonstration, pas une page
 * marketing).
 */

const DEMOS = [
  {
    id: 'ocr',
    title: 'Extraction de factures',
    shortTitle: 'Factures',
    icon: ScanLine,
    Component: OcrInvoiceDemo,
  },
  {
    id: 'rag',
    title: 'Assistant interne',
    shortTitle: 'Assistant',
    icon: Bot,
    Component: RagAssistantDemo,
  },
  {
    id: 'proposal',
    title: 'Propositions commerciales',
    shortTitle: 'Propositions',
    icon: FileSignature,
    Component: ProposalGeneratorDemo,
  },
  {
    id: 'prospect',
    title: 'Scoring de prospect',
    shortTitle: 'Scoring',
    icon: Radar,
    Component: ProspectScoringDemo,
  },
];

export default function DemosPage() {
  // `null` = accès pas encore déterminé : évite de faire clignoter la porte
  // d'entrée pour un visiteur déjà authentifié sur cet appareil.
  const [hasAccess, setHasAccess] = useState(null);
  const [activeDemo, setActiveDemo] = useState(DEMOS[0].id);

  useEffect(() => {
    setHasAccess(readStoredAccess());
  }, []);

  // Le site force la classe `dark` sur <html> : l'espace démo impose en plus
  // son propre fond, pour rester lisible même si le visiteur a choisi le
  // thème clair sur le site public.
  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0B0F17';
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  const handleExit = () => {
    clearStoredAccess();
    setHasAccess(false);
    setActiveDemo(DEMOS[0].id);
    toast.success('Vous avez quitté l’espace démo', {
      description: 'Saisissez de nouveau votre code d’accès pour y revenir.',
    });
  };

  if (hasAccess === null) {
    return <div className="min-h-screen bg-[#0B0F17]" />;
  }

  if (!hasAccess) {
    return (
      <>
        <SEOHead
          page="demos"
          customTitle="Espace Démos — Accès privé | Receipty"
          customDescription="Espace de démonstration privé réservé aux prospects Receipty."
          canonicalPath="/demos"
          noIndex
        />
        <div className="demo-root">
          <PasswordGate onUnlock={() => setHasAccess(true)} />
        </div>
      </>
    );
  }

  const active = DEMOS.find((demo) => demo.id === activeDemo) ?? DEMOS[0];
  const ActiveDemo = active.Component;

  return (
    <>
      <SEOHead
        page="demos"
        customTitle="Espace Démos — Receipty"
        customDescription="Quatre démonstrations interactives des automatisations Receipty."
        canonicalPath="/demos"
        noIndex
      />

      <div className="demo-root min-h-screen bg-[#0B0F17] text-slate-100">
        <DemosHeader onExit={handleExit} />
        <DemoTabsNav demos={DEMOS} active={activeDemo} onChange={setActiveDemo} />

        <main className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              id={`demo-panel-${active.id}`}
              role="tabpanel"
              aria-labelledby={`demo-tab-${active.id}`}
              variants={panelSwap}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ActiveDemo />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-slate-800/80 px-5 py-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Démonstrations réalisées sur des données fictives. Les traitements sont simulés côté navigateur.
            </p>
            <a
              href="mailto:contact@receipty.fr"
              className="text-xs text-blue-400 underline-offset-2 transition-colors duration-200 hover:text-blue-300 hover:underline"
            >
              Une question ? contact@receipty.fr
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
