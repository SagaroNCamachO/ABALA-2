/**
 * Modelo para el historial de cambios (Audit Log)
 */
export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    action: string;
    entity_type: string;
    entity_id: string;
    entity_name?: string;
    user?: string;
    changes?: {
        field: string;
        old_value: any;
        new_value: any;
    }[];
    metadata?: Record<string, any>;
}
export declare class AuditLog {
    private static logs;
    private static readonly MAX_LOGS;
    private static readonly RETENTION_DAYS;
    /**
     * Registrar una acción en el historial
     */
    static log(action: string, entityType: string, entityId: string, options?: {
        entityName?: string;
        user?: string;
        changes?: {
            field: string;
            old_value: any;
            new_value: any;
        }[];
        metadata?: Record<string, any>;
    }): string;
    /**
     * Obtener logs por entidad
     */
    static getLogsByEntity(entityType: string, entityId: string): AuditLogEntry[];
    /**
     * Obtener todos los logs recientes
     */
    static getRecentLogs(limit?: number): AuditLogEntry[];
    /**
     * Obtener logs por acción
     */
    static getLogsByAction(action: string, limit?: number): AuditLogEntry[];
    /**
     * Limpiar logs antiguos
     */
    private static cleanOldLogs;
    /**
     * Exportar logs a formato JSON
     */
    static toDict(): Record<string, any>[];
    /**
     * Cargar logs desde formato JSON
     */
    static fromDict(data: any[]): void;
}
//# sourceMappingURL=AuditLog.d.ts.map