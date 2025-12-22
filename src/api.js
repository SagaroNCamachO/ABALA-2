"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const Championship_1 = require("./models/Championship");
const ChampionshipStorage_1 = require("./storage/ChampionshipStorage");
const MongoDBStorage_1 = require("./storage/MongoDBStorage");
const TeamStatistics_1 = require("./utils/TeamStatistics");
const Validation_1 = require("./utils/Validation");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servir archivos estáticos (HTML, CSS, JS)
const publicPath = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicPath));
// Cargar campeonatos desde almacenamiento persistente al iniciar
// Intenta MongoDB primero, luego fallback a archivos JSON
let championships = new Map();
let isLoading = false;
let loadPromise = null;
/**
 * Cargar campeonatos de forma lazy (solo cuando se necesite).
 * Esto es importante en serverless donde la carga asíncrona inicial puede no completarse.
 */
async function ensureChampionshipsLoaded() {
    // Si ya están cargados, no hacer nada
    if (championships.size > 0 || isLoading) {
        if (loadPromise) {
            return loadPromise;
        }
        return Promise.resolve();
    }
    // Si ya hay una carga en progreso, esperar a que termine
    if (loadPromise) {
        return loadPromise;
    }
    isLoading = true;
    loadPromise = (async () => {
        try {
            console.log('🔄 Cargando campeonatos desde almacenamiento...');
            // Intentar cargar desde MongoDB si está configurado
            if (process.env.MONGODB_URI) {
                try {
                    const mongoChamps = await MongoDBStorage_1.MongoDBStorage.load();
                    if (mongoChamps.size > 0) {
                        championships = mongoChamps;
                        console.log(`✅ Cargados ${championships.size} campeonato(s) desde MongoDB`);
                        // Verificar que los resultados se hayan cargado correctamente
                        let totalMatches = 0;
                        let totalPlayed = 0;
                        for (const [, champ] of championships.entries()) {
                            for (const category of Array.from(champ.categories.values())) {
                                totalMatches += category.matches.length;
                                totalPlayed += category.matches.filter(m => m.played).length;
                            }
                        }
                        console.log(`📊 Estadísticas cargadas: ${totalPlayed}/${totalMatches} partidos jugados`);
                        isLoading = false;
                        return;
                    }
                }
                catch (mongoError) {
                    console.warn('⚠️ Error cargando desde MongoDB, usando fallback:', mongoError.message);
                }
            }
            // Fallback a almacenamiento local (archivos JSON)
            championships = ChampionshipStorage_1.ChampionshipStorage.load();
            console.log(`✅ Cargados ${championships.size} campeonato(s) desde almacenamiento local`);
        }
        catch (error) {
            console.error('❌ Error cargando campeonatos:', error);
            championships = new Map();
        }
        finally {
            isLoading = false;
            loadPromise = null;
        }
    })();
    return loadPromise;
}
/**
 * Función auxiliar para guardar automáticamente después de cambios.
 */
async function autoSave() {
    try {
        // Intentar guardar en MongoDB si está configurado
        if (process.env.MONGODB_URI) {
            await MongoDBStorage_1.MongoDBStorage.save(championships);
        }
        // Siempre guardar también en almacenamiento local como backup
        ChampionshipStorage_1.ChampionshipStorage.save(championships);
    }
    catch (error) {
        console.error('Error en auto-guardado:', error);
    }
}
/**
 * Endpoint raíz - Servir interfaz HTML o JSON según Accept header.
 */
app.get('/', (_req, res) => {
    try {
        const accept = _req.headers.accept || '';
        // Si el cliente acepta HTML, servir la interfaz web
        if (accept.includes('text/html')) {
            const htmlPath = path_1.default.join(__dirname, '../public/index.html');
            return res.sendFile(htmlPath);
        }
        // Si no, devolver JSON (para APIs)
        return res.json({
            message: "API de Gestión de Campeonatos de Básquetbol",
            version: "1.3.0",
            status: "operational",
            endpoints: {
                "POST /api/championships": "Crear un nuevo campeonato",
                "GET /api/championships": "Listar todos los campeonatos",
                "GET /api/championships/:id": "Obtener un campeonato",
                "DELETE /api/championships/:id": "Eliminar un campeonato",
                "POST /api/championships/:id/categories": "Agregar categoría",
                "DELETE /api/championships/:id/categories/:category": "Eliminar categoría",
                "POST /api/championships/:id/results": "Registrar resultado",
                "GET /api/championships/:id/standings/:category": "Obtener tabla de posiciones",
                "GET /api/championships/:id/fixture/:category": "Obtener fixture",
                "POST /api/championships/:id/penalty": "Aplicar multa"
            },
            web_interface: "Visita esta URL en un navegador para ver la interfaz web"
        });
    }
    catch (error) {
        console.error('❌ Error en endpoint raíz:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});
/**
 * Endpoint de salud.
 */
app.get('/health', (_req, res) => {
    res.json({
        status: "healthy",
        message: "API funcionando correctamente"
    });
});
/**
 * Dashboard - Resumen ejecutivo de todos los campeonatos.
 */
app.get('/api/dashboard', (_req, res) => {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
        // Resumen de campeonatos
        const championshipsSummary = [];
        const upcomingMatches = [];
        const recentResults = [];
        let totalMatches = 0;
        let totalPlayed = 0;
        let totalPending = 0;
        let totalTeams = 0;
        let totalCategories = 0;
        for (const [champId, championship] of championships.entries()) {
            const categories = Array.from(championship.categories.values());
            totalCategories += categories.length;
            let champMatches = 0;
            let champPlayed = 0;
            let champPending = 0;
            let champTeams = 0;
            for (const category of categories) {
                champTeams += category.teams.size;
                totalTeams += category.teams.size;
                // Incluir todos los partidos (regulares)
                const allMatches = category.matches;
                champMatches += allMatches.length;
                totalMatches += allMatches.length;
                const played = allMatches.filter(m => m.played).length;
                const pending = allMatches.filter(m => !m.played).length;
                champPlayed += played;
                champPending += pending;
                totalPlayed += played;
                totalPending += pending;
                // Próximos partidos (no jugados, con fecha >= hoy)
                for (const match of allMatches) {
                    if (!match.played && match.date) {
                        const matchDate = match.date;
                        if (matchDate >= today) {
                            upcomingMatches.push({
                                championship_id: champId,
                                championship_name: championship.name,
                                category: category.name,
                                team_a: match.teamA,
                                team_b: match.teamB,
                                date: match.date,
                                time: match.time || '20:00',
                                round_number: match.roundNumber,
                                match_type: match.matchType,
                                matchday: match.matchday
                            });
                        }
                    }
                }
                // Resultados recientes (últimos 10 partidos jugados)
                const recentCategoryMatches = allMatches
                    .filter(m => m.played && m.date)
                    .sort((a, b) => {
                    const dateA = a.date || '';
                    const dateB = b.date || '';
                    return dateB.localeCompare(dateA); // Más recientes primero
                })
                    .slice(0, 10);
                for (const match of recentCategoryMatches) {
                    recentResults.push({
                        championship_id: champId,
                        championship_name: championship.name,
                        category: category.name,
                        team_a: match.teamA,
                        team_b: match.teamB,
                        score_a: match.scoreA,
                        score_b: match.scoreB,
                        winner: match.winner,
                        date: match.date,
                        round_number: match.roundNumber,
                        match_type: match.matchType
                    });
                }
            }
            // Calcular progreso del campeonato
            const champProgress = champMatches > 0 ? Math.round((champPlayed / champMatches) * 100) : 0;
            championshipsSummary.push({
                id: champId,
                name: championship.name,
                rounds: championship.rounds,
                categories_count: categories.length,
                teams_count: champTeams,
                matches_total: champMatches,
                matches_played: champPlayed,
                matches_pending: champPending,
                progress_percentage: champProgress
            });
        }
        // Ordenar próximos partidos por fecha
        upcomingMatches.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            if (dateA !== dateB) {
                return dateA.localeCompare(dateB);
            }
            return (a.time || '').localeCompare(b.time || '');
        });
        // Ordenar resultados recientes por fecha (más recientes primero)
        recentResults.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA);
        });
        // Limitar a los próximos 10 partidos y últimos 10 resultados
        const nextMatches = upcomingMatches.slice(0, 10);
        const lastResults = recentResults.slice(0, 10);
        // Calcular Top 5 equipos por puntos (de todas las categorías)
        const allTeamsMap = new Map();
        for (const [champId, championship] of championships.entries()) {
            for (const category of Array.from(championship.categories.values())) {
                const standings = category.getStandings();
                for (const team of standings) {
                    const key = `${champId}_${category.name}_${team.name}`;
                    allTeamsMap.set(key, {
                        name: team.name,
                        points: team.points,
                        category: category.name,
                        championship: championship.name
                    });
                }
            }
        }
        // Ordenar por puntos y tomar top 5
        const topTeams = Array.from(allTeamsMap.values())
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);
        return res.json({
            success: true,
            dashboard: {
                summary: {
                    total_championships: championships.size,
                    total_categories: totalCategories,
                    total_teams: totalTeams,
                    total_matches: totalMatches,
                    matches_played: totalPlayed,
                    matches_pending: totalPending,
                    overall_progress: totalMatches > 0 ? Math.round((totalPlayed / totalMatches) * 100) : 0
                },
                championships: championshipsSummary,
                upcoming_matches: nextMatches,
                recent_results: lastResults,
                top_teams: topTeams
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Crear un nuevo campeonato.
 */
app.post('/api/championships', async (req, res) => {
    try {
        const data = req.body || {};
        // Validar datos
        const validation = (0, Validation_1.validateChampionship)(data);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.errors.join(', ')
            });
        }
        const champId = data.id || `champ_${championships.size + 1}`;
        // Validar que el ID no exista
        if (championships.has(champId)) {
            return res.status(400).json({
                success: false,
                error: `Ya existe un campeonato con el ID '${champId}'. Por favor, use un ID diferente.`
            });
        }
        const name = (data.name || 'Campeonato').trim();
        const rounds = parseInt(data.rounds) || 1;
        const pointsPerWin = parseInt(data.points_per_win) || 2;
        const pointsPerLoss = parseInt(data.points_per_loss) || 0;
        const championship = new Championship_1.Championship(name, rounds, pointsPerWin, pointsPerLoss);
        championships.set(champId, championship);
        // Guardar automáticamente en el almacenamiento
        await autoSave();
        return res.status(201).json({
            success: true,
            id: champId,
            championship: championship.toDict()
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Listar todos los campeonatos.
 */
app.get('/api/championships', async (_req, res) => {
    try {
        // Asegurar que los campeonatos estén cargados
        await ensureChampionshipsLoaded();
        const championshipsList = {};
        for (const [id, champ] of championships.entries()) {
            championshipsList[id] = {
                id,
                name: champ.name,
                rounds: champ.rounds,
                categories: Array.from(champ.categories.keys())
            };
        }
        return res.json({
            success: true,
            championships: championshipsList
        });
    }
    catch (error) {
        console.error('Error en GET /api/championships:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Eliminar un campeonato.
 */
app.delete('/api/championships/:id', async (req, res) => {
    try {
        // Asegurar que los campeonatos estén cargados
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        if (!championships.has(champId)) {
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        championships.delete(champId);
        // Guardar automáticamente después de eliminar
        await autoSave();
        return res.json({
            success: true,
            message: "Campeonato eliminado exitosamente"
        });
    }
    catch (error) {
        console.error('Error en DELETE /api/championships/:id:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Obtener un campeonato específico.
 */
app.get('/api/championships/:id', async (req, res) => {
    try {
        // Asegurar que los campeonatos estén cargados
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        const championship = championships.get(champId);
        if (!championship) {
            console.log(`❌ Campeonato ${champId} no encontrado. Campeonatos disponibles: ${Array.from(championships.keys()).join(', ')}`);
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        return res.json({
            success: true,
            championship: championship.toDict()
        });
    }
    catch (error) {
        console.error('Error en GET /api/championships/:id:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Eliminar una categoría de un campeonato.
 */
app.delete('/api/championships/:id/categories/:category', async (req, res) => {
    try {
        // Asegurar que los campeonatos estén cargados
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        const categoryName = req.params.category;
        const championship = championships.get(champId);
        if (!championship) {
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        const category = championship.getCategory(categoryName);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: "Categoría no encontrada"
            });
        }
        // Eliminar la categoría
        const removed = championship.removeCategory(categoryName);
        if (!removed) {
            return res.status(400).json({
                success: false,
                error: "No se pudo eliminar la categoría"
            });
        }
        // Guardar automáticamente después de eliminar
        await autoSave();
        return res.json({
            success: true,
            message: `Categoría '${categoryName}' eliminada exitosamente`
        });
    }
    catch (error) {
        console.error('Error en DELETE /api/championships/:id/categories/:category:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Agregar una categoría a un campeonato.
 */
app.post('/api/championships/:id/categories', async (req, res) => {
    try {
        // Asegurar que los campeonatos estén cargados
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        const championship = championships.get(champId);
        if (!championship) {
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        const data = req.body || {};
        console.log('📥 Datos recibidos para crear categoría:', JSON.stringify(data, null, 2));
        // Validar datos
        const validation = (0, Validation_1.validateCategory)(data);
        if (!validation.valid) {
            console.log('❌ Validación fallida:', validation.errors);
            return res.status(400).json({
                success: false,
                error: validation.errors.join(', '),
                errors: validation.errors
            });
        }
        const categoryName = (data.name || '').trim();
        const teamNames = Array.isArray(data.teams) ? data.teams : [];
        const numTeams = data.num_teams ? parseInt(data.num_teams) : undefined;
        const pointsPerWin = data.points_per_win;
        const pointsPerLoss = data.points_per_loss;
        console.log('📋 Procesando categoría:', {
            categoryName,
            teamNamesCount: teamNames.length,
            numTeams,
            hasTeams: teamNames.length > 0,
            hasNumTeams: numTeams !== undefined
        });
        if (championship.getCategory(categoryName)) {
            console.log('❌ Categoría ya existe:', categoryName);
            return res.status(400).json({
                success: false,
                error: `La categoría '${categoryName}' ya existe en este campeonato.`
            });
        }
        if (teamNames.length > 0) {
            console.log('✅ Creando categoría con equipos específicos:', teamNames);
            championship.addCategoryWithTeams(categoryName, teamNames, pointsPerWin, pointsPerLoss);
        }
        else if (numTeams && numTeams >= 2) {
            console.log('✅ Creando categoría con número de equipos:', numTeams);
            championship.addCategory(categoryName, numTeams, pointsPerWin, pointsPerLoss);
        }
        else {
            console.log('❌ No se proporcionaron equipos ni num_teams válido');
            return res.status(400).json({
                success: false,
                error: "Debe proporcionar 'teams' (array con al menos 2 equipos) o 'num_teams' (número entre 2 y 20)",
                details: {
                    teamsProvided: teamNames.length,
                    numTeamsProvided: numTeams,
                    dataReceived: data
                }
            });
        }
        const category = championship.getCategory(categoryName);
        if (!category) {
            throw new Error("Error al crear la categoría");
        }
        // Guardar automáticamente después de agregar categoría
        await autoSave();
        return res.status(201).json({
            success: true,
            category: category.toDict()
        });
    }
    catch (error) {
        console.error('Error en POST /api/championships/:id/categories:', error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Registrar el resultado de un partido.
 * Permite registrar y modificar resultados (se guardan en MongoDB).
 */
app.post('/api/championships/:id/results', async (req, res) => {
    try {
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        const championship = championships.get(champId);
        if (!championship) {
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        const data = req.body || {};
        // Validar datos
        const validation = (0, Validation_1.validateMatchResult)(data);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.errors.join(', ')
            });
        }
        const categoryName = data.category;
        const teamA = data.team_a;
        const teamB = data.team_b;
        const roundNumber = data.round_number;
        const scoreA = data.score_a;
        const scoreB = data.score_b;
        const matchType = data.match_type;
        const success = championship.registerMatchResult(categoryName, teamA, teamB, roundNumber, scoreA, scoreB, matchType);
        if (success) {
            // Guardar automáticamente en MongoDB después de registrar resultado
            await autoSave();
            return res.json({
                success: true,
                message: "Resultado registrado y guardado en MongoDB"
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: "No se pudo registrar el resultado. Verifica que el partido exista."
            });
        }
    }
    catch (error) {
        console.error('Error en POST /api/championships/:id/results:', error);
        return res.status(500).json({
            success: false,
            error: error.message || "Error interno del servidor"
        });
    }
});
/**
 * Obtener la tabla de posiciones de una categoría.
 */
app.get('/api/championships/:id/standings/:category', async (req, res) => {
    try {
        // Asegurar que los campeonatos estén cargados
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        const championship = championships.get(champId);
        if (!championship) {
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        const categoryName = req.params.category;
        const standings = championship.getStandings(categoryName);
        if (standings === null) {
            return res.status(404).json({
                success: false,
                error: "Categoría no encontrada"
            });
        }
        return res.json({
            success: true,
            standings: standings.map(team => team.toDict())
        });
    }
    catch (error) {
        console.error('Error en GET /api/championships/:id/standings/:category:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Obtener estadísticas avanzadas de un equipo.
 */
app.get('/api/championships/:id/team-stats/:category/:team', (req, res) => {
    const champId = req.params.id;
    const categoryName = req.params.category;
    const teamName = req.params.team;
    const championship = championships.get(champId);
    if (!championship) {
        return res.status(404).json({
            success: false,
            error: "Campeonato no encontrado"
        });
    }
    const category = championship.getCategory(categoryName);
    if (!category) {
        return res.status(404).json({
            success: false,
            error: "Categoría no encontrada"
        });
    }
    const team = category.teams.get(teamName);
    if (!team) {
        return res.status(404).json({
            success: false,
            error: "Equipo no encontrado"
        });
    }
    try {
        const advancedStats = TeamStatistics_1.TeamStatisticsCalculator.calculateAdvancedStats(team, category.matches, categoryName);
        return res.json({
            success: true,
            stats: advancedStats
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Obtener el fixture de una categoría.
 */
app.get('/api/championships/:id/fixture/:category', async (req, res) => {
    try {
        // Asegurar que los campeonatos estén cargados
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        const championship = championships.get(champId);
        if (!championship) {
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        const categoryName = req.params.category;
        const category = championship.getCategory(categoryName);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: "Categoría no encontrada"
            });
        }
        const roundNumber = req.query.round ? parseInt(req.query.round) : undefined;
        const matches = roundNumber
            ? category.getMatchesByRound(roundNumber)
            : category.matches;
        return res.json({
            success: true,
            matches: matches.map(match => match.toDict())
        });
    }
    catch (error) {
        console.error('Error en GET /api/championships/:id/fixture/:category:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Actualizar fecha/horario de un partido.
 */
app.put('/api/championships/:id/fixture/:category/schedule', async (req, res) => {
    const champId = req.params.id;
    const championship = championships.get(champId);
    if (!championship) {
        return res.status(404).json({
            success: false,
            error: "Campeonato no encontrado"
        });
    }
    const categoryName = req.params.category;
    const category = championship.getCategory(categoryName);
    if (!category) {
        return res.status(404).json({
            success: false,
            error: "Categoría no encontrada"
        });
    }
    const data = req.body || {};
    const teamA = data.team_a;
    const teamB = data.team_b;
    const roundNumber = data.round_number;
    const matchday = data.matchday;
    const date = data.date;
    const time = data.time;
    // Buscar el partido
    let match = category.matches.find(m => {
        const teamsMatch = (m.teamA === teamA && m.teamB === teamB) || (m.teamA === teamB && m.teamB === teamA);
        const roundMatch = m.roundNumber === roundNumber;
        const matchdayMatch = matchday === undefined || m.matchday === matchday;
        return teamsMatch && roundMatch && matchdayMatch;
    });
    if (!match) {
        return res.status(404).json({
            success: false,
            error: "Partido no encontrado"
        });
    }
    match.setSchedule(date, time);
    // Guardar automáticamente después de actualizar fecha/horario
    await autoSave();
    return res.json({
        success: true,
        message: "Fecha y horario actualizados",
        match: match.toDict()
    });
});
/**
 * Actualizar resultado de un partido desde el fixture.
 */
app.put('/api/championships/:id/fixture/:category/result', async (req, res) => {
    try {
        await ensureChampionshipsLoaded();
        const champId = req.params.id;
        const championship = championships.get(champId);
        if (!championship) {
            return res.status(404).json({
                success: false,
                error: "Campeonato no encontrado"
            });
        }
        const categoryName = req.params.category;
        const data = req.body || {};
        const teamA = data.team_a;
        const teamB = data.team_b;
        const roundNumber = data.round_number;
        const scoreA = data.score_a;
        const scoreB = data.score_b;
        // Validar datos
        if (!teamA || !teamB || roundNumber === undefined) {
            return res.status(400).json({
                success: false,
                error: "Datos incompletos: se requieren team_a, team_b y round_number"
            });
        }
        if (scoreA === null || scoreA === undefined || scoreB === null || scoreB === undefined) {
            return res.status(400).json({
                success: false,
                error: "Se requieren ambos marcadores (score_a y score_b)"
            });
        }
        if (scoreA < 0 || scoreB < 0) {
            return res.status(400).json({
                success: false,
                error: "Los marcadores no pueden ser negativos"
            });
        }
        if (scoreA === scoreB && scoreA > 0) {
            return res.status(400).json({
                success: false,
                error: "Los partidos no pueden terminar en empate"
            });
        }
        const success = championship.registerMatchResult(categoryName, teamA, teamB, roundNumber, scoreA, scoreB);
        if (success) {
            // Guardar automáticamente en MongoDB después de actualizar resultado
            await autoSave();
            return res.json({
                success: true,
                message: "Resultado guardado exitosamente en MongoDB"
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: "No se pudo actualizar el resultado. Verifica que el partido exista."
            });
        }
    }
    catch (error) {
        console.error('Error en PUT /api/championships/:id/fixture/:category/result:', error);
        return res.status(500).json({
            success: false,
            error: error.message || "Error interno del servidor"
        });
    }
});
/**
 * Aplicar una multa o bonificación de puntos.
 */
app.post('/api/championships/:id/penalty', async (req, res) => {
    const champId = req.params.id;
    const championship = championships.get(champId);
    if (!championship) {
        return res.status(404).json({
            success: false,
            error: "Campeonato no encontrado"
        });
    }
    const data = req.body || {};
    // Validar datos
    const validation = (0, Validation_1.validatePenalty)(data);
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            error: validation.errors.join(', ')
        });
    }
    const categoryName = data.category;
    const teamName = data.team;
    const points = parseInt(data.points);
    championship.applyPenalty(categoryName, teamName, points);
    // Guardar automáticamente después de aplicar multa
    await autoSave();
    return res.json({
        success: true,
        message: "Multa aplicada"
    });
});
/**
 * Verificar si se puede generar el cuadrangular para una categoría.
 */
app.get('/api/championships/:id/can-generate-quadrangular/:category', (req, res) => {
    const champId = req.params.id;
    const championship = championships.get(champId);
    if (!championship) {
        return res.status(404).json({
            success: false,
            error: "Campeonato no encontrado"
        });
    }
    const categoryName = req.params.category;
    const canGenerate = championship.canGenerateQuadrangular(categoryName);
    return res.json({
        success: true,
        can_generate: canGenerate
    });
});
/**
 * Generar el cuadrangular para una categoría.
 */
app.post('/api/championships/:id/generate-quadrangular/:category', async (req, res) => {
    const champId = req.params.id;
    const championship = championships.get(champId);
    if (!championship) {
        return res.status(404).json({
            success: false,
            error: "Campeonato no encontrado"
        });
    }
    const categoryName = req.params.category;
    const success = championship.generateQuadrangular(categoryName);
    if (success) {
        return res.json({
            success: true,
            message: "Cuadrangular generado exitosamente"
        });
    }
    else {
        return res.status(400).json({
            success: false,
            error: "No se pudo generar el cuadrangular. Verifica que todas las rondas estén completas y haya al menos 4 equipos."
        });
    }
});
/**
 * Generar la final del cuadrangular.
 */
app.post('/api/championships/:id/generate-final/:category', async (req, res) => {
    const champId = req.params.id;
    const championship = championships.get(champId);
    if (!championship) {
        return res.status(404).json({
            success: false,
            error: "Campeonato no encontrado"
        });
    }
    const categoryName = req.params.category;
    const success = championship.generateFinal(categoryName);
    if (success) {
        // Guardar automáticamente después de generar final
        await autoSave();
        return res.json({
            success: true,
            message: "Final generada exitosamente"
        });
    }
    else {
        return res.status(400).json({
            success: false,
            error: "No se pudo generar la final. Verifica que las semifinales estén completas."
        });
    }
});
// Manejo global de errores no capturados
app.use((err, _req, res, _next) => {
    console.error('❌ Error no capturado en Express:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: err.message || 'Error desconocido'
    });
});
// Para desarrollo local
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=api.js.map