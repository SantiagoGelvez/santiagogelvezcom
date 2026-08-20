import { execFileSync } from 'node:child_process';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '~/i18n/routes';
import { months, type CvSectionKey } from '~/i18n/ui';
import { profileData, projectRecords, type ProjectRecord } from '~/lib/content';

/**
 * El CV como **vista sobre la data**, no como documento (SPEC §6 y §7).
 *
 * Aquí vive el filtrado de los dos ejes que SPEC §6 insiste en no confundir:
 *
 * | Eje | Granularidad | Dónde se aplica |
 * |---|---|---|
 * | `visible_en[]` | registro | esta capa: `cvView()` |
 * | campo público | campo | ADR-0006: el campo no versionado no existe aquí |
 *
 * El segundo eje **no está implementado como un filtro** y es deliberado: un
 * filtro por campo se puede olvidar de aplicar. Los campos no publicables viven
 * fuera del repositorio, así que esta capa nunca los ve y no tiene nada que
 * omitir. El teléfono entra al PDF completo en el navegador, un instante antes
 * de imprimir (ADR-0027), y jamás pasa por este archivo.
 */

function fail(message: string): never {
  throw new Error(`[cv] ${message}`);
}

/* ---------------------------------------------------------------- variantes */

export type VariantId = CollectionEntry<'cvVariants'>['data']['id'];

let variantsCache: CollectionEntry<'cvVariants'>[] | undefined;

async function cvVariants(): Promise<CollectionEntry<'cvVariants'>[]> {
  variantsCache ??= await getCollection('cvVariants');
  return variantsCache;
}

export async function cvVariant(id: VariantId): Promise<CollectionEntry<'cvVariants'>['data']> {
  const found = (await cvVariants()).find((entry) => entry.data.id === id);
  if (found === undefined) fail(`No existe la variante "${id}" en \`variantes-cv.yml\`.`);
  return found.data;
}

/**
 * La variante que el sitio publica en `/es/cv/` y `/en/cv/`.
 *
 * El sitio es un portafolio de ingeniería de datos: la página navegable es la
 * variante de datos, y `cv-itsm` existe solo como salida en PDF a la medida de
 * una postulación concreta (ADR-0011).
 */
export const SITE_VARIANT: VariantId = 'cv-datos';

export interface CvOutput {
  variant: VariantId;
  locale: Locale;
}

/**
 * Las salidas que el pipeline genera, **derivadas de la data** y no escritas en
 * el script: el producto cartesiano de cada variante por sus idiomas. Registrar
 * una variante nueva en `variantes-cv.yml` basta para que se genere su PDF.
 */
export async function cvOutputs(): Promise<CvOutput[]> {
  const variants = await cvVariants();
  return variants.flatMap((entry) =>
    entry.data.idiomas.map((locale) => ({ variant: entry.data.id, locale })),
  );
}

/* -------------------------------------------------------------------- fechas */

/**
 * `AAAA-MM` legible. En un CV la precisión útil es el mes: el día exacto de
 * ingreso no le dice nada a nadie y añade ruido que el parser tiene que cruzar.
 */
export function monthYear(iso: string, locale: Locale): string {
  const [year, month] = iso.split('-');
  const name = months[locale][Number(month) - 1];
  if (name === undefined) fail(`Mes fuera de rango en la fecha "${iso}".`);
  return `${name} ${year}`;
}

/** Periodo cerrado o abierto. El guion es una raya (—), no un menos. */
export function period(inicio: string, fin: string | undefined, locale: Locale, present: string): string {
  return `${monthYear(inicio, locale)} — ${fin === undefined ? present : monthYear(fin, locale)}`;
}

/* -------------------------------------------------- fecha de actualización */

let updatedCache: string | undefined;

/**
 * Fecha de la última modificación **de los archivos de data**, sacada del
 * `git log` (SPEC §7).
 *
 * No es la fecha de build, y la diferencia importa: con la fecha de build el CV
 * se vería "actualizado" cada vez que se publica un post sin haberlo tocado, que
 * es exactamente la señal falsa que un reclutador aprende a descontar.
 *
 * El `pathspec` excluye el `.example.yml`, que documenta una forma y no es data:
 * editar la plantilla del archivo privado no debe cambiar la fecha del CV.
 *
 * Si no hay historia de git —un checkout superficial en CI, un tarball— esto
 * **falla el build** en vez de inventar una fecha. `CV_DATA_UPDATED` es el
 * escape documentado para ese caso; ponerlo es una decisión explícita de quien
 * construye, no un silencio.
 */
export function dataUpdatedAt(): string {
  if (updatedCache !== undefined) return updatedCache;

  const override = process.env.CV_DATA_UPDATED;
  if (override !== undefined && override.length > 0) {
    updatedCache = override;
    return override;
  }

  let out = '';
  try {
    out = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', 'src/content/data', ':(exclude)src/content/data/*.example.yml'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
  } catch {
    out = '';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(out)) {
    fail(
      'No se pudo derivar la fecha de la data desde `git log`. ' +
        'Si el build corre sobre un checkout sin historia, define `CV_DATA_UPDATED=AAAA-MM-DD`. ' +
        'Nunca uses la fecha de build: haría ver el CV actualizado cada vez que se publica un post (SPEC §7).',
    );
  }

  updatedCache = out;
  return out;
}

/* ------------------------------------------------------- nombre de archivo */

/** ASCII, sin tildes, con guiones. Un nombre de archivo no lleva `ñ` ni acentos. */
function slugifyName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Nombre del PDF, con convención fija y legible (SPEC §7): **el reclutador lo
 * ve** en su carpeta de descargas y en el adjunto del correo. `cv.pdf` o
 * `documento(3).pdf` es una oportunidad desperdiciada; el nombre lleva quién
 * es, para qué cargo y en qué idioma.
 *
 *     Santiago-Gelvez-Ingeniero-de-Datos-ES.pdf
 *
 * El sufijo `-completo` / `-full` marca la variante con los campos no públicos.
 * **No es decorativo:** es el patrón que `.gitignore` usa para que ese archivo
 * no se pueda versionar aunque acabe en un directorio equivocado (ADR-0006).
 */
const FULL_SUFFIX: Record<Locale, string> = { es: 'completo', en: 'full' };

export function pdfName(
  nombre: string,
  cargoObjetivo: string,
  locale: Locale,
  options: { full?: boolean } = {},
): string {
  const parts = [slugifyName(nombre), slugifyName(cargoObjetivo), locale.toUpperCase()];
  if (options.full === true) parts.push(FULL_SUFFIX[locale]);
  return `${parts.join('-')}.pdf`;
}

/**
 * Dónde vive el PDF público dentro del sitio. Los completos **no tienen ruta**:
 * no se sirven desde ningún sitio, así que no hay función que la devuelva.
 */
export function pdfPath(fileName: string): string {
  return `/cv/${fileName}`;
}

/* ---------------------------------------------------------------- la vista */

type Experience = CollectionEntry<'experience'>['data'];
type Education = CollectionEntry<'education'>['data'];
type Certification = CollectionEntry<'certifications'>['data'];
type Skill = CollectionEntry<'skills'>['data'];

/** Skills agrupadas, en el orden en que el esquema declara las categorías. */
export interface SkillGroup {
  categoria: Skill['categoria'];
  items: Skill[];
}

export interface CvView {
  variant: VariantId;
  locale: Locale;
  /** Orden de las secciones, tal como lo declara la variante. */
  sections: readonly CvSectionKey[];
  cargoObjetivo: string;
  /** Ruta del PDF público de esta salida. El completo no tiene ruta. */
  pdf: string;
  updated: string;
  profile: Awaited<ReturnType<typeof profileData>>;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: SkillGroup[];
  projects: { record: ProjectRecord; slug: string }[];
}

/** Orden de presentación de las categorías de skills. */
const CATEGORY_ORDER: readonly Skill['categoria'][] = [
  'lenguajes',
  'procesamiento',
  'orquestacion',
  'almacenamiento',
  'cloud',
  'bi',
  'practicas',
];

/** Las obtenidas primero y de la más reciente a la más antigua; el resto detrás. */
const CERT_ORDER: readonly Certification['estado'][] = ['obtenida', 'en-curso', 'planeada'];

/**
 * Toda la data de una salida del CV, ya filtrada y ordenada.
 *
 * La consumen las tres salidas de SPEC §7 —página navegable, PDF público y PDF
 * completo— sin que ninguna añada ni quite un registro por su cuenta. Es lo que
 * hace que "el CV es una vista sobre la data" sea verdad y no una intención.
 */
export async function cvView(variantId: VariantId, locale: Locale): Promise<CvView> {
  const variant = await cvVariant(variantId);
  const filtro = variant.filtro;
  const visible = <T extends { visible_en: readonly string[] }>(item: T) => item.visible_en.includes(filtro);

  const [profile, experience, education, certifications, skills, projects] = await Promise.all([
    profileData(),
    getCollection('experience'),
    getCollection('education'),
    getCollection('certifications'),
    getCollection('skills'),
    projectRecords(),
  ]);

  const jobs = experience
    .map((entry) => entry.data)
    .filter(visible)
    .sort((a, b) => b.inicio.localeCompare(a.inicio));

  const degrees = education
    .map((entry) => entry.data)
    .filter(visible)
    .sort((a, b) => b.inicio.localeCompare(a.inicio));

  const certs = certifications
    .map((entry) => entry.data)
    .filter(visible)
    .sort((a, b) => {
      const byStatus = CERT_ORDER.indexOf(a.estado) - CERT_ORDER.indexOf(b.estado);
      if (byStatus !== 0) return byStatus;
      // Una certificación en curso no tiene fecha de obtención (lo impide el
      // esquema), así que dentro de ese grupo el desempate es el nombre.
      return (b.obtencion ?? '').localeCompare(a.obtencion ?? '') || a.nombre.localeCompare(b.nombre);
    });

  // Dentro de cada categoría, alfabético en el idioma de la salida. `getCollection`
  // devuelve las entradas ordenadas por `id`, así que sin esto el CV en español
  // saldría ordenado por identificadores en inglés —"dbt · pandas · PySpark"—,
  // que no es un orden, es un accidente de implementación asomándose.
  const visibleSkills = skills.map((entry) => entry.data).filter(visible);
  const collator = new Intl.Collator(locale);
  const grouped: SkillGroup[] = CATEGORY_ORDER.map((categoria) => ({
    categoria,
    items: visibleSkills
      .filter((skill) => skill.categoria === categoria)
      .sort((a, b) => collator.compare(a.nombre[locale], b.nombre[locale])),
  })).filter((group) => group.items.length > 0);

  const cvProjects = projects
    .filter((record) => record.entry.data.visible_en.includes(filtro))
    .map((record) => ({ record, slug: record.entry.data.slug[locale] }));

  // Una sección declarada en `orden_secciones` que no tenga nada que mostrar es
  // un encabezado vacío en el PDF, que para un parser es peor que la ausencia:
  // clasifica la sección y no encuentra contenido. Se detecta en build.
  const counts: Record<CvSectionKey, number> = {
    perfil: 1,
    experiencia: jobs.length,
    proyectos: cvProjects.length,
    skills: grouped.length,
    certificaciones: certs.length,
    educacion: degrees.length,
  };
  for (const section of variant.orden_secciones) {
    if (counts[section] === 0) {
      fail(
        `La variante "${variantId}" declara la sección "${section}" y ningún registro la alimenta ` +
          `(ningún \`visible_en\` incluye "${filtro}"). Quítala de \`orden_secciones\` o marca los registros.`,
      );
    }
  }

  const cargoObjetivo = variant.cargo_objetivo[locale];

  return {
    variant: variantId,
    locale,
    sections: variant.orden_secciones,
    cargoObjetivo,
    pdf: pdfPath(pdfName(profile.nombre, cargoObjetivo, locale)),
    updated: dataUpdatedAt(),
    profile,
    experience: jobs,
    education: degrees,
    certifications: certs,
    skills: grouped,
    projects: cvProjects,
  };
}
