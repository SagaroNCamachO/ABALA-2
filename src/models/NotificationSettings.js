"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
class NotificationManager {
    /**
     * Obtener configuración de notificaciones de un usuario
     */
    static getSettings(userId) {
        if (!this.settings.has(userId)) {
            // Configuración por defecto
            this.settings.set(userId, {
                enablePush: true,
                enableEmail: false,
                upcomingMatches: true,
                matchResults: true,
                weeklySummary: false,
                unprogrammedMatches: true,
                notificationHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] // 8 AM - 9 PM
            });
        }
        return this.settings.get(userId);
    }
    /**
     * Actualizar configuración de notificaciones
     */
    static updateSettings(userId, settings) {
        const current = this.getSettings(userId);
        this.settings.set(userId, { ...current, ...settings });
    }
    /**
     * Verificar si se puede enviar notificación en este momento
     */
    static canNotify(userId) {
        const settings = this.getSettings(userId);
        const now = new Date();
        const currentHour = now.getHours();
        return settings.notificationHours.includes(currentHour);
    }
    /**
     * Exportar configuración
     */
    static toDict() {
        const result = {};
        for (const [userId, settings] of this.settings.entries()) {
            result[userId] = settings;
        }
        return result;
    }
    /**
     * Cargar configuración
     */
    static fromDict(data) {
        this.settings.clear();
        for (const [userId, settings] of Object.entries(data)) {
            this.settings.set(userId, settings);
        }
    }
}
exports.NotificationManager = NotificationManager;
NotificationManager.settings = new Map();
//# sourceMappingURL=NotificationSettings.js.map