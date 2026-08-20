# santiagogelvez.com

Sitio personal de Santiago Gelvez — ingeniero de datos. Portafolio de proyectos, notas
técnicas y hoja de vida, bilingüe (es/en).

**Estado:** en línea y en construcción. Producción sirve el sitio completo como
estructura —las diez secciones en ambos idiomas, 27 rutas— con contenido de relleno
mientras se desarrolla v1. El contenido y la data se validan con esquemas en tiempo de
build: un error de tipeo en una fecha rompe el build en vez de llegar a producción. El
sistema de diseño está construido sobre tokens, con tipografías servidas desde el propio
dominio y sin una línea de JavaScript. El CV navegable y sus cuatro PDF salen de la misma
data, con una prueba automatizada que extrae el texto del PDF y comprueba que los campos
privados no estén. Lo que falta es el contenido real y el sistema de diagramas.

---

## Stack

| | |
|---|---|
| Framework | Astro — estático, TypeScript estricto ([por qué](DECISIONS.md)) |
| Hosting | Cloudflare Workers con assets estáticos |
| Contenido | Markdown/MDX validado con esquemas Zod en tiempo de build |
| Diseño | CSS sobre tokens, sin framework. Tipografías autoalojadas, cero JavaScript |
| SEO | Canonical, `hreflang` entre pares reales, `sitemap.xml`, JSON-LD y breadcrumbs |
| PDF del CV | Generado imprimiendo la propia ruta `/cv/` con Playwright, verificado con `pdfjs-dist` |
| Analítica | Sin cookies, sin banner de consentimiento |
| Costo | $0/mes |

Sin base de datos, sin CMS, sin autenticación. Nada con estado.

## Cómo está organizado

```
CLAUDE.md          Reglas de trabajo e índice de documentación
NEXT.md            Estado actual y siguiente paso
DECISIONS.md       Registro de decisiones (ADR)
docs/SPEC.md       Especificación: rutas, modelo de datos, plantillas, SEO
src/content.config.ts  Esquemas Zod: lo que un dato tiene que cumplir
src/content/       Contenido (MDX) y data (YAML), separados por tipo
src/lib/content.ts Consultas y las reglas que un esquema no puede ver
src/lib/cv.ts      El CV como vista sobre la data: filtrado, orden y nombres de archivo
src/i18n/          Claves de traducción → segmentos de ruta por idioma
src/styles/        tokens.css (color, tipografía, riel), base.css, prose.css, cv.css
src/components/    Franja del riel, tarjeta de proyecto, entrada del blog, chips
public/fonts/      Las .woff2 servidas desde el dominio, con su licencia OFL
src/pages/{es,en}/ Un archivo por ruta; el árbol se lee como el mapa del sitio
scripts/           verify-routes (criterio de terminado), cv-pdf, check-cv-pdf
.github/workflows/ El despliegue: construye, genera los PDF y publica (ADR-0030)
```

Todo el color y toda la tipografía salen de `src/styles/tokens.css`; el resto del CSS no
tiene un solo valor literal. Las fuentes están versionadas en el repo y servidas desde el
propio dominio: el sitio no hace ni una petición a un tercero.

La maquetación tiene **dos modos y una regla** que decide cuál se usa: el riel de
metadatos —categoría, fecha, rol, periodo— es para una **pieza** (un post, un caso de
estudio), nunca para titular una sección. Un índice usa el modo sin riel, donde el
titular vive en la columna de contenido y las entradas cuelgan de una barra local. El
riel de una pieza cuelga hacia el margen, así que la columna de lectura cae en la misma
coordenada en todas las páginas.

## Cómo correrlo

```
npm install
npm run dev       # servidor de desarrollo
npm run build     # sitio completo: HTML + los dos PDF del CV, todo en dist/
npm run verify    # build + rutas, hreflang, canonical, títulos y la prueba ATS del PDF
npm run check     # TypeScript sobre los archivos .astro
```

`npm run verify` es el criterio de terminado escrito como código: deriva las rutas
esperadas del contenido y falla si al build le falta una **o si le sobra**. Si una ruta
del mapa del sitio deja de existir, o un `hreflang` apunta a una página que no está, el comando
falla. La alternativa era una lista en un documento que nadie vuelve a leer.

**Los PDF del CV los genera `npm run build`**, en cada compilación, dentro de `dist/cv/`.
No se versionan y no hay comando aparte que recordar: un PDF más viejo que la data no es
posible, porque salen del mismo build que el HTML (ADR-0030).

```
npm run cv:full   # los dos PDF completos, con teléfono, en cv-out/ — solo en local
npm run cv:check  # solo la prueba ATS sobre los PDF que ya existen
```

`cv:full` necesita `src/content/data/perfil.private.yml`, que está en `.gitignore` y no
existe en un clon recién hecho. Se copia de `perfil.private.example.yml`.

**El despliegue corre en GitHub Actions**, no en Workers Builds de Cloudflare, por una sola
razón: imprimir el CV exige un Chromium y la imagen de build de Cloudflare no puede tener
uno —Ubuntu sin `sudo` ni `apt-get`, sin librerías de navegador—. El push a `main` sigue
publicando; lo que cambió es quién construye.

## Cómo agregar contenido

**Un post es un archivo.** El nombre del archivo es el slug, y el slug es la URL:

```
src/content/posts/es/etl-vs-elt.mdx   →   /es/blog/etl-vs-elt/
```

```yaml
---
clave_traduccion: etl-vs-elt      # empareja las versiones es/en de la misma pieza
titulo: ETL frente a ELT
resumen: Entre 120 y 170 caracteres. Sale tal cual como meta description, así que
  se escribe a mano y no se trunca del primer párrafo.
fecha_publicacion: "2026-08-19"   # las comillas son obligatorias
categoria: fundamentos            # fundamentos | decisiones | bitacora
estado: publicado                 # borrador | publicado
---
```

Opcionales: `fecha_actualizacion`, `tags`, `proyecto` (enlaza con un caso de estudio) y
`pilar: true` para la franja "empieza por aquí". Un post en `borrador` vive en el repo
pero no genera página. Traducirlo es crear el archivo en `en/` con la **misma**
`clave_traduccion` y su propio slug; si nunca se traduce, el selector de idioma ya sabe
qué hacer.

**Un proyecto son tres archivos**, porque los metadatos viven una sola vez y la
narrativa va por idioma:

```
src/content/projects/mundial-2026.yml           el registro, bilingüe en línea
src/content/project-bodies/mundial-2026.es.mdx  la narrativa en español
src/content/project-bodies/mundial-2026.en.mdx  la narrativa en inglés
```

Los `.mdx` no llevan frontmatter: repetir ahí lo que ya está en el `.yml` es justo la
duplicación que esta separación evita.

**No hay que memorizar los campos.** Si falta uno, sobra uno, o una fecha no existe en
el calendario, el build dice exactamente qué y en qué archivo.

## Dos ideas que explican el resto

**El CV no es un documento: es una vista sobre la data.** Experiencia, educación,
certificaciones y skills viven en archivos estructurados con una sola fuente de verdad.
De ahí salen tres salidas —la página web, el PDF público y el PDF completo— filtradas
por dos ejes independientes: qué registros entran en cada variante, y qué campos pueden
hacerse públicos. Un dato se corrige en un solo lugar.

**El PDF se diseña para el parser, no para el ojo.** Va directo a sistemas ATS: una
columna, texto seleccionable real, encabezados de sección estándar, sin tablas ni
iconos que carguen información. Hay una prueba automatizada que extrae el texto del PDF
y verifica que los encabezados estén, que el orden de lectura no delate dos columnas, y
que los campos privados no aparezcan.

**Los datos de contacto no están en el HTML.** Ni el correo ni el teléfono se renderizan
en ninguna de las 27 rutas: la página lleva ranuras vacías que se rellenan en el navegador
un instante antes de imprimir el PDF. Son dos niveles con alcances distintos —el teléfono
vive fuera del repositorio y solo entra a los PDF completos (ADR-0027); el correo vive en
`perfil.yml` y entra a los cuatro, pero nunca al HTML (ADR-0029)—.

No es ofuscación. La dirección no está escrita en ningún sitio que un robot visite gratis,
y `npm run verify` **falla** si alguna página construida contiene `mailto:` o el alias. La
otra mitad del invariante es igual de importante: la prueba del PDF falla si el correo
**no** está, porque un CV sin datos de contacto crea una ficha de ATS a la que nadie puede
responder. Y la defensa de fondo no es esconder: el alias es rotable, así que si se cosecha
se borra y se crea otro.

## Decisiones

`DECISIONS.md` lleva el registro en formato ADR. Cada entrada incluye las alternativas
consideradas y **qué se sacrificó** — sin ese campo un ADR es publicidad, no ingeniería.

Algunas: [Astro sobre Eleventy](DECISIONS.md) aceptando deuda de actualización;
[Workers sobre Pages](DECISIONS.md) por la hoja de ruta de Cloudflare —el argumento
original, emitir códigos de estado que un estático no puede, quedó anulado y el ADR lo
registra en vez de esconderlo—; [Playwright sobre Typst](DECISIONS.md) para no crear un
segundo lugar donde viva el CV; [un archivo por ruta](DECISIONS.md) porque los slugs son
traducidos y el árbol de archivos debe leerse como el mapa del sitio.

## Licencia

El código es de uso libre. El contenido —textos, casos de estudio, diagramas— no.
