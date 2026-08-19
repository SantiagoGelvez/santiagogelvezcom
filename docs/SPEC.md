# Proyecto: sitio personal santiagogelvez.com

Especificación completa: contexto, decisiones tomadas, restricciones y criterios de aceptación.

> **Estado del documento.** La fase 0 (análisis y plan) ya se ejecutó el 2026-08-19. Las contradicciones que tenía la versión original están resueltas e incorporadas aquí; cada punto corregido lleva un puntero al ADR correspondiente en `DECISIONS.md`, que es donde vive el razonamiento completo.
>
> **Regla de desempate:** si este documento y un ADR se contradicen, gana el ADR más reciente y hay que actualizar este archivo (ADR-0010).
>
> **Para saber en qué punto va el trabajo, este no es el archivo.** Es `NEXT.md`.

---

## 0. Cómo quiero que trabajes

- **Incrementos pequeños y verificables.** Nada de generar el sitio completo de un tirón. Cada paso debe poder correrse y verse.
- **Confírmame los cambios estructurales antes de hacerlos** (framework, esquema de datos, estructura de rutas). Los cambios cosméticos no necesitan confirmación.
- **Mantén `DECISIONS.md` en la raíz del repo.** Formato ADR ligero, una entrada por decisión: fecha, decisión, alternativas consideradas, por qué, qué se sacrificó. Las decisiones de este documento ya están volcadas ahí.
- **Mantén `NEXT.md`.** Al final de cada sesión: qué quedó hecho, qué sigue, y en qué estado está el repo. Trabajo en sesiones de ~2 horas separadas por una semana; sin esto pierdo la mitad del tiempo recordando dónde iba.
- **Deja el repo desplegable al final de cada sesión.** Nunca a mitad de una refactorización.
- **Si algo de este plan te parece un error, dímelo.** No quiero obediencia, quiero criterio. Tengo fondo técnico: no simplifiques las explicaciones.
- Conversación y `DECISIONS.md` en español. Código, nombres de archivos, ramas y commits en inglés.

---

## 1. Contexto

**Quién soy.** Santiago Gelvez, ingeniero electrónico (UPTC), basado en Duitama, Boyacá, Colombia. Experiencia en ingeniería de datos (ADF, Airflow, dbt, AWS), gestión de servicios de TI, desarrollo fullstack/backend y automatización de procesos.

**Foco actual.** Ingeniería de datos, con interés particular en el cruce de datos e IA. Certificaciones en curso: AWS DEA-C01 y Databricks.

**Para qué sirve este sitio.** Es un portafolio profesional, no un experimento técnico. Su trabajo es demostrar criterio de ingeniería de datos con evidencia verificable: proyectos reales con su arquitectura, decisiones técnicas argumentadas con sus trade-offs, y escritura que muestra cómo pienso los sistemas. Un listado de tecnologías no demuestra nada; un caso de estudio que explica qué se sacrificó y por qué, sí.

**El sitio es un medio para un fin.** No es un proyecto de aprendizaje frontend. Ya sé construir esto; construirlo no enseña nada que aparezca en una vacante de datos. Optimiza por salir a producción y por costo de mantenimiento bajo, no por sofisticación.

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

- **Sitio 100% estático.** Sin servidor, sin base de datos, sin runtime que mantener. La excepción que se llegó a contemplar —un handler para emitir 410— no hace falta: Search Console confirmó que no hay rutas que retirar. Ver la actualización del ADR-0005.
- **Contenido en archivos versionados en git.** Nada de CMS.
- **Hosting: Cloudflare Workers con assets estáticos** (no Pages). Cloudflare recomienda Workers para proyectos nuevos y concentra ahí todo el desarrollo de features; Pages sigue soportado pero sin inversión nueva. Gratis, ancho de banda no medido, sin cláusula de uso no comercial. Ver ADR-0005.
- **Dominio: registrado en Namecheap.** **Los nameservers ya están delegados a Cloudflare** (verificado 2026-08-19: `melina/dale.ns.cloudflare.com`) y el MX de Google Workspace está intacto (`1 smtp.google.com`). No queda migración de DNS pendiente, solo repuntar el origen desde S3. **No tocar los registros MX**: el correo no puede caerse. Verificar con `dig +short MX santiagogelvez.com` después de cualquier cambio de origen.
- **Deploy automático desde git push.** Con previews por rama.
- **Framework: Astro.** Decisión cerrada, ver ADR-0002. El argumento decisivo no es el soporte de Markdown sino §6: la validación de los archivos de data por esquema en tiempo de build es un requisito nombrado, y Astro la ofrece como primitiva (Content Layer + esquemas Zod) en lugar de pegamento propio. TypeScript estricto, integraciones limitadas a `mdx` y `sitemap`, versiones fijas. El precio aceptado es deuda de actualización: revisión trimestral anotada en `NEXT.md`.

**Descartados y por qué** (regístralo en `DECISIONS.md`):

- **AWS S3 + CloudFront.** No es una alternativa hipotética: **es el hosting actual**, y salir de él es lo que deja limpia la cuenta AWS. Mi free tier terminó y quiero conservar esa cuenta para proyectos de datos, que es donde el gasto compra aprendizaje relevante. Además no da build automático sin montar CI aparte.
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

Propón tú el formato concreto de los archivos de data y valídalo con esquemas en tiempo de build. Un error de tipeo en una fecha no debe llegar a producción. Este es el requisito que decidió el framework (ADR-0002): se implementa con Content Layer y esquemas Zod, no con validación artesanal.

### Dos ejes de filtrado, no uno

El modelo tiene **dos filtros distintos que no se pueden implementar como uno solo**, o el primer PDF que se genere va a filtrar mal:

| Eje | Granularidad | Pregunta que responde |
|---|---|---|
| `visible_en[]` | **registro** | ¿Este empleo aparece en esta salida? |
| Marca de campo público | **campo** | ¿Este dato puede salir del computador? |

Un registro puede estar en `visible_en: [sitio, cv-datos]` y aun así tener campos que nunca llegan a una salida pública. Ver §7 y ADR-0006.

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

**Corolario sobre `clave_traduccion`.** §8 la exige para "cada pieza", pero solo hace falta construirla una vez, para los posts: como son un archivo por idioma, necesitan una clave explícita que los empareje. Los proyectos ya son bilingües en línea, así que **el `id` del registro es su propia clave** y no lleva campo aparte. Un mecanismo, no dos.

---

## 7. CV: tres salidas desde una fuente

1. **Página `/es/cv/` y `/en/cv/`** — versión para humanos: enlaces vivos a proyectos, repos y credenciales. Indexable. Cuando alguien busque mi nombre, esta página debe salir.
2. **PDF público** — descargable desde el sitio. Sin teléfono. Es el que cualquiera puede bajar.
3. **PDF completo** — con teléfono, para cuando aplico directo.

Cada campo del modelo lleva marca de si es público; el PDF público omite lo que no lo sea. Ese filtro es por campo y es distinto de `visible_en[]`, que es por registro (§6).

### Cuántos PDFs, y dónde vive cada uno

**Cuatro se generan, dos se despliegan.** Ver ADR-0011.

| Variante | Idioma | ¿Dónde se genera? | ¿Se despliega? |
|---|---|---|---|
| `cv-datos` público | es | en build | Sí, enlazado |
| `cv-datos` público | en | en build | Sí, enlazado |
| `cv-datos` completo | es | **solo en local** | **No** |
| `cv-datos` completo | en | **solo en local** | **No** |

`cv-itsm` queda registrado en `variantes_cv[]` pero no se genera hasta que se necesite: una vez existe el pipeline, la variante extra cuesta minutos.

**El PDF completo nunca entra al directorio de build desplegado.** La idea original —generarlo en build y protegerlo dejándolo sin enlazar y fuera del sitemap— es seguridad por oscuridad: el archivo se sirve igual a quien adivine la ruta o reciba el enlace reenviado. En su lugar, el teléfono vive en un archivo ignorado por git y el PDF completo se produce con un comando local (`npm run cv:full`) cuya salida está en `.gitignore`. Mismo pipeline, mismo origen de datos, distinto disparador. La regla se vuelve imposible de violar por construcción en vez de depender de disciplina. Ver ADR-0006.

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
- **Fecha de actualización visible, derivada del `git log` de los archivos de data, no de la fecha de build.** Si se toma del build, el CV se ve "actualizado" cada vez que se publica un post sin haberlo tocado.

### Cómo se generan

**Imprimiendo la propia ruta `/cv/` con un navegador headless (Playwright)**, no con una segunda cadena de herramientas. Typst o LaTeX darían mejor control tipográfico, pero crean un segundo lugar donde vive el CV — exactamente lo que §6 prohíbe. Ver ADR-0007.

Eso obliga a una **hoja de estilos de impresión, que no es opcional por dos razones**: alimenta el pipeline de PDF, y sin ella un reclutador que haga Ctrl+P sobre `/es/cv/` imprime el modo oscuro. Se paga una vez y sirve dos veces.

**La prueba de compatibilidad ATS es un script automatizado, no una revisión a ojo.** Extrae el texto del PDF (`pdftotext`) y verifica que aparezcan los encabezados de sección estándar y que **el teléfono no aparezca en las variantes públicas**. Corre en CI.

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
- **Fuentes autohospedadas, nunca desde el CDN de Google.** No es solo rendimiento: cargar `fonts.googleapis.com` transmite la IP de cada visitante a Google, lo que choca con §11. El sitio anterior lo hacía; el nuevo no.
- **`noindex` en las páginas de categoría con menos de 3 posts.** Con 3 categorías fijas × 2 idiomas son 6 páginas que al lanzar nacen vacías o con un solo post, y Google las trata como contenido delgado o *soft 404*. La regla va en el código, evaluada en build, no en la memoria. Ver ADR-0012.
- **Migración:** el sitio actual es una sola página sin autoridad acumulada. No hay legado que preservar más allá de una redirección 301 de la raíz a `/es/`.

**Nota estratégica:** los posts de "X vs Y" tienen intención de búsqueda real. En inglés compito con Databricks, AWS e IBM y no voy a ganar. **En español el terreno está mucho menos saturado**, y por eso el español no es el idioma secundario del sitio: es donde realmente peleo por tráfico.

---

## 11. Privacidad

Esto es prioritario, no un checkbox.

### Tarea previa urgente — ejecutada el 2026-08-19

El dominio servía una visualización que publicaba información personal de rutina. Se retiró del repositorio y se archivó fuera de él; la historia de git arranca limpia para no hacerla permanente. Ver ADR-0004.

**Corrección respecto al plan original: el 410 no aplica en ningún lado.** La visualización vivía en `/`, y §5 convierte esa misma ruta en la puerta del sitio nuevo, así que ahí es imposible por definición. Y Search Console confirmó que no tuvo URLs propias además de la raíz, así que no queda ninguna otra ruta candidata. Lo que se hizo, y era lo correcto: reemplazo de contenido, borrado de los objetos del bucket, purga de caché y solicitud de remoción. Google reindexa lo nuevo.

Y un detalle operativo que se olvida: **borrar los archivos locales no borra los objetos del bucket.** Mientras `js/` y `css/` sigan en S3, el dato sigue siendo público y direccionable aunque la portada cambie.

### Qué nunca se publica

Teléfono, dirección exacta, número de documento, fecha de nacimiento, firma escaneada, fotos familiares. Ni en el sitio ni en el PDF público. La ciudad sí ("Duitama, Boyacá, Colombia"): ayuda con los filtros geográficos de reclutadores y no compromete nada.

### Correo

Nunca en texto plano — se cosecha en semanas. Usar un alias del dominio dedicado al sitio, rotable si se llena de spam. Nunca mi correo principal de Workspace.

### Formulario de contacto

Que **reenvíe y olvide**. No almacenar mensajes en ninguna parte. Datos que no guardo son datos que no tengo que proteger, declarar ni borrar cuando alguien lo pida. Usar un servicio de formularios que reenvíe por correo, sin backend propio.

**Criterio de selección del proveedor: que no persista el mensaje.** No "que sea gratis y fácil". Varios servicios populares del tier gratuito sí guardan los envíos en su panel: cumplen "sin backend propio" e incumplen "no almacenar". Hay que verificarlo en su documentación al momento de implementar, no asumirlo. Y cualquier tercero ahí es un encargado del tratamiento que la política de datos debe nombrar por su nombre.

### Obligaciones legales

- **Colombia, Ley 1581 de 2012:** al recolectar datos personales por formulario se requiere política de tratamiento de datos y autorización explícita. Checkbox junto al formulario y página `/privacidad/`.
- **GDPR:** con versión en inglés van a llegar visitantes europeos.
- **Forma barata de cumplir ambos:** recolectar lo mínimo, no usar cookies de rastreo, y elegir analítica sin cookies (Cloudflare Web Analytics). Eso además elimina la necesidad del banner de consentimiento.

**La analítica es un entregable, no solo un argumento de cumplimiento.** Cloudflare Web Analytics se instala en la fase 7 y se declara en la página de privacidad: aunque no use cookies, sí envía datos de visita a Cloudflare y eso hay que decirlo.

### Terceros

Nada de nombres de clientes, compañeros ni cifras internas de Solvo, El Tiempo o Tigo. Las cifras de trabajo real van anonimizadas o como porcentajes. Los proyectos personales esquivan el problema por completo.

### Repos

Antes de enlazar públicamente cualquier repo: revisar que no haya claves, endpoints internos ni correos personales en el historial de commits. El sitio le va a mandar tráfico a esos repos.

---

## 12. Contenido de lanzamiento

**Dos casos de estudio y dos posts.** Menos que eso, el sitio se ve recién nacido.

| Pieza | Estado | Idiomas |
|---|---|---|
| Caso de estudio: lakehouse con arquitectura medallion (PySpark, Delta Lake, Unity Catalog) | Proyecto hecho; falta narrarlo | es + en |
| Caso de estudio: pipeline FIFA World Cup 2026 (Python, Airflow, dbt, Databricks, API-Football) | El pipeline se construye aparte | es + en |
| Post: ETL vs ELT | Por escribir | es |
| Post: Warehouse vs Lake vs Lakehouse | Por escribir | es |

**Los casos de estudio salen bilingües; los posts no.** Los posts son tráfico, y el español es donde hay terreno menos saturado. Los casos de estudio no son tráfico: son la prueba de competencia que lee un hiring manager. Un `/en/` con home y CV en inglés pero los casos en español queda hueco justo donde se juega la credibilidad. Ver ADR-0008.

**El pipeline del Mundial no es trabajo de sitio.** Construirlo es un proyecto de datos de decenas de horas que corre en un carril separado; este proyecto solo lo **narra**. Empezar por el caso del lakehouse, que ya está construido, para probar las plantillas contra una pieza real.

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
3. Los dos casos de estudio están publicados **en ambos idiomas** y los dos posts en español, con el cruce entre ellos.
4. `/es/cv/` y `/en/cv/` renderizan desde la data. Los **dos PDFs públicos** se generan en build y pasan la prueba automatizada de extracción de texto; los dos completos se generan en local con el mismo pipeline.
5. La prueba de extracción confirma que **el teléfono no aparece en ninguna variante pública**, y los PDFs completos no están en el directorio desplegado ni en el repositorio.
6. La hoja de estilos de impresión existe: Ctrl+P sobre `/es/cv/` produce una página legible.
7. Sitemap, robots, canonical, `hreflang` y JSON-LD verificados. Las categorías con menos de 3 posts salen con `noindex`.
8. El formulario de contacto entrega correo y no almacena nada —verificado en la documentación del proveedor—; la página de privacidad existe, está enlazada y nombra al proveedor y a la analítica.
9. La analítica sin cookies está instalada.
10. ✅ *Cumplido en la fase 0:* la visualización anterior está eliminada del bucket (no solo del repo), verificada con 404 en vivo, y Search Console está limpio.
11. ✅ *Cumplido desde antes:* el dominio apunta a Cloudflare, con SSL activo y los MX de Workspace intactos y verificados.
12. Core Web Vitals en verde en móvil.
13. `DECISIONS.md` y `NEXT.md` al día.

---

## 16. Dónde empieza cada sesión

**No aquí.** Esta sección contenía las instrucciones de arranque de la fase 0, que se ejecutó el 2026-08-19: análisis de contradicciones, decisión de framework y plan por fases. Sus resultados están repartidos donde corresponde — las resoluciones en este documento, el razonamiento en `DECISIONS.md`, el plan en `NEXT.md`.

Cada sesión empieza leyendo **`NEXT.md`**.

Queda una pregunta abierta de la fase 0, que hay que responder antes de la fase 6: **qué dice el sitio sobre disponibilidad**, si es que dice algo. §3 la lista como una de las preguntas que trae el lector. Es una decisión deliberada, no de redacción, y se toma fuera de este documento.
