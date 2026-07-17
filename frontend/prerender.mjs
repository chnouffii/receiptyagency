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
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
      // Laisse à react-helmet + au contenu asynchrone le temps de se poser.
      await new Promise((r) => setTimeout(r, 600));
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
