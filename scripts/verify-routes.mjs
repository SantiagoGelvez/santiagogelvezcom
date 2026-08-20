/**
 * Criterio de terminado, ejecutable: compara lo que el **contenido fuente** dice
 * que debe existir contra lo que el build realmente produjo en `dist/`.
 *
 * Las rutas de contenido (posts y proyectos) se derivan de `src/content/`, así
 * que agregar una pieza no obliga a tocar este archivo. Lo que sí está escrito a
 * mano es el mapa de secciones y la taxonomía: son un **espejo deliberado** de
 * `src/i18n/routes.ts` y `src/i18n/taxonomy.ts`. Si el script importara esos
 * módulos, comprobaría el build contra sí mismo; duplicarlos es lo que hace que
 * un cambio accidental en un segmento de ruta se vea aquí.
 *
 * Comprueba además los invariantes que se pueden leer en el HTML generado:
 * canonical, un solo `h1`, el patrón del `<title>`, el largo de las
 * `meta description`, `hreflang` solo hacia páginas que existen, la regla de
 * indexación de ADR-0012 y que no haya fuentes del CDN de Google.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';

const root = new URL('../', import.meta.url);
const dist = fileURLToPath(new URL('dist/', root));
const content = fileURLToPath(new URL('src/content/', root));

const locales = ['es', 'en'];

/** Espejo de `src/i18n/routes.ts`. */
const sections = {
  home: { es: '', en: '' },
  about: { es: 'sobre-mi', en: 'about' },
  projects: { es: 'proyectos', en: 'projects' },
  blog: { es: 'blog', en: 'blog' },
  topic: { es: 'blog/tema', en: 'blog/topic' },
  cv: { es: 'cv', en: 'cv' },
  contact: { es: 'contacto', en: 'contact' },
  privacy: { es: 'privacidad', en: 'privacy' },
};

/** Espejo de `src/i18n/taxonomy.ts`. Tres categorías, fijas (SPEC §9). */
const categories = {
  fundamentos: { es: 'fundamentos', en: 'fundamentals' },
  decisiones: { es: 'decisiones', en: 'decisions' },
  bitacora: { es: 'bitacora', en: 'logbook' },
};

/** Umbral de ADR-0012. */
const MIN_POSTS_TO_INDEX = 3;

/** Secciones con página propia; `topic` solo existe a través de sus categorías. */
const staticSections = ['home', 'about', 'projects', 'blog', 'cv', 'contact', 'privacy'];

const extraFiles = ['/404.html', '/robots.txt', '/_redirects', '/sitemap-index.xml'];

const failures = [];
const fail = (route, message) => failures.push(`${route}: ${message}`);

const route = (locale, segment, slug) =>
  `/${[locale, segment, slug].filter((part) => typeof part === 'string' && part.length > 0).join('/')}/`;

/* ------------------------------------------------- leer el contenido fuente */

function frontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${file}: sin frontmatter`);
  return yaml.load(match[1]) ?? {};
}

async function readPosts() {
  const posts = [];
  for (const locale of locales) {
    const dir = path.join(content, 'posts', locale);
    let names;
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of names.filter((n) => n.endsWith('.mdx'))) {
      const file = path.join(dir, name);
      const data = frontmatter(await readFile(file, 'utf8'), file);
      posts.push({ locale, slug: name.replace(/\.mdx$/, ''), data });
    }
  }
  return posts;
}

async function readProjects() {
  const dir = path.join(content, 'projects');
  const names = (await readdir(dir)).filter((n) => n.endsWith('.yml'));
  return Promise.all(
    names.map(async (name) => ({
      id: name.replace(/\.yml$/, ''),
      data: yaml.load(await readFile(path.join(dir, name), 'utf8')),
    })),
  );
}

const [allPosts, allProjects] = await Promise.all([readPosts(), readProjects()]);

const published = allPosts.filter((post) => post.data.estado === 'publicado');
const drafts = allPosts.filter((post) => post.data.estado !== 'publicado');
const siteProjects = allProjects.filter((project) => (project.data.visible_en ?? []).includes('sitio'));

/* ------------------------------------------- construir las rutas esperadas */

/** Ruta esperada → por qué se espera, para que el fallo diga de dónde salió. */
const expected = new Map();
const expect = (value, origin) => expected.set(value, origin);

for (const locale of locales) {
  for (const key of staticSections) expect(route(locale, sections[key][locale]), `sección ${key}`);
  for (const [key, slugs] of Object.entries(categories)) {
    expect(route(locale, sections.topic[locale], slugs[locale]), `categoría ${key}`);
  }
}

for (const post of published) {
  expect(route(post.locale, sections.blog[post.locale], post.slug), `post ${post.locale}/${post.slug}`);
}

for (const project of siteProjects) {
  for (const locale of locales) {
    expect(route(locale, sections.projects[locale], project.data.slug[locale]), `proyecto ${project.id}`);
  }
}

/* ------------------------------------------------- lo que el build produjo */

async function builtRoutes(dir = dist, prefix = '/') {
  const found = new Set();
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isDirectory()) {
      for (const nested of await builtRoutes(path.join(dir, item.name), `${prefix}${item.name}/`)) {
        found.add(nested);
      }
    } else if (item.name === 'index.html') {
      found.add(prefix);
    }
  }
  return found;
}

const built = await builtRoutes();

for (const [value, origin] of expected) {
  if (!built.has(value)) fail(value, `no existe en dist/ (esperada por: ${origin})`);
}

// Una ruta de más es tan grave como una de menos: es contenido que se publicó
// sin querer. Es lo que atrapa a un borrador que se coló.
for (const value of built) {
  if (!expected.has(value)) fail(value, 'existe en dist/ pero el contenido fuente no la pide');
}

// Y el caso concreto, con un mensaje que dice qué pasó.
for (const draft of drafts) {
  const value = route(draft.locale, sections.blog[draft.locale], draft.slug);
  if (built.has(value)) fail(value, `el post está en estado "${draft.data.estado}" y no debería generar página`);
}

/* -------------------------------------------- invariantes del HTML generado */

const pages = new Map();
for (const value of built) {
  pages.set(value, await readFile(path.join(dist, value.slice(1), 'index.html'), 'utf8'));
}

for (const [value, html] of pages) {
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(value, `se esperaba 1 <h1>, hay ${h1s.length}`);

  if (!html.includes('rel="canonical"')) fail(value, 'sin canonical');

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch || !titleMatch[1].includes('Santiago Gelvez')) {
    fail(value, 'el <title> no sigue el patrón `Título — Santiago Gelvez`');
  }

  const description = html.match(/<meta name="description" content="([^"]*)"/);
  if (!description) fail(value, 'sin meta description');
  else if (description[1].length < 120 || description[1].length > 170) {
    fail(value, `meta description de ${description[1].length} caracteres, fuera de 120-170`);
  }

  // `hreflang` solo entre pares que existen de verdad (SPEC §8).
  for (const [, href] of html.matchAll(/<link rel="alternate" hreflang="(?:es|en)" href="([^"]*)"/g)) {
    const target = new URL(href).pathname;
    if (!built.has(target)) fail(value, `hreflang apunta a ${target}, que no existe`);
  }

  // Nada desde el CDN de Google: transmite la IP de cada visitante (SPEC §10 y §11).
  if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) {
    fail(value, 'carga fuentes desde el CDN de Google');
  }
}

/* ------------------------------------------------- ADR-0012: umbral de index */

for (const locale of locales) {
  for (const [key, slugs] of Object.entries(categories)) {
    const count = published.filter((post) => post.locale === locale && post.data.categoria === key).length;
    const value = route(locale, sections.topic[locale], slugs[locale]);
    const html = pages.get(value);
    if (html === undefined) continue;

    const hasNoindex = /<meta name="robots" content="noindex/.test(html);
    const shouldIndex = count >= MIN_POSTS_TO_INDEX;
    if (shouldIndex && hasNoindex) {
      fail(value, `tiene ${count} posts (>= ${MIN_POSTS_TO_INDEX}) y aun así emite noindex (ADR-0012)`);
    }
    if (!shouldIndex && !hasNoindex) {
      fail(value, `tiene ${count} posts (< ${MIN_POSTS_TO_INDEX}) y no emite noindex (ADR-0012)`);
    }
  }
}

/* ------------------------------- piezas sin traducción: nada de páginas fantasma */

// El caso crítico de SPEC §8, derivado del contenido y no escrito a mano: una
// pieza que solo existe en un idioma no puede haber generado página en el otro.
const keysByLocale = new Map(locales.map((locale) => [locale, new Set()]));
for (const post of published) keysByLocale.get(post.locale).add(post.data.clave_traduccion);

for (const post of published) {
  for (const other of locales.filter((locale) => locale !== post.locale)) {
    if (keysByLocale.get(other).has(post.data.clave_traduccion)) continue;
    const ghost = route(other, sections.blog[other], post.slug);
    if (built.has(ghost)) {
      fail(ghost, `la pieza "${post.data.clave_traduccion}" no está traducida y generó página en ${other}`);
    }
  }
}

/* ----------------------------------------------------- archivos de soporte */

for (const file of extraFiles) {
  try {
    await stat(path.join(dist, file.slice(1)));
  } catch {
    failures.push(`${file}: no existe en dist/`);
  }
}

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} problema(s):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `✓ ${expected.size} rutas derivadas del contenido y verificadas ` +
    `(${published.length} posts, ${siteProjects.length} proyectos, ${drafts.length} borrador(es) excluido(s)), ` +
    `más ${extraFiles.length} archivos de soporte`,
);
