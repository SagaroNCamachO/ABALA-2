# Instrucciones de Despliegue

## 1. Subir a GitHub

### Paso 1: Inicializar Git (si no lo has hecho)
```bash
git init
```

### Paso 2: Agregar todos los archivos
```bash
git add .
```

### Paso 3: Hacer commit inicial
```bash
git commit -m "Initial commit: Sistema de gestión de campeonatos de básquetbol"
```

### Paso 4: Crear repositorio en GitHub
1. Ve a https://github.com
2. Haz clic en "New repository"
3. Elige un nombre (ej: "basketball-championship-manager")
4. NO inicialices con README, .gitignore o licencia (ya los tenemos)
5. Copia la URL del repositorio

### Paso 5: Conectar y subir
```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

Si te pide autenticación, usa un Personal Access Token de GitHub.

## 2. Desplegar en Vercel

### Opción A: Desde la línea de comandos

1. **Instalar Vercel CLI**:
```bash
npm install -g vercel
```

2. **Iniciar sesión**:
```bash
vercel login
```

3. **Desplegar**:
```bash
vercel
```
Sigue las instrucciones en pantalla.

4. **Para producción**:
```bash
vercel --prod
```

### Opción B: Desde la interfaz web

1. Ve a https://vercel.com
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "Add New Project"
4. Importa tu repositorio de GitHub
5. Vercel detectará automáticamente que es un proyecto Python
6. Haz clic en "Deploy"

### Configuración en Vercel

Vercel debería detectar automáticamente:
- **Framework Preset**: Other
- **Build Command**: (dejar vacío)
- **Output Directory**: (dejar vacío)
- **Install Command**: `pip install -r requirements.txt`

Si necesitas configurar manualmente, usa:
- **Python Version**: 3.9 o superior

## 3. Verificar el despliegue

Una vez desplegado, visita:
- `https://tu-proyecto.vercel.app/` - Debería mostrar información de la API
- `https://tu-proyecto.vercel.app/api/championships` - Debería devolver lista vacía

## 4. Pruebas de la API

Puedes probar la API con curl o Postman:

```bash
# Crear un campeonato
curl -X POST https://tu-proyecto.vercel.app/api/championships \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test1",
    "name": "Campeonato de Prueba",
    "rounds": 1,
    "points_per_win": 2
  }'

# Agregar una categoría
curl -X POST https://tu-proyecto.vercel.app/api/championships/test1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TC",
    "teams": ["Equipo A", "Equipo B", "Equipo C"]
  }'

# Ver el fixture
curl https://tu-proyecto.vercel.app/api/championships/test1/fixture/TC

# Ver tabla de posiciones
curl https://tu-proyecto.vercel.app/api/championships/test1/standings/TC
```

## Solución de Problemas

### Error: "Module not found"
- Asegúrate de que `requirements.txt` incluya todas las dependencias
- Verifica que Vercel esté usando Python 3.9+

### Error: "Handler not found"
- Verifica que `vercel.json` esté configurado correctamente
- Asegúrate de que `app.py` exista en la raíz

### La API no responde
- Verifica los logs en el dashboard de Vercel
- Asegúrate de que el endpoint esté correctamente configurado en `vercel.json`

## Notas Importantes

- Vercel tiene límites en funciones serverless (tiempo de ejecución, memoria)
- Para proyectos grandes, considera usar una base de datos externa
- Los campeonatos se almacenan en memoria, se perderán al reiniciar (en producción usar DB)

