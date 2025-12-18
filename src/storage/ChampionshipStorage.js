"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChampionshipStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Championship_1 = require("../models/Championship");
/**
 * Sistema de almacenamiento persistente para campeonatos.
 * Guarda los datos en un archivo JSON en el servidor.
 */
class ChampionshipStorage {
    /**
     * Asegura que el directorio de almacenamiento existe.
     */
    static ensureStorageDir() {
        try {
            if (!fs_1.default.existsSync(this.STORAGE_DIR)) {
                fs_1.default.mkdirSync(this.STORAGE_DIR, { recursive: true });
            }
        }
        catch (error) {
            // En Vercel o entornos sin escritura, continuar sin error
            console.warn('No se pudo crear directorio de almacenamiento (puede ser normal en serverless):', error);
        }
    }
    /**
     * Cargar todos los campeonatos desde el archivo de almacenamiento.
     */
    static load() {
        const championships = new Map();
        try {
            this.ensureStorageDir();
            if (!fs_1.default.existsSync(this.STORAGE_FILE)) {
                console.log('📁 No existe archivo de almacenamiento, iniciando con datos vacíos');
                return championships;
            }
            let fileContent;
            try {
                fileContent = fs_1.default.readFileSync(this.STORAGE_FILE, 'utf-8');
            }
            catch (readError) {
                console.warn('⚠️ No se pudo leer archivo de almacenamiento (puede ser normal en serverless):', readError.message);
                return championships;
            }
            if (!fileContent || fileContent.trim().length === 0) {
                console.log('📁 Archivo de almacenamiento vacío, iniciando con datos vacíos');
                return championships;
            }
            let data;
            try {
                data = JSON.parse(fileContent);
            }
            catch (parseError) {
                console.error('❌ Error parseando JSON de almacenamiento:', parseError);
                return championships;
            }
            for (const [id, champData] of Object.entries(data)) {
                try {
                    const championship = this.deserializeChampionship(champData);
                    championships.set(id, championship);
                }
                catch (error) {
                    console.error(`Error cargando campeonato ${id}:`, error);
                }
            }
            console.log(`✅ Cargados ${championships.size} campeonato(s) desde el almacenamiento`);
        }
        catch (error) {
            // En Vercel o entornos sin acceso al sistema de archivos, continuar sin error
            console.warn('No se pudo cargar desde almacenamiento (puede ser normal en serverless):', error.message);
        }
        return championships;
    }
    /**
     * Guardar todos los campeonatos en el archivo de almacenamiento.
     */
    static save(championships) {
        try {
            this.ensureStorageDir();
            const data = {};
            for (const [id, championship] of championships.entries()) {
                data[id] = championship.toDict();
            }
            // Escribir a un archivo temporal primero, luego renombrar (operación atómica)
            const tempFile = `${this.STORAGE_FILE}.tmp`;
            fs_1.default.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
            fs_1.default.renameSync(tempFile, this.STORAGE_FILE);
            console.log(`💾 Guardados ${championships.size} campeonato(s) en el almacenamiento`);
        }
        catch (error) {
            // En Vercel o entornos sin escritura, solo loguear el error pero no fallar
            console.warn('No se pudo guardar en almacenamiento (puede ser normal en serverless):', error.message);
            // No lanzar el error para que la aplicación continúe funcionando
        }
    }
    /**
     * Deserializar un campeonato desde datos JSON.
     */
    static deserializeChampionship(data) {
        const championship = new Championship_1.Championship(data.name || 'Campeonato', data.rounds || 1, data.points_per_win || 2, data.points_per_loss || 0);
        // Restaurar categorías
        if (data.categories) {
            for (const [catName, catData] of Object.entries(data.categories)) {
                const catDataTyped = catData;
                const teamNames = catDataTyped.teams?.map((t) => t.name || t) || [];
                championship.addCategoryWithTeams(catName, teamNames, catDataTyped.standings?.points_per_win, catDataTyped.standings?.points_per_loss);
                const category = championship.getCategory(catName);
                if (category && catDataTyped.matches) {
                    // Restaurar partidos
                    for (const matchData of catDataTyped.matches) {
                        if (matchData.played && matchData.score_a !== null && matchData.score_b !== null) {
                            category.registerMatchResult(matchData.team_a, matchData.team_b, matchData.round_number, matchData.score_a, matchData.score_b, matchData.match_type);
                        }
                        // Restaurar fecha y horario
                        const match = category.matches.find(m => m.teamA === matchData.team_a &&
                            m.teamB === matchData.team_b &&
                            m.roundNumber === matchData.round_number &&
                            m.matchType === matchData.match_type);
                        if (match && matchData.date) {
                            match.date = matchData.date;
                        }
                        if (match && matchData.time) {
                            match.time = matchData.time;
                        }
                    }
                    // Restaurar partidos del cuadrangular
                    if (catDataTyped.quadrangular_matches) {
                        for (const matchData of catDataTyped.quadrangular_matches) {
                            if (matchData.played && matchData.score_a !== null && matchData.score_b !== null) {
                                category.registerMatchResult(matchData.team_a, matchData.team_b, matchData.round_number, matchData.score_a, matchData.score_b, matchData.match_type);
                            }
                        }
                    }
                    // Restaurar penalizaciones
                    if (catDataTyped.standings?.standings) {
                        for (const teamData of catDataTyped.standings.standings) {
                            if (teamData.penalty_points && teamData.penalty_points > 0) {
                                category.applyPenalty(teamData.name, teamData.penalty_points);
                            }
                        }
                    }
                }
            }
        }
        return championship;
    }
}
exports.ChampionshipStorage = ChampionshipStorage;
_a = ChampionshipStorage;
// En Vercel, usar /tmp para escritura, en otros entornos usar data/
ChampionshipStorage.STORAGE_DIR = process.env.VERCEL
    ? '/tmp/data'
    : path_1.default.join(process.cwd(), 'data');
ChampionshipStorage.STORAGE_FILE = path_1.default.join(_a.STORAGE_DIR, 'championships.json');
//# sourceMappingURL=ChampionshipStorage.js.map