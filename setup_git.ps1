# Script de PowerShell para configurar Git y subir a GitHub
# Ejecutar: .\setup_git.ps1

Write-Host "=== Configuración de Git para GitHub ===" -ForegroundColor Green
Write-Host ""

# Verificar si Git está instalado
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git no está instalado. Por favor instálalo primero." -ForegroundColor Red
    exit 1
}

# Verificar si ya existe un repositorio
if (Test-Path .git) {
    Write-Host "Repositorio Git ya inicializado." -ForegroundColor Yellow
} else {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Cyan
    git init
    Write-Host "✓ Repositorio inicializado" -ForegroundColor Green
}

# Agregar todos los archivos
Write-Host ""
Write-Host "Agregando archivos al staging..." -ForegroundColor Cyan
git add .
Write-Host "✓ Archivos agregados" -ForegroundColor Green

# Verificar si hay cambios para commit
$status = git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "Haciendo commit inicial..." -ForegroundColor Cyan
    git commit -m "Initial commit: Sistema de gestión de campeonatos de básquetbol"
    Write-Host "✓ Commit realizado" -ForegroundColor Green
} else {
    Write-Host "No hay cambios para commitear." -ForegroundColor Yellow
}

# Verificar si ya existe un remote
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host ""
    Write-Host "Remote 'origin' ya configurado: $remote" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para subir los cambios, ejecuta:" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "=== Configuración del Remote ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para conectar con GitHub:" -ForegroundColor Cyan
    Write-Host "1. Crea un repositorio en https://github.com" -ForegroundColor White
    Write-Host "2. Luego ejecuta:" -ForegroundColor White
    Write-Host ""
    Write-Host "   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git" -ForegroundColor Yellow
    Write-Host "   git branch -M main" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "=== Estado del Repositorio ===" -ForegroundColor Green
git status

