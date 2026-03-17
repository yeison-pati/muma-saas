#!/bin/bash

echo "Cargando variables de entorno..."
set -a

if [ -f "vars.sh" ]; then
  source ./vars.sh
fi

set +a

# Entramos a la carpeta de infraestructura
cd ./terraform

#OBTENER SERVER_IP DE INFISICAL
SERVER_IP_INFISICAL=$(infisical secrets get SERVER_IP --env=prod --path=/infra)

echo "Inicializando Terraform..."
terraform init

echo "Planificando cambios..."
terraform plan

echo "Aplicando infraestructura..."
terraform apply --auto-approve
echo "Infraestructura creada."

# Obtenemos la IP (Asegúrate de que el output en Terraform se llame exactamente 'portfolio_public_ip')
echo "Obteniendo IP pública del servidor..."
SERVER_IP=$(terraform output -raw portfolio_public_ip)

if [ -z "$SERVER_IP" ]; then
  echo "Error: No se pudo obtener la IP de Terraform. Revisa el nombre del output."
  exit 1
fi

echo "La IP obtenida es: $SERVER_IP"

#COMPARAR SERVER_IP DE INFISICAL CON SERVER_IP DE TERRAFORM
if [ "$SERVER_IP" != "$SERVER_IP_INFISICAL" ]; then
  # Actualizamos el secreto en Infisical
  echo "Guardando la IP en Infisical (entorno: prod, ruta: /infra)..."
  infisical secrets set SERVER_IP="$SERVER_IP" --env=prod --path=/infra
else
  echo "La IP ya existe en Infisical"
fi

echo "¡Listo! Infra creada y SERVER_IP modificada en Infisical exitosamente."