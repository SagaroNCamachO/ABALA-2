import { Match } from '../models/Match';

/**
 * Genera fixtures automáticamente para un número de equipos y vueltas.
 */
export class FixtureGenerator {
  /**
   * Genera partidos para una vuelta usando el sistema round-robin.
   */
  static generateRoundRobin(
    teams: string[],
    startRound: number,
    matchType: string = "ida"
  ): Match[] {
    if (teams.length < 2) {
      return [];
    }

    const matches: Match[] = [];
    const n = teams.length;
    const numDates = n % 2 === 0 ? n - 1 : n;

    // Si hay número impar de equipos, agregamos un "bye" temporal
    const teamsList = [...teams];
    if (n % 2 === 1) {
      teamsList.push("BYE");
    }

    // Algoritmo round-robin - cada iteración es una fecha
    // Agrupar partidos en jornadas de máximo 2 partidos
    for (let dateIdx = 0; dateIdx < numDates; dateIdx++) {
      const currentRound = startRound + dateIdx;
      const roundMatches: Match[] = [];

      for (let j = 0; j < n / 2; j++) {
        const home = teamsList[j];
        const away = teamsList[n - 1 - j];

        // Ignorar partidos con BYE
        if (home !== "BYE" && away !== "BYE") {
          let match: Match;
          if (dateIdx % 2 === 0) {
            match = new Match(home, away, currentRound, matchType);
          } else {
            // Alternar localía
            match = new Match(away, home, currentRound, matchType);
          }
          roundMatches.push(match);
        }
      }

      // Agrupar partidos en jornadas de máximo 2
      let matchday = 1;
      for (let i = 0; i < roundMatches.length; i += 2) {
        const match1 = roundMatches[i];
        const match2 = roundMatches[i + 1];
        
        match1.matchday = matchday;
        // Asignar horario por defecto: primer partido 20:00
        match1.time = "20:00";
        
        if (match2) {
          match2.matchday = matchday;
          // Asignar horario por defecto: segundo partido 21:00
          match2.time = "21:00";
        }
        
        matches.push(match1);
        if (match2) {
          matches.push(match2);
        }
        
        matchday++;
      }

      // Rotar equipos (excepto el primero)
      if (dateIdx < numDates - 1) {
        teamsList.splice(1, 0, teamsList.pop()!);
      }
    }

    return matches;
  }

  /**
   * Genera el fixture completo (ida y vuelta) para todas las vueltas.
   */
  static generateFixture(teams: string[], rounds: number): Match[] {
    const allMatches: Match[] = [];
    const n = teams.length;
    // Número de fechas necesarias para que todos jueguen contra todos (una vez)
    const totalRoundsPerCycle = n % 2 === 0 ? n - 1 : n;
    let currentRound = 1;

    for (let cycle = 0; cycle < rounds; cycle++) {
      // Generar partidos de ida
      const idaMatches = FixtureGenerator.generateRoundRobin(
        teams,
        currentRound,
        "ida"
      );
      allMatches.push(...idaMatches);
      currentRound += totalRoundsPerCycle;

      // Generar partidos de vuelta (si hay más de una vuelta o se requiere)
      if (rounds > 1 || cycle === 0) {
        const vueltaMatches = FixtureGenerator.generateRoundRobin(
          teams,
          currentRound,
          "vuelta"
        );
        // Invertir localía en vuelta
        for (const match of vueltaMatches) {
          [match.teamA, match.teamB] = [match.teamB, match.teamA];
        }
        allMatches.push(...vueltaMatches);
        currentRound += totalRoundsPerCycle;
      }
    }

    return allMatches;
  }

  /**
   * Filtra partidos por número de vuelta.
   */
  static getMatchesByRound(matches: Match[], roundNumber: number): Match[] {
    return matches.filter(m => m.roundNumber === roundNumber);
  }

  /**
   * Filtra partidos de un equipo específico.
   */
  static getMatchesByTeam(matches: Match[], teamName: string): Match[] {
    return matches.filter(
      m => m.teamA === teamName || m.teamB === teamName
    );
  }
}

