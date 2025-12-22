"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
class AuditLog {
    /**
     * Registrar una acción en el historial
     */
    static log(action, entityType, entityId, options) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const entry = {
            id,
            timestamp: new Date(),
            action,
            entity_type: entityType,
            entity_id: entityId,
            entity_name: options?.entityName,
            user: options?.user || 'system',
            changes: options?.changes,
            metadata: options?.metadata
        };
        this.logs.set(id, entry);
        // Limpiar logs antiguos si excedemos el límite
        if (this.logs.size > this.MAX_LOGS) {
            this.cleanOldLogs();
        }
        return id;
    }
    /**
     * Obtener logs por entidad
     */
    static getLogsByEntity(entityType, entityId) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
        return Array.from(this.logs.values())
            .filter(log => log.entity_type === entityType &&
            log.entity_id === entityId &&
            log.timestamp >= cutoffDate)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Obtener todos los logs recientes
     */
    static getRecentLogs(limit = 100) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
        return Array.from(this.logs.values())
            .filter(log => log.timestamp >= cutoffDate)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Obtener logs por acción
     */
    static getLogsByAction(action, limit = 100) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
        return Array.from(this.logs.values())
            .filter(log => log.action === action &&
            log.timestamp >= cutoffDate)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Limpiar logs antiguos
     */
    static cleanOldLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
        const toDelete = [];
        for (const [id, log] of this.logs.entries()) {
            if (log.timestamp < cutoffDate) {
                toDelete.push(id);
            }
        }
        toDelete.forEach(id => this.logs.delete(id));
    }
    /**
     * Exportar logs a formato JSON
     */
    static toDict() {
        return Array.from(this.logs.values()).map(log => ({
            id: log.id,
            timestamp: log.timestamp.toISOString(),
            action: log.action,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            entity_name: log.entity_name,
            user: log.user,
            changes: log.changes,
            metadata: log.metadata
        }));
    }
    /**
     * Cargar logs desde formato JSON
     */
    static fromDict(data) {
        this.logs.clear();
        for (const entry of data) {
            this.logs.set(entry.id, {
                ...entry,
                timestamp: new Date(entry.timestamp)
            });
        }
    }
}
exports.AuditLog = AuditLog;
AuditLog.logs = new Map();
AuditLog.MAX_LOGS = 10000; // Máximo de logs en memoria
AuditLog.RETENTION_DAYS = 30; // Retener logs por 30 días
//# sourceMappingURL=AuditLog.js.map