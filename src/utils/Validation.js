"use strict";
/**
 * Utilidades de validación para el sistema de campeonatos.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChampionship = validateChampionship;
exports.validateCategory = validateCategory;
exports.validateMatchResult = validateMatchResult;
exports.validatePenalty = validatePenalty;
/**
 * Valida los datos de un campeonato.
 */
function validateChampionship(data) {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('El nombre del campeonato es obligatorio');
    }
    else if (data.name.trim().length < 3) {
        errors.push('El nombre del campeonato debe tener al menos 3 caracteres');
    }
    else if (data.name.trim().length > 100) {
        errors.push('El nombre del campeonato no puede exceder 100 caracteres');
    }
    if (data.rounds !== undefined) {
        const rounds = parseInt(data.rounds);
        if (isNaN(rounds) || rounds < 1 || rounds > 10) {
            errors.push('El número de vueltas debe ser entre 1 y 10');
        }
    }
    if (data.points_per_win !== undefined) {
        const pointsWin = parseInt(data.points_per_win);
        if (isNaN(pointsWin) || pointsWin < 0 || pointsWin > 10) {
            errors.push('Los puntos por victoria deben ser entre 0 y 10');
        }
    }
    if (data.points_per_loss !== undefined) {
        const pointsLoss = parseInt(data.points_per_loss);
        if (isNaN(pointsLoss) || pointsLoss < 0 || pointsLoss > 5) {
            errors.push('Los puntos por derrota deben ser entre 0 y 5');
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Valida los datos de una categoría.
 */
function validateCategory(data) {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('El nombre de la categoría es obligatorio');
    }
    else if (data.name.trim().length < 2) {
        errors.push('El nombre de la categoría debe tener al menos 2 caracteres');
    }
    else if (data.name.trim().length > 50) {
        errors.push('El nombre de la categoría no puede exceder 50 caracteres');
    }
    if (data.teams && Array.isArray(data.teams)) {
        if (data.teams.length < 2) {
            errors.push('Se necesitan al menos 2 equipos para crear una categoría');
        }
        else if (data.teams.length > 20) {
            errors.push('No se pueden agregar más de 20 equipos por categoría');
        }
        // Validar nombres de equipos únicos
        const uniqueTeams = new Set(data.teams.map((t) => (typeof t === 'string' ? t : t.name || '').trim().toLowerCase()));
        if (uniqueTeams.size !== data.teams.length) {
            errors.push('No se pueden tener equipos con el mismo nombre');
        }
        // Validar que los nombres no estén vacíos
        for (const team of data.teams) {
            const teamName = typeof team === 'string' ? team : team.name || '';
            if (teamName.trim().length === 0) {
                errors.push('Los nombres de los equipos no pueden estar vacíos');
                break;
            }
            if (teamName.trim().length > 50) {
                errors.push('Los nombres de los equipos no pueden exceder 50 caracteres');
                break;
            }
        }
    }
    else if (data.num_teams !== undefined) {
        const numTeams = parseInt(data.num_teams);
        if (isNaN(numTeams) || numTeams < 2 || numTeams > 20) {
            errors.push('El número de equipos debe ser entre 2 y 20');
        }
    }
    else {
        errors.push('Debe proporcionar equipos (array) o número de equipos (num_teams)');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Valida los datos de un resultado de partido.
 */
function validateMatchResult(data) {
    const errors = [];
    if (!data.team_a || typeof data.team_a !== 'string') {
        errors.push('El equipo local es obligatorio');
    }
    if (!data.team_b || typeof data.team_b !== 'string') {
        errors.push('El equipo visitante es obligatorio');
    }
    if (data.team_a === data.team_b) {
        errors.push('Un equipo no puede jugar contra sí mismo');
    }
    if (data.score_a !== undefined) {
        const scoreA = parseInt(data.score_a);
        if (isNaN(scoreA) || scoreA < 0 || scoreA > 200) {
            errors.push('El marcador del equipo local debe ser entre 0 y 200');
        }
    }
    if (data.score_b !== undefined) {
        const scoreB = parseInt(data.score_b);
        if (isNaN(scoreB) || scoreB < 0 || scoreB > 200) {
            errors.push('El marcador del equipo visitante debe ser entre 0 y 200');
        }
    }
    if (data.score_a !== undefined && data.score_b !== undefined) {
        const scoreA = parseInt(data.score_a);
        const scoreB = parseInt(data.score_b);
        if (scoreA === scoreB && scoreA > 0) {
            errors.push('Los partidos no pueden terminar en empate (debe haber un ganador)');
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Valida los datos de una multa/sanción.
 */
function validatePenalty(data) {
    const errors = [];
    if (!data.team || typeof data.team !== 'string') {
        errors.push('El nombre del equipo es obligatorio');
    }
    if (data.points === undefined || data.points === null) {
        errors.push('Los puntos de la multa son obligatorios');
    }
    else {
        const points = parseInt(data.points);
        if (isNaN(points) || points < -50 || points > 50) {
            errors.push('Los puntos de la multa deben ser entre -50 y 50');
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=Validation.js.map