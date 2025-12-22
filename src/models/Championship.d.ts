import { Category } from './Category';
/**
 * Gestiona un campeonato completo de básquetbol.
 */
export declare class Championship {
    name: string;
    rounds: number;
    pointsPerWin: number;
    pointsPerLoss: number;
    categories: Map<string, Category>;
    constructor(name?: string, rounds?: number, pointsPerWin?: number, pointsPerLoss?: number);
    /**
     * Agrega una categoría al campeonato.
     */
    addCategory(categoryName: string, numTeams: number, pointsPerWin?: number, pointsPerLoss?: number): void;
    /**
     * Agrega una categoría con nombres de equipos específicos.
     */
    addCategoryWithTeams(categoryName: string, teamNames: string[], pointsPerWin?: number, pointsPerLoss?: number): void;
    /**
     * Obtiene una categoría por su nombre.
     */
    getCategory(categoryName: string): Category | undefined;
    /**
     * Elimina una categoría del campeonato.
     */
    removeCategory(categoryName: string): boolean;
    /**
     * Registra el resultado de un partido.
     */
    registerMatchResult(categoryName: string, teamA: string, teamB: string, roundNumber: number, scoreA: number, scoreB: number, matchType?: string): boolean;
    /**
     * Aplica una multa o bonificación de puntos a un equipo.
     */
    applyPenalty(categoryName: string, teamName: string, points: number): void;
    /**
     * Obtiene la tabla de posiciones de una categoría.
     */
    getStandings(categoryName: string): import("./Team").Team[] | null;
    /**
     * Verifica si se puede generar el cuadrangular para una categoría.
     * Requiere que todas las rondas estén completas y que haya al menos 4 equipos.
     */
    canGenerateQuadrangular(categoryName: string): boolean;
    /**
     * Genera el cuadrangular para una categoría.
     */
    generateQuadrangular(categoryName: string): boolean;
    /**
     * Genera la final del cuadrangular si las semifinales están completas.
     */
    generateFinal(categoryName: string): boolean;
    /**
     * Convierte el campeonato completo a un objeto JSON.
     */
    toDict(): Record<string, any>;
    toString(): string;
}
//# sourceMappingURL=Championship.d.ts.map