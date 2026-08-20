# santiagogelvez.com

Sitio personal de Santiago Gelvez — ingeniero de datos. Portafolio de proyectos, notas
técnicas y hoja de vida, bilingüe (es/en).

**Estado:** en línea y en construcción. Producción sirve el esqueleto del sitio —las
diez secciones en ambos idiomas, 27 rutas— con contenido de relleno mientras se
desarrolla v1. El contenido y la data ya se validan con esquemas en tiempo de build: un
error de tipeo en una fecha rompe el build en vez de llegar a producción. Lo que falta
es el sistema de diseño, el contenido real y el pipeline del CV.

---

## Stack

| | |
|---|---|
| Framework | Astro — estático, TypeScript estricto ([por qué](DECISIONS.md)) |
| Hosting | Cloudflare Workers con assets estáticos |
| Contenido | Markdown/MDX validado con esquemas Zod en tiempo de build |
| PDF del CV | Generado imprimiendo la propia ruta `/cv/` con Playwright |
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
src/i18n/          Claves de traducción → segmentos de ruta por idioma
src/pages/{es,en}/ Un archivo por ruta; el árbol se lee como el mapa del sitio
```

## Cómo correrlo

```
npm install
npm run dev       # servidor de desarrollo
npm run verify    # build + comprueba las rutas, hreflang, canonical y títulos
npm run check     # TypeScript sobre los archivos .astro
```

`npm run verify` es el criterio de terminado escrito como código: deriva las rutas
esperadas del contenido y falla si al build le falta una **o si le sobra**. Si una ruta
del mapa del sitio deja de existir, o un `hreflang` apunta a una página que no está, el comando
falla. La alternativa era una lista en un documento que nadie vuelve a leer.

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
y verifica que los encabezados estén y que los campos privados no.

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
