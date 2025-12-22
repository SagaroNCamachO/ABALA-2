import { Team } from './Team';
import { Match } from './Match';
import { Standings } from './Standings';
/**
 * Gestiona una categoría completa del campeonato.
 */
export declare class Category {
    name: string;
    rounds: number;
    teams: Map<string, Team>;
    matches: Match[];
    standings: Standings;
    fixtureGenerated: boolean;
    constructor(name: string, rounds: number, pointsPerWin?: number, pointsPerLoss?: number);
    /**
     * Agrega equipos a la categoría.
     */
    addTeams(teamNames: string[]): void;
    /**
     * Genera el fixture automáticamente basado en los equipos y vueltas.
     */
    generateFixture(): void;
    /**
     * Registra el resultado de un partido.
     */
    registerMatchResult(teamA: string, teamB: string, roundNumber: number, scoreA: number, scoreB: number, matchType?: string): boolean;
    /**
     * Aplica una multa o bonificación de puntos a un equipo.
     */
    applyPenalty(teamName: string, points: number): void;
    /**
     * Obtiene la tabla de posiciones ordenada.
     */
    getStandings(): Team[];
    /**
     * Obtiene los partidos de una vuelta específica.
     */
    getMatchesByRound(roundNumber: number): Match[];
    /**
     * Obtiene los partidos de un equipo específico.
     */
    getMatchesByTeam(teamName: string): Match[];
    /**
     * Verifica si todas las rondas están completas (todos los partidos jugados).
     */
    isAllRoundsCompleted(): boolean;
    /**
     * Obtiene los 4 primeros equipos de la tabla de posiciones.
     * En caso de empate en puntos, se usa la diferencia de puntos.
     */
    getTop4Teams(): string[];
    /**
     * Genera el fixture del cuadrangular con los 4 primeros equipos.
     * Formato: Semifinal 1 (1° vs 4°), Semifinal 2 (2° vs 3°), Final (ganadores)
     */
    generateQuadrangular(): void;
    /**
     * Genera la final del cuadrangular después de que se jueguen las semifinales.
     */
    generateFinal(): void;
    /**
     * Verifica si las semifinales están completas y puede generarse la final.
     */
    canGenerateFinal(): boolean;
    /**
     * Convierte la categoría a un objeto JSON.
     */
    toDict(): Record<string, any>;
    toString(): string;
}
//# sourceMappingURL=Category.d.ts.map