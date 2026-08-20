import type { Locale, SectionKey } from './routes';

/**
 * Cadenas de interfaz por idioma. Solo lo que la navegación y las plantillas
 * necesitan; el contenido de las páginas no vive aquí.
 */

/** Etiqueta de cada sección en la navegación. */
export const sectionLabels: Record<SectionKey, Record<Locale, string>> = {
  home: { es: 'Inicio', en: 'Home' },
  about: { es: 'Sobre mí', en: 'About' },
  projects: { es: 'Proyectos', en: 'Projects' },
  blog: { es: 'Blog', en: 'Blog' },
  topic: { es: 'Tema', en: 'Topic' },
  cv: { es: 'CV', en: 'CV' },
  contact: { es: 'Contacto', en: 'Contact' },
  privacy: { es: 'Privacidad', en: 'Privacy' },
};

/** Secciones que aparecen en la navegación principal, en orden. */
export const navSections: readonly SectionKey[] = ['about', 'projects', 'blog', 'cv', 'contact'];

export const ui = {
  siteName: { es: 'Santiago Gelvez', en: 'Santiago Gelvez' },
  role: { es: 'Ingeniero de Datos', en: 'Data Engineer' },
  city: { es: 'Duitama, Boyacá, Colombia', en: 'Duitama, Boyacá, Colombia' },
  skipToContent: { es: 'Saltar al contenido', en: 'Skip to content' },
  switchLanguage: { es: 'Ver en inglés', en: 'Ver en español' },
  /**
   * Aviso cuando la pieza no existe en el otro idioma (SPEC §8).
   *
   * **La clave es el idioma en que está escrita la cadena**, no el idioma en que
   * existe la pieza. Se consume como `noTranslation[otherLocale]`: con dos idiomas,
   * el aviso escrito en un idioma siempre anuncia que la pieza está en el otro.
   */
  noTranslation: {
    es: 'Esta pieza solo está disponible en inglés. El enlace lleva al índice del blog.',
    en: 'This piece is only available in Spanish. The link goes to the blog index.',
  },
  placeholderNotice: {
    es: 'Ruta de relleno: existe y responde, pero el contenido llega en una fase posterior.',
    en: 'Placeholder route: it exists and responds, but the content lands in a later phase.',
  },
  /**
   * Distinto del anterior: aquí la página ya está construida y lo de relleno es
   * el texto. Decirlo con precisión cuesta una cadena y evita que un aviso
   * mienta sobre el estado real de la ruta.
   */
  placeholderCopy: {
    es: 'El texto de esta página es de relleno. El contenido real llega con la data y el contenido de lanzamiento.',
    en: 'The copy on this page is placeholder text. The real content lands with the data and the launch content.',
  },
  /** Franja fija del índice del blog (SPEC §9). */
  startHere: { es: 'Empieza por aquí', en: 'Start here' },
  featuredProjects: { es: 'Proyectos', en: 'Projects' },
  latestPosts: { es: 'Del blog', en: 'From the blog' },
  topics: { es: 'Temas', en: 'Topics' },
  allProjects: { es: 'Todos los proyectos', en: 'All projects' },
  allPosts: { es: 'Todo el blog', en: 'The whole blog' },
  /** Titular del índice cronológico. `allPosts` es texto de enlace, no titular. */
  postsHeading: { es: 'Todos los posts', en: 'All posts' },
  contactCta: { es: 'Escríbeme', en: 'Get in touch' },
  updated: { es: 'Actualizado', en: 'Updated' },
  /** Nombre accesible de la ruta de navegación (SPEC §10). */
  breadcrumb: { es: 'Ruta de navegación', en: 'Breadcrumb' },
  repository: { es: 'Repositorio', en: 'Repository' },
  demo: { es: 'Demo', en: 'Demo' },
  emptyCategory: {
    es: 'Todavía no hay posts en este tema.',
    en: 'There are no posts in this topic yet.',
  },
  notFoundTitle: { es: 'Página no encontrada', en: 'Page not found' },
  notFoundBody: {
    es: 'Esa dirección no existe. Prueba desde el inicio.',
    en: 'That address does not exist. Try from the home page.',
  },
} as const;

/**
 * Estado de un proyecto, para el chip de la tarjeta. El vocabulario es cerrado
 * —lo fija el esquema— así que la traducción también puede serlo.
 */
export const projectStatus: Record<'activo' | 'terminado' | 'pausado', Record<Locale, string>> = {
  activo: { es: 'Activo', en: 'Active' },
  terminado: { es: 'Terminado', en: 'Finished' },
  pausado: { es: 'Pausado', en: 'Paused' },
};

/**
 * `meta description` de las páginas de sección: escritas a mano, 150-160
 * caracteres (SPEC §10). Nunca truncadas automáticamente del primer párrafo.
 * Centralizadas aquí porque son copy de sección; el copy de cada pieza de
 * contenido vivirá en el frontmatter de la pieza.
 */
export const pageDescriptions: Record<SectionKey, Record<Locale, string>> = {
  home: {
    es: 'Santiago Gelvez, Ingeniero de Datos en Duitama, Boyacá, Colombia. Proyectos con su arquitectura, decisiones argumentadas y notas técnicas sobre datos.',
    en: 'Santiago Gelvez, Data Engineer based in Duitama, Boyacá, Colombia. Projects with their architecture, reasoned decisions, and technical notes on data.',
  },
  about: {
    es: 'Trayectoria, formación y certificaciones de Santiago Gelvez, Ingeniero de Datos. Dónde ha trabajado, qué construyó y qué aprendió en cada etapa.',
    en: 'Career, education, and certifications of Santiago Gelvez, Data Engineer. Where he has worked, what he built, and what he learned at each step.',
  },
  projects: {
    es: 'Casos de estudio de ingeniería de datos: el problema, la arquitectura elegida, las decisiones que costaron y qué se sacrificó en cada una de ellas.',
    en: 'Data engineering case studies: the problem, the architecture chosen, the decisions that were expensive, and what was traded away in each of them.',
  },
  blog: {
    es: 'Notas técnicas sobre ingeniería de datos: pipelines, modelado, costos y las decisiones que se toman cuando ninguna opción es claramente la mejor.',
    en: 'Technical notes on data engineering: pipelines, modeling, cost, and the decisions you make when no option is clearly the better one.',
  },
  topic: {
    es: 'Posts del blog de Santiago Gelvez agrupados por tema: ingeniería de datos, arquitectura de pipelines y las decisiones detrás de cada sistema.',
    en: 'Posts from Santiago Gelvez’s blog grouped by topic: data engineering, pipeline architecture, and the decisions behind each system.',
  },
  cv: {
    es: 'Hoja de vida de Santiago Gelvez, Ingeniero de Datos: experiencia, formación, certificaciones y stack. Versión navegable y descargable en PDF.',
    en: 'Résumé of Santiago Gelvez, Data Engineer: experience, education, certifications, and stack. Browsable version, downloadable as a PDF.',
  },
  contact: {
    es: 'Cómo contactar a Santiago Gelvez, Ingeniero de Datos en Duitama, Boyacá, Colombia. Formulario de contacto y enlaces a GitHub y LinkedIn.',
    en: 'How to reach Santiago Gelvez, Data Engineer based in Duitama, Boyacá, Colombia. Contact form plus links to GitHub and LinkedIn.',
  },
  privacy: {
    es: 'Qué datos recoge este sitio, quién los procesa y por cuánto tiempo. Analítica sin cookies y un formulario de contacto que no almacena nada.',
    en: 'What data this site collects, who processes it, and for how long. Cookieless analytics and a contact form that stores nothing at all.',
  },
};
