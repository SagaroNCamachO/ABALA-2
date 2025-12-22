import { Team } from './Team';
import { Match } from './Match';
import { Standings } from './Standings';
import { FixtureGenerator } from '../utils/FixtureGenerator';

/**
 * Gestiona una categoría completa del campeonato.
 */
export class Category {
  name: string;
  rounds: number;
  teams: Map<string, Team> = new Map();
  matches: Match[] = [];
  standings: Standings;
  fixtureGenerated: boolean = false;

  constructor(name: string, rounds: number, pointsPerWin: number = 2, pointsPerLoss: number = 0) {
    this.name = name;
    this.rounds = rounds;
    this.standings = new Standings(name, pointsPerWin, pointsPerLoss);
  }

  /**
   * Agrega equipos a la categoría.
   */
  addTeams(teamNames: string[]): void {
    for (const name of teamNames) {
      if (!this.teams.has(name)) {
        const team = new Team(name, this.name);
        this.teams.set(name, team);
        this.standings.addTeam(team);
      }
    }
  }

  /**
   * Genera el fixture automáticamente basado en los equipos y vueltas.
   */
  generateFixture(): void {
    if (this.teams.size < 2) {
      throw new Error("Se necesitan al menos 2 equipos para generar el fixture");
    }

    const teamNames = Array.from(this.teams.keys());
    this.matches = FixtureGenerator.generateFixture(teamNames, this.rounds);
    this.fixtureGenerated = true;
  }

  /**
   * Registra el resultado de un partido.
   */
  registerMatchResult(
    teamA: string,
    teamB: string,
    roundNumber: number,
    scoreA: number,
    scoreB: number,
    matchType?: string
  ): boolean {
    // Buscar el partido (buscar en ambos sentidos: A vs B o B vs A)
    let match: Match | undefined = undefined;
    for (const m of this.matches) {
      // Verificar que los equipos coincidan (en cualquier orden)
      const teamsMatch =
        (m.teamA === teamA && m.teamB === teamB) ||
        (m.teamA === teamB && m.teamB === teamA);

      if (teamsMatch && m.roundNumber === roundNumber) {
        if (matchType === undefined || m.matchType === matchType) {
          match = m;
          break;
        }
      }
    }

    if (match === undefined) {
      return false;
    }

    // Ajustar el orden de los puntajes según el orden del partido
    let finalScoreA: number;
    let finalScoreB: number;
    if (match.teamA === teamA) {
      // El orden coincide
      finalScoreA = scoreA;
      finalScoreB = scoreB;
    } else {
      // El orden está invertido
      finalScoreA = scoreB;
      finalScoreB = scoreA;
    }

    // Si el partido ya tenía resultado, limpiar estadísticas anteriores
    const hadPreviousResult = match.played;
    if (hadPreviousResult && match.scoreA !== null && match.scoreB !== null) {
      // Remover el resultado anterior de las estadísticas
      const prevScoreA = match.scoreA;
      const prevScoreB = match.scoreB;
      const teamAObj = this.teams.get(teamA);
      const teamBObj = this.teams.get(teamB);
      
      if (teamAObj && teamBObj) {
        // Remover el resultado anterior (invertir la operación)
        teamAObj.removeMatchResult(prevScoreA, prevScoreB, prevScoreA > prevScoreB);
        teamBObj.removeMatchResult(prevScoreB, prevScoreA, prevScoreB > prevScoreA);
      }
    }

    // Registrar resultado en el partido
    match.registerResult(finalScoreA, finalScoreB);

    // Actualizar estadísticas de los equipos
    // IMPORTANTE: Usar finalScoreA y finalScoreB (no scoreA/scoreB) porque el orden puede estar invertido
    const teamAObj = this.teams.get(match.teamA);
    const teamBObj = this.teams.get(match.teamB);

    if (!teamAObj || !teamBObj) {
      return false;
    }

    // Usar finalScoreA y finalScoreB que ya están en el orden correcto del partido
    const teamAWon = finalScoreA > finalScoreB;
    teamAObj.addMatchResult(finalScoreA, finalScoreB, teamAWon);
    teamBObj.addMatchResult(finalScoreB, finalScoreA, !teamAWon);

    // Recalcular tabla de posiciones
    this.standings.updateStandings();

    return true;
  }

  /**
   * Aplica una multa o bonificación de puntos a un equipo.
   */
  applyPenalty(teamName: string, points: number): void {
    this.standings.applyPenalty(teamName, points);
  }

  /**
   * Obtiene la tabla de posiciones ordenada.
   */
  getStandings(): Team[] {
    return this.standings.getSortedStandings();
  }

  /**
   * Obtiene los partidos de una vuelta específica.
   */
  getMatchesByRound(roundNumber: number): Match[] {
    return FixtureGenerator.getMatchesByRound(this.matches, roundNumber);
  }

  /**
   * Obtiene los partidos de un equipo específico.
   */
  getMatchesByTeam(teamName: string): Match[] {
    return FixtureGenerator.getMatchesByTeam(this.matches, teamName);
  }

  /**
   * Verifica si todas las rondas están completas (todos los partidos jugados).
   */
  isAllRoundsCompleted(): boolean {
    if (this.matches.length === 0) {
      return false;
    }
    return this.matches.every(match => match.played);
  }

  /**
   * Obtiene los 4 primeros equipos de la tabla de posiciones.
   * En caso de empate en puntos, se usa la diferencia de puntos.
   */
  getTop4Teams(): string[] {
    const standings = this.getStandings();
    
    // Ordenar por puntos (descendente) y luego por diferencia de puntos (descendente)
    const sorted = standings.sort((a, b) => {
      // Primero por puntos
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // Si hay empate, por diferencia de puntos
      return b.getDifference() - a.getDifference();
    });

    // Tomar los primeros 4
    return sorted.slice(0, 4).map(team => team.name);
  }

  /**
   * Genera el fixture del cuadrangular con los 4 primeros equipos.
   * Formato: Semifinal 1 (1° vs 4°), Semifinal 2 (2° vs 3°), Final (ganadores)
   */
  generateQuadrangular(): void {
    const top4 = this.getTop4Teams();
    
    if (top4.length < 4) {
      throw new Error("Se necesitan al menos 4 equipos para generar el cuadrangular");
    }

    // Limpiar partidos de cuadrangular anteriores si existen
    this.matches = this.matches.filter(m => !m.matchType || (m.matchType !== 'semifinal' && m.matchType !== 'final'));

    // Semifinal 1: 1° vs 4°
    const semifinal1 = new Match(top4[0], top4[3], 999, 'semifinal', 1);
    semifinal1.time = "20:00";
    this.matches.push(semifinal1);

    // Semifinal 2: 2° vs 3°
    const semifinal2 = new Match(top4[1], top4[2], 999, 'semifinal', 1);
    semifinal2.time = "21:00";
    this.matches.push(semifinal2);

    // La final se generará después de que se jueguen las semifinales
  }

  /**
   * Genera la final del cuadrangular después de que se jueguen las semifinales.
   */
  generateFinal(): void {
    const semifinals = this.matches.filter(m => m.matchType === 'semifinal' && m.played);
    
    if (semifinals.length < 2) {
      throw new Error("Las semifinales deben estar completas para generar la final");
    }

    // Obtener ganadores de las semifinales
    const winners: string[] = [];
    for (const semi of semifinals) {
      if (semi.winner && semi.winner !== "Empate") {
        winners.push(semi.winner);
      } else {
        throw new Error("Todas las semifinales deben tener un ganador");
      }
    }

    // Eliminar final anterior si existe
    this.matches = this.matches.filter(m => m.matchType !== 'final');

    // Final: ganador semifinal 1 vs ganador semifinal 2
    const final = new Match(winners[0], winners[1], 999, 'final', 2);
    final.time = "20:00";
    this.matches.push(final);
  }

  /**
   * Verifica si las semifinales están completas y puede generarse la final.
   */
  canGenerateFinal(): boolean {
    const semifinals = this.matches.filter(m => m.matchType === 'semifinal');
    return semifinals.length === 2 && semifinals.every(m => m.played && m.winner && m.winner !== "Empate");
  }

  /**
   * Convierte la categoría a un objeto JSON.
   */
  toDict(): Record<string, any> {
    return {
      name: this.name,
      rounds: this.rounds,
      teams: Array.from(this.teams.values()).map(team => team.toDict()),
      matches: this.matches.map(match => match.toDict()),
      standings: this.standings.toDict()
    };
  }

  toString(): string {
    return `Category(name='${this.name}', teams=${this.teams.size}, rounds=${this.rounds})`;
  }
}

