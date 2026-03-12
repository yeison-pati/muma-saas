-- 1. PRODUCTOS ESPECIALES EN PROCESO
-- Tabla: Mes, Día, Especial N°, Asesor, Cliente (proyectos no efectivos / en proceso)
SELECT
  to_char(p.created_at, 'TMMonth') AS mes,
  extract(day FROM p.created_at)::int AS dia,
  p.consecutive AS especial_numero,
  p.sales_name AS asesor,
  p.client AS cliente
FROM public.projects p
WHERE p.effective = false
  AND (p.quoted = false OR p.reopen = true)
ORDER BY p.created_at DESC;
