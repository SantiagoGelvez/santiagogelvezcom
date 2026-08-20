# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-19
**Última sesión:** Fase 1b (esquemas), apagado de `workers.dev`, baja de AWS y cierre
de los pendientes operativos
**Estado del repo:** desplegado y en producción. `npm run verify` pasa en limpio y
`astro check` sale con 0 errores, 0 avisos y 0 hints.
`git@github.com:SantiagoGelvez/santiagogelvezcom.git` · rama `main` · público.
**Fase del proyecto:** 0 y 1 completas. Siguiente: fase 2 (sistema de diseño).
**Infraestructura:** cerrada. Solo Cloudflare, $0/mes, sin AWS y sin nada pendiente de
desmontar. Lo único sin probar es el despliegue automático desde GitHub.

```
santiagogelvezcom/
├── CLAUDE.md              Se carga solo en cada sesión. Índice + reglas permanentes
├── NEXT.md                Este archivo — dónde vamos
├── DECISIONS.md           20 ADR registrados — por qué está así
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

**La fase 1b también está desplegada y comprobada en vivo**: las 27 rutas responden
200, `/es/blog/tema/fundamentos/` se indexa y las otras cinco categorías salen con
`noindex`, y el post en estado borrador responde 404. Dos URLs de relleno de la fase 1a
—`/es/blog/tema/tema-de-ejemplo/` y `/en/blog/topic/sample-topic/`— pasaron a 404 al
entrar la taxonomía real. Se decidió no redirigirlas: llevaban menos de un día en línea
y nunca fueron parte del mapa del sitio de SPEC §5.

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

Los cuatro pendientes que traía la fase 1b están cerrados o decididos. Queda uno solo,
y es de verificación:

1. **Probar la tubería de despliegue desde GitHub.** El repositorio ya está conectado en
   el panel de Cloudflare y `wrangler.jsonc` ya lleva `"preview_urls": true`, pero
   **nada de eso se ha ejercitado todavía**: los commits siguen sin subir, así que
   Cloudflare nunca ha construido nada. Además `preview_urls` **está en el archivo pero
   no en producción** —el último despliegue es anterior a ese cambio—, así que las
   previews no funcionarán hasta que se despliegue esa configuración. El primer
   `git push` es la prueba de las dos cosas. Ver "Cómo probarlo sin arriesgar
   producción", abajo.

**Cerrados en esta sesión:**

- ✅ **AWS desmontado.** El bucket ya no existe y no queda nada facturando. Producción
   sigue en pie y sin cabeceras `x-amz-*`, y el MX de Workspace responde
   `1 smtp.google.com`. Ese era el punto de mudarse (SPEC §4).
- ✅ **Repositorio conectado** en el panel de Cloudflare (falta la prueba del punto 1).
- ✅ **Disponibilidad: el sitio no la declara.** Depende de la vacante y se conversa en
   la entrevista. Queda registrado en **ADR-0020**, con lo que cuesta: SPEC §3 pide que
   el home responda "¿está disponible?" en diez segundos, y deliberadamente no lo hace.
   Cierra la última pregunta abierta que arrastraba SPEC §16 desde la fase 0.
- ✅ **Fecha de publicación: no se fija una.** El sitio ya está en línea, así que no hay
   un lanzamiento que planear — hay una data que completar. El trabajo restante se rige
   por las fases, no por una fecha.

### Cómo probarlo sin arriesgar producción

`main` está **4 commits adelante de `origin/main`**. Si la conexión quedó apuntando a
`main`, ese push va a construir y desplegar de una. Producción ya sirve exactamente ese
código —se desplegó a mano con `npm run deploy`—, así que el riesgo real no es lo que se
publique sino que la tubería falle a medias. Conviene, en este orden:

1. Confirmar en el panel qué **comando de build** quedó configurado. La recomendación es
   `npm run verify` y no `npm run build`: `verify` construye **y** comprueba las rutas,
   así que un build que rompe el mapa del sitio no llega a desplegarse. Es gratis
   convertir el criterio de terminado en la compuerta del despliegue.
2. Empujar una rama cualquiera antes que `main`, para ver una preview sin tocar el apex.
3. Solo entonces `git push origin main`, y comparar: la versión desplegada debe cambiar
   y las 27 rutas seguir en 200.

**Ojo con el doble despliegue:** si el comando de build configurado es `npm run deploy`,
ese script ya corre `wrangler deploy` por dentro y chocaría con el despliegue que hace
Cloudflare. `npm run deploy` es para desplegar a mano desde el portátil; la tubería debe
construir y dejar que Cloudflare despliegue.

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

Las fundaciones están completas, verificadas y desplegadas. Lo que falta no es
estructura: es que el sitio se vea como una decisión.

**Un hallazgo que conviene tener presente antes de empezar.** Los estilos provisionales
de la fase 1a aterrizaron justo en uno de los tres defaults que SPEC §13 descarta por
nombre: fondo casi negro (`--bg: #0f1219`) con un único acento verde (`--accent:
#45c4b0`) — el default (b) de la lista de "diseño generado por IA". No es que el diseño
esté a medias; es que no hay diseño, y lo provisional cayó en el cliché que la spec
prohíbe. Eso explica por qué el sitio hoy no convence, y es la razón de que §13 exija un
plan antes del CSS.

**El orden que pide SPEC §13, y no se salta:** primero un plan compacto —paleta de 4-6
valores con nombre, tipografías por rol, wireframes en ASCII y cuál es el elemento
firma—, revisado contra el brief, diciendo explícitamente qué se cambió por genérico.
**Solo después se escribe CSS.**

1. Revisar §13 antes que nada. Es la parte más subjetiva de toda la spec y la más barata
   de ajustar ahora; después de construir el sistema encima, ya no.
2. El plan de diseño, para aprobarlo o romperlo.
3. Tokens y reemplazo de los estilos globales de `Base.astro`, incluida la cabecera que
   hoy se rompe en móvil.
4. Componentes que el contenido ya pide y no existen: tarjeta de proyecto, entrada del
   índice del blog, chips de stack, aviso de pieza sin traducir.
5. El piso de calidad de §13 no se negocia: contraste, foco visible,
   `prefers-reduced-motion`, responsive hasta móvil, y `npm run verify` en verde.

**Terminado cuando:** el sitio se ve como una decisión de diseño y no como HTML sin
estilo, en móvil y en escritorio, sin una sola fuente del CDN de Google — y sin haber
caído en ninguno de los tres defaults de §13.

**No es de esta fase** la firma visual completa: el sistema de diagramas con lenguaje de
esquemático de circuitos es la fase 5. La fase 2 solo deja el terreno listo para eso.

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
