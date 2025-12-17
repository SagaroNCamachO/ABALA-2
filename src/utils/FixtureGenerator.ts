import { Match } from '../models/Match';

/**
 * Genera fixtures automáticamente para un número de equipos y vueltas.
 */
export class FixtureGenerator {
  /**
   * Genera todos los enfrentamientos únicos entre equipos (sin duplicados).
   * Cada equipo juega una vez contra todos los demás.
   */
  static generateUniqueMatchups(teams: string[]): Array<[string, string]> {
    const matchups: Array<[string, string]> = [];
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchups.push([teams[i], teams[j]]);
      }
    }
    
    return matchups;
  }

  /**
   * Genera partidos para una vuelta usando el sistema round-robin.
   * Garantiza que todos los equipos jueguen una vez contra todos los demás.
   */
  static generateRoundRobin(
    teams: string[],
    startRound: number,
    matchType: string = "ida"
  ): Match[] {
    if (teams.length < 2) {
      return [];
    }

    // Generar todos los enfrentamientos únicos
    const uniqueMatchups = FixtureGenerator.generateUniqueMatchups(teams);
    
    // Mezclar los enfrentamientos para distribución aleatoria
    const shuffled = [...uniqueMatchups];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Agrupar en jornadas de máximo 2 partidos
    const matches: Match[] = [];
    let matchday = 1;
    let roundNumber = startRound;

    for (let i = 0; i < shuffled.length; i += 2) {
      const matchup1 = shuffled[i];
      const matchup2 = shuffled[i + 1];

      // Crear primer partido de la jornada
      const match1 = new Match(matchup1[0], matchup1[1], roundNumber, matchType, matchday);
      match1.time = "20:00";
      matches.push(match1);

      // Crear segundo partido de la jornada (si existe)
      if (matchup2) {
        const match2 = new Match(matchup2[0], matchup2[1], roundNumber, matchType, matchday);
        match2.time = "21:00";
        matches.push(match2);
      }

      matchday++;
      // Incrementar roundNumber cada 2 partidos (cada jornada)
      if ((i + 2) % 2 === 0) {
        roundNumber++;
      }
    }

    return matches;
  }

  /**
   * Agrupa enfrentamientos en jornadas asegurando que ningún equipo se repita en la misma jornada.
   * Cada jornada tiene máximo 2 partidos.
   */
  static groupMatchupsIntoMatchdays(matchups: Array<[string, string]>): Array<Array<[string, string]>> {
    const matchdays: Array<Array<[string, string]>> = [];
    const used = new Set<number>();
    
    // Mezclar los enfrentamientos para distribución aleatoria
    const shuffled = [...matchups];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Agrupar enfrentamientos en jornadas
    for (let i = 0; i < shuffled.length; i++) {
      if (used.has(i)) continue;
      
      const currentMatchday: Array<[string, string]> = [shuffled[i]];
      used.add(i);
      const teamsInMatchday = new Set([shuffled[i][0], shuffled[i][1]]);
      
      // Buscar un segundo enfrentamiento que no tenga equipos repetidos
      for (let j = i + 1; j < shuffled.length && currentMatchday.length < 2; j++) {
        if (used.has(j)) continue;
        
        const [teamA, teamB] = shuffled[j];
        // Verificar que ninguno de los equipos ya esté en la jornada
        if (!teamsInMatchday.has(teamA) && !teamsInMatchday.has(teamB)) {
          currentMatchday.push(shuffled[j]);
          used.add(j);
          teamsInMatchday.add(teamA);
          teamsInMatchday.add(teamB);
        }
      }
      
      matchdays.push(currentMatchday);
    }
    
    return matchdays;
  }

  /**
   * Genera el fixture completo (ida y vuelta) para todas las vueltas.
   * Garantiza que:
   * - En ida: todos juegan una vez contra todos (sin repetir)
   * - En vuelta: mismos enfrentamientos pero con localía invertida
   * - Ningún equipo se repite en la misma jornada
   */
  static generateFixture(teams: string[], rounds: number): Match[] {
    const allMatches: Match[] = [];

    // Generar todos los enfrentamientos únicos una sola vez
    const uniqueMatchups = FixtureGenerator.generateUniqueMatchups(teams);
    
    // Agrupar enfrentamientos en jornadas (sin repetir equipos en la misma jornada)
    const matchdays = FixtureGenerator.groupMatchupsIntoMatchdays(uniqueMatchups);

    // Generar partidos de ida
    let matchday = 1;
    let roundNumber = 1;
    const idaMatches: Match[] = [];

    for (const matchdayMatchups of matchdays) {
      // Primer partido de la jornada (ida)
      const matchup1 = matchdayMatchups[0];
      const match1 = new Match(matchup1[0], matchup1[1], roundNumber, "ida", matchday);
      match1.time = "20:00";
      idaMatches.push(match1);

      // Segundo partido de la jornada (ida) - si existe
      if (matchdayMatchups.length > 1) {
        const matchup2 = matchdayMatchups[1];
        const match2 = new Match(matchup2[0], matchup2[1], roundNumber, "ida", matchday);
        match2.time = "21:00";
        idaMatches.push(match2);
      }

      matchday++;
      roundNumber++;
    }

    allMatches.push(...idaMatches);

    // Generar partidos de vuelta (invertir localía)
    if (rounds > 1) {
      matchday = 1;
      roundNumber = 1;
      const vueltaMatches: Match[] = [];

      for (const matchdayMatchups of matchdays) {
        // Primer partido de la jornada (vuelta) - INVERTIR localía
        const matchup1 = matchdayMatchups[0];
        const match1 = new Match(matchup1[1], matchup1[0], roundNumber, "vuelta", matchday);
        match1.time = "20:00";
        vueltaMatches.push(match1);

        // Segundo partido de la jornada (vuelta) - INVERTIR localía
        if (matchdayMatchups.length > 1) {
          const matchup2 = matchdayMatchups[1];
          const match2 = new Match(matchup2[1], matchup2[0], roundNumber, "vuelta", matchday);
          match2.time = "21:00";
          vueltaMatches.push(match2);
        }

        matchday++;
        roundNumber++;
      }

      allMatches.push(...vueltaMatches);
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

