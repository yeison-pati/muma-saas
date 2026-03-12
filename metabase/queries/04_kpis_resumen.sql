-- 4. KPIs - Resumen general
-- Nivel de servicio, totales, ingresos, entregados, pendientes
WITH entregados AS (
  SELECT count(*) AS n FROM public.projects WHERE effective = true
),
pendientes AS (
  SELECT count(*) AS n FROM public.projects WHERE effective = false AND (quoted = false OR reopen = true)
),
totales AS (
  SELECT
    count(*) AS total_proyectos,
    coalesce(sum(total_cost), 0) AS total_cotizado_pesos,
    coalesce(sum(CASE WHEN effective THEN total_cost ELSE 0 END), 0) AS total_efectivo_pesos
  FROM public.projects
)
SELECT
  (SELECT n FROM entregados) AS entregados,
  (SELECT n FROM pendientes) AS pendientes,
  (SELECT total_proyectos FROM totales) AS total_proyectos,
  (SELECT total_cotizado_pesos FROM totales) AS total_cotizado_pesos,
  (SELECT total_efectivo_pesos FROM totales) AS total_efectivo_pesos;
