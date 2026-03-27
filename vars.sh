#!/bin/bash
# Uso: source ./vars.sh
#
# LOCAL (usuarios logueados, equipos): infisical login && source ./vars.sh
#   Usa la sesión de infisical login, no requiere CLIENT_ID/SECRET.
#
# CI / Universal Auth: INFISICAL_CLIENT_ID + INFISICAL_CLIENT_SECRET + INFISICAL_PROJECT_ID
#   vars.sh hace login automático si no hay sesión pero sí hay CLIENT_ID/SECRET.

ENV="${INFISICAL_ENV:-dev}"

# Solo para CI: si no hay sesión pero sí Universal Auth, hacer login
# (nótese ${VAR:-} para ser compatible con `set -u`)
if [ -z "${INFISICAL_TOKEN:-}" ] && [ -n "${INFISICAL_CLIENT_ID:-}" ] && [ -n "${INFISICAL_CLIENT_SECRET:-}" ]; then
  export INFISICAL_TOKEN=$(infisical login --method=universal-auth --client-id="$INFISICAL_CLIENT_ID" --client-secret="$INFISICAL_CLIENT_SECRET" --silent --plain 2>/dev/null)
fi
PATHS=("/" "/identitydb" "/catalogdb" "/productsdb" "/infra" "/threadsdb" "/rabbitmq" "/minio" "/ports" "/admins")

echo "[infisical] Exportando secretos (env=$ENV)..."

if [ -z "${INFISICAL_PROJECT_ID:-}" ]; then
  echo "[infisical] WARN: INFISICAL_PROJECT_ID no definido (machine identity lo requiere)" >&2
fi

# 'set -a' exporta automáticamente todas las variables que se definan de aquí en adelante
set -a

for path in "${PATHS[@]}"; do
  _tmp=$(mktemp)
  if [ -n "${INFISICAL_PROJECT_ID:-}" ]; then
    _cmd=(infisical export --projectId="${INFISICAL_PROJECT_ID}" --env="$ENV" --path="$path" --format=dotenv --silent)
  else
    _cmd=(infisical export --env="$ENV" --path="$path" --format=dotenv --silent)
  fi
  if ! "${_cmd[@]}" > "$_tmp" 2>&1; then
    echo "[infisical] ERROR en path=$path:" >&2
    cat "$_tmp" >&2
    rm -f "$_tmp"
    exit 1
  fi
  _out=$(cat "$_tmp")
  rm -f "$_tmp"
  if [[ -n "$_out" ]]; then
    eval "$_out"
  fi
done

# Apagamos la exportación automática para no afectar el resto de tu terminal
set +a

echo "[infisical] Variables exportadas."