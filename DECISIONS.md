# Decisiones

Registro de decisiones de arquitectura (ADR ligero). Una entrada por decisión:
fecha, decisión, alternativas consideradas, por qué, qué se sacrificó.

Orden cronológico inverso — lo más reciente arriba.

---

## ADR-0009 — El repositorio es público, y eso define dónde vive cada cosa

**Fecha:** 2026-08-19

**Decisión.** El repositorio es público. En consecuencia se separan tres destinos:
`DECISIONS.md` y `NEXT.md` en la raíz (públicos), los datos personales no publicables
fuera del versionado (ver ADR-0006), y los documentos de análisis que citan datos
sensibles fuera del repositorio por completo.

**Alternativas consideradas.** Repositorio privado, que quitaría casi todas estas
restricciones.

**Por qué.** El repositorio de un portafolio es en sí mismo evidencia: muestra cómo
se trabaja, no solo qué se construyó. Eso vale más que la comodidad de no tener que
pensar en qué se commitea. La regla operativa que se deriva: el repositorio registra
**qué se decidió y por qué**, nunca **qué se estaba exponiendo**.

**Qué se sacrificó.** Cada archivo nuevo exige una pregunta previa sobre si su
contenido es publicable. Un error aquí no se corrige borrando el archivo: queda en
`git log` y solo se elimina reescribiendo la historia.

---

## ADR-0008 — Los casos de estudio salen bilingües en v1

**Fecha:** 2026-08-19

**Decisión.** Los dos casos de estudio se publican en español e inglés desde v1. Los
posts siguen la regla original: solo se traducen los pilares.

**Alternativas consideradas.** Casos solo en español, con el selector llevando al
índice de proyectos en inglés y un aviso. Un caso bilingüe y el otro no.

**Por qué.** Los posts son tráfico y el español es donde hay terreno menos saturado;
esa lógica se sostiene. Pero los casos de estudio no son tráfico: son la prueba de
competencia técnica que lee un hiring manager. Un `/en/` con home y CV en inglés pero
los casos en español queda hueco justo donde se juega la credibilidad.

**Qué se sacrificó.** 6-8 horas adicionales de contenido, que convierten la fase de
escritura en un tercio del proyecto y empujan la fecha de publicación.

---

## ADR-0007 — Los PDFs se generan imprimiendo la propia ruta `/cv/`

**Fecha:** 2026-08-19

**Decisión.** El pipeline de PDF renderiza la ruta `/cv/` del sitio con un navegador
headless (Playwright) usando una hoja de estilos de impresión. La verificación de
compatibilidad ATS es un script automatizado: extrae el texto del PDF y comprueba que
aparezcan los encabezados de sección estándar y que el teléfono **no** aparezca en la
versión pública.

**Alternativas consideradas.** Typst o LaTeX, que darían mejor control tipográfico.

**Por qué.** Cualquier herramienta separada crea un segundo lugar donde vive el CV, y
el principio rector del modelo de datos es que el CV es una vista sobre la data, no un
documento. Imprimir la ruta garantiza texto seleccionable real y reutiliza la hoja de
impresión, que hay que escribir de todos modos: sin ella, un reclutador que haga Ctrl+P
sobre `/es/cv/` imprime el modo oscuro.

**Qué se sacrificó.** Control tipográfico fino. La paginación por CSS es más burda que
la de un motor de composición, y Playwright agrega una dependencia pesada al build.

---

## ADR-0006 — El teléfono vive fuera del versionado; el PDF completo no se despliega

**Fecha:** 2026-08-19

**Decisión.** Los campos no publicables (teléfono) viven en archivos ignorados por git.
El PDF completo se genera con un comando local cuya salida nunca entra al directorio de
build desplegado. El PDF público se genera en build y sí se despliega.

**Alternativas consideradas.** Generar ambos PDFs en build y proteger el completo
dejándolo fuera del sitemap y sin enlazar.

**Por qué.** "No enlazado y fuera del sitemap" es seguridad por oscuridad: el archivo
igual se sirve a quien adivine la ruta o reciba el enlace reenviado. Y con repositorio
público, el teléfono en un archivo de datos queda en la historia de git de forma
permanente. La regla de no publicar el teléfono debe ser imposible de violar por
construcción, no depender de disciplina.

**Qué se sacrificó.** El PDF completo no se puede regenerar desde CI: exige una máquina
con el archivo privado presente. Es el precio correcto.

---

## ADR-0005 — Hosting en Cloudflare Workers con assets estáticos, no en Pages

**Fecha:** 2026-08-19

**Decisión.** El sitio se despliega en Cloudflare Workers con assets estáticos.

**Alternativas consideradas.** Cloudflare Pages, que para un sitio de contenido puro
sería la opción más simple.

**Por qué.** Cloudflare recomienda Workers para proyectos nuevos y ha declarado que
todo el trabajo de features va allí; Pages sigue soportado pero sin desarrollo nuevo.
El factor decisivo, sin embargo, es propio del sitio: se necesita responder códigos de
estado que un sitio puramente estático no puede emitir (410 en rutas retiradas). En
Workers eso son unas pocas líneas junto a los assets; en Pages exige una Function, es
decir el mismo runtime con más pasos intermedios.

**Qué se sacrificó.** La promesa de "cero runtime que mantener" deja de ser literal.
Es una superficie mínima —un handler de rutas retiradas— pero existe y hay que
mantenerla consciente.

**Estado del dominio (verificado 2026-08-19).** Los nameservers ya están delegados a
Cloudflare (`melina/dale.ns.cloudflare.com`) y el MX de Google Workspace está intacto
(`1 smtp.google.com`). No hay migración de DNS pendiente; solo repuntar el origen.

---

## ADR-0004 — Se retira la visualización publicada en la raíz del dominio

**Fecha:** 2026-08-19

**Decisión.** Se elimina del sitio la visualización que estaba publicada en `/`, porque
exponía información personal de rutina diaria. Se archiva fuera del repositorio, no se
incorpora a la historia de git, y la raíz pasa a servir un placeholder mínimo hasta que
exista el sitio nuevo.

**Alternativas consideradas.** Conservarla en una ruta no enlazada. Commitearla como
registro histórico antes de borrarla.

**Por qué.** El contenido no era publicable bajo ningún esquema de rutas, así que
moverla no resolvía nada. Y commitearla en un repositorio público habría hecho
permanente exactamente lo que se estaba retirando: borrar el archivo después no lo
saca de `git log`. Por eso la historia del repositorio arranca limpia.

**Qué se sacrificó.** El repositorio no conserva el trabajo previo. Está archivado
fuera, recuperable, pero no versionado.

**Pendiente.** Confirmar en Search Console si la visualización tuvo URLs propias además
de la raíz. Si las tuvo, esas rutas responden 410. La raíz no puede responder 410
porque es la puerta del sitio nuevo: ahí lo que aplica es reemplazo de contenido más
purga de caché y solicitud de remoción.

---

## ADR-0003 — Sin base de datos, sin CMS, sin estado

**Fecha:** 2026-08-19 (decisión previa, registrada aquí)

**Decisión.** Sitio 100% estático. El contenido son archivos versionados en git.

**Alternativas consideradas.** Supabase u otro backend gratuito para formularios o
contenido.

**Por qué.** No hay nada que guardar en tiempo de ejecución. Además, los planes
gratuitos que pausan proyectos por inactividad son el peor comportamiento posible para
un sitio personal de tráfico irregular.

**Qué se sacrificó.** Cualquier funcionalidad con estado. Si en algún momento parece
hacer falta una base de datos, es señal de que el alcance se salió de control.

---

## ADR-0002 — Astro como framework

**Fecha:** 2026-08-19

**Decisión.** Astro, con TypeScript estricto, integraciones limitadas a `mdx` y
`sitemap`, y versiones fijadas.

**Alternativas consideradas.** Eleventy (más liviano y más estable en el tiempo).
Next.js con export estático. Hugo.

**Por qué.** El requisito decisivo es la validación de los archivos de datos por
esquema en tiempo de build: un error de tipeo en una fecha no puede llegar a
producción. Astro lo ofrece como primitiva (Content Layer + esquemas Zod, con `file()`
para datos estructurados y `glob()` para contenido MDX), lo que además mapea
directamente el principio de "lo estructurado es data, lo narrativo es contenido" y da
tipos derivados del esquema en las plantillas — que es lo que hace barato construir el
CV como vista sobre la data. Con Eleventy habría que construir a mano la validación,
el enrutamiento i18n y el pipeline de imágenes; se cambia churn de framework por código
propio, y a este alcance el código propio sale más caro. Next.js envía runtime de React
para un sitio sin estado. Hugo hace hostil el renderizado del CV desde datos y no tiene
MDX.

**Qué se sacrificó.** Deuda de actualización. Astro ha sacado cinco versiones mayores
en pocos años, y actualizar una mayor se come una sesión de trabajo entera. Mitigación:
versiones fijas, integraciones al mínimo, y una tarea trimestral explícita de
actualización anotada en `NEXT.md`. Si esa disciplina no se sostiene, la decisión
correcta habría sido Eleventy.

---

## ADR-0001 — El sitio es un activo de búsqueda de empleo

**Fecha:** 2026-08-19 (decisión previa, registrada aquí)

**Decisión.** El sitio se optimiza por salir a producción y por costo de mantenimiento
bajo, no por sofisticación técnica. Presupuesto de infraestructura: $0/mes.

Decisiones derivadas que se registran aquí en bloque:

- **Titular del CV: "Data Engineer" / "Ingeniero de Datos".** Es el string que buscan
  los reclutadores y que el parser sabe mapear. Títulos compuestos sacan de las
  búsquedas booleanas. El ángulo de IA va en el resumen y en las skills.
- **El español no es el idioma secundario.** En inglés el terreno de "X vs Y" está
  saturado por Databricks, AWS e IBM; en español no. El español es donde se pelea
  tráfico real.
- **Modo oscuro por defecto**, coherente con la audiencia técnica. El modo claro queda
  fuera de v1, pero los tokens de color se diseñan desde el inicio para permitirlo.
- **Sin niveles ni porcentajes en las skills.** "Python 85%" es una de las señales más
  confiables de portafolio junior.
- **Los cursos no se enumeran.** 50 cursos junto a dos proyectos lee "estudió mucho,
  construyó poco". Las certificaciones sí, verificables y con enlace.
- **Descartados de hosting:** AWS S3 + CloudFront (free tier terminado; la cuenta AWS
  se reserva para proyectos de datos, y no da build automático sin montar CI aparte).
  Vercel (el plan Hobby restringe el uso comercial, lo que crea zona gris si el sitio
  llegara a captar clientes).

**Qué se sacrificó.** Sofisticación técnica como objetivo en sí mismo. El sitio no es
un proyecto de aprendizaje frontend.
