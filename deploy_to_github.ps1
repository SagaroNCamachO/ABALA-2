# Script para hacer push a GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$RepositoryUrl
)

Write-Host "=== Despliegue a GitHub ===" -ForegroundColor Green

# Verificar si existe el repositorio remoto
$remoteExists = git remote get-url origin 2>$null

if ($remoteExists) {
    Write-Host "Repositorio remoto existente: $remoteExists" -ForegroundColor Yellow
    $change = Read-Host "¿Deseas cambiar la URL? (s/n)"
    if ($change -eq "s") {
        git remote set-url origin $RepositoryUrl
        Write-Host "URL del repositorio actualizada." -ForegroundColor Green
    }
} else {
    Write-Host "Agregando repositorio remoto..." -ForegroundColor Cyan
    git remote add origin $RepositoryUrl
}

# Cambiar a rama main
Write-Host "Configurando rama main..." -ForegroundColor Cyan
git branch -M main

# Hacer push
Write-Host "Subiendo código a GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n¡Código subido exitosamente a GitHub!" -ForegroundColor Green
    Write-Host "Repositorio: $RepositoryUrl" -ForegroundColor Cyan
} else {
    Write-Host "`nError al subir el código. Verifica:" -ForegroundColor Red
    Write-Host "1. Que el repositorio exista en GitHub" -ForegroundColor Yellow
    Write-Host "2. Que tengas permisos de escritura" -ForegroundColor Yellow
    Write-Host "3. Que hayas configurado tus credenciales de Git" -ForegroundColor Yellow
}





