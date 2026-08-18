/**
 * Utilidades de validación compartidas.
 *
 * `isUuid` estaba duplicada literalmente en `app/actions/post.ts` y
 * `app/actions/settings.ts`. Se centraliza para que la regla de qué es un
 * identificador válido tenga una sola definición.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_PATTERN.test(value);
}
