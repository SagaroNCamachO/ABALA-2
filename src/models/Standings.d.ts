import { Team } from './Team';
/**
 * Gestiona la tabla de posiciones de una categoría.
 */
export declare class Standings {
    category: string;
    pointsPerWin: number;
    pointsPerLoss: number;
    teams: Map<string, Team>;
    constructor(category: string, pointsPerWin?: number, pointsPerLoss?: number);
    /**
     * Agrega un equipo a la tabla de posiciones.
     */
    addTeam(team: Team): void;
    /**
     * Recalcula todas las posiciones de la tabla.
     */
    updateStandings(): void;
    /**
     * Obtiene la tabla de posiciones ordenada.
     * Ordena por: puntos totales, diferencia, puntos a favor, nombre.
     */
    getSortedStandings(): Team[];
    /**
     * Obtiene un equipo por su nombre.
     */
    getTeam(teamName: string): Team | undefined;
    /**
     * Aplica una multa o bonificación de puntos a un equipo.
     */
    applyPenalty(teamName: string, points: number): void;
    /**
     * Convierte la tabla de posiciones a un objeto JSON.
     */
    toDict(): Record<string, any>;
    toString(): string;
}
//# sourceMappingURL=Standings.d.ts.map