# Script completo para desplegar a GitHub y Vercel

Write-Host "=== DESPLIEGUE COMPLETO - GitHub y Vercel ===" -ForegroundColor Green
Write-Host ""

# Paso 1: Verificar Git
Write-Host "[1/4] Verificando Git..." -ForegroundColor Cyan
try {
    $gitVersion = git --version
    Write-Host "  ✓ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ ERROR: Git no está instalado" -ForegroundColor Red
    Write-Host "  Instala Git desde: https://git-scm.com/" -ForegroundColor Yellow
    exit 1
}

# Paso 2: Preparar archivos para commit
Write-Host "[2/4] Preparando archivos..." -ForegroundColor Cyan

# Agregar todos los archivos nuevos y modificados
git add .

# Verificar si hay cambios
$status = git status --porcelain
if ($status) {
    Write-Host "  Archivos a commitear:" -ForegroundColor Yellow
    git status --short
    
    $commitMessage = Read-Host "  Ingresa el mensaje del commit (Enter para usar mensaje por defecto)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Update: Sistema de Gestión de Campeonatos de Básquetbol"
    }
    
    git commit -m $commitMessage
    Write-Host "  ✓ Cambios commiteados" -ForegroundColor Green
} else {
    Write-Host "  ✓ No hay cambios pendientes" -ForegroundColor Green
}

# Paso 3: Configurar GitHub
Write-Host "[3/4] Configurando GitHub..." -ForegroundColor Cyan

$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "  Repositorio remoto: $remoteExists" -ForegroundColor Yellow
    $change = Read-Host "  ¿Deseas cambiar la URL del repositorio? (s/n)"
    if ($change -eq "s") {
        $repoUrl = Read-Host "  Ingresa la URL del repositorio de GitHub"
        git remote set-url origin $repoUrl
        Write-Host "  ✓ URL actualizada" -ForegroundColor Green
    }
} else {
    Write-Host "  No hay repositorio remoto configurado" -ForegroundColor Yellow
    Write-Host "  Pasos para configurar:" -ForegroundColor Yellow
    Write-Host "  1. Crea un repositorio en https://github.com/new" -ForegroundColor White
    Write-Host "  2. NO inicialices con README, .gitignore o licencia" -ForegroundColor White
    Write-Host "  3. Copia la URL del repositorio" -ForegroundColor White
    
    $repoUrl = Read-Host "  Ingresa la URL del repositorio de GitHub"
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "  ✓ Repositorio remoto agregado" -ForegroundColor Green
    }
}

# Configurar rama main
git branch -M main 2>$null

# Hacer push
Write-Host "  Subiendo código a GitHub..." -ForegroundColor Cyan
try {
    git push -u origin main
    Write-Host "  ✓ Código subido exitosamente a GitHub" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Error al subir. Verifica tus credenciales de Git" -ForegroundColor Yellow
    Write-Host "  Puedes intentar manualmente con: git push -u origin main" -ForegroundColor Yellow
}

# Paso 4: Configurar Vercel
Write-Host "[4/4] Configurando Vercel..." -ForegroundColor Cyan

# Verificar si Vercel CLI está instalado
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "  Vercel CLI no está instalado" -ForegroundColor Yellow
    $install = Read-Host "  ¿Deseas instalarlo ahora? (s/n)"
    if ($install -eq "s") {
        Write-Host "  Instalando Vercel CLI..." -ForegroundColor Cyan
        npm install -g vercel
        Write-Host "  ✓ Vercel CLI instalado" -ForegroundColor Green
    } else {
        Write-Host "  Puedes instalarlo después con: npm install -g vercel" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ Vercel CLI encontrado" -ForegroundColor Green
    
    $deploy = Read-Host "  ¿Deseas desplegar ahora en Vercel? (s/n)"
    if ($deploy -eq "s") {
        Write-Host "  Iniciando despliegue en Vercel..." -ForegroundColor Cyan
        Write-Host "  (Sigue las instrucciones en pantalla)" -ForegroundColor Yellow
        vercel
    }
}

Write-Host ""
Write-Host "=== DESPLIEGUE COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Si no desplegaste en Vercel, puedes hacerlo desde:" -ForegroundColor White
Write-Host "   - Interfaz web: https://vercel.com/new" -ForegroundColor Cyan
Write-Host "   - CLI: vercel" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Conecta tu repositorio de GitHub en Vercel para despliegues automáticos" -ForegroundColor White
Write-Host ""
Write-Host "3. Revisa la documentación en DEPLOY.md para más detalles" -ForegroundColor White





