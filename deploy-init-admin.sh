#!/bin/bash
# Ejecutar en la VM tras docker compose up. Requiere .env cargado.
set -a
source .env
set +a

DOCKER="${DOCKER:-docker}"
echo "Esperando identitydb..."
until $DOCKER exec identitydb pg_isready -U "$IDENTITY_DB_USER" -d "$IDENTITY_DB_NAME" >/dev/null 2>&1; do
  sleep 2
done
echo "identitydb listo."

echo "Esperando identity (schema)..."
sleep 15

echo "Insertando admin..."
$DOCKER exec -i identitydb psql -U "$IDENTITY_DB_USER" -d "$IDENTITY_DB_NAME" -v ON_ERROR_STOP=1 <<EOSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END \$\$;
INSERT INTO users (id, name, email, phone, password, role, region, job_title, created_by)
VALUES (
  uuid_generate_v4(),
  '${ADMIN_NAME}',
  '${ADMIN_EMAIL}',
  '${ADMIN_PHONE}',
  '${ADMIN_PASSWORD_HASH}',
  'ADMIN',
  '${ADMIN_REGION}',
  '${ADMIN_JOB_TITLE}',
  'system'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  region = EXCLUDED.region,
  job_title = EXCLUDED.job_title;
EOSQL
echo "Admin listo."
