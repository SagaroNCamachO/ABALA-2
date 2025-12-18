import { Championship } from '../models/Championship';
/**
 * Sistema de almacenamiento persistente para campeonatos.
 * Guarda los datos en un archivo JSON en el servidor.
 */
export declare class ChampionshipStorage {
    private static readonly STORAGE_DIR;
    private static readonly STORAGE_FILE;
    /**
     * Asegura que el directorio de almacenamiento existe.
     */
    private static ensureStorageDir;
    /**
     * Cargar todos los campeonatos desde el archivo de almacenamiento.
     */
    static load(): Map<string, Championship>;
    /**
     * Guardar todos los campeonatos en el archivo de almacenamiento.
     */
    static save(championships: Map<string, Championship>): void;
    /**
     * Deserializar un campeonato desde datos JSON.
     */
    private static deserializeChampionship;
}
//# sourceMappingURL=ChampionshipStorage.d.ts.map