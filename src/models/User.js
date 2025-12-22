"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = exports.UserRole = void 0;
/**
 * Modelo de usuario para autenticación y permisos
 */
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["EDITOR"] = "editor";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
class UserManager {
    /**
     * Crear un nuevo usuario
     */
    static createUser(username, password, email, role = UserRole.VIEWER) {
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const user = {
            id,
            username,
            email,
            passwordHash: this.hashPassword(password), // En producción usar bcrypt
            role,
            createdAt: new Date()
        };
        this.users.set(id, user);
        return user;
    }
    /**
     * Autenticar usuario
     */
    static authenticate(username, password) {
        for (const user of this.users.values()) {
            if (user.username === username && this.verifyPassword(password, user.passwordHash)) {
                user.lastLogin = new Date();
                return user;
            }
        }
        return null;
    }
    /**
     * Obtener usuario por ID
     */
    static getUser(userId) {
        return this.users.get(userId) || null;
    }
    /**
     * Obtener usuario por username
     */
    static getUserByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return null;
    }
    /**
     * Verificar si un usuario tiene permiso en un campeonato
     */
    static hasPermission(userId, championshipId, requiredRole) {
        const user = this.getUser(userId);
        if (!user)
            return false;
        // Admin tiene todos los permisos
        if (user.role === UserRole.ADMIN)
            return true;
        // Verificar permiso específico del campeonato
        const userPermissions = this.permissions.get(userId);
        if (userPermissions) {
            const permission = userPermissions.get(championshipId);
            if (permission) {
                return this.roleHasPermission(permission.role, requiredRole);
            }
        }
        // Si no hay permiso específico, usar el rol del usuario
        return this.roleHasPermission(user.role, requiredRole);
    }
    /**
     * Otorgar permiso a un usuario en un campeonato
     */
    static grantPermission(userId, championshipId, role, grantedBy) {
        if (!this.permissions.has(userId)) {
            this.permissions.set(userId, new Map());
        }
        const userPermissions = this.permissions.get(userId);
        userPermissions.set(championshipId, {
            championshipId,
            role,
            grantedBy,
            grantedAt: new Date()
        });
    }
    /**
     * Verificar si un rol tiene el permiso requerido
     */
    static roleHasPermission(userRole, requiredRole) {
        const roleHierarchy = {
            [UserRole.ADMIN]: 3,
            [UserRole.EDITOR]: 2,
            [UserRole.VIEWER]: 1
        };
        return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    }
    /**
     * Hash de contraseña simple (en producción usar bcrypt)
     */
    static hashPassword(password) {
        // Implementación simple - EN PRODUCCIÓN USAR bcrypt
        // Usar Buffer en Node.js en lugar de btoa
        return Buffer.from(password + 'salt_abala_2025').toString('base64');
    }
    /**
     * Verificar contraseña
     */
    static verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
    /**
     * Exportar usuarios
     */
    static toDict() {
        const users = {};
        for (const [id, user] of this.users.entries()) {
            users[id] = {
                ...user,
                createdAt: user.createdAt.toISOString(),
                lastLogin: user.lastLogin?.toISOString()
            };
        }
        const permissions = {};
        for (const [userId, userPerms] of this.permissions.entries()) {
            permissions[userId] = {};
            for (const [champId, perm] of userPerms.entries()) {
                permissions[userId][champId] = {
                    ...perm,
                    grantedAt: perm.grantedAt.toISOString()
                };
            }
        }
        return { users, permissions };
    }
    /**
     * Cargar usuarios
     */
    static fromDict(data) {
        this.users.clear();
        this.permissions.clear();
        for (const [id, userData] of Object.entries(data.users || {})) {
            this.users.set(id, {
                ...userData,
                createdAt: new Date(userData.createdAt),
                lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined
            });
        }
        for (const [userId, userPerms] of Object.entries(data.permissions || {})) {
            const permMap = new Map();
            for (const [champId, permData] of Object.entries(userPerms)) {
                permMap.set(champId, {
                    ...permData,
                    grantedAt: new Date(permData.grantedAt)
                });
            }
            this.permissions.set(userId, permMap);
        }
    }
}
exports.UserManager = UserManager;
UserManager.users = new Map();
UserManager.permissions = new Map(); // userId -> championshipId -> permission
//# sourceMappingURL=User.js.map