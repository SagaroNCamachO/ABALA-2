# Script para configurar Git y preparar el proyecto para GitHub

Write-Host "=== Configuración de Git para el proyecto ===" -ForegroundColor Green

# Verificar si Git está instalado
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git no está instalado. Por favor instálalo desde https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Verificar si ya existe un repositorio Git
if (Test-Path .git) {
    Write-Host "Ya existe un repositorio Git en este directorio." -ForegroundColor Yellow
    $continue = Read-Host "¿Deseas continuar de todas formas? (s/n)"
    if ($continue -ne "s") {
        exit 0
    }
} else {
    # Inicializar repositorio Git
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Cyan
    git init
}

# Agregar todos los archivos
Write-Host "Agregando archivos al staging area..." -ForegroundColor Cyan
git add .

# Hacer commit inicial
Write-Host "Creando commit inicial..." -ForegroundColor Cyan
git commit -m "Initial commit: Sistema de Gestión de Campeonatos de Básquetbol"

Write-Host "`n=== Configuración completada ===" -ForegroundColor Green
Write-Host "`nPróximos pasos:" -ForegroundColor Yellow
Write-Host "1. Crea un nuevo repositorio en GitHub (https://github.com/new)" -ForegroundColor White
Write-Host "2. NO inicialices el repositorio con README, .gitignore o licencia" -ForegroundColor White
Write-Host "3. Copia la URL del repositorio (ej: https://github.com/tu-usuario/tu-repo.git)" -ForegroundColor White
Write-Host "4. Ejecuta los siguientes comandos:" -ForegroundColor White
Write-Host "   git remote add origin <URL-DE-TU-REPOSITORIO>" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "`nO ejecuta 'deploy_to_github.ps1' después de crear el repositorio" -ForegroundColor Yellow





