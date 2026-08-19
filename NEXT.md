# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-19
**Última sesión:** Fase 0 — higiene y baja de la visualización anterior
**Estado del repo:** desplegable, desplegado y publicado.
`git@github.com:SantiagoGelvez/santiagogelvezcom.git` · rama `main` · público.
Producción sirve un `index.html` estático sin build ni dependencias.
**Fase del proyecto:** 0 de 7 completada. Siguiente: fase 1a (fundaciones).

```
santiagogelvezcom/
├── CLAUDE.md          Se carga solo en cada sesión. Índice + reglas permanentes
├── NEXT.md            Este archivo — dónde vamos
├── DECISIONS.md       10 ADR registrados — por qué está así
├── docs/
│   └── SPEC.md        Especificación completa — qué construir
├── .gitignore         Ya protege datos privados (ADR-0006)
└── index.html         Placeholder temporal
```

**Los cuatro archivos tienen trabajos distintos.** `CLAUDE.md` es el único que se
carga automáticamente al abrir una sesión; su función es mandar a leer los otros tres.
`NEXT.md` responde "¿en qué iba?", `DECISIONS.md` responde "¿por qué está así?", y
`SPEC.md` responde "¿qué hay que construir?". Ver ADR-0010.

---

## Qué quedó hecho

- Visualización anterior retirada del directorio de trabajo y archivada fuera del
  repositorio, en `~/projects/_archive/santiagogelvezcom-planilla-2026-08-19/`
  (incluye el análisis completo de fase 0, que cita datos no publicables).
- Historia de git iniciada limpia: el contenido retirado nunca entra al repositorio
  público. Ver ADR-0004 y ADR-0009.
- `.gitignore` cubriendo datos privados y salidas del pipeline de CV desde el primer
  commit, antes de que exista nada que proteger.
- Placeholder en `/`: nombre, rol, ciudad y enlaces. Sin fuentes de CDN, sin correo en
  texto plano, con foco de teclado visible y `prefers-reduced-motion` respetado.
- `DECISIONS.md` sembrado con las decisiones del brief y las nuevas de fase 0.
- Continuidad entre sesiones resuelta (ADR-0010): `CLAUDE.md` creado como único punto
  de entrada automático, y la especificación movida de `PROMPT-CLAUDE-CODE-*.md` a
  `docs/SPEC.md` con `git mv`, preservando la historia. El nombre anterior hacía
  parecer desechable un documento de requisitos.
- **`docs/SPEC.md` reconciliado con las decisiones de fase 0.** La versión original
  seguía conteniendo las contradicciones que el análisis encontró, y una sesión futura
  las habría construido: el 410 en la raíz, dos PDFs en vez de cuatro, el teléfono en
  el pipeline de build. Corregidas las secciones 0, 4, 6, 7, 10, 11, 12, 15 y 16, cada
  una con puntero a su ADR. Intactas las secciones 5, 9, 13 y 14. La §16 ya no dispara
  otra fase 0 en cada sesión nueva.
- Dos ADR nuevos que faltaban: ADR-0011 (conteo de PDFs) y ADR-0012 (`noindex` en
  categorías delgadas). Total: 12.

---

## Baja de la visualización anterior: completada y verificada

Verificado el 2026-08-19 contra el sitio en vivo:

```
/js/data.js  /js/app.js  /css/styles.css   → 404   (objetos borrados del bucket)
portada                                    → 0 coincidencias sensibles
<title>                                    → Santiago Gelvez — Ingeniero de Datos
dig +short MX santiagogelvez.com           → 1 smtp.google.com   (correo intacto)
```

Enlaces del placeholder verificados manualmente. GitHub responde 200; LinkedIn responde
999 a peticiones automatizadas, que es su bloqueo anti-bots y no un enlace roto.

**Search Console: limpio.** La visualización no tuvo URLs propias además de la raíz.
Consecuencias: no se construye handler 410, y **el sitio vuelve a ser 100% estático sin
excepciones**. Eso anula el argumento decisivo del ADR-0005 (Workers sobre Pages); la
decisión se mantiene por la hoja de ruta de Cloudflare, que es un argumento más débil
pero apunta igual. Registrado como actualización dentro del ADR-0005.

**Efecto en la fase 1:** una cosa menos que construir.

---

## Pendientes para mí (Santiago)

**Nada bloqueante.** El repositorio quedó saneado para ser público (ADR-0013) y ya está
publicado, con SSH configurado y `origin main` como destino por defecto. De aquí en
adelante basta `git push`.

Se necesitan más adelante, no ahora:

1. **Decidir qué dice el sitio sobre disponibilidad**, si es que dice algo. Es una
   decisión deliberada, no de copy. Se necesita en la fase 6.
2. **Fecha objetivo de publicación**, si hay algo que la ancle. Cambia qué se recorta.

No bloqueantes, se necesitan más adelante:

4. **Decidir si el sitio declara disponibilidad explícita** ("abierto a oportunidades").
   Es una decisión con consecuencias laborales, no de copy. Se necesita en la fase 6.
5. **Fecha objetivo de publicación**, si hay una postulación o certificación que la
   ancle. Cambia qué se recorta.
6. **Crear el repositorio remoto** (público, ver ADR-0009) y hacer push.

---

## Siguiente sesión: fase 1a — fundaciones (bloque de 4 h)

1. Scaffold de Astro con TypeScript estricto. Versiones fijas, integraciones limitadas
   a `mdx` y `sitemap` (ADR-0002).
2. Configuración i18n: prefijo explícito `/es/` y `/en/`, sin redirección automática por
   idioma de navegador. La raíz redirige a `/es/` y se declara `x-default`.
3. Las 10 rutas del mapa del sitio × 2 idiomas, existiendo con contenido de relleno.
4. `robots.txt`, integración de sitemap, y el archivo de redirecciones creado aunque
   nazca vacío.
5. Despliegue a Cloudflare Workers desde git, con previews por rama, repuntando el
   origen desde S3.

**Terminado cuando:** las 20 rutas responden 200 en producción. Vacías, pero reales.

**Verificar que no se rompió el correo** después de tocar el origen:
`dig +short MX santiagogelvez.com` debe seguir devolviendo `1 smtp.google.com`.

---

## Plan completo

| # | Fase | Horas | Formato |
|---|---|---|---|
| ✅ 0 | Higiene y baja de la visualización | 2 | hecho |
| 1 | Fundaciones: Astro, esquemas, rutas, deploy | 6-8 | 2 × 4 h |
| 2 | Sistema de diseño | 6-8 | 4 h + 2 h × 2 |
| 3 | Data + CV + pipeline de PDF | 8-10 | 2-3 × 4 h |
| 4 | i18n de contenido y selector | 4-5 | 2 h × 2 |
| 5 | Sistema de diagramas | 6-8 | 4 h + 2 h × 2 |
| 6 | Contenido de lanzamiento (bilingüe) | 18-24 | 2 h × n |
| 7 | SEO, privacidad, cierre | 4-5 | 2 h × 2 |

**Total restante: 52-68 h.** La fase 6 conviene solaparla con las fases 4, 5 y 7 en
lugar de dejarla al final en bloque.

---

## Tareas recurrentes

- **Actualización de Astro: trimestral.** Es la mitigación acordada en ADR-0002 por
  haber elegido un framework con historial de versiones mayores frecuentes. Si se deja
  acumular, una actualización se come una sesión entera.
  Próxima revisión: **2026-11**.
