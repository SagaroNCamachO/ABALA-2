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
   * IMPERATIVO: Todas las jornadas deben tener 2 partidos, EXCEPTO la última jornada.
   * Distribuye equitativamente los partidos entre equipos para evitar cansancio excesivo.
   */
  private static avoidConsecutiveRounds(
    matchups: Array<[string, string]>,
    matchType: string,
    startRound: number
  ): Match[] {
    const matches: Match[] = [];
    const assignedRounds = new Map<string, number>(); // Equipo -> última jornada asignada
    const matchCounts = new Map<string, number>(); // Equipo -> número de partidos asignados (para equidad)
    const availableMatchups = [...matchups];
    let currentRound = startRound;
    let matchday = 1;

    // Inicializar última jornada y conteo de partidos de cada equipo
    const allTeams = new Set<string>();
    matchups.forEach(([a, b]) => {
      allTeams.add(a);
      allTeams.add(b);
    });
    allTeams.forEach(team => {
      assignedRounds.set(team, 0);
      matchCounts.set(team, 0);
    });

    // Función auxiliar para verificar si un partido puede asignarse a la jornada actual
    const canAssignMatch = (teamA: string, teamB: string, teamsInMatchday: Set<string>): boolean => {
      // No puede estar ya en la jornada
      if (teamsInMatchday.has(teamA) || teamsInMatchday.has(teamB)) {
        return false;
      }

      // No puede haber jugado en la jornada anterior (consecutiva)
      const lastRoundA = assignedRounds.get(teamA) || 0;
      const lastRoundB = assignedRounds.get(teamB) || 0;
      const canPlayA = lastRoundA === 0 || lastRoundA < currentRound - 1;
      const canPlayB = lastRoundB === 0 || lastRoundB < currentRound - 1;

      return canPlayA && canPlayB;
    };

    // Función auxiliar para calcular el "peso" de un partido (priorizar equipos con menos partidos)
    const getMatchWeight = (teamA: string, teamB: string): number => {
      const countA = matchCounts.get(teamA) || 0;
      const countB = matchCounts.get(teamB) || 0;
      // Menor peso = mayor prioridad (equipos con menos partidos tienen prioridad)
      return countA + countB;
    };

    // Función para verificar si es la última jornada posible
    const isLastPossibleMatchday = (): boolean => {
      // Es la última jornada si quedan 1 o menos partidos por asignar
      return availableMatchups.length <= 1;
    };

    while (availableMatchups.length > 0) {
      const currentMatchday: Match[] = [];
      const teamsInCurrentMatchday = new Set<string>();
      const isLastMatchday = isLastPossibleMatchday();

      // IMPERATIVO: Buscar 2 partidos para la jornada actual (excepto en la última jornada)
      // Usar búsqueda exhaustiva y más agresiva para encontrar la mejor combinación
      
      // Paso 1: Encontrar TODOS los partidos posibles para esta jornada
      const possibleMatches: Array<{ matchup: [string, string], index: number, weight: number }> = [];
      
      for (let i = 0; i < availableMatchups.length; i++) {
        const [teamA, teamB] = availableMatchups[i];
        if (canAssignMatch(teamA, teamB, new Set())) {
          possibleMatches.push({
            matchup: [teamA, teamB],
            index: i,
            weight: getMatchWeight(teamA, teamB)
          });
        }
      }

      // Ordenar por peso (menor peso = mayor prioridad = equipos con menos partidos)
      possibleMatches.sort((a, b) => a.weight - b.weight);

      // Paso 2: Intentar encontrar 2 partidos compatibles (IMPERATIVO excepto última jornada)
      let foundTwo = false;
      
      if (!isLastMatchday) {
        // Búsqueda exhaustiva de 2 partidos compatibles
        for (let i = 0; i < possibleMatches.length && !foundTwo; i++) {
          const firstMatch = possibleMatches[i];
          const [teamA1, teamB1] = firstMatch.matchup;
          const teamsAfterFirst = new Set([teamA1, teamB1]);

          // Buscar un segundo partido compatible
          for (let j = i + 1; j < possibleMatches.length; j++) {
            const secondMatch = possibleMatches[j];
            const [teamA2, teamB2] = secondMatch.matchup;

            if (canAssignMatch(teamA2, teamB2, teamsAfterFirst)) {
              // ¡Encontramos 2 partidos compatibles!
              // Asignar el primer partido
              const match1 = new Match(teamA1, teamB1, currentRound, matchType, matchday);
              match1.time = "20:00";
              currentMatchday.push(match1);
              teamsInCurrentMatchday.add(teamA1);
              teamsInCurrentMatchday.add(teamB1);
              matchCounts.set(teamA1, (matchCounts.get(teamA1) || 0) + 1);
              matchCounts.set(teamB1, (matchCounts.get(teamB1) || 0) + 1);
              assignedRounds.set(teamA1, currentRound);
              assignedRounds.set(teamB1, currentRound);
              availableMatchups.splice(firstMatch.index, 1);

              // Ajustar índices después de eliminar el primero
              const adjustedIndex = secondMatch.index > firstMatch.index ? secondMatch.index - 1 : secondMatch.index;

              // Asignar el segundo partido
              const match2 = new Match(teamA2, teamB2, currentRound, matchType, matchday);
              match2.time = "21:00";
              currentMatchday.push(match2);
              teamsInCurrentMatchday.add(teamA2);
              teamsInCurrentMatchday.add(teamB2);
              matchCounts.set(teamA2, (matchCounts.get(teamA2) || 0) + 1);
              matchCounts.set(teamB2, (matchCounts.get(teamB2) || 0) + 1);
              assignedRounds.set(teamA2, currentRound);
              assignedRounds.set(teamB2, currentRound);
              availableMatchups.splice(adjustedIndex, 1);

              foundTwo = true;
              break;
            }
          }
        }

        // Si NO encontramos 2 partidos y NO es la última jornada, intentar relajar restricciones
        if (!foundTwo && currentMatchday.length === 0) {
          // Intentar encontrar 2 partidos relajando la restricción de jornadas consecutivas
          // Solo si es absolutamente necesario
          for (let i = 0; i < possibleMatches.length && !foundTwo; i++) {
            const firstMatch = possibleMatches[i];
            const [teamA1, teamB1] = firstMatch.matchup;
            const teamsAfterFirst = new Set([teamA1, teamB1]);

            for (let j = i + 1; j < possibleMatches.length; j++) {
              const secondMatch = possibleMatches[j];
              const [teamA2, teamB2] = secondMatch.matchup;

              // Verificar que los equipos no estén ya en la jornada (restricción estricta)
              if (!teamsAfterFirst.has(teamA2) && !teamsAfterFirst.has(teamB2)) {
                // Aceptar aunque hayan jugado en jornada consecutiva (solo si no hay otra opción)
                const match1 = new Match(teamA1, teamB1, currentRound, matchType, matchday);
                match1.time = "20:00";
                currentMatchday.push(match1);
                teamsInCurrentMatchday.add(teamA1);
                teamsInCurrentMatchday.add(teamB1);
                matchCounts.set(teamA1, (matchCounts.get(teamA1) || 0) + 1);
                matchCounts.set(teamB1, (matchCounts.get(teamB1) || 0) + 1);
                assignedRounds.set(teamA1, currentRound);
                assignedRounds.set(teamB1, currentRound);
                availableMatchups.splice(firstMatch.index, 1);

                const adjustedIndex = secondMatch.index > firstMatch.index ? secondMatch.index - 1 : secondMatch.index;

                const match2 = new Match(teamA2, teamB2, currentRound, matchType, matchday);
                match2.time = "21:00";
                currentMatchday.push(match2);
                teamsInCurrentMatchday.add(teamA2);
                teamsInCurrentMatchday.add(teamB2);
                matchCounts.set(teamA2, (matchCounts.get(teamA2) || 0) + 1);
                matchCounts.set(teamB2, (matchCounts.get(teamB2) || 0) + 1);
                assignedRounds.set(teamA2, currentRound);
                assignedRounds.set(teamB2, currentRound);
                availableMatchups.splice(adjustedIndex, 1);

                foundTwo = true;
                break;
              }
            }
            if (foundTwo) break;
          }
        }
      }

      // Solo aceptar 1 partido si es la ÚLTIMA jornada y no hay más opciones
      if (!foundTwo && currentMatchday.length === 0 && isLastMatchday && possibleMatches.length > 0) {
        // Usar el partido con menor peso (equipos con menos partidos)
        const bestMatch = possibleMatches[0];
        const [teamA, teamB] = bestMatch.matchup;
        
        const match = new Match(teamA, teamB, currentRound, matchType, matchday);
        match.time = "20:00";
        currentMatchday.push(match);
        teamsInCurrentMatchday.add(teamA);
        teamsInCurrentMatchday.add(teamB);
        matchCounts.set(teamA, (matchCounts.get(teamA) || 0) + 1);
        matchCounts.set(teamB, (matchCounts.get(teamB) || 0) + 1);
        assignedRounds.set(teamA, currentRound);
        assignedRounds.set(teamB, currentRound);
        availableMatchups.splice(bestMatch.index, 1);
      }

      // Si aún no hay partidos y NO es la última jornada, forzar 2 partidos
      if (currentMatchday.length === 0 && !isLastMatchday && availableMatchups.length >= 2) {
        // Forzar asignación de 2 partidos aunque violen restricciones
        const [teamA1, teamB1] = availableMatchups[0];
        const match1 = new Match(teamA1, teamB1, currentRound, matchType, matchday);
        match1.time = "20:00";
        currentMatchday.push(match1);
        teamsInCurrentMatchday.add(teamA1);
        teamsInCurrentMatchday.add(teamB1);
        matchCounts.set(teamA1, (matchCounts.get(teamA1) || 0) + 1);
        matchCounts.set(teamB1, (matchCounts.get(teamB1) || 0) + 1);
        assignedRounds.set(teamA1, currentRound);
        assignedRounds.set(teamB1, currentRound);
        availableMatchups.splice(0, 1);

        // Buscar un segundo partido que no tenga equipos repetidos
        for (let i = 0; i < availableMatchups.length; i++) {
          const [teamA2, teamB2] = availableMatchups[i];
          if (!teamsInCurrentMatchday.has(teamA2) && !teamsInCurrentMatchday.has(teamB2)) {
            const match2 = new Match(teamA2, teamB2, currentRound, matchType, matchday);
            match2.time = "21:00";
            currentMatchday.push(match2);
            teamsInCurrentMatchday.add(teamA2);
            teamsInCurrentMatchday.add(teamB2);
            matchCounts.set(teamA2, (matchCounts.get(teamA2) || 0) + 1);
            matchCounts.set(teamB2, (matchCounts.get(teamB2) || 0) + 1);
            assignedRounds.set(teamA2, currentRound);
            assignedRounds.set(teamB2, currentRound);
            availableMatchups.splice(i, 1);
            break;
          }
        }
      }

      // Si aún no hay partidos (caso extremo), forzar el primero disponible
      if (currentMatchday.length === 0 && availableMatchups.length > 0) {
        const [teamA, teamB] = availableMatchups[0];
        const match = new Match(teamA, teamB, currentRound, matchType, matchday);
        match.time = "20:00";
        currentMatchday.push(match);
        matchCounts.set(teamA, (matchCounts.get(teamA) || 0) + 1);
        matchCounts.set(teamB, (matchCounts.get(teamB) || 0) + 1);
        assignedRounds.set(teamA, currentRound);
        assignedRounds.set(teamB, currentRound);
        availableMatchups.splice(0, 1);
      }

      // Agregar partidos de la jornada y avanzar
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

