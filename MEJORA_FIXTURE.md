# 🏀 Mejora: Evitar Jornadas Consecutivas

## 📋 Descripción

Se ha implementado una mejora en el generador de fixtures para **evitar que ningún equipo juegue en dos jornadas consecutivas**, reduciendo el cansancio de los equipos.

## ✅ Funcionalidad Implementada

### Antes
- Los equipos podían jugar en jornadas consecutivas (ej: Jornada 1 y Jornada 2)
- Esto causaba cansancio innecesario

### Ahora
- **Ningún equipo juega en jornadas consecutivas**
- Entre cada partido de un equipo, hay al menos una jornada de descanso
- El algoritmo reorganiza automáticamente los partidos para cumplir esta restricción

## 🔧 Cómo Funciona

1. **Generación de enfrentamientos**: Se generan todos los enfrentamientos únicos entre equipos
2. **Mezcla aleatoria**: Los enfrentamientos se mezclan aleatoriamente para distribución justa
3. **Asignación inteligente**: El algoritmo asigna partidos a jornadas verificando que:
   - Ningún equipo haya jugado en la jornada anterior
   - Se respete el límite de 2 partidos por jornada
   - Todos los enfrentamientos se asignen eventualmente

## 📊 Ejemplo

**Antes** (sin restricción):
- Jornada 1: Equipo A vs Equipo B
- Jornada 2: Equipo A vs Equipo C ❌ (Equipo A juega consecutivamente)

**Ahora** (con restricción):
- Jornada 1: Equipo A vs Equipo B
- Jornada 2: Equipo C vs Equipo D ✅ (Equipo A descansa)
- Jornada 3: Equipo A vs Equipo C ✅ (Equipo A descansó en Jornada 2)

## 🎯 Beneficios

1. **Menos cansancio**: Los equipos tienen tiempo de recuperación entre partidos
2. **Más justicia**: Todos los equipos tienen la misma distribución de descansos
3. **Mejor calidad**: Los partidos son más competitivos al evitar fatiga

## 🔍 Verificación

Para verificar que funciona:

1. Crea un campeonato con varios equipos
2. Genera el fixture
3. Revisa el fixture y verifica que ningún equipo juegue en jornadas consecutivas

## 📝 Notas Técnicas

- La restricción se aplica tanto en la **ida** como en la **vuelta**
- Si no es posible evitar completamente las jornadas consecutivas (casos extremos), el algoritmo intenta minimizarlas
- El algoritmo es determinístico pero usa mezcla aleatoria inicial para variabilidad

