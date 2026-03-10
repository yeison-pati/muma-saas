#!/bin/bash

echo "Cargando variables de entorno..."
set -a
source .env.base
source .env.local
set +a

echo "variables de entorno cargadas: $TEST_VARS"
echo "user identity: $IDENTITY_DB_USER"


if [ "$TEST_VARS" = "true" ]; then
  echo "variables de entorno correctas"
else
  echo "variables de entorno incorrectas"
  exit 1
fi

echo "Iniciando servicios..."

# Si se pasa un servicio (ej: ./local.sh muma), solo se construye y arranca ese servicio.
# Sin argumentos, se construye y arranca todo.
if [ -n "$1" ]; then
  echo "Construyendo solo: $1"
  docker compose build "$1"
  docker compose up -d
else
  docker compose up -d --build
fi
sleep 10

if [ "$(docker compose ps -q)" ]
then
  echo "Servicios iniciados correctamente"
else
  echo "Error al iniciar los servicios"
  docker compose logs
  docker compose down
  exit 1
fi

echo "Esperando que identitydb esté listo..."
until docker exec identitydb pg_isready -U "$IDENTITY_DB_USER" -d "$IDENTITY_DB_NAME" >/dev/null 2>&1; do
  sleep 2
done
echo "identitydb listo."

echo "Insertando admin en identity_db..."
docker exec -i identitydb psql -U "$IDENTITY_DB_USER" -d "$IDENTITY_DB_NAME" -v ON_ERROR_STOP=1 <<EOSQL
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
echo "Admin listo (o ya existía)."
