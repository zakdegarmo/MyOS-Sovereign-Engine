import { useState, useCallback, useEffect } from 'react';
import { databaseService } from '../services/databaseService';

export interface StoredFile {
    id: string;
    path: string;
    content: string | Blob;
    type: string;
    lastModified: number;
    metadata?: any;
}

export const useDatabase = () => {
    const [isReady, setIsReady] = useState(false);

    // Init on mount
    useEffect(() => {
        databaseService.init().then(() => setIsReady(true));
    }, []);

    const saveFile = useCallback(async (file: StoredFile) => {
        if (!isReady) return;
        await databaseService.putFile(file);
        console.log(`[DB] Saved ${file.path}`);
    }, [isReady]);

    const getFile = useCallback(async (id: string) => {
        if (!isReady) return null;
        return await databaseService.getFile(id);
    }, [isReady]);

    const getAllFiles = useCallback(async () => {
        if (!isReady) return [];
        return await databaseService.getAllFiles();
    }, [isReady]);

    return {
        isReady,
        saveFile,
        getFile,
        getAllFiles
    };
};
