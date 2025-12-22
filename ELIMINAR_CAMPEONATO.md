# 🗑️ Eliminar Campeonato de MongoDB

## Opción 1: Desde la Interfaz Web (Recomendado)

1. Abre la aplicación: https://abala.vercel.app
2. Ve a la sección **"📊 Datos Creados"**
3. Busca el campeonato con ID: `campeonato_2025_imported`
4. Haz clic en el botón **"🗑️ Eliminar"**
5. Confirma la eliminación

## Opción 2: Desde MongoDB Atlas (Directo)

1. Accede a MongoDB Atlas: https://cloud.mongodb.com/
2. Inicia sesión con tu cuenta
3. Ve a **"Database"** → Selecciona tu cluster
4. Haz clic en **"Browse Collections"**
5. Selecciona la base de datos: `abala_championships`
6. Selecciona la colección: `championships`
7. Busca el documento con `_id: "campeonato_2025_imported"`
8. Haz clic en el documento y luego en **"Delete"**
9. Confirma la eliminación

## Opción 3: Usando el Script (Requiere conexión local)

Si tienes acceso local a MongoDB o tu IP está permitida:

```bash
# Configurar la variable de entorno
$env:MONGODB_URI = "mongodb+srv://abala_db_user:hbHkdaDMx5dXYXYJ@cluster0.twy4nuq.mongodb.net/abala_championships?retryWrites=true&w=majority"

# Ejecutar el script
npm run delete-champ campeonato_2025_imported
```

## Opción 4: Usando la API directamente

Puedes hacer una petición DELETE a la API:

```bash
curl -X DELETE https://abala.vercel.app/api/championships/campeonato_2025_imported
```

O desde el navegador, abre la consola (F12) y ejecuta:

```javascript
fetch('https://abala.vercel.app/api/championships/campeonato_2025_imported', {
  method: 'DELETE'
})
.then(res => res.json())
.then(data => console.log(data));
```

## ⚠️ Nota Importante

- La eliminación es **permanente** y no se puede deshacer
- El campeonato se eliminará tanto de MongoDB como de los archivos JSON locales
- Asegúrate de tener una copia de seguridad si necesitas los datos después

## ✅ Verificación

Después de eliminar, verifica que se haya eliminado:

1. Recarga la página en la interfaz web
2. El campeonato no debería aparecer en "📊 Datos Creados"
3. O verifica en MongoDB Atlas que el documento ya no existe

