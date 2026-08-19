# Proyecto: sitio personal santiagogelvez.com

Vas a construir mi sitio personal desde cero. Este documento es la especificación completa: contexto, decisiones ya tomadas, restricciones y criterios de aceptación. Léelo entero antes de proponer nada.

---

## 0. Cómo quiero que trabajes

- **No escribas código en tu primera respuesta.** Fase 0 es: leer esto, señalar contradicciones o riesgos, hacerme las preguntas que falten, y proponer un plan de fases con estimación de esfuerzo.
- **Incrementos pequeños y verificables.** Nada de generar el sitio completo de un tirón. Cada paso debe poder correrse y verse.
- **Confírmame los cambios estructurales antes de hacerlos** (framework, esquema de datos, estructura de rutas). Los cambios cosméticos no necesitan confirmación.
- **Mantén `DECISIONS.md` en la raíz del repo.** Formato ADR ligero, una entrada por decisión: fecha, decisión, alternativas consideradas, por qué, qué se sacrificó. Empieza volcando ahí las decisiones de este documento.
- **Mantén `NEXT.md`.** Al final de cada sesión: qué quedó hecho, qué sigue, y en qué estado está el repo. Trabajo en sesiones de ~2 horas separadas por una semana; sin esto pierdo la mitad del tiempo recordando dónde iba.
- **Deja el repo desplegable al final de cada sesión.** Nunca a mitad de una refactorización.
- **Si algo de este plan te parece un error, dímelo.** No quiero obediencia, quiero criterio. Tengo fondo técnico: no simplifiques las explicaciones.
- Conversación y `DECISIONS.md` en español. Código, nombres de archivos, ramas y commits en inglés.

---

## 1. Contexto

**Quién soy.** Santiago Gelvez, ingeniero electrónico (UPTC), basado en Duitama, Boyacá, Colombia. Hoy soy ITSM Coordinator en Solvo. Antes fui Data Engineer en Editorial El Tiempo (ADF, Airflow, dbt, AWS) y antes de eso estuve en Tigo. Tengo fondo de desarrollo fullstack/backend, pipelines de datos y automatización de procesos.

**Qué estoy haciendo.** Estoy en transición de vuelta a Data Engineering, con interés en el cruce de datos e IA. Estoy construyendo portafolio, preparando certificaciones (AWS DEA-C01, Databricks) y aplicando activamente a vacantes.

**Para qué sirve este sitio.** Es un activo de búsqueda de empleo, no un experimento técnico. Su trabajo es resolver una objeción específica antes de que el lector la formule: mi trayectoria es Tigo → El Tiempo (Data Engineer) → Solvo (ITSM). Un reclutador de datos lee eso como "se salió del área". El sitio existe para demostrar lo contrario con evidencia: proyectos reales, decisiones técnicas argumentadas, y escritura que muestra criterio.

**El sitio es un medio para un fin.** No es un proyecto de aprendizaje frontend. Ya sé construir esto; construirlo no me enseña nada que aparezca en una vacante de datos. Optimiza por salir a producción y por costo de mantenimiento bajo, no por sofisticación.

---

## 2. Restricciones duras

| Restricción | Valor |
|---|---|
| Tiempo disponible | ~2 horas por semana |
| Presupuesto de infraestructura | $0/mes. Sin excepciones. |
| Alcance | Mínimo viable con calidad. Ver §12 (fuera de alcance). |
| Mantenimiento | Todo lo que requiera atención recurrente es un costo, y hay que justificarlo |

El trabajo estructural (modelo de datos, plantillas, i18n, generación de PDF) tolera mal la fragmentación. Agrúpalo en las primeras fases para que yo pueda atacarlo en uno o dos bloques largos. El contenido sí se puede escribir de a pedazos.

---

## 3. Audiencia y posicionamiento

Tres audiencias, cada una entra por una puerta distinta. No compiten, pero el home tiene un solo dueño.

| Zona | Audiencia | Qué busca | Modo de lectura |
|---|---|---|---|
| Home | Reclutador Colombia/LATAM | ¿Es Data Engineer? ¿Qué nivel? ¿Está disponible? | Escaneo de 10 segundos |
| Proyectos | Hiring manager técnico | ¿Sabe decidir, o solo seguir tutoriales? | Lectura de 3-5 min |
| Blog | Comunidad de datos | ¿Aprendo algo de este tipo? | Llega desde buscador o LinkedIn |
| CV | Todas | Formato conocido, descargable | Lo pasan por un ATS |

El home le habla al reclutador LATAM. No intentes que le hable a las tres a la vez: de ahí salen los "apasionado por la tecnología y los datos" que no dicen nada.

---

## 4. Stack y hosting

**Decisiones tomadas:**

- **Sitio 100% estático.** Sin servidor, sin base de datos, sin runtime que mantener.
- **Contenido en archivos versionados en git.** Nada de CMS.
- **Hosting: Cloudflare** (Pages o Workers con assets estáticos — verifica cuál es la ruta recomendada hoy, Cloudflare está consolidando Pages dentro de Workers). Gratis, ancho de banda no medido, sin cláusula de uso no comercial.
- **Dominio: registrado en Namecheap.** Se delegan nameservers a Cloudflare. **No tocar los registros MX**: el correo del dominio corre en Google Workspace y no puede caerse.
- **Deploy automático desde git push.** Con previews por rama.
- **Framework propuesto: Astro.** Razones: contenido en Markdown/MDX como ciudadano de primera clase, i18n con rutas incluido, salida estática por defecto, JavaScript mínimo enviado al cliente, y bajo costo de mantenimiento a largo plazo. **Si tienes un argumento fuerte para otra cosa, plantéalo en fase 0**; después de fase 0 la decisión queda cerrada.

**Descartados y por qué** (regístralo en `DECISIONS.md`):

- **AWS S3 + CloudFront.** Mi free tier terminó y quiero conservar esa cuenta limpia para proyectos de datos, que es donde el gasto compra aprendizaje relevante. Además no da build automático sin montar CI aparte.
- **Vercel.** El plan Hobby está restringido a uso personal no comercial. Si algún día uso el sitio para captar clientes de consultoría, entro en zona gris.
- **Base de datos (Supabase u otra).** No hay nada que guardar en runtime. Además el tier gratuito de Supabase pausa proyectos por inactividad, que es exactamente el peor comportamiento para un sitio personal de tráfico irregular.

**Si en algún momento parece que hace falta una base de datos, es señal de que el alcance se salió de control.** Consúltamelo antes.

---

## 5. Mapa del sitio

```
/                       → redirige a /es/
/es/                    Home
/es/sobre-mi/           Trayectoria + formación + certificaciones
/es/proyectos/          Índice de proyectos
/es/proyectos/{slug}/   Caso de estudio
/es/blog/               Índice del blog
/es/blog/{slug}/        Post
/es/blog/tema/{slug}/   Categoría
/es/cv/                 CV navegable + descarga PDF
/es/contacto/
/es/privacidad/
```

Espejo completo en `/en/` con slugs de sección traducidos (`/en/about/`, `/en/projects/`, `/en/blog/`, `/en/cv/`, `/en/contact/`, `/en/privacy/`).

**Formación y certificaciones no llevan página propia.** Van como secciones dentro de "Sobre mí". Una página dedicada con seis certificaciones se ve vacía.

---

## 6. Modelo de datos

**Principio rector:** lo estructurado es *data*; lo narrativo es *contenido*.

- **Data** (perfil, experiencia, educación, certificaciones, skills, proyectos): archivos estructurados, una sola fuente de verdad, se consultan y filtran.
- **Contenido** (posts, casos de estudio): Markdown/MDX, un archivo por pieza.
- **El CV no es un documento: es una vista sobre la data.**

Propón tú el formato concreto de los archivos de data y valídalo con esquemas en tiempo de build. Un error de tipeo en una fecha no debe llegar a producción.

### Entidades

**`perfil`** — nombre, headline (es/en), resumen (es/en), ciudad, país, enlaces (GitHub, LinkedIn, Platzi), correo de contacto.

**`experiencia[]`** — empresa, cargo (es/en), fecha inicio, fecha fin (vacío = actual), modalidad, descripción (es/en), logros[] (viñetas, es/en), stack[], `visible_en[]`.

> `visible_en` indica en qué salidas aparece cada registro: `sitio`, `cv-datos`, `cv-itsm`. Es lo que hace baratas las variantes del CV: mi rol en Solvo aparece completo en el CV de ITSM y resumido en el de datos, sin duplicar información.

**`educacion[]`** — institución, título, fechas.

**`certificaciones[]`** — nombre, emisor, fecha de obtención, fecha de vencimiento (opcional), ID de credencial, URL de verificación, estado (`obtenida` / `en-curso` / `planeada`).

> El estado `en-curso` es deliberado: mostrar el DEA-C01 en progreso comunica trayectoria activa.

**`skills[]`** — nombre, categoría (lenguajes, procesamiento, orquestación, almacenamiento, cloud, BI, prácticas).

> **Sin niveles, sin porcentajes, sin barras de progreso.** "Python 85%" es una de las señales más confiables de portafolio junior.

**`proyectos[]`** — slug (es/en), título (es/en), resumen (es/en), rol, periodo, estado (`activo` / `terminado` / `pausado`), stack[], URL de repo, URL de demo, diagrama, destacado (bool), orden, posts relacionados[].

**`posts`** (frontmatter) — slug, título, resumen, fecha de publicación, fecha de actualización, categoría, tags[], idioma, `clave_traduccion`, proyecto relacionado, estado (`borrador` / `publicado`).

**`variantes_cv[]`** — id, cargo objetivo, idioma, criterio de filtrado, orden de secciones.

### Estrategia bilingüe por tipo

- **Data → campos bilingües en línea.** Un cargo o un logro son textos cortos que siempre existen en ambos idiomas; viven juntos en el mismo registro.
- **Contenido → un archivo por idioma.** Los posts no tienen paridad (ver §8), así que forzar un formato pareado dejaría huecos vacíos.

---

## 7. CV: tres salidas desde una fuente

1. **Página `/es/cv/` y `/en/cv/`** — versión para humanos: enlaces vivos a proyectos, repos y credenciales. Indexable. Cuando alguien busque mi nombre, esta página debe salir.
2. **PDF público** — descargable desde el sitio. Sin teléfono. Es el que cualquiera puede bajar.
3. **PDF completo** — con teléfono, para cuando aplico directo. Generado por el mismo pipeline pero **no enlazado desde el sitio ni incluido en el sitemap**.

Cada campo del modelo lleva marca de si es público; el PDF público omite lo que no lo sea.

### Reglas del PDF (obligatorias)

El PDF va directo a sistemas ATS. Diseña para el parser, no para el ojo:

- Una sola columna.
- Texto seleccionable real. Nunca texto dentro de imágenes.
- Encabezados de sección estándar: "Experiencia", "Educación", "Certificaciones", "Habilidades".
- Sin tablas, sin cajas de texto, sin columnas paralelas.
- Sin iconos como portadores de información (un icono de teléfono no le dice nada al parser).
- Nada crítico en encabezado ni pie de página: muchos parsers los descartan.
- Fuentes embebidas y estándar.
- Nombre de archivo con convención fija y legible — el reclutador lo ve.
- Un PDF por idioma.
- Generación en tiempo de build, versionada, con fecha de actualización visible.

### El titular

**El headline del CV dice "Data Engineer" / "Ingeniero de Datos".** Ese es el string que los reclutadores buscan y que el parser sabe mapear. Títulos inventados como "AI Data Analytics Engineer" me sacan de las búsquedas booleanas. El ángulo de IA va en la línea de resumen y en las skills, no en el titular.

---

## 8. Slugs e idiomas

**Prefijo explícito en ambos idiomas.** `/es/…` y `/en/…`. La raíz `/` redirige a `/es/` y se declara como `x-default`.

**Nada de detección automática del idioma del navegador con redirección.** Confunde a los buscadores y manda al idioma equivocado a un colombiano con Chrome en inglés. En su lugar: si el idioma del navegador no coincide con el de la página, muestra un aviso discreto y descartable ofreciendo cambiar.

**Slugs traducidos, no compartidos:**

```
/es/proyectos/mundial-2026
/en/projects/world-cup-2026
```

Un slug en español posiciona en búsquedas en español. Reutilizar el inglés desperdicia la mitad del beneficio de ser bilingüe.

**Por lo tanto, el selector de idioma no manipula la URL.** Cada pieza lleva una `clave_traduccion` estable e invisible; el selector resuelve por esa clave. Si intentas traducir rutas con reemplazo de texto se rompe el primer día.

### Reglas de slug

- Minúsculas, ASCII, guiones. Sin tildes; `ñ` → `n`.
- Sin fechas ni números. Una fecha en la URL envejece el post y me impide actualizarlo sin que se vea viejo.
- Cortos y descriptivos: `etl-vs-elt`, no `diferencias-entre-etl-y-elt-explicadas`.
- **Permanentes.** Si uno cambia, se registra una redirección. Crea el archivo de redirecciones desde el día uno, aunque nazca vacío.

### El caso crítico: contenido sin traducción

Solo traduzco los posts pilares. La mayoría existirá en un solo idioma. Comportamiento requerido:

- **El selector nunca se desactiva ni desaparece.**
- Desde un post que solo existe en español, el selector lleva al **índice del blog en inglés**, con un aviso de que esa pieza solo está disponible en español. Nunca un 404, nunca un callejón sin salida.
- En el post mismo, una línea **en el otro idioma** al inicio avisando que solo está en español. Así un visitante angloparlante decide en dos segundos en vez de traducir media página para descubrirlo.
- **`hreflang` solo entre pares que existen de verdad.** Declararlo hacia una página inexistente es un error que Search Console reporta.

---

## 9. Plantillas de contenido

### Blog: taxonomía

Tres categorías, fijas. Si algo no cabe, se fuerza a caber; no se crea una cuarta.

| Categoría | Contenido |
|---|---|
| **Fundamentos** | Conceptos y comparaciones: ETL vs ELT, Warehouse/Lake/Lakehouse, CTE vs subquery |
| **Decisiones** | Por qué elegí X sobre Y en un contexto real, y qué sacrifiqué |
| **Bitácora** | Capítulos de un proyecto: qué construí, qué se rompió, cómo lo arreglé |

Los nombres de herramientas (dbt, Airflow, Databricks, AWS) son **tags**, no categorías.

### Blog: anatomía de un post

1. **El problema real** — de dónde salió la pregunta, idealmente de algo que me pasó construyendo. Dos o tres párrafos.
2. **La respuesta corta, arriba** — antes del desarrollo. Respeta al lector apurado y es lo que los buscadores levantan como fragmento destacado.
3. **Desarrollo** con ejemplos concretos.
4. **Cuándo NO aplica** — los trade-offs, los casos donde la respuesta se invierte. Esta sección es la que distingue un post de ingeniero de un tutorial reciclado.
5. **Tabla de decisión** — qué usar en qué escenario.
6. **Referencias.**

**Regla innegociable: cada post lleva al menos una postura defendible.** Un post que explica ETL y ELT sin decir cuál elegiría yo y por qué es indistinguible de otros diez mil.

### Índice del blog

Cronológico, con filtro por categoría, y una franja fija arriba con tres posts pilares — "empieza por aquí". Esos tres son los que se traducen al inglés. La franja es importante porque a una publicación al mes el índice cronológico se ve lento; los pilares mantienen lo mejor visible.

### Proyectos: anatomía de un caso de estudio

Dos niveles: tarjeta en el índice (título, una línea, stack, estado) y página completa.

1. **Encabezado** — qué es en una línea, estado, stack en chips, enlaces a repo y diagrama.
2. **El problema de negocio** — sin esto es un tutorial. "Quería practicar Airflow" no es un problema de negocio.
3. **Requisitos y restricciones** — incluyendo presupuesto y tiempo. Decir "tenía 40 dólares y tres semanas" no es debilidad: es la restricción que justifica las decisiones.
4. **Arquitectura** — diagrama más narrativa del flujo.
5. **Decisiones y trade-offs** — formato fijo por decisión: qué decidí / qué alternativas consideré / por qué / qué sacrifiqué.
6. **Qué salió mal** — datos sucios, cambios de esquema en la API, costos que se dispararon, backfills fallidos.
7. **Resultado** — qué preguntas se pueden responder ahora, capturas del dashboard.
8. **Qué haría distinto.**
9. **Posts relacionados.**

**Las secciones 5 y 6 son las que hacen que el caso de estudio funcione.** Si hay que recortar, se recorta todo lo demás antes que esas dos. La plantilla debe hacerlas difíciles de omitir.

---

## 10. SEO y metadatos

- Un solo `H1` por página; jerarquía semántica de encabezados.
- Canonical automática en cada página.
- `sitemap.xml` generado en build con ambos idiomas. `robots.txt`.
- **Títulos:** patrón `Título — Santiago Gelvez`. Home: `Santiago Gelvez — Ingeniero de Datos`.
- **Meta description:** el campo `resumen` de cada pieza, escrito a mano, 150-160 caracteres. Nunca truncado automáticamente del primer párrafo.
- **JSON-LD:** `Person` en el home, con `sameAs` hacia GitHub y LinkedIn — es lo que le permite a Google entender que las tres cosas son la misma persona, y eso importa mucho cuando la marca es mi nombre. `BlogPosting` en los posts. `BreadcrumbList` donde aplique.
- **Open Graph:** imagen generada en build a partir del título. Diseñar treinta imágenes a mano no va a pasar; una plantilla que se rellena sola, sí.
- **Rendimiento como SEO:** fuentes servidas localmente, imágenes en formato moderno con dimensiones declaradas, JavaScript mínimo. Core Web Vitals en verde debe ser el estado por defecto, no un esfuerzo posterior.
- **Migración:** el sitio actual es una sola página sin autoridad acumulada. No hay legado que preservar más allá de una redirección 301 de la raíz a `/es/`.

**Nota estratégica:** los posts de "X vs Y" tienen intención de búsqueda real. En inglés compito con Databricks, AWS e IBM y no voy a ganar. **En español el terreno está mucho menos saturado**, y por eso el español no es el idioma secundario del sitio: es donde realmente peleo por tráfico.

---

## 11. Privacidad

Esto es prioritario, no un checkbox.

### Tarea previa urgente

Hoy el dominio sirve una visualización de mi planilla semanal que publica mi rutina hora por hora, incluyendo cuándo estoy y cuándo no estoy en casa. **Se elimina por completo.** Pasos: retirar la página, responder **410** en esa ruta (le dice a Google que no existe y no va a volver, más limpio que un 404), y solicitar la eliminación de la URL en Search Console para acelerar la desindexación y limpiar la caché.

### Qué nunca se publica

Teléfono, dirección exacta, número de documento, fecha de nacimiento, firma escaneada, fotos familiares. Ni en el sitio ni en el PDF público. La ciudad sí ("Duitama, Boyacá, Colombia"): ayuda con los filtros geográficos de reclutadores y no compromete nada.

### Correo

Nunca en texto plano — se cosecha en semanas. Usar un alias del dominio dedicado al sitio, rotable si se llena de spam. Nunca mi correo principal de Workspace.

### Formulario de contacto

Que **reenvíe y olvide**. No almacenar mensajes en ninguna parte. Datos que no guardo son datos que no tengo que proteger, declarar ni borrar cuando alguien lo pida. Usar un servicio de formularios que reenvíe por correo, sin backend propio.

### Obligaciones legales

- **Colombia, Ley 1581 de 2012:** al recolectar datos personales por formulario se requiere política de tratamiento de datos y autorización explícita. Checkbox junto al formulario y página `/privacidad/`.
- **GDPR:** con versión en inglés van a llegar visitantes europeos.
- **Forma barata de cumplir ambos:** recolectar lo mínimo, no usar cookies de rastreo, y elegir analítica sin cookies (Cloudflare Web Analytics). Eso además elimina la necesidad del banner de consentimiento.

### Terceros

Nada de nombres de clientes, compañeros ni cifras internas de Solvo, El Tiempo o Tigo. Las cifras de trabajo real van anonimizadas o como porcentajes. Los proyectos personales esquivan el problema por completo.

### Repos

Antes de enlazar públicamente cualquier repo: revisar que no haya claves, endpoints internos ni correos personales en el historial de commits. El sitio le va a mandar tráfico a esos repos.

---

## 12. Contenido de lanzamiento

**Dos casos de estudio y dos posts.** Menos que eso, el sitio se ve recién nacido.

| Pieza | Estado |
|---|---|
| Caso de estudio: pipeline FIFA World Cup 2026 (Python, Airflow, dbt, Databricks, API-Football) | Por construir |
| Caso de estudio: lakehouse con arquitectura medallion (PySpark, Delta Lake, Unity Catalog) | Proyecto hecho; falta narrarlo |
| Post: ETL vs ELT | Por escribir |
| Post: Warehouse vs Lake vs Lakehouse | Por escribir |

**Cruce obligatorio:** el post de ETL vs ELT cierra apuntando al caso de estudio del Mundial ("así lo resolví yo"), y el caso de estudio apunta al post. Ese cruce convierte piezas sueltas en un cuerpo de trabajo.

### Formación: regla de contenido

He terminado cerca de 50 cursos en Platzi y tengo cursos de Udemy. **No se enumeran.** Un listado de 50 cursos junto a dos proyectos lee "estudió mucho, construyó poco".

- **Certificaciones** (examen de tercero, verificables): enumeradas, con emisor, fecha, ID y enlace de verificación.
- **Formación formal:** una entrada (UPTC).
- **Cursos:** dos líneas agregadas en "Sobre mí" + enlace a mi perfil público de Platzi. Platzi ya mantiene y verifica esa lista; duplicarla significa 50 entradas bilingües que se desactualizan el día que termine el curso 51.
- **Cursos de preparación para certificación: no se listan nunca.** El curso es el medio; la certificación es el artefacto. Eso ya lo cubre el estado `en-curso`.
- **En el PDF: una línea, máximo.** Un bloque de 50 títulos diluye la densidad de palabras clave que mide el ATS y puede confundir al parser sobre qué es formación y qué es experiencia.

---

## 13. Dirección de diseño

Quiero algo limpio, actual y moderno **que no se vea genérico**. Yo le pondré mi estilo personal después; tú entrega un sistema sobrio y bien construido sobre el cual se pueda hacer eso.

### Descartado explícitamente

Degradado morado-azul. Hero centrado con "Hola, soy Santiago 👋". Tarjetas con sombra difusa. Barras de porcentaje en skills. Secciones de pantalla completa para mostrar tres frases. Animaciones de entrada al hacer scroll.

Tampoco quiero los tres defaults en los que converge el diseño generado por IA: (a) fondo crema con serif de alto contraste y acento terracota, (b) fondo casi negro con un único acento verde ácido o bermellón, (c) maquetación tipo periódico con filetes finos y cero radio de borde. Si llegas a uno de esos, es señal de que no decidiste: revisa y justifica el cambio.

### La dirección

**Concepto: el sitio de un ingeniero que documenta.** La referencia no es una landing de startup, es documentación técnica bien hecha cruzada con una publicación editorial. Denso en información, generoso en espacio, cero decoración.

- **Tipografía como protagonista.** Una display con carácter usada con moderación, una body cómoda para lectura larga, y **una monoespaciada para metadatos** — fechas, stack, tiempo de lectura, etiquetas. Esa mono en los metadatos es lo que da identidad técnica sin caer en el cliché de terminal.
- **Color casi monocromático** con un solo acento, usado con disciplina: enlaces y estados, nada más. El color como excepción se nota; como decoración se ignora.
- **Modo oscuro por defecto** es coherente con mi gusto y con la audiencia técnica. Diseña el sistema de color con tokens desde el inicio para que el modo claro se pueda agregar después sin rehacer nada.
- **Alineación a la izquierda, rejilla asimétrica, ancho de lectura de 65-75 caracteres.** Nada centrado.
- **El home es una portada, no un embudo.** Quién soy en dos líneas, tres proyectos, últimos posts, contacto. Todo alcanzable con poco scroll.
- **Movimiento: ninguno** más allá de transiciones de estado. Las animaciones de entrada son lo primero que envejece y lo primero que molesta en la segunda visita.

### La firma visual

**Los diagramas de arquitectura son la identidad visual del sitio.** Si todos comparten paleta, tipografía y estilo de caja y flecha, el sitio se ve inconfundiblemente mío aunque todo lo demás sea deliberadamente sobrio. Ahí es donde vale la pena gastar esfuerzo de diseño, no en animaciones.

Ángulo específico que quiero explorar: soy ingeniero electrónico. Un lenguaje visual de diagramas que tome prestado del **esquemático de circuitos** — trazos finos, ángulos rectos, nodos, densidad y precisión en lugar de cajas redondeadas con sombra — sería específico de mí, imposible de confundir con una plantilla, y coherente con cómo pienso los sistemas. Propóneme un sistema de diagramas sobre esa idea antes de dibujar el primero.

### Proceso de diseño

Antes de escribir CSS, entrégame un plan compacto: paleta de 4-6 valores con nombre, las tipografías para cada rol, un concepto de maquetación con wireframes en ASCII, y cuál es el elemento firma. Revisa ese plan contra este brief y dime qué cambiaste por genérico. Solo después construye.

### Piso de calidad (no negociable)

Responsive hasta móvil. Foco de teclado visible. `prefers-reduced-motion` respetado. Contraste accesible. Esto no se anuncia, se cumple.

---

## 14. Fuera de alcance en v1

No los construyas. No dejes andamiaje para ellos salvo donde se indique.

- Calendly o agendamiento. (Se agregará si activo consultoría freelance; que la estructura lo permita sin rediseño.)
- Sección de video / YouTube. (Igual: que la navegación no quede rígida a cinco items.)
- Comentarios.
- Newsletter y suscripción por correo.
- Buscador en el blog.
- Contadores de vistas.
- Modo claro. (Pero los tokens de color se diseñan desde el inicio para permitirlo.)
- Base de datos, autenticación, cualquier cosa con estado.
- CMS.

---

## 15. Definición de terminado para v1

El sitio está listo para publicar cuando:

1. Las diez rutas de §5 existen en español e inglés y ninguna da 404.
2. El selector de idioma funciona en todas las páginas, incluyendo el caso de contenido sin traducción.
3. Los dos casos de estudio y los dos posts están publicados, con el cruce entre ellos.
4. `/es/cv/` y `/en/cv/` renderizan desde la data, y los dos PDFs se generan en build y pasan una prueba de extracción de texto.
5. El PDF público no contiene teléfono; el completo no está enlazado ni en el sitemap.
6. Sitemap, robots, canonical, `hreflang` y JSON-LD verificados.
7. El formulario de contacto entrega correo y no almacena nada; la página de privacidad existe y está enlazada.
8. La planilla semanal está eliminada, respondiendo 410, y solicitada su eliminación en Search Console.
9. El dominio apunta a Cloudflare, con SSL activo y los MX de Workspace intactos y verificados.
10. Core Web Vitals en verde en móvil.
11. `DECISIONS.md` y `NEXT.md` al día.

---

## 16. Empieza aquí

En tu primera respuesta, **no escribas código**. Dame:

1. Contradicciones, huecos o riesgos que veas en esta especificación.
2. Tu recomendación de framework, con argumento — confirmando o rebatiendo Astro.
3. Las preguntas que necesites resueltas antes de arrancar.
4. Un plan por fases, con estimación de horas por fase, marcando cuáles toleran sesiones de dos horas y cuáles necesitan un bloque largo.
5. Qué propones hacer en la primera sesión de trabajo.
