-- Alinea la tabla users con el modelo JPA: la columna region ya no se usa.
ALTER TABLE public.users DROP COLUMN IF EXISTS region;
