# Seguimiento y métricas de tiempo

## Flujo de etapas

```
COMERCIAL → COTIZADOR (tiempo cotización) → COMERCIAL (hace efectivo) → DISEÑADOR (tiempo diseño) → DESARROLLO (tiempo desarrollo)
```

## Campos y entidades agregados

### Project
- **requestedAt** (Instant): Fecha/hora exacta de solicitud del proyecto (cuando el comercial crea el proyecto).

### VariantQuote
- **quotedAt** (Instant): Fecha/hora en que el cotizador terminó de cotizar. Se asigna automáticamente al cotizar.
- **designedAt** (Instant): Fecha/hora en que el diseñador marcó como diseñada. P1: se asigna automáticamente al cotizar (0 días diseño).
- **developedAt** (Instant): Fecha/hora en que desarrollo (datos maestros) marcó como desarrollada (agregada a SAP).
- **designerId** (UUID): ID del diseñador que marcó como diseñada.
- **developmentUserId** (UUID): ID del usuario de desarrollo que marcó como desarrollada.

### TypologyStandard (nueva entidad)
Estándares de tiempo por tipología para comparar tiempos reales vs esperados:

| Tipología | DIAS-COTIZ | DIAS-DISEÑO | DIAS-DLLO |
|-----------|------------|-------------|-----------|
| P1        | 1          | 0           | 2         |
| P2        | 2          | 2           | 2         |
| P3        | 5          | 3           | 3         |
| P4        | 2          | 1           | 1         |
| P5        | 10         | 0           | 1         |
| P (portafolio) | 5     | 0           | 6h/semana |

## Rol DEVELOPMENT

Nuevo rol "Desarrollo / Datos maestros":
- Ve proyectos efectivos.
- Agrega productos a SAP.
- Marca variantes como desarrolladas cuando están listas.

## Mutaciones GraphQL

- **markVariantAsDesigned**(projectId, variantId, designerId): Diseñador marca variante como diseñada.
- **markVariantAsDeveloped**(projectId, variantId, developmentUserId): Desarrollo marca variante como desarrollada.

## Queries GraphQL

- **projectsForDevelopment**: Proyectos efectivos (alias de projectsEffective para rol desarrollo).
- **typologyStandards**: Estándares de tiempo por tipología (para métricas en admin).

## Validaciones

- **markVariantAsDesigned**: La variante debe estar cotizada (quotedAt) antes de marcar diseñada.
- **markVariantAsDeveloped**: Solo en proyectos efectivos, solo variantes efectivas, debe estar diseñada (designedAt) antes.

## Cálculo de métricas (a implementar en vistas/admin)

- **Cotización a tiempo**: `(quotedAt - requestedAt)` ≤ estándar.daysCotiz
- **Diseño a tiempo**: `(designedAt - quotedAt)` ≤ estándar.daysDiseno
- **Desarrollo a tiempo**: `(developedAt - designedAt)` ≤ estándar.daysDesarrollo

La comparación siempre es contra la fecha de la etapa anterior. Marca si efectividad (proyecto/producto/tipología) se desarrolló a tiempo o impuntual.
