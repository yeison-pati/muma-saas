const P2_KEYWORDS = [
  'alto', 'altura', 'ancho', 'largo', 'luz', 'profundidad', 'fondo',
  'diametro', 'diámetro', 'dimension', 'dimensión', 'espesor', 'grosor',
  'volumen', 'tamaño', 'capacidad', 'litros', 'litro', 'kg', 'kilos',
  'peso máximo', 'carga', 'forma', 'formato', 'modelo', 'tipo de forma',
  'columnas', 'filas', 'columna', 'fila',
];

const isP2Key = (keyName) =>
  P2_KEYWORDS.some((kw) => String(keyName).toLowerCase().includes(kw));

/**
 * Calcula tipología (P1, P2) según cambios en características.
 * P2 = cambios en dimensiones; P1 = otros cambios.
 */
export function calculateTipologia(original = {}, updated = {}) {
  const keys = new Set([...Object.keys(original), ...Object.keys(updated)]);
  let changed = false;
  let p2Changed = false;

  keys.forEach((key) => {
    const baseVal = original[key] != null ? String(original[key]) : '';
    const newVal = updated[key] != null ? String(updated[key]) : '';
    if (baseVal !== newVal) {
      changed = true;
      if (isP2Key(key)) p2Changed = true;
    }
  });

  if (p2Changed) return 'p2';
  if (changed) return 'p1';
  return '';
}
