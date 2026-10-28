
import { useState, useCallback, useEffect } from 'react';
import { isIgnoredPath } from '@Omni/utils/fileSystemUtils';
import { openDB } from 'idb';

export interface FileSystemNode {
    id: string;
    name: string;
    kind: 'file' | 'directory';
    handle: FileSystemFileHandle | FileSystemDirectoryHandle;
    path: string;
    type?: string;
    status?: 'pending' | 'analyzed' | 'skipped';
}

export const useLocalFileSystem = () => {
    const [fileNodes, setFileNodes] = useState<FileSystemNode[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);

    const scanDirectory = async (dirHandle: FileSystemDirectoryHandle, path: string = '', depth = 0): Promise<FileSystemNode[]> => {
        if (depth > 5) return []; // Safety limit
        if (isIgnoredPath(path)) return []; // Skip node_modules, .git, dist, etc.
        const nodes: FileSystemNode[] = [];

        for await (const entry of (dirHandle as any).values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
                const ext = entry.name.split('.').pop()?.toLowerCase();
                let type = 'unknown';
                if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) type = 'image';
                if (['txt', 'md', 'json', 'ts', 'tsx', 'js'].includes(ext || '')) type = 'text';

                nodes.push({
                    id: entryPath,
                    name: entry.name,
                    kind: 'file',
                    handle: entry as FileSystemFileHandle,
                    path: entryPath,
                    type
                });
            } else if (entry.kind === 'directory') {
                nodes.push({
                    id: entryPath,
                    name: entry.name,
                    kind: 'directory',
                    handle: entry as FileSystemDirectoryHandle,
                    path: entryPath
                });

                // Recurse into subdirectories
                const subNodes = await scanDirectory(entry as FileSystemDirectoryHandle, entryPath, depth + 1);
                nodes.push(...subNodes);
            }
        }
        return nodes;
    };

    const verifyPermission = async (fileHandle: FileSystemHandle, readWrite = true) => {
        const options: Record<string, string> = {
            mode: readWrite ? 'readwrite' : 'read'
        };
        // Check if permission was already granted
        // @ts-ignore
        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        // Request permission if not granted
        // @ts-ignore
        if ((await fileHandle.requestPermission(options)) === 'granted') {
            return true;
        }
        return false;
    };

    // Auto-mount on load if cached handle exists
    useEffect(() => {
        const autoMount = async () => {
            try {
                const db = await openDB('myos-idb', 1, {
                    upgrade(db) {
                        if (!db.objectStoreNames.contains('filesystem')) {
                            db.createObjectStore('filesystem');
                        }
                    },
                });
                const cachedHandle = await db.get('filesystem', 'hrmRootHandle');
                if (cachedHandle) {
                    // Try to restore access without a hard dialog popup
                    const hasPermission = await verifyPermission(cachedHandle);
                    if (hasPermission) {
                        setIsScanning(true);
                        setRootHandle(cachedHandle);
                        const nodes = await scanDirectory(cachedHandle);
                        setFileNodes(nodes);
                        setIsScanning(false);
                    }
                }
            } catch (err) {
                console.warn("Failed to auto-mount cached HRM directory:", err);
            }
        };
        autoMount();
    }, []);

    const mountDirectory = useCallback(async () => {
        try {
            setIsScanning(true);
            // @ts-ignore - Types might be missing in older TS/Browser envs
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            setRootHandle(dirHandle); // Store handle for writes

            // Cache the handle inside IndexedDB
            const db = await openDB('myos-idb', 1);
            await db.put('filesystem', dirHandle, 'hrmRootHandle');

            const nodes = await scanDirectory(dirHandle);
            setFileNodes(nodes);
            return nodes;
        } catch (err) {
            console.error("FileSystem Error:", err);
            return [];
        } finally {
            setIsScanning(false);
        }
    }, []);

    // Helper to get Blob URL for a node (async)
    const getFileUrl = async (node: FileSystemNode) => {
        if (node.kind !== 'file') return null;
        const file = await (node.handle as FileSystemFileHandle).getFile();
        return URL.createObjectURL(file);
    };

    // Helper to traverse path and get directory handle
    const getDirHandleForPath = async (handle: FileSystemDirectoryHandle, pathParts: string[], create = false) => {
        let current = handle;
        for (const part of pathParts) {
            // @ts-ignore
            current = await current.getDirectoryHandle(part, { create });
        }
        return current;
    };

    // Helper to read file content
    const readFile = useCallback(async (path: string): Promise<string | null> => {
        if (!rootHandle) return null;
        try {
            const parts = path.split('/');
            const filename = parts.pop()!;
            const dir = await getDirHandleForPath(rootHandle, parts);

            // @ts-ignore
            const fileHandle = await dir.getFileHandle(filename);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (e) {
            // console.warn("Read failed (might not exist)", path);
            return null;
        }
    }, [rootHandle]);

    // Helper to write file (Recursive)
    const writeFile = useCallback(async (path: string, content: string | Blob) => {
        if (!rootHandle) {
            console.warn("Write failed: No root directory mounted.");
            return false;
        }
        try {
            // Normalize path: handle both / and \ (Windows support), filter empty
            const parts = path.split(/[/\\]/).filter(p => p.length > 0 && !p.includes(':'));
            if (parts.length === 0) return false;

            const filename = parts.pop()!;
            // Ensure filename itself is valid (no restricted chars for FS API)
            const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_');

            const dir = parts.length > 0 ? await getDirHandleForPath(rootHandle, parts, true) : rootHandle;

            // @ts-ignore
            const fileHandle = await dir.getFileHandle(safeFilename, { create: true });
            // @ts-ignore
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            // Refresh list (Root only for now to avoid perf hit)
            // We rescan the ROOT handle to ensure the full tree is up to date
            if (rootHandle) {
                const nodes = await scanDirectory(rootHandle);
                setFileNodes(nodes);
            }
            console.log(`[Files] Successfully wrote to ${path}`);
            return true;
        } catch (e) {
            console.error("Write failed", e);
            return false;
        }
    }, [rootHandle]);

    return {
        mountDirectory,
        fileNodes,
        isScanning,
        getFileUrl,
        writeFile,
        readFile,
        isConnected: !!rootHandle
    };
};
