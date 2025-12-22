"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBStorage = void 0;
const mongodb_1 = require("mongodb");
const Championship_1 = require("../models/Championship");
/**
 * Sistema de almacenamiento usando MongoDB.
 * Compatible con MongoDB Atlas (gratis) y MongoDB local.
 */
class MongoDBStorage {
    /**
     * Conectar a MongoDB.
     */
    static async connect() {
        if (this.db) {
            return this.db;
        }
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        try {
            this.client = new mongodb_1.MongoClient(mongoUri);
            await this.client.connect();
            this.db = this.client.db(this.DB_NAME);
            console.log('✅ Conectado a MongoDB');
            return this.db;
        }
        catch (error) {
            console.error('❌ Error conectando a MongoDB:', error);
            throw error;
        }
    }
    /**
     * Obtener la colección de campeonatos.
     */
    static async getCollection() {
        const db = await this.connect();
        return db.collection(this.COLLECTION_NAME);
    }
    /**
     * Cargar todos los campeonatos desde MongoDB.
     */
    static async load() {
        const championships = new Map();
        try {
            // Si no hay URI de MongoDB configurada, retornar vacío
            if (!process.env.MONGODB_URI) {
                console.log('⚠️ MONGODB_URI no configurada, usando almacenamiento local');
                return championships;
            }
            const collection = await this.getCollection();
            const docs = await collection.find({}).toArray();
            for (const doc of docs) {
                try {
                    const championship = this.deserializeChampionship(doc.data);
                    const id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
                    championships.set(id, championship);
                }
                catch (error) {
                    const id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
                    console.error(`Error cargando campeonato ${id}:`, error);
                }
            }
            console.log(`✅ Cargados ${championships.size} campeonato(s) desde MongoDB`);
        }
        catch (error) {
            console.warn('⚠️ Error cargando desde MongoDB (usando fallback local):', error.message);
        }
        return championships;
    }
    /**
     * Guardar todos los campeonatos en MongoDB.
     */
    static async save(championships) {
        try {
            // #region agent log
            try {
                fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:save', message: 'Before save - checking MongoDB URI', data: { hasMongoDBUri: !!process.env.MONGODB_URI, championshipsCount: championships.size }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
            }
            catch (e) { }
            // #endregion
            // Si no hay URI de MongoDB configurada, no hacer nada
            if (!process.env.MONGODB_URI) {
                // #region agent log
                try {
                    fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:save', message: 'No MongoDB URI - skipping save', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
                }
                catch (e) { }
                // #endregion
                return;
            }
            const collection = await this.getCollection();
            // Convertir a documentos y verificar que los resultados estén incluidos
            const operations = Array.from(championships.entries()).map(([id, championship]) => {
                const champDict = championship.toDict();
                // #region agent log
                try {
                    // Contar partidos jugados en todas las categorías
                    let totalMatches = 0;
                    let playedMatches = 0;
                    for (const [, catData] of Object.entries(champDict.categories || {})) {
                        const matches = catData.matches || [];
                        totalMatches += matches.length;
                        playedMatches += matches.filter((m) => m.played).length;
                    }
                    fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:save', message: 'Championship serialization', data: { champId: id, totalMatches, playedMatches, categoriesCount: Object.keys(champDict.categories || {}).length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
                }
                catch (e) { }
                // #endregion
                return {
                    updateOne: {
                        filter: { _id: id },
                        update: {
                            $set: {
                                _id: id,
                                data: champDict,
                                updatedAt: new Date()
                            }
                        },
                        upsert: true
                    }
                };
            });
            if (operations.length > 0) {
                await collection.bulkWrite(operations);
                console.log(`💾 Guardados ${championships.size} campeonato(s) en MongoDB`);
                // #region agent log
                try {
                    fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:save', message: 'After bulkWrite - save completed', data: { operationsCount: operations.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
                }
                catch (e) { }
                // #endregion
            }
        }
        catch (error) {
            // #region agent log
            try {
                fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:save', message: 'Error saving to MongoDB', data: { error: error?.message || String(error), stack: error?.stack }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
            }
            catch (e) { }
            // #endregion
            console.error('❌ Error guardando en MongoDB:', error);
            throw error;
        }
    }
    /**
     * Deserializar un campeonato desde datos MongoDB.
     */
    static deserializeChampionship(data) {
        const championship = new Championship_1.Championship(data.name || 'Campeonato', data.rounds || 1, data.points_per_win || 2, data.points_per_loss || 0);
        // Restaurar categorías (similar a ChampionshipStorage)
        if (data.categories) {
            for (const [catName, catData] of Object.entries(data.categories)) {
                const catDataTyped = catData;
                const teamNames = catDataTyped.teams?.map((t) => t.name || t) || [];
                championship.addCategoryWithTeams(catName, teamNames, catDataTyped.standings?.points_per_win, catDataTyped.standings?.points_per_loss);
                const category = championship.getCategory(catName);
                if (category) {
                    // Asegurar que el fixture esté generado ANTES de restaurar resultados
                    // Esto es crítico porque los partidos deben existir antes de restaurar resultados
                    if (!category.fixtureGenerated || category.matches.length === 0) {
                        try {
                            category.generateFixture();
                            console.log(`✅ Fixture generado para categoría ${catName} (${category.matches.length} partidos)`);
                        }
                        catch (error) {
                            console.error(`❌ Error generando fixture para ${catName}:`, error);
                        }
                    }
                    // Ahora restaurar partidos y resultados
                    if (catDataTyped.matches && catDataTyped.matches.length > 0) {
                        // #region agent log
                        try {
                            const playedCount = catDataTyped.matches.filter((m) => m.played).length;
                            fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:deserialize', message: 'Before restoring matches', data: { categoryName: catName, totalMatches: catDataTyped.matches.length, playedMatches: playedCount }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
                        }
                        catch (e) { }
                        // #endregion
                        // Restaurar partidos y resultados
                        for (const matchData of catDataTyped.matches) {
                            // Buscar el partido (buscar en ambos sentidos: A vs B o B vs A)
                            // También considerar matchday si está disponible
                            let match = category.matches.find(m => {
                                const teamsMatch = (m.teamA === matchData.team_a && m.teamB === matchData.team_b) ||
                                    (m.teamA === matchData.team_b && m.teamB === matchData.team_a);
                                const roundMatch = m.roundNumber === matchData.round_number;
                                const typeMatch = matchData.match_type === undefined || m.matchType === matchData.match_type;
                                const matchdayMatch = matchData.matchday === undefined || m.matchday === matchData.matchday;
                                return teamsMatch && roundMatch && typeMatch && matchdayMatch;
                            });
                            if (match) {
                                // #region agent log
                                try {
                                    fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:deserialize', message: 'Match found - restoring', data: { categoryName: catName, teamA: matchData.team_a, teamB: matchData.team_b, roundNumber: matchData.round_number, played: matchData.played, scoreA: matchData.score_a, scoreB: matchData.score_b }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
                                }
                                catch (e) { }
                                // #endregion
                                // Restaurar fecha y horario primero
                                if (matchData.date)
                                    match.date = matchData.date;
                                if (matchData.time)
                                    match.time = matchData.time;
                                // Restaurar resultado si existe
                                if (matchData.played && matchData.score_a !== null && matchData.score_b !== null) {
                                    // Ajustar el orden de los puntajes según el orden del partido
                                    let finalScoreA;
                                    let finalScoreB;
                                    if (match.teamA === matchData.team_a) {
                                        // El orden coincide
                                        finalScoreA = matchData.score_a;
                                        finalScoreB = matchData.score_b;
                                    }
                                    else {
                                        // El orden está invertido
                                        finalScoreA = matchData.score_b;
                                        finalScoreB = matchData.score_a;
                                    }
                                    // Registrar resultado directamente en el partido
                                    match.registerResult(finalScoreA, finalScoreB);
                                    // #region agent log
                                    try {
                                        fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'MongoDBStorage.ts:deserialize', message: 'After registerResult', data: { categoryName: catName, teamA: match.teamA, teamB: match.teamB, scoreA: match.scoreA, scoreB: match.scoreB, played: match.played, winner: match.winner }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
                                    }
                                    catch (e) { }
                                    // #endregion
                                    // Actualizar estadísticas de los equipos
                                    const teamAObj = category.teams.get(match.teamA);
                                    const teamBObj = category.teams.get(match.teamB);
                                    if (teamAObj && teamBObj) {
                                        // Calcular si ganó el equipo A
                                        const teamAWon = finalScoreA > finalScoreB;
                                        teamAObj.addMatchResult(finalScoreA, finalScoreB, teamAWon);
                                        teamBObj.addMatchResult(finalScoreB, finalScoreA, !teamAWon);
                                    }
                                }
                            }
                            else {
                                console.warn(`⚠️ Partido no encontrado al restaurar: ${matchData.team_a} vs ${matchData.team_b}, Round ${matchData.round_number}, Type ${matchData.match_type || 'N/A'}, Matchday ${matchData.matchday || 'N/A'}`);
                                console.warn(`   Partidos disponibles en categoría: ${category.matches.length}`);
                                if (category.matches.length > 0) {
                                    console.warn(`   Primer partido: ${category.matches[0].teamA} vs ${category.matches[0].teamB}, Round ${category.matches[0].roundNumber}, Type ${category.matches[0].matchType}`);
                                }
                            }
                        }
                        // Recalcular tabla de posiciones después de restaurar todos los resultados
                        category.standings.updateStandings();
                        console.log(`✅ Restaurados resultados para categoría ${catName}: ${category.matches.filter(m => m.played).length} partidos jugados`);
                    }
                    // Restaurar penalizaciones
                    if (catDataTyped.standings?.standings) {
                        for (const teamData of catDataTyped.standings.standings) {
                            if (teamData.penalty_points && teamData.penalty_points > 0) {
                                const team = category.teams.get(teamData.name);
                                if (team) {
                                    team.addPenalty(teamData.penalty_points);
                                }
                            }
                        }
                        category.standings.updateStandings();
                    }
                }
            }
        }
        return championship;
    }
    /**
     * Cerrar la conexión a MongoDB.
     */
    static async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            console.log('🔌 Desconectado de MongoDB');
        }
    }
}
exports.MongoDBStorage = MongoDBStorage;
MongoDBStorage.client = null;
MongoDBStorage.db = null;
MongoDBStorage.DB_NAME = 'abala_championships';
MongoDBStorage.COLLECTION_NAME = 'championships';
//# sourceMappingURL=MongoDBStorage.js.map