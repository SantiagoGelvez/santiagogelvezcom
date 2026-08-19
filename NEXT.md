# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-19
**Última sesión:** Fase 0 — higiene y baja de la visualización anterior
**Estado del repo:** desplegable. Un `index.html` estático sin build ni dependencias.
**Fase del proyecto:** 0 de 7 completada. Siguiente: fase 1a (fundaciones).

```
santiagogelvezcom/
├── PROMPT-CLAUDE-CODE-santiagogelvez.md   Especificación completa del proyecto
├── DECISIONS.md                           9 ADR registrados
├── NEXT.md                                Este archivo
├── .gitignore                             Ya protege datos privados (ADR-0006)
└── index.html                             Placeholder temporal
```

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

---

## Pendientes para mí (Santiago), antes de la siguiente sesión

Bloqueantes — el placeholder no debe subirse sin el primero:

1. **Verificar las dos URLs del placeholder.** En `index.html` hay un comentario
   `<!-- VERIFICAR -->` sobre los enlaces de GitHub y LinkedIn. Están escritos por
   inferencia, no confirmados. Corregir si no coinciden.
2. **Subir el placeholder al bucket de S3** y purgar la caché de Cloudflare.
3. **Search Console:** solicitar remoción de la URL y revisar el informe de cobertura
   para saber si la visualización tuvo URLs propias además de la raíz. De eso depende
   si hay que emitir 410 en alguna ruta (ADR-0004).

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
