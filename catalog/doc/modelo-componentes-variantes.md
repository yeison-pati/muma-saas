# Modelo: Componentes integrados en Variant (sin ComponentValue)

## Principios

1. **Variantes catálogo**: Solo las creadas por el diseñador. P1/P2/P3 crean clon por proyecto.
2. **Componentes**: Sí se crean nuevos cuando el usuario edita (override en VariantQuote).
3. **Códigos SAP**: Se muestran solo si `value === originalValue` (componente) y si todos coinciden (variante).

## Entidades

### Component (`components`)
- `id`, `sap_ref`, `sap_code`, `name`, `value`, `original_value`
- `variant_id` (nullable): componente original del catálogo
- `variant_quote_id` (nullable): override creado al editar en proyecto
- Regla: exactamente uno no nulo

### Variant
- `OneToMany` Component (variant_id) = componentes originales

### VariantQuote
- `OneToMany` Component (variant_quote_id) = overrides por edición en proyecto

## Lógica de visualización

1. **Componentes efectivos** = variant.components + override por sapRef desde variantQuote.componentOverrides
2. **Por componente**: si `value !== originalValue` → no mostrar sapCode (solo sapRef)
3. **Por variante**: si algún componente difiere → P1/P2, sin SAP de variante

## Flujos

### Añadir variante a proyecto
- **Tal cual**: reutiliza variante existente, VariantQuote sin overrides
- **P1/P2**: clona variante, crea Component con variant_id en el clon
- **Edición posterior**: overrides en VariantQuote.componentOverrides

### Base de datos
- Tabla `components` con `variant_id`, `variant_quote_id`, `value`, `original_value`
- Eliminar tablas obsoletas: `component_values`, `variant_components` (si existían)
