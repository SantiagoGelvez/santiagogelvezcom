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
import { execFileSync } from 'node:child_process';
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

async function readProfile() {
  const records = yaml.load(await readFile(path.join(content, 'data', 'perfil.yml'), 'utf8'));
  const profile = records.find((item) => item?.id === 'santiago');
  if (profile === undefined) throw new Error('Falta el registro `santiago` en perfil.yml');
  return profile;
}

const [allPosts, allProjects, profile] = await Promise.all([readPosts(), readProjects(), readProfile()]);

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

  // El visor de una figura empareja `popovertarget` con el `id` del popover
  // (ADR-0031). El `id` sale de un hash de la ruta de la imagen, así que la
  // **misma** imagen dos veces en una página produce dos `id` iguales y el botón
  // de la segunda abriría la primera. `Figure.astro` acepta una prop `id` para
  // resolverlo; esto es lo que hace que acordarse no sea necesario.
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicated = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicated.length > 0) {
    fail(value, `id duplicado(s) en el HTML: ${duplicated.join(', ')}`);
  }

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

  // El correo no se publica en HTML (ADR-0029). «Nunca en texto plano — se
  // cosecha en semanas» (SPEC §11) era una regla que solo vivía en un documento,
  // y por eso la página del CV la incumplió el primer día que se escribió. Aquí
  // deja de poder incumplirse en silencio: el alias entra al PDF por inyección,
  // así que ninguna ruta construida tiene por qué contenerlo.
  if (html.includes('mailto:')) {
    fail(value, 'contiene un enlace `mailto:` — el correo no se publica en HTML (ADR-0029)');
  }
  if (html.includes(profile.correo)) {
    fail(value, `contiene el correo en texto plano (${profile.correo}) — ADR-0029`);
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

/* ------------------------------------------------------------- PDF del CV
 *
 * `npm run build` genera los PDF en cada compilación y los deja en `dist/cv/`
 * (ADR-0030), así que **no puede haber un PDF más viejo que la data**: salen del
 * mismo build. Aquí no se comprueba frescura porque no hay nada que envejecer.
 *
 * Lo que sí se comprueba es que el pipeline haya corrido: el PDF que la página
 * **promete** tiene que existir. Un enlace de descarga hacia un archivo que nadie
 * generó es un 404 en la ruta que más le importa a un reclutador, y es el modo
 * de fallo real ahora que el archivo no viaja en el repositorio.
 */

const cvLinks = [];
let printTargets = 0;
for (const [value, html] of pages) {
  // `data-cv-pdf` marca una página **que se imprime**; el script del pipeline la
  // descubre por ahí. Que exista al menos una es parte del criterio.
  for (const anchorTag of html.matchAll(/<a[^>]*\sdata-cv-pdf="([^"]+)"[^>]*>/g)) {
    if (!/\shref="/.test(anchorTag[0])) fail(value, 'declara `data-cv-pdf` sin `href`');
    else printTargets += 1;
  }
  // Y aparte, **cualquier** enlace hacia un PDF del CV tiene que resolver — la
  // página de contacto también enlaza uno, y sin esto nadie lo comprobaría.
  for (const href of html.matchAll(/href="(\/cv\/[^"]+\.pdf)"/g)) {
    cvLinks.push({ route: value, href: href[1] });
  }
}

if (printTargets === 0) {
  failures.push('/cv/: ninguna página construida declara `data-cv-pdf`');
}
if (cvLinks.length === 0) {
  failures.push('/cv/: ninguna página construida enlaza un PDF del CV');
}

for (const link of cvLinks) {
  try {
    const info = await stat(path.join(dist, link.href.slice(1)));
    if (info.size < 10_000) {
      fail(link.route, `el PDF ${link.href} pesa ${info.size} bytes — no puede ser un CV`);
    }
  } catch {
    fail(link.route, `enlaza ${link.href}, que no existe en dist/. El pipeline del PDF no corrió.`);
  }
}

// Un árbol sucio ya no puede desfasar el PDF —se genera del working tree— pero
// sí desfasa **la fecha que el CV muestra**: "Data actualizada" sale del último
// commit que tocó la data (SPEC §7), así que con cambios sin commitear el
// documento se anuncia más viejo de lo que es. No es un error, es un aviso.
let dirty = '';
try {
  dirty = execFileSync('git', ['status', '--porcelain', '--', 'src/content/data'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  dirty = '';
}
if (dirty !== '') {
  console.warn(
    '⚠ Hay cambios sin commitear en `src/content/data/`. El PDF sí los lleva —se genera en cada build—\n' +
      '  pero la fecha "Data actualizada" sale del último commit, así que va a quedarse atrás.',
  );
}

/* ------------------------------------------------------------------- media
 *
 * Dos presupuestos que protegen cosas distintas, y por eso son dos.
 *
 * **El de la fuente protege la historia de git**, que es la mitad irreversible:
 * el repositorio es público (ADR-0009) y un PNG de tres megas queda ahí para
 * siempre aunque se borre en el commit siguiente. **El de la salida protege al
 * visitante**, que es la mitad que se puede arreglar recomprimiendo.
 *
 * No se separan las renditions en línea de las del visor. Se podría —la del
 * visor es la que cuelga del `[popover]`— pero exigiría emparejar URLs contra el
 * HTML de cada página, y un presupuesto frágil que hay que arreglar cada vez que
 * cambia el marcado se acaba desactivando. Un tope por archivo y un tope al
 * total cubren el modo de fallo real: una imagen sin comprimir que nadie miró.
 */

const IMAGE_EXTENSIONS = new Set(['.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg']);
const MAX_SOURCE_BYTES = 400_000;
const MAX_EMITTED_BYTES = 500_000;
const MAX_EMITTED_TOTAL_BYTES = 2_500_000;

const assets = fileURLToPath(new URL('src/assets/', root));

async function walkImages(dir, prefix) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // Todavía no hay imágenes en el proyecto. No es un fallo: es el estado
    // inicial, y un criterio de terminado que exige contenido no es un criterio.
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const shown = `${prefix}${entry.name}`;
    if (entry.isDirectory()) found.push(...(await walkImages(full, `${shown}/`)));
    else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) found.push({ full, shown });
  }
  return found;
}

/**
 * Metadatos incrustados en el archivo fuente. Sharp los elimina al reprocesar,
 * así que **lo que se despliega sale limpio pase lo que pase**; lo que hay que
 * vigilar es lo que entra al repositorio, porque ahí no hay segunda pasada.
 *
 * Una foto de teléfono lleva GPS, modelo y a veces el nombre del propietario en
 * el EXIF, y una captura editada arrastra el XMP del editor con la ruta local
 * —que suele incluir el nombre de usuario—. Nada de eso se ve abriendo la
 * imagen, y todo eso es exactamente lo que SPEC §11 prohíbe publicar.
 */
const METADATA_MARKERS = [
  { needle: Buffer.from('Exif\0\0', 'binary'), label: 'EXIF' },
  { needle: Buffer.from('eXIf', 'binary'), label: 'EXIF (chunk PNG)' },
  { needle: Buffer.from('http://ns.adobe.com/xap/1.0/', 'binary'), label: 'XMP' },
];

const sourceImages = await walkImages(assets, 'src/assets/');
for (const image of sourceImages) {
  const bytes = await readFile(image.full);
  if (bytes.byteLength > MAX_SOURCE_BYTES) {
    failures.push(
      `${image.shown}: pesa ${Math.round(bytes.byteLength / 1000)} kB y el tope de una fuente es ` +
        `${MAX_SOURCE_BYTES / 1000} kB. El repositorio es público: lo que entra no se puede sacar.`,
    );
  }
  for (const marker of METADATA_MARKERS) {
    if (bytes.includes(marker.needle)) {
      failures.push(
        `${image.shown}: lleva ${marker.label} incrustado. Puede contener GPS, dispositivo o nombre de ` +
          'usuario, y en un repositorio público eso no se corrige borrando (SPEC §11).',
      );
    }
  }
}

const emittedImages = await walkImages(dist, '/');
let emittedTotal = 0;
for (const image of emittedImages) {
  const info = await stat(image.full);
  image.size = info.size;
  emittedTotal += info.size;
  if (info.size > MAX_EMITTED_BYTES) {
    failures.push(
      `${image.shown}: pesa ${Math.round(info.size / 1000)} kB y el tope de una imagen servida es ` +
        `${MAX_EMITTED_BYTES / 1000} kB.`,
    );
  }
}
/**
 * Astro emite **también la fuente sin optimizar**: importar una imagen en un MDX
 * es un import de módulo, y Vite copia el archivo a `dist/_astro/` para que
 * `ImageMetadata.src` resuelva. Ninguna página la enlaza —todas usan las
 * renditions— así que es peso desplegado que nadie descarga.
 *
 * Es un **aviso y no un fallo**: no se puede evitar sin salirse del pipeline de
 * assets de Astro, y romper el build por algo que no se puede arreglar convierte
 * el criterio de terminado en ruido. Lo que sí hace falta es que el número se
 * vea, porque escala con cada imagen que entre y no aparece en ningún sitio más.
 */
const referenced = new Set();
for (const [, html] of pages) {
  for (const match of html.matchAll(/(?:src|href)="(\/_astro\/[^"]+)"/g)) referenced.add(match[1]);
  for (const match of html.matchAll(/srcset="([^"]*)"/g)) {
    for (const candidate of match[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith('/_astro/')) referenced.add(url);
    }
  }
}

const orphans = emittedImages.filter((image) => !referenced.has(image.shown));
if (orphans.length > 0) {
  const bytes = orphans.reduce((total, image) => total + image.size, 0);
  console.warn(
    `⚠ ${orphans.length} imagen(es) en dist/ que ningún HTML enlaza, ${Math.round(bytes / 1000)} kB en total.\n` +
      '  Son las fuentes sin optimizar que Vite copia al importarlas. Cuentan para el presupuesto\n' +
      '  porque se despliegan, aunque ningún visitante las pida.',
  );
}

if (emittedTotal > MAX_EMITTED_TOTAL_BYTES) {
  failures.push(
    `dist/: las imágenes suman ${Math.round(emittedTotal / 1000)} kB y el tope es ` +
      `${MAX_EMITTED_TOTAL_BYTES / 1000} kB. Es la deriva la que se vigila aquí, no una imagen concreta.`,
  );
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
    `más ${extraFiles.length} archivos de soporte, ${cvLinks.length} PDF del CV ` +
    `y ${sourceImages.length} imagen(es) fuente → ${emittedImages.length} servidas (${Math.round(emittedTotal / 1000)} kB)`,
);
