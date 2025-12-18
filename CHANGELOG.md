# Changelog - ABALA Sistema de Gestión de Campeonatos

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2025-01-27

### Agregado
- Dashboard ejecutivo con resumen general de campeonatos
- Próximos partidos destacados en el dashboard
- Resultados recientes en el dashboard
- Estadísticas rápidas (total partidos, jugados, pendientes)
- Event delegation para botones de pestañas (más robusto)
- Logging detallado para diagnóstico de problemas

### Corregido
- Error de sintaxis TypeScript en forEach (líneas 753, 803, 849)
- Funciones no disponibles globalmente (loadDashboard, switchDataTab)
- Botones de pestañas no respondían al clic
- Manejo de errores mejorado en todas las funciones
- Selectores CSS más específicos para evitar conflictos

### Mejorado
- Todas las funciones críticas disponibles en window global
- Sistema de event listeners más robusto
- Manejo de errores con try-catch en todas las funciones
- Mensajes de error más descriptivos
- Interfaz más estable y confiable

## [1.0.0] - 2025-01-01

### Agregado
- Sistema completo de gestión de campeonatos
- Creación de campeonatos con configuración de vueltas
- Gestión de categorías (TC, Senior, Super Senior)
- Generación automática de fixture (ida y vuelta)
- Tabla de posiciones con cálculo automático
- Registro de resultados de partidos
- Aplicación de multas/sanciones de puntos
- Exportación de fixture y tablas a PDF
- Almacenamiento persistente en servidor
- Almacenamiento local (localStorage)
- Interfaz responsive para smartphones
- Generación automática de cuadrangular final
- Diseño amigable para personas mayores

### Características Técnicas
- Backend: Node.js + Express + TypeScript
- Frontend: HTML + CSS + JavaScript vanilla
- Almacenamiento: JSON files + localStorage
- Deployment: Vercel Serverless Functions

