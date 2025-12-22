# 🏀 Mejora: Priorizar 2 Partidos por Jornada (IMPERATIVO)

## 📋 Problema Identificado

En algunas categorías (como TC), se estaban generando muchas jornadas con solo 1 partido, cuando **ES IMPERATIVO** tener 2 partidos por jornada debido a las restricciones del arriendo del gimnasio. Solo se acepta 1 partido cuando ya no hay más partidos por programar.

## ✅ Solución Implementada

Se mejoró completamente el algoritmo `avoidConsecutiveRounds` en `FixtureGenerator.ts` con un enfoque de **búsqueda exhaustiva y agresiva**:

### Características del Nuevo Algoritmo:

1. **BÚSQUEDA EXHAUSTIVA DE 2 PARTIDOS (IMPERATIVO ABSOLUTO)**
   - Para cada jornada, encuentra TODOS los partidos posibles
   - Ordena por "peso" (prioriza equipos con menos partidos para equidad)
   - Busca exhaustivamente combinaciones de 2 partidos compatibles
   - **SOLO acepta 1 partido en la ÚLTIMA jornada** cuando ya no hay más partidos disponibles
   - Si no encuentra 2 partidos compatibles, relaja restricciones (excepto última jornada)
   - Si aún así no encuentra 2, fuerza asignación de 2 partidos (excepto última jornada)

2. **DISTRIBUCIÓN EQUITATIVA**
   - Lleva un conteo de partidos por equipo
   - Prioriza equipos con menos partidos asignados
   - Evita que algunos equipos jueguen mucho más que otros
   - Garantiza equidad en la programación

3. **RESTRICCIONES ESTRICTAS:**
   - ✅ **IMPERATIVO**: 2 partidos por jornada (EXCEPTO última jornada de ida y vuelta)
   - ✅ Solo la última jornada puede tener 1 partido
   - ✅ Ningún equipo juega dos veces en la misma jornada
   - ✅ Ningún equipo juega en jornadas consecutivas (cuando es posible)
   - ✅ Distribución equitativa de partidos entre equipos

## 🔧 Cómo Funciona el Nuevo Algoritmo

### Proceso de Búsqueda Exhaustiva:

1. **Para cada jornada:**
   - **Paso 1**: Encuentra TODOS los partidos posibles que no violen restricciones
   - **Paso 2**: Ordena por "peso" (equipos con menos partidos = mayor prioridad)
   - **Paso 3**: Busca exhaustivamente combinaciones de 2 partidos compatibles
   - **Paso 4**: Si encuentra 2, los asigna inmediatamente
   - **Paso 5**: Si no encuentra 2, busca el mejor partido único (solo si es necesario)

2. **Sistema de Pesos para Equidad:**
   - Cada equipo tiene un contador de partidos asignados
   - Los partidos se ordenan por: `peso = partidos_equipoA + partidos_equipoB`
   - Menor peso = mayor prioridad = equipos con menos partidos
   - Esto garantiza distribución equitativa

3. **Resultado Garantizado:**
   - **Casi todas las jornadas tendrán 2 partidos**
   - Solo la última jornada (si hay número impar de equipos) puede tener 1 partido
   - Distribución equitativa entre todos los equipos
   - Sin cansancio excesivo en ningún equipo

## 📊 Ejemplo

**Antes:**
- Jornada 1: Partido A vs B
- Jornada 2: Partido C vs D
- Jornada 3: Partido E vs F
- Jornada 4: Partido A vs C ❌ (solo 1 partido)
- Jornada 5: Partido B vs D ❌ (solo 1 partido)

**Ahora:**
- Jornada 1: Partido A vs B, Partido C vs D ✅ (2 partidos)
- Jornada 2: Partido E vs F, Partido A vs C ✅ (2 partidos)
- Jornada 3: Partido B vs D, Partido C vs E ✅ (2 partidos)
- Jornada 4: Partido A vs D, Partido B vs F ✅ (2 partidos)

## 🎯 Beneficios

1. **Mejor uso del tiempo**: Más partidos por jornada = menos jornadas totales
2. **Más eficiente**: Los equipos juegan más seguido sin violar restricciones
3. **Más justo**: Todos los equipos tienen la misma distribución de partidos

## ⚠️ Notas Importantes

- Si hay un número **impar de equipos**, la última jornada puede tener solo 1 partido (esto es inevitable)
- El algoritmo respeta las restricciones de jornadas consecutivas cuando es posible
- Si es absolutamente necesario, puede relajar la restricción de jornadas consecutivas para evitar jornadas con 1 solo partido

## 🔄 Para Aplicar a Categorías Existentes

Si ya tienes categorías creadas con el algoritmo anterior:

1. **Opción 1: Eliminar y recrear la categoría**
   - Elimina la categoría desde la interfaz
   - Créala nuevamente con los mismos equipos
   - El nuevo fixture tendrá 2 partidos por jornada

2. **Opción 2: Regenerar el fixture**
   - Si hay una opción de regenerar fixture, úsala
   - Los nuevos partidos seguirán el algoritmo mejorado

## ✅ Verificación

Para verificar que funciona:

1. Crea una nueva categoría con varios equipos (ej: 6 equipos)
2. Genera el fixture
3. Revisa el fixture y verifica que:
   - La mayoría de jornadas tienen 2 partidos
   - Ningún equipo juega dos veces en la misma jornada
   - Los equipos no juegan en jornadas consecutivas (cuando es posible)

