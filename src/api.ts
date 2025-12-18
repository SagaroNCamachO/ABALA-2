import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { Championship } from './models/Championship';
import { ChampionshipStorage } from './storage/ChampionshipStorage';
import { MongoDBStorage } from './storage/MongoDBStorage';
import { TeamStatisticsCalculator } from './utils/TeamStatistics';
import { validateChampionship, validateCategory, validateMatchResult, validatePenalty } from './utils/Validation';

const app = express();
// #region agent log
fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api.ts:10',message:'Express app created',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS)
const publicPath = path.join(__dirname, '../public');
// #region agent log
fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api.ts:18',message:'Setting static path',data:{publicPath,__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
app.use(express.static(publicPath));

// Cargar campeonatos desde almacenamiento persistente al iniciar
// Intenta MongoDB primero, luego fallback a archivos JSON
let championships: Map<string, Championship> = new Map<string, Championship>();

(async () => {
  try {
    // Intentar cargar desde MongoDB si está configurado
    if (process.env.MONGODB_URI) {
      championships = await MongoDBStorage.load();
      if (championships.size > 0) {
        console.log(`✅ Cargados ${championships.size} campeonato(s) desde MongoDB`);
        return;
      }
    }
    
    // Fallback a almacenamiento local (archivos JSON)
    championships = ChampionshipStorage.load();
    console.log(`✅ Cargados ${championships.size} campeonato(s) desde almacenamiento local`);
  } catch (error: any) {
    console.error('❌ Error cargando campeonatos al iniciar:', error);
    championships = new Map<string, Championship>();
  }
})();

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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api.ts:43',message:'Root endpoint called',data:{accept:_req.headers.accept||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  try {
    const accept = _req.headers.accept || '';
    
    // Si el cliente acepta HTML, servir la interfaz web
    if (accept.includes('text/html')) {
      const htmlPath = path.join(__dirname, '../public/index.html');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api.ts:48',message:'Serving HTML file',data:{htmlPath,__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return res.sendFile(htmlPath);
    }
    
    // Si no, devolver JSON (para APIs)
    return res.json({
      message: "API de Gestión de Campeonatos de Básquetbol",
      version: "1.2.0",
      status: "operational",
      endpoints: {
        "POST /api/championships": "Crear un nuevo campeonato",
        "GET /api/championships": "Listar todos los campeonatos",
        "GET /api/championships/:id": "Obtener un campeonato",
        "POST /api/championships/:id/categories": "Agregar categoría",
        "POST /api/championships/:id/results": "Registrar resultado",
        "GET /api/championships/:id/standings/:category": "Obtener tabla de posiciones",
        "GET /api/championships/:id/fixture/:category": "Obtener fixture",
        "POST /api/championships/:id/penalty": "Aplicar multa"
      },
      web_interface: "Visita esta URL en un navegador para ver la interfaz web"
    });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api.ts:72',message:'Error in root endpoint',data:{error:error?.message||'unknown',stack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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

      championshipsSummary.push({
        id: champId,
        name: championship.name,
        rounds: championship.rounds,
        categories_count: categories.length,
        teams_count: champTeams,
        matches_total: champMatches,
        matches_played: champPlayed,
        matches_pending: champPending,
        progress_percentage: champMatches > 0 ? Math.round((champPlayed / champMatches) * 100) : 0
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
        recent_results: lastResults
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
app.get('/api/championships', (_req: Request, res: Response) => {
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
});

/**
 * Eliminar un campeonato.
 */
app.delete('/api/championships/:id', async (req: Request, res: Response) => {
  const champId = req.params.id;
  
  if (!championships.has(champId)) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  championships.delete(champId);
  
  // Guardar automáticamente después de eliminar
  await autoSave();

  return res.json({
    success: true,
    message: "Campeonato eliminado exitosamente"
  });
});

/**
 * Obtener un campeonato específico.
 */
app.get('/api/championships/:id', (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  return res.json({
    success: true,
    championship: championship.toDict()
  });
});

/**
 * Agregar una categoría a un campeonato.
 */
app.post('/api/championships/:id/categories', async (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  try {
  const data = req.body || {};
  
  // Validar datos
  const validation = validateCategory(data);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.errors.join(', ')
    });
  }

  const categoryName = (data.name || '').trim();
  const teamNames = data.teams || [];
  const numTeams = data.num_teams;
  const pointsPerWin = data.points_per_win;
  const pointsPerLoss = data.points_per_loss;

  if (championship.getCategory(categoryName)) {
    return res.status(400).json({
      success: false,
      error: `La categoría '${categoryName}' ya existe en este campeonato.`
    });
  }

  if (teamNames.length > 0) {
      championship.addCategoryWithTeams(
        categoryName,
        teamNames,
        pointsPerWin,
        pointsPerLoss
      );
    } else if (numTeams) {
      championship.addCategory(
        categoryName,
        numTeams,
        pointsPerWin,
        pointsPerLoss
      );
    } else {
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar 'teams' o 'num_teams'"
      });
    }

    const category = championship.getCategory(categoryName);
    if (!category) {
      throw new Error("Error al crear la categoría");
    }
    
    // Guardar automáticamente después de agregar categoría
    await autoSave();

    return res.status(201).json({
      success: true,
      category: category.toDict()
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Registrar el resultado de un partido.
 */
app.post('/api/championships/:id/results', async (req: Request, res: Response) => {
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
    // Guardar automáticamente después de registrar resultado
    await autoSave();
    return res.json({
      success: true,
      message: "Resultado registrado"
    });
  } else {
    return res.status(400).json({
      success: false,
      error: "No se pudo registrar el resultado"
    });
  }
});

/**
 * Obtener la tabla de posiciones de una categoría.
 */
app.get('/api/championships/:id/standings/:category', (req: Request, res: Response) => {
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
app.get('/api/championships/:id/fixture/:category', (req: Request, res: Response) => {
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

  const success = championship.registerMatchResult(
    categoryName,
    teamA,
    teamB,
    roundNumber,
    scoreA,
    scoreB
  );

  if (success) {
    // Guardar automáticamente después de actualizar resultado
    await autoSave();
    return res.json({
      success: true,
      message: "Resultado actualizado"
    });
  } else {
    return res.status(400).json({
      success: false,
      error: "No se pudo actualizar el resultado"
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/api.ts:850',message:'Unhandled error caught',data:{error:err?.message||'unknown',path:_req.path},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
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

export default app;

