# 🚀 Instrucciones para Configurar MongoDB en Vercel

## Paso 1: Agregar Variable de Entorno en Vercel

1. **Accede a Vercel Dashboard**
   - Ve a: https://vercel.com/dashboard
   - Inicia sesión con tu cuenta

2. **Selecciona tu Proyecto**
   - Busca y haz clic en el proyecto **ABALA**

3. **Ve a Configuración**
   - En el menú lateral, haz clic en **Settings**
   - Luego haz clic en **Environment Variables**

4. **Agrega la Variable**
   - Haz clic en el botón **Add New**
   - En **Key** (Nombre): escribe `MONGODB_URI`
   - En **Value** (Valor): pega esta URI completa:
     ```
     mongodb+srv://abala_db_user:hbHkdaDMx5dXYXYJ@cluster0.twy4nuq.mongodb.net/abala_championships?retryWrites=true&w=majority
     ```
   - Selecciona los tres entornos:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Haz clic en **Save**

## Paso 2: Hacer un Nuevo Deploy

**IMPORTANTE**: Las variables de entorno solo se aplican en nuevos deploys.

### Opción A: Deploy Automático (Recomendado)
- Haz un pequeño cambio en cualquier archivo (por ejemplo, agrega un comentario)
- Haz commit y push a GitHub
- Vercel detectará el cambio y hará deploy automáticamente

### Opción B: Deploy Manual
1. En Vercel Dashboard, ve a tu proyecto
2. Haz clic en la pestaña **Deployments**
3. Haz clic en los tres puntos (⋯) del último deployment
4. Selecciona **Redeploy**
5. Confirma el redeploy

## Paso 3: Verificar que Funciona

1. **Revisa los Logs**
   - En Vercel Dashboard, ve a **Deployments**
   - Haz clic en el último deployment
   - Ve a la pestaña **Logs**
   - Busca el mensaje: `✅ Conectado a MongoDB` o `✅ Cargados X campeonato(s) desde MongoDB`

2. **Prueba la Aplicación**
   - Abre tu aplicación en Vercel
   - Crea un nuevo campeonato
   - Recarga la página
   - El campeonato debería persistir (no desaparecer)

## 🔍 Solución de Problemas

### Si ves "MONGODB_URI no configurada"
- Verifica que agregaste la variable en Vercel
- Verifica que hiciste un nuevo deploy después de agregar la variable
- Verifica que seleccionaste los tres entornos (Production, Preview, Development)

### Si ves errores de conexión
- Verifica que la URI esté correcta (sin espacios extra)
- Verifica que el usuario y contraseña sean correctos
- Verifica que MongoDB Atlas permita conexiones desde cualquier IP (0.0.0.0/0)

### Si los datos no persisten
- Verifica los logs en Vercel para ver si hay errores
- Verifica que la base de datos se esté usando (puedes verificar en MongoDB Atlas)
- Recuerda que en Vercel, sin MongoDB, los datos se guardan en `/tmp` y se pierden al reiniciar

## 📝 Notas Importantes

- **La URI ya está configurada** con tu usuario y contraseña
- **La base de datos se crea automáticamente** cuando se guarda el primer campeonato
- **Los datos se guardan en ambas ubicaciones**: MongoDB (si está configurado) y archivos JSON (como backup)
- **Sin MongoDB configurado**, la app funciona pero los datos se pierden en Vercel al reiniciar

## ✅ Verificación Final

Una vez configurado, deberías ver en los logs de Vercel:
```
✅ Conectado a MongoDB
✅ Cargados X campeonato(s) desde MongoDB
💾 Guardados X campeonato(s) en MongoDB
```

¡Listo! Tu aplicación ahora tiene persistencia real de datos. 🎉

