# Test con Versión Simple

He cambiado temporalmente `vercel.json` para usar `api/simple.py` que es una versión mínima sin imports complejos.

## ¿Por qué?

Para verificar si:
1. Vercel puede ejecutar Python/Flask correctamente
2. El problema está en los imports complejos
3. O hay un problema más fundamental

## Qué esperar

Si `api/simple.py` funciona:
- ✅ Vercel funciona correctamente
- ✅ El problema está en los imports de `api/app.py`
- ✅ Necesitamos arreglar los imports

Si `api/simple.py` NO funciona:
- ❌ Hay un problema más fundamental con la configuración de Vercel
- ❌ Necesitamos revisar la configuración básica

## Próximos pasos

1. Espera a que Vercel redeplegue (1-2 minutos)
2. Prueba: `https://abala.vercel.app/`
3. Deberías ver: `{"message": "API de Prueba funcionando", "status": "ok", "test": true}`

## Si funciona

Volveremos a `api/app.py` y arreglaremos los imports.

## Si no funciona

Revisaremos la configuración básica de Vercel.

