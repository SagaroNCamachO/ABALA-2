# 🏀 Mejora: Priorizar 2 Partidos por Jornada

## 📋 Problema Identificado

En algunas categorías (como TC), se estaban generando muchas jornadas con solo 1 partido, cuando debería haber 2 partidos por jornada siempre que sea posible.

## ✅ Solución Implementada

Se mejoró el algoritmo `avoidConsecutiveRounds` en `FixtureGenerator.ts` para:

### Prioridades del Nuevo Algoritmo:

1. **PRIORIDAD 1: Llenar jornada con 2 partidos**
   - El algoritmo busca activamente 2 partidos que puedan jugarse en la misma jornada
   - Verifica que ningún equipo se repita en la misma jornada
   - Verifica que ningún equipo haya jugado en la jornada anterior (consecutiva)

2. **PRIORIDAD 2: Al menos 1 partido**
   - Si no se pueden encontrar 2 partidos compatibles, busca al menos 1
   - Solo se acepta 1 partido si es absolutamente necesario

3. **Restricciones Respetadas:**
   - ✅ Ningún equipo juega dos veces en la misma jornada
   - ✅ Ningún equipo juega en jornadas consecutivas (cuando es posible)
   - ✅ Se prioriza tener 2 partidos por jornada

## 🔧 Cómo Funciona

### Algoritmo Mejorado:

1. **Para cada jornada:**
   - Crea un conjunto de equipos que ya están en la jornada
   - Busca partidos donde los equipos no estén ya en la jornada
   - Verifica que los equipos no hayan jugado en la jornada anterior
   - Agrega hasta 2 partidos a la jornada

2. **Búsqueda Inteligente:**
   - Primero intenta encontrar 2 partidos compatibles
   - Si no encuentra 2, busca al menos 1
   - Solo fuerza un partido si es absolutamente necesario

3. **Resultado:**
   - La mayoría de jornadas tendrán 2 partidos
   - Solo las últimas jornadas (si hay número impar de equipos) pueden tener 1 partido

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

