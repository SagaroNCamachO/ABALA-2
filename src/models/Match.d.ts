/**
 * Representa un partido entre dos equipos.
 */
export declare class Match {
    teamA: string;
    teamB: string;
    roundNumber: number;
    matchType: string;
    matchday: number;
    played: boolean;
    scoreA: number | null;
    scoreB: number | null;
    winner: string | null;
    date: string | null;
    time: string | null;
    constructor(teamA: string, teamB: string, roundNumber: number, matchType?: string, matchday?: number);
    /**
     * Actualiza la fecha y horario del partido.
     */
    setSchedule(date: string, time: string): void;
    /**
     * Registra el resultado del partido.
     * Permite actualizar resultados existentes.
     */
    registerResult(scoreA: number, scoreB: number): void;
    /**
     * Limpia el resultado del partido (para permitir modificación).
     */
    clearResult(): void;
    /**
     * Convierte el partido a un objeto JSON.
     */
    toDict(): Record<string, any>;
    toString(): string;
}
//# sourceMappingURL=Match.d.ts.map