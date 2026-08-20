import type { Locale } from './routes';

/**
 * Taxonomía del blog: tres categorías, fijas (SPEC §9). Si algo no cabe, se
 * fuerza a caber; no se crea una cuarta. Los nombres de herramientas (dbt,
 * Airflow, Databricks, AWS) son tags, no categorías.
 *
 * Vive aquí y no en una colección de contenido a propósito: es un conjunto
 * cerrado que el esquema de los posts usa como enum, así que una categoría mal
 * escrita en un frontmatter rompe el build en vez de crear una cuarta en
 * silencio. Los segmentos son traducidos, igual que en `routes.ts`.
 */
export const categorySlugs = {
  fundamentos: { es: 'fundamentos', en: 'fundamentals' },
  decisiones: { es: 'decisiones', en: 'decisions' },
  bitacora: { es: 'bitacora', en: 'logbook' },
} as const satisfies Record<string, Record<Locale, string>>;

export type CategoryKey = keyof typeof categorySlugs;

export const categoryKeys = Object.keys(categorySlugs) as [CategoryKey, ...CategoryKey[]];

export const categoryLabels: Record<CategoryKey, Record<Locale, string>> = {
  fundamentos: { es: 'Fundamentos', en: 'Fundamentals' },
  decisiones: { es: 'Decisiones', en: 'Decisions' },
  bitacora: { es: 'Bitácora', en: 'Logbook' },
};

/** Qué contiene cada categoría, para el encabezado de su página (SPEC §9). */
export const categoryDescriptions: Record<CategoryKey, Record<Locale, string>> = {
  fundamentos: {
    es: 'Conceptos y comparaciones: ETL frente a ELT, warehouse, lake y lakehouse, CTE frente a subconsulta.',
    en: 'Concepts and comparisons: ETL versus ELT, warehouse, lake and lakehouse, CTE versus subquery.',
  },
  decisiones: {
    es: 'Por qué elegí una opción sobre otra en un contexto real, y qué sacrifiqué al hacerlo.',
    en: 'Why I picked one option over another in a real context, and what I gave up by doing so.',
  },
  bitacora: {
    es: 'Capítulos de un proyecto: qué construí, qué se rompió y cómo lo arreglé.',
    en: 'Chapters from a project: what I built, what broke, and how I fixed it.',
  },
};

/**
 * Umbral de indexación de ADR-0012: una categoría con menos de 3 posts sale con
 * `noindex`. El número vive en el código y no en la memoria, para que dentro de
 * un año se pueda leer por qué unas categorías se indexan y otras no.
 */
export const MIN_POSTS_TO_INDEX = 3;
