# Instrucciones para Debug en Vercel

## Si sigues viendo Error 500

### Paso 1: Revisar Logs de Vercel

1. Ve al dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a la pestaña **Functions**
4. Busca `api/app.py`
5. Haz clic en "View Function Logs"
6. **Copia y comparte los logs** - especialmente cualquier error o traceback

### Paso 2: Probar versión simple

He creado `api/simple.py` que es una versión mínima. Para probarla:

1. **Cambiar temporalmente `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/simple.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/api/simple.py"
       }
     ]
   }
   ```

2. Hacer commit y push
3. Verificar si funciona

### Paso 3: Verificar que los archivos estén en GitHub

Asegúrate de que estos archivos estén en el repositorio:
- `api/app.py`
- `api/championship.py`
- `api/category.py`
- `api/team.py`
- `api/match.py`
- `api/standings.py`
- `api/fixture_generator.py`
- `requirements.txt`
- `vercel.json`

### Paso 4: Verificar configuración de Vercel

En el dashboard de Vercel:
1. Settings → General
2. Verifica que no haya configuraciones conflictivas
3. Framework Preset debería estar en "Other" o vacío

## Información que necesito

Para ayudarte mejor, comparte:

1. **Logs de Vercel** (de la pestaña Functions → api/app.py → View Function Logs)
2. **URL exacta** que estás probando
3. **Qué ves** cuando accedes a la URL
4. **Estado del deployment** en Vercel (Ready, Building, Error?)

## Posibles causas del Error 500

1. **Imports fallando** - Los módulos no se encuentran
2. **Error en el código** - Algún error de sintaxis o lógica
3. **Configuración incorrecta** - vercel.json mal configurado
4. **Dependencias faltantes** - requirements.txt incompleto

## Próximos pasos

1. Comparte los logs de Vercel
2. Prueba con `api/simple.py` para verificar que Vercel funciona
3. Verifica que todos los archivos estén en GitHub

