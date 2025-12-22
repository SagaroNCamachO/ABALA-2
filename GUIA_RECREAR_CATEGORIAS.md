# 🔄 Guía para Recrear Categorías con el Nuevo Algoritmo

## 📋 Objetivo

Recrear las categorías existentes para que usen el nuevo algoritmo mejorado que garantiza **2 partidos por jornada** y distribución equitativa.

## 🔍 Paso 1: Identificar las Categorías Actuales

### Opción A: Desde la Interfaz Web

1. Abre la aplicación: https://abala.vercel.app
2. Ve a **"📊 Datos Creados"**
3. Haz clic en la pestaña **"Categorías"**
4. Anota el nombre de cada categoría y su campeonato

### Opción B: Desde la Consola del Navegador

1. Abre la aplicación en el navegador
2. Presiona **F12** para abrir las herramientas de desarrollador
3. Ve a la pestaña **"Console"**
4. Ejecuta este código:

```javascript
// Obtener todas las categorías
fetch('https://abala.vercel.app/api/championships')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('📊 Campeonatos encontrados:');
      Object.entries(data.championships).forEach(([id, champ]) => {
        console.log(`\n🏆 ${champ.name} (ID: ${id})`);
        console.log(`   Categorías: ${champ.categories.join(', ')}`);
      });
    }
  });
```

5. Para cada categoría, obtén los equipos:

```javascript
// Reemplaza 'champId' y 'categoryName' con los valores reales
const champId = 'tu_campeonato_id';
const categoryName = 'TC';

fetch(`https://abala.vercel.app/api/championships/${champId}`)
  .then(res => res.json())
  .then(data => {
    if (data.success && data.championship.categories[categoryName]) {
      const cat = data.championship.categories[categoryName];
      const teams = cat.teams.map(t => t.name || t);
      console.log(`\n📂 Categoría: ${categoryName}`);
      console.log(`   Equipos (${teams.length}):`);
      teams.forEach((team, i) => console.log(`   ${i + 1}. ${team}`));
      console.log(`\n   Para recrear, usa estos equipos:`);
      console.log(`   ${JSON.stringify(teams)}`);
    }
  });
```

## 🗑️ Paso 2: Eliminar las Categorías Existentes

Para cada categoría que quieras recrear:

1. Ve a **"📊 Datos Creados"** → Pestaña **"Categorías"**
2. Busca la categoría que quieres eliminar
3. Haz clic en el botón **"🗑️ Eliminar"**
4. Confirma la eliminación
5. Repite para las otras categorías

**O desde la consola del navegador:**

```javascript
// Reemplaza con los valores reales
const champId = 'tu_campeonato_id';
const categoryName = 'TC';

fetch(`https://abala.vercel.app/api/championships/${champId}/categories/${encodeURIComponent(categoryName)}`, {
  method: 'DELETE'
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log(`✅ Categoría "${categoryName}" eliminada`);
  } else {
    console.error(`❌ Error: ${data.error}`);
  }
});
```

## ➕ Paso 3: Recrear las Categorías

Para cada categoría eliminada:

1. Ve a **"⚙️ Gestión del Campeonato"** → Pestaña **"➕ Crear Nuevo"**
2. Selecciona **"📁 Agregar una Categoría a un Campeonato"**
3. Selecciona el campeonato correspondiente
4. Ingresa el nombre de la categoría (ej: TC, Senior, etc.)
5. En el campo **"Equipos"**, ingresa todos los equipos separados por comas:

   ```
   Equipo 1, Equipo 2, Equipo 3, Equipo 4, Equipo 5, Equipo 6
   ```

6. Haz clic en **"✅ Crear Ahora"**
7. El nuevo fixture se generará automáticamente con el algoritmo mejorado

## ✅ Paso 4: Verificar el Nuevo Fixture

1. Ve a **"⚙️ Gestión del Campeonato"** → Pestaña **"👁️ Ver y Gestionar"**
2. Selecciona **"📅 Ver Calendario de Partidos (Fixture)"**
3. Selecciona el campeonato y la categoría recreada
4. Haz clic en **"👁️ Ver Información"**
5. Verifica que:
   - ✅ La mayoría de jornadas tienen **2 partidos**
   - ✅ Solo la última jornada puede tener 1 partido (si hay número impar de equipos)
   - ✅ Los equipos no juegan en jornadas consecutivas
   - ✅ La distribución es equitativa

## 📝 Ejemplo Completo

Supongamos que tienes estas categorías:

### Categoría 1: TC
- **Campeonato**: Campeonato 2025
- **Equipos**: Equipo A, Equipo B, Equipo C, Equipo D, Equipo E, Equipo F

### Categoría 2: Senior
- **Campeonato**: Campeonato 2025
- **Equipos**: Team 1, Team 2, Team 3, Team 4

### Categoría 3: Super Senior
- **Campeonato**: Campeonato 2025
- **Equipos**: Club Alpha, Club Beta, Club Gamma, Club Delta, Club Epsilon

**Proceso:**

1. **Eliminar TC:**
   - Datos Creados → Categorías → TC → 🗑️ Eliminar

2. **Recrear TC:**
   - Crear Nuevo → Agregar Categoría
   - Nombre: `TC`
   - Equipos: `Equipo A, Equipo B, Equipo C, Equipo D, Equipo E, Equipo F`
   - Crear Ahora

3. **Repetir para Senior y Super Senior**

## 🎯 Resultado Esperado

Después de recrear, deberías ver:

- ✅ **Jornadas con 2 partidos** (la mayoría)
- ✅ **Distribución equitativa** entre equipos
- ✅ **Sin jornadas consecutivas** para ningún equipo
- ✅ **Mejor uso del tiempo** del gimnasio

## ⚠️ Notas Importantes

- **Los resultados de partidos se perderán** al eliminar una categoría
- Si necesitas conservar resultados, anótalos antes de eliminar
- El nuevo fixture será completamente nuevo
- Los partidos se programarán automáticamente con el algoritmo mejorado

## 🆘 Si Necesitas Ayuda

Si no puedes ver las categorías o necesitas ayuda:

1. Abre la consola del navegador (F12)
2. Ejecuta: `loadData()`
3. Esto recargará todos los datos desde MongoDB
4. Luego intenta ver las categorías nuevamente

