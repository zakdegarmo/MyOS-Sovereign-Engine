import { useState, useEffect, useCallback } from 'react';

export interface DesktopFile {
    name: string;
    path: string;
    isShortcut: boolean;
    isDirectory: boolean;
    target: string | null;
    size?: number;
    extension?: string;
}

const FALLBACK_DESKTOP_FILES: DesktopFile[] = [
    { name: 'Printer Panic', path: 'C:\\Users\\zakde\\Desktop\\Printer Panic.lnk', isShortcut: true, isDirectory: false, target: 'printer_panic', size: 2048, extension: '.lnk' },
    { name: 'AntiGravity projects', path: 'C:\\Users\\zakde\\Desktop\\AntiGravity projects', isShortcut: false, isDirectory: true, target: null, size: 1, extension: '' },
    { name: 'dosgames', path: 'C:\\Users\\zakde\\Desktop\\dosgames', isShortcut: false, isDirectory: true, target: null, size: 1, extension: '' },
    { name: 'Zsnes', path: 'C:\\Users\\zakde\\Desktop\\Zsnes', isShortcut: false, isDirectory: true, target: null, size: 1, extension: '' },
    { name: 'Blender 5.2.lnk', path: 'C:\\Users\\zakde\\Desktop\\Blender 5.2.lnk', isShortcut: true, isDirectory: false, target: 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender-launcher.exe', size: 1198, extension: '.lnk' },
    { name: 'HACKERS ROOT ACCESS.txt', path: 'C:\\Users\\zakde\\Desktop\\HACKERS ROOT ACCESS.txt', isShortcut: false, isDirectory: false, target: null, size: 38690, extension: '.txt' },
    { name: 'MapTool.lnk', path: 'C:\\Users\\zakde\\Desktop\\MapTool.lnk', isShortcut: true, isDirectory: false, target: 'C:\\Users\\zakde\\AppData\\Local\\MapTool\\MapTool.exe', size: 1870, extension: '.lnk' },
    { name: 'notepad - Shortcut.lnk', path: 'C:\\Users\\zakde\\Desktop\\notepad - Shortcut.lnk', isShortcut: true, isDirectory: false, target: 'C:\\Users\\zakde\\Desktop\\AntiGravity projects\\GitHub Clones\\Zak\'s Notepad\\notepad.html', size: 1760, extension: '.lnk' },
    { name: 'snes9x-x64.exe - Shortcut.lnk', path: 'C:\\Users\\zakde\\Desktop\\snes9x-x64.exe - Shortcut.lnk', isShortcut: true, isDirectory: false, target: 'C:\\Users\\zakde\\Desktop\\Zsnes\\snes9x-x64.exe', size: 1046, extension: '.lnk' },
    { name: 'start GenX server command.txt', path: 'C:\\Users\\zakde\\Desktop\\start GenX server command.txt', isShortcut: false, isDirectory: false, target: null, size: 55, extension: '.txt' }
];

export function useDesktopFiles() {
    const [files, setFiles] = useState<DesktopFile[]>(FALLBACK_DESKTOP_FILES);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [history, setHistory] = useState<string[]>([]);

    const fetchFiles = useCallback(async (path: string = '') => {
        setIsLoading(true);
        setError(null);
        
        const candidateEndpoints = [
            path ? `/api/desktop/files?path=${encodeURIComponent(path)}` : '/api/desktop/files',
            path ? `http://localhost:8081/api/desktop/files?path=${encodeURIComponent(path)}` : 'http://localhost:8081/api/desktop/files'
        ];

        let fetchedData = null;
        for (const endpoint of candidateEndpoints) {
            try {
                const res = await fetch(endpoint);
                if (res.ok) {
                    fetchedData = await res.json();
                    break;
                }
            } catch (_) {
                // Try next endpoint
            }
        }

        try {
            if (fetchedData !== null) {
                if (Array.isArray(fetchedData)) {
                    setFiles(fetchedData);
                } else if (fetchedData && typeof fetchedData === 'object') {
                    setFiles([fetchedData]);
                } else {
                    setFiles(FALLBACK_DESKTOP_FILES);
                }
            } else {
                console.warn('[useDesktopFiles] Both endpoints unreachable, retaining resilient desktop items.');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('[useDesktopFiles] Processing error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const navigateTo = useCallback((path: string) => {
        setHistory(prev => [...prev, currentPath]);
        setCurrentPath(path);
        fetchFiles(path);
    }, [currentPath, fetchFiles]);

    const goBack = useCallback(() => {
        setHistory(prev => {
            const newHistory = [...prev];
            const lastPath = newHistory.pop() || '';
            setCurrentPath(lastPath);
            fetchFiles(lastPath);
            return newHistory;
        });
    }, [fetchFiles]);

    useEffect(() => {
        fetchFiles(currentPath);
        // Optional: refresh every 30 seconds
        const interval = setInterval(() => fetchFiles(currentPath), 30000);
        return () => clearInterval(interval);
    }, [fetchFiles, currentPath]);

    return { 
        files, 
        isLoading, 
        error, 
        refresh: () => fetchFiles(currentPath),
        currentPath,
        history,
        navigateTo,
        goBack,
        canGoBack: history.length > 0
    };
}
