# Solución al Error 500 en Vercel

## Cambios Realizados

1. **`api/index.py`** - Mejorado con mejor manejo de paths y errores
2. **`vercel.json`** - Configuración actualizada
3. **`api/__init__.py`** - Creado para hacer que api sea un paquete Python

## Pasos para Desplegar

1. **Hacer commit de los cambios:**
   ```powershell
   git add .
   git commit -m "Fix: Corregir error 500 en Vercel"
   git push
   ```

2. **Vercel se actualizará automáticamente** si tienes integración con GitHub, o puedes:
   - Ir al dashboard de Vercel
   - Hacer clic en "Redeploy" en el último deployment

## Verificar el Error

Si el error persiste, el nuevo código mostrará información detallada del error en la respuesta JSON, incluyendo:
- El mensaje de error
- El directorio raíz que está usando
- Los paths en sys.path
- Los archivos en el directorio raíz

Esto te ayudará a identificar qué está fallando.

## Posibles Problemas y Soluciones

### Problema: Módulos no encontrados
**Solución:** Verifica que todos los archivos Python estén en el repositorio:
- championship.py
- category.py
- team.py
- match.py
- standings.py
- fixture_generator.py
- app.py

### Problema: Flask no instalado
**Solución:** Verifica que `requirements.txt` incluya:
```
flask==3.0.0
flask-cors==4.0.0
```

### Problema: Path incorrecto
**Solución:** El código ahora detecta automáticamente si está en Vercel (`/var/task`) o en desarrollo local.

## Próximos Pasos

1. Haz commit y push de los cambios
2. Espera a que Vercel redeplegue
3. Prueba el endpoint raíz: `https://tu-proyecto.vercel.app/`
4. Si aún hay error, revisa la respuesta JSON para ver detalles del error

