# Optimización de consultas (Catalog - R2DBC)

## @EntityGraph y JPA

`@EntityGraph` y `@Query` con entity graphs son conceptos de **JPA** (Spring Data JPA). En este proyecto el módulo **catalog** usa **Spring Data R2DBC** (reactivo), no JPA, por lo que no hay entidades JPA ni entity graphs.

Para lograr un efecto similar (evitar N+1 y reducir round-trips), en R2DBC se ha optado por:

1. **Métodos de repositorio por lotes (batch)**  
   Consultas que cargan muchas filas en una sola ida a la base:

   - `ProjectVariantRepo.findByProjectIdIn(Collection<UUID> projectIds)`
   - `VariantQuoteRepo.findByVariantIdIn(Collection<UUID> variantIds)`
   - `VariantComponentRepo.findByVariantIdIn(Collection<UUID> variantIds)`
   - `VariantRepo.findByIdIn(Collection<UUID> ids)`
   - `ComponentRepo.findByIdIn(Collection<UUID> ids)`

2. **Uso de `@Query` con SQL nativo**  
   Donde haga falta, se pueden definir métodos con `@Query` y SQL explícito (como en `ProjectSequenceRepository.nextDailySequence()`).

Si en el futuro se migra catalog a **JPA**, entonces sí se podrán usar:

- `@EntityGraph(attributePaths = { "variants", "variants.components" })` en entidades y repositorios.
- `@Query` con `JOIN FETCH` para fijar el plan de carga en una sola consulta.

## Cómo usar los métodos batch

El servicio puede agrupar IDs (por ejemplo, de proyectos o variantes) y llamar una sola vez a `findByProjectIdIn`, `findByVariantIdIn`, `findByIdIn`, etc., y luego montar los DTOs en memoria. Así se reducen las consultas por proyecto/variante a unas pocas consultas globales.
