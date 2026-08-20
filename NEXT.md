# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-19
**Última sesión:** Fase 2 completa — sistema de diseño, dos modos de maquetación, marco
centrado y ruta de navegación
**Estado del repo:** limpio y empujado a `origin/main`, que es lo que dispara el
despliegue. `npm run verify` pasa en limpio (27 rutas) y `astro check` sale con 0
errores, 0 avisos y 0 hints.
`git@github.com:SantiagoGelvez/santiagogelvezcom.git` · rama `main` · público.
**Fase del proyecto:** 0, 1 y 2 completas. Siguiente: fase 3 (data, CV y pipeline del PDF).
**Infraestructura:** cerrada. Solo Cloudflare, $0/mes. La tubería de despliegue desde
GitHub quedó probada, así que ya no hay nada pendiente de montar ni de desmontar.
**Verificación visual:** disponible. El chromium de Playwright ya arranca —`libnss3`,
`libnspr4` y `libasound2t64` instaladas—, así que las capturas headless son parte del
flujo y no hay que diseñar a ciegas. La fase 3 lo necesita igual: el PDF del CV se
genera imprimiendo `/cv/` con Playwright (ADR-0007).

```
santiagogelvezcom/
├── CLAUDE.md              Se carga solo en cada sesión. Índice + reglas permanentes
├── NEXT.md                Este archivo — dónde vamos
├── DECISIONS.md           25 ADR registrados — por qué está así
├── docs/SPEC.md           Especificación completa — qué construir
├── astro.config.mjs       Estático, i18n con prefijo explícito, mdx + sitemap, shiki
├── wrangler.jsonc         Worker de solo assets, sin `main` y sin URL workers.dev
├── public/fonts/          Las cuatro .woff2 del sistema + la OFL (ADR-0022)
├── src/
│   ├── styles/
│   │   ├── tokens.css     Color, tipografía y geometría del riel. La única fuente
│   │   ├── base.css       Maquetación y componentes. Ni un color literal
│   │   └── prose.css      Lo que sale de un .mdx: prosa, código, tablas
│   ├── components/        Band y Section (los dos modos), ProjectCard, PostEntry,
│   │                      Chip, Breadcrumbs, los dos avisos
│   ├── content.config.ts  Esquemas Zod de las 9 colecciones
│   ├── content/           posts/{es,en}, projects, project-bodies, data
│   ├── lib/content.ts     Capa de consulta: lo que un esquema no puede ver
│   ├── lib/slugs.ts       Reglas de slug de SPEC §8, compartidas
│   ├── i18n/              routes, taxonomy, ui — claves, categorías y cadenas
│   ├── layouts/Base.astro `<head>`, nav, selector de idioma, JSON-LD, `noindex`
│   └── pages/{es,en}/     Un archivo por ruta (ADR-0014)
└── scripts/verify-routes.mjs  Criterio de terminado, ejecutable
```

---

## Qué quedó hecho

### El plan de diseño, primero — y aprobado

SPEC §13 exige un plan antes del CSS, y el diagnóstico de partida lo justificaba: los
estilos provisionales de la fase 1a habían aterrizado **exactamente** en el default (b)
que §13 descarta por nombre —fondo casi negro con un único acento verde—. No era un
diseño a medias: era la ausencia de una decisión.

Lo aprobado quedó en **ADR-0021** (paleta, tipografías, riel, elemento firma) y
**ADR-0022** (dónde viven las fuentes). SPEC §13 quedó reconciliada: el proceso ya no
es trabajo pendiente, y si el sistema cambia, cambia por un ADR nuevo.

| | |
|---|---|
| Fondo | `#1A1815` grafito **cálido**, no el azul-negro de la fase 1a |
| Acento | `#C98A4B` cobre, **solo** en enlaces y estados. 6.1:1 |
| Texto | `#EDE8E0` a 14.5:1; metadatos `#A39B90` a 6.4:1 |
| Titulares | Bricolage Grotesque, con eje óptico |
| Cuerpo | Literata, serif de pantalla, a 68 caracteres |
| Metadatos | IBM Plex Mono: fechas, categorías, estado, stack |

### El riel, y dónde se le quitó

La primera versión puso el riel en **todas** las páginas. Con las capturas en la mano se
vio el problema: en un índice el riel transportaba dos palabras en 200 px —el 20% del
ancho útil— y degradaba el `h2` a una etiqueta gris de 13 px, así que la página se
quedaba sin segundo nivel de jerarquía. Error de categoría: un margen anota lo que tiene
**al lado**, no titula lo que viene **abajo**.

**ADR-0023** deja dos modos y una regla dura —*el riel lleva metadatos de una pieza,
nunca el título de una sección*—:

| Modo | Quién lo usa | Qué hace |
|---|---|---|
| `Band` — pieza | post, caso de estudio, CV | riel con categoría, fecha, rol, periodo; un nodo por cada `h2` del cuerpo |
| `Section` — índice | home, blog, proyectos, páginas simples | sin riel; el titular vuelve a la columna, y las entradas cuelgan de una **barra local** corta |

Lo que sobrevive del vocabulario en los índices es esa barra local: sigue habiendo trazo
fino, ángulo recto y derivación, pero conectando entradas con el titular que las agrupa
en vez de separar una columna vacía del texto.

### El marco: centrado, con el riel colgando hacia el margen

Segundo hallazgo de mirar el sitio en una pantalla ancha: a 1920 px quedaba el **62% de
la ventana vacío a la derecha**. La cabecera cruzaba los 1920 y el texto medía 630. Se
probaron y se midieron dos salidas antes de decidir: recortar cabecera y pie al ancho del
contenido deja su filete cortado en el aire, y ensanchar el bloque para que el texto
llenara más llevó las líneas a ~85 caracteres. **El ancho de lectura no puede pagar esa
factura.**

**ADR-0024**: cabecera, contenido y pie se alinean a un marco de 40 rem y ese marco se
centra, con el texto siempre alineado a la izquierda y los filetes a sangre completa. De
paso fija una lectura de §13: "nada centrado" habla del **contenido** —el hero, el
texto—, no de un contenedor centrado.

Y un corolario que salió gratis: **el riel de una pieza no ensancha el marco, cuelga
hacia el margen izquierdo.** Así la columna de lectura cae en la misma coordenada en un
índice y en un post — ir del blog a un post ya no mueve el texto de sitio, que era
justamente el sacrificio que ADR-0023 había aceptado un rato antes. El riel colapsa a las
70 rem, y el corte es geométrico: es el ancho donde el margen deja de tener sitio para él.

**Y se apretó la densidad**, que era un problema distinto sintiéndose como el mismo: la
separación entre franjas bajó de 5 a 3 rem y el relleno de las tarjetas a la mitad. La
portada pasó de ~1500 a ~1150 px de alto **con más contenido a la vista**. §13 pide
denso en información y generoso en espacio; antes solo se cumplía la segunda mitad.

Un detalle que costó encontrarlo y vale registrarlo: la barra de una pieza **no puede**
separarse con un `gap` del flex. El aire va dentro de la columna del cuerpo, porque un
hueco del contenedor cortaría la línea y una línea cortada deja de ser una barra.

### Ni una petición a un tercero

Las cuatro `.woff2` (subconjunto latino) están versionadas en `public/fonts/` y servidas
desde el dominio, con `@font-face` propio y `preload` de las dos que dibujan la primera
pantalla. **Cero peticiones al CDN de Google** — que era un tercero viendo la IP de cada
visitante, y una línea más en la política de datos (SPEC §11). Comprobado sobre el build:
el HTML no referencia ni un solo origen externo, y el sitio sigue sin una línea de
JavaScript.

Peso por página: 108 KB de fuentes y 8 KB de CSS. `dist/` completo pesa 580 KB.

### Lo demás

- **La cabecera ya no se rompe en móvil.** No se envuelve: cambia de rejilla. Marca e
  idioma arriba, navegación en su propia fila. Era el defecto conocido de la fase 1a.
- **Componentes que el contenido ya pedía:** tarjeta de proyecto, entrada del índice del
  blog, chips de stack y de estado, y el aviso de pieza sin traducir. La tarjeta no es
  una caja con sombra: es un bloque colgado de la barra por su derivación.
- **El home dejó de ser una lista de enlaces** y es la portada de SPEC §5: quién soy,
  proyectos, últimos posts y contacto. Sigue sin declarar disponibilidad (ADR-0020).
- **El aviso de relleno ahora distingue dos cosas** que no son lo mismo: una ruta que
  todavía no tiene página, y una página construida cuyo texto es de relleno.
- **El 404 usa los mismos tokens.** No hereda `Base.astro` —esa plantilla exige canónica
  y alternantes que ahí no existen—, pero ya no puede quedarse con la paleta vieja.
- **El resaltado de código sale de la paleta del sitio** (`css-variables` de Shiki), casi
  monocromático: solo cadenas y constantes en cobre. Un bloque con siete colores es la
  primera cosa que delata una plantilla.
- **Ruta de navegación**, que era el pendiente de SPEC §10 («`BreadcrumbList` donde
  aplique»). Aplica en post, caso de estudio y categoría —las páginas a las que se llega
  desde un buscador—, no en los índices, y la categoría no entra en la ruta de un post
  porque no es un tramo de su URL. El JSON-LD sale del mismo arreglo que dibuja la ruta
  visible, así que no pueden contradecirse (ADR-0025).
- **Piso de calidad de §13:** contraste AA comprobado con números, foco visible en todo
  lo enfocable, `prefers-reduced-motion` respetado y subrayado de enlaces que no depende
  del color (el cobre sobre el crema no llega a 3:1 entre sí).

---

## Pendientes para mí (Santiago)

1. **Comprobar el despliegue en producción.** El push de esta sesión dispara la tubería.
   Cuando termine: las 27 rutas en 200, `/` en 301 hacia `/es/`, el 404 propio, y
   `dig +short MX santiagogelvez.com` respondiendo `1 smtp.google.com`. Es la misma
   comprobación que cerró la fase 1b.

---

## Defectos conocidos

- **El índice del blog muestra el mismo post dos veces**, una en "Empieza por aquí" y
  otra en el cronológico. Es lo que pide SPEC §9 —franja fija arriba, índice completo
  abajo— y solo se ve raro porque hay cuatro posts. Se revisa con contenido real; si
  sigue molestando con veinte, la franja pasa a excluirse del cronológico.
- **En una pantalla ancha sigue sobrando la mitad de la ventana.** El marco centrado
  reparte el vacío, pero no lo elimina: una columna de 65-75 caracteres nunca va a llenar
  un monitor de 27 pulgadas. Llenarlo con contenido de verdad —índice de secciones a la
  derecha de un post, tarjetas de proyecto a dos columnas— es trabajo de las fases 5 y 6,
  cuando haya con qué llenarlo. Fingirlo ahora sería decoración.
- **Los chips del stack están en el cuerpo del caso de estudio, no en el riel.** Son
  metadatos y podrían subir al margen, que reforzaría el modo pieza y acortaría el
  encabezado. Se dejó así porque la fila de chips se lee bien donde está; queda anotado
  como opción, no como defecto.
- **No hay modo claro.** Hay tokens para agregarlo sin rehacer nada, pero hoy quien lea
  de día lee en oscuro. Es lo que ADR-0021 registra como sacrificado.
- **Todo el contenido es de ejemplo, y la data del CV también.** `perfil.yml` lleva un
  correo marcador y un LinkedIn marcador; la experiencia, la educación y las
  certificaciones son registros inventados. La data real entra con el pipeline del CV en
  la fase 3, y el alias de correo real se decide en la fase 7 junto con la ofuscación.
  El home enlaza a GitHub **y no a LinkedIn** justamente para no publicar el marcador.
- **La franja "empieza por aquí" no está separada visualmente del índice cronológico.**
  Hoy se distingue por su etiqueta en el riel y nada más. Con un solo post pilar no se
  nota; con diez sí. Se decide cuando haya contenido real (fase 6).

---

## Siguiente sesión: fase 3 — data, CV y pipeline del PDF (bloques de 4 h)

El sistema de diseño ya no es el cuello de botella: lo es que **todos los datos son
inventados**. La fase 3 los reemplaza por los reales y construye las tres salidas de
SPEC §7 desde una sola fuente.

1. La data real en `src/content/data/`: perfil, experiencia, educación, certificaciones y
   skills. Ojo con las reglas permanentes de privacidad — el teléfono y los campos no
   públicos van en archivos ignorados por git (ADR-0006), y no hay nombres de clientes ni
   cifras internas de Solvo, El Tiempo o Tigo.
2. `/cv/` navegable, que es la primera página que consume la data de verdad. Aquí se
   estrena el modo pieza con contenido real.
3. El pipeline del PDF imprimiendo la propia ruta con Playwright (ADR-0007), con las
   cuatro salidas y las dos desplegadas de ADR-0011, y la prueba que extrae el texto del
   PDF para comprobar que los encabezados están y los campos privados no.

**Terminado cuando:** el CV navegable y los PDF salen de la misma data, el PDF completo
no entra al build desplegado, y `npm run verify` sigue en verde.

Lo que la fase 2 dejó anotado para más adelante, y que no se toca antes de tiempo: el
peso de la barra local, los chips del caso de estudio en el riel, y llenar el ancho
sobrante en pantallas grandes con contenido real (fases 5 y 6).

---

## Plan completo

| # | Fase | Horas | Formato |
|---|---|---|---|
| ✅ 0 | Higiene y baja de la visualización | 2 | hecho |
| ✅ 1 | Fundaciones: Astro, esquemas, rutas, deploy | 6-8 | hecho y desplegado |
| ✅ 2 | Sistema de diseño | 6-8 | hecho |
| 3 | Data + CV + pipeline de PDF | 8-10 | 2-3 × 4 h |
| 4 | i18n de contenido y selector | 4-5 | 2 h × 2 |
| 5 | Sistema de diagramas | 6-8 | 4 h + 2 h × 2 |
| 6 | Contenido de lanzamiento (bilingüe) | 18-24 | 2 h × n |
| 7 | SEO, privacidad, cierre | 4-5 | 2 h × 2 |

**Total restante: 40-52 h.** La fase 6 conviene solaparla con las fases 4, 5 y 7 en
lugar de dejarla al final en bloque.

---

## Tareas recurrentes

- **Actualización de Astro: trimestral.** Es la mitigación acordada en ADR-0002 por
  haber elegido un framework con historial de versiones mayores frecuentes. Si se deja
  acumular, una actualización se come una sesión entera.
  Próxima revisión: **2026-11**. Puntos a revisar entonces:
  - TypeScript sigue fijado en 5.9.3 porque `@astrojs/check` declara `^5 || ^6` como
    peer y todavía no soporta la 7.
  - `import { z } from 'astro:content'` quedó deprecado en Astro 7; el proyecto ya usa
    `astro/zod`, que es el reemplazo. No hay nada pendiente, pero conviene confirmar que
    sigue siendo la ruta recomendada.
- **Las fuentes no se actualizan solas** (ADR-0022). No urge —una tipografía no tiene
  parches de seguridad—, pero si alguna vez hacen falta más pesos o el subconjunto
  extendido, es trabajo manual sobre `public/fonts/` y sobre `tokens.css`.
