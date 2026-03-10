/**
 * Lógica de códigos SAP/REF para variantes y componentes.
 *
 * Reglas:
 * - Variante: compara componentes actuales vs originales. Si difieren → 1 código (REF).
 *   Si coinciden → 2 códigos (SAP + REF). P3 nuevo sin códigos.
 * - Componente: compara solo su valor vs original. Si difiere → 1 código (REF), sapCode null.
 *   Si coincide → 2 códigos. Sin códigos si fue creado por comercial (sin sapRef/sapCode).
 */

/**
 * Devuelve los códigos a mostrar para una variante.
 * REF y SAP son distintos: nunca usar REF en lugar de SAP ni viceversa.
 * - P1/P2: 1 código (REF). Nunca 2.
 * - Variante normal: 2 si no modificada (REF + SAP), 1 (REF) si modificada.
 * - P3: ninguno si sin sapRef/sapCode.
 */
export function getVariantDisplayCodes({ sapRef, sapCode, type, currentByKey = {}, originalByKey = {} }) {
  const t = String(type || '').toLowerCase();
  if (t === 'p3' && !sapRef && !sapCode) return null;

  if (!sapRef && !sapCode) return null;

  if (t === 'p1' || t === 'p2') {
    return { primary: sapRef || null, secondary: null };
  }

  const allKeys = new Set([...Object.keys(currentByKey || {}), ...Object.keys(originalByKey || {})]);
  const hasComponentChange = [...allKeys].some((k) => {
    const origVal = String((originalByKey && originalByKey[k]) ?? '').trim();
    const currVal = String((currentByKey && currentByKey[k]) ?? '').trim();
    return origVal !== currVal;
  });

  if (hasComponentChange) {
    return { primary: sapRef || null, secondary: null };
  }
  if (sapRef && sapCode) {
    return { primary: sapRef, secondary: sapCode };
  }
  if (sapRef) return { primary: sapRef, secondary: null };
  if (sapCode) return { primary: sapCode, secondary: null };
  return null;
}

/**
 * Devuelve los códigos a mostrar para un componente.
 * Los componentes son INDEPENDIENTES de la tipología P1/P2 de la variante.
 * Solo depende de: modificado (valor actual vs original) → 1 código. No modificado → 2 códigos.
 */
export function getComponentDisplayCodes({ sapRef, sapCode, currentValue, originalValue }) {
  if (!sapRef && !sapCode) return null;

  const curr = String(currentValue ?? '').trim();
  const orig = String(originalValue ?? '').trim();
  const modified = curr !== orig;

  if (modified) {
    return { primary: sapRef || null, secondary: null };
  }
  if (sapRef && sapCode) {
    return { primary: sapRef, secondary: sapCode };
  }
  if (sapRef) return { primary: sapRef, secondary: null };
  if (sapCode) return { primary: sapCode, secondary: null };
  return null;
}

/**
 * Formatea códigos para mostrar. 2 códigos = no editado. 1 código = editado.
 * Siempre mostrar ambos cuando existen (incluso si son iguales).
 * Lo que determina 1, 2 o ninguno es la tipología (P1/P2/P3), no el formateo.
 */
export function formatCodes(primary, secondary) {
  if (!primary) return '';
  if (secondary != null && String(secondary) !== '') {
    return `${primary} · ${secondary}`;
  }
  return primary;
}
