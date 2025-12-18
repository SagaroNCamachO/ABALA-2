# Ejemplo de Uso de la API

## ✅ Paso 1: Crear un Campeonato

**Request:**
```bash
POST /api/championships
Content-Type: application/json

{
  "id": "CampeonatoLaboralAncud2026",
  "name": "Campeonato Laboral 2026",
  "rounds": 2,
  "points_per_win": 2,
  "points_per_loss": 0
}
```

**Response (lo que recibiste):**
```json
{
  "success": true,
  "id": "CampeonatoLaboralAncud2026",
  "championship": {
    "name": "Campeonato Laboral 2026",
    "rounds": 2,
    "points_per_win": 2,
    "points_per_loss": 0,
    "categories": {}
  }
}
```

✅ **Esto es correcto** - El campeonato se creó exitosamente. Las categorías están vacías porque aún no has agregado ninguna.

---

## 📋 Paso 2: Agregar una Categoría

Ahora necesitas agregar categorías al campeonato. Tienes dos opciones:

### Opción A: Agregar con nombres de equipos personalizados

**Request:**
```bash
POST /api/championships/CampeonatoLaboralAncud2026/categories
Content-Type: application/json

{
  "name": "TC",
  "teams": ["Equipo A", "Equipo B", "Equipo C", "Equipo D"]
}
```

### Opción B: Agregar con número de equipos (nombres automáticos)

**Request:**
```bash
POST /api/championships/CampeonatoLaboralAncud2026/categories
Content-Type: application/json

{
  "name": "Senior",
  "num_teams": 4
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "name": "TC",
    "rounds": 2,
    "teams": [...],
    "matches": [...],  // Fixture generado automáticamente
    "standings": {...}
  }
}
```

---

## 🎯 Paso 3: Registrar Resultados

Una vez que tengas categorías y equipos, puedes registrar resultados:

**Request:**
```bash
POST /api/championships/CampeonatoLaboralAncud2026/results
Content-Type: application/json

{
  "category": "TC",
  "team_a": "Equipo A",
  "team_b": "Equipo B",
  "round_number": 1,
  "score_a": 95,
  "score_b": 82
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resultado registrado"
}
```

---

## 📊 Paso 4: Ver Tabla de Posiciones

**Request:**
```bash
GET /api/championships/CampeonatoLaboralAncud2026/standings/TC
```

**Response:**
```json
{
  "success": true,
  "standings": [
    {
      "name": "Equipo A",
      "category": "TC",
      "pj": 1,
      "pg": 1,
      "pp": 0,
      "pf": 95,
      "pc": 82,
      "difference": 13,
      "points": 2,
      "penalty_points": 0
    },
    ...
  ]
}
```

---

## 📅 Paso 5: Ver Fixture

**Request:**
```bash
GET /api/championships/CampeonatoLaboralAncud2026/fixture/TC
```

O para una vuelta específica:
```bash
GET /api/championships/CampeonatoLaboralAncud2026/fixture/TC?round=1
```

---

## 🔄 Flujo Completo de Ejemplo

```bash
# 1. Crear campeonato (YA LO HICISTE ✅)
POST /api/championships
{
  "id": "CampeonatoLaboralAncud2026",
  "name": "Campeonato Laboral 2026",
  "rounds": 2
}

# 2. Agregar categoría TC
POST /api/championships/CampeonatoLaboralAncud2026/categories
{
  "name": "TC",
  "teams": ["Los Leones", "Los Tigres", "Los Halcones", "Las Águilas"]
}

# 3. Registrar resultado
POST /api/championships/CampeonatoLaboralAncud2026/results
{
  "category": "TC",
  "team_a": "Los Leones",
  "team_b": "Los Tigres",
  "round_number": 1,
  "score_a": 95,
  "score_b": 82
}

# 4. Ver tabla de posiciones
GET /api/championships/CampeonatoLaboralAncud2026/standings/TC

# 5. Ver fixture
GET /api/championships/CampeonatoLaboralAncud2026/fixture/TC
```

---

## 💡 Notas Importantes

1. **El campeonato se crea vacío** - Es normal que `categories: {}` esté vacío al inicio
2. **El fixture se genera automáticamente** - Cuando agregas una categoría, el sistema genera todos los partidos automáticamente
3. **Los resultados actualizan la tabla** - Cada vez que registras un resultado, la tabla de posiciones se recalcula automáticamente
4. **Puedes agregar múltiples categorías** - TC, Senior, Super Senior, etc.

---

## 🎯 Próximo Paso

Ahora que tienes el campeonato creado, el siguiente paso es **agregar una categoría** usando:

```
POST /api/championships/CampeonatoLaboralAncud2026/categories
```


