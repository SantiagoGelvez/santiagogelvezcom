# Decisiones

Registro de decisiones de arquitectura (ADR ligero). Una entrada por decisión:
fecha, decisión, alternativas consideradas, por qué, qué se sacrificó.

Orden cronológico inverso — lo más reciente arriba.

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
