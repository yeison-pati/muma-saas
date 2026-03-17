#!/bin/bash
# Uso: source ./infisical.sh

ENV="${INFISICAL_ENV:-dev}"
PATHS=("/" "/identitydb" "/catalogdb" "/productsdb" "/infra" "/threadsdb" "/rabbitmq" "/minio" "/ports" "/admins")

echo "[infisical] Exportando secretos (env=$ENV)..."

# 'set -a' exporta automáticamente todas las variables que se definan de aquí en adelante
set -a

for path in "${PATHS[@]}"; do
  # Usamos --format=dotenv. Infisical ya envuelve los valores en comillas simples ('')
  # lo cual hace que sea seguro evaluarlos, incluso si son llaves PEM multilínea.
  _out=$(infisical export --env="$ENV" --path="$path" --format=dotenv 2>/dev/null)
  
  if [[ -n "$_out" ]]; then
    # eval procesa la cadena devuelta (Ej: MI_VAR='123') y 'set -a' la exporta.
    eval "$_out"
  fi
done

# Apagamos la exportación automática para no afectar el resto de tu terminal
set +a

echo "[infisical] Variables exportadas."