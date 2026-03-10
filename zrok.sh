#!/bin/bash

echo "Cargando variables de entorno..."
set -a
source .env.base
source .env.zrok
set +a

echo "variables de entorno cargadas: $TEST_VARS"


if [ "$TEST_VARS" = "true" ]; then
  echo "variables de entorno correctas"
else
  echo "variables de entorno incorrectas"
  exit 1
fi

echo "Iniciando servicios..."

docker compose up -d --build
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
