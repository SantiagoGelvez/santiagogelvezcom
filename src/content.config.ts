import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';
import { locales } from './i18n/routes';
import { categoryKeys } from './i18n/taxonomy';
import { SLUG_NO_DIGITS, SLUG_WITH_DIGITS, PROJECT_SLUG_RULE } from './lib/slugs';

/**
 * Esquemas de contenido y data (SPEC §6). Este archivo es el requisito que
 * decidió el framework en ADR-0002: un error de tipeo en una fecha no llega a
 * producción porque rompe el build.
 *
 * Principio rector de SPEC §6: lo estructurado es *data* (YAML, se consulta y
 * se filtra), lo narrativo es *contenido* (MDX, un archivo por pieza).
 */

/* --------------------------------------------------------------------- ids */

/**
 * El `id` de una entrada es **siempre** su ruta relativa sin la extensión.
 *
 * Explícito y no por defecto: el `generateId` de `glob()` usa el campo `slug`
 * del archivo cuando existe, y el registro de un proyecto tiene un `slug`
 * bilingüe —un objeto—, así que el id por defecto sería `"[object Object]"`.
 * Derivarlo de la ruta también hace literal lo que dicen los comentarios de
 * abajo: la ruta del archivo es la fuente de verdad del id.
 */
const idFromPath = ({ entry }: { entry: string }) => entry.replace(/\.[^./]+$/, '');

/* ------------------------------------------------------------------ fechas */

const REAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Fecha ISO `YYYY-MM-DD`, **como cadena entre comillas**.
 *
 * El rechazo explícito de `Date` no es pedantería. YAML 1.1 convierte una fecha
 * sin comillas en un `Date` de JavaScript, y `Date` corrige los desbordes en
 * silencio: `2026-02-30` se vuelve el 2 de marzo sin avisar a nadie. Es
 * exactamente el error de tipeo que SPEC §6 exige que no llegue a producción,
 * así que la fecha tiene que llegar aquí como texto para poder validarla.
 */
const isoDate = z
  .custom<string>((value) => typeof value === 'string', {
    message:
      'La fecha debe ir entre comillas ("2026-08-19"). Sin comillas YAML la convierte en Date, y Date corrige las fechas imposibles en silencio.',
  })
  .refine((value) => REAL_DATE.test(value), { message: 'El formato de fecha es YYYY-MM-DD.' })
  .refine(isRealCalendarDate, { message: 'Esa fecha no existe en el calendario.' });

/* ------------------------------------------------------------------- slugs */

/** Las reglas viven en `src/lib/slugs.ts`, compartidas con la capa de consulta. */
const postSlugRegex = SLUG_NO_DIGITS;

const projectSlug = z
  .string()
  .regex(SLUG_WITH_DIGITS, `Slug de proyecto: ${PROJECT_SLUG_RULE}.`);

/* ------------------------------------------------------- meta description */

/**
 * Longitud de una `meta description` (SPEC §10). El rango coincide con el que
 * verifica `scripts/verify-routes.mjs`: si los dos números se separan, el build
 * pasa y el criterio de terminado falla, que es la peor combinación posible.
 */
const metaDescription = z.string().min(120).max(170);

/* -------------------------------------------------------------- bilingüe */

/** Campo bilingüe en línea: la estrategia de SPEC §6 para la data. */
const bilingual = <T extends z.ZodType>(inner: T) =>
  z.strictObject({ es: inner, en: inner });

const localeEnum = z.enum(locales);

/**
 * Primer eje de filtrado de SPEC §6, granularidad de **registro**: en qué
 * salidas aparece este registro. Es lo que hace baratas las variantes del CV.
 *
 * El segundo eje —granularidad de **campo**— no es una marca booleana sino el
 * `z.strictObject` de cada esquema junto con ADR-0006: los campos no públicos viven
 * en archivos ignorados por git, así que un teléfono en un archivo versionado
 * no es un campo mal marcado, es una clave que el esquema no reconoce y el
 * build se cae. Una marca se puede leer mal; un archivo que no está en el repo
 * no se puede publicar por accidente.
 */
const visibleEn = z
  .array(z.enum(['sitio', 'cv-datos', 'cv-itsm']))
  .nonempty('Un registro sin `visible_en` no aparecería en ninguna salida.');

/* --------------------------------------------------------------- contenido */

/**
 * Posts: un archivo por idioma (SPEC §6), porque no hay paridad entre idiomas.
 *
 * El idioma y el slug **se derivan de la ruta del archivo**
 * (`posts/es/etl-vs-elt.mdx`) y no se repiten en el frontmatter: un campo que
 * duplica la ruta es un campo que puede contradecirla. La `clave_traduccion`
 * sí es explícita, porque es lo único que empareja dos archivos distintos.
 */
const posts = defineCollection({
  loader: glob({ base: 'src/content/posts', pattern: '{es,en}/**/*.mdx', generateId: idFromPath }),
  schema: z
    .strictObject({
      clave_traduccion: z.string().regex(postSlugRegex, 'La clave de traducción usa el formato de un slug de post.'),
      titulo: z.string().min(1),
      /**
       * Sale tal cual como `meta description`: escrita a mano, nunca truncada
       * (SPEC §10). El rango es el mismo que comprueba `verify-routes.mjs`, para
       * que el esquema no deje pasar un resumen que el criterio de terminado
       * rechaza después.
       */
      resumen: metaDescription,
      fecha_publicacion: isoDate,
      fecha_actualizacion: isoDate.optional(),
      categoria: z.enum(categoryKeys),
      tags: z.array(z.string().min(1)).default([]),
      /** `id` de un proyecto: enlaza el post con su caso de estudio. */
      proyecto: z.string().optional(),
      estado: z.enum(['borrador', 'publicado']),
      /** Franja "empieza por aquí" del índice del blog (SPEC §9). */
      pilar: z.boolean().default(false),
    })
    .refine(
      (post) => post.fecha_actualizacion === undefined || post.fecha_actualizacion >= post.fecha_publicacion,
      { message: 'La fecha de actualización no puede ser anterior a la de publicación.', path: ['fecha_actualizacion'] },
    ),
});

/**
 * Proyectos, parte estructurada. Un archivo por proyecto, bilingüe en línea:
 * el `id` del registro **es** su clave de traducción (SPEC §6, corolario), así
 * que no lleva campo aparte. Un mecanismo, no dos.
 *
 * Lo no lingüístico (estado, stack, orden, destacado) vive una sola vez, así
 * que no puede divergir entre el español y el inglés.
 */
const projects = defineCollection({
  loader: glob({ base: 'src/content/projects', pattern: '*.yml', generateId: idFromPath }),
  schema: z
    .strictObject({
      slug: bilingual(projectSlug),
      titulo: bilingual(z.string().min(1)),
      resumen: bilingual(metaDescription),
      rol: bilingual(z.string().min(1)),
      periodo: z.strictObject({ inicio: isoDate, fin: isoDate.optional() }),
      estado: z.enum(['activo', 'terminado', 'pausado']),
      stack: z.array(z.string().min(1)).nonempty(),
      repo: z.url().optional(),
      demo: z.url().optional(),
      diagrama: z.string().optional(),
      destacado: z.boolean().default(false),
      orden: z.number().int(),
      posts_relacionados: z.array(z.string()).default([]),
      visible_en: visibleEn,
    })
    .refine((project) => project.periodo.fin === undefined || project.periodo.fin >= project.periodo.inicio, {
      message: 'El periodo termina antes de empezar.',
      path: ['periodo', 'fin'],
    })
    .refine((project) => project.estado !== 'activo' || project.periodo.fin === undefined, {
      message: 'Un proyecto activo no puede tener fecha de fin.',
      path: ['estado'],
    }),
});

/**
 * Proyectos, parte narrativa: las nueve secciones de SPEC §9, un archivo por
 * idioma, nombrados `<id-del-proyecto>.<idioma>.mdx`. Sin frontmatter propio —
 * los metadatos ya viven en el registro y repetirlos sería la duplicación que
 * este corte evita. ADR-0008 exige que existan en los dos idiomas; eso se
 * comprueba al consultarlos, no aquí, porque un esquema solo ve un archivo.
 */
const projectBodies = defineCollection({
  loader: glob({ base: 'src/content/project-bodies', pattern: '*.{es,en}.mdx', generateId: idFromPath }),
  schema: z.strictObject({}),
});

/* -------------------------------------------------------------------- data */

const profile = defineCollection({
  loader: file('src/content/data/perfil.yml'),
  schema: z
    .strictObject({
      id: z.string(),
      nombre: z.string().min(1),
      headline: bilingual(z.string().min(1)),
      resumen: bilingual(z.string().min(1)),
      ciudad: z.string().min(1),
      pais: z.string().min(1),
      /** Alias del dominio, rotable. Nunca el correo principal (ADR-0006). */
      correo: z.email().endsWith('@santiagogelvez.com', 'El correo público es un alias del dominio.'),
      enlaces: z
        .strictObject({ github: z.url(), linkedin: z.url(), platzi: z.url().optional() }),
    }),
});

const experience = defineCollection({
  loader: file('src/content/data/experiencia.yml'),
  schema: z
    .strictObject({
      id: z.string(),
      empresa: z.string().min(1),
      cargo: bilingual(z.string().min(1)),
      inicio: isoDate,
      /** Vacío = actual. */
      fin: isoDate.optional(),
      modalidad: z.enum(['presencial', 'remoto', 'hibrido']),
      descripcion: bilingual(z.string().min(1)),
      logros: bilingual(z.array(z.string().min(1)).nonempty()),
      stack: z.array(z.string().min(1)).default([]),
      visible_en: visibleEn,
    })
    .refine((job) => job.fin === undefined || job.fin >= job.inicio, {
      message: 'El empleo termina antes de empezar.',
      path: ['fin'],
    })
    .refine((job) => job.logros.es.length === job.logros.en.length, {
      message: 'Los logros deben tener el mismo número de viñetas en los dos idiomas.',
      path: ['logros'],
    }),
});

const education = defineCollection({
  loader: file('src/content/data/educacion.yml'),
  schema: z
    .strictObject({
      id: z.string(),
      institucion: z.string().min(1),
      titulo: bilingual(z.string().min(1)),
      inicio: isoDate,
      fin: isoDate.optional(),
      visible_en: visibleEn,
    })
    .refine((item) => item.fin === undefined || item.fin >= item.inicio, {
      message: 'La formación termina antes de empezar.',
      path: ['fin'],
    }),
});

const certifications = defineCollection({
  loader: file('src/content/data/certificaciones.yml'),
  schema: z
    .strictObject({
      id: z.string(),
      nombre: z.string().min(1),
      emisor: z.string().min(1),
      /** `en-curso` es deliberado: comunica trayectoria activa (SPEC §6). */
      estado: z.enum(['obtenida', 'en-curso', 'planeada']),
      obtencion: isoDate.optional(),
      vencimiento: isoDate.optional(),
      credencial: z.string().optional(),
      verificacion: z.url().optional(),
      visible_en: visibleEn,
    })
    .refine((cert) => cert.estado !== 'obtenida' || cert.obtencion !== undefined, {
      message: 'Una certificación obtenida necesita fecha de obtención.',
      path: ['obtencion'],
    })
    .refine((cert) => cert.estado === 'obtenida' || cert.obtencion === undefined, {
      message: 'Solo una certificación obtenida lleva fecha de obtención.',
      path: ['obtencion'],
    })
    .refine(
      (cert) => cert.vencimiento === undefined || cert.obtencion === undefined || cert.vencimiento > cert.obtencion,
      { message: 'La certificación vence antes de obtenerse.', path: ['vencimiento'] },
    ),
});

/**
 * Skills sin niveles, sin porcentajes y sin barras de progreso (SPEC §6):
 * "Python 85%" es una de las señales más confiables de portafolio junior. El
 * esquema no tiene dónde ponerlos, así que no se pueden agregar por descuido.
 */
const skills = defineCollection({
  loader: file('src/content/data/skills.yml'),
  schema: z
    .strictObject({
      id: z.string(),
      nombre: z.string().min(1),
      categoria: z.enum([
        'lenguajes',
        'procesamiento',
        'orquestacion',
        'almacenamiento',
        'cloud',
        'bi',
        'practicas',
      ]),
      visible_en: visibleEn,
    }),
});

const cvVariants = defineCollection({
  loader: file('src/content/data/variantes-cv.yml'),
  schema: z
    .strictObject({
      id: z.enum(['cv-datos', 'cv-itsm']),
      cargo_objetivo: bilingual(z.string().min(1)),
      idioma: localeEnum,
      /** Criterio de filtrado: qué valor de `visible_en` selecciona esta salida. */
      filtro: z.enum(['cv-datos', 'cv-itsm']),
      orden_secciones: z
        .array(z.enum(['perfil', 'experiencia', 'educacion', 'certificaciones', 'skills', 'proyectos']))
        .nonempty(),
    }),
});

export const collections = {
  posts,
  projects,
  projectBodies,
  profile,
  experience,
  education,
  certifications,
  skills,
  cvVariants,
};
