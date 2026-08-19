# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-19
**Última sesión:** Fase 1a — fundaciones (scaffold, i18n, rutas) y corte de S3 a Workers
**Estado del repo:** desplegado y en producción. `npm run verify` pasa en limpio.
`git@github.com:SantiagoGelvez/santiagogelvezcom.git` · rama `main` · público.
**Producción sirve el sitio de Astro desde Cloudflare Workers.** S3 ya no recibe
tráfico; el bucket sigue en pie solo como rollback.
**Fase del proyecto:** 0 y 1a completadas. Siguiente: fase 1b (esquemas de contenido).

```
santiagogelvezcom/
├── CLAUDE.md              Se carga solo en cada sesión. Índice + reglas permanentes
├── NEXT.md                Este archivo — dónde vamos
├── DECISIONS.md           15 ADR registrados — por qué está así
├── docs/SPEC.md           Especificación completa — qué construir
├── astro.config.mjs       Estático, i18n con prefijo explícito, mdx + sitemap
├── wrangler.jsonc         Worker de solo assets: sin `main`, sin código de servidor
├── src/
│   ├── i18n/routes.ts     Clave de traducción → segmento por idioma. `path()`
│   ├── i18n/ui.ts         Cadenas de interfaz y `meta description` por sección
│   ├── data/placeholders.ts  Piezas de relleno — las reemplaza la fase 1b
│   ├── layouts/Base.astro    `<head>`, nav, selector de idioma, JSON-LD
│   └── pages/{es,en}/     20 rutas, un archivo por ruta (ADR-0014)
├── public/robots.txt      Con puntero al sitemap
├── public/_redirects      La raíz responde 301 hacia /es/
└── scripts/verify-routes.mjs  Criterio de terminado de la fase 1a, ejecutable
```

---

## Qué quedó hecho

- **Scaffold de Astro 7.2.4** con TypeScript estricto (`astro/tsconfigs/strictest`),
  versiones fijas sin rangos, integraciones limitadas a `mdx` y `sitemap` (ADR-0002).
  `astro check` sale con 0 errores, 0 avisos y 0 hints.
- **i18n con prefijo explícito** `/es/` y `/en/`, sin detección del idioma del
  navegador. La raíz responde **301 real** hacia `/es/` desde `public/_redirects`, no
  un meta-refresh generado en build.
- **Las 21 rutas existen y responden 200**, verificadas contra el runtime real de
  Workers con `wrangler dev`, no solo contra `dist/`. Son 21 y no 20 porque se agregó
  desde ya una pieza que solo existe en español: el caso crítico de SPEC §8 conviene
  tenerlo construido antes de que haya contenido que migrar.
- **Selector de idioma resuelto por clave de traducción**, no por manipulación de la
  URL. Desde la pieza sin traducir lleva al índice del blog del otro idioma, con el
  aviso escrito **en ese otro idioma**, y nunca desaparece ni se desactiva.
- **`hreflang` solo entre pares que existen** (ADR-0015), `canonical` en todas las
  páginas, `x-default` hacia la versión en español, JSON-LD `Person` con `@id` estable
  compartido entre `/es/` y `/en/`, y `meta description` escritas a mano por sección.
- **`404.html` servido por Cloudflare** vía `not_found_handling`, con `noindex`.
- **`scripts/verify-routes.mjs`**: convierte el criterio de terminado en algo que se
  corre. Comprueba las 21 rutas, un solo `h1` por página, `canonical`, el patrón del
  `<title>`, el largo de las `meta description`, que ningún `hreflang` apunte a una
  página inexistente, que no haya fuentes del CDN de Google, y que la pieza sin
  traducción **no** haya generado una página fantasma en inglés.
- Dos ADR nuevos: **ADR-0014** (estructura de rutas) y **ADR-0015** (`hreflang` desde
  la clave de traducción). Total: 15.

**Una restricción de versiones que conviene recordar.** TypeScript va fijado en 5.9.3
aunque 7.0.2 ya es estable: `@astrojs/check` declara `^5 || ^6` como peer. No es un
problema hoy, pero es lo que hay que revisar en la actualización trimestral antes de
subir TypeScript.

---

## Pendientes para mí (Santiago)

**El corte de S3 a Workers está hecho y verificado en vivo** (2026-08-19):

```
/                                   → 301 hacia /es/
www.santiagogelvez.com              → 301 hacia el apex
las 21 rutas                        → 200
/no-existe/                         → 404 con la página propia
cabeceras de respuesta              → sin x-amz-*: S3 salió del camino
dig +short MX santiagogelvez.com    → 1 smtp.google.com  (correo intacto)
canonical y hreflang                → correctos en producción
```

Quedan tres cosas, ninguna urgente:

1. **Apagar la URL `workers.dev`.** El sitio completo está duplicado en
   `santiagogelvezcom.<subdominio>.workers.dev`. El `canonical` absoluto contiene el
   daño, pero lo limpio es que esa URL no sirva nada: se agrega `"workers_dev": false`
   a `wrangler.jsonc` y se despliega. Es un cambio de producción, así que va aparte.

2. **Conectar el repositorio en el panel de Cloudflare** para que el despliegue salga
   de `git push`, con previews por rama. Hoy el deploy es manual con `npm run deploy`.

3. **Desmontar AWS, sin prisa.** El bucket sigue en pie a propósito: es el rollback
   mientras el corte se asienta. Cuando lleve unos días estable, vaciarlo, borrarlo y
   revisar que no quede nada más facturando. Ese era el punto de mudarse (SPEC §4).
   **El build nunca vuelve a subir a S3.**

**Aparte del corte, no bloqueantes:**

- **Decidir si el sitio declara disponibilidad explícita** ("abierto a oportunidades").
  Es una decisión con consecuencias laborales, no de copy. Se necesita en la fase 6.
- **Fecha objetivo de publicación**, si hay una postulación o certificación que la
  ancle. Cambia qué se recorta.

---

## Defectos conocidos

- **La cabecera no se comporta bien en móvil.** Es `flex` con `margin-left: auto` en el
  selector de idioma; al envolverse en pantallas angostas el selector queda mal ubicado.
  No se arregla ahora a propósito: los estilos de la fase 1a son provisionales y la
  fase 2 los reemplaza enteros. Arreglarlos dos veces es trabajo tirado.

---

## Siguiente sesión: fase 1b — esquemas de contenido (bloque de 4 h)

La fase 1a dejó las rutas en pie con datos de relleno en un archivo TypeScript suelto.
Falta lo que hizo que Astro ganara el ADR-0002: la validación por esquema en build.

1. Colecciones de contenido con esquemas Zod: `glob()` para los MDX de blog y
   proyectos, `file()` para la data estructurada del perfil (SPEC §6).
2. Reemplazar `src/data/placeholders.ts` por las colecciones reales, conservando la
   clave de traducción y el slug por idioma — la forma ya está pensada para eso.
3. Los dos ejes de filtrado de SPEC §6, no uno solo.
4. Conectar la regla de ADR-0012: `noindex` en categorías con menos de 3 posts,
   evaluado contra el conteo real en build.
5. Extender `verify-routes.mjs` para que derive las rutas esperadas de las
   colecciones, en vez de tenerlas escritas a mano.

**Terminado cuando:** un error de tipeo en una fecha rompe el build, y las rutas siguen
saliendo verdes en `npm run verify`.

---

## Plan completo

| # | Fase | Horas | Formato |
|---|---|---|---|
| ✅ 0 | Higiene y baja de la visualización | 2 | hecho |
| ◐ 1 | Fundaciones: Astro, esquemas, rutas, deploy | 6-8 | 1a hecha y desplegada; falta 1b |
| 2 | Sistema de diseño | 6-8 | 4 h + 2 h × 2 |
| 3 | Data + CV + pipeline de PDF | 8-10 | 2-3 × 4 h |
| 4 | i18n de contenido y selector | 4-5 | 2 h × 2 |
| 5 | Sistema de diagramas | 6-8 | 4 h + 2 h × 2 |
| 6 | Contenido de lanzamiento (bilingüe) | 18-24 | 2 h × n |
| 7 | SEO, privacidad, cierre | 4-5 | 2 h × 2 |

**Total restante: 48-64 h.** La fase 6 conviene solaparla con las fases 4, 5 y 7 en
lugar de dejarla al final en bloque.

---

## Tareas recurrentes

- **Actualización de Astro: trimestral.** Es la mitigación acordada en ADR-0002 por
  haber elegido un framework con historial de versiones mayores frecuentes. Si se deja
  acumular, una actualización se come una sesión entera.
  Próxima revisión: **2026-11**. Punto a revisar entonces: TypeScript sigue fijado
  en 5.9.3 porque `@astrojs/check` no soporta la 7 todavía.
