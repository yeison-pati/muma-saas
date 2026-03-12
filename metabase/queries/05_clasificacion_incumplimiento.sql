-- 5. CLASIFICACIÓN INCUMPLIMIENTO (por tipología - proxy para Costeo/Diseño/Terceros)
-- Distribución de variantes por tipología en proyectos efectivos
SELECT
  tipologia,
  count(*) AS cantidad,
  CASE
    WHEN tipologia IN ('p1','p2') THEN 'Variación (P1/P2)'
    WHEN tipologia IN ('p3','p5') THEN 'Especial (P3/P5)'
    WHEN tipologia = 'p4' THEN 'Existente (P4)'
    ELSE 'Otro'
  END AS clasificacion
FROM (
  SELECT coalesce(lower(trim(vq.type)), 'sin_tipo') AS tipologia
  FROM public.variant_quote vq
  JOIN public.projects p ON p.id = vq.project_id
  WHERE p.effective = true AND vq.effective = true
) sub
GROUP BY tipologia
ORDER BY cantidad DESC;
