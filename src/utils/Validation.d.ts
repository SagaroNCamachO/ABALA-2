/**
 * Utilidades de validación para el sistema de campeonatos.
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Valida los datos de un campeonato.
 */
export declare function validateChampionship(data: any): ValidationResult;
/**
 * Valida los datos de una categoría.
 */
export declare function validateCategory(data: any): ValidationResult;
/**
 * Valida los datos de un resultado de partido.
 */
export declare function validateMatchResult(data: any): ValidationResult;
/**
 * Valida los datos de una multa/sanción.
 */
export declare function validatePenalty(data: any): ValidationResult;
//# sourceMappingURL=Validation.d.ts.map