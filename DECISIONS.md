# Decisiones

Registro de decisiones de arquitectura (ADR ligero). Una entrada por decisión:
fecha, decisión, alternativas consideradas, por qué, qué se sacrificó.

Orden cronológico inverso — lo más reciente arriba.

---

## ADR-0031 — Las imágenes se abren en el *top layer*, no se sangran

**Fecha:** 2026-08-20

**Decisión.** El contenido admite imágenes desde ya, con estas reglas:

- La fuente vive en `src/assets/` y se optimiza en build con `astro:assets`. `public/`
  queda para lo que se sirve tal cual. `image.layout` global en `constrained`,
  `responsiveStyles: false` porque el CSS de este repo se escribe a mano.
- **Se escribe con la sintaxis normal de markdown**, sin importar nada:
  `![alt](~/assets/posts/mi-post/flujo.png "leyenda")`. Las cuatro páginas que renderizan
  MDX pasan `components={{ img: Figure }}`, y MDX entrega la imagen ya resuelta, el `alt`
  y el `title`. El alias `~/` funciona, así que la ruta no depende de dónde esté el `.mdx`.
- `src/components/Figure.astro` emite **dos renditions** de la misma fuente: una en la
  columna (tope 1200 px) y una completa (tope 2400 px).
- **La imagen se abre a pantalla completa con `popover` nativo**, no se sangra. La caja del
  popover es la imagen y nada más; lo que oscurece la pantalla es el `::backdrop`.
- La leyenda lleva un enlace a la imagen completa, **en pestaña nueva**.
- **El idioma sale de `Astro.currentLocale`**, no de una prop.
- `npm run verify` impone tres presupuestos —400 kB por fuente, 500 kB por imagen servida,
  2.5 MB en total—, rechaza cualquier fuente con EXIF o XMP incrustado, y falla si el HTML
  construido tiene `id` repetidos.

**Las imágenes se versionan; el video no.** Son dos problemas con la misma forma y distinto
tamaño. Una captura bien recortada pesa decenas de kB y **tiene que estar en el repositorio
para que el build la optimice**: fuera de él no hay `srcset`, ni AVIF, ni `width`/`height`
—que es CLS y SPEC §10 lo prohíbe por nombre—, y transformarlas en el borde cuesta dinero.
Además una imagen y el post que la referencia son la misma pieza: si viajan separadas, se
pueden desincronizar. Un video son dos órdenes de magnitud más y ninguna de esas ventajas
aplica, así que ahí sí compensa R2 con dominio propio — decisión de la fase 5, con su ADR.

**Alternativas consideradas.** Sangrar la figura más allá de `--measure`, que es la
excepción que ADR-0021 dejó reservada para la fase 5. Un visor con `:target`, que tiene
soporte universal. Un enlace a la imagen y nada más. Embeber una librería de *lightbox*.
Para la escritura: instanciar `<Figure>` a mano en cada MDX, con dos `import` por pieza.
Para el alojamiento: servir las imágenes desde R2, como el video.

**Por qué.** SPEC §9.7 pide capturas del dashboard en los casos de estudio y la columna de
lectura mide 68ch ≈ 544 px, donde un dashboard no se lee. El *top layer* no está sujeto a
`--measure` ni a `--frame`, así que **el visor resuelve el problema de ancho sin tocar la
maquetación** — y eso es mejor que sangrar, porque el sangrado obliga a decidir una segunda
geometría para el contenido y el visor no obliga a nada.

Entre los tres mecanismos sin JavaScript, `popover` es el único que da `Esc`, cierre al
hacer clic fuera, gestión del foco y `::backdrop` **del navegador**. Con `:target` esas
cuatro cosas hay que simularlas, y tres de ellas son exigencias del piso de calidad de SPEC
§13: simuladas a medias es peor que ausentes, porque parecen estar. Una librería queda
descartada de entrada — el sitio no tiene una línea de JavaScript y ese es el punto.

Los presupuestos van en `verify` y no en una nota porque el repositorio es público
(ADR-0009): una imagen de tres megas no se saca del historial borrándola en el commit
siguiente. La comprobación de EXIF protege lo mismo por otro lado — sharp elimina los
metadatos al reprocesar, así que **lo desplegado siempre sale limpio** y el único sitio
donde el GPS de una foto puede quedarse para siempre es el archivo versionado.

La sintaxis de markdown gana sobre instanciar el componente porque **el coste de escribir
es el que decide si el sitio se llena**. Dos `import` por pieza más una etiqueta de cinco
líneas es fricción que se paga en cada post, para siempre, y a cambio de nada: el HTML que
sale es idéntico. Mapear `img` una vez en cuatro páginas lo cobra una sola vez.

**Qué se sacrificó.** `popover` pide **Safari 17** (septiembre de 2023) y en un navegador
anterior el botón no hace nada. Lo compensa el enlace de la leyenda, y el precio de esa
compensación es que **hay dos afordances para lo mismo**: la imagen se pulsa y el enlace se
sigue. Es fealdad real, y se acepta porque el enlace además es lo único de los dos que
sobrevive a la impresión y lo que en móvil permite pellizcar para acercar.

El sangrado no desaparece: sigue haciendo falta para un diagrama, que se lee **dentro** del
flujo del texto y no en un visor. Lo que cambia es que deja de bloquear el contenido, así
que la excepción de ADR-0021 se diseña en la fase 5 sin prisa.

Mapear `img` es global: **toda** imagen de markdown pasa a ser una figura con visor. No hay
forma de pedir una imagen pequeña en línea sin visor sin escribir HTML crudo en el MDX. Se
acepta porque en este sitio una imagen dentro de una pieza siempre es una figura; el día que
deje de ser cierto, hace falta una convención y no un parche.

Y la leyenda viaja en el `title` de markdown, que es el hueco del *tooltip*. Es el único
campo extra que da la sintaxis, así que se le cambia el significado — quien lea el `.mdx`
sin conocer esta decisión puede leerlo como un texto flotante que nunca aparece.

Y el `id` del popover sale de un hash de la ruta de la fuente, así que la misma imagen dos
veces en una página produce dos `id` iguales. Hay una prop `id` para resolverlo, pero es
acoplamiento: el marcado depende de que quien escribe se acuerde. La red es la comprobación
de `id` duplicados en `verify` —probada a propósito—, que convierte el descuido en un build
roto en vez de en un botón que abre la figura equivocada.

**Nota medida, no supuesta.** Astro copia además la fuente **sin optimizar** a `dist/`,
porque importar una imagen en un MDX es un import de módulo y Vite emite el archivo. Ningún
HTML la enlaza. No se puede evitar sin salirse del pipeline de assets, así que `verify` lo
reporta como aviso y lo cuenta en el presupuesto: se despliega, aunque nadie la pida.

---

## ADR-0030 — Los PDF se generan en cada build; el despliegue se muda a GitHub Actions

**Fecha:** 2026-08-20

**Reemplaza a ADR-0028**, escrito unas horas antes en la misma sesión. Un ADR no se edita:
se sustituye.

**Decisión.** `npm run build` pasa a ser `astro build && node scripts/cv-pdf.mjs`, así que
**cada compilación genera los PDF**. Salen a `dist/cv/`, que ya está ignorado, y
`public/cv/` deja de existir: nada de lo que produce el pipeline se versiona. El comando
`cv:pdf` se borra — mientras exista un comando aparte que hay que recordar, se olvida.

Como generar un PDF exige un Chromium y la imagen de build de Cloudflare no puede tenerlo,
el despliegue se muda a **GitHub Actions** (`.github/workflows/deploy.yml`): el push sigue
publicando, pero quien construye es un runner que sí puede abrir un navegador. Workers
Builds se desconecta.

**Alternativas consideradas.** Generarlos en Workers Builds de Cloudflare. Desplegar a mano
desde local con `npm run deploy`. Generar el PDF sin navegador, con una librería de
composición.

**Por qué.** ADR-0028 tenía un error que Santiago detectó con una sola pregunta: si cambias
la descripción de un cargo y empujas sin regenerar, **el sitio publica el PDF viejo**. El
enlace no regenera nada, sirve una foto tomada antes.

Lo grave no es el bug sino la incoherencia. ADR-0027, escrito una hora antes, rechazó
depender de la disciplina para el teléfono con el argumento de que «la regla debe ser
imposible de violar por construcción, no depender de que nadie se equivoque». ADR-0028
aceptó exactamente lo contrario para la frescura del PDF, y se defendió con una
comprobación de fechas de commit en `verify-routes.mjs` que **no está en el camino del
despliegue**: Cloudflare corre el comando de build del panel, no `npm run verify`. La
comprobación protegía a quien ya se estaba portando bien.

La razón por la que los PDF vivían en el repositorio era mecánica y no arquitectónica:
quien publica es Cloudflare, que clona GitHub y arma el sitio en su máquina, y nada en ese
camino genera un PDF. Si no van en el clon, no existen — y el botón de descarga da 404.

Generarlos en Workers Builds resolvería eso sin mover el despliegue, y era la opción
preferible si funcionara. **No funciona:** la imagen es Ubuntu 24.04 sin `sudo` ni
`apt-get`, y no trae ninguna librería de navegador. `npx playwright install` baja el
binario de Chromium, no las librerías del sistema contra las que enlaza —`libnss3`,
`libnspr4`, `libasound2t64`, las mismas que hubo que instalar a mano en la máquina de
desarrollo—. Ahí Chromium no arranca.

Desplegar desde local era la opción más simple —cero CI, cero tokens— y se descartó por lo
que cuesta: publicar quedaría atado a una máquina, y un sitio que se actualiza con posts
semanales no debería necesitar un computador concreto para corregir una errata.

Y generar el PDF sin navegador está prohibido por ADR-0007: cualquier segunda cadena de
herramientas crea un segundo lugar donde vive el CV, que es justo lo que el modelo de datos
de SPEC §6 existe para evitar. Sería escribir la maquetación dos veces.

**Qué se sacrificó.** Una pieza de CI nueva que mantener, con dos secrets que rotar
(`CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`) y una superficie de confianza más — un
token con permiso de desplegar Workers vive ahora en GitHub. Se apaga la tubería de Workers
Builds, que estaba probada de punta a punta y publicaba en 75 segundos; el nuevo camino
añade ~40 s por despliegue bajando Chromium. Y el proyecto gana una dependencia de
plataforma que antes no tenía: si GitHub Actions se cae, no se publica, aunque Cloudflare
esté perfectamente.

También queda un modo de fallo nuevo mientras dure la transición: **si Workers Builds sigue
conectado, cada push dispara dos despliegues** y el de Cloudflare publica un sitio sin los
PDF. Desconectarlo no es opcional, es parte de la decisión.

---

## ADR-0029 — El correo no se renderiza en HTML; el PDF es su único portador

**Fecha:** 2026-08-20

**Decisión.** Ninguna ruta del sitio publica el correo. La página `/cv/` lleva una ranura
vacía —`<span data-cv-print="correo" hidden>`— que el pipeline rellena desde `perfil.yml`
un instante antes de imprimir, así que el alias entra a los cuatro PDF y a ningún HTML. Es
el mecanismo de ADR-0027 con un segundo nivel: `data-cv-print` para lo publicable que no
puede ir en HTML, `data-cv-private` para lo que no es publicable en absoluto.

En el PDF va como **texto plano y no como enlace `mailto:`**. Y la regla se vuelve un
invariante comprobado en los dos sentidos: `verify-routes.mjs` falla si alguna página
construida contiene `mailto:` o el alias, y `check-cv-pdf.mjs` falla si el PDF **no** lo
contiene. `/contacto/` explica el orden mientras el formulario llega en la fase 7.

**Alternativas consideradas.** Guardar correo y teléfono en *secrets* de Cloudflare y
leerlos al descargar el CV o al enviar el formulario. Ofuscar la dirección con JavaScript,
con trucos de CSS (`direction: rtl`, `::after`) o como imagen. Activar la ofuscación de
correo de Cloudflare Scrape Shield. Dejarlo como estaba, confiando en la rotación del alias.

**Por qué.** SPEC §11 ya lo decía —«nunca en texto plano, se cosecha en semanas»— y la
página del CV lo incumplió el primer día que se escribió, que es exactamente lo que pasa
con una regla que solo vive en un documento. Por eso lo importante de este ADR no es la
ranura sino el invariante: ahora la regla se rompe en `npm run verify`, no en producción.

Los *secrets* no podían funcionar, y conviene registrarlo para no reabrirlo. `wrangler.jsonc`
es un Worker de solo assets sin `main`: un secret solo lo lee código de servidor en tiempo
de petición, y aquí no hay código, así que añadirlo reabriría ADR-0003 y ADR-0005. El PDF,
además, es un archivo precompilado y versionado (ADR-0028): «tomarlo de secrets al
descargar» exigiría renderizarlo por petición con Chromium —imposible en un Worker— o
parchear bytes sobre una tabla de referencias cruzadas con desplazamientos absolutos. Pero
el argumento que decide es más simple: **un valor que se le entrega a quien lo pida no es
un secreto.** Si el endpoint lo devuelve, el cosechador llama al endpoint; si el PDF lo
lleva, descarga el PDF. El costo del atacante pasaría de «parsear HTML» a «hacer una
petición más». Eso no es una defensa.

La ofuscación se descartó por razones propias del proyecto: el JavaScript sería la primera
línea de script del sitio, contra una técnica que un cosechador con navegador headless
derrota igual; los trucos de CSS y la imagen rompen copiar y pegar y el lector de pantalla,
contra el piso de accesibilidad de SPEC §13; y Scrape Shield inyecta script en la página,
además de volverse irrelevante en cuanto no queda ningún `mailto:` que reescribir.

**El PDF sí tiene que llevarlo**, y eso no era negociable: va a un ATS que parsea el bloque
de contacto y crea una ficha de candidato (SPEC §7). Un CV sin correo produce una ficha a
la que nadie puede responder — un fallo mucho peor que el spam. Los modelos de amenaza son
distintos: los cosechadores raspan HTML a escala industrial, y descargar y parsear PDFs es
un comportamiento raro y caro. Lo que sí se corrigió es que el `mailto:` guardaba el URI
**sin comprimir** en la anotación del enlace, así que `grep` encontraba el correo dentro
del PDF versionado en un repo público. Como texto plano queda en el stream comprimido,
igual que el teléfono.

El correo **no** se mudó al archivo privado, y la distinción importa: es un valor
publicado, en un PDF que se commitea. Esconderlo del repositorio daría una falsa sensación
de secreto y rompería la regeneración del PDF público desde un clon limpio. Lo que se
protege es el raspado de HTML, no la publicación. La defensa de fondo sigue siendo la de
ADR-0006: el alias es rotable, así que el daño está acotado por diseño.

**Qué se sacrificó.** Hasta la fase 7 no hay formulario, así que el único canal de bajo
roce es GitHub y quien no lo use tiene que descargar un PDF para poder escribir — fricción
real en la página cuyo trabajo es justamente quitarla. El PDF público deja de poder
generarse sin ejecutar el script, porque el correo ya no está en el HTML del que se
imprime. Y quien lea el CV en pantalla no puede copiar la dirección: tiene que bajarse el
documento. Los tres son el precio de que la dirección no esté escrita en ningún sitio que
un robot visite gratis.

---

## ADR-0028 — Los PDF públicos se generan en local y se versionan; el build no lleva navegador

> ⚠ **Reemplazado por ADR-0030 el mismo día.** El error: aceptó depender de la disciplina
> para la frescura del PDF, justo lo que ADR-0027 había rechazado unas horas antes en este
> mismo archivo. Se conserva sin editar porque el razonamiento equivocado también es parte
> del registro — y porque el argumento que lo tumbó no fue teórico: lo encontró Santiago
> preguntando qué pasa si cambia un cargo y no corre el comando.

**Fecha:** 2026-08-20

**Decisión.** Los dos PDF públicos del CV se generan con `npm run cv:pdf` en el
computador y se **versionan en `public/cv/`**. El build de Cloudflare los copia como
copia cualquier otro asset estático: no descarga Chromium, no ejecuta Playwright y no
sabe que existe un pipeline de PDF. Que un PDF quede desfasado se convierte en un fallo
de `npm run verify`, que compara la fecha del último commit de `src/content/data/` con
la del último commit de `public/cv/` y falla si la data es más nueva.

**Alternativas consideradas.** Generarlos en build, que es lo que decía SPEC §15.4:
Playwright como dependencia del build de Cloudflare y los PDF como artefactos efímeros
que nunca entran al repositorio.

**Por qué.** Generarlos en build mete un navegador de ~150 MB en el camino crítico del
despliegue. Eso cuesta minutos en cada publicación —hoy el deploy entero dura 75
segundos— y agrega un modo de fallo nuevo y desagradable: si la descarga de Chromium
falla en el CI de Cloudflare, no se puede publicar **un post**. El acoplamiento es al
revés de lo que conviene: el CV cambia cuatro veces al año y los posts cambian cada
semana, así que el artefacto lento debe estar fuera del camino del rápido. Versionarlos
además los hace revisables —un PDF que cambia aparece en el diff— y sobre todo mantiene
en pie la razón por la que se eligió Cloudflare: el presupuesto de $0/mes y un build que
cabe en la capa gratuita sin pelearse con los límites de tiempo.

El argumento en contra —"un artefacto generado no se versiona"— es una buena regla
general que aquí no aplica: estos PDF **son contenido publicado**, igual que las cuatro
`.woff2` de `public/fonts/` que ADR-0022 ya decidió versionar por el mismo motivo.

**Qué se sacrificó.** La única fuente de verdad deja de estar garantizada por
construcción y pasa a estarlo por una comprobación: si alguien cambia la data, no corre
`npm run cv:pdf` y **commitea las dos cosas a la vez**, el árbitro no ve la regresión y
el PDF desplegado queda viejo hasta el siguiente cambio de `public/cv/`. La comprobación
por fecha de commit atrapa el caso normal, no el patológico. Y el repositorio carga
~300 KB de binario que crecen en cada regeneración, con diffs ilegibles.

---

## ADR-0027 — El campo no publicable se inyecta en el navegador, no en el build

**Fecha:** 2026-08-20

**Decisión.** La página `/cv/` renderiza una **ranura vacía** —`<span data-cv-private="…"
hidden>`— donde iría el teléfono. Lo que se despliega lleva esa ranura vacía. El comando
local `npm run cv:full` lee `src/content/data/perfil.private.yml` —ignorado por git— y
rellena la ranura en el DOM, con Playwright, un instante antes de imprimir. Una clave del
archivo privado sin ranura correspondiente **hace fallar el comando**: un dato que se
crea publicado y no lo esté es peor que un error ruidoso. Los PDF completos se escriben
en `cv-out/`, y el script comprueba sobre el disco —no confiando en su propia lógica—
que ninguno terminó en `public/` ni en `dist/`.

**Alternativas consideradas.** Un segundo build con `CV_PRIVATE=1` que sí leyera el
archivo privado, imprimiera desde ese `dist/` y lo descartara.

**Por qué.** Es lo que hace que ADR-0006 sea verdad por construcción y no por disciplina.
Con el segundo build existe, aunque sea durante segundos, un `dist/` con el teléfono
dentro; y `dist/` es exactamente el directorio que un `wrangler deploy` publica. Basta un
comando en el orden equivocado, un `Ctrl-C` a mitad, o un CI que cachee el directorio de
salida, para publicarlo. Con la inyección en el navegador **no existe el archivo que se
podría publicar**: el valor vive en la memoria del proceso durante los milisegundos que
dura la impresión, y no toca `src/`, ni `dist/`, ni la historia de git. La regla deja de
depender de que nadie se equivoque.

De paso obligó a arreglar un agujero que llevaba abierto desde la fase 0: `.gitignore`
ignoraba `*.private.yaml` y **no** `*.private.yml`, que es la extensión que usa todo el
repositorio. El archivo real habría entrado al primer `git add .` — en un repo público,
y ADR-0009 recuerda que eso no se arregla borrando.

**Qué se sacrificó.** El HTML público lleva una ranura vacía que no le sirve a nadie, y
existe un acoplamiento entre un script de Node y un atributo del DOM: renombrar
`data-cv-private` en la plantilla rompe el pipeline en silencio hasta que alguien corra
`cv:full`. Se compensa haciendo que una clave sin ranura falle en vez de omitirse, que
convierte el modo de fallo peligroso —imprimir sin el dato— en uno ruidoso.

---

## ADR-0026 — La variante del CV declara idiomas en plural

**Fecha:** 2026-08-20

**Decisión.** En `variantes-cv.yml`, el campo `idioma` (escalar) pasa a ser `idiomas`
(lista no vacía). El pipeline deriva sus salidas del producto de cada variante por sus
idiomas, así que registrar una variante nueva basta para que se generen sus PDF sin
tocar código.

**Alternativas consideradas.** Dejar el campo como estaba y que el script llevara
escritos los cuatro pares variante×idioma. Partir cada variante en dos registros, uno
por idioma, duplicando `filtro` y `orden_secciones`.

**Por qué.** SPEC §6 describía `variantes_cv[]` con «idioma» en singular, pero ADR-0011
—posterior— exige cuatro PDF de `cv-datos`: público y completo, en español y en inglés.
Los dos documentos no podían ser ciertos a la vez: el idioma es un **eje ortogonal** a la
variante, no un atributo suyo. Un campo escalar que el pipeline tuviera que ignorar sería
peor que no tenerlo, porque la data diría una cosa y el comportamiento otra; y duplicar
el registro por idioma pondría `filtro` y `orden_secciones` en dos sitios donde pueden
divergir. La regla de desempate de ADR-0010 aplica tal cual: gana el ADR más reciente y
la spec se actualiza.

**Qué se sacrificó.** `docs/SPEC.md` §6 queda corregida en un punto que se escribió antes
de que existiera ADR-0011, así que la spec ya no se lee como el documento original.
Es el precio previsto de la regla de desempate.

---

## ADR-0025 — La ruta de navegación solo en las páginas que cuelgan de un índice

**Fecha:** 2026-08-19

**Decisión.** Los breadcrumbs que SPEC §10 pedía «donde aplique» aparecen en **post, caso
de estudio y categoría**, y en ningún otro sitio. La ruta de un post es
`Inicio / Blog / Título`: **la categoría no entra**, porque es una faceta y no un tramo
de la URL —el post vive en `/es/blog/{slug}/`, no bajo la categoría—. El `BreadcrumbList`
de datos estructurados se genera del **mismo arreglo** que dibuja la ruta visible, y va en
el cuerpo del documento, pegado a su marcado, en vez de en el `<head>`.

**Alternativas consideradas.** Ponerla en todas las páginas, incluidos los índices de
sección, que es lo que hace la mayoría de los generadores. Incluir la categoría en la
ruta del post, que es habitual y le da a Google un tramo más. Emitir el JSON-LD en el
`<head>` junto al resto de los metadatos.

**Por qué.** En `/es/blog/` la ruta sería «Inicio / Blog» al lado de un `h1` que ya dice
Blog: repite en tipografía pequeña lo que el titular y el estado activo de la navegación
ya dicen. Un breadcrumb orienta cuando se llega desde un buscador a una página profunda,
y las páginas profundas son exactamente esas tres. Lo de la categoría es una cuestión de
no mentir: si la ruta declara un tramo que la URL no tiene, la migaja y la dirección se
contradicen, y la categoría del post ya está en el riel, enlazada. Y el JSON-LD vive
junto al marcado porque comparten la fuente: separarlos es crear dos sitios donde la
misma ruta puede quedar distinta.

**Qué se sacrificó.** Google no recibe `BreadcrumbList` en los índices de sección, así
que en los resultados esas páginas seguirán mostrando la URL en vez de una ruta —es
tráfico de marca, donde importa poco, pero es una señal menos—. Y al dejar la categoría
fuera de la ruta se pierde un enlace interno hacia las páginas de categoría desde cada
post, que son justo las que ADR-0012 quiere ayudar a que crucen el umbral de indexación;
el enlace del riel lo compensa solo en parte.

---

## ADR-0024 — El marco del sitio se centra; el texto, nunca

**Fecha:** 2026-08-19

**Decisión.** Cabecera, contenido y pie se alinean a un mismo **marco** de 40 rem —42.5
rem en pantallas de 90 rem o más, donde el cuerpo también sube a 1.125 rem— y ese marco
se centra en la ventana. El texto de adentro sigue alineado a la izquierda, siempre. La
cabecera y el pie conservan el filete a sangre completa: lo que se centra es su
contenido, no su caja, con `padding-inline: max(--page-pad, (100% - --frame) / 2)`.

Dos corolarios que no son adorno:

- **El riel de una pieza no ensancha el marco: cuelga hacia el margen izquierdo** con un
  margen negativo. Así la columna de lectura cae en la **misma coordenada** en un índice
  y en un post, y el margen se queda con los metadatos — que es literalmente el sitio de
  una nota al margen. Esto resuelve el sacrificio que ADR-0023 había aceptado: ir del
  blog a un post ya no mueve el texto.
- **El riel colapsa a las 70 rem por geometría, no por móvil**: es el ancho a partir del
  cual el margen izquierdo deja de tener sitio para el riel más un respiro.

Esto fija además una lectura de SPEC §13: **"nada centrado" se refiere al contenido**
—el hero centrado, el texto centrado, que la spec descarta por nombre— y no a un
contenedor centrado con el texto alineado a la izquierda.

**Alternativas consideradas.** Dejarlo anclado a la izquierda con un margen que crece con
la ventana (de 96 a ~172 px a 1920), que es la lectura literal de §13. Anclarlo y
**llenar** la derecha con contenido real: índice de secciones en los posts, tarjetas de
proyecto a dos columnas en el home. Recortar la cabecera y el pie al ancho del marco.

**Por qué.** Con la ventana en 1920 quedaba el **62% de la pantalla vacío a la derecha**:
el texto ocupaba `96..726` mientras el filete de la cabecera cruzaba los 1920. El marco
decía una cosa y el contenido otra. Las dos salidas alternativas se probaron y se
midieron: recortar la cabecera deja su filete cortado en el aire —se ve peor—, y
ensanchar el bloque de contenido a 52 rem para que el texto llenara más llevó las líneas
de las tarjetas a ~85 caracteres. El ancho de lectura de 65-75 caracteres no puede pagar
esa factura, así que el vacío solo se arregla moviendo el bloque o llenándolo con algo
que no sea prosa.

**Qué se sacrificó.** La lectura literal de "nada centrado", que era una restricción
escrita por Santiago y que aquí se reinterpreta en vez de cumplirse al pie de la letra.
Con eso, el sitio deja de ser un documento anclado al borde y se parece más a la
documentación técnica convencional — que es exactamente el riesgo de "genérico" que §13
vigila; lo que lo compensa es que la firma nunca estuvo en la posición del bloque sino en
la barra, el riel y la tipografía. Y el vacío **no desaparece: se reparte**. En un
monitor ancho sigue habiendo la mitad de la pantalla sin usar, y llenarla con contenido
de verdad —el índice de secciones a la derecha de un post, las tarjetas a dos columnas—
queda pendiente para cuando exista ese contenido, en las fases 5 y 6.

---

## ADR-0023 — El riel lleva metadatos de una pieza; los índices no llevan riel

**Fecha:** 2026-08-19

**Decisión.** La maquetación tiene **dos modos**, no uno, y acota lo que ADR-0021 había
aplicado a todo el sitio:

- **Modo pieza** (`Band.astro`): riel de metadatos reales —categoría, fecha, rol,
  periodo— más los nodos de los `h2` del cuerpo. Lo usan el post, el caso de estudio y,
  cuando llegue, el CV.
- **Modo índice** (`Section.astro`): sin riel. El titular vuelve a la columna de
  contenido en tipografía display, y las entradas cuelgan de una **barra local** —corta,
  propia de su lista— que conserva el vocabulario de trazo y derivación donde sí conecta
  cosas que se pertenecen. Lo usan el home, el blog, los proyectos y las páginas simples.

La regla que decide cuál se usa: **el riel lleva metadatos de una pieza, nunca el título
de una sección.**

Se apretó además la densidad en la misma tanda: la separación entre franjas baja de 5 a
3 rem y el relleno de las tarjetas a la mitad. La portada pasa de ~1500 a ~1150 px de
alto con más contenido a la vista.

**Alternativas consideradas.** Un riel angosto de ~4 rem en todas las páginas, que
mantiene una sola gramática y solo carga nodo, fecha corta o número de sección. Eliminar
el riel por completo y dejar el lenguaje de esquemático para los componentes y para los
diagramas de la fase 5.

**Por qué.** Construido y visto, el riel en un índice transportaba dos palabras en 200 px
—el 20% del ancho útil— y, peor, degradaba el `h2` a una etiqueta gris de 13 px: la
página se quedaba sin segundo nivel de jerarquía. Es un error de categoría, no de ajuste:
un margen anota lo que tiene **al lado**; no titula lo que viene **abajo**. En una pieza
el mismo margen sí tiene datos que anotar, y en un artículo de largo real los nodos de
los `h2` lo convierten en un índice del texto en el margen — que era la promesa. No se
eliminó del todo justamente porque el juicio se hizo sobre contenido de relleno, donde el
riel se ve en su peor escenario: dominan los índices y la única pieza tiene dos párrafos.

**Qué se sacrificó.** El sitio deja de tener **una** gramática de maquetación y pasa a
tener dos, así que quien agregue una página tiene que elegir, y elegir mal es fácil; la
mitigación es que la regla está escrita en `base.css` y que los componentes se llaman
`Band` y `Section` y no `Layout1` y `Layout2`. La alineación del texto cambia entre tipos
de página —en un índice arranca en el margen, en una pieza a 200 px—, así que ir del
blog a un post mueve la columna de lectura: es el precio de que el margen exista solo
donde sirve. Y la firma estructural queda concentrada en las piezas y en las barras
locales en lugar de recorrer el sitio entero, que era el atractivo de ADR-0021 y lo que
la práctica no sostuvo.

---

## ADR-0022 — Las fuentes se versionan en el repositorio y se sirven desde el dominio

**Fecha:** 2026-08-19

**Decisión.** Los cuatro archivos `.woff2` del sistema tipográfico —subconjunto latino de
Bricolage Grotesque, Literata en redonda y cursiva, e IBM Plex Mono— viven en
`public/fonts/`, versionados, con sus `@font-face` escritos a mano en
`src/styles/tokens.css` y un `preload` para las dos que dibujan la primera pantalla. Ni
el CDN de Google Fonts, ni los paquetes `@fontsource` como dependencia de npm. La
licencia OFL y la atribución de las tres familias se redistribuyen en
`public/fonts/OFL.txt`.

**Alternativas consideradas.** El CDN de Google Fonts, que es la ruta por defecto y la
más cómoda. Los paquetes `@fontsource-variable` en npm, que es la ruta autoalojada
habitual en Astro. Una pila de fuentes del sistema, que es gratis y no descarga nada.

**Por qué.** El CDN queda descartado por SPEC §11 antes que por rendimiento: es un
tercero que ve la IP de cada visitante y que habría que nombrar en la política de datos,
por unas tipografías. Los paquetes de npm resuelven eso pero publican los archivos con
un hash del build, así que no hay ruta estable que precargar —y el titular es
exactamente lo que se quiere pintar temprano—, además de sumar tres dependencias con su
propia cadencia de actualización para un activo que no cambia nunca. Versionarlos da
rutas estables, `preload`, caché inmutable en Workers y cero dependencias nuevas. La
pila del sistema era la opción de la fase 1a, y es justamente lo que hacía que el sitio
no se viera decidido.

**Qué se sacrificó.** Doscientos kilobytes de binarios en un repositorio público, que
todo el que lo clone se lleva. Las actualizaciones de las fuentes pasan a ser manuales y
nadie va a avisar de ellas: la mitigación es que una tipografía no tiene parches de
seguridad y que su versión no urge. Redistribuir la OFL correctamente es trabajo manual,
y volverá a serlo si algún día hacen falta más pesos o el subconjunto extendido. Y el
sitio paga 108 KB de fuentes por página que la pila del sistema costaba cero.

---

## ADR-0021 — Sistema de diseño: grafito cálido, cobre y una barra colectora

**Fecha:** 2026-08-19

**Decisión.** El sistema de diseño de SPEC §13 queda fijado así:

- **Paleta de seis tokens**, oscura: fondo grafito **cálido** `#1A1815`, superficie
  `#221F1B`, regla `#322D27`, tinta `#EDE8E0`, tenue `#A39B90` y un solo acento, cobre
  `#C98A4B`, reservado a enlaces y estados. Contrastes sobre el fondo: 14.5:1, 6.4:1 y
  6.1:1.
- **Tres familias por rol**: Bricolage Grotesque para los titulares, Literata para el
  cuerpo, IBM Plex Mono para los metadatos —fechas, categorías, estado, stack.
- **Maquetación de riel y medida**: una columna de metadatos en mono, una barra de 1px y
  la columna de lectura a 68 caracteres, alineada a la izquierda y con el aire a la
  derecha. En móvil el riel colapsa y el metadato pasa arriba, pero la barra se queda.
- **La barra colectora es el elemento firma** de esta fase: nodos donde arranca cada
  sección, derivaciones de 1px hacia cada entrada. Ninguna línea separa columnas; todas
  conectan.

**Alternativas consideradas.** Mantener la base azul-negra de la fase 1a y cambiar solo
el acento. Un acento azul señal frío sobre la misma base cálida. El trío tipográfico
Archivo + Newsreader, más sobrio. Un cuerpo sans (Public Sans) en lugar del serif, para
no arriesgar el serif sobre fondo oscuro.

**Por qué.** Los estilos provisionales de la fase 1a habían aterrizado en uno de los tres
defaults que §13 descarta por nombre: fondo casi negro con un único acento verde. No era
un diseño a medias, era la ausencia de una decisión. El grafito cálido sale de esa
familia por el lado que ningún generador toma, y el cobre es la referencia de
electrónica —pistas de circuito— que conecta con el ángulo de esquemático que §13 quiere
explorar. La mono en los metadatos da identidad técnica sin caer en el cliché de
terminal, y la rejilla de riel cumple las tres exigencias de §13 a la vez —asimétrica,
alineada a la izquierda, 65-75 caracteres— mientras construye el vocabulario visual
—trazo fino, ángulo recto, nodo— que el sistema de diagramas de la fase 5 va a heredar
en lugar de inventar de nuevo.

**Qué se sacrificó.** El sistema se acerca a propósito a la familia del default (a) de
§13 —cálido con acento terroso—, y esa cercanía es el riesgo asumido: lo que lo separa
es que el fondo es oscuro y el serif es de pantalla y de bajo contraste, no un serif de
alto contraste sobre crema. Si al usarlo se siente terracota, lo que baja es el croma del
acento, no la familia. El serif de cuerpo sobre oscuro pierde algo de peso óptico frente
a una sans, y se acepta por el registro editorial. **El modo claro no existe**: hay
tokens para agregarlo sin rehacer nada, pero hoy quien lea de día lee en oscuro. Y la
barra colectora impone que casi todo el contenido viva dentro de una franja del riel:
una imagen sangrada o un diagrama más ancho que la medida van a necesitar una excepción
explícita cuando llegue la fase 5, y esa excepción hay que diseñarla, no improvisarla.

---

## ADR-0020 — El sitio no declara disponibilidad; se negocia por vacante

**Fecha:** 2026-08-19

**Decisión.** El sitio no dice nada sobre disponibilidad laboral: ni banner de "abierto
a oportunidades", ni línea en el CV, ni estado en el home. La disponibilidad depende de
la vacante concreta y se conversa en la entrevista. Esto responde la pregunta abierta
que SPEC §16 dejó pendiente desde la fase 0.

**Alternativas consideradas.** Un banner explícito en el home, que es lo que hace la
mayoría de los portafolios y lo que un reclutador espera encontrar. Una línea discreta
en `/contacto/` o en el CV, que dice lo mismo con menos ruido. Un campo en la data del
perfil que se pudiera encender y apagar sin tocar plantillas.

**Por qué.** La disponibilidad no es un valor constante: cambia con el rol, la
modalidad, el salario y el momento. Declararla en el sitio la congela en una sola
respuesta para todos los lectores, y además la responde **antes** de saber qué se está
negociando, que es exactamente al revés de como conviene. Hay un segundo problema, más
práctico: ese tipo de aviso envejece solo. Un "abierto a oportunidades" que sigue puesto
seis meses después de haber aceptado un puesto es peor que no haber dicho nada, porque
el sitio entero pierde credibilidad — y este sitio es, sobre todo, un argumento de
credibilidad (ADR-0001).

**Qué se sacrificó.** SPEC §3 dice que el home debe responder en diez segundos las
preguntas de un reclutador, y "¿está disponible?" es una de las cuatro. Esa queda sin
responder a propósito: el reclutador tiene que escribir para saberlo, y una fracción no
lo hará. Se pierde también la señal de búsqueda activa que algunos filtros usan como
criterio. La compensación es que el sitio no tiene que mantenerse al día con mi
situación laboral para seguir siendo cierto — y por eso ADR-0013 ya había sacado el
posicionamiento estratégico de los archivos versionados.

---

## ADR-0019 — `verify-routes.mjs` deriva las rutas del contenido y duplica el mapa de secciones a propósito

**Fecha:** 2026-08-19

**Decisión.** El script de verificación construye la lista de rutas esperadas leyendo
`src/content/`, y la compara contra `dist/` **en los dos sentidos**: falla si falta una
ruta y también si sobra. El mapa de secciones y la taxonomía siguen escritos a mano en
el script, como espejo deliberado de `src/i18n/routes.ts` y `src/i18n/taxonomy.ts`.

**Alternativas consideradas.** Importar los módulos reales desde el script, ahora que
Node 24 ejecuta TypeScript sin transpilar. Emitir un manifiesto de rutas durante el
build y verificar contra él.

**Por qué.** Las rutas de contenido sí deben derivarse: eran la parte que envejecía,
porque cada post nuevo obligaba a editar el script. El mapa de secciones es lo
contrario: si el script importa `routes.ts`, deja de comprobar `routes.ts` y pasa a
comprobar el build contra la misma fuente que lo generó. Un segmento mal editado
—`/es/privacidad/` convertido en `/es/privacy/`— saldría verde. La duplicación es
barata (ocho secciones y tres categorías que no crecen) y es justo lo que convierte al
script en un segundo par de ojos. El manifiesto tiene el mismo defecto y además pide
una integración propia, que ADR-0002 limitó a `mdx` y `sitemap`.

**Qué se sacrificó.** Agregar una sección obliga a tocar tres archivos en vez de dos, y
nada garantiza que el espejo se actualice: si alguien cambia `routes.ts` y no el script,
el fallo aparece como una ruta que "sobra" y otra que "falta", con un mensaje que no
dice de entrada que el espejo se desincronizó. Es ruidoso a propósito — falla del lado
seguro.

---

## ADR-0018 — Los dígitos se permiten en los slugs de proyecto y se prohíben en los de post

**Fecha:** 2026-08-19

**Decisión.** El esquema aplica dos reglas de slug distintas: los posts no admiten
dígitos, los proyectos sí. Resuelve una contradicción interna de SPEC §8, que prohíbe
"fechas ni números" tres líneas después de poner `/es/proyectos/mundial-2026` como
ejemplo de un slug bien hecho.

**Alternativas consideradas.** Prohibir los dígitos en todas partes, que es la lectura
literal de la regla, y renombrar el ejemplo a `mundial-de-futbol`. Permitirlos en todas
partes y dejar la regla como una convención no verificada.

**Por qué.** La regla trae su propio motivo: "una fecha en la URL envejece el post y me
impide actualizarlo sin que se vea viejo". Ese motivo aplica a la fecha en que se
escribió una pieza, no a un número que es parte del nombre de la cosa. En
`mundial-2026` el 2026 no dice cuándo se escribió el caso de estudio: dice de qué
mundial habla, y no envejece nunca. Prohibirlo en los posts sí conserva el motivo
intacto, porque es ahí donde la tentación de poner el año es real.

**Qué se sacrificó.** La regla deja de ser una sola frase y pasa a ser dos, con una
excepción que hay que explicar cada vez. Y el esquema no puede distinguir un
`mundial-2026` legítimo de un `retrospectiva-2026` que sí envejece: en proyectos, la
regla vuelve a ser disciplina y no validación.

---

## ADR-0017 — Las fechas se validan como cadena, nunca como fecha de YAML

**Fecha:** 2026-08-19

**Decisión.** Todas las fechas del contenido y de la data se escriben entre comillas y
se validan como texto: formato `YYYY-MM-DD` y, después, que la fecha exista en el
calendario. El esquema **rechaza explícitamente** un valor que YAML ya haya convertido
en `Date`, con un mensaje que explica por qué hay que ponerle comillas.

**Alternativas consideradas.** Dejar que YAML las convierta y validarlas con
`z.coerce.date()`, que es la forma corta y la que cualquiera escribiría.

**Por qué.** Es el requisito que decidió el framework (ADR-0002): un error de tipeo en
una fecha no debe llegar a producción. `z.coerce.date()` no lo cumple, y falla justo en
el caso que importa. YAML 1.1 convierte una fecha sin comillas en un `Date` de
JavaScript, y `Date` no rechaza los desbordes: los corrige. `2026-02-30` no explota,
se vuelve el 2 de marzo, en silencio, y el build sale verde con la fecha equivocada.
Validar la cadena antes de que nadie la interprete es lo único que atrapa ese caso.
Está comprobado en los dos sentidos: la fecha imposible y la fecha sin comillas rompen
el build.

**Qué se sacrificó.** Las comillas son ruido en cada archivo de contenido, y son fáciles
de olvidar; el precio de olvidarlas es un build roto, no un dato malo, pero es fricción
real al escribir. Las fechas llegan a las plantillas como texto, así que ordenarlas o
formatearlas por idioma pide una conversión explícita más adelante. Se ordenan
lexicográficamente, que con `YYYY-MM-DD` da el orden correcto sin convertir nada.

---

## ADR-0016 — El registro de un proyecto y su narrativa viven en archivos distintos

**Fecha:** 2026-08-19

**Decisión.** Cada proyecto son tres archivos: un `.yml` con el registro —bilingüe en
línea, como pide SPEC §6— y dos `.mdx` con el caso de estudio, uno por idioma,
nombrados `<id>.es.mdx` y `<id>.en.mdx`. El `id` sale del nombre del archivo y **es** la
clave de traducción, sin campo aparte.

**Alternativas consideradas.** Un MDX por idioma con todo el frontmatter dentro, que es
una colección en vez de dos y se lee de corrido.

**Por qué.** SPEC §6 pide dos cosas que no caben en un archivo: que los proyectos sean
un registro bilingüe en línea, y que el caso de estudio sea narrativa larga con las
nueve secciones de §9. Con un MDX por idioma, todo lo que no es lingüístico —estado,
stack, periodo, orden, destacado— queda duplicado y libre de divergir: un proyecto
`activo` en español y `terminado` en inglés es un bug que ningún esquema ve, porque un
esquema solo mira un archivo a la vez. Separándolos, ese dato existe una sola vez y la
divergencia deja de ser posible en vez de quedar prohibida por disciplina.

**Qué se sacrificó.** Escribir un proyecto ahora son tres archivos abiertos en vez de
dos, y la relación entre ellos es una convención de nombres, no algo que el sistema de
tipos garantice. La compensación es explícita: la capa de consulta exige los dos
idiomas y rompe el build si falta uno, que es además donde se hace cumplir ADR-0008.
También obligó a fijar el `generateId` del cargador: por defecto `glob()` usa el campo
`slug` como id, y aquí `slug` es un objeto bilingüe, así que el id salía como
`"[object Object]"`.

---

## ADR-0015 — El `hreflang` se emite desde la clave de traducción, no desde la ruta

**Fecha:** 2026-08-19

**Decisión.** El `hreflang` de cada página se construye desde la clave de traducción
de la pieza, que solo conoce los idiomas en que la pieza existe de verdad. Se descarta
la opción `i18n` de `@astrojs/sitemap`, y `x-default` apunta a la URL en español de la
pieza, no a la raíz `/`.

**Alternativas consideradas.** Usar `sitemap({ i18n: … })`, que es la forma que la
integración documenta y que resuelve el caso normal en tres líneas. Declarar
`x-default` hacia `/`, que es lo que dice literalmente SPEC §8.

**Por qué.** La opción `i18n` del sitemap asume que la traducción de una ruta es la
misma ruta con otro prefijo de idioma. Aquí los slugs son traducidos (ADR-0014), así que
emitiría `hreflang` desde `/es/sobre-mi/` hacia `/en/sobre-mi/`, que no existe — el error
exacto que SPEC §8 y §10 prohíben, y que Search Console reporta. Lo mismo con
`x-default` hacia `/`: esa URL responde 301, y declarar `hreflang` hacia una URL que
redirige es un defecto reportable. La intención de §8 es "el idioma por defecto es el
español", y apuntar a la página en español la cumple sin crear el defecto.

**Qué se sacrificó.** El `hreflang` deja de ser gratis: es código propio en la plantilla
y hay que mantenerlo. Y el `sitemap.xml` sale sin anotaciones de idioma —los buscadores
las leen igual desde el `<head>`, pero es una señal menos en el archivo. A cambio, la
regla "solo entre pares que existen" queda garantizada por construcción y no por
disciplina: la pieza sin traducción no puede declarar un par que no tiene.

---

## ADR-0014 — Un archivo por ruta, con un registro de claves de traducción

**Fecha:** 2026-08-19

**Decisión.** Cada una de las 20 rutas del mapa del sitio es un archivo propio bajo
`src/pages/es/…` y `src/pages/en/…`. Los segmentos traducidos viven en un registro
único, `src/i18n/routes.ts`, que mapea clave de traducción → segmento por idioma; las
páginas los consumen con `path(locale, section, slug?)` y nunca escriben una URL a mano.

**Alternativas consideradas.** Una ruta catch-all `src/pages/[...path].astro` que genere
las 20 rutas desde el registro con `getStaticPaths`. Sería una sola fuente de verdad, y
agregar una sección costaría una línea.

**Por qué.** Con slugs traducidos (`/es/sobre-mi/` ↔ `/en/about/`), el enrutamiento por
locale de Astro no basta: el idioma no es lo único que cambia en la URL. Entre las dos
formas de resolverlo, el archivo por ruta hace que el árbol de `src/pages/` se lea como
el mapa del sitio de SPEC §5, y que cada plantilla se abra donde uno la busca. El
catch-all cambia eso por un despacho por clave que hay que leer entero para saber qué
renderiza qué, y son 10 secciones fijas: la fuente de verdad única compra poco cuando el
conjunto casi no crece.

**Qué se sacrificó.** El registro de rutas queda duplicado de forma implícita en el árbol
de archivos: agregar una sección son dos archivos más una entrada, y nada obliga a que
coincidan. Mitigación: `scripts/verify-routes.mjs` compara la lista esperada contra lo
que el build produjo y falla si se desincronizan, así que el desfase se ve en el build y
no en producción.

---

## ADR-0013 — La documentación del repositorio describe el proyecto, no la situación laboral

**Fecha:** 2026-08-19

**Decisión.** `SPEC.md`, `CLAUDE.md`, `DECISIONS.md` y `NEXT.md` describen qué se
construye y por qué, sin declarar situación laboral, búsqueda activa de empleo, ni
lecturas del propio historial como algo que haya que justificar. La trayectoria
profesional se enuncia de forma factual —es información pública— pero el
posicionamiento estratégico sale de los archivos versionados.

**Alternativas consideradas.** Publicar la especificación completa, que era el
documento más impresionante como pieza de portafolio. Dejarla fuera del repositorio
por entero, que eliminaba el riesgo y también el valor.

**Por qué.** El repositorio es público (ADR-0009) y va enlazado desde un sitio indexado
bajo un nombre propio, así que su audiencia real incluye a cualquiera del entorno
profesional actual. El valor de portafolio de la especificación está en las secciones
técnicas —mapa de rutas, modelo de datos, reglas de ATS, dirección de diseño—, no en
el párrafo de posicionamiento personal. Sanear ese párrafo conserva todo lo que
demuestra criterio y elimina lo único que exponía. Es la misma regla de ADR-0009
aplicada a un caso menos obvio: el repositorio registra qué se decidió y por qué, no
la situación personal de quien lo decidió.

**Qué se sacrificó.** El documento pierde el marco que explica por qué ciertas
decisiones —el titular "Data Engineer", la insistencia en evidencia verificable— son
como son. Ese razonamiento sigue disponible fuera del repositorio, pero quien lea solo
el repositorio verá las decisiones sin su motivación original.

---

## ADR-0012 — `noindex` en las categorías del blog con menos de 3 posts

**Fecha:** 2026-08-19

**Decisión.** Las páginas de categoría se construyen desde el día uno, pero emiten
`noindex` mientras la categoría tenga menos de 3 posts. La regla se evalúa en build.

**Alternativas consideradas.** No crear las rutas hasta que haya contenido, lo que
obligaría a cambiar la estructura de navegación después. Indexarlas desde el inicio.

**Por qué.** Tres categorías fijas por dos idiomas son seis páginas que al lanzar nacen
vacías o con un solo post. Google las trata como contenido delgado o *soft 404*, y eso
afecta la percepción de calidad de un dominio cuya autoridad se está construyendo desde
cero. Poner el umbral en el código y no en la memoria evita que dentro de un año nadie
recuerde por qué unas categorías se indexan y otras no.

**Qué se sacrificó.** Algunas páginas legítimas tardan más en aparecer en búsquedas.
A una publicación al mes, el umbral de 3 posts puede tardar un trimestre en cruzarse.

---

## ADR-0011 — Cuatro PDFs generados, dos desplegados

**Fecha:** 2026-08-19

**Decisión.** El pipeline genera cuatro PDFs de la variante `cv-datos`: público y
completo, en español e inglés. Solo los dos públicos se despliegan y se enlazan. La
variante `cv-itsm` queda registrada en `variantes_cv[]` pero no se genera hasta que se
necesite.

**Alternativas consideradas.** Dos PDFs (solo los públicos), dejando el completo como
un documento manual fuera del sistema. Generar las cuatro variantes de las dos versiones
de CV desde v1, que serían ocho.

**Por qué.** La especificación original tenía tres ejes solapados sin reconciliar
—variante × privacidad × idioma— que producían dos, cuatro u ocho PDFs según qué
párrafo se leyera. Cuatro es el mínimo que satisface las reglas reales: hay dos idiomas
y hay dos niveles de privacidad, y ambos son requisitos. Una vez el pipeline existe,
cada variante adicional cuesta minutos, así que no vale la pena optimizar el conteo
hacia abajo; lo que sí importa es que solo dos salgan al mundo.

**Qué se sacrificó.** El build produce artefactos que nunca se publican, lo que puede
confundir a quien mire el directorio de salida sin contexto. Se compensa con la
convención de nombres y con `.gitignore`.

---

## ADR-0010 — Cuatro archivos, cuatro trabajos: cómo sobrevive el contexto entre sesiones

**Fecha:** 2026-08-19

**Decisión.** El contexto del proyecto se reparte en cuatro archivos con funciones que
no se solapan:

| Archivo | Responde | Vida útil |
|---|---|---|
| `CLAUDE.md` | Qué leer y bajo qué reglas trabajar | Estable; se carga solo |
| `NEXT.md` | ¿En qué iba? | Se sobrescribe cada sesión |
| `DECISIONS.md` | ¿Por qué está así? | Nunca se edita, solo se agrega |
| `docs/SPEC.md` | ¿Qué hay que construir? | Cambia solo si cambia el alcance |

La especificación se movió de `PROMPT-CLAUDE-CODE-santiagogelvez.md` a `docs/SPEC.md`
con `git mv`, preservando la historia.

**Alternativas consideradas.** Confiar en que `DECISIONS.md` y `NEXT.md` bastaran, y
borrar el documento original. Concentrar todo en un solo archivo grande.

**Por qué.** El trabajo ocurre en sesiones de ~2 h separadas por una semana o más, y
cada sesión arranca sin memoria de la anterior. `CLAUDE.md` es el único archivo que se
carga automáticamente al abrir el proyecto: sin él, los otros tres son archivos
cualesquiera que nadie garantiza que se lean, y el contexto se reconstruye a mano cada
vez. El error que esta decisión evita es más sutil: un ADR registra decisiones, no
especificaciones. El mapa de rutas, el modelo de datos, las reglas del PDF para ATS o
la lista de patrones de diseño explícitamente descartados no son decisiones y no caben
en `DECISIONS.md`. Si se hubiera borrado el documento original, esa información se
habría perdido y se habría reinventado con los valores por defecto — que es justamente
lo que la sección de diseño prohíbe. El nombre viejo tampoco ayudaba: llamarlo "prompt"
hacía parecer desechable un documento de requisitos.

**Qué se sacrificó.** Cuatro archivos que mantener en lugar de uno, con riesgo de que
se contradigan. Regla de desempate: ante un conflicto gana el ADR más reciente, y la
spec se actualiza para reflejarlo.

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

### Actualización — 2026-08-19, mismo día

**El argumento decisivo de esta decisión ya no aplica.** Search Console confirmó que la
visualización anterior no tuvo URLs propias además de la raíz. No hay rutas que retirar,
no se construye el handler 410, y el sitio vuelve a ser estático sin excepciones — la
promesa del §4 se recupera completa y el "qué se sacrificó" de arriba queda anulado.

**La decisión se mantiene, apoyada en lo que queda:** Cloudflare recomienda Workers para
proyectos nuevos y concentra ahí todo el desarrollo de features; Pages sigue soportado
pero sin inversión nueva. Es un argumento más débil que el anterior —para un sitio de
contenido puro, Pages sería defendible por simplicidad— pero apunta en la misma
dirección y es el que sobrevive a largo plazo.

Se anota como actualización y no como ADR nuevo porque la decisión no se revierte, solo
cambia su fundamento. La regla de no editar aplica a reversiones.

**Si esto se reabre alguna vez,** el criterio es: mientras el sitio no necesite emitir
respuestas dinámicas, la diferencia entre Workers y Pages es de hoja de ruta del
proveedor, no de capacidad.

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

**Pendiente → resuelto el 2026-08-19.** Search Console está limpio: la visualización no
tuvo URLs propias además de la raíz, así que no hay ninguna ruta que deba responder 410.
La raíz tampoco podía, porque es la puerta del sitio nuevo; ahí lo que aplicó fue
reemplazo de contenido, borrado de los objetos del bucket, purga de caché y solicitud de
remoción. Verificado en vivo: los tres archivos anteriores responden 404.

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

## ADR-0001 — El sitio es un portafolio profesional, no un experimento técnico

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
