# Guía: Configurar Vercel para Node.js/TypeScript

## ¿Por qué Vercel no detecta automáticamente Node.js?

Vercel puede no detectar automáticamente tu proyecto como Node.js por varias razones:

1. **TypeScript como punto de entrada**: Tu proyecto usa `api/index.ts` (TypeScript) en lugar de un archivo JavaScript estándar
2. **Estructura no estándar**: El punto de entrada está en `api/` en lugar de la raíz
3. **Falta de archivos de detección**: Vercel busca ciertos patrones para detectar frameworks

## ✅ Solución: Qué opción seleccionar en Vercel

Cuando ingreses tu repositorio en Vercel, sigue estos pasos:

### Opción 1: Framework Preset (Recomendado)

1. **Framework Preset**: Selecciona **"Other"** o **"Node.js"**
   - Si no aparece "Node.js", selecciona **"Other"**

2. **Root Directory**: Deja vacío (o pon `.`)

3. **Build Command**: 
   ```
   npm run build
   ```

4. **Output Directory**: Deja vacío (Vercel lo manejará automáticamente)

5. **Install Command**: 
   ```
   npm install
   ```

### Opción 2: Detección Automática Mejorada

Para que Vercel lo detecte mejor, ya tienes `vercel.json` configurado, pero puedes mejorar la detección agregando un archivo de configuración adicional.

## 🔧 Mejoras que puedes hacer

Tu proyecto ya tiene:
- ✅ `package.json` con dependencias Node.js
- ✅ `vercel.json` configurado
- ✅ Punto de entrada en `api/index.ts`

**Esto debería ser suficiente**, pero si Vercel aún no lo detecta:

1. Selecciona **"Other"** como Framework Preset
2. Deja que Vercel use la configuración de `vercel.json`
3. Vercel compilará TypeScript automáticamente usando `@vercel/node`

## 📋 Configuración Actual

Tu `vercel.json` ya está configurado correctamente:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.ts"
    }
  ]
}
```

Esto le dice a Vercel:
- Usar `@vercel/node` para compilar TypeScript
- El punto de entrada es `api/index.ts`
- Todas las rutas van a ese archivo

## 🚀 Pasos en Vercel Dashboard

1. Ve a https://vercel.com/new
2. Conecta tu repositorio `ABALA-2`
3. En **Framework Preset**, selecciona: **"Other"**
4. **Root Directory**: `.` (o déjalo vacío)
5. **Build Command**: `npm run build` (o déjalo vacío, Vercel lo detectará)
6. **Output Directory**: Déjalo vacío
7. Haz clic en **Deploy**

Vercel debería:
- Detectar `package.json`
- Instalar dependencias con `npm install`
- Compilar TypeScript usando `@vercel/node`
- Desplegar la aplicación

## ⚠️ Si aún no funciona

Si después de seleccionar "Other" sigue sin funcionar:

1. **Verifica que `package.json` esté en la raíz** ✅ (Ya está)
2. **Verifica que `vercel.json` esté en la raíz** ✅ (Ya está)
3. **Asegúrate de que `api/index.ts` exista** ✅ (Ya existe)

Si todo esto está correcto, Vercel debería funcionar con la opción **"Other"**.

## 🎯 Resumen

**Respuesta directa**: Selecciona **"Other"** como Framework Preset cuando Vercel te pregunte.

Vercel usará tu `vercel.json` para saber cómo construir y desplegar el proyecto.




