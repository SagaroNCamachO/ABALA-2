import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { Championship } from './models/Championship';
import { ChampionshipStorage } from './storage/ChampionshipStorage';
import { MongoDBStorage } from './storage/MongoDBStorage';
import { TeamStatisticsCalculator } from './utils/TeamStatistics';
import { validateChampionship, validateCategory, validateMatchResult, validatePenalty } from './utils/Validation';
import { AuditLog } from './models/AuditLog';
import { UserManager, UserRole } from './models/User';
import { NotificationManager } from './models/NotificationSettings';

const app = express();
app.use(cors());
app.use(express.json());

// Crear usuario admin por defecto si no existe
// En Vercel (serverless), los usuarios se almacenan en memoria, por lo que se pierden entre invocaciones
// Por eso necesitamos crear el admin en cada invocación si no existe
// Solo puede haber UN administrador en el sistema
function ensureAdminExists() {
  try {
    const existingAdmin = UserManager.getUserByUsername('admin');
    
    if (!existingAdmin) {
      // No existe admin, crear uno nuevo
      UserManager.createUser('admin', 'abala123', 'admin@abala.com', UserRole.ADMIN);
      console.log('✅ Usuario admin creado (username: admin, password: abala123)');
    } else {
      // Ya existe admin, asegurar que la contraseña sea "abala123"
      // Actualizar siempre para garantizar que la contraseña sea la correcta
      UserManager.updatePassword('admin', 'abala123');
      console.log('✅ Contraseña del admin configurada a: abala123');
    }
  } catch (error: any) {
    // Si ya existe un admin (error al crear), solo actualizar la contraseña
    if (error.message && error.message.includes('Ya existe un administrador')) {
      try {
        UserManager.updatePassword('admin', 'abala123');
        console.log('✅ Contraseña del admin actualizada a: abala123');
      } catch (updateError: any) {
        console.warn('⚠️ No se pudo actualizar contraseña del admin:', updateError?.message || updateError);
      }
    } else {
      console.warn('⚠️ No se pudo crear/actualizar usuario admin:', error?.message || error);
    }
  }
}

// Ejecutar al cargar el módulo (solo una vez)
// En serverless, esto se ejecuta en cada invocación "fría", pero no en invocaciones "calientes"
ensureAdminExists();

// Servir archivos estáticos (HTML, CSS, JS)
let publicPath: string;
try {
  publicPath = path.join(__dirname, '../public');
} catch (error: any) {
  // En Vercel, __dirname puede no estar disponible, usar process.cwd()
  publicPath = path.join(process.cwd(), 'public');
}
app.use(express.static(publicPath));

// Cargar campeonatos desde almacenamiento persistente al iniciar
// Intenta MongoDB primero, luego fallback a archivos JSON
let championships: Map<string, Championship> = new Map<string, Championship>();
let isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * Cargar campeonatos de forma lazy (solo cuando se necesite).
 * Esto es importante en serverless donde la carga asíncrona inicial puede no completarse.
 */
async function ensureChampionshipsLoaded(): Promise<void> {
  // Si ya están cargados, no hacer nada
  if (championships.size > 0 || isLoading) {
    if (loadPromise) {
      return loadPromise;
    }
    return Promise.resolve();
  }

  // Si ya hay una carga en progreso, esperar a que termine
  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      console.log('🔄 Cargando campeonatos desde almacenamiento...');
      
      // Intentar cargar desde MongoDB si está configurado
      if (process.env.MONGODB_URI) {
        try {
          const mongoChamps = await MongoDBStorage.load();
          if (mongoChamps.size > 0) {
            championships = mongoChamps;
            console.log(`✅ Cargados ${championships.size} campeonato(s) desde MongoDB`);
            
            // Verificar que los resultados se hayan cargado correctamente
            let totalMatches = 0;
            let totalPlayed = 0;
            for (const [, champ] of championships.entries()) {
              for (const category of Array.from(champ.categories.values())) {
                totalMatches += category.matches.length;
                totalPlayed += category.matches.filter(m => m.played).length;
              }
            }
            console.log(`📊 Estadísticas cargadas: ${totalPlayed}/${totalMatches} partidos jugados`);
            
            isLoading = false;
            return;
          }
        } catch (mongoError: any) {
          console.warn('⚠️ Error cargando desde MongoDB, usando fallback:', mongoError.message);
        }
      }
      
      // Fallback a almacenamiento local (archivos JSON)
      championships = ChampionshipStorage.load();
      console.log(`✅ Cargados ${championships.size} campeonato(s) desde almacenamiento local`);
    } catch (error: any) {
      console.error('❌ Error cargando campeonatos:', error);
      championships = new Map<string, Championship>();
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/**
 * Función auxiliar para guardar automáticamente después de cambios.
 */
async function autoSave(): Promise<void> {
  try {
    // Intentar guardar en MongoDB si está configurado
    if (process.env.MONGODB_URI) {
      await MongoDBStorage.save(championships);
    }
    
    // Siempre guardar también en almacenamiento local como backup
    ChampionshipStorage.save(championships);
  } catch (error) {
    console.error('Error en auto-guardado:', error);
  }
}

/**
 * Endpoint raíz - Servir interfaz HTML o JSON según Accept header.
 */
app.get('/', (_req: Request, res: Response) => {
  try {
    const accept = _req.headers.accept || '';
    
    // Si el cliente acepta HTML, servir la interfaz web
    if (accept.includes('text/html')) {
      const htmlPath = path.join(__dirname, '../public/index.html');
      return res.sendFile(htmlPath);
    }
    
    // Si no, devolver JSON (para APIs)
    return res.json({
      message: "API de Gestión de Campeonatos de Básquetbol",
      version: "1.3.0",
      status: "operational",
      endpoints: {
        "POST /api/championships": "Crear un nuevo campeonato",
        "GET /api/championships": "Listar todos los campeonatos",
        "GET /api/championships/:id": "Obtener un campeonato",
        "DELETE /api/championships/:id": "Eliminar un campeonato",
        "POST /api/championships/:id/categories": "Agregar categoría",
        "DELETE /api/championships/:id/categories/:category": "Eliminar categoría",
        "POST /api/championships/:id/results": "Registrar resultado",
        "GET /api/championships/:id/standings/:category": "Obtener tabla de posiciones",
        "GET /api/championships/:id/fixture/:category": "Obtener fixture",
        "POST /api/championships/:id/penalty": "Aplicar multa"
      },
      web_interface: "Visita esta URL en un navegador para ver la interfaz web"
    });
  } catch (error: any) {
    console.error('❌ Error en endpoint raíz:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * Endpoint de salud.
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    message: "API funcionando correctamente"
  });
});

/**
 * Dashboard - Resumen ejecutivo de todos los campeonatos.
 */
app.get('/api/dashboard', (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Resumen de campeonatos
    const championshipsSummary = [];
    const upcomingMatches: any[] = [];
    const recentResults: any[] = [];
    let totalMatches = 0;
    let totalPlayed = 0;
    let totalPending = 0;
    let totalTeams = 0;
    let totalCategories = 0;

    for (const [champId, championship] of championships.entries()) {
      const categories = Array.from(championship.categories.values());
      totalCategories += categories.length;
      
      let champMatches = 0;
      let champPlayed = 0;
      let champPending = 0;
      let champTeams = 0;

      for (const category of categories) {
        champTeams += category.teams.size;
        totalTeams += category.teams.size;
        
        // Incluir todos los partidos (regulares)
        const allMatches = category.matches;
        champMatches += allMatches.length;
        totalMatches += allMatches.length;
        
        const played = allMatches.filter(m => m.played).length;
        const pending = allMatches.filter(m => !m.played).length;
        champPlayed += played;
        champPending += pending;
        totalPlayed += played;
        totalPending += pending;

        // Próximos partidos (no jugados, con fecha >= hoy)
        for (const match of allMatches) {
          if (!match.played && match.date) {
            const matchDate = match.date;
            if (matchDate >= today) {
              upcomingMatches.push({
                championship_id: champId,
                championship_name: championship.name,
                category: category.name,
                team_a: match.teamA,
                team_b: match.teamB,
                date: match.date,
                time: match.time || '20:00',
                round_number: match.roundNumber,
                match_type: match.matchType,
                matchday: match.matchday
              });
            }
          }
        }

        // Resultados recientes (últimos 10 partidos jugados)
        const recentCategoryMatches = allMatches
          .filter(m => m.played && m.date)
          .sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA); // Más recientes primero
          })
          .slice(0, 10);

        for (const match of recentCategoryMatches) {
          recentResults.push({
            championship_id: champId,
            championship_name: championship.name,
            category: category.name,
            team_a: match.teamA,
            team_b: match.teamB,
            score_a: match.scoreA,
            score_b: match.scoreB,
            winner: match.winner,
            date: match.date,
            round_number: match.roundNumber,
            match_type: match.matchType
          });
        }
      }

      // Calcular progreso del campeonato
      const champProgress = champMatches > 0 ? Math.round((champPlayed / champMatches) * 100) : 0;

      championshipsSummary.push({
        id: champId,
        name: championship.name,
        rounds: championship.rounds,
        categories_count: categories.length,
        teams_count: champTeams,
        matches_total: champMatches,
        matches_played: champPlayed,
        matches_pending: champPending,
        progress_percentage: champProgress
      });
    }

    // Ordenar próximos partidos por fecha
    upcomingMatches.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return (a.time || '').localeCompare(b.time || '');
    });

    // Ordenar resultados recientes por fecha (más recientes primero)
    recentResults.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });

    // Limitar a los próximos 10 partidos y últimos 10 resultados
    const nextMatches = upcomingMatches.slice(0, 10);
    const lastResults = recentResults.slice(0, 10);

    // Calcular Top 5 equipos por puntos (de todas las categorías)
    const allTeamsMap = new Map<string, { name: string; points: number; category: string; championship: string }>();
    
    for (const [champId, championship] of championships.entries()) {
      for (const category of Array.from(championship.categories.values())) {
        const standings = category.getStandings();
        for (const team of standings) {
          const key = `${champId}_${category.name}_${team.name}`;
          allTeamsMap.set(key, {
            name: team.name,
            points: team.points,
            category: category.name,
            championship: championship.name
          });
        }
      }
    }

    // Ordenar por puntos y tomar top 5
    const topTeams = Array.from(allTeamsMap.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    return res.json({
      success: true,
      dashboard: {
        summary: {
          total_championships: championships.size,
          total_categories: totalCategories,
          total_teams: totalTeams,
          total_matches: totalMatches,
          matches_played: totalPlayed,
          matches_pending: totalPending,
          overall_progress: totalMatches > 0 ? Math.round((totalPlayed / totalMatches) * 100) : 0
        },
        championships: championshipsSummary,
        upcoming_matches: nextMatches,
        recent_results: lastResults,
        top_teams: topTeams
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Crear un nuevo campeonato.
 */
app.post('/api/championships', async (req: Request, res: Response) => {
  try {
    const data = req.body || {};
    
    // Validar datos
    const validation = validateChampionship(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }

    const champId = data.id || `champ_${championships.size + 1}`;
    
    // Validar que el ID no exista
    if (championships.has(champId)) {
      return res.status(400).json({
        success: false,
        error: `Ya existe un campeonato con el ID '${champId}'. Por favor, use un ID diferente.`
      });
    }

    const name = (data.name || 'Campeonato').trim();
    const rounds = parseInt(data.rounds) || 1;
    const pointsPerWin = parseInt(data.points_per_win) || 2;
    const pointsPerLoss = parseInt(data.points_per_loss) || 0;

    const championship = new Championship(name, rounds, pointsPerWin, pointsPerLoss);
    championships.set(champId, championship);
    
    // Registrar en historial
    AuditLog.log('create', 'championship', champId, {
      entityName: name,
      metadata: { rounds, pointsPerWin, pointsPerLoss }
    });
    
    // Guardar automáticamente en el almacenamiento
    await autoSave();

    return res.status(201).json({
      success: true,
      id: champId,
      championship: championship.toDict()
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Listar todos los campeonatos.
 */
app.get('/api/championships', async (_req: Request, res: Response) => {
  try {
    // Asegurar que los campeonatos estén cargados
    await ensureChampionshipsLoaded();
    
    const championshipsList: Record<string, any> = {};
    for (const [id, champ] of championships.entries()) {
      championshipsList[id] = {
        id,
        name: champ.name,
        rounds: champ.rounds,
        categories: Array.from(champ.categories.keys())
      };
    }

    return res.json({
      success: true,
      championships: championshipsList
    });
  } catch (error: any) {
    console.error('Error en GET /api/championships:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Eliminar un campeonato.
 */
app.delete('/api/championships/:id', async (req: Request, res: Response) => {
  try {
    // Asegurar que los campeonatos estén cargados
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const championship = championships.get(champId);
    
    if (!championship) {
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    const champName = championship.name;
    championships.delete(champId);
    
    // Registrar en historial
    AuditLog.log('delete', 'championship', champId, {
      entityName: champName
    });
    
    // Guardar automáticamente después de eliminar
    await autoSave();

    return res.json({
      success: true,
      message: "Campeonato eliminado exitosamente"
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/championships/:id:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener un campeonato específico.
 */
app.get('/api/championships/:id', async (req: Request, res: Response) => {
  try {
    // Asegurar que los campeonatos estén cargados
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const championship = championships.get(champId);

    if (!championship) {
      console.log(`❌ Campeonato ${champId} no encontrado. Campeonatos disponibles: ${Array.from(championships.keys()).join(', ')}`);
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    return res.json({
      success: true,
      championship: championship.toDict()
    });
  } catch (error: any) {
    console.error('Error en GET /api/championships/:id:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Eliminar una categoría de un campeonato.
 */
app.delete('/api/championships/:id/categories/:category', async (req: Request, res: Response) => {
  try {
    // Asegurar que los campeonatos estén cargados
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const categoryName = req.params.category;
    const championship = championships.get(champId);

    if (!championship) {
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    const category = championship.getCategory(categoryName);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Categoría no encontrada"
      });
    }

    // Eliminar la categoría
    const removed = championship.removeCategory(categoryName);
    if (!removed) {
      return res.status(400).json({
        success: false,
        error: "No se pudo eliminar la categoría"
      });
    }

    // Registrar en historial
    AuditLog.log('delete', 'category', `${champId}_${categoryName}`, {
      entityName: categoryName,
      metadata: {
        championship_id: champId,
        championship_name: championship.name,
        teams_count: category ? category.teams.size : 0
      }
    });

    // Guardar automáticamente después de eliminar
    await autoSave();

    return res.json({
      success: true,
      message: `Categoría '${categoryName}' eliminada exitosamente`
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/championships/:id/categories/:category:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Agregar una categoría a un campeonato.
 */
app.post('/api/championships/:id/categories', async (req: Request, res: Response) => {
  try {
    // Asegurar que los campeonatos estén cargados
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const championship = championships.get(champId);

    if (!championship) {
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    const data = req.body || {};
    
    console.log('📥 Datos recibidos para crear categoría:', JSON.stringify(data, null, 2));
    
    // Validar datos
    const validation = validateCategory(data);
    if (!validation.valid) {
      console.log('❌ Validación fallida:', validation.errors);
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', '),
        errors: validation.errors
      });
    }

    const categoryName = (data.name || '').trim();
    const teamNames = Array.isArray(data.teams) ? data.teams : [];
    const numTeams = data.num_teams ? parseInt(data.num_teams) : undefined;
    const pointsPerWin = data.points_per_win;
    const pointsPerLoss = data.points_per_loss;

    console.log('📋 Procesando categoría:', {
      categoryName,
      teamNamesCount: teamNames.length,
      numTeams,
      hasTeams: teamNames.length > 0,
      hasNumTeams: numTeams !== undefined
    });

    if (championship.getCategory(categoryName)) {
      console.log('❌ Categoría ya existe:', categoryName);
      return res.status(400).json({
        success: false,
        error: `La categoría '${categoryName}' ya existe en este campeonato.`
      });
    }

    if (teamNames.length > 0) {
      console.log('✅ Creando categoría con equipos específicos:', teamNames);
      championship.addCategoryWithTeams(
        categoryName,
        teamNames,
        pointsPerWin,
        pointsPerLoss
      );
    } else if (numTeams && numTeams >= 2) {
      console.log('✅ Creando categoría con número de equipos:', numTeams);
      championship.addCategory(
        categoryName,
        numTeams,
        pointsPerWin,
        pointsPerLoss
      );
    } else {
      console.log('❌ No se proporcionaron equipos ni num_teams válido');
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar 'teams' (array con al menos 2 equipos) o 'num_teams' (número entre 2 y 20)",
        details: {
          teamsProvided: teamNames.length,
          numTeamsProvided: numTeams,
          dataReceived: data
        }
      });
    }

    const category = championship.getCategory(categoryName);
    if (!category) {
      throw new Error("Error al crear la categoría");
    }
    
    // Registrar en historial
    AuditLog.log('create', 'category', `${champId}_${categoryName}`, {
      entityName: categoryName,
      metadata: {
        championship_id: champId,
        championship_name: championship.name,
        teams_count: category.teams.size
      }
    });
    
    // Guardar automáticamente después de agregar categoría
    await autoSave();

    return res.status(201).json({
      success: true,
      category: category.toDict()
    });
  } catch (error: any) {
    console.error('Error en POST /api/championships/:id/categories:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Registrar el resultado de un partido.
 * Permite registrar y modificar resultados (se guardan en MongoDB).
 */
app.post('/api/championships/:id/results', async (req: Request, res: Response) => {
  try {
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const championship = championships.get(champId);

    if (!championship) {
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    const data = req.body || {};
    
    // Validar datos
    const validation = validateMatchResult(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }

    const categoryName = data.category;
    const teamA = data.team_a;
    const teamB = data.team_b;
    const roundNumber = data.round_number;
    const scoreA = data.score_a;
    const scoreB = data.score_b;
    const matchType = data.match_type;

    const success = championship.registerMatchResult(
      categoryName,
      teamA,
      teamB,
      roundNumber,
      scoreA,
      scoreB,
      matchType
    );

    if (success) {
      // Registrar en historial
      const matchId = `${champId}_${categoryName}_${teamA}_${teamB}_${roundNumber}_${matchType}`;
      AuditLog.log('register_result', 'match', matchId, {
        entityName: `${teamA} vs ${teamB}`,
        metadata: {
          championship_id: champId,
          category: categoryName,
          team_a: teamA,
          team_b: teamB,
          round_number: roundNumber,
          match_type: matchType,
          score_a: scoreA,
          score_b: scoreB
        }
      });
      
      // Guardar automáticamente en MongoDB después de registrar resultado
      await autoSave();
      return res.json({
        success: true,
        message: "Resultado registrado y guardado en MongoDB"
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "No se pudo registrar el resultado. Verifica que el partido exista."
      });
    }
  } catch (error: any) {
    console.error('Error en POST /api/championships/:id/results:', error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor"
    });
  }
});

/**
 * Obtener la tabla de posiciones de una categoría.
 */
app.get('/api/championships/:id/standings/:category', async (req: Request, res: Response) => {
  try {
    // Asegurar que los campeonatos estén cargados
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const championship = championships.get(champId);

    if (!championship) {
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    const categoryName = req.params.category;
    const standings = championship.getStandings(categoryName);

    if (standings === null) {
      return res.status(404).json({
        success: false,
        error: "Categoría no encontrada"
      });
    }

    return res.json({
      success: true,
      standings: standings.map(team => team.toDict())
    });
  } catch (error: any) {
    console.error('Error en GET /api/championships/:id/standings/:category:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener estadísticas avanzadas de un equipo.
 */
app.get('/api/championships/:id/team-stats/:category/:team', (req: Request, res: Response) => {
  const champId = req.params.id;
  const categoryName = req.params.category;
  const teamName = req.params.team;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const category = championship.getCategory(categoryName);
  if (!category) {
    return res.status(404).json({
      success: false,
      error: "Categoría no encontrada"
    });
  }

  const team = category.teams.get(teamName);
  if (!team) {
    return res.status(404).json({
      success: false,
      error: "Equipo no encontrado"
    });
  }

  try {
    const advancedStats = TeamStatisticsCalculator.calculateAdvancedStats(
      team,
      category.matches,
      categoryName
    );

    return res.json({
      success: true,
      stats: advancedStats
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener el fixture de una categoría.
 */
app.get('/api/championships/:id/fixture/:category', async (req: Request, res: Response) => {
  try {
    // Asegurar que los campeonatos estén cargados
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const championship = championships.get(champId);

    if (!championship) {
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    const categoryName = req.params.category;
    const category = championship.getCategory(categoryName);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Categoría no encontrada"
      });
    }

    const roundNumber = req.query.round ? parseInt(req.query.round as string) : undefined;
    const matches = roundNumber
      ? category.getMatchesByRound(roundNumber)
      : category.matches;

    return res.json({
      success: true,
      matches: matches.map(match => match.toDict())
    });
  } catch (error: any) {
    console.error('Error en GET /api/championships/:id/fixture/:category:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Actualizar fecha/horario de un partido.
 */
app.put('/api/championships/:id/fixture/:category/schedule', async (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const categoryName = req.params.category;
  const category = championship.getCategory(categoryName);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: "Categoría no encontrada"
    });
  }

  const data = req.body || {};
  const teamA = data.team_a;
  const teamB = data.team_b;
  const roundNumber = data.round_number;
  const matchday = data.matchday;
  const date = data.date;
  const time = data.time;

  // Buscar el partido
  let match = category.matches.find(m => {
    const teamsMatch = (m.teamA === teamA && m.teamB === teamB) || (m.teamA === teamB && m.teamB === teamA);
    const roundMatch = m.roundNumber === roundNumber;
    const matchdayMatch = matchday === undefined || m.matchday === matchday;
    return teamsMatch && roundMatch && matchdayMatch;
  });

  if (!match) {
    return res.status(404).json({
      success: false,
      error: "Partido no encontrado"
    });
  }

  match.setSchedule(date, time);
  
  // Guardar automáticamente después de actualizar fecha/horario
  await autoSave();

  return res.json({
    success: true,
    message: "Fecha y horario actualizados",
    match: match.toDict()
  });
});

/**
 * Actualizar resultado de un partido desde el fixture.
 */
app.put('/api/championships/:id/fixture/:category/result', async (req: Request, res: Response) => {
  try {
    await ensureChampionshipsLoaded();
    
    const champId = req.params.id;
    const championship = championships.get(champId);

    if (!championship) {
      return res.status(404).json({
        success: false,
        error: "Campeonato no encontrado"
      });
    }

    const categoryName = req.params.category;
    const data = req.body || {};
    const teamA = data.team_a;
    const teamB = data.team_b;
    const roundNumber = data.round_number;
    const scoreA = data.score_a;
    const scoreB = data.score_b;

    // Validar datos
    if (!teamA || !teamB || roundNumber === undefined) {
      return res.status(400).json({
        success: false,
        error: "Datos incompletos: se requieren team_a, team_b y round_number"
      });
    }

    if (scoreA === null || scoreA === undefined || scoreB === null || scoreB === undefined) {
      return res.status(400).json({
        success: false,
        error: "Se requieren ambos marcadores (score_a y score_b)"
      });
    }

    if (scoreA < 0 || scoreB < 0) {
      return res.status(400).json({
        success: false,
        error: "Los marcadores no pueden ser negativos"
      });
    }

    if (scoreA === scoreB && scoreA > 0) {
      return res.status(400).json({
        success: false,
        error: "Los partidos no pueden terminar en empate"
      });
    }

    const success = championship.registerMatchResult(
      categoryName,
      teamA,
      teamB,
      roundNumber,
      scoreA,
      scoreB
    );

    if (success) {
      // Guardar automáticamente en MongoDB después de actualizar resultado
      await autoSave();
      return res.json({
        success: true,
        message: "Resultado guardado exitosamente en MongoDB"
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "No se pudo actualizar el resultado. Verifica que el partido exista."
      });
    }
  } catch (error: any) {
    console.error('Error en PUT /api/championships/:id/fixture/:category/result:', error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor"
    });
  }
});

/**
 * Aplicar una multa o bonificación de puntos.
 */
app.post('/api/championships/:id/penalty', async (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const data = req.body || {};
  
  // Validar datos
  const validation = validatePenalty(data);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.errors.join(', ')
    });
  }

  const categoryName = data.category;
  const teamName = data.team;
  const points = parseInt(data.points);

  championship.applyPenalty(categoryName, teamName, points);
  
  // Guardar automáticamente después de aplicar multa
  await autoSave();

  return res.json({
    success: true,
    message: "Multa aplicada"
  });
});

/**
 * Verificar si se puede generar el cuadrangular para una categoría.
 */
app.get('/api/championships/:id/can-generate-quadrangular/:category', (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const categoryName = req.params.category;
  const canGenerate = championship.canGenerateQuadrangular(categoryName);

  return res.json({
    success: true,
    can_generate: canGenerate
  });
});

/**
 * Generar el cuadrangular para una categoría.
 */
app.post('/api/championships/:id/generate-quadrangular/:category', async (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const categoryName = req.params.category;
  const success = championship.generateQuadrangular(categoryName);

  if (success) {
    return res.json({
      success: true,
      message: "Cuadrangular generado exitosamente"
    });
  } else {
    return res.status(400).json({
      success: false,
      error: "No se pudo generar el cuadrangular. Verifica que todas las rondas estén completas y haya al menos 4 equipos."
    });
  }
});

/**
 * Generar la final del cuadrangular.
 */
app.post('/api/championships/:id/generate-final/:category', async (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const categoryName = req.params.category;
  const success = championship.generateFinal(categoryName);

  if (success) {
    // Guardar automáticamente después de generar final
    await autoSave();
    return res.json({
      success: true,
      message: "Final generada exitosamente"
    });
  } else {
    return res.status(400).json({
      success: false,
      error: "No se pudo generar la final. Verifica que las semifinales estén completas."
    });
  }
});

// Manejo global de errores no capturados
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('❌ Error no capturado en Express:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message || 'Error desconocido'
  });
});

// Para desarrollo local
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

/**
 * Obtener historial de cambios (Audit Log)
 */
app.get('/api/audit-log', async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id, action, limit } = req.query;
    
    let logs;
    
    if (entity_type && entity_id) {
      // Logs de una entidad específica
      logs = AuditLog.getLogsByEntity(entity_type as string, entity_id as string);
    } else if (action) {
      // Logs de una acción específica
      logs = AuditLog.getLogsByAction(action as string, limit ? parseInt(limit as string) : 100);
    } else {
      // Todos los logs recientes
      logs = AuditLog.getRecentLogs(limit ? parseInt(limit as string) : 100);
    }
    
    return res.json({
      success: true,
      logs: logs.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        entity_name: log.entity_name,
        user: log.user,
        changes: log.changes,
        metadata: log.metadata
      })),
      count: logs.length
    });
  } catch (error: any) {
    console.error('Error en GET /api/audit-log:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener historial de una entidad específica
 */
app.get('/api/audit-log/:entity_type/:entity_id', async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id } = req.params;
    const logs = AuditLog.getLogsByEntity(entity_type, entity_id);
    
    return res.json({
      success: true,
      logs: logs.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        entity_name: log.entity_name,
        user: log.user,
        changes: log.changes,
        metadata: log.metadata
      })),
      count: logs.length
    });
  } catch (error: any) {
    console.error('Error en GET /api/audit-log/:entity_type/:entity_id:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================
 * AUTENTICACIÓN Y USUARIOS
 * ============================================
 */

/**
 * Registrar nuevo usuario
 * Solo permite crear usuarios con rol VIEWER. Solo puede haber un ADMIN (creado por defecto).
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username y password son requeridos'
      });
    }
    
    // Verificar que el username no exista
    if (UserManager.getUserByUsername(username)) {
      return res.status(400).json({
        success: false,
        error: 'El username ya existe'
      });
    }
    
    // Todos los usuarios nuevos son VIEWER (visualizadores)
    // El rol ADMIN solo puede ser asignado durante la inicialización del sistema
    const user = UserManager.createUser(username, password, email, UserRole.VIEWER);
    
    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: 'Usuario creado como visualizador'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al crear usuario'
    });
  }
});

/**
 * Iniciar sesión
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    // Asegurar que el admin existe antes de autenticar (importante en serverless)
    ensureAdminExists();
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username y password son requeridos'
      });
    }
    
    const user = UserManager.authenticate(username, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: Buffer.from(`${user.id}:${user.username}`).toString('base64') // Token simple - en producción usar JWT
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Resetear contraseña del administrador
 * Útil para recuperar acceso si se perdió la contraseña
 * Disponible en desarrollo y producción (necesario para Vercel serverless)
 */
app.post('/api/auth/reset-admin-password', async (req: Request, res: Response) => {
  try {

    const { newPassword } = req.body;
    const password = newPassword || 'abala123'; // Por defecto usar "abala123"

    const admin = UserManager.getUserByUsername('admin');
    if (!admin) {
      // Si no existe admin, crearlo
      UserManager.createUser('admin', password, 'admin@abala.com', UserRole.ADMIN);
      return res.json({
        success: true,
        message: `Usuario admin creado con contraseña: ${password}`,
        username: 'admin',
        password: password
      });
    }

    // Actualizar contraseña del admin existente
    UserManager.updatePassword('admin', password);
    return res.json({
      success: true,
      message: `Contraseña del admin actualizada a: ${password}`,
      username: 'admin',
      password: password
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Obtener usuario actual
 */
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    
    const user = UserManager.getUser(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
});

/**
 * ============================================
 * NOTIFICACIONES
 * ============================================
 */

/**
 * Obtener configuración de notificaciones
 */
app.get('/api/notifications/settings', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    
    const settings = NotificationManager.getSettings(userId);
    return res.json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Actualizar configuración de notificaciones
 */
app.put('/api/notifications/settings', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    
    const settings = req.body;
    NotificationManager.updateSettings(userId, settings);
    
    return res.json({ success: true, settings: NotificationManager.getSettings(userId) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Suscribirse a notificaciones push
 */
app.post('/api/notifications/subscribe', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    
    // En producción, guardar la suscripción en base de datos
    // Por ahora solo actualizamos la configuración
    NotificationManager.updateSettings(userId, { enablePush: true });
    
    return res.json({ success: true, message: 'Suscripción exitosa' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware de manejo de errores global
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: err?.message || 'Error interno del servidor'
  });
});

export default app;

