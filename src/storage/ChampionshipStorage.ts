import fs from 'fs';
import path from 'path';
import { Championship } from '../models/Championship';

/**
 * Sistema de almacenamiento persistente para campeonatos.
 * Guarda los datos en un archivo JSON en el servidor.
 */
export class ChampionshipStorage {
  // En Vercel, usar /tmp para escritura, en otros entornos usar data/
  private static readonly STORAGE_DIR = process.env.VERCEL 
    ? '/tmp/data' 
    : path.join(process.cwd(), 'data');
  private static readonly STORAGE_FILE = path.join(this.STORAGE_DIR, 'championships.json');

  /**
   * Asegura que el directorio de almacenamiento existe.
   */
  private static ensureStorageDir(): void {
    try {
      if (!fs.existsSync(this.STORAGE_DIR)) {
        fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
      }
    } catch (error) {
      // En Vercel o entornos sin escritura, continuar sin error
      console.warn('No se pudo crear directorio de almacenamiento (puede ser normal en serverless):', error);
    }
  }

  /**
   * Cargar todos los campeonatos desde el archivo de almacenamiento.
   */
  static load(): Map<string, Championship> {
    const championships = new Map<string, Championship>();
    
    try {
      this.ensureStorageDir();
      
      if (!fs.existsSync(this.STORAGE_FILE)) {
        console.log('📁 No existe archivo de almacenamiento, iniciando con datos vacíos');
        return championships;
      }

      let fileContent: string;
      try {
        fileContent = fs.readFileSync(this.STORAGE_FILE, 'utf-8');
      } catch (readError: any) {
        console.warn('⚠️ No se pudo leer archivo de almacenamiento (puede ser normal en serverless):', readError.message);
        return championships;
      }

      if (!fileContent || fileContent.trim().length === 0) {
        console.log('📁 Archivo de almacenamiento vacío, iniciando con datos vacíos');
        return championships;
      }

      let data: any;
      try {
        data = JSON.parse(fileContent);
      } catch (parseError: any) {
        console.error('❌ Error parseando JSON de almacenamiento:', parseError);
        return championships;
      }

      for (const [id, champData] of Object.entries(data)) {
        try {
          const championship = this.deserializeChampionship(champData as any);
          championships.set(id, championship);
        } catch (error) {
          console.error(`Error cargando campeonato ${id}:`, error);
        }
      }

      console.log(`✅ Cargados ${championships.size} campeonato(s) desde el almacenamiento`);
    } catch (error: any) {
      // En Vercel o entornos sin acceso al sistema de archivos, continuar sin error
      console.warn('No se pudo cargar desde almacenamiento (puede ser normal en serverless):', error.message);
    }

    return championships;
  }

  /**
   * Guardar todos los campeonatos en el archivo de almacenamiento.
   */
  static save(championships: Map<string, Championship>): void {
    try {
      this.ensureStorageDir();

      const data: Record<string, any> = {};
      for (const [id, championship] of championships.entries()) {
        data[id] = championship.toDict();
      }

      // Escribir a un archivo temporal primero, luego renombrar (operación atómica)
      const tempFile = `${this.STORAGE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, this.STORAGE_FILE);

      console.log(`💾 Guardados ${championships.size} campeonato(s) en el almacenamiento`);
    } catch (error: any) {
      // En Vercel o entornos sin escritura, solo loguear el error pero no fallar
      console.warn('No se pudo guardar en almacenamiento (puede ser normal en serverless):', error.message);
      // No lanzar el error para que la aplicación continúe funcionando
    }
  }

  /**
   * Deserializar un campeonato desde datos JSON.
   */
  private static deserializeChampionship(data: any): Championship {
    const championship = new Championship(
      data.name || 'Campeonato',
      data.rounds || 1,
      data.points_per_win || 2,
      data.points_per_loss || 0
    );

    // Restaurar categorías
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
        if (category && catDataTyped.matches) {
          // Restaurar partidos
          for (const matchData of catDataTyped.matches) {
            if (matchData.played && matchData.score_a !== null && matchData.score_b !== null) {
              category.registerMatchResult(
                matchData.team_a,
                matchData.team_b,
                matchData.round_number,
                matchData.score_a,
                matchData.score_b,
                matchData.match_type
              );
            }

            // Restaurar fecha y horario
            const match = category.matches.find(
              m => m.teamA === matchData.team_a &&
                   m.teamB === matchData.team_b &&
                   m.roundNumber === matchData.round_number &&
                   m.matchType === matchData.match_type
            );
            if (match && matchData.date) {
              match.date = matchData.date;
            }
            if (match && matchData.time) {
              match.time = matchData.time;
            }
          }

          // Restaurar partidos del cuadrangular
          if (catDataTyped.quadrangular_matches) {
            for (const matchData of catDataTyped.quadrangular_matches) {
              if (matchData.played && matchData.score_a !== null && matchData.score_b !== null) {
                category.registerMatchResult(
                  matchData.team_a,
                  matchData.team_b,
                  matchData.round_number,
                  matchData.score_a,
                  matchData.score_b,
                  matchData.match_type
                );
              }
            }
          }

          // Restaurar penalizaciones
          if (catDataTyped.standings?.standings) {
            for (const teamData of catDataTyped.standings.standings) {
              if (teamData.penalty_points && teamData.penalty_points > 0) {
                category.applyPenalty(teamData.name, teamData.penalty_points);
              }
            }
          }
        }
      }
    }

    return championship;
  }
}

