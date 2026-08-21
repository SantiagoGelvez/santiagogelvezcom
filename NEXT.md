# Siguiente

Estado del repositorio y siguiente paso. Se actualiza al final de cada sesión.

---

## Estado actual

**Fecha:** 2026-08-20
**Última sesión:** Separar el texto de la portada del resumen del CV (ADR-0032). Antes, en
la misma fecha: imágenes en el contenido y su visor a tamaño completo (ADR-0031), y la
fase 3 — el CV navegable, el pipeline de los cuatro PDF, la prueba ATS, sacar los datos de
contacto del HTML y mudar el despliegue a GitHub Actions
**Estado del repo:** desplegable, con **lo de ADR-0032 sin commitear**. Lo de las imágenes
sí está empujado (`6a7b386`). `npm run verify` pasa (27 rutas, 4 archivos de soporte, 4 PDF
del CV, 2 imágenes fuente → 17 servidas, 757 kB) y `astro check` sale con 0 errores, 0
avisos y 0 hints.
`git@github.com:SantiagoGelvez/santiagogelvezcom.git` · rama `main` · público.
**Fase del proyecto:** 0, 1, 2 completas. Fase 3 **completa en mecanismo**; le falta la
data real, que es trabajo de Santiago y no de ingeniería (ver pendientes).
**Infraestructura:** Cloudflare para servir, GitHub Actions para construir y publicar
(ADR-0030). Sigue costando $0/mes — repo público, minutos de Actions ilimitados. La tubería
nueva está **probada de punta a punta**: el robot instaló Chromium, generó los PDF, corrió
`verify` y publicó.

```
santiagogelvezcom/
├── CLAUDE.md              Se carga solo en cada sesión. Índice + reglas permanentes
├── NEXT.md                Este archivo — dónde vamos
├── DECISIONS.md           32 ADR registrados — por qué está así
├── docs/SPEC.md           Especificación completa — qué construir
├── .github/workflows/     El despliegue: construye, genera los PDF y publica (ADR-0030)
├── public/fonts/          Las cuatro .woff2 del sistema + la OFL (ADR-0022)
├── src/
│   ├── assets/            Imágenes fuente, optimizadas en build (ADR-0031)
│   ├── styles/            tokens · base · prose · cv (pantalla + papel en un archivo)
│   ├── components/        Band, Section, ProjectCard, PostEntry, Chip, Breadcrumbs,
│   │                      Figure, los dos avisos y CvDocument
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

### La portada dejó de ser el CV con otro tipo de letra

Salió de una observación tuya: la portada y el CV decían exactamente lo mismo, la portada
se saturaba, y los dos sitios no se enlazaban. Las tres cosas eran el mismo defecto —
`perfil.resumen` se renderizaba en `pages/{es,en}/index.astro` **y** en `CvDocument.astro`,
el mismo string literal.

Un campo con dos trabajos que tiran en direcciones opuestas: la portada la lee alguien que
no sabe quién eres y tiene cinco segundos, el CV lo lee un reclutador que ya lo abrió y lo
parsea un ATS. Lo caro no era la repetición sino que **no estaba optimizado para ninguno
de los dos**. Ahora son dos campos, `intro` y `resumen`, con **ADR-0032** detrás.

Lo que impide que se vuelvan a fundir, y las tres se probaron rompiéndolas a propósito:

| | |
|---|---|
| `intro` y `resumen` dicen lo mismo → **falla el build** | la comparación normaliza acentos, mayúsculas y puntuación, y rechaza que uno contenga al otro |
| `intro` pasa de 180 caracteres → **falla el build** | es lo que impide que vuelva a crecer hasta ser el párrafo denso que era |
| `cvView` devuelve el perfil **sin `intro`** | la plantilla del CV no tiene el campo, así que no puede renderizarlo por descuido |

Comprobado sobre la salida real y no sobre el código:

```
la intro en dist/es/index.html            → 1     el resumen en la portada     → 0
la intro en dist/es/cv/index.html         → 0     el resumen en el CV          → 1
la intro en cualquier otra ruta del sitio → 0     el resumen en el PDF         → sí
la intro en el texto del PDF              → no    el PDF sigue en 2 páginas    → sí
```

Y la mitad que no era de datos: el héroe gana **una línea con dos enlaces** —a los proyectos
y al CV— en la mono de los metadatos, sin botón. Antes el único camino de la portada al CV
era el nav, que es lo que hacía que se sintieran «dos sitios no conectados». Cada texto de
enlace describe su destino y se lee solo, fuera de la frase que lo rodea.

**Los dos textos siguen siendo provisionales** (fase 6), igual que lo era el resumen
anterior. Lo que quedó fijo es la forma y el invariante, no lo que dicen.

### Las imágenes entran, y el ancho deja de ser el problema

Salió de una pregunta tuya —¿se pueden poner imágenes y videos?— y la respuesta corta era
que sí desde el primer día: `sharp` ya venía con Astro y `astro:assets` no necesitaba
instalar nada. Lo que no estaba resuelto era el **ancho**: la columna de lectura mide
68ch ≈ 544 px y SPEC §9.7 pide capturas de dashboard, que a 544 px no se leen.

La salida obvia era sangrar la figura — la excepción que ADR-0021 dejó apuntada para la
fase 5. **Tu idea del visor es mejor que eso** y por eso se hizo así: al pulsar, la imagen
entra al *top layer*, que no está sujeto a `--measure` ni a `--frame`. El ancho deja de ser
un problema de maquetación sin tener que decidir una segunda geometría para el contenido.

Va con `popover` nativo, así que **el sitio sigue sin una línea de JavaScript**: `Esc`, el
cierre al hacer clic fuera, el foco y el fondo opacado los pone el navegador. Comprobado
con Playwright sobre el sitio construido, no a ojo:

```
abre con clic · abre con Enter        ✓     foco al abrir → botón Cerrar   ✓
Esc cierra                            ✓     clic en el fondo cierra        ✓
centrado a 1440, 1920 y 390           ✓     el visor no existe al imprimir ✓
"ver a tamaño completo" → pestaña nueva ✓   <script> en el HTML: solo JSON-LD
el idioma sale de la URL: ES → "Cerrar", EN → "Close", sin ninguna prop      ✓
```

El foco vuelve al botón que abrió con `Esc` y con «Cerrar»; con clic en el fondo se va al
`body`. Es el comportamiento del navegador y no se toca: quien cerró con el puntero no está
navegando con el teclado.

### Poner una imagen es una línea de markdown

Esto salió de una segunda pregunta tuya —*¿tengo que instanciar el componente cada vez?*— y
la respuesta era que no, pero había que comprobarlo. **El plugin de MDX convierte
`![alt](x.png)` en un elemento interceptable**, así que las cuatro páginas mapean
`components={{ img: Figure }}` una sola vez y en el `.mdx` se escribe markdown y nada más:

```md
![Lo que la imagen muestra, para quien no la ve](~/assets/posts/mi-post/flujo.png "La leyenda visible")
```

MDX entrega la imagen **ya resuelta como objeto**, el `alt` y el `title`. El alias `~/`
funciona en esa ruta, así que no depende de a qué profundidad esté el archivo. Y el idioma
sale de `Astro.currentLocale`, que no puede equivocarse porque la ruta **es** el idioma —
eso quitó la prop `locale`, que era la que más molestaba.

El HTML que sale es idéntico al de instanciar el componente a mano. Lo que cambia es el
coste de escribir, y ese es el que decide si el sitio se llena o no.

**Dos errores que encontró la máquina y no la revisión a ojo:**

- El visor ocupaba toda la ventana, así que **no quedaba ningún "fuera" que pulsar** y el
  gesto más obvio no hacía nada. La caja del popover tiene que ser la imagen y nada más;
  lo que oscurece la pantalla es el `::backdrop`, que no es parte de la caja.
- Como `image.layout` es global, mi `getImage()` de la versión completa generaba **su
  propio srcset de siete anchos** para algo que se usa en un tamaño: seis archivos muertos
  por figura. Lo delató el aviso de imágenes huérfanas. De 15 archivos servidos a 9.

Y un tercero, más fino: `.prose > :last-child` fijaba el margen inferior del popover en
cero, y como `margin: auto` es lo que lo centra, el `auto` de arriba absorbía todo el hueco
y la imagen quedaba pegada al borde inferior, cortada. Las reglas de ritmo vertical de la
prosa ahora excluyen `[popover]`, que es lo correcto de todos modos: un popover no está en
el flujo, así que un margen suyo no separa nada.

**Lo que `verify` hace cumplir ahora**, y las tres se probaron rompiéndolas a propósito:

| | |
|---|---|
| 400 kB por fuente | el repo es público y lo que entra no se saca |
| 500 kB por imagen servida · 2.5 MB en total | el ancho de banda, y la deriva |
| EXIF / XMP en una fuente → falla | GPS, dispositivo y nombre de usuario |
| `id` duplicados en el HTML → falla | que el visor no abra la figura equivocada |

La cuarta regla —qué puede verse **dentro** de una captura— no la puede auditar ningún
script y por eso está en las reglas permanentes de `CLAUDE.md`. Es la más importante de las
cinco: una captura filtra un nombre de cliente o un correo en una esquina de un modo que el
texto nunca haría, y en un repositorio público eso no se corrige borrando.

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
| `perfil.yml` | `intro` y `resumen` provisionales, correo marcador | Los dos textos reales (fase 6), el alias (fase 7). Ojo: son **dos lectores distintos**, y el esquema falla si dicen lo mismo (ADR-0032) |

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

### 3. Confirmar que Workers Builds quedó desconectado

Si sigue conectado, cada push dispara **dos** despliegues y el de Cloudflare publicaría un
sitio **sin los PDF**, porque ahí Chromium no arranca. No se ha visto ese comportamiento
—producción es correcta— pero conviene mirarlo una vez en el panel: tu Worker → *Settings*
→ *Build*.

### 4. Confirmar que `hola@santiagogelvez.com` recibe de verdad

Elegiste el alias durante la sesión y **ya está en producción**: el PDF que cualquiera
descargue lo lleva impreso. Vale la pena mandarte un correo de prueba desde fuera y
confirmar que aterriza donde esperas, porque a partir de ahora es la única vía de contacto
que sale del sitio.

Queda pendiente de la fase 7 lo demás del correo: el formulario, su proveedor y la política
de datos.

---

### Desplegado y comprobado en producción

El primer intento falló en el último paso —el token no tenía `Workers Scripts · Edit`— y
**producción no se movió**, que es el comportamiento correcto: el pipeline verifica antes
de publicar y no deja nada a medias. Con el permiso corregido, el segundo intento publicó.

Comprobado en vivo, contra el sitio servido:

```
las 27 rutas del apex                → 200
/cv/…-ES.pdf y …-EN.pdf              → 200 application/pdf  (145 KB y 152 KB)
el correo en el HTML de las 27 rutas → 0 ocurrencias
el correo en el texto del PDF        → presente (el ATS lo lee)
el correo greppable en el binario    → no (va en el stream comprimido)
el teléfono en el PDF público        → ausente
/                                    → 301 hacia /es/
www.santiagogelvez.com               → 301 hacia el apex
/no-existe/                          → 404 con la página propia
terceros en el HTML                  → ninguno (solo enlaces salientes)
dig +short MX santiagogelvez.com     → 1 smtp.google.com  (correo intacto)
```

La comprobación del correo se rehízo con el alias real. La primera pasada buscaba
`ejemplo@`, que ya no existía porque el alias cambió a `hola@` en mitad de la sesión: la
prueba pasaba sin comprobar nada. Un invariante que busca el string equivocado es peor que
no tenerlo, porque da confianza.

---

## Defectos conocidos

- **El visor pide Safari 17** (septiembre de 2023). En un navegador anterior el botón sobre
  la imagen no hace nada. Lo compensa el enlace «ver a tamaño completo» de la leyenda, y el
  precio de esa compensación es que hay **dos afordances para lo mismo** — fealdad real,
  aceptada en ADR-0031 porque el enlace además es lo único que sobrevive a la impresión y lo
  que en móvil permite pellizcar para acercar.
- **Astro despliega también la fuente sin optimizar.** Importar una imagen en un MDX es un
  import de módulo y Vite copia el archivo a `dist/`, aunque ningún HTML lo enlace. Hoy son
  39 kB; escala con cada imagen que entre. No se puede evitar sin salirse del pipeline de
  assets, así que `verify` lo avisa y lo cuenta en el presupuesto en vez de romper el build
  por algo que no se puede arreglar.
- **Mapear `img` es global: toda imagen de markdown es una figura con visor.** No hay forma
  de pedir una imagen pequeña en línea sin visor salvo escribiendo HTML crudo en el MDX. Se
  acepta porque hoy una imagen dentro de una pieza siempre es una figura; si deja de serlo,
  hace falta una convención y no un parche.
- **La leyenda viaja en el `title` de markdown**, que es el hueco del *tooltip*. Es el único
  campo extra que da la sintaxis, así que se le cambia el significado: quien abra un `.mdx`
  sin conocer ADR-0031 puede leerlo como un texto flotante que nunca aparece.
- **En móvil el visor sirve de poco con una imagen apaisada**: a 390 px una 16:9 se queda en
  342 × 194. Ahí el enlace de la leyenda es mejor que el visor, porque abre el visor propio
  del navegador y ese sí permite pellizcar. Es una salida real, no un consuelo, pero conviene
  saber que la mejor experiencia en móvil es la del fallback.
- **`intro` y `resumen` se pueden desincronizar sin que nada avise.** El esquema detecta
  que digan lo mismo; no puede detectar que uno se quedó viejo. Al reescribir la
  trayectoria en la fase 6 hay que tocar los dos, en los dos idiomas — cuatro cadenas.
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

### Qué hereda la fase 5, ahora que se llama «diagramas y media»

- **El sistema de diagramas**, que es lo que SPEC §13 pide proponer antes de dibujar el
  primero: lenguaje de esquemático de circuitos, heredando el vocabulario del riel.
- **El sangrado**, ya sin prisa. El visor resolvió el ancho de las capturas; lo que queda es
  el ancho de un **diagrama**, que se lee dentro del flujo del texto y no en un visor.
- **El campo `diagrama` del esquema de proyecto**, que lleva declarado y sin consumir desde
  la fase 1. Se decide con el sistema de diagramas, no antes.
- **El clip corto y mudo** (10-20 s) para los proyectos con demo. Ojo con dos cosas al
  llegar: `autoplay muted loop` es movimiento y SPEC §13 exige `prefers-reduced-motion`
  respetado — sin JavaScript **no se puede** condicionar ese atributo, así que la salida
  limpia es `controls` + `poster` sin autoplay, que cumple por construcción. Y el `<iframe>`
  de YouTube rompe el invariante «terceros en el HTML → ninguno» que `verify` comprueba en
  producción.
- **La demo larga, si llega: R2 con `media.santiagogelvez.com`** — 10 GB gratis y egreso sin
  costo, así que sigue siendo $0, y el archivo no contamina la historia del repo público.
  Necesita su ADR. **Monta un CNAME: verificar `dig +short MX santiagogelvez.com` después.**
  Ojo con no generalizarlo: **las imágenes se quedan en el repositorio a propósito**, porque
  fuera de él el build no las puede optimizar y se pierden `srcset`, formato moderno y
  dimensiones declaradas. R2 es para el video, que pesa dos órdenes de magnitud más y no
  gana nada con ese pipeline.

**Pendiente pequeño de esta sesión:** `src/assets/posts/post-de-ejemplo/placeholder-wide.png`
es una imagen sintética que existe solo para ejercitar el componente. Se borra cuando entre
la primera imagen real, junto con los dos párrafos que la presentan en los posts de ejemplo.

---

## Plan completo

| # | Fase | Horas | Formato |
|---|---|---|---|
| ✅ 0 | Higiene y baja de la visualización | 2 | hecho |
| ✅ 1 | Fundaciones: Astro, esquemas, rutas, deploy | 6-8 | hecho y desplegado |
| ✅ 2 | Sistema de diseño | 6-8 | hecho y desplegado |
| ◐ 3 | Data + CV + pipeline de PDF | 8-10 | desplegado; falta la data real |
| 4 | i18n de contenido y selector | 4-5 | 2 h × 2 |
| 5 | Sistema de diagramas y media | 6-8 | 4 h + 2 h × 2 |
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
