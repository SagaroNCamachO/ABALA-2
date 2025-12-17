/**
 * Representa un partido entre dos equipos.
 */
export class Match {
  teamA: string;
  teamB: string;
  roundNumber: number;
  matchType: string; // 'ida' o 'vuelta'
  matchday: number; // Jornada dentro de la vuelta (máximo 2 partidos por jornada)
  played: boolean = false;
  scoreA: number | null = null;
  scoreB: number | null = null;
  winner: string | null = null;
  date: string | null = null; // Fecha del partido (YYYY-MM-DD)
  time: string | null = null; // Horario del partido (HH:MM)

  constructor(teamA: string, teamB: string, roundNumber: number, matchType: string = "ida", matchday: number = 1) {
    this.teamA = teamA;
    this.teamB = teamB;
    this.roundNumber = roundNumber;
    this.matchType = matchType;
    this.matchday = matchday;
  }
  
  /**
   * Actualiza la fecha y horario del partido.
   */
  setSchedule(date: string, time: string): void {
    this.date = date;
    this.time = time;
  }

  /**
   * Registra el resultado del partido.
   */
  registerResult(scoreA: number, scoreB: number): void {
    this.scoreA = scoreA;
    this.scoreB = scoreB;
    this.played = true;

    if (scoreA > scoreB) {
      this.winner = this.teamA;
    } else if (scoreB > scoreA) {
      this.winner = this.teamB;
    } else {
      this.winner = "Empate";
    }
  }

  /**
   * Convierte el partido a un objeto JSON.
   */
  toDict(): Record<string, any> {
    return {
      team_a: this.teamA,
      team_b: this.teamB,
      round_number: this.roundNumber,
      match_type: this.matchType,
      matchday: this.matchday,
      played: this.played,
      score_a: this.scoreA,
      score_b: this.scoreB,
      winner: this.winner,
      date: this.date,
      time: this.time
    };
  }

  toString(): string {
    if (this.played && this.scoreA !== null && this.scoreB !== null) {
      return `Match(${this.teamA} ${this.scoreA} - ${this.scoreB} ${this.teamB})`;
    }
    return `Match(${this.teamA} vs ${this.teamB}, Round ${this.roundNumber}, ${this.matchType})`;
  }
}

