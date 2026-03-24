-- 06_otif_cumplimiento.sql
-- Resumen general de proyectos para el Dashboard de Cumplimiento (OTIF)
-- Creado para Metabase, filtrable por roles, fechas, tipología.
-- Incluye la lógica de "unión temporal de hilos superpuestos" (calculando tiempos exactos de hilos por variante)



WITH raw_threads AS (
    -- Obtenemos los hilos desde el microservicio de threadsdb
    SELECT t.project_id, t.variant_id, t.type, t.opened_at, t.closed_at
    FROM dblink(
        'host=threadsdb dbname=threads_db user=postgres password=postgres port=5432',
        'SELECT project_id, variant_id, type, opened_at, COALESCE(closed_at, NOW()) AS closed_at FROM threads'
    ) AS t(project_id UUID, variant_id UUID, type VARCHAR, opened_at TIMESTAMP, closed_at TIMESTAMP)
),
threads_edges AS (
    -- Algoritmo para unir intervalos de tiempo superpuestos (Union de Intervalos)
    SELECT variant_id, type, opened_at, closed_at,
           MAX(closed_at) OVER (PARTITION BY variant_id, type ORDER BY opened_at ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_max_close
    FROM raw_threads
),
threads_groups AS (
    SELECT variant_id, type, opened_at, closed_at,
           SUM(CASE WHEN prev_max_close >= opened_at THEN 0 ELSE 1 END) 
           OVER (PARTITION BY variant_id, type ORDER BY opened_at) AS grp
    FROM threads_edges
),
threads_merged AS (
    SELECT variant_id, type, MIN(opened_at) AS merged_open, MAX(closed_at) AS merged_close
    FROM threads_groups
    GROUP BY variant_id, type, grp
),
thread_times_per_variant AS (
    SELECT variant_id, type, SUM(EXTRACT(EPOCH FROM (merged_close - merged_open)) / 86400.0) AS total_hilo_dias
    FROM threads_merged
    GROUP BY variant_id, type
),
metricas AS (
    SELECT 
        p.id AS project_id,
        p.consecutive,
        p.created_at AS p_created_at,
        p.region,
        vq.id AS variant_id,
        vq.type AS tipologia,
        vq.base_code,
        vq.quoter_id,
        vq.designer_id,
        vq.development_user_id,
        vq.quoted_at,
        vq.designed_at,
        vq.developed_at,
        
        -- Días objetivo según matriz para COTIZACIÓN
        CASE vq.type 
            WHEN 'p1' THEN 1 WHEN 'p2' THEN 2 WHEN 'p3' THEN 5 
            WHEN 'p4' THEN 2 WHEN 'p5' THEN 10 ELSE 5 
        END AS target_cotiz,

        -- Días objetivo según matriz para DISEÑO
        CASE vq.type 
            WHEN 'p1' THEN 0 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 
            WHEN 'p4' THEN 1 WHEN 'p5' THEN 0 ELSE 0 
        END AS target_diseno,
        
        -- Días objetivo según matriz para DESARROLLO
        CASE vq.type 
            WHEN 'p1' THEN 2 WHEN 'p2' THEN 2 WHEN 'p3' THEN 3 
            WHEN 'p4' THEN 1 WHEN 'p5' THEN 1 ELSE 1 
        END AS target_dllo,

        -- Tiempos reales transcurridos (Días Calendario)
        EXTRACT(EPOCH FROM (vq.quoted_at - p.created_at))/86400.0 AS real_cotiz,
        EXTRACT(EPOCH FROM (vq.designed_at - vq.quoted_at))/86400.0 AS real_diseno,
        EXTRACT(EPOCH FROM (vq.developed_at - vq.designed_at))/86400.0 AS real_dllo,

        -- Tiempos de hilos obtenidos del microservicio de Hilos
        COALESCE(tc.total_hilo_dias, 0) AS dias_hilo_cotiz,
        COALESCE(td.total_hilo_dias, 0) AS dias_hilo_diseno,
        COALESCE(tdev.total_hilo_dias, 0) AS dias_hilo_dllo

    FROM variant_quote vq
    JOIN projects p ON vq.project_id = p.id
    LEFT JOIN thread_times_per_variant tc ON tc.variant_id = vq.id AND tc.type = 'COMMERCIAL_QUOTE'
    LEFT JOIN thread_times_per_variant td ON td.variant_id = vq.id AND td.type = 'COMMERCIAL_DESIGN'
    LEFT JOIN thread_times_per_variant tdev ON tdev.variant_id = vq.id AND tdev.type = 'COMMERCIAL_DEVELOPMENT'
)
SELECT 
    m.*,
    to_char(m.p_created_at, 'IYYY-IW') AS semana_ingreso,
    to_char(m.p_created_at, 'YYYY-MM') AS mes_ingreso,
    
    -- El tiempo empleado total = Real - Tiempo Atrapado en Hilos (ya que el hilo detiene el SLA)
    -- Si el negocio es que el tiempo del hilo se SUME al Real para penalizar más: "real_diseno + dias_hilo_diseno".
    -- Pero usaremos la métrica pura restada para descontar el tiempo de hilos en contra de ellos.
    -- Matemáticamente: tiempo efectivo = real_diseno - dias_hilo_diseno
    GREATEST(m.real_cotiz - m.dias_hilo_cotiz, 0) AS neto_cotiz,
    GREATEST(m.real_diseno - m.dias_hilo_diseno, 0) AS neto_diseno,
    GREATEST(m.real_dllo - m.dias_hilo_dllo, 0) AS neto_dllo,
    
    -- Cumplimientos (CUMPLE vs NO CUMPLE) validando "hasta el último milisegundo"
    CASE WHEN m.quoted_at IS NOT NULL AND GREATEST(m.real_cotiz - m.dias_hilo_cotiz, 0) <= m.target_cotiz THEN 'Cumple' ELSE 'No Cumple' END AS otif_cotiz,
    CASE WHEN m.designed_at IS NOT NULL AND m.target_diseno > 0 AND GREATEST(m.real_diseno - m.dias_hilo_diseno, 0) <= m.target_diseno THEN 'Cumple' 
         WHEN m.target_diseno = 0 THEN 'N/A' ELSE 'No Cumple' END AS otif_diseno,
    CASE WHEN m.developed_at IS NOT NULL AND GREATEST(m.real_dllo - m.dias_hilo_dllo, 0) <= m.target_dllo THEN 'Cumple' ELSE 'No Cumple' END AS otif_dllo
FROM metricas m
