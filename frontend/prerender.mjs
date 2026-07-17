/**
 * Prérendu statique des pages vitrines (SEO / GEO).
 *
 * Après `npm run build`, ce script lance un Chromium headless, visite chaque
 * route servie depuis une COQUILLE SPA VIERGE (l'index.html d'origine, lu une
 * seule fois en mémoire), et écrit le HTML rendu (contenu + balises meta
 * react-helmet + JSON-LD) dans build/<route>/index.html.
 *
 * La coquille vierge est essentielle : sinon, dès qu'on écrit build/index.html
 * (accueil), il servirait de shell aux pages suivantes et toutes captureraient
 * le contenu de l'accueil.
 *
 * nginx (try_files $uri $uri/ /index.html) sert ce HTML complet aux robots
 * (Google, GPTBot, PerplexityBot…) qui n'exécutent pas le JavaScript.
 *
 * NON-FATAL : appelé avec `|| echo` dans le Dockerfile, un échec ici n'empêche
 * jamais la livraison du build SPA standard.
 */
import { createServer } from 'http';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { join, extname } from 'path';
import puppeteer from 'puppeteer-core';

const BUILD_DIR = join(process.cwd(), 'build');
const PORT = 45678;
const CHROMIUM = process.env.CHROMIUM_PATH || '/usr/bin/chromium';

const ROUTES = ['/', '/adn', '/solutions', '/cases', '/contact', '/roi', '/quote', '/faq', '/privacy', '/terms'];
const BLOCKED = ['posthog.com', 'i.posthog.com', 'assets.emergent.sh', 'google-analytics.com'];

const MIME = {
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml',
  '.map': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

async function main() {
  // Coquille SPA vierge, lue AVANT toute écriture de prérendu.
  const shell = await readFile(join(BUILD_DIR, 'index.html'), 'utf8');

  // Serveur : sert les vrais assets depuis le disque, la coquille vierge pour
  // toute route SPA (chemin sans extension).
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const ext = extname(urlPath);
    if (ext) {
      const filePath = join(BUILD_DIR, urlPath);
      if (existsSync(filePath)) {
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        createReadStream(filePath).pipe(res);
        return;
      }
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(shell);
  });
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

      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Attendre que React ait injecté du contenu dans #root.
      await page
        .waitForFunction(() => {
          const r = document.getElementById('root');
          return r && r.children.length > 0;
        }, { timeout: 15000 })
        .catch(() => {});
      // Laisser react-helmet + le contenu asynchrone (API) se poser.
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
