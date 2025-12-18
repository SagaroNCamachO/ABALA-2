import { Championship } from '../models/Championship';
/**
 * Sistema de almacenamiento usando MongoDB.
 * Compatible con MongoDB Atlas (gratis) y MongoDB local.
 */
export declare class MongoDBStorage {
    private static client;
    private static db;
    private static readonly DB_NAME;
    private static readonly COLLECTION_NAME;
    /**
     * Conectar a MongoDB.
     */
    private static connect;
    /**
     * Obtener la colección de campeonatos.
     */
    private static getCollection;
    /**
     * Cargar todos los campeonatos desde MongoDB.
     */
    static load(): Promise<Map<string, Championship>>;
    /**
     * Guardar todos los campeonatos en MongoDB.
     */
    static save(championships: Map<string, Championship>): Promise<void>;
    /**
     * Deserializar un campeonato desde datos MongoDB.
     */
    private static deserializeChampionship;
    /**
     * Cerrar la conexión a MongoDB.
     */
    static close(): Promise<void>;
}
//# sourceMappingURL=MongoDBStorage.d.ts.map