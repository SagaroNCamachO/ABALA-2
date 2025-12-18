"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamStatisticsCalculator = void 0;
/**
 * Calcula estadísticas avanzadas para un equipo.
 */
class TeamStatisticsCalculator {
    /**
     * Calcula todas las estadísticas avanzadas de un equipo.
     */
    static calculateAdvancedStats(team, allMatches, categoryName) {
        const teamMatches = allMatches.filter(m => (m.teamA === team.name || m.teamB === team.name) && m.played);
        // Calcular rachas
        const streaks = this.calculateStreaks(teamMatches, team.name);
        // Calcular promedios
        const averages = this.calculateAverages(team, teamMatches);
        // Calcular victorias/derrotas más grandes
        const extremes = this.calculateExtremes(teamMatches, team.name);
        // Calcular historial head-to-head
        const headToHead = this.calculateHeadToHead(teamMatches, team.name);
        // Calcular forma reciente
        const recentForm = this.calculateRecentForm(teamMatches, team.name);
        // Calcular record local/visitante
        const homeAway = this.calculateHomeAwayRecord(teamMatches, team.name);
        return {
            name: team.name,
            category: categoryName,
            pj: team.pj,
            pg: team.pg,
            pp: team.pp,
            pf: team.pf,
            pc: team.pc,
            points: team.points,
            difference: team.getDifference(),
            winStreak: streaks.currentWin,
            lossStreak: streaks.currentLoss,
            bestWinStreak: streaks.bestWin,
            worstLossStreak: streaks.worstLoss,
            averagePointsFor: averages.pf,
            averagePointsAgainst: averages.pc,
            averageDifference: averages.diff,
            biggestWin: extremes.biggestWin,
            biggestLoss: extremes.biggestLoss,
            headToHead: headToHead,
            recentForm: recentForm,
            homeRecord: homeAway.home,
            awayRecord: homeAway.away
        };
    }
    /**
     * Calcula las rachas de victorias y derrotas.
     */
    static calculateStreaks(matches, teamName) {
        let currentWin = 0;
        let currentLoss = 0;
        let bestWin = 0;
        let worstLoss = 0;
        let tempWin = 0;
        let tempLoss = 0;
        // Ordenar partidos por fecha (más recientes primero)
        const sortedMatches = [...matches].sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA);
        });
        for (const match of sortedMatches) {
            const won = match.winner === teamName;
            if (won) {
                tempWin++;
                tempLoss = 0;
                if (tempWin > bestWin)
                    bestWin = tempWin;
                // La racha actual es la primera que encontramos (más reciente)
                if (currentWin === 0 && currentLoss === 0) {
                    currentWin = tempWin;
                }
            }
            else if (match.winner && match.winner !== 'Empate') {
                tempLoss++;
                tempWin = 0;
                if (tempLoss > worstLoss)
                    worstLoss = tempLoss;
                // La racha actual es la primera que encontramos (más reciente)
                if (currentWin === 0 && currentLoss === 0) {
                    currentLoss = tempLoss;
                }
            }
            else {
                // Empate - resetea rachas
                tempWin = 0;
                tempLoss = 0;
            }
        }
        return { currentWin, currentLoss, bestWin, worstLoss };
    }
    /**
     * Calcula promedios de puntos.
     */
    static calculateAverages(team, matches) {
        if (matches.length === 0) {
            return { pf: 0, pc: 0, diff: 0 };
        }
        return {
            pf: Math.round((team.pf / matches.length) * 10) / 10,
            pc: Math.round((team.pc / matches.length) * 10) / 10,
            diff: Math.round((team.getDifference() / matches.length) * 10) / 10
        };
    }
    /**
     * Calcula la victoria y derrota más grandes.
     */
    static calculateExtremes(matches, teamName) {
        let biggestWin = null;
        let biggestLoss = null;
        for (const match of matches) {
            if (!match.scoreA || !match.scoreB || !match.winner)
                continue;
            const isHome = match.teamA === teamName;
            const opponent = isHome ? match.teamB : match.teamA;
            const teamScore = isHome ? match.scoreA : match.scoreB;
            const opponentScore = isHome ? match.scoreB : match.scoreA;
            const difference = teamScore - opponentScore;
            const score = `${teamScore}-${opponentScore}`;
            if (match.winner === teamName) {
                // Victoria
                if (!biggestWin || difference > biggestWin.difference) {
                    biggestWin = { opponent, score, difference };
                }
            }
            else if (match.winner !== 'Empate') {
                // Derrota
                if (!biggestLoss || difference < biggestLoss.difference) {
                    biggestLoss = { opponent, score, difference: Math.abs(difference) };
                }
            }
        }
        return { biggestWin, biggestLoss };
    }
    /**
     * Calcula el historial head-to-head contra otros equipos.
     */
    static calculateHeadToHead(matches, teamName) {
        const headToHead = {};
        for (const match of matches) {
            if (!match.played)
                continue;
            const opponent = match.teamA === teamName ? match.teamB : match.teamA;
            if (!headToHead[opponent]) {
                headToHead[opponent] = { wins: 0, losses: 0, draws: 0 };
            }
            if (match.winner === teamName) {
                headToHead[opponent].wins++;
            }
            else if (match.winner === opponent) {
                headToHead[opponent].losses++;
            }
            else {
                headToHead[opponent].draws++;
            }
        }
        return headToHead;
    }
    /**
     * Calcula la forma reciente (últimos 5 partidos).
     */
    static calculateRecentForm(matches, teamName) {
        // Ordenar por fecha (más recientes primero)
        const sortedMatches = [...matches]
            .filter(m => m.played && m.date)
            .sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA);
        })
            .slice(0, 5); // Últimos 5
        return sortedMatches.map(match => {
            if (match.winner === teamName)
                return 'W';
            if (match.winner && match.winner !== 'Empate')
                return 'L';
            return 'D'; // Draw/Empate
        });
    }
    /**
     * Calcula el record como local y visitante.
     */
    static calculateHomeAwayRecord(matches, teamName) {
        const home = { wins: 0, losses: 0 };
        const away = { wins: 0, losses: 0 };
        for (const match of matches) {
            if (!match.played)
                continue;
            const isHome = match.teamA === teamName;
            const record = isHome ? home : away;
            if (match.winner === teamName) {
                record.wins++;
            }
            else if (match.winner && match.winner !== 'Empate') {
                record.losses++;
            }
        }
        return { home, away };
    }
}
exports.TeamStatisticsCalculator = TeamStatisticsCalculator;
//# sourceMappingURL=TeamStatistics.js.map