# 🔧 Configuración de MongoDB para ABALA

## Opción 1: MongoDB Atlas (Recomendado - Gratis)

### Pasos para configurar:

1. **Crear cuenta en MongoDB Atlas**
   - Ve a https://www.mongodb.com/cloud/atlas/register
   - Crea una cuenta gratuita

2. **Crear un Cluster**
   - Selecciona el plan "Free" (M0)
   - Elige una región cercana
   - Crea el cluster (puede tardar 3-5 minutos)

3. **Configurar acceso a la base de datos**
   - Ve a "Database Access" → "Add New Database User"
   - Crea un usuario con contraseña
   - Guarda las credenciales

4. **Configurar red**
   - Ve a "Network Access" → "Add IP Address"
   - Agrega `0.0.0.0/0` para permitir desde cualquier lugar (o la IP de Vercel)

5. **Obtener la URI de conexión**
   - Ve a "Database" → "Connect"
   - Selecciona "Connect your application"
   - Copia la URI (algo como: `mongodb+srv://usuario:password@cluster.mongodb.net/`)

6. **Configurar en Vercel**
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega: `MONGODB_URI` = `mongodb+srv://usuario:password@cluster.mongodb.net/abala_championships?retryWrites=true&w=majority`
   - Reemplaza `usuario` y `password` con tus credenciales

## Opción 2: MongoDB Local (Desarrollo)

Si quieres probar localmente:

1. Instala MongoDB: https://www.mongodb.com/try/download/community
2. Inicia MongoDB: `mongod`
3. Configura la variable de entorno:
   ```bash
   export MONGODB_URI="mongodb://localhost:27017"
   ```

## Verificación

Una vez configurado, la aplicación:
- Intentará conectarse a MongoDB automáticamente
- Si no hay `MONGODB_URI`, usará almacenamiento local (archivos JSON)
- Los datos se guardan en ambas ubicaciones como backup

## Notas

- MongoDB Atlas Free tiene 512MB de almacenamiento (suficiente para muchos campeonatos)
- Los datos se sincronizan automáticamente
- El sistema funciona sin MongoDB (usa archivos JSON como fallback)

