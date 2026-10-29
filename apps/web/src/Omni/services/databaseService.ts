import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface NexusDB extends DBSchema {
    files: {
        key: string;
        value: {
            id: string; // Path or UUID
            path: string;
            content: string | Blob; // Supports full text or binary
            type: string; // 'text/plain', 'application/json', etc.
            hash?: string; // For change detection
            vector?: Float32Array; // For future semantic search
            lastModified: number;
            metadata?: any; // Extra AI tags
        };
        indexes: { 'by-path': string };
    };
}

const DB_NAME = 'MyOS_Nexus_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NexusDB>>;

export const databaseService = {
    // Initialize DB
    init: () => {
        if (!dbPromise) {
            dbPromise = openDB<NexusDB>(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    // Create object store if it doesn't exist
                    if (!db.objectStoreNames.contains('files')) {
                        const store = db.createObjectStore('files', { keyPath: 'id' });
                        store.createIndex('by-path', 'path');
                    }
                },
            });
        }
        return dbPromise;
    },

    // Save a single file
    putFile: async (file: NexusDB['files']['value']) => {
        const db = await databaseService.init();
        return db.put('files', file);
    },

    // Get a single file
    getFile: async (id: string) => {
        const db = await databaseService.init();
        return db.get('files', id);
    },

    // Get all files (careful with large DBs)
    getAllFiles: async () => {
        const db = await databaseService.init();
        return db.getAll('files');
    },

    // Delete a file
    deleteFile: async (id: string) => {
        const db = await databaseService.init();
        return db.delete('files', id);
    },

    // Clear all
    clear: async () => {
        const db = await databaseService.init();
        return db.clear('files');
    }
};
