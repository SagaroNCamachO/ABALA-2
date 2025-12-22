# ⚡ Guía Rápida: Recrear 3 Categorías

## 🎯 Método Más Rápido (Desde la Consola del Navegador)

### Paso 1: Obtener Información de las Categorías

1. Abre: https://abala.vercel.app
2. Presiona **F12** → Pestaña **Console**
3. Copia y pega este código:

```javascript
// Obtener todas las categorías con sus equipos
async function obtenerTodasLasCategorias() {
  const res = await fetch('/api/championships');
  const data = await res.json();
  
  if (data.success) {
    console.log('📊 CATEGORÍAS ENCONTRADAS:\n');
    
    for (const [champId, champ] of Object.entries(data.championships)) {
      console.log(`\n🏆 ${champ.name} (ID: ${champId})`);
      
      // Obtener detalles completos
      const champRes = await fetch(`/api/championships/${champId}`);
      const champData = await champRes.json();
      
      if (champData.success && champData.championship.categories) {
        for (const [catName, cat] of Object.entries(champData.championship.categories)) {
          const teams = cat.teams.map(t => t.name || t);
          console.log(`\n   📂 ${catName}`);
          console.log(`      Equipos (${teams.length}): ${teams.join(', ')}`);
          console.log(`      \n      Para recrear:`);
          console.log(`      await recrearCategoria('${champId}', '${catName}', ${JSON.stringify(teams)});`);
        }
      }
    }
  }
}

obtenerTodasLasCategorias();
```

4. Anota los nombres de las 3 categorías y sus equipos

### Paso 2: Recrear las Categorías

Copia y pega este código en la consola (modifica con tus datos):

```javascript
// Función para recrear una categoría
async function recrearCategoria(champId, categoryName, teams) {
  console.log(`\n🔄 Recreando: ${categoryName}`);
  
  // 1. Eliminar
  const deleteRes = await fetch(`/api/championships/${champId}/categories/${encodeURIComponent(categoryName)}`, {
    method: 'DELETE'
  });
  const deleteData = await deleteRes.json();
  console.log(deleteData.success ? '   ✅ Eliminada' : `   ⚠️  ${deleteData.error || 'No existía'}`);
  
  await new Promise(r => setTimeout(r, 1000));
  
  // 2. Crear
  const createRes = await fetch(`/api/championships/${champId}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: categoryName, teams: teams })
  });
  const createData = await createRes.json();
  console.log(createData.success ? '   ✅ Creada con nuevo algoritmo' : `   ❌ Error: ${createData.error}`);
  
  return createData.success;
}

// ============================================
// MODIFICA ESTOS DATOS CON TUS CATEGORÍAS
// ============================================

const categorias = [
  {
    champId: 'CAMPEONATO_ID_AQUI',
    name: 'TC',
    teams: ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4', 'Equipo 5', 'Equipo 6']
  },
  {
    champId: 'CAMPEONATO_ID_AQUI',
    name: 'Senior',
    teams: ['Team A', 'Team B', 'Team C', 'Team D']
  },
  {
    champId: 'CAMPEONATO_ID_AQUI',
    name: 'Super Senior',
    teams: ['Club 1', 'Club 2', 'Club 3', 'Club 4', 'Club 5']
  }
];

// Recrear todas
async function recrearTodas() {
  console.log('🚀 Iniciando recreación de categorías...\n');
  for (const cat of categorias) {
    await recrearCategoria(cat.champId, cat.name, cat.teams);
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\n✅ Proceso completado. Recarga la página para ver los cambios.');
  if (typeof window.loadData === 'function') window.loadData();
}

// Ejecutar: recrearTodas()
```

### Paso 3: Verificar

1. Ve a **"👁️ Ver y Gestionar"** → **"📅 Ver Calendario de Partidos"**
2. Selecciona cada categoría recreada
3. Verifica que las jornadas tengan **2 partidos**

## 📝 Método Manual (Desde la Interfaz)

Si prefieres hacerlo manualmente:

1. **Anotar equipos:**
   - Ve a cada categoría en "📊 Datos Creados"
   - Anota todos los equipos

2. **Eliminar:**
   - Categorías → 🗑️ Eliminar (una por una)

3. **Recrear:**
   - Crear Nuevo → Agregar Categoría
   - Ingresa nombre y equipos (separados por comas)
   - Crear Ahora

## ✅ Verificación Final

Después de recrear, verifica:

- ✅ Jornadas con 2 partidos (la mayoría)
- ✅ Solo última jornada puede tener 1 partido
- ✅ Equipos no juegan en jornadas consecutivas
- ✅ Distribución equitativa

