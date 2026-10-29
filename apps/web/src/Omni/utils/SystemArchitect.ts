
import { type AgentName } from '@Omni/lib/types/manifestation';
import { NexusRouter } from '@Unity/services/NexusRouter';

interface IndexResponse {
    success: boolean;
    count?: number;
    message: string;
}

interface FileNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: FileNode[];
}

export const SystemArchitect = {
    // 1. INDEX: Scan and Embed Codebase
    // Mapped to '/index' command
    indexCodebase: async (): Promise<string> => {
        try {
            // First, get structure
            const structRes = await fetch('/api/project-structure');
            const structure = await structRes.json();

            // Flatten to get file list
            const flatten = (arr: any[]): any[] => {
                let res: any[] = [];
                for (const item of arr) {
                    if (item.type === 'file' && !item.name.endsWith('.json') && !item.name.endsWith('.map')) {
                        res.push(item);
                    }
                    if (item.type === 'directory') res.push(...flatten(item.children));
                }
                return res;
            };

            const files = flatten(structure);
            const total = files.length;

            // Batch process (Server handles embedding, but we need to fetch content first?)
            // Actually, server has '/api/forge/ingest' which takes {path, content}
            // For a robust system, the server should read its own files if we pass paths, 
            // BUT our current server endpoint expects "files" array with content.
            // Let's modify the flow: We ask server to "Index Project" directly? 
            // Or we fetch content client side and send back? 
            // Server has 'fs', so it's better if we make a new endpoint '/api/forge/index-local' 
            // OR we iterate here. Iterating client side is safer for now as we have existing read-file logic.

            let processed = 0;
            const BATCH_SIZE = 5;

            for (let i = 0; i < files.length; i += BATCH_SIZE) {
                const batch = files.slice(i, i + BATCH_SIZE);
                const payload = [];

                for (const file of batch) {
                    try {
                        const readRes = await fetch(`/api/read-file?filepath=${encodeURIComponent(file.path)}`);
                        const readJson = await readRes.json();
                        if (readJson.content) {
                            payload.push({ path: file.path, content: readJson.content });
                        }
                    } catch (e) {
                        console.warn(`Failed to read ${file.path}`);
                    }
                }

                if (payload.length > 0) {
                    await fetch('/api/forge/ingest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ files: payload }) // API Key is optional/env on server usually, but we might need to pass it
                    });
                    processed += payload.length;
                }

                // Broadcast Progress via Nexus
                NexusRouter.emitPacket({
                    source: 'improvement',
                    target: 'global',
                    type: 'state_update',
                    payload: { tool: 'SystemIndexer', status: `Indexing ${processed}/${total} files...` }
                });
            }

            return `Indexing Complete. Processed ${processed} files into the Vector Database.`;

        } catch (error: any) {
            return `Indexing Failed: ${error.message}`;
        }
    },

    // 2. SEARCH: Semantic Query
    searchMemory: async (query: string): Promise<string> => {
        try {
            const res = await fetch('/api/forge/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, limit: 3 })
            });
            const json = await res.json();
            if (json.success) {
                return json.results.map((r: any) => `[${r.path}] (Score: ${r.score?.toFixed(2)}): ${r.content.substring(0, 200)}...`).join('\n');
            }
            return "No results found.";
        } catch (e: any) {
            return `Search Error: ${e.message}`;
        }
    },

    // 3. EXPLORE: Get File Tree
    getProjectStructure: async (): Promise<any[]> => {
        try {
            const res = await fetch('/api/project-structure');
            const tree = await res.json();

            // Transform to Flat Node Map for Graph
            const nodes: any[] = [];
            const process = (item: any, parentId: string | null = null, depth: number = 0) => {
                const id = item.path || item.name;
                // Simple vector heuristic based on depth
                const vector = {
                    x: (Math.random() - 0.5) * (depth * 10 + 10),
                    y: (Math.random() - 0.5) * (depth * 5 + 5),
                    z: (depth * 5)
                };

                nodes.push({
                    id: id,
                    name: item.name,
                    type: item.type,
                    parent: parentId,
                    depth,
                    vector,
                    children: item.children // Keep children for explorer
                });

                if (item.children) {
                    item.children.forEach((c: any) => process(c, id, depth + 1));
                }
            };

            // Root
            process({ name: 'root', type: 'directory', children: tree });
            return nodes;
        } catch (e) {
            console.error("Structure Fetch Failed:", e);
            return [];
        }
    }
};
