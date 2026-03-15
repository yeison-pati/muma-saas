/**
 * Formatea mensaje de error incluyendo trace ID para trazabilidad.
 * Uso: alert(formatErrorMessage(err, 'Error por defecto'))
 */
export function formatErrorMessage(err, defaultMsg = 'Error') {
  const msg = err?.message || defaultMsg;
  const traceId = err?.traceId;
  if (traceId) {
    return `${msg}\n\nTrace ID: ${traceId}`;
  }
  return msg;
}
