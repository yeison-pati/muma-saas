/**
 * Convierte mensajes técnicos de GraphQL en texto más legible para el usuario.
 * @param {unknown} err
 * @returns {{ short: string, detail?: string }}
 */
export function graphqlErrorUserMessage(err) {
  const raw = typeof err?.message === 'string' ? err.message : String(err ?? 'Error');

  if (/not defined for input object type/i.test(raw)) {
    return {
      short:
        'El servidor no reconoce un campo del formulario (API desactualizada). Reiniciá el servicio de productos tras desplegar cambios, o avisá a soporte.',
      detail: raw,
    };
  }

  if (/CreateBaseInitialVariantInput/i.test(raw) && /image|model/i.test(raw)) {
    return {
      short:
        'No se pudieron registrar las variantes: el contrato del servidor debe incluir imagen y modelo por variante. Actualizá el servicio Products.',
      detail: raw,
    };
  }

  if (raw.length > 220) {
    return {
      short: `${raw.slice(0, 217).trim()}…`,
      detail: raw,
    };
  }

  return { short: raw, detail: raw.length > 120 ? raw : undefined };
}
