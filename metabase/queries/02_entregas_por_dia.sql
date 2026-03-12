-- 2. ENTREGAS POR DÍA
-- Mes, Día, Recuento de proyectos efectivos (entregados) por día
-- Nota: usa modified_at como proxy de fecha de entrega (cuando se marcó effective)
SELECT
  to_char(p.modified_at, 'TMMonth') AS mes,
  extract(day FROM p.modified_at)::int AS dia,
  count(*) AS recuento_entregas
FROM public.projects p
WHERE p.effective = true
GROUP BY date_trunc('day', p.modified_at), to_char(p.modified_at, 'TMMonth'), extract(day FROM p.modified_at)
ORDER BY date_trunc('day', p.modified_at) DESC;
