/**
 * Representa un equipo de básquetbol en el campeonato.
 */
export class Team {
  name: string;
  category: string;
  pj: number = 0; // Partidos jugados
  pg: number = 0; // Partidos ganados
  pp: number = 0; // Partidos perdidos
  pf: number = 0; // Puntos a favor
  pc: number = 0; // Puntos en contra
  points: number = 0; // Puntos totales en la tabla
  penaltyPoints: number = 0; // Puntos de multa/restricción

  constructor(name: string, category: string) {
    this.name = name;
    this.category = category;
  }

  /**
   * Actualiza las estadísticas del equipo después de un partido.
   */
  addMatchResult(pointsFor: number, pointsAgainst: number, won: boolean): void {
    this.pj += 1;
    this.pf += pointsFor;
    this.pc += pointsAgainst;

    if (won) {
      this.pg += 1;
    } else {
      this.pp += 1;
    }
  }

  /**
   * Calcula los puntos totales del equipo.
   */
  calculatePoints(pointsPerWin: number, pointsPerLoss: number): void {
    this.points = (this.pg * pointsPerWin) + (this.pp * pointsPerLoss) - this.penaltyPoints;
  }

  /**
   * Agrega o resta puntos de multa/restricción.
   */
  addPenalty(points: number): void {
    this.penaltyPoints += points;
  }

  /**
   * Calcula la diferencia de puntos (PF - PC).
   */
  getDifference(): number {
    return this.pf - this.pc;
  }

  /**
   * Convierte el equipo a un objeto JSON.
   */
  toDict(): Record<string, any> {
    return {
      name: this.name,
      category: this.category,
      pj: this.pj,
      pg: this.pg,
      pp: this.pp,
      pf: this.pf,
      pc: this.pc,
      difference: this.getDifference(),
      points: this.points,
      penalty_points: this.penaltyPoints
    };
  }

  toString(): string {
    return `Team(name='${this.name}', category='${this.category}', points=${this.points})`;
  }
}




