import { Category } from './Category';

/**
 * Gestiona un campeonato completo de básquetbol.
 */
export class Championship {
  name: string;
  rounds: number;
  pointsPerWin: number;
  pointsPerLoss: number;
  categories: Map<string, Category> = new Map();

  constructor(
    name: string = "Campeonato de Básquetbol",
    rounds: number = 1,
    pointsPerWin: number = 2,
    pointsPerLoss: number = 0
  ) {
    this.name = name;
    this.rounds = rounds;
    this.pointsPerWin = pointsPerWin;
    this.pointsPerLoss = pointsPerLoss;
  }

  /**
   * Agrega una categoría al campeonato.
   */
  addCategory(
    categoryName: string,
    numTeams: number,
    pointsPerWin?: number,
    pointsPerLoss?: number
  ): void {
    if (this.categories.has(categoryName)) {
      throw new Error(`La categoría '${categoryName}' ya existe`);
    }

    const pointsWin = pointsPerWin ?? this.pointsPerWin;
    const pointsLoss = pointsPerLoss ?? this.pointsPerLoss;

    const category = new Category(categoryName, this.rounds, pointsWin, pointsLoss);

    // Generar nombres de equipos automáticamente
    const teamNames = Array.from(
      { length: numTeams },
      (_, i) => `${categoryName} Equipo ${i + 1}`
    );
    category.addTeams(teamNames);

    // Generar fixture automáticamente
    category.generateFixture();

    this.categories.set(categoryName, category);
  }

  /**
   * Agrega una categoría con nombres de equipos específicos.
   */
  addCategoryWithTeams(
    categoryName: string,
    teamNames: string[],
    pointsPerWin?: number,
    pointsPerLoss?: number
  ): void {
    if (this.categories.has(categoryName)) {
      throw new Error(`La categoría '${categoryName}' ya existe`);
    }

    const pointsWin = pointsPerWin ?? this.pointsPerWin;
    const pointsLoss = pointsPerLoss ?? this.pointsPerLoss;

    const category = new Category(categoryName, this.rounds, pointsWin, pointsLoss);
    category.addTeams(teamNames);
    category.generateFixture();

    this.categories.set(categoryName, category);
  }

  /**
   * Obtiene una categoría por su nombre.
   */
  getCategory(categoryName: string): Category | undefined {
    return this.categories.get(categoryName);
  }

  /**
   * Registra el resultado de un partido.
   */
  registerMatchResult(
    categoryName: string,
    teamA: string,
    teamB: string,
    roundNumber: number,
    scoreA: number,
    scoreB: number,
    matchType?: string
  ): boolean {
    const category = this.getCategory(categoryName);
    if (category === undefined) {
      return false;
    }

    return category.registerMatchResult(teamA, teamB, roundNumber, scoreA, scoreB, matchType);
  }

  /**
   * Aplica una multa o bonificación de puntos a un equipo.
   */
  applyPenalty(categoryName: string, teamName: string, points: number): void {
    const category = this.getCategory(categoryName);
    if (category) {
      category.applyPenalty(teamName, points);
    }
  }

  /**
   * Obtiene la tabla de posiciones de una categoría.
   */
  getStandings(categoryName: string) {
    const category = this.getCategory(categoryName);
    if (category === undefined) {
      return null;
    }

    return category.getStandings();
  }

  /**
   * Verifica si se puede generar el cuadrangular para una categoría.
   * Requiere que todas las rondas estén completas y que haya al menos 4 equipos.
   */
  canGenerateQuadrangular(categoryName: string): boolean {
    const category = this.getCategory(categoryName);
    if (!category) {
      return false;
    }

    // Verificar que todas las rondas estén completas
    if (!category.isAllRoundsCompleted()) {
      return false;
    }

    // Verificar que haya al menos 4 equipos
    if (category.teams.size < 4) {
      return false;
    }

    // Verificar que no exista ya un cuadrangular
    const hasQuadrangular = category.matches.some(m => m.matchType === 'semifinal' || m.matchType === 'final');
    return !hasQuadrangular;
  }

  /**
   * Genera el cuadrangular para una categoría.
   */
  generateQuadrangular(categoryName: string): boolean {
    const category = this.getCategory(categoryName);
    if (!category) {
      return false;
    }

    if (!this.canGenerateQuadrangular(categoryName)) {
      return false;
    }

    try {
      category.generateQuadrangular();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Genera la final del cuadrangular si las semifinales están completas.
   */
  generateFinal(categoryName: string): boolean {
    const category = this.getCategory(categoryName);
    if (!category) {
      return false;
    }

    if (!category.canGenerateFinal()) {
      return false;
    }

    try {
      category.generateFinal();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convierte el campeonato completo a un objeto JSON.
   */
  toDict(): Record<string, any> {
    const categoriesDict: Record<string, any> = {};
    for (const [name, cat] of this.categories.entries()) {
      categoriesDict[name] = cat.toDict();
    }

    return {
      name: this.name,
      rounds: this.rounds,
      points_per_win: this.pointsPerWin,
      points_per_loss: this.pointsPerLoss,
      categories: categoriesDict
    };
  }

  toString(): string {
    return `Championship(name='${this.name}', rounds=${this.rounds}, categories=${this.categories.size})`;
  }
}

