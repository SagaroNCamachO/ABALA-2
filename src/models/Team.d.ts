/**
 * Representa un equipo de básquetbol en el campeonato.
 */
export declare class Team {
    name: string;
    category: string;
    pj: number;
    pg: number;
    pp: number;
    pf: number;
    pc: number;
    points: number;
    penaltyPoints: number;
    constructor(name: string, category: string);
    /**
     * Actualiza las estadísticas del equipo después de un partido.
     */
    addMatchResult(pointsFor: number, pointsAgainst: number, won: boolean): void;
    /**
     * Remueve un resultado de partido de las estadísticas (para permitir modificación).
     */
    removeMatchResult(pointsFor: number, pointsAgainst: number, won: boolean): void;
    /**
     * Calcula los puntos totales del equipo.
     */
    calculatePoints(pointsPerWin: number, pointsPerLoss: number): void;
    /**
     * Agrega o resta puntos de multa/restricción.
     */
    addPenalty(points: number): void;
    /**
     * Calcula la diferencia de puntos (PF - PC).
     */
    getDifference(): number;
    /**
     * Convierte el equipo a un objeto JSON.
     */
    toDict(): Record<string, any>;
    toString(): string;
}
//# sourceMappingURL=Team.d.ts.map