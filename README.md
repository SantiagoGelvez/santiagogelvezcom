# santiagogelvez.com

Sitio personal de Santiago Gelvez — ingeniero de datos. Portafolio de proyectos, notas
técnicas y hoja de vida, bilingüe (es/en).

**Estado:** en construcción. Producción sirve un placeholder mientras se desarrolla v1.

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
```

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
[Workers sobre Pages](DECISIONS.md) porque el sitio necesita emitir códigos de estado
que un estático no puede; [Playwright sobre Typst](DECISIONS.md) para no crear un
segundo lugar donde viva el CV.

## Licencia

El código es de uso libre. El contenido —textos, casos de estudio, diagramas— no.
