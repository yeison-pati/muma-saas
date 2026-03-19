#!/bin/bash
#
# Dev (local):  source vars.sh vía INFISICAL_ENV=dev|prod o usa .env si no hay vars.sh
#               ./init.sh              → compose up --build + sembrar admin
#               ./init.sh muma         → build solo ese servicio + up
#               ./init.sh metabase-init
#
# Prod / VM:    solo .env en ~/muma (sin Infisical en servidor)
#               DOCKER='sudo docker' ADMIN_SEED_DELAY=15 ./init.sh deploy
#               → compose pull + up --no-build + espera opcional + mismo seed admin

echo "Cargando variables de entorno..."
set -a
if [ -f "vars.sh" ]; then
  source ./vars.sh
else
  source .env
fi
set +a

DOCKER="${DOCKER:-docker}"
dc() { $DOCKER compose "$@"; }

echo "user identity: $IDENTITY_DB_USER"

DEPLOY_MODE=0
if [ "$1" = "deploy" ]; then
  DEPLOY_MODE=1
  shift
fi

echo "Iniciando servicios..."

if [ "$DEPLOY_MODE" = "1" ]; then
  if [ -n "$1" ]; then
    echo "Modo 'deploy' no admite argumentos extra (uso: ./init.sh deploy)" >&2
    exit 1
  fi
  echo "Modo deploy: pull + up (sin build, imágenes de registry)..."
  dc pull
  dc up --no-build -d
else
  # metabase-init: recrea contenedores y luego sigue el flujo de build de un servicio (metabase-init)
  if [ "$1" = "metabase-init" ]; then
    echo "Ejecutando metabase-init (script actual)..."
    dc stop metabase-init metabase
    dc rm metabase-init metabase -f -v
  fi

  if [ -n "$1" ]; then
    echo "Construyendo solo: $1"
    dc build "$1"
    dc up -d
  else
    dc up -d --build
  fi
fi

sleep 10

if [ "$(dc ps -q)" ]; then
  echo "Servicios iniciados correctamente"
else
  echo "Error al iniciar los servicios"
  dc logs
  dc down
  exit 1
fi

echo "Esperando que identitydb esté listo..."
until $DOCKER exec identitydb pg_isready -U "$IDENTITY_DB_USER" -d "$IDENTITY_DB_NAME" >/dev/null 2>&1; do
  sleep 2
done
echo "identitydb listo."

# Tras pg_isready: en VM suele hacer falta margen para que identity aplique el schema (Flyway).
if [ "$DEPLOY_MODE" = "1" ]; then
  ADMIN_SEED_DELAY="${ADMIN_SEED_DELAY:-15}"
fi
if [ "${ADMIN_SEED_DELAY:-0}" != "0" ]; then
  echo "Esperando ${ADMIN_SEED_DELAY}s antes de sembrar admin..."
  sleep "$ADMIN_SEED_DELAY"
fi

echo "Insertando admin en identity_db..."
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
echo "Admin listo (o ya existía)."
