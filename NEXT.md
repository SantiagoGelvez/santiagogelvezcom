# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-19
**Última sesión:** Apagado de la URL `workers.dev` y fase 1b — esquemas de contenido
**Estado del repo:** desplegado y en producción. `npm run verify` pasa en limpio y
`astro check` sale con 0 errores, 0 avisos y 0 hints.
`git@github.com:SantiagoGelvez/santiagogelvezcom.git` · rama `main` · público.
**Fase del proyecto:** 0 y 1 completas. Siguiente: fase 2 (sistema de diseño).

```
santiagogelvezcom/
├── CLAUDE.md              Se carga solo en cada sesión. Índice + reglas permanentes
├── NEXT.md                Este archivo — dónde vamos
├── DECISIONS.md           19 ADR registrados — por qué está así
├── docs/SPEC.md           Especificación completa — qué construir
├── astro.config.mjs       Estático, i18n con prefijo explícito, mdx + sitemap
├── wrangler.jsonc         Worker de solo assets, sin `main` y sin URL workers.dev
├── src/
│   ├── content.config.ts  Esquemas Zod de las 9 colecciones. El corazón de la fase 1b
│   ├── content/
│   │   ├── posts/{es,en}/   Un archivo por idioma; el par lo hace clave_traduccion
│   │   ├── projects/        Registro bilingüe por proyecto (.yml)
│   │   ├── project-bodies/  Narrativa por idioma: <id>.es.mdx / <id>.en.mdx
│   │   └── data/            perfil, experiencia, educación, certificaciones,
│   │                        skills, variantes de CV — todo con datos de ejemplo
│   ├── lib/content.ts     Capa de consulta: lo que un esquema no puede ver
│   ├── lib/slugs.ts       Reglas de slug de SPEC §8, compartidas
│   ├── i18n/routes.ts     Clave de traducción → segmento por idioma. `path()`
│   ├── i18n/taxonomy.ts   Las tres categorías fijas + umbral de ADR-0012
│   ├── i18n/ui.ts         Cadenas de interfaz y `meta description` por sección
│   ├── layouts/Base.astro `<head>`, nav, selector de idioma, JSON-LD, `noindex`
│   └── pages/{es,en}/     Un archivo por ruta (ADR-0014)
├── public/_redirects      La raíz responde 301 hacia /es/
└── scripts/verify-routes.mjs  Criterio de terminado, ejecutable
```

---

## Qué quedó hecho

### La URL `workers.dev` está apagada

El sitio ya no está duplicado en `santiagogelvezcom.santiagogelvez.workers.dev`: esa
dirección responde ahora el error 1042 de Cloudflare y la petición **no llega al
Worker**. Comprobado en producción después de desplegar, junto con lo que no debía
moverse:

```
las 27 rutas del apex             → 200
/                                 → 301 hacia /es/
www.santiagogelvez.com            → 301 hacia el apex
/no-existe/                       → 404 con la página propia y noindex
workers.dev                       → error 1042, no sirve nada
dig +short MX santiagogelvez.com  → 1 smtp.google.com  (correo intacto)
```

`preview_urls` ya viene en `false` por defecto en wrangler 4.124.0, así que
`workers_dev` solo era suficiente. **Ojo con esto al hacer el pendiente 1 de abajo:**
las previews por rama son URLs `workers.dev`, así que habrá que poner
`"preview_urls": true` explícitamente cuando se conecte el repositorio.

### Fase 1b: los esquemas

Nueve colecciones con esquemas Zod, y `src/data/placeholders.ts` eliminado. Lo que
importa no es que existan, sino qué rompe el build ahora — todo esto está comprobado:

| Si alguien escribe… | …pasa esto |
|---|---|
| `fecha: "2026-02-30"` | falla: "esa fecha no existe en el calendario" |
| `fecha: 2026-08-19` sin comillas | falla: YAML la volvería `Date` y corregiría los desbordes en silencio (ADR-0017) |
| `categoria: tutoriales` | falla: solo existen las tres de SPEC §9 |
| `proyecto: no-existe` en un post | falla: la referencia no resuelve |
| `posts_relacionados: [no-existe]` | falla: la referencia no resuelve |
| un `telefono:` en un archivo versionado | falla: clave no reconocida (ADR-0006) |
| un caso de estudio sin su par en inglés | falla: ADR-0008 exige los dos idiomas |
| dos posts del mismo idioma con la misma clave | falla: el selector quedaría ambiguo |

Y lo demás que quedó en pie:

- **Los dos ejes de filtrado de SPEC §6**, no uno solo. El de registro es `visible_en[]`
  (`sitio`, `cv-datos`, `cv-itsm`). El de campo **no** es una marca booleana: es el
  `z.strictObject` de cada esquema junto con ADR-0006 — los campos no públicos viven en
  archivos ignorados por git, así que un dato privado no es un campo mal marcado sino
  una clave que el esquema no reconoce. Una marca se puede leer mal; un archivo que no
  está en el repo no se puede publicar por accidente.
- **La regla de ADR-0012 conectada al conteo real**, y evaluada **por idioma**: hoy
  `/es/blog/tema/fundamentos/` tiene 3 posts y se indexa, y las otras cinco categorías
  salen con `noindex`. Los dos sentidos de la regla están ejercitados a propósito.
- **Las tres categorías fijas existen en los dos idiomas**: 6 páginas donde antes había
  2 de relleno. Las rutas pasaron de 21 a 27.
- **Los borradores no generan página.** Hay un post en estado `borrador` en el
  contenido justamente para que el verificador lo demuestre en cada build.
- **`verify-routes.mjs` deriva las rutas del contenido** y compara en los dos sentidos:
  falla si falta una ruta y también **si sobra**, que es lo que atrapa un borrador
  filtrado. El caso crítico de SPEC §8 —la pieza sin traducción que no puede generar
  página fantasma— ya no está escrito a mano: sale de las claves de traducción.

Cuatro ADR nuevos: **0016** (registro y narrativa en archivos distintos), **0017**
(fechas como cadena), **0018** (dígitos en slugs, que resuelve una contradicción interna
de SPEC §8 y obligó a actualizar la spec) y **0019** (el verificador duplica el mapa de
rutas a propósito). Total: 19.

**Una dependencia nueva:** `js-yaml` 4.3.1, fijada, solo para el script de verificación.
No entra al sitio ni al build desplegado.

---

## Pendientes para mí (Santiago)

1. **Conectar el repositorio en el panel de Cloudflare** para que el despliegue salga de
   `git push`, con previews por rama. Hoy el deploy es manual con `npm run deploy`.
   Requiere agregar `"preview_urls": true` a `wrangler.jsonc` — ver arriba.

2. **Desmontar AWS.** El bucket sigue en pie como rollback del corte. Cuando lleve unos
   días estable: vaciarlo, borrarlo y revisar que no quede nada más facturando. Ese era
   el punto de mudarse (SPEC §4). **El build nunca vuelve a subir a S3.**

3. **Decidir si el sitio declara disponibilidad explícita** ("abierto a oportunidades").
   Es una decisión con consecuencias laborales, no de copy. Se necesita en la fase 6.

4. **Fecha objetivo de publicación**, si hay una postulación o certificación que la
   ancle. Cambia qué se recorta.

---

## Defectos conocidos

- **La cabecera no se comporta bien en móvil.** Es `flex` con `margin-left: auto` en el
  selector de idioma; al envolverse en pantallas angostas el selector queda mal ubicado.
  No se arregla ahora a propósito: los estilos son provisionales y **la fase 2 los
  reemplaza enteros**. Arreglarlos dos veces es trabajo tirado.

- **Todo el contenido es de ejemplo, y la data del CV también.** `perfil.yml` lleva un
  correo marcador (`ejemplo@santiagogelvez.com`) y un LinkedIn marcador; la experiencia,
  la educación y las certificaciones son registros inventados. Es deliberado: la data
  real entra con el pipeline del CV en la fase 3, y el alias de correo real se decide en
  la fase 7 junto con la ofuscación. **Nada de esto debe llegar a producción como está**
  — hoy no hace daño porque las páginas que lo mostrarían (`/cv/`, `/sobre-mi/`) siguen
  siendo de relleno y no leen las colecciones todavía.

---

## Siguiente sesión: fase 2 — sistema de diseño (bloque de 4 h)

Las fundaciones están completas y verificadas. Lo que falta ahora no es estructura sino
la dirección de SPEC §13, que hoy está representada por unos estilos provisionales que
el propio archivo declara desechables.

1. Tokens: escala tipográfica, espaciado, color, y la firma visual de SPEC §13.
2. Reemplazar los estilos globales de `Base.astro`, incluida la cabecera que hoy se
   rompe en móvil.
3. Componentes que el contenido ya pide y no existen: tarjeta de proyecto, entrada del
   índice del blog, chips de stack, aviso de pieza sin traducir.
4. El piso de calidad de SPEC §13 es no negociable: contraste, foco visible, y que
   `verify` siga en verde.

**Terminado cuando:** el sitio se ve como una decisión de diseño y no como HTML sin
estilo, en móvil y en escritorio, sin una sola fuente del CDN de Google.

---

## Plan completo

| # | Fase | Horas | Formato |
|---|---|---|---|
| ✅ 0 | Higiene y baja de la visualización | 2 | hecho |
| ✅ 1 | Fundaciones: Astro, esquemas, rutas, deploy | 6-8 | hecho y desplegado |
| 2 | Sistema de diseño | 6-8 | 4 h + 2 h × 2 |
| 3 | Data + CV + pipeline de PDF | 8-10 | 2-3 × 4 h |
| 4 | i18n de contenido y selector | 4-5 | 2 h × 2 |
| 5 | Sistema de diagramas | 6-8 | 4 h + 2 h × 2 |
| 6 | Contenido de lanzamiento (bilingüe) | 18-24 | 2 h × n |
| 7 | SEO, privacidad, cierre | 4-5 | 2 h × 2 |

**Total restante: 46-60 h.** La fase 6 conviene solaparla con las fases 4, 5 y 7 en
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
