# Metabase Analytics MUMA

## Vistas preconfiguradas

Al iniciar con `docker-compose up`, el servicio `metabase-init` crea automáticamente:

1. **Productos especiales en proceso** – Proyectos no efectivos (pendientes de cotización)
2. **Entregas por día** – Recuento de proyectos efectivos por día
3. **Seguimiento de especiales** – Lista de proyectos con filtros (cliente, asesor, estado, etc.)
4. **KPIs Resumen** – Entregados, pendientes, total cotizado, ingresos
5. **Clasificación incumplimiento** – Distribución por tipología (P1–P5)

## Consultas SQL

Las consultas están en `metabase/queries/` y pueden ejecutarse manualmente o usarse como referencia:

- `01_productos_especiales_en_proceso.sql`
- `02_entregas_por_dia.sql`
- `03_seguimiento_especiales.sql`
- `04_kpis_resumen.sql`
- `05_clasificacion_incumplimiento.sql`

## Creación manual en Metabase

Si prefieres crear las vistas a mano:

1. Conectar la base de datos **Catálogo** (host: catalogdb, puerto: 5432, db: catalog_db).
2. Crear una nueva pregunta → SQL nativo.
3. Pegar el contenido de cada archivo `.sql` y guardar.
4. Crear un dashboard y añadir las 5 preguntas.

## Variables de entorno

Se leen desde `.env.base` (y `.env.local` si usas `./local.sh`):

- `METABASE_ADMIN_1_EMAIL` / `METABASE_ADMIN_1_PASS` – Admin de Metabase.
- `METABASE_VIEWER_EMAIL` / `METABASE_VIEWER_PASS` – Usuario viewer (solo lectura).
- `CATALOG_DB_*` – Conexión a la base de datos del catálogo.

## URL

- Local: http://localhost:3000/analytics
- Con Caddy: http://localhost:8000/analytics
