/**
 * Reglas de slug de SPEC §8, en un solo lugar: minúsculas, ASCII, guiones.
 * Sin tildes, `ñ` → `n`. Las usan tanto los esquemas (`content.config.ts`) como
 * la capa de consulta, que valida los slugs derivados del nombre del archivo.
 *
 * Los dígitos se permiten en proyectos y se prohíben en posts. SPEC §8 dice
 * "sin fechas ni números", pero su propio ejemplo es `mundial-2026`. La
 * contradicción se resuelve por el motivo que la regla misma da: una fecha en
 * la URL envejece el post. En `mundial-2026` el número es parte del nombre de
 * la cosa, no la fecha en que se escribió, y no envejece nada.
 */
export const SLUG_NO_DIGITS = /^[a-z]+(?:-[a-z]+)*$/;
export const SLUG_WITH_DIGITS = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const POST_SLUG_RULE = 'minúsculas ASCII y guiones, sin dígitos ni tildes (SPEC §8)';
export const PROJECT_SLUG_RULE = 'minúsculas ASCII, dígitos y guiones, sin tildes (SPEC §8)';
