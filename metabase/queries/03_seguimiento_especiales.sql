-- 3. SEGUIMIENTO DE ESPECIALES (vista base para filtros)
-- Lista proyectos con datos para filtrar por tipo, asesor, regional, cliente, estado, fecha
SELECT
  p.id,
  p.consecutive AS especial_numero,
  p.name AS nombre_proyecto,
  p.client AS cliente,
  p.region AS regional,
  p.sales_name AS asesor,
  p.version,
  p.created_at AS fecha_ingreso,
  CASE WHEN p.effective THEN 'ENTREGADO' ELSE 'PENDIENTE' END AS estado,
  p.total_cost AS total_cotizado,
  p.quoted AS cotizado,
  p.effective AS efectivo
FROM public.projects p
ORDER BY p.created_at DESC;
