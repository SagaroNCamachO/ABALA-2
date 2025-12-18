import { Match } from '../models/Match';
/**
 * Genera fixtures automáticamente para un número de equipos y vueltas.
 */
export declare class FixtureGenerator {
    /**
     * Genera todos los enfrentamientos únicos entre equipos (sin duplicados).
     * Cada equipo juega una vez contra todos los demás.
     */
    static generateUniqueMatchups(teams: string[]): Array<[string, string]>;
    /**
     * Genera partidos para una vuelta usando el sistema round-robin.
     * Garantiza que todos los equipos jueguen una vez contra todos los demás.
     */
    static generateRoundRobin(teams: string[], startRound: number, matchType?: string): Match[];
    /**
     * Agrupa enfrentamientos en jornadas asegurando que ningún equipo se repita en la misma jornada.
     * Cada jornada tiene máximo 2 partidos.
     */
    static groupMatchupsIntoMatchdays(matchups: Array<[string, string]>): Array<Array<[string, string]>>;
    /**
     * Genera el fixture completo (ida y vuelta) para todas las vueltas.
     * Garantiza que:
     * - En ida: todos juegan una vez contra todos (sin repetir)
     * - En vuelta: mismos enfrentamientos pero con localía invertida
     * - Ningún equipo se repite en la misma jornada
     */
    static generateFixture(teams: string[], rounds: number): Match[];
    /**
     * Filtra partidos por número de vuelta.
     */
    static getMatchesByRound(matches: Match[], roundNumber: number): Match[];
    /**
     * Filtra partidos de un equipo específico.
     */
    static getMatchesByTeam(matches: Match[], teamName: string): Match[];
}
//# sourceMappingURL=FixtureGenerator.d.ts.map