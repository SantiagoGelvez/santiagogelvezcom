import { getCollection, type CollectionEntry } from 'astro:content';
import { locales, path, type Locale } from '~/i18n/routes';
import { categoryKeys, MIN_POSTS_TO_INDEX, type CategoryKey } from '~/i18n/taxonomy';
import { SLUG_NO_DIGITS, POST_SLUG_RULE } from '~/lib/slugs';

/**
 * Capa de consulta sobre las colecciones. Aquí viven las reglas que un esquema
 * de Zod no puede expresar, porque un esquema solo ve un archivo a la vez:
 * integridad entre colecciones, unicidad de las claves de traducción y la
 * paridad de idiomas que exige ADR-0008.
 *
 * Todo lo que falla aquí falla **en build**. Las páginas importan estas
 * funciones, así que un dato incoherente no llega a producción: rompe `npm run
 * build` igual que un error de tipo.
 */

function fail(message: string): never {
  throw new Error(`[contenido] ${message}`);
}

/* ------------------------------------------------------------------- posts */

export interface PostRecord {
  /** `clave_traduccion`: empareja las versiones de la misma pieza (SPEC §8). */
  key: string;
  locale: Locale;
  /** Derivado del nombre del archivo, no del frontmatter. */
  slug: string;
  entry: CollectionEntry<'posts'>;
}

/**
 * El `id` de un post es su ruta relativa sin extensión: `es/etl-vs-elt`. El
 * idioma y el slug se derivan de ahí, así que no pueden contradecir a la ruta
 * del archivo — no existe el campo que se podría desincronizar.
 */
function splitPostId(id: string): { locale: Locale; slug: string } {
  const [prefix, ...rest] = id.split('/');
  const slug = rest.join('/');
  if (rest.length !== 1 || slug.length === 0) {
    fail(`El post "${id}" debe estar en "src/content/posts/<idioma>/<slug>.mdx".`);
  }
  const locale = locales.find((candidate) => candidate === prefix);
  if (locale === undefined) {
    fail(`El post "${id}" está en la carpeta "${prefix}", que no es un idioma del sitio.`);
  }
  if (!SLUG_NO_DIGITS.test(slug)) {
    fail(`El slug "${slug}" no cumple las reglas: ${POST_SLUG_RULE}.`);
  }
  return { locale, slug };
}

let postsCache: PostRecord[] | undefined;

/**
 * Posts publicados, del más reciente al más antiguo. Los borradores no salen:
 * un post en estado `borrador` no genera ruta ni aparece en ningún índice.
 */
export async function publishedPosts(): Promise<PostRecord[]> {
  if (postsCache !== undefined) return postsCache;

  const entries = await getCollection('posts', ({ data }) => data.estado === 'publicado');
  const records = entries.map((entry) => ({ ...splitPostId(entry.id), key: entry.data.clave_traduccion, entry }));

  // Dos posts del mismo idioma con la misma clave harían ambiguo el selector.
  const seen = new Map<string, string>();
  for (const record of records) {
    const seenKey = `${record.locale}:${record.key}`;
    const previous = seen.get(seenKey);
    if (previous !== undefined) {
      fail(`Los posts "${previous}" y "${record.entry.id}" comparten la clave "${record.key}" en el mismo idioma.`);
    }
    seen.set(seenKey, record.entry.id);
  }

  records.sort((a, b) => {
    const byDate = b.entry.data.fecha_publicacion.localeCompare(a.entry.data.fecha_publicacion);
    return byDate !== 0 ? byDate : a.slug.localeCompare(b.slug);
  });

  postsCache = records;
  return records;
}

export async function postsIn(locale: Locale): Promise<PostRecord[]> {
  return (await publishedPosts()).filter((record) => record.locale === locale);
}

/**
 * Rutas de la misma pieza en los idiomas donde existe **de verdad**. Es lo que
 * el `<head>` consume: `hreflang` nunca se declara hacia una página inexistente
 * (SPEC §8), y aquí eso queda garantizado por construcción.
 */
export async function postAlternates(key: string): Promise<Partial<Record<Locale, string>>> {
  const matches = (await publishedPosts()).filter((record) => record.key === key);
  const alternates: Partial<Record<Locale, string>> = {};
  for (const match of matches) alternates[match.locale] = path(match.locale, 'blog', match.slug);
  return alternates;
}

/* -------------------------------------------------------------- proyectos */

export interface ProjectRecord {
  /** El `id` del registro **es** su clave de traducción (SPEC §6, corolario). */
  id: string;
  entry: CollectionEntry<'projects'>;
  body: Record<Locale, CollectionEntry<'projectBodies'>>;
}

let projectsCache: ProjectRecord[] | undefined;

/**
 * Proyectos con su cuerpo narrativo por idioma ya resuelto.
 *
 * ADR-0008 exige que los casos de estudio salgan bilingües en v1, así que un
 * proyecto al que le falte un idioma es un error de build y no una página a
 * medias en producción.
 */
export async function projectRecords(): Promise<ProjectRecord[]> {
  if (projectsCache !== undefined) return projectsCache;

  const [entries, bodies] = await Promise.all([getCollection('projects'), getCollection('projectBodies')]);
  const byId = new Map(bodies.map((body) => [body.id, body]));

  const records = entries.map((entry) => {
    const body = {} as Record<Locale, CollectionEntry<'projectBodies'>>;
    for (const locale of locales) {
      const found = byId.get(`${entry.id}.${locale}`);
      if (found === undefined) {
        fail(
          `Al proyecto "${entry.id}" le falta "src/content/project-bodies/${entry.id}.${locale}.mdx". ` +
            'ADR-0008: los casos de estudio salen bilingües.',
        );
      }
      body[locale] = found;
    }
    return { id: entry.id, entry, body };
  });

  // Un cuerpo sin registro sería una narrativa que nunca se publica.
  for (const body of bodies) {
    const projectId = body.id.slice(0, body.id.lastIndexOf('.'));
    if (!entries.some((entry) => entry.id === projectId)) {
      fail(`El cuerpo "${body.id}" no tiene registro en "src/content/projects/${projectId}.yml".`);
    }
  }

  records.sort((a, b) => a.entry.data.orden - b.entry.data.orden);
  projectsCache = records;
  return records;
}

/** Proyectos visibles en el sitio, no los que solo alimentan una variante del CV. */
export async function projectsIn(locale: Locale): Promise<{ record: ProjectRecord; slug: string }[]> {
  const records = await projectRecords();
  return records
    .filter((record) => record.entry.data.visible_en.includes('sitio'))
    .map((record) => ({ record, slug: record.entry.data.slug[locale] }));
}

/** Los proyectos son bilingües en línea, así que siempre existen en los dos idiomas. */
export function projectAlternates(record: ProjectRecord): Partial<Record<Locale, string>> {
  const alternates: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    alternates[locale] = path(locale, 'projects', record.entry.data.slug[locale]);
  }
  return alternates;
}

/* ------------------------------------------------------------- categorías */

export async function postsInCategory(locale: Locale, category: CategoryKey): Promise<PostRecord[]> {
  return (await postsIn(locale)).filter((record) => record.entry.data.categoria === category);
}

/**
 * Regla de ADR-0012, evaluada en build contra el conteo real: una categoría con
 * menos de 3 posts sale con `noindex`. Se cuenta **por idioma**, porque el
 * español y el inglés no tienen paridad y una categoría puede estar llena en un
 * idioma y vacía en el otro.
 */
export async function categoryIsIndexed(locale: Locale, category: CategoryKey): Promise<boolean> {
  return (await postsInCategory(locale, category)).length >= MIN_POSTS_TO_INDEX;
}

/* ------------------------------------------------------ integridad cruzada */

/**
 * Referencias entre colecciones. Un `proyecto` o un `posts_relacionados` que
 * apunta a algo que no existe es exactamente el error de tipeo que SPEC §6 pide
 * que no llegue a producción.
 */
export async function assertReferencesResolve(): Promise<void> {
  const [posts, projects] = await Promise.all([publishedPosts(), projectRecords()]);
  const projectIds = new Set(projects.map((record) => record.id));
  const postKeys = new Set(posts.map((record) => record.key));

  for (const post of posts) {
    const reference = post.entry.data.proyecto;
    if (reference !== undefined && !projectIds.has(reference)) {
      fail(`El post "${post.entry.id}" apunta al proyecto "${reference}", que no existe.`);
    }
  }

  for (const project of projects) {
    for (const reference of project.entry.data.posts_relacionados) {
      if (!postKeys.has(reference)) {
        fail(`El proyecto "${project.id}" apunta al post "${reference}", que no existe o es un borrador.`);
      }
    }
  }
}

export { categoryKeys };
