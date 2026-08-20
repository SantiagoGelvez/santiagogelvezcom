/**
 * Prueba de compatibilidad ATS del PDF: **un script, no una revisión a ojo**
 * (SPEC §7, ADR-0007).
 *
 * Extrae el texto real del PDF y comprueba las reglas que un parser necesita:
 * que el texto sea texto y no una imagen, que los encabezados de sección sean
 * los estándar, que el orden de lectura sea el del documento —que es como se
 * detecta una maquetación en dos columnas— y, lo más importante, que **el
 * teléfono no aparezca en ninguna variante pública**.
 *
 *     node scripts/check-cv-pdf.mjs           → los PDF de dist/cv/
 *     node scripts/check-cv-pdf.mjs --full    → además los de cv-out/
 *
 * La extracción va con `pdfjs-dist` y no con `pdftotext` a propósito: `pdftotext`
 * exige poppler instalado en el sistema, así que la prueba pasaría o no según la
 * máquina. Un criterio de terminado que depende de un `apt install` no es un
 * criterio de terminado.
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import yaml from 'js-yaml';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const root = new URL('../', import.meta.url);
const distCv = fileURLToPath(new URL('dist/cv/', root));
const profileFile = fileURLToPath(new URL('src/content/data/perfil.yml', root));
const fullOut = fileURLToPath(new URL('cv-out/', root));
const privateFile = fileURLToPath(new URL('src/content/data/perfil.private.yml', root));

const alsoFull = process.argv.includes('--full');

const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

/* --------------------------------------------------------- lo que se espera
 *
 * Espejo deliberado de `src/i18n/ui.ts`, igual que en `verify-routes.mjs`: si
 * este script importara el módulo, comprobaría el PDF contra la misma fuente
 * que lo generó y no verificaría nada. Duplicar es lo que hace que renombrar un
 * encabezado a algo que el ATS no entiende se vea aquí.
 */
const HEADINGS = {
  es: ['Perfil', 'Experiencia', 'Proyectos', 'Habilidades', 'Certificaciones', 'Educación'],
  en: ['Summary', 'Experience', 'Projects', 'Skills', 'Certifications', 'Education'],
};

/** Debe aparecer literalmente: es el string que el reclutador busca (SPEC §7). */
const HEADLINE = { es: 'Ingeniero de Datos', en: 'Data Engineer' };

const NAME = 'Santiago Gelvez';

/** Un CV que pasa de dos páginas deja de leerse completo, lo lea quien lo lea. */
const MAX_PAGES = 2;

/**
 * Cualquier cosa con pinta de teléfono. Es una red de seguridad **además** de
 * comparar contra el archivo privado: atrapa un número que se haya colado en un
 * campo versionado, que es un caso que el archivo privado no puede ver.
 */
const PHONE_LIKE = /(?:\+\d[\d\s().-]{7,})|(?:\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b)/;

/* --------------------------------------------------------------- extracción */

async function extract(file) {
  const data = new Uint8Array(await readFile(file));
  const task = pdfjs.getDocument({ data, useSystemFonts: false });
  const doc = await task.promise;
  const pageCount = doc.numPages;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    // `items` viene en orden de lectura del documento. Reconstruir el texto de
    // ahí es exactamente lo que hace un parser de ATS, así que si el orden está
    // roto —dos columnas intercaladas, por ejemplo— se ve en esta cadena.
    pages.push(content.items.map((item) => (item.str ?? '') + (item.hasEOL ? '\n' : '')).join(''));
  }
  await task.destroy();
  return { text: pages.join('\n'), pageCount };
}

/* ------------------------------------------------------------------ correo */

/**
 * El alias, desde el YAML fuente. Se comprueba en los **dos** sentidos:
 * `verify-routes.mjs` exige que no esté en ningún HTML, y esta prueba exige que
 * sí esté en el PDF. Sin la segunda mitad, un fallo silencioso de la inyección
 * publicaría un CV al que nadie puede responder — que es peor que el spam que
 * ADR-0029 viene a evitar.
 */
async function contactEmail() {
  const records = yaml.load(await readFile(profileFile, 'utf8'));
  const profile = records.find((item) => item?.id === 'santiago');
  return profile?.correo ?? '';
}

/* ---------------------------------------------------------- campos privados */

async function privateValues() {
  try {
    await access(privateFile);
  } catch {
    return [];
  }
  const fields = yaml.load(await readFile(privateFile, 'utf8')) ?? {};
  return Object.values(fields).map(String).filter((value) => value.length > 0);
}

/* ------------------------------------------------------------------ pruebas */

function checkOne(name, text, pageCount, { locale, expectPrivate, secrets, email }) {
  // 1. Texto seleccionable real, nunca texto dentro de una imagen (SPEC §7).
  if (text.trim().length < 400) {
    fail(name, `solo se extrajeron ${text.trim().length} caracteres — ¿el texto quedó como imagen?`);
    return;
  }

  const flat = text.replace(/\s+/g, ' ');

  // 2. Identidad, titular y correo, literales. El correo entra por inyección
  //    (ADR-0029), así que su ausencia es la señal de que la inyección no corrió.
  if (!flat.includes(NAME)) fail(name, `no aparece el nombre "${NAME}"`);
  if (email !== '' && !flat.includes(email)) {
    fail(
      name,
      `no aparece el correo (${email}) — la inyección de \`data-cv-print\` no ocurrió, ` +
        'y un CV sin datos de contacto crea una ficha de ATS a la que nadie puede responder',
    );
  }
  if (!flat.includes(HEADLINE[locale])) {
    fail(name, `no aparece el titular "${HEADLINE[locale]}" — es el string que busca el reclutador (SPEC §7)`);
  }

  // 3. Encabezados de sección estándar.
  const positions = [];
  for (const heading of HEADINGS[locale]) {
    const at = flat.indexOf(heading);
    if (at === -1) fail(name, `falta el encabezado estándar "${heading}"`);
    else positions.push({ heading, at });
  }

  // 4. Orden de lectura. Si el parser lee las secciones en desorden, lo más
  //    probable es que el PDF tenga dos columnas y las esté intercalando — que
  //    es justo lo que SPEC §7 prohíbe.
  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i].at < positions[i - 1].at) {
      fail(
        name,
        `el orden de lectura está roto: "${positions[i].heading}" se extrae antes que ` +
          `"${positions[i - 1].heading}". Señal de maquetación en más de una columna.`,
      );
      break;
    }
  }

  // 5. Longitud.
  if (pageCount > MAX_PAGES) fail(name, `${pageCount} páginas, el máximo son ${MAX_PAGES}`);
  if (pageCount === 0) fail(name, 'el PDF no tiene páginas');

  // 6. El teléfono. La prueba que da sentido a todo el pipeline (ADR-0006).
  const leaked = secrets.filter((secret) => flat.includes(secret));
  if (expectPrivate) {
    if (secrets.length > 0 && leaked.length === 0) {
      fail(name, 'es la variante completa y **no** contiene los campos privados — la inyección no ocurrió');
    }
  } else {
    if (leaked.length > 0) fail(name, `⚠ FILTRACIÓN: contiene un campo no publicable (${leaked.length})`);
    const match = flat.match(PHONE_LIKE);
    if (match) fail(name, `⚠ contiene algo con forma de teléfono: "${match[0].trim()}"`);
  }
}

/* ---------------------------------------------------------------- recorrido */

async function pdfsIn(dir) {
  try {
    return (await readdir(dir)).filter((n) => n.endsWith('.pdf')).map((n) => path.join(dir, n));
  } catch {
    return [];
  }
}

const secrets = await privateValues();
const email = await contactEmail();
const publicPdfs = await pdfsIn(distCv);
const fullPdfs = alsoFull ? await pdfsIn(fullOut) : [];

if (publicPdfs.length === 0) {
  console.error('\n✗ No hay PDF en dist/cv/. Corre `npm run build`, que los genera.\n');
  process.exit(1);
}

console.log('\nPrueba ATS del PDF del CV\n');

for (const file of [...publicPdfs, ...fullPdfs]) {
  const name = path.relative(fileURLToPath(root), file);
  const isFull = /-(completo|full)\.pdf$/.test(path.basename(file));
  const locale = /-EN(-full)?\.pdf$/.test(path.basename(file)) ? 'en' : 'es';

  // Un PDF completo en `public/cv/` es la filtración que ADR-0006 hace
  // imposible por construcción; si aparece, el script lo dice antes que nada.
  if (isFull && file.startsWith(distCv)) {
    fail(name, '⚠ un PDF completo está en el directorio que se despliega');
  }

  const before = failures.length;
  const { text, pageCount } = await extract(file);
  checkOne(name, text, pageCount, { locale, expectPrivate: isFull, secrets, email });

  const status = failures.length === before ? '✓' : '✗';
  console.log(`  ${status} ${name}  ${pageCount} pág · ${text.replace(/\s+/g, ' ').trim().length} caracteres · ${locale}${isFull ? ' · completo' : ''}`);
}

if (secrets.length === 0) {
  console.log(
    '\n  · Sin `perfil.private.yml`: la comprobación de filtración corrió solo contra el patrón\n' +
      '    de teléfono, no contra valores reales. Es lo esperado en CI (ADR-0006).',
  );
}

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} problema(s):\n`);
  for (const line of failures) console.error(`  ${line}`);
  console.error();
  process.exit(1);
}

console.log('\n✓ Los PDF pasan la prueba ATS.\n');
