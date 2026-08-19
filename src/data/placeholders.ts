import { locales, path, type Locale, type SectionKey } from '../i18n/routes';

/**
 * Piezas de relleno de la fase 1a. Existen para que las rutas dinámicas
 * (`proyectos/{slug}`, `blog/{slug}`, `blog/tema/{slug}`) respondan de verdad.
 *
 * **Se reemplazan en la fase 1b** por colecciones de contenido con esquemas Zod,
 * que es el requisito decisivo del ADR-0002. La forma de los datos aquí ya
 * anticipa esa migración: clave de traducción estable + slug por idioma.
 */
export interface Piece {
  /** Clave de traducción: une las versiones es/en de la misma pieza (SPEC §8). */
  key: string;
  /** Slug por idioma. `null` = la pieza no existe en ese idioma. */
  slug: Record<Locale, string | null>;
  title: Record<Locale, string>;
}

export const projects: readonly Piece[] = [
  {
    key: 'placeholder-project',
    slug: { es: 'proyecto-de-ejemplo', en: 'sample-project' },
    title: { es: 'Proyecto de ejemplo', en: 'Sample project' },
  },
];

export const posts: readonly Piece[] = [
  {
    key: 'placeholder-post',
    slug: { es: 'post-de-ejemplo', en: 'sample-post' },
    title: { es: 'Post de ejemplo', en: 'Sample post' },
  },
  {
    // El caso crítico de SPEC §8: una pieza que solo existe en un idioma.
    // Va desde la fase 1a para que el selector se diseñe contra el caso difícil
    // y no se descubra en la fase 4 que la estructura no lo soporta.
    key: 'placeholder-post-solo-es',
    slug: { es: 'post-solo-en-espanol', en: null },
    title: { es: 'Post solo en español', en: 'Post available in Spanish only' },
  },
];

/** Taxonomía fija de tres temas (SPEC §9); aquí solo uno, de relleno. */
export const topics: readonly Piece[] = [
  {
    key: 'placeholder-topic',
    slug: { es: 'tema-de-ejemplo', en: 'sample-topic' },
    title: { es: 'Tema de ejemplo', en: 'Sample topic' },
  },
];

/** Piezas que existen en `locale`, con su slug ya resuelto. */
export function inLocale(
  pieces: readonly Piece[],
  locale: Locale,
): { piece: Piece; slug: string }[] {
  return pieces.flatMap((piece) => {
    const slug = piece.slug[locale];
    return slug === null ? [] : [{ piece, slug }];
  });
}

/**
 * Rutas de la misma pieza en los idiomas donde existe de verdad.
 * Lo que se le pasa a la plantilla como `alternates`: `hreflang` nunca se
 * declara hacia una página inexistente (SPEC §8).
 */
export function alternatePaths(piece: Piece, section: SectionKey): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  for (const locale of locales) {
    const slug = piece.slug[locale];
    if (slug !== null) out[locale] = path(locale, section, slug);
  }
  return out;
}
