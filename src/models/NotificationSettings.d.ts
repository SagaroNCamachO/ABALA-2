/**
 * Modelo para configuración de notificaciones del usuario
 */
export interface NotificationSettings {
    email?: string;
    enablePush: boolean;
    enableEmail: boolean;
    upcomingMatches: boolean;
    matchResults: boolean;
    weeklySummary: boolean;
    unprogrammedMatches: boolean;
    notificationHours: number[];
}
export declare class NotificationManager {
    private static settings;
    /**
     * Obtener configuración de notificaciones de un usuario
     */
    static getSettings(userId: string): NotificationSettings;
    /**
     * Actualizar configuración de notificaciones
     */
    static updateSettings(userId: string, settings: Partial<NotificationSettings>): void;
    /**
     * Verificar si se puede enviar notificación en este momento
     */
    static canNotify(userId: string): boolean;
    /**
     * Exportar configuración
     */
    static toDict(): Record<string, NotificationSettings>;
    /**
     * Cargar configuración
     */
    static fromDict(data: Record<string, NotificationSettings>): void;
}
//# sourceMappingURL=NotificationSettings.d.ts.map