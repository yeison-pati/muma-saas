-- Primera migración versionada tras Flyway baseline (v1). Debe ser un único V2 (Flyway no admite dos scripts con la misma versión).
-- Alinea la tabla users con el modelo JPA: la columna region ya no se usa.
ALTER TABLE public.users DROP COLUMN IF EXISTS region;
