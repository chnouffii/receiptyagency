import { motion } from 'framer-motion';
import { TAP } from './demoTokens';

/**
 * Navigation principale entre les 4 démonstrations.
 *
 * L'indicateur actif est un `layoutId` Framer Motion : il glisse d'un onglet à
 * l'autre sans provoquer de décalage de mise en page (les onglets gardent la
 * même taille dans tous les états).
 */
export function DemoTabsNav({ demos, active, onChange }) {
  return (
    <nav aria-label="Démonstrations" className="border-b border-slate-800/80 bg-[#0B0F17]">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <ul role="tablist" className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
          {demos.map((demo, index) => {
            const isActive = demo.id === active;
            return (
              <li key={demo.id} className="shrink-0">
                <motion.button
                  whileTap={TAP}
                  type="button"
                  role="tab"
                  id={`demo-tab-${demo.id}`}
                  aria-selected={isActive}
                  aria-controls={`demo-panel-${demo.id}`}
                  onClick={() => onChange(demo.id)}
                  data-testid={`demos-tab-${demo.id}`}
                  className={`relative flex items-center gap-2.5 whitespace-nowrap px-4 py-3.5 text-sm font-medium
                    transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-inset focus-visible:ring-blue-500/60
                    ${isActive ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold tabular-nums
                      transition-colors duration-200
                      ${isActive
                        ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                        : 'border-slate-800/80 bg-slate-800/40 text-slate-400'}`}
                  >
                    {index + 1}
                  </span>
                  <demo.icon size={16} strokeWidth={1.75} className={isActive ? 'text-blue-400' : ''} />
                  <span className="hidden sm:inline">{demo.title}</span>
                  <span className="sm:hidden">{demo.shortTitle}</span>

                  {isActive && (
                    <motion.span
                      layoutId="demo-tab-underline"
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
