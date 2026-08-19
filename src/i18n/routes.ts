export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

/** Etiqueta de idioma para `lang`, `hreflang` y el selector. */
export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
};

/**
 * Clave de traducción → segmento de ruta, por idioma (SPEC §8).
 *
 * La clave es estable e invisible: es lo que resuelve el selector de idioma.
 * Los slugs son traducidos, no compartidos, porque un slug en español posiciona
 * en búsquedas en español. Nunca se traduce una URL con reemplazo de texto.
 */
export const sections = {
  home: { es: '', en: '' },
  about: { es: 'sobre-mi', en: 'about' },
  projects: { es: 'proyectos', en: 'projects' },
  blog: { es: 'blog', en: 'blog' },
  topic: { es: 'blog/tema', en: 'blog/topic' },
  cv: { es: 'cv', en: 'cv' },
  contact: { es: 'contacto', en: 'contact' },
  privacy: { es: 'privacidad', en: 'privacy' },
} as const satisfies Record<string, Record<Locale, string>>;

export type SectionKey = keyof typeof sections;

/**
 * Ruta absoluta con barra final, que es la forma canónica del sitio
 * (`trailingSlash: 'always'` en `astro.config.mjs`).
 */
export function path(locale: Locale, section: SectionKey, slug?: string): string {
  const parts = [locale, sections[section][locale], slug].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );
  return `/${parts.join('/')}/`;
}

/** URL absoluta, para `canonical`, `hreflang` y JSON-LD. */
export function url(site: URL, locale: Locale, section: SectionKey, slug?: string): string {
  return new URL(path(locale, section, slug), site).href;
}

/** El otro idioma. Con dos locales esto es un toggle; se generaliza si hay un tercero. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'es' ? 'en' : 'es';
}
