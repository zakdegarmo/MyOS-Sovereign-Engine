
import type { UserGestalt } from '@Omni/types';

// --- PERSISTENCE ---

export interface SystemState {
    timestamp: number;
    gestalt: UserGestalt;
    memories: any[]; // Journal Entries
    // Future: Library Snapshot
}

export const saveSystemState = async (state: SystemState, filename: string = 'myos_core.json') => {
    try {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });

        // Use File System Access API if available for "Save As" experience
        // @ts-ignore
        if (window.showSaveFilePicker) {
            // @ts-ignore
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'MyOS Neural Core',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return true;
        } else {
            // Fallback: Download Link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        }
    } catch (err) {
        console.error("Save Failed:", err);
        return false;
    }
};

export const loadSystemState = async (): Promise<SystemState | null> => {
    try {
        let file: File;

        // @ts-ignore
        if (window.showOpenFilePicker) {
            // @ts-ignore
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'MyOS Neural Core',
                    accept: { 'application/json': ['.json'] },
                }],
                multiple: false
            });
            file = await handle.getFile();
        } else {
            // We can't easily trigger a file input from a pure function without UI interaction context usually,
            // but we will assume the browser API is present for this "Local First" app.
            // If not, the UI should provide an <input type="file" /> fallback.
            alert("File System API not supported. Please use Chrome/Edge.");
            return null;
        }

        const text = await file.text();
        const data = JSON.parse(text);

        // Basic Validation
        if (!data.gestalt || !data.memories) {
            throw new Error("Invalid Core File");
        }

        return data;

    } catch (err) {
        console.error("Load Failed:", err);
        return null;
    }
};

// --- GRUBBER (The Filter) ---

const RELEVANT_EXTENSIONS = new Set([
    'md', 'txt', 'json', 'ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', // Code
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', // Images
    'pdf', 'docx' // Docs
]);

const IGNORED_DIRS = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'tmp', 'temp', 'bin', 'obj'
]);

export const grubFile = (file: File): { keep: boolean; reason?: string } => {
    // 1. Check Extension
    const parts = file.name.split('.');
    const ext = parts.pop()?.toLowerCase();

    if (!ext || !RELEVANT_EXTENSIONS.has(ext)) {
        return { keep: false, reason: 'irrelevant_extension' };
    }

    // 2. Check Size (e.g. skip > 10MB to avoid browser crash)
    if (file.size > 10 * 1024 * 1024) {
        return { keep: false, reason: 'too_large' };
    }

    return { keep: true };
};

export const isIgnoredPath = (path: string): boolean => {
    const segments = path.split('/');
    return segments.some(seg => IGNORED_DIRS.has(seg));
};

// --- BATCHING (The Prepacker) ---

export interface FileBatch {
    id: string; // Batch ID
    files: string[]; // List of file paths included
    content: string; // The giant prompt string
}

const MAX_BATCH_SIZE = 50000; // ~12k tokens (Safe for Gemini Flash)

export const readFileContent = async (handle: FileSystemFileHandle): Promise<string> => {
    try {
        const file = await handle.getFile();
        return await file.text();
    } catch (e) {
        console.warn("Read Error:", e);
        return "";
    }
};

export const batchFiles = async (nodes: any[]): Promise<FileBatch[]> => {
    const batches: FileBatch[] = [];
    let currentBatchContent = "";
    let currentBatchFiles: string[] = [];

    for (const node of nodes) {
        if (node.kind !== 'file') continue;

        const text = await readFileContent(node.handle);
        if (!text) continue; // Skip empty/binary read errors

        // Format: separator + content
        const fileBlock = `\n--- START FILE: ${node.path} ---\n${text}\n--- END FILE ---\n`;

        // Check Overflow
        if (currentBatchContent.length + fileBlock.length > MAX_BATCH_SIZE) {
            // Push current batch if not empty
            if (currentBatchFiles.length > 0) {
                batches.push({
                    id: `batch-${Date.now()}-${batches.length}`,
                    files: [...currentBatchFiles],
                    content: currentBatchContent
                });
            }
            // Reset
            currentBatchContent = "";
            currentBatchFiles = [];
        }

        // Add to current
        currentBatchContent += fileBlock;
        currentBatchFiles.push(node.path);
    }

    // Push final partial batch
    if (currentBatchFiles.length > 0) {
        batches.push({
            id: `batch-${Date.now()}-${batches.length}`,
            files: [...currentBatchFiles],
            content: currentBatchContent
        });
    }

    return batches;
};
