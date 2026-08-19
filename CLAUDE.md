# santiagogelvez.com

Sitio personal estático de Santiago Gelvez, Ingeniero de Datos.

**Es un activo de búsqueda de empleo, no un experimento técnico.** Existe para
desmontar una objeción concreta: la trayectoria Tigo → El Tiempo (Data Engineer) →
Solvo (ITSM) se lee como "se salió del área". El sitio demuestra lo contrario con
evidencia. Optimiza por salir a producción y por costo de mantenimiento bajo, nunca
por sofisticación técnica.

## Antes de proponer nada, lee en este orden

1. **`NEXT.md`** — dónde vamos, qué quedó hecho, qué sigue y con qué criterio de
   terminado. Empieza siempre por aquí.
2. **`DECISIONS.md`** — qué ya se decidió y qué se sacrificó. No reabras una decisión
   sin un argumento nuevo; si lo tienes, dilo.
3. **`docs/SPEC.md`** — la especificación completa: mapa del sitio, modelo de datos,
   reglas del CV y del PDF, slugs, plantillas de contenido, SEO, privacidad, dirección
   de diseño, fuera de alcance y definición de terminado.

`SPEC.md` es la fuente de verdad de **qué construir**. `DECISIONS.md` es la de **por
qué está así**. Si se contradicen, gana el ADR más reciente y hay que actualizar la
spec.

## Cómo trabajar

- **Incrementos pequeños y verificables.** Nada de generar el sitio de un tirón. Cada
  paso debe poder correrse y verse.
- **Confirma los cambios estructurales antes de hacerlos** (framework, esquema de
  datos, estructura de rutas). Los cosméticos no necesitan confirmación.
- **Deja el repo desplegable al final de cada sesión.** Nunca a mitad de una
  refactorización.
- **Si algo del plan parece un error, dilo.** Aquí no se busca obediencia sino
  criterio. Hay fondo técnico: no simplifiques las explicaciones.
- Sesiones de ~2 h semanales, con bloques de 4 h ocasionales. El trabajo estructural va
  en los bloques de 4 h; el contenido fragmenta bien en los de 2 h.

## Idiomas

Conversación, `DECISIONS.md`, `NEXT.md` y `SPEC.md` en **español**. Código, nombres de
archivos, ramas y mensajes de commit en **inglés**.

## Reglas permanentes de privacidad

El repositorio es **público** (ADR-0009). Antes de crear cualquier archivo, pregunta si
su contenido es publicable. Un error aquí no se corrige borrando: queda en `git log`.

- **Nunca se versiona ni se publica:** teléfono, dirección exacta, documento, fecha de
  nacimiento, firma, fotos familiares, rutinas o datos de terceros. La ciudad sí
  ("Duitama, Boyacá, Colombia").
- **Nunca correo en texto plano.** Se usa un alias del dominio, rotable. Nunca el
  correo principal de Workspace.
- **Los campos no públicos viven en archivos ignorados por git** (ADR-0006). El PDF
  completo del CV se genera en local y su salida jamás entra al build desplegado.
- **Nada de nombres de clientes, compañeros ni cifras internas** de Solvo, El Tiempo o
  Tigo.
- El repo registra **qué se decidió y por qué**, nunca **qué se estaba exponiendo**.

## Al cerrar la sesión

- **`NEXT.md`: siempre.** Estado del repo, qué quedó hecho, qué sigue.
- **`DECISIONS.md`: solo si se decidió algo** que costaría reabrir. Formato ADR, y el
  campo "qué se sacrificó" es obligatorio — sin él es publicidad, no ingeniería. Las
  decisiones no se editan: si una se revierte, se escribe un ADR nuevo que la reemplace.

## Stack

Astro (estático, TypeScript estricto, integraciones limitadas a `mdx` y `sitemap`,
versiones fijas) sobre Cloudflare Workers con assets estáticos. Sin base de datos, sin
CMS, sin autenticación, sin nada con estado. Presupuesto de infraestructura: $0/mes,
sin excepciones. Si parece hacer falta una base de datos, el alcance se salió de
control: consúltalo antes.

El DNS ya está en Cloudflare y el MX de Google Workspace es `1 smtp.google.com`.
**No tocar los registros MX**: el correo del dominio no puede caerse. Verificar con
`dig +short MX santiagogelvez.com` después de cualquier cambio de origen.
