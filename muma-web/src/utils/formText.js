/**
 * Normaliza texto de formularios a mayúsculas (es-419).
 * No aplicar a contraseñas ni emails si se añaden campos sensibles.
 */
export function toUpperFormValue(value) {
  if (value == null || typeof value !== 'string') return value;
  return value.toLocaleUpperCase('es-419');
}
