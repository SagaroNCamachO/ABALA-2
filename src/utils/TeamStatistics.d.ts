import { Team } from '../models/Team';
import { Match } from '../models/Match';
/**
 * Estadísticas avanzadas de un equipo.
 */
export interface AdvancedTeamStats {
    name: string;
    category: string;
    pj: number;
    pg: number;
    pp: number;
    pf: number;
    pc: number;
    points: number;
    difference: number;
    winStreak: number;
    lossStreak: number;
    bestWinStreak: number;
    worstLossStreak: number;
    averagePointsFor: number;
    averagePointsAgainst: number;
    averageDifference: number;
    biggestWin: {
        opponent: string;
        score: string;
        difference: number;
    } | null;
    biggestLoss: {
        opponent: string;
        score: string;
        difference: number;
    } | null;
    headToHead: Record<string, {
        wins: number;
        losses: number;
        draws: number;
    }>;
    recentForm: string[];
    homeRecord: {
        wins: number;
        losses: number;
    };
    awayRecord: {
        wins: number;
        losses: number;
    };
}
/**
 * Calcula estadísticas avanzadas para un equipo.
 */
export declare class TeamStatisticsCalculator {
    /**
     * Calcula todas las estadísticas avanzadas de un equipo.
     */
    static calculateAdvancedStats(team: Team, allMatches: Match[], categoryName: string): AdvancedTeamStats;
    /**
     * Calcula las rachas de victorias y derrotas.
     */
    private static calculateStreaks;
    /**
     * Calcula promedios de puntos.
     */
    private static calculateAverages;
    /**
     * Calcula la victoria y derrota más grandes.
     */
    private static calculateExtremes;
    /**
     * Calcula el historial head-to-head contra otros equipos.
     */
    private static calculateHeadToHead;
    /**
     * Calcula la forma reciente (últimos 5 partidos).
     */
    private static calculateRecentForm;
    /**
     * Calcula el record como local y visitante.
     */
    private static calculateHomeAwayRecord;
}
//# sourceMappingURL=TeamStatistics.d.ts.map