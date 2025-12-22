/**
 * Modelo de usuario para autenticación y permisos
 */
export declare enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    VIEWER = "viewer"
}
export interface User {
    id: string;
    username: string;
    email?: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
    lastLogin?: Date;
}
export interface ChampionshipPermission {
    championshipId: string;
    role: UserRole;
    grantedBy?: string;
    grantedAt: Date;
}
export declare class UserManager {
    private static users;
    private static permissions;
    /**
     * Verificar si ya existe un administrador
     */
    static hasAdmin(): boolean;
    /**
     * Crear un nuevo usuario
     * Solo permite crear ADMIN si no existe ninguno. Todos los demás usuarios serán VIEWER.
     */
    static createUser(username: string, password: string, email?: string, role?: UserRole): User;
    /**
     * Autenticar usuario
     */
    static authenticate(username: string, password: string): User | null;
    /**
     * Obtener usuario por ID
     */
    static getUser(userId: string): User | null;
    /**
     * Obtener usuario por username
     */
    static getUserByUsername(username: string): User | null;
    /**
     * Verificar si un usuario tiene permiso en un campeonato
     */
    static hasPermission(userId: string, championshipId: string, requiredRole: UserRole): boolean;
    /**
     * Otorgar permiso a un usuario en un campeonato
     */
    static grantPermission(userId: string, championshipId: string, role: UserRole, grantedBy: string): void;
    /**
     * Verificar si un rol tiene el permiso requerido
     */
    private static roleHasPermission;
    /**
     * Hash de contraseña simple (en producción usar bcrypt)
     */
    private static hashPassword;
    /**
     * Verificar contraseña
     */
    private static verifyPassword;
    /**
     * Exportar usuarios
     */
    static toDict(): {
        users: Record<string, any>;
        permissions: Record<string, Record<string, any>>;
    };
    /**
     * Cargar usuarios
     */
    static fromDict(data: {
        users: Record<string, any>;
        permissions: Record<string, Record<string, any>>;
    }): void;
}
//# sourceMappingURL=User.d.ts.map