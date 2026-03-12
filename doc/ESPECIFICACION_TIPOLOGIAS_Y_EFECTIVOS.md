# Especificación: Tipologías P4/P5 y Productos Efectivos

## 1. Tipologías

| Tipo | Descripción | Asignación |
|------|-------------|------------|
| **P4** | Variante existente del catálogo, sin modificaciones | Automática al seleccionar variante existente |
| **P2** | Variante con cambios en dimensiones (palabras clave P2) | Por calculateTipologia |
| **P1** | Variante con cambios que no son P2 | Por calculateTipologia |
| **P3** | Variante creada desde cero (custom) | Al crear P3 |
| **P5** | Alternativa a P3; cotizador puede alternar P3↔P5 | Manual por cotizador |

**Regla**: Si `type == null` → variante no tiene tipología asignada (ej. revertida).

## 2. Productos efectivos

- **No quitar productos**: Eliminar botón "Quitar" en Solicitudes. Los productos no se borran del proyecto.
- **VariantQuote.effective**: Cada variante en un proyecto puede marcarse efectiva individualmente.
- **Proyecto efectivo**: Lista solo variantes con `effective=true`. El comercial marca variantes efectivas para que se listen.
- **Tras proyecto efectivo**: No desmarcar efectivo, no editar. Solo marcar variantes efectivas.

## 3. Reabrir en proyecto efectivo

Si el proyecto ya es efectivo y alguien edita algo, al reabrir se **crea un nuevo proyecto** con:
- Variantes editadas (con los cambios)
- Variantes efectivas del proyecto original (copiadas)

El proyecto original permanece efectivo e inmutable.
