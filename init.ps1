<#
.SYNOPSIS
Dev (local):  . .\vars.ps1 vía INFISICAL_ENV=dev|prod o usa .env si no hay vars.ps1
              .\init.ps1              → compose up --build + sembrar admin
              .\init.ps1 muma         → build solo ese servicio + up
              .\init.ps1 metabase-init

Prod / VM:    solo .env en ~\muma (sin Infisical en servidor)
              $env:DOCKER='sudo docker'; $env:ADMIN_SEED_DELAY=15; .\init.ps1 deploy
              → compose pull + up --no-build + espera opcional + mismo seed admin
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$ArgsList
)

Write-Host "Cargando variables de entorno..."

if (Test-Path "vars.ps1") {
    . .\vars.ps1
} elseif (Test-Path ".env") {
    Get-Content ".env" | Where-Object { $_ -match "^[\w]+=" } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        if ($value.StartsWith("`"") -and $value.EndsWith("`"") -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        } elseif ($value.StartsWith("'") -and $value.EndsWith("'") -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$DOCKER_CMD = if ([string]::IsNullOrEmpty($env:DOCKER)) { "docker" } else { $env:DOCKER }

function dc {
    $parsedArgs = $args
    if ($DOCKER_CMD -match "\s") {
        $parts = $DOCKER_CMD -split "\s+"
        & $parts[0] $parts[1..($parts.Length-1)] compose $parsedArgs
    } else {
        & $DOCKER_CMD compose $parsedArgs
    }
}

Write-Host "user identity: $($env:IDENTITY_DB_USER)"

$DEPLOY_MODE = 0
$target = $null

if ($ArgsList.Count -gt 0 -and $ArgsList[0] -eq "deploy") {
    $DEPLOY_MODE = 1
    if ($ArgsList.Count -gt 1) {
        $target = $ArgsList[1]
    }
} elseif ($ArgsList.Count -gt 0) {
    $target = $ArgsList[0]
}

Write-Host "Iniciando servicios..."

if ($DEPLOY_MODE -eq 1) {
    if ($target) {
        Write-Error "Modo 'deploy' no admite argumentos extra (uso: .\init.ps1 deploy)"
        exit 1
    }
    Write-Host "Modo deploy: pull + up (sin build, imágenes de registry)..."
    dc pull
    dc up --no-build -d
} else {
    if ($target -eq "metabase-init") {
        Write-Host "Ejecutando metabase-init (script actual)..."
        dc stop metabase-init metabase
        dc rm metabase-init metabase -f -v
    }

    if ($target) {
        Write-Host "Construyendo solo: $target"
        dc build $target
        dc up -d
    } else {
        dc up -d --build
    }
}

Start-Sleep -Seconds 10

if (dc ps -q) {
    Write-Host "Servicios iniciados correctamente"
} else {
    Write-Error "Error al iniciar los servicios"
    dc logs
    dc down
    exit 1
}

Write-Host "Esperando que identitydb esté listo..."
while ($true) {
    if ($DOCKER_CMD -match "\s") {
        $parts = $DOCKER_CMD -split "\s+"
        & $parts[0] $parts[1..($parts.Length-1)] exec identitydb pg_isready -U "$($env:IDENTITY_DB_USER)" -d "$($env:IDENTITY_DB_NAME)" *>$null
    } else {
        & $DOCKER_CMD exec identitydb pg_isready -U "$($env:IDENTITY_DB_USER)" -d "$($env:IDENTITY_DB_NAME)" *>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        break
    }
    Start-Sleep -Seconds 2
}
Write-Host "identitydb listo."

if ($DEPLOY_MODE -eq 1) {
    if ([string]::IsNullOrEmpty($env:ADMIN_SEED_DELAY)) {
        $env:ADMIN_SEED_DELAY = "15"
    }
}

$delay = 0
if (-not [string]::IsNullOrEmpty($env:ADMIN_SEED_DELAY) -and [int]::TryParse($env:ADMIN_SEED_DELAY, [ref]$delay)) {
    if ($delay -gt 0) {
        Write-Host "Esperando ${delay}s antes de sembrar admin..."
        Start-Sleep -Seconds $delay
    }
}

Write-Host "Insertando admin en identity_db..."
$sqlscript = @"
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END `$`$;
INSERT INTO users (id, name, email, phone, password, role, job_title, created_by)
VALUES (
  uuid_generate_v4(),
  '$($env:ADMIN_NAME)',
  '$($env:ADMIN_EMAIL)',
  '$($env:ADMIN_PHONE)',
  '$($env:ADMIN_PASSWORD_HASH)',
  'ADMIN',
  '$($env:ADMIN_JOB_TITLE)',
  'system'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  job_title = EXCLUDED.job_title;
"@

if ($DOCKER_CMD -match "\s") {
    $parts = $DOCKER_CMD -split "\s+"
    $sqlscript | & $parts[0] $parts[1..($parts.Length-1)] exec -i identitydb psql -U "$($env:IDENTITY_DB_USER)" -d "$($env:IDENTITY_DB_NAME)" -v ON_ERROR_STOP=1
} else {
    $sqlscript | & $DOCKER_CMD exec -i identitydb psql -U "$($env:IDENTITY_DB_USER)" -d "$($env:IDENTITY_DB_NAME)" -v ON_ERROR_STOP=1
}

Write-Host "Admin listo (o ya existía)."

# Habilitar dblink en catalogdb
Write-Host "Habilitando extensión dblink en catalogdb..."
while ($true) {
    if ($DOCKER_CMD -match "\s") {
        $parts = $DOCKER_CMD -split "\s+"
        & $parts[0] $parts[1..($parts.Length-1)] exec catalogdb pg_isready -U "$($env:CATALOG_DB_USER)" -d "$($env:CATALOG_DB_NAME)" *>$null
    } else {
        & $DOCKER_CMD exec catalogdb pg_isready -U "$($env:CATALOG_DB_USER)" -d "$($env:CATALOG_DB_NAME)" *>$null
    }
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}
$dblinkSql = "CREATE EXTENSION IF NOT EXISTS dblink;"
if ($DOCKER_CMD -match "\s") {
    $parts = $DOCKER_CMD -split "\s+"
    $dblinkSql | & $parts[0] $parts[1..($parts.Length-1)] exec -i catalogdb psql -U "$($env:CATALOG_DB_USER)" -d "$($env:CATALOG_DB_NAME)"
} else {
    $dblinkSql | & $DOCKER_CMD exec -i catalogdb psql -U "$($env:CATALOG_DB_USER)" -d "$($env:CATALOG_DB_NAME)"
}
Write-Host "dblink habilitado en catalogdb."
