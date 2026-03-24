Write-Host "Cargando variables de entorno..."

if (Test-Path "vars.ps1") {
    . .\vars.ps1
}

# Entramos a la carpeta de infraestructura
Set-Location -Path ".\terraform" -ErrorAction Stop

# OBTENER SERVER_IP DE INFISICAL
$SERVER_IP_INFISICAL = infisical secrets get SERVER_IP --env=prod --path=/infra 2>$null

Write-Host "Inicializando Terraform..."
terraform init

Write-Host "Planificando cambios..."
terraform plan

Write-Host "Aplicando infraestructura..."
terraform apply --auto-approve
Write-Host "Infraestructura creada."

# Obtenemos la IP (Asegúrate de que el output en Terraform se llame exactamente 'portfolio_public_ip')
Write-Host "Obteniendo IP pública del servidor..."
$SERVER_IP = terraform output -raw portfolio_public_ip

if ([string]::IsNullOrWhiteSpace($SERVER_IP)) {
    Write-Error "Error: No se pudo obtener la IP de Terraform. Revisa el nombre del output."
    exit 1
}

Write-Host "La IP obtenida es: $SERVER_IP"

# COMPARAR SERVER_IP DE INFISICAL CON SERVER_IP DE TERRAFORM
if (($SERVER_IP -as [string]).Trim() -ne ($SERVER_IP_INFISICAL -as [string]).Trim()) {
    # Actualizamos el secreto en Infisical
    Write-Host "Guardando la IP en Infisical (entorno: prod, ruta: /infra)..."
    infisical secrets set SERVER_IP="$($SERVER_IP.Trim())" --env=prod --path=/infra
} else {
    Write-Host "La IP ya existe en Infisical"
}

Write-Host "¡Listo! Infra creada y SERVER_IP modificada en Infisical exitosamente."

# Volver atrás por consistencia
Set-Location -Path ".."
