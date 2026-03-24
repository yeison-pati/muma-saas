# Uso: . .\vars.ps1

$EnvName = $env:INFISICAL_ENV
if ([string]::IsNullOrWhiteSpace($EnvName)) { $EnvName = "dev" }

$PATHS = @("/", "/identitydb", "/catalogdb", "/productsdb", "/infra", "/threadsdb", "/rabbitmq", "/minio", "/ports", "/admins")

Write-Host "[infisical] Exportando secretos (env=$EnvName)..."

foreach ($path in $PATHS) {
    $jsonOutput = & infisical export --env=$EnvName --path=$path --format=json --silent
    if ($LASTEXITCODE -ne 0 -or -not $jsonOutput) { continue }

    try {
        $secrets = $jsonOutput | ConvertFrom-Json
        foreach ($s in $secrets) {
            $key = $s.key
            $val = $s.value
            
            # Sanitización de claves privadas (LF vs CRLF)
            if ($key -like "*PRIVATE_KEY*" -or $key -like "*PUBLIC_KEY*") {
                $val = $val.Replace("`r`n", "`n").Trim()
            }

            # 1. Exportar con su nombre original (TF_VAR_...)
            [Environment]::SetEnvironmentVariable($key, $val, "Process")

            # 2. "Traducción" para el Backend de Terraform / OCI SDK (Windows)
            # El backend/init no entiende TF_VAR_, busca estos nombres OCI_CLI_*
            switch ($key) {
                "TF_VAR_tenancy_ocid"     { [Environment]::SetEnvironmentVariable("OCI_CLI_TENANCY", $val, "Process") }
                "TF_VAR_user_ocid"        { [Environment]::SetEnvironmentVariable("OCI_CLI_USER", $val, "Process") }
                "TF_VAR_fingerprint"      { [Environment]::SetEnvironmentVariable("OCI_CLI_FINGERPRINT", $val, "Process") }
                "TF_VAR_oci_private_key"  { [Environment]::SetEnvironmentVariable("OCI_CLI_KEY_CONTENT", $val, "Process") }
                "TF_VAR_region"           { [Environment]::SetEnvironmentVariable("OCI_CLI_REGION", $val, "Process") }
            }
        }
    } catch { }
}

Write-Host "[infisical] Variables exportadas correctamente (con mapeos OCI_CLI)."
