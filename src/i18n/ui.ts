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
  /**
   * Página de contacto (SPEC §5). El formulario llega en la fase 7 con su
   * proveedor verificado; hasta entonces la página explica el orden en vez de
   * ser una ruta de relleno.
   *
   * El párrafo sobre el correo no es una disculpa: es la clase de decisión que
   * este sitio existe para mostrar. Un portafolio que argumenta sus decisiones
   * puede argumentar también esta.
   */
  contactNoForm: {
    es: 'Todavía no hay formulario. Llega con un proveedor que reenvíe y no almacene nada, que es una decisión que prefiero tomar despacio. Mientras tanto, dos caminos:',
    en: 'There is no form yet. It lands with a provider that forwards and stores nothing, which is a decision worth taking slowly. In the meantime, two ways in:',
  },
  contactQuick: {
    es: 'Para algo rápido —una pregunta, una corrección, un enlace roto— GitHub es el camino más corto.',
    en: 'For something quick — a question, a correction, a broken link — GitHub is the shortest path.',
  },
  contactWork: {
    es: 'Para hablar de trabajo, el CV en PDF lleva mis datos de contacto:',
    en: 'To talk about work, the CV as a PDF carries my contact details:',
  },
  /** Texto del enlace al PDF desde la página de contacto. */
  downloadCv: { es: 'descargar el CV en PDF', en: 'download the CV as a PDF' },
  orReadItHere: { es: 'o leerlo aquí', en: 'or read it here' },
  contactWhyNoEmail: {
    es: 'Mi correo no está escrito en ninguna página de este sitio, y es a propósito: una dirección en texto plano se cosecha en semanas. Vive dentro del PDF, que es donde hace falta.',
    en: 'My email address is written on no page of this site, and that is deliberate: a plain-text address gets harvested within weeks. It lives inside the PDF, which is where it is needed.',
  },
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
 * Encabezados de sección del CV. **Vocabulario estándar y no creativo**: el PDF
 * va directo a un ATS y el parser mapea "Experiencia" / "Experience" a un campo
 * conocido (SPEC §7). Un encabezado ingenioso —"Dónde he estado"— es texto que
 * el parser no clasifica, así que el contenido debajo se pierde.
 *
 * Las claves son las de `orden_secciones` en `variantes-cv.yml`: el orden lo
 * decide la data, las etiquetas las decide este archivo.
 */
export const cvSections = {
  perfil: { es: 'Perfil', en: 'Summary' },
  experiencia: { es: 'Experiencia', en: 'Experience' },
  proyectos: { es: 'Proyectos', en: 'Projects' },
  skills: { es: 'Habilidades', en: 'Skills' },
  certificaciones: { es: 'Certificaciones', en: 'Certifications' },
  educacion: { es: 'Educación', en: 'Education' },
} as const satisfies Record<string, Record<Locale, string>>;

export type CvSectionKey = keyof typeof cvSections;

/** Categorías de skills. El vocabulario lo cierra el esquema (SPEC §6). */
export const skillCategories = {
  lenguajes: { es: 'Lenguajes', en: 'Languages' },
  procesamiento: { es: 'Procesamiento', en: 'Processing' },
  orquestacion: { es: 'Orquestación', en: 'Orchestration' },
  almacenamiento: { es: 'Almacenamiento', en: 'Storage' },
  cloud: { es: 'Cloud', en: 'Cloud' },
  bi: { es: 'BI', en: 'BI' },
  practicas: { es: 'Prácticas', en: 'Practices' },
} as const satisfies Record<string, Record<Locale, string>>;

/** Estado de una certificación. `en-curso` comunica trayectoria activa (SPEC §6). */
export const certificationStatus = {
  obtenida: { es: 'Obtenida', en: 'Earned' },
  'en-curso': { es: 'En curso', en: 'In progress' },
  planeada: { es: 'Planeada', en: 'Planned' },
} as const satisfies Record<string, Record<Locale, string>>;

/**
 * Nombres de mes abreviados, escritos a mano y no derivados de `Intl`.
 *
 * `Intl.DateTimeFormat` da resultados distintos según los datos de ICU del Node
 * que corra el build, y en español abrevia con punto ("ago.") de forma
 * inconsistente entre versiones. Un CV cuyas fechas cambian de forma según la
 * máquina que lo generó no es aceptable, y son veinticuatro cadenas.
 */
export const months: Record<Locale, readonly string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** Cadenas del CV y de su pipeline de PDF. */
export const cv = {
  /** Empleo o proyecto sin fecha de fin. */
  present: { es: 'Actualidad', en: 'Present' },
  downloadPdf: { es: 'Descargar en PDF', en: 'Download as PDF' },
  /**
   * Fecha de actualización, derivada del `git log` de los archivos de data y
   * nunca de la fecha de build (SPEC §7). Si saliera del build, el CV se vería
   * "actualizado" cada vez que se publica un post sin haberlo tocado.
   */
  dataUpdated: { es: 'Data actualizada', en: 'Data updated' },
  credential: { es: 'Credencial', en: 'Credential' },
  verify: { es: 'Verificar', en: 'Verify' },
  expires: { es: 'Vence', en: 'Expires' },
  /** Cursos agregados en una línea (SPEC §12). Nunca enumerados. */
  courses: { es: 'Formación continua', en: 'Continuing education' },
  /** Encabezado del bloque de contacto del PDF. */
  contact: { es: 'Contacto', en: 'Contact' },
  /**
   * Reemplaza al correo en pantalla (ADR-0029). Se oculta al imprimir: dentro
   * del PDF el correo ya está impreso al lado, y este enlace sobraría.
   */
  howToReach: { es: 'Cómo contactarme', en: 'How to reach me' },
} as const satisfies Record<string, Record<Locale, string>>;

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
    es: 'Cómo contactar a Santiago Gelvez, Ingeniero de Datos en Duitama, Boyacá, Colombia. Mis datos de contacto van dentro del CV en PDF, no escritos en la web.',
    en: 'How to reach Santiago Gelvez, Data Engineer based in Duitama, Boyacá, Colombia. My contact details live inside the CV as a PDF, not written on the web.',
  },
  privacy: {
    es: 'Qué datos recoge este sitio, quién los procesa y por cuánto tiempo. Analítica sin cookies y un formulario de contacto que no almacena nada.',
    en: 'What data this site collects, who processes it, and for how long. Cookieless analytics and a contact form that stores nothing at all.',
  },
};
