/**
 * Verifica contra `dist/` que las rutas del mapa del sitio (SPEC §5) existen en
 * los dos idiomas. Es el criterio de terminado de la fase 1a, comprobado en local
 * antes de desplegar: si una ruta no salió del build, no puede responder 200.
 *
 * Comprueba también los invariantes que sí se pueden ver en el HTML generado:
 * canonical presente, `hreflang` solo hacia páginas que existen, y un solo `h1`.
 */
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

const routes = [
  '/es/',
  '/es/sobre-mi/',
  '/es/proyectos/',
  '/es/proyectos/proyecto-de-ejemplo/',
  '/es/blog/',
  '/es/blog/post-de-ejemplo/',
  '/es/blog/post-solo-en-espanol/',
  '/es/blog/tema/tema-de-ejemplo/',
  '/es/cv/',
  '/es/contacto/',
  '/es/privacidad/',
  '/en/',
  '/en/about/',
  '/en/projects/',
  '/en/projects/sample-project/',
  '/en/blog/',
  '/en/blog/sample-post/',
  '/en/blog/topic/sample-topic/',
  '/en/cv/',
  '/en/contact/',
  '/en/privacy/',
];

const extraFiles = ['/404.html', '/robots.txt', '/_redirects', '/sitemap-index.xml'];

const failures = [];
const fail = (route, message) => failures.push(`${route}: ${message}`);

/** Rutas que el build sí produjo, para validar `hreflang` contra la realidad. */
const built = new Set();
const pages = new Map();

for (const route of routes) {
  const file = path.join(dist, route.slice(1), 'index.html');
  try {
    await stat(file);
  } catch {
    fail(route, 'no existe en dist/');
    continue;
  }
  built.add(route);
  pages.set(route, await readFile(file, 'utf8'));
}

for (const [route, html] of pages) {
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(route, `se esperaba 1 <h1>, hay ${h1s.length}`);

  if (!html.includes('rel="canonical"')) fail(route, 'sin canonical');

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch || !titleMatch[1].includes('Santiago Gelvez')) {
    fail(route, 'el <title> no sigue el patrón `Título — Santiago Gelvez`');
  }

  const description = html.match(/<meta name="description" content="([^"]*)"/);
  if (!description) fail(route, 'sin meta description');
  else if (description[1].length < 120 || description[1].length > 170) {
    fail(route, `meta description de ${description[1].length} caracteres, fuera de 120-170`);
  }

  // `hreflang` solo entre pares que existen de verdad (SPEC §8).
  for (const [, href] of html.matchAll(/<link rel="alternate" hreflang="(?:es|en)" href="([^"]*)"/g)) {
    const target = new URL(href).pathname;
    if (!built.has(target)) fail(route, `hreflang apunta a ${target}, que no existe`);
  }

  // Nada desde el CDN de Google: transmite la IP de cada visitante (SPEC §10 y §11).
  if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) {
    fail(route, 'carga fuentes desde el CDN de Google');
  }
}

for (const file of extraFiles) {
  try {
    await stat(path.join(dist, file.slice(1)));
  } catch {
    failures.push(`${file}: no existe en dist/`);
  }
}

// La pieza sin traducción no puede generar una página fantasma en el otro idioma.
try {
  await stat(path.join(dist, 'en/blog/post-solo-en-espanol/index.html'));
  failures.push('/en/blog/post-solo-en-espanol/: se generó una página que no debería existir');
} catch {
  /* correcto: no existe */
}

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} problema(s):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`✓ ${routes.length} rutas construidas y verificadas, más ${extraFiles.length} archivos de soporte`);
