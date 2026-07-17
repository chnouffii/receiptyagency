/**
 * Prérendu statique des pages vitrines (SEO / GEO).
 *
 * Après `npm run build`, ce script lance un Chromium headless, visite chaque
 * route, et écrit le HTML rendu (contenu + balises meta injectées par
 * react-helmet + JSON-LD) dans build/<route>/index.html.
 *
 * nginx (try_files $uri $uri/ /index.html) sert alors ce HTML complet aux
 * robots (Google, GPTBot, PerplexityBot…) qui n'exécutent pas le JavaScript.
 *
 * Conçu pour être NON-FATAL : appelé avec `|| echo ...` dans le Dockerfile,
 * un échec ici n'empêche jamais la livraison du build SPA standard.
 */
import { createServer } from 'http';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sirv from 'sirv';
import puppeteer from 'puppeteer-core';

const BUILD_DIR = join(process.cwd(), 'build');
const PORT = 45678;
const CHROMIUM = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

// Routes vitrines statiques (les routes dynamiques /cases/:id sont ignorées).
const ROUTES = ['/', '/adn', '/solutions', '/cases', '/contact', '/roi', '/quote', '/faq', '/privacy', '/terms'];

// Domaines tiers à bloquer pendant le rendu : ils gardent des connexions
// ouvertes (analytics, replay) et n'apportent rien au HTML pré-rendu.
const BLOCKED = ['posthog.com', 'i.posthog.com', 'assets.emergent.sh', 'google-analytics.com'];

async function main() {
  // Serveur statique local avec fallback SPA (single:true → index.html).
  const assets = sirv(BUILD_DIR, { single: true, dev: false });
  const server = createServer((req, res) =>
    assets(req, res, () => { res.statusCode = 404; res.end('not found'); })
  );
  await new Promise((resolve) => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let ok = 0;
  for (const route of ROUTES) {
    const page = await browser.newPage();
    try {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (BLOCKED.some((d) => req.url().includes(d))) req.abort().catch(() => {});
        else req.continue().catch(() => {});
      });

      // On n'attend PAS le silence réseau (analytics/chat gardent des sockets
      // ouverts) : on attend que React ait injecté du contenu dans #root.
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page
        .waitForFunction(() => {
          const r = document.getElementById('root');
          return r && r.children.length > 0;
        }, { timeout: 15000 })
        .catch(() => {});
      // Laisse react-helmet + le contenu asynchrone (API) se poser.
      await new Promise((r) => setTimeout(r, 1500));

      // Déduplique le <title> (helmet laisse parfois l'original d'index.html).
      await page.evaluate(() => {
        const titles = document.head.querySelectorAll('title');
        titles.forEach((t, i) => { if (i > 0) t.remove(); });
      });

      const html = '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML));
      const outDir = route === '/' ? BUILD_DIR : join(BUILD_DIR, route);
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, 'index.html'), html, 'utf8');
      ok += 1;
      console.log(`✓ prérendu ${route}`);
    } catch (e) {
      console.warn(`⚠ prérendu échoué pour ${route}: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log(`Prérendu terminé : ${ok}/${ROUTES.length} pages.`);
}

main().catch((e) => {
  console.warn(`⚠ Prérendu ignoré (${e.message}) — le build SPA reste valide.`);
  process.exit(0); // non-fatal
});
