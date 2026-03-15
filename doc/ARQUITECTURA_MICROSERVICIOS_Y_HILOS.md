# Arquitectura: Microservicios, Líderes y Hilos

## 1. Separación en 2 microservicios

| Servicio | Contenido | Responsable |
|----------|-----------|-------------|
| **Productos** | Base, Variante, Componentes (originales) | Diseñador crea/edita/elimina todo aquí |
| **Catálogo** | Proyectos y copias de variantes | Cotizador, Comercial, Desarrollo |

### Interacción del diseñador
- El **diseñador** interactúa con **ambos** microservicios:
  - **Productos**: crea, edita y elimina bases, variantes y componentes originales.
  - **Catálogo**: consulta proyectos, ve variantes en contexto de proyecto, marca como diseñadas, recibe copias para comparar contra originales.

### Reglas
- Las variantes del proyecto son **copias**; siempre se comparan contra las originales del servicio de productos.
- Evita que cambios en proyectos afecten las variantes originales.
- Al crear/editar en catálogo, se obtienen copias desde productos y se mantiene la referencia al original para comparación.

---

## 2. Tipologías y diseño

| Tipología | Requiere diseño | Descripción |
|-----------|-----------------|-------------|
| **P1** | No | Cambio de acabados |
| **P2** | Sí | Variación dimensional |
| **P3** | Sí | Producto especial nuevo |
| **P4** | Sí | Reactivación de descontinuado |
| **P5** | No | Producto de compra externa |
| **P** (portafolio) | No | Portafolio |

- **P1 y P5**: no requieren diseño; van directo de cotización a desarrollo.
- **P2, P3, P4**: requieren diseño; ningún producto pasa a desarrollo hasta que todo el proyecto esté diseñado.

---

## 3. Líderes y asignación manual

- **Cotizador**, **Diseñador** y **Desarrollo** pueden tener rol de **líder/jefe**.
- La asignación pasa de automática a manual: los líderes asignan cada producto/variante a una persona.
- Un proyecto se marca como **diseñado** cuando todas sus variantes están diseñadas (validación al marcar una como diseñada).

---

## 4. Hilos (Comercial ↔ Diseño, Comercial ↔ Desarrollo)

- Vista de hilos filtrada por proyecto/consecutivo.
- Tiempo del hilo = desde apertura hasta cierre.
- Ese tiempo se suma como **tiempo de elaboración disponible** para no penalizar métricas.
- Ejemplo: 2 días estándar + 3 días en hilo = 5 días totales para esa variante.
- Regla: solo se cuenta el intervalo entre el **primer hilo abierto** y el **último cerrado** (no se suman todos los hilos).
- Roles con vista de hilos: **Comercial**, **Diseño** y **Desarrollo**.

---

## 5. Fechas y flujos

- Al crear el proyecto se define la fecha de inicio para cálculos (`requestedAt`).
- **P1/P5**: Cotización → Comercial efectivo → Desarrollo (sin diseño).
- **P2/P3/P4**: Cotización → Diseño → Comercial efectivo → Desarrollo.

---

## 6. Vistas

- **Diseñador** y **Desarrollo**: vistas de proyectos similares.
- **Comercial**, **Diseño** y **Desarrollo**: nueva vista de **hilos**.

---

## 7. Implementación completada

- **Microservicio Productos**: Base, Variant, Component. API GraphQL + REST GET /variants/{id} para Catalog.
- **Catalog**: productVariantId en VariantQuote. P4: Catalog devuelve mínimo; front enriquece desde products en context.
- **Líderes**: isLeader en User, asignación manual (assignedQuoterId, assignedDesignerId, assignedDevelopmentUserId en VariantQuote).
- **Hilos**: Entidad Thread, openThread/closeThread, vista Hilos en Comercial, Diseñador, Desarrollo.
- **P1/P5 sin diseño**: designedAt=quotedAt automático. P2/P3/P4 requieren diseño; validación en markAsDeveloped.
- **Vistas**: Diseñador y Desarrollo con búsqueda; vista Hilos; asignación en Cotizador, Diseñador, Desarrollo.

### Pendiente migración frontend
- Diseñador Productos: migrar a consumir Products API en lugar de Catalog para bases/variantes originales.
