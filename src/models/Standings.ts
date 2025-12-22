import { Team } from './Team';

/**
 * Gestiona la tabla de posiciones de una categoría.
 */
export class Standings {
  category: string;
  pointsPerWin: number;
  pointsPerLoss: number;
  teams: Map<string, Team> = new Map();

  constructor(category: string, pointsPerWin: number = 2, pointsPerLoss: number = 0) {
    this.category = category;
    this.pointsPerWin = pointsPerWin;
    this.pointsPerLoss = pointsPerLoss;
  }

  /**
   * Agrega un equipo a la tabla de posiciones.
   */
  addTeam(team: Team): void {
    this.teams.set(team.name, team);
  }

  /**
   * Recalcula todas las posiciones de la tabla.
   */
  updateStandings(): void {
    for (const team of this.teams.values()) {
      team.calculatePoints(this.pointsPerWin, this.pointsPerLoss);
    }
  }

  /**
   * Obtiene la tabla de posiciones ordenada.
   * Ordena por: puntos totales, diferencia, puntos a favor, nombre.
   */
  getSortedStandings(): Team[] {
    this.updateStandings();
    const sortedTeams = Array.from(this.teams.values()).sort((a, b) => {
      // 1. Por puntos (descendente)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // 2. Por diferencia (descendente)
      const diffA = a.getDifference();
      const diffB = b.getDifference();
      if (diffB !== diffA) {
        return diffB - diffA;
      }
      // 3. Por puntos a favor (descendente)
      if (b.pf !== a.pf) {
        return b.pf - a.pf;
      }
      // 4. Por nombre (alfabético)
      return a.name.localeCompare(b.name);
    });
    return sortedTeams;
  }

  /**
   * Obtiene un equipo por su nombre.
   */
  getTeam(teamName: string): Team | undefined {
    return this.teams.get(teamName);
  }

  /**
   * Aplica una multa o bonificación de puntos a un equipo.
   */
  applyPenalty(teamName: string, points: number): void {
    const team = this.teams.get(teamName);
    if (team) {
      team.addPenalty(points);
      this.updateStandings();
    }
  }

  /**
   * Convierte la tabla de posiciones a un objeto JSON.
   */
  toDict(): Record<string, any> {
    const sortedTeams = this.getSortedStandings();
    return {
      category: this.category,
      points_per_win: this.pointsPerWin,
      points_per_loss: this.pointsPerLoss,
      standings: sortedTeams.map(team => team.toDict())
    };
  }

  toString(): string {
    return `Standings(category='${this.category}', teams=${this.teams.size})`;
  }
}




