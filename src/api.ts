import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { Championship } from './models/Championship';

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

// Almacenar campeonatos en memoria (en producción usar base de datos)
const championships: Map<string, Championship> = new Map();

/**
 * Endpoint raíz - Servir interfaz HTML o JSON según Accept header.
 */
app.get('/', (_req: Request, res: Response) => {
  const accept = _req.headers.accept || '';
  
  // Si el cliente acepta HTML, servir la interfaz web
  if (accept.includes('text/html')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  
  // Si no, devolver JSON (para APIs)
  return res.json({
    message: "API de Gestión de Campeonatos de Básquetbol",
    version: "1.0.0",
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
 * Crear un nuevo campeonato.
 */
app.post('/api/championships', (req: Request, res: Response) => {
  try {
    const data = req.body || {};
    const champId = data.id || `champ_${championships.size + 1}`;
    const name = data.name || 'Campeonato';
    const rounds = data.rounds || 1;
    const pointsPerWin = data.points_per_win || 2;
    const pointsPerLoss = data.points_per_loss || 0;

    const championship = new Championship(name, rounds, pointsPerWin, pointsPerLoss);
    championships.set(champId, championship);

    res.status(201).json({
      success: true,
      id: champId,
      championship: championship.toDict()
    });
  } catch (error: any) {
    res.status(400).json({
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
app.post('/api/championships/:id/categories', (req: Request, res: Response) => {
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
    const categoryName = data.name;
    const teamNames = data.teams || [];
    const numTeams = data.num_teams;
    const pointsPerWin = data.points_per_win;
    const pointsPerLoss = data.points_per_loss;

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
app.post('/api/championships/:id/results', (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const data = req.body || {};
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
app.put('/api/championships/:id/fixture/:category/schedule', (req: Request, res: Response) => {
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

  return res.json({
    success: true,
    message: "Fecha y horario actualizados",
    match: match.toDict()
  });
});

/**
 * Actualizar resultado de un partido desde el fixture.
 */
app.put('/api/championships/:id/fixture/:category/result', (req: Request, res: Response) => {
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
  const matchday = data.matchday;
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
app.post('/api/championships/:id/penalty', (req: Request, res: Response) => {
  const champId = req.params.id;
  const championship = championships.get(champId);

  if (!championship) {
    return res.status(404).json({
      success: false,
      error: "Campeonato no encontrado"
    });
  }

  const data = req.body || {};
  const categoryName = data.category;
  const teamName = data.team;
  const points = data.points;

  championship.applyPenalty(categoryName, teamName, points);

  return res.json({
    success: true,
    message: "Multa aplicada"
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

