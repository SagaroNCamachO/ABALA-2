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
            // Si no hay URI de MongoDB configurada, no hacer nada
            if (!process.env.MONGODB_URI) {
                return;
            }
            const collection = await this.getCollection();
            // Convertir a documentos
            const operations = Array.from(championships.entries()).map(([id, championship]) => ({
                updateOne: {
                    filter: { _id: id },
                    update: {
                        $set: {
                            _id: id,
                            data: championship.toDict(),
                            updatedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));
            if (operations.length > 0) {
                await collection.bulkWrite(operations);
                console.log(`💾 Guardados ${championships.size} campeonato(s) en MongoDB`);
            }
        }
        catch (error) {
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
                if (category && catDataTyped.matches) {
                    // Restaurar partidos y resultados
                    for (const matchData of catDataTyped.matches) {
                        if (matchData.played && matchData.score_a !== null && matchData.score_b !== null) {
                            category.registerMatchResult(matchData.team_a, matchData.team_b, matchData.round_number, matchData.score_a, matchData.score_b, matchData.match_type);
                        }
                        // Restaurar fecha y horario
                        const match = category.matches.find(m => m.teamA === matchData.team_a &&
                            m.teamB === matchData.team_b &&
                            m.roundNumber === matchData.round_number &&
                            m.matchType === matchData.match_type);
                        if (match) {
                            if (matchData.date)
                                match.date = matchData.date;
                            if (matchData.time)
                                match.time = matchData.time;
                        }
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