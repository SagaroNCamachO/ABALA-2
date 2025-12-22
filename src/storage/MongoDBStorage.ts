import { MongoClient, Db, Collection } from 'mongodb';
import { Championship } from '../models/Championship';

/**
 * Sistema de almacenamiento usando MongoDB.
 * Compatible con MongoDB Atlas (gratis) y MongoDB local.
 */
export class MongoDBStorage {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;
  private static readonly DB_NAME = 'abala_championships';
  private static readonly COLLECTION_NAME = 'championships';

  /**
   * Conectar a MongoDB.
   */
  private static async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    
    try {
      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      this.db = this.client.db(this.DB_NAME);
      console.log('✅ Conectado a MongoDB');
      return this.db;
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      throw error;
    }
  }

  /**
   * Obtener la colección de campeonatos.
   */
  private static async getCollection(): Promise<Collection> {
    const db = await this.connect();
    return db.collection(this.COLLECTION_NAME);
  }

  /**
   * Cargar todos los campeonatos desde MongoDB.
   */
  static async load(): Promise<Map<string, Championship>> {
    const championships = new Map<string, Championship>();

    try {
      // Si no hay URI de MongoDB configurada, retornar vacío
      if (!process.env.MONGODB_URI) {
        console.log('⚠️ MONGODB_URI no configurada, usando almacenamiento local');
        return championships;
      }

      const collection = await this.getCollection();
      const docs = await collection.find({}).toArray();

      for (const doc of docs) {
        try {
          const championship = this.deserializeChampionship(doc.data);
          const id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
          championships.set(id, championship);
        } catch (error) {
          const id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
          console.error(`Error cargando campeonato ${id}:`, error);
        }
      }

      console.log(`✅ Cargados ${championships.size} campeonato(s) desde MongoDB`);
    } catch (error: any) {
      console.warn('⚠️ Error cargando desde MongoDB (usando fallback local):', error.message);
    }

    return championships;
  }

  /**
   * Guardar todos los campeonatos en MongoDB.
   */
  static async save(championships: Map<string, Championship>): Promise<void> {
    try {
      // Si no hay URI de MongoDB configurada, no hacer nada
      if (!process.env.MONGODB_URI) {
        return;
      }

      const collection = await this.getCollection();

      // Convertir a documentos
      const operations = Array.from(championships.entries()).map(([id, championship]) => ({
        updateOne: {
          filter: { _id: id as any },
          update: {
            $set: {
              _id: id as any,
              data: championship.toDict(),
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      })) as any;

      if (operations.length > 0) {
        await collection.bulkWrite(operations);
        console.log(`💾 Guardados ${championships.size} campeonato(s) en MongoDB`);
      }
    } catch (error: any) {
      console.error('❌ Error guardando en MongoDB:', error);
      throw error;
    }
  }

  /**
   * Deserializar un campeonato desde datos MongoDB.
   */
  private static deserializeChampionship(data: any): Championship {
    const championship = new Championship(
      data.name || 'Campeonato',
      data.rounds || 1,
      data.points_per_win || 2,
      data.points_per_loss || 0
    );

    // Restaurar categorías (similar a ChampionshipStorage)
    if (data.categories) {
      for (const [catName, catData] of Object.entries(data.categories)) {
        const catDataTyped = catData as any;
        const teamNames = catDataTyped.teams?.map((t: any) => t.name || t) || [];
        
        championship.addCategoryWithTeams(
          catName,
          teamNames,
          catDataTyped.standings?.points_per_win,
          catDataTyped.standings?.points_per_loss
        );

        const category = championship.getCategory(catName);
        if (category) {
          // Asegurar que el fixture esté generado ANTES de restaurar resultados
          // Esto es crítico porque los partidos deben existir antes de restaurar resultados
          if (!category.fixtureGenerated || category.matches.length === 0) {
            try {
              category.generateFixture();
              console.log(`✅ Fixture generado para categoría ${catName} (${category.matches.length} partidos)`);
            } catch (error) {
              console.error(`❌ Error generando fixture para ${catName}:`, error);
            }
          }
          
            // Ahora restaurar partidos y resultados
          if (catDataTyped.matches && catDataTyped.matches.length > 0) {
            // Restaurar partidos y resultados
            for (const matchData of catDataTyped.matches) {
              // Buscar el partido (buscar en ambos sentidos: A vs B o B vs A)
              // También considerar matchday si está disponible
              let match = category.matches.find(
                m => {
                  const teamsMatch = (m.teamA === matchData.team_a && m.teamB === matchData.team_b) ||
                                    (m.teamA === matchData.team_b && m.teamB === matchData.team_a);
                  const roundMatch = m.roundNumber === matchData.round_number;
                  const typeMatch = matchData.match_type === undefined || m.matchType === matchData.match_type;
                  const matchdayMatch = matchData.matchday === undefined || m.matchday === matchData.matchday;
                  
                  return teamsMatch && roundMatch && typeMatch && matchdayMatch;
                }
              );

              if (match) {
                // Restaurar fecha y horario primero
                if (matchData.date) match.date = matchData.date;
                if (matchData.time) match.time = matchData.time;

                // Restaurar resultado si existe
                if (matchData.played && matchData.score_a !== null && matchData.score_b !== null) {
                  // Ajustar el orden de los puntajes según el orden del partido
                  let finalScoreA: number;
                  let finalScoreB: number;
                  if (match.teamA === matchData.team_a) {
                    // El orden coincide
                    finalScoreA = matchData.score_a;
                    finalScoreB = matchData.score_b;
                  } else {
                    // El orden está invertido
                    finalScoreA = matchData.score_b;
                    finalScoreB = matchData.score_a;
                  }

                  // Registrar resultado directamente en el partido
                  match.registerResult(finalScoreA, finalScoreB);
                  
                  // Actualizar estadísticas de los equipos
                  const teamAObj = category.teams.get(match.teamA);
                  const teamBObj = category.teams.get(match.teamB);
                  
                  if (teamAObj && teamBObj) {
                    // Calcular si ganó el equipo A
                    const teamAWon = finalScoreA > finalScoreB;
                    teamAObj.addMatchResult(finalScoreA, finalScoreB, teamAWon);
                    teamBObj.addMatchResult(finalScoreB, finalScoreA, !teamAWon);
                  }
                }
              } else {
                console.warn(`⚠️ Partido no encontrado al restaurar: ${matchData.team_a} vs ${matchData.team_b}, Round ${matchData.round_number}, Type ${matchData.match_type || 'N/A'}, Matchday ${matchData.matchday || 'N/A'}`);
                console.warn(`   Partidos disponibles en categoría: ${category.matches.length}`);
                if (category.matches.length > 0) {
                  console.warn(`   Primer partido: ${category.matches[0].teamA} vs ${category.matches[0].teamB}, Round ${category.matches[0].roundNumber}, Type ${category.matches[0].matchType}`);
                }
              }
            }

            // Recalcular tabla de posiciones después de restaurar todos los resultados
            category.standings.updateStandings();
            
            console.log(`✅ Restaurados resultados para categoría ${catName}: ${category.matches.filter(m => m.played).length} partidos jugados`);
          }

          // Restaurar penalizaciones
          if (catDataTyped.standings?.standings) {
            for (const teamData of catDataTyped.standings.standings) {
              if (teamData.penalty_points && teamData.penalty_points > 0) {
                const team = category.teams.get(teamData.name);
                if (team) {
                  team.addPenalty(teamData.penalty_points);
                }
              }
            }
            category.standings.updateStandings();
          }
        }
      }
    }

    return championship;
  }

  /**
   * Cerrar la conexión a MongoDB.
   */
  static async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('🔌 Desconectado de MongoDB');
    }
  }
}

