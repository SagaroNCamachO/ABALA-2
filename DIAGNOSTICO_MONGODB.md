# 🔍 Diagnóstico de MongoDB

## Estado Actual

### ✅ Lo que está bien:
1. **Código implementado correctamente**
   - `MongoDBStorage.ts` está bien implementado
   - La integración en `api.ts` es correcta
   - El paquete `mongodb` está instalado (versión 6.3.0)

2. **Variable de entorno configurada**
   - La URI está correctamente formateada
   - Usuario: `abala_db_user`
   - Cluster: `cluster0.twy4nuq.mongodb.net`

### ⚠️ Problema detectado:
**Error de conexión**: `querySrv ETIMEOUT _mongodb._tcp.cluster0.twy4nuq.mongodb.net`

Este error puede deberse a:
1. **Restricciones de red en MongoDB Atlas** (más probable)
2. **Problemas de DNS/firewall local**
3. **Configuración de red en MongoDB Atlas**

## 🔧 Soluciones

### Solución 1: Verificar Network Access en MongoDB Atlas

1. **Accede a MongoDB Atlas**
   - Ve a: https://cloud.mongodb.com/
   - Inicia sesión con tu cuenta

2. **Ve a Network Access**
   - En el menú lateral, haz clic en **Network Access**
   - O ve directamente a: https://cloud.mongodb.com/v2#/security/network/whitelist

3. **Verifica las IPs permitidas**
   - Debe haber una entrada que permita conexiones
   - **Recomendado**: Agregar `0.0.0.0/0` para permitir desde cualquier IP
   - O agrega tu IP actual

4. **Agregar IP si es necesario**
   - Haz clic en **Add IP Address**
   - Selecciona **Allow Access from Anywhere** (0.0.0.0/0)
   - O agrega tu IP actual manualmente
   - Haz clic en **Confirm**

### Solución 2: Verificar Credenciales

1. **Ve a Database Access**
   - En MongoDB Atlas, ve a **Database Access**
   - Verifica que el usuario `abala_db_user` existe
   - Verifica que la contraseña sea correcta

2. **Si necesitas resetear la contraseña**
   - Haz clic en el usuario
   - Haz clic en **Edit**
   - Cambia la contraseña
   - Actualiza la URI en Vercel con la nueva contraseña

### Solución 3: Verificar la URI

La URI debe tener este formato:
```
mongodb+srv://abala_db_user:hbHkdaDMx5dXYXYJ@cluster0.twy4nuq.mongodb.net/abala_championships?retryWrites=true&w=majority
```

Componentes:
- `mongodb+srv://` - Protocolo
- `abala_db_user` - Usuario
- `hbHkdaDMx5dXYXYJ` - Contraseña
- `cluster0.twy4nuq.mongodb.net` - Cluster
- `abala_championships` - Nombre de la base de datos
- `?retryWrites=true&w=majority` - Opciones

### Solución 4: Probar desde Vercel

**En Vercel, MongoDB debería funcionar mejor** porque:
- Vercel tiene IPs conocidas
- Las conexiones desde servidores son más estables

**Para verificar en Vercel:**
1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Verifica que `MONGODB_URI` esté configurada
4. Haz un nuevo deploy
5. Revisa los logs del deployment
6. Busca mensajes como:
   - `✅ Conectado a MongoDB`
   - `✅ Cargados X campeonato(s) desde MongoDB`

## 📝 Verificación Paso a Paso

### Paso 1: Verificar en MongoDB Atlas

```bash
# Ejecuta el script de verificación
npm run verify-mongodb
```

### Paso 2: Verificar en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Deployments**
4. Haz clic en el último deployment
5. Ve a **Logs**
6. Busca mensajes de MongoDB

### Paso 3: Probar la aplicación

1. Abre tu aplicación en Vercel
2. Crea un nuevo campeonato
3. Recarga la página
4. El campeonato debería persistir

## 🎯 Acción Inmediata Recomendada

1. **Verifica Network Access en MongoDB Atlas**
   - Asegúrate de que `0.0.0.0/0` esté permitido
   - Esto es necesario para que Vercel pueda conectarse

2. **Verifica en Vercel**
   - Asegúrate de que la variable `MONGODB_URI` esté configurada
   - Haz un nuevo deploy después de verificar

3. **Revisa los logs de Vercel**
   - Busca mensajes de conexión exitosa
   - Si hay errores, compártelos para diagnóstico

## ✅ Estado Esperado

Cuando todo esté bien configurado, deberías ver en los logs:

```
✅ Conectado a MongoDB
✅ Cargados X campeonato(s) desde MongoDB
💾 Guardados X campeonato(s) en MongoDB
```

## 📞 Si el problema persiste

1. Verifica que MongoDB Atlas esté activo
2. Verifica que el cluster no esté pausado
3. Verifica que no haya límites de conexión alcanzados
4. Revisa los logs detallados en MongoDB Atlas

