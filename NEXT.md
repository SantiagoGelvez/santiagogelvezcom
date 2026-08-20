# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-20
**Última sesión:** Fase 3 — el CV navegable, el pipeline de los cuatro PDF, la prueba ATS,
sacar los datos de contacto del HTML y mudar el despliegue a GitHub Actions
**Estado del repo:** limpio y desplegable, **sin commitear y sin desplegar todavía**.
`npm run verify` pasa (27 rutas, 4 archivos de soporte, 2 PDF) y `astro check` sale con
0 errores, 0 avisos y 0 hints.
`git@github.com:SantiagoGelvez/santiagogelvezcom.git` · rama `main` · público.
**Fase del proyecto:** 0, 1, 2 completas. Fase 3 **completa en mecanismo**; le falta la
data real, que es trabajo de Santiago y no de ingeniería (ver pendientes).
**Infraestructura:** Cloudflare para servir, GitHub Actions para construir y publicar
(ADR-0030). Sigue costando $0/mes — repo público, minutos de Actions ilimitados.
**Pendiente de Santiago:** crear el token, poner los dos secrets y desconectar Workers
Builds. Hasta que eso pase, el push **no** publica.

```
santiagogelvezcom/
├── CLAUDE.md              Se carga solo en cada sesión. Índice + reglas permanentes
├── NEXT.md                Este archivo — dónde vamos
├── DECISIONS.md           30 ADR registrados — por qué está así
├── docs/SPEC.md           Especificación completa — qué construir
├── .github/workflows/     El despliegue: construye, genera los PDF y publica (ADR-0030)
├── public/fonts/          Las cuatro .woff2 del sistema + la OFL (ADR-0022)
├── src/
│   ├── styles/            tokens · base · prose · cv (pantalla + papel en un archivo)
│   ├── components/        Band, Section, ProjectCard, PostEntry, Chip, Breadcrumbs,
│   │                      los dos avisos y CvDocument
│   ├── content.config.ts  Esquemas Zod de las 9 colecciones
│   ├── content/data/      Perfil, experiencia, educación, certificaciones, skills,
│   │                      variantes del CV — y el `.private.example.yml`
│   ├── lib/content.ts     Capa de consulta: lo que un esquema no puede ver
│   ├── lib/cv.ts          El CV como vista sobre la data: filtro, orden, nombre de archivo
│   └── pages/{es,en}/     Un archivo por ruta (ADR-0014)
└── scripts/
    ├── verify-routes.mjs  Criterio de terminado, ejecutable
    ├── cv-pdf.mjs         Imprime /cv/ con Playwright — públicos y completos
    └── check-cv-pdf.mjs   La prueba ATS: extrae el texto del PDF y lo audita
```

---

## Qué quedó hecho

### Las tres salidas de SPEC §7, desde una sola data

`/es/cv/` y `/en/cv/` renderizan desde `src/content/data/`, y **los cuatro PDF de
ADR-0011 son esa misma página impresa** con Playwright (ADR-0007). No hay una segunda
cadena de herramientas ni un segundo lugar donde viva el CV, que era el punto entero.

| | |
|---|---|
| `npm run build` | El sitio **y** los dos PDF públicos → `dist/`, nada versionado |
| `npm run cv:full` | Los dos completos, con teléfono → `cv-out/`, ignorado por git |
| `npm run verify` | `build` + rutas + la prueba ATS sobre los PDF que se van a desplegar |

Los dos ejes de filtrado de SPEC §6 quedaron implementados **como cosas distintas**, que
es lo que la spec insistía en no confundir. El eje de registro (`visible_en[]`) es un
filtro real en `src/lib/cv.ts`. El eje de campo **no es un filtro**, y es deliberado: un
filtro se puede olvidar de aplicar. El campo no publicable vive fuera del repositorio, así
que la capa de consulta nunca lo ve y no tiene nada que omitir.

### Los datos de contacto no están en el HTML

**ADR-0027 y ADR-0029.** La página renderiza ranuras vacías y el pipeline las rellena en el
DOM un instante antes de imprimir. Dos niveles, con orígenes y alcances distintos:

| Ranura | Valor | Origen | Entra a | ¿En HTML? |
|---|---|---|---|---|
| `data-cv-print` | correo | `perfil.yml`, versionado | los cuatro PDF | **nunca** |
| `data-cv-private` | teléfono | `perfil.private.yml`, ignorado | solo los completos | **nunca** |

Comprobado sobre las tres salidas reales:

```
HTML (27 rutas) → Duitama, Colombia · github.com/SantiagoGelvez · Cómo contactarme
PDF público     → Duitama, Colombia · github.com/… · ejemplo@santiagogelvez.com
PDF completo    → Duitama, Colombia · github.com/… · ejemplo@… · <teléfono>
```

Lo del correo salió de una pregunta de Santiago —¿conviene exhibirlo?— y la respuesta
incómoda es que **SPEC §11 ya lo prohibía** («nunca en texto plano — se cosecha en
semanas») y la página del CV lo incumplió el primer día que se escribió. Por eso lo que
importa de ADR-0029 no es la ranura sino el invariante: `verify-routes.mjs` falla si alguna
página construida contiene `mailto:` o el alias, y `check-cv-pdf.mjs` falla si el PDF
**no** lo contiene. Las dos mitades hacen falta — sin la segunda, un fallo silencioso de la
inyección publicaría un CV que crea una ficha de ATS a la que nadie puede responder.

La idea de guardarlos en *secrets* de Cloudflare quedó descartada con su razonamiento en
el ADR, para no reabrirla: no hay runtime que los lea, el PDF es un archivo precompilado, y
sobre todo **un valor que se le entrega a quien lo pida no es un secreto**.

Un detalle que solo aparece al medirlo: el `mailto:` guardaba el URI **sin comprimir** en
la anotación del PDF, así que `grep` encontraba el correo dentro del archivo versionado.
Como texto plano queda en el stream comprimido, igual que el teléfono.

**Y de paso se cerró un agujero que llevaba abierto desde la fase 0:** `.gitignore`
ignoraba `*.private.yaml` y **no** `*.private.yml`, que es la extensión que usa todo el
repositorio. El archivo real habría entrado al primer `git add .`, en un repo público.

### La prueba ATS es un script, no una revisión a ojo

`scripts/check-cv-pdf.mjs` extrae el texto real del PDF y comprueba seis cosas: que haya
texto y no una imagen, que el nombre y el titular aparezcan literalmente, que estén los
seis encabezados estándar, que **el orden de lectura sea el del documento** —así es como
se detecta una maquetación en dos columnas—, que no pase de dos páginas, que el correo sí
esté y que el teléfono no esté en las variantes públicas. Corre dentro de `npm run verify`.

Va con `pdfjs-dist` y no con `pdftotext` como decía la spec: `pdftotext` exige poppler
instalado en el sistema, y un criterio de terminado que depende de un `apt install` no es
un criterio de terminado.

### Un PDF viejo dejó de ser posible, y el despliegue se mudó

Este fue el error grande de la sesión, y lo encontró Santiago con una pregunta: *si cambio
la descripción de un cargo y no corro el comando, ¿el enlace sirve el PDF viejo?* Sí lo
hacía. Los PDF eran archivos preestablecidos en `public/cv/`, versionados, y regenerarlos
dependía de acordarse.

Lo grave era la incoherencia: ADR-0027 había rechazado depender de la disciplina para el
teléfono —«imposible de violar por construcción»— y ADR-0028, una hora después, la aceptó
para la frescura del PDF. La comprobación de fechas que le puse de red de seguridad ni
siquiera estaba en el camino del despliegue: Cloudflare corre el comando del panel, no
`npm run verify`.

**ADR-0030 lo arregla en la raíz.** `npm run build` genera los PDF, así que salen del mismo
build que el HTML y no pueden envejecer. `public/cv/` desapareció y `cv:pdf` también — un
comando que se puede olvidar se olvida. Nada de lo que produce el pipeline se versiona.

El precio es que el build necesita un Chromium, y **la imagen de Cloudflare no puede tener
uno**: Ubuntu 24.04 sin `sudo` ni `apt-get`, sin librerías de navegador. `npx playwright
install` baja el binario, no las librerías. Por eso el despliegue se mudó a GitHub Actions,
donde sí hay `sudo`. El push sigue publicando; cambió quién construye.

Comprobado sobre el disco, no sobre el papel:

```
cambiar un cargo + npm run verify  → el PDF lleva el cambio, sin comandos extra ✓
borrar dist/cv/*.pdf + verify      → falla: "el pipeline del PDF no corrió"      ✓
git ls-files | grep .pdf           → 0 archivos versionados                      ✓
```

### Lo demás

- **La hoja de impresión sirve dos veces**, como decía SPEC §7: alimenta el pipeline y
  arregla el Ctrl+P. El riel colapsa a una columna —era literalmente la maquetación en dos
  columnas que las reglas del ATS prohíben— y los tokens se redefinen a tinta sobre papel
  en vez de sobrescribir reglas, que es para lo que se diseñaron en ADR-0021.
- **El mínimo de impresión se aplicó a las 27 rutas**, no solo al CV: los navegadores no
  imprimen fondos, así que cualquier post se estaba imprimiendo en crema sobre blanco.
- **El riel del CV no repite lo que dice el cuerpo.** Primera versión llevaba titular y
  ciudad arriba y abajo. Al imprimir el riel desaparece, así que el cuerpo tiene que
  bastarse solo — y entonces el riel solo debe llevar lo que el cuerpo no dice: la fecha
  de la data. Un margen anota, no hace eco (ADR-0023).
- **La fecha sale del `git log` de la data**, no del build (SPEC §7). Si no hay historia,
  **falla el build** con un mensaje que explica el escape (`CV_DATA_UPDATED`), en vez de
  inventar una fecha. La fecha de build haría ver el CV actualizado cada vez que se
  publica un post sin haberlo tocado.
- **Qué rutas se imprimen no está escrito en el script.** Se descubren en el HTML
  construido, por el enlace de descarga que la propia página declara (`data-cv-pdf`). Una
  sola convención de nombres, en `src/lib/cv.ts`, y un enlace hacia un PDF que nadie generó
  se cae en `verify` en vez de ser un 404 en la ruta que más le importa a un reclutador.
- **El JSON-LD dejó de tener URL escritas a mano.** `Base.astro` publicaba un GitHub y un
  LinkedIn literales que ya no coincidían con `perfil.yml`. Ahora sale de la data, y
  `linkedin` es **opcional**: mientras no exista la URL real, el campo no está y no se
  publica en ningún sitio. Un marcador enlazado es peor que un hueco.
- **Tres cambios de esquema**, todos registrados: `cursos` en el perfil (la regla de §12
  hecha estructura — no hay colección donde enumerar 50 cursos por descuido), `nombre`
  bilingüe en skills (sin él, el CV en inglés salía con media lista en español), e
  `idiomas` en plural en las variantes (ADR-0026).
- **Una sección declarada y vacía rompe el build.** Un encabezado sin contenido debajo es
  peor que su ausencia: el parser clasifica la sección y no encuentra nada.
- **`/contacto/` dejó de ser una ruta de relleno.** Explica el orden —GitHub para lo
  rápido, el PDF del CV para los datos— y dice por qué el correo no está escrito ahí. Ese
  párrafo no es una disculpa: es la clase de decisión que este sitio existe para mostrar.
- **La `meta description` de contacto mencionaba LinkedIn**, que ya no existe como campo.
  Corregida en los dos idiomas, dentro del rango 120-170 que comprueba `verify`.

---

## Pendientes para mí (Santiago)

### 0. Conectar el despliegue nuevo — bloquea publicar

**Hasta que esto esté hecho, `git push` no publica nada.** El workflow está escrito y
verificado en local, pero le faltan las llaves.

1. **Crear el token.** Cloudflare → *My Profile* → *API Tokens* → *Create Token* →
   *Custom token*. Un solo permiso: **Account · Workers Scripts · Edit**, acotado a tu
   cuenta. Copia el valor: solo se muestra una vez.
2. **Guardar dos secrets** en GitHub → *Settings* → *Secrets and variables* → *Actions*:
   - `CLOUDFLARE_API_TOKEN` — el del paso 1
   - `CLOUDFLARE_ACCOUNT_ID` — está en la portada de tu cuenta de Cloudflare, en la URL del
     panel, o con `npx wrangler whoami`
3. **Empujar y mirar la pestaña Actions.** Si el workflow termina en verde y el sitio
   responde, sigue al paso 4.
4. **Desconectar Workers Builds** en Cloudflare → tu Worker → *Settings* → *Build*.

**El orden importa y el paso 4 va al final.** Si dejas Workers Builds conectado, cada push
dispara **dos** despliegues: el de GitHub, correcto, y el de Cloudflare, que publica un
sitio **sin los PDF** porque ahí Chromium no arranca. El que llegue último gana, y sería
una carrera. Desconéctalo en cuanto confirmes que el nuevo funciona.

> Si algo sale mal y necesitas publicar ya: `npm run deploy` desde tu computador sigue
> funcionando igual, con `npx wrangler login` en vez del token.

**Si el paso «Publicar en Cloudflare» falla con `Authentication error [code: 10000]`:** el
token es válido —wrangler alcanza a identificar la cuenta— pero le falta el permiso
`Account · Workers Scripts · Edit`. Se arregla editando el token, sin cambiar el secret.

Ojo con el señuelo: wrangler imprime después «Unable to get membership roles… Are you
missing the `User->Memberships->Read` permission?». Eso es el diagnóstico de `whoami`
quejándose de que no puede listar roles, **no la causa del fallo**. Añadir ese permiso no
arregla nada.

El workflow tiene `workflow_dispatch`, así que se relanza desde la pestaña Actions sin
necesidad de inventar un commit.

### 1. La data real — es lo único que bloquea la fase 3

**Toda la data es inventada excepto el esqueleto que diste.** Empresas, cargos y periodos
son reales; descripciones, logros, modalidad, certificaciones y skills, no. Está marcado
con `⚠ DATA PROVISIONAL` en cada archivo.

| Archivo | Qué hay | Qué falta |
|---|---|---|
| `experiencia.yml` | El Tiempo, Tigo y Solvo con sus fechas | Descripciones y logros reales |
| `educacion.yml` | UPTC, Ingeniería Electrónica, grado 2018 | La fecha de inicio real |
| `certificaciones.yml` | AWS DEA + Databricks, inventadas | Cuáles tienes de verdad, con su ID |
| `skills.yml` | 19 registros plausibles | Podarlo a lo que defiendas en entrevista |
| `perfil.yml` | Resumen provisional, correo marcador | El resumen real (fase 6), el alias (fase 7) |

Al reescribirlo, las reglas permanentes: nada de nombres de clientes ni de compañeros, y
ninguna cifra interna de El Tiempo, Tigo o Solvo. Y después de tocar la data, **corre
`npm run cv:pdf` y commitea la data y los PDF juntos.**

Dos cosas puntuales que no inventé y hay que decidir:

- **No hay empleo actual.** Los tres registros terminan en octubre de 2024, así que el CV
  muestra un hueco de 22 meses. No inventé un cuarto empleo porque un empleo actual falso
  es la mentira más cara si se despliega por accidente.
- **Los IDs de credencial dicen `PENDIENTE-ID-REAL`** y salen así en el PDF. Las URL de
  verificación sí son las de los verificadores reales de AWS y Databricks, no enlaces
  fabricados, para que ningún despliegue accidental publique un 404.

### 2. El archivo privado, que tiene un teléfono falso

`src/content/data/perfil.private.yml` existe en tu computador con un número inventado que
usé para probar la inyección. **No está versionado** (comprobado con `git check-ignore`) y
su valor no se escribe aquí a propósito: este archivo es público, y el repositorio registra
qué se decidió, nunca qué había dentro. Cámbialo por el real cuando lo necesites; la
plantilla está en `perfil.private.example.yml`, que sí se versiona porque documenta la
forma y no lleva dato.

### 3. Commitear y desplegar

Esta sesión no commiteó nada. `npm run verify` pasa en limpio, así que el repo está
desplegable tal como está.

### 4. Decidir el alias real del correo antes de que alguien lo lea

El PDF ya publica lo que diga `perfil.yml`, y hoy dice `ejemplo@santiagogelvez.com`. Ese
valor **sí sale** en los cuatro PDF, así que deja de ser inofensivo en cuanto alguien
descargue el CV. El alias real se decidía en la fase 7; conviene adelantarlo al momento en
que el CV se empiece a compartir.

---

## Defectos conocidos

- **Los defectos de la fase 2 siguen abiertos** y no se tocaron: el post duplicado en el
  índice del blog, la mitad de la ventana vacía en pantallas anchas, los chips del stack
  en el cuerpo del caso de estudio, la ausencia de modo claro y la franja "empieza por
  aquí" sin separación visual. Todos se deciden con contenido real (fases 5 y 6).
- **La única fuente de verdad del PDF depende de una comprobación, no de la
  construcción.** Es el sacrificio explícito de ADR-0028: la comparación de fechas de
  commit atrapa el caso normal —cambiar la data y olvidar regenerar—, no el patológico.
- **`cv-itsm` está registrada y no se genera.** Es lo que dice ADR-0011: una vez existe el
  pipeline, la variante cuesta minutos. Cuando haga falta, `idiomas` decide sus salidas y
  no hay que tocar código.
- **El caso "empleo actual" (`fin` vacío) solo lo ejercita el proyecto de ejemplo**, que es
  el único registro con periodo abierto. Cuando entre la trayectoria real con un empleo
  vigente, conviene mirar esa línea del CV.
- **El despliegue depende ahora de GitHub Actions.** Si Actions se cae, no se publica,
  aunque Cloudflare esté perfectamente. Es la dependencia de plataforma que ADR-0030 acepta
  a cambio de que el PDF no pueda envejecer.
- **Los PDF pesan ~150 KB cada uno** y casi todo son las fuentes embebidas. Es aceptable
  para un adjunto de correo, pero si alguna vez molesta, la salida son fuentes estándar en
  el `@media print` — a costa de que el PDF deje de parecerse al sitio.
- **Las ranuras acoplan un script de Node a dos atributos del DOM.** Renombrar
  `data-cv-print` o `data-cv-private` en la plantilla rompería el pipeline. Se compensa con
  que una clave sin ranura **falla** el comando en vez de omitirse en silencio — probado a
  propósito esta sesión: con la ranura renombrada, `npm run cv:pdf` sale con código 1 en
  vez de producir un CV sin correo.
- **Sin formulario, el único canal de bajo roce es GitHub.** Es el sacrificio explícito de
  ADR-0029 y lo hereda la fase 7. Quien no use GitHub tiene que descargar un PDF para poder
  escribir, que es fricción real en la página cuyo trabajo es quitarla.
- **El PDF público ya no se puede generar sin correr el script**, porque el correo no está
  en el HTML del que se imprime. Desde ADR-0030 eso dejó de ser un problema: el script es
  parte de `npm run build`.

---

## Siguiente sesión: fase 4 — i18n de contenido y selector (2 h × 2)

El mecanismo del selector se construyó en la fase 1a y se verificó contra una pieza de
relleno; lo que falta es ejercitarlo con contenido real y cerrar lo que SPEC §8 pide y
todavía no existe: **el aviso discreto y descartable cuando el idioma del navegador no
coincide con el de la página**. Ojo con la restricción del proyecto — el sitio no tiene
una línea de JavaScript, y ese aviso es la primera cosa de v1 que parece necesitarlo.
Vale la pena decidirlo explícitamente antes de escribirlo.

Si prefieres avanzar en la data real primero, es una sesión de 2 h que desbloquea el CV
completo y no depende de nada más.

**La fase 7 hereda el formulario de contacto** con su criterio ya escrito en SPEC §11: el
proveedor tiene que reenviar y **no persistir** el mensaje, y eso se verifica en su
documentación, no se asume. Ahí también van el checkbox de la Ley 1581, la página de
privacidad y —si el proveedor elegido exige una llamada desde servidor— el único uso
legítimo de un secret en este proyecto: su clave de API, que nunca se le entrega al cliente.

**Terminado cuando:** el aviso de idioma existe o se decide por ADR que no existe, y el
caso sin traducción está comprobado contra una pieza real.

---

## Plan completo

| # | Fase | Horas | Formato |
|---|---|---|---|
| ✅ 0 | Higiene y baja de la visualización | 2 | hecho |
| ✅ 1 | Fundaciones: Astro, esquemas, rutas, deploy | 6-8 | hecho y desplegado |
| ✅ 2 | Sistema de diseño | 6-8 | hecho y desplegado |
| ◐ 3 | Data + CV + pipeline de PDF | 8-10 | mecanismo hecho; falta la data real |
| 4 | i18n de contenido y selector | 4-5 | 2 h × 2 |
| 5 | Sistema de diagramas | 6-8 | 4 h + 2 h × 2 |
| 6 | Contenido de lanzamiento (bilingüe) | 18-24 | 2 h × n |
| 7 | SEO, privacidad, cierre | 4-5 | 2 h × 2 |

**Total restante: 32-42 h.** La fase 6 conviene solaparla con las fases 4, 5 y 7 en lugar
de dejarla al final en bloque.

---

## Tareas recurrentes

- **Actualización de Astro: trimestral.** Es la mitigación acordada en ADR-0002 por haber
  elegido un framework con historial de versiones mayores frecuentes. Si se deja acumular,
  una actualización se come una sesión entera.
  Próxima revisión: **2026-11**. Puntos a revisar entonces:
  - TypeScript sigue fijado en 5.9.3 porque `@astrojs/check` declara `^5 || ^6` como peer
    y todavía no soporta la 7.
  - `import { z } from 'astro:content'` quedó deprecado en Astro 7; el proyecto ya usa
    `astro/zod`, que es el reemplazo. Conviene confirmar que sigue siendo la ruta
    recomendada.
  - **Nuevo:** `playwright` y `pdfjs-dist` entraron como devDependencies fijadas. Playwright
    saca versión cada pocas semanas y su Chromium se descarga aparte
    (`npx playwright install chromium`); si un clon nuevo no puede generar PDF, es eso.
- **Las fuentes no se actualizan solas** (ADR-0022). No urge —una tipografía no tiene
  parches de seguridad—, pero si alguna vez hacen falta más pesos o el subconjunto
  extendido, es trabajo manual sobre `public/fonts/` y sobre `tokens.css`.
- **El workflow de despliegue tiene tres versiones fijadas** (`actions/checkout@v6`,
  `actions/setup-node@v4`, `node-version: '22'`) y una que no lo está: el Chromium que baja
  `npx playwright install`. Va con la misma revisión trimestral de Astro. Si un despliegue
  falla al instalar el navegador, es ahí.
