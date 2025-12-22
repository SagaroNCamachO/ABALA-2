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
   * Reorganiza los partidos para evitar que equipos jueguen en jornadas consecutivas.
   * PRIORIZA tener 2 partidos por jornada siempre que sea posible.
   */
  private static avoidConsecutiveRounds(
    matchups: Array<[string, string]>,
    matchType: string,
    startRound: number
  ): Match[] {
    const matches: Match[] = [];
    const assignedRounds = new Map<string, number>(); // Equipo -> última jornada asignada
    const availableMatchups = [...matchups];
    let currentRound = startRound;
    let matchday = 1;

    // Inicializar última jornada de cada equipo
    const allTeams = new Set<string>();
    matchups.forEach(([a, b]) => {
      allTeams.add(a);
      allTeams.add(b);
    });
    allTeams.forEach(team => assignedRounds.set(team, 0));

    while (availableMatchups.length > 0) {
      const currentMatchday: Match[] = [];
      const teamsInCurrentMatchday = new Set<string>();

      // PRIORIDAD 1: Intentar llenar la jornada con 2 partidos
      // Buscar el primer partido que no viole restricciones
      for (let i = 0; i < availableMatchups.length && currentMatchday.length < 2; i++) {
        const [teamA, teamB] = availableMatchups[i];
        
        // Verificar que los equipos no estén ya en esta jornada
        if (teamsInCurrentMatchday.has(teamA) || teamsInCurrentMatchday.has(teamB)) {
          continue;
        }

        const lastRoundA = assignedRounds.get(teamA) || 0;
        const lastRoundB = assignedRounds.get(teamB) || 0;

        // Verificar que ninguno jugó en la jornada anterior (consecutiva)
        const canPlayA = lastRoundA === 0 || lastRoundA < currentRound - 1;
        const canPlayB = lastRoundB === 0 || lastRoundB < currentRound - 1;

        if (canPlayA && canPlayB) {
          // Este enfrentamiento puede asignarse
          const match = new Match(teamA, teamB, currentRound, matchType, matchday);
          match.time = currentMatchday.length === 0 ? "20:00" : "21:00";
          currentMatchday.push(match);
          teamsInCurrentMatchday.add(teamA);
          teamsInCurrentMatchday.add(teamB);
          availableMatchups.splice(i, 1);
          assignedRounds.set(teamA, currentRound);
          assignedRounds.set(teamB, currentRound);
          i--; // Ajustar índice después de eliminar

          // Si ya tenemos 2 partidos, pasar a la siguiente jornada
          if (currentMatchday.length >= 2) {
            break;
          }
        }
      }

      // Si no encontramos 2 partidos, intentar encontrar al menos 1
      // pero solo si aún no hay ninguno en la jornada
      if (currentMatchday.length === 0 && availableMatchups.length > 0) {
        // Buscar cualquier partido que no viole la restricción de jornadas consecutivas
        for (let i = 0; i < availableMatchups.length; i++) {
          const [teamA, teamB] = availableMatchups[i];
          const lastRoundA = assignedRounds.get(teamA) || 0;
          const lastRoundB = assignedRounds.get(teamB) || 0;

          const canPlayA = lastRoundA === 0 || lastRoundA < currentRound - 1;
          const canPlayB = lastRoundB === 0 || lastRoundB < currentRound - 1;

          if (canPlayA && canPlayB) {
            const match = new Match(teamA, teamB, currentRound, matchType, matchday);
            match.time = "20:00";
            currentMatchday.push(match);
            availableMatchups.splice(i, 1);
            assignedRounds.set(teamA, currentRound);
            assignedRounds.set(teamB, currentRound);
            break;
          }
        }
      }

      // Si aún no hay partidos, forzar asignación del primero disponible
      // (esto solo debería pasar en casos extremos)
      if (currentMatchday.length === 0 && availableMatchups.length > 0) {
        const [teamA, teamB] = availableMatchups[0];
        const match = new Match(teamA, teamB, currentRound, matchType, matchday);
        match.time = "20:00";
        currentMatchday.push(match);
        availableMatchups.splice(0, 1);
        assignedRounds.set(teamA, currentRound);
        assignedRounds.set(teamB, currentRound);
      }

      // Si tenemos partidos en la jornada, agregarlos y avanzar
      if (currentMatchday.length > 0) {
        matches.push(...currentMatchday);
        matchday++;
        currentRound++;
      } else {
        // Si no se pudo asignar nada (caso extremo), avanzar de todas formas
        currentRound++;
      }
    }

    return matches;
  }

  /**
   * Genera el fixture completo (ida y vuelta) para todas las vueltas.
   * Garantiza que:
   * - En ida: todos juegan una vez contra todos (sin repetir)
   * - En vuelta: mismos enfrentamientos pero con localía invertida
   * - Ningún equipo se repite en la misma jornada
   * - Ningún equipo juega en jornadas consecutivas (evita cansancio)
   */
  static generateFixture(teams: string[], rounds: number): Match[] {
    const allMatches: Match[] = [];

    // Generar todos los enfrentamientos únicos una sola vez
    const uniqueMatchups = FixtureGenerator.generateUniqueMatchups(teams);
    
    // Mezclar los enfrentamientos para distribución aleatoria
    const shuffled = [...uniqueMatchups];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Generar partidos de ida evitando jornadas consecutivas
    const idaMatchups = [...shuffled];
    const idaMatches = FixtureGenerator.avoidConsecutiveRounds(idaMatchups, "ida", 1);
    allMatches.push(...idaMatches);

    // Generar partidos de vuelta (invertir localía) evitando jornadas consecutivas
    if (rounds > 1) {
      // Invertir localía para vuelta
      const vueltaMatchups: Array<[string, string]> = shuffled.map(([a, b]) => [b, a]);
      const vueltaMatches = FixtureGenerator.avoidConsecutiveRounds(vueltaMatchups, "vuelta", 1);
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

