/**
 * Pipeline del PDF del CV: **imprime la propia ruta `/cv/`** con Chromium
 * (ADR-0007). No hay una segunda cadena de herramientas ni un segundo lugar
 * donde viva el CV — el documento es la página, y por eso no pueden divergir.
 *
 * Dos modos, y la diferencia entre ellos es toda la política de privacidad de
 * ADR-0006, ADR-0027 y ADR-0029:
 *
 *     node scripts/cv-pdf.mjs           → PDFs públicos  → dist/cv/  (se despliegan)
 *     node scripts/cv-pdf.mjs --full    → PDFs completos → cv-out/   (nunca salen de aquí)
 *
 * **Nada de lo que produce este script se versiona** (ADR-0030). Los públicos van
 * directo a `dist/`, que ya está en `.gitignore`, y `npm run build` los genera
 * en cada compilación. Antes vivían en `public/cv/` versionados, y eso hacía
 * posible desplegar un PDF viejo: bastaba cambiar la data y no acordarse de
 * correr el comando. Ya no hay comando que olvidar ni archivo que envejecer.
 *
 * **Los datos de contacto no están en el HTML que se despliega.** La página
 * lleva ranuras vacías y este script las rellena en el DOM un instante antes de
 * imprimir. Son dos niveles, con orígenes y alcances distintos:
 *
 * | Ranura             | Valor    | Origen                | Entra a          |
 * |--------------------|----------|-----------------------|------------------|
 * | `data-cv-print`    | correo   | `perfil.yml`          | los cuatro PDF   |
 * | `data-cv-private`  | teléfono | `perfil.private.yml`  | solo `--full`    |
 *
 * El correo es un valor **publicable** que simplemente no puede aparecer en
 * HTML, donde se cosecha en semanas (SPEC §11); por eso vive en un archivo
 * versionado. El teléfono no es publicable en absoluto, así que vive fuera del
 * repositorio: no existe en `src/`, ni en `dist/`, ni en la historia de git —
 * solo en la memoria del navegador mientras dura la impresión. En los dos casos
 * la regla no depende de disciplina, depende de que no haya de dónde filtrarla.
 *
 * Qué rutas se imprimen **no está escrito aquí**: se descubren en el HTML
 * construido, buscando el enlace de descarga que la propia página declara
 * (`data-cv-pdf`). Así el nombre del archivo lo decide `src/lib/cv.ts`, hay una
 * sola convención, y un enlace que apunte a un PDF que nadie genera se cae en
 * `verify-routes.mjs` en vez de llegar a producción como un 404.
 */
import { createServer } from 'node:http';
import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const dist = fileURLToPath(new URL('dist/', root));
const distCv = fileURLToPath(new URL('dist/cv/', root));
const fullOut = fileURLToPath(new URL('cv-out/', root));
const privateFile = fileURLToPath(new URL('src/content/data/perfil.private.yml', root));
const profileFile = fileURLToPath(new URL('src/content/data/perfil.yml', root));

const full = process.argv.includes('--full');

const die = (message) => {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
};

/* ------------------------------------------------- servir el build estático */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

/**
 * Se sirve `dist/` y no se abre con `file://` porque el sitio referencia sus
 * assets con rutas absolutas (`/fonts/…`, `/_astro/…`): bajo `file://` esas
 * rutas apuntan a la raíz del disco y el PDF saldría sin fuentes ni estilos —
 * el peor modo de fallo posible, porque el archivo se genera igual.
 */
function serve(dir) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let file = path.join(dir, decodeURIComponent(url.pathname));
      if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
      // Ni un pathspec traspasa el directorio servido.
      if (!path.resolve(file).startsWith(path.resolve(dir))) {
        res.writeHead(403).end();
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/* ------------------------------------ descubrir las salidas en el HTML build */

async function htmlFiles(dir, prefix = '/') {
  const found = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.isDirectory()) found.push(...(await htmlFiles(path.join(dir, item.name), `${prefix}${item.name}/`)));
    else if (item.name === 'index.html') found.push({ route: prefix, file: path.join(dir, item.name) });
  }
  return found;
}

async function discoverOutputs() {
  const outputs = [];
  for (const { route, file } of await htmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/<a[^>]*\sdata-cv-pdf="([^"]+)"[^>]*>/g)) {
      const href = match[0].match(/\shref="([^"]+)"/);
      if (!href) die(`La página ${route} declara \`data-cv-pdf\` sin \`href\`.`);
      const [variant, locale] = match[1].split(':');
      outputs.push({ route, variant, locale, href: href[1], name: path.basename(href[1]) });
    }
  }
  if (outputs.length === 0) {
    die('Ninguna página construida declara `data-cv-pdf`. ¿Corriste `astro build` antes?');
  }
  return outputs;
}

/* --------------------------------------- los campos que solo existen en papel */

/**
 * El correo, desde el `perfil.yml` versionado. Entra a los cuatro PDF.
 *
 * Sale de aquí y no de `src/lib/cv.ts` porque este script es Node plano y no
 * puede importar `astro:content`. Es el mismo espejo deliberado que documenta
 * `verify-routes.mjs`: leer el YAML fuente en vez de la capa que lo consume.
 */
async function readPaperFields() {
  const records = yaml.load(await readFile(profileFile, 'utf8'));
  const profile = Array.isArray(records) ? records.find((item) => item?.id === 'santiago') : undefined;
  if (profile === undefined) {
    die('Falta el registro con `id: santiago` en `src/content/data/perfil.yml`.');
  }
  if (typeof profile.correo !== 'string' || profile.correo.length === 0) {
    die('`perfil.yml` no tiene `correo`. Sin él, el PDF sale sin datos de contacto (SPEC §7).');
  }
  return { correo: profile.correo };
}

/**
 * El teléfono, desde el archivo ignorado por git. Solo en `--full`, solo en local.
 */
async function readPrivateFields() {
  let raw;
  try {
    raw = await readFile(privateFile, 'utf8');
  } catch {
    die(
      `Falta \`src/content/data/perfil.private.yml\`.\n` +
        `  Cópialo de \`perfil.private.example.yml\` y pon ahí los datos reales.\n` +
        `  Ese archivo está en .gitignore y nunca se versiona (ADR-0006).`,
    );
  }
  const fields = yaml.load(raw);
  if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) {
    die('`perfil.private.yml` debe ser un mapa de `clave: valor`.');
  }
  return fields;
}

/* -------------------------------------------------------------- imprimir */

async function main() {
  const outputs = await discoverOutputs();

  // Qué se inyecta en cada ranura. El atributo del DOM es la clave del mapa, así
  // que agregar un nivel nuevo es agregar una entrada, no un camino de código.
  const injections = [{ attribute: 'data-cv-print', fields: await readPaperFields() }];
  if (full) {
    injections.push({ attribute: 'data-cv-private', fields: await readPrivateFields() });
  }

  const { server, port } = await serve(dist);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const written = [];

  for (const output of outputs) {
    await page.goto(`http://127.0.0.1:${port}${output.route}`, { waitUntil: 'load' });
    // Las fuentes se declaran con `font-display: swap`: sin esperarlas, el PDF
    // puede salir con la fuente de respaldo y con otra paginación.
    await page.evaluate(() => document.fonts.ready);

    for (const { attribute, fields } of injections) {
      const missing = await page.evaluate(
        ({ attribute: attr, values }) => {
          const absent = [];
          for (const [key, value] of Object.entries(values)) {
            const slot = document.querySelector(`[${attr}="${key}"]`);
            if (slot === null) {
              absent.push(key);
              continue;
            }
            // El separador viaja con el valor: la ranura vacía no puede dejar un
            // punto medio suelto en la línea de contacto del PDF público.
            slot.textContent = ` \u00b7 ${String(value)}`;
            slot.removeAttribute('hidden');
          }
          return absent;
        },
        { attribute, values: fields },
      );

      if (missing.length > 0) {
        die(
          `Estas claves no tienen ranura \`${attribute}\` en ${output.route}: ${missing.join(', ')}.\n` +
            `  Agrega \`<span ${attribute}="<clave>" hidden></span>\` en \`CvDocument.astro\`,\n` +
            `  o quita la clave de su archivo. El dato no se imprimió.`,
        );
      }
    }

    const name = full
      ? output.name.replace(/\.pdf$/, `-${output.locale === 'es' ? 'completo' : 'full'}.pdf`)
      : output.name;
    const dir = full ? fullOut : distCv;
    const target = path.join(dir, name);

    await mkdir(dir, { recursive: true });
    const buffer = await page.pdf({
      // La hoja de impresión declara `@page { size: Letter; margin: … }`
      // (`cv.css`). `preferCSSPageSize` hace que gane el CSS: el tamaño del
      // papel es una decisión de diseño, no una bandera de este script.
      preferCSSPageSize: true,
      printBackground: false,
      // Nada crítico en encabezado ni pie: muchos parsers de ATS los descartan
      // (SPEC §7). Aquí directamente no existen.
      displayHeaderFooter: false,
      tagged: true,
    });
    await writeFile(target, buffer);
    written.push({ target, size: buffer.length, route: output.route });
  }

  await browser.close();
  server.close();

  const label = full ? 'completos (locales, no se despliegan)' : 'públicos (en dist/, no se versionan)';
  console.log(`\nPDF ${label}:`);
  for (const item of written) {
    console.log(`  ${item.route} → ${path.relative(fileURLToPath(root), item.target)}  (${(item.size / 1024).toFixed(0)} KB)`);
  }
  console.log();
}

// Un modo `--full` que dejara algo dentro de `dist/` sería exactamente el fallo
// que ADR-0006 quiere hacer imposible: `dist/` es lo que `wrangler deploy` sube.
// Se comprueba después de correr, sobre el disco, y no confiando en la lógica
// de arriba.
async function assertNoLeak() {
  if (!full) return;
  let names = [];
  try {
    names = await readdir(distCv);
  } catch {
    return;
  }
  const leaked = names.filter((name) => /-(completo|full)\.pdf$/.test(name));
  if (leaked.length > 0) {
    for (const name of leaked) await rm(path.join(distCv, name));
    die(`Un PDF completo apareció en ${distCv} y se borró: ${leaked.join(', ')}. Revisa el script antes de seguir.`);
  }
}

await main();
await assertNoLeak();
