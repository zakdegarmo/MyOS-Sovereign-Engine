
// Authentic MemOS Port
// Based on: MemOS/src/memos/mem_cube/general.py

export interface BaseMemoryConfig {
    backend: string; // 'local' | 'remote' | 'uninitialized'
}

export interface BaseTextMemory {
    add(content: string): void;
    // ... basic CRUD
}

export interface BaseActMemory {
    // Activation Memory (Short-term/Working)
    add(content: any): void;
    retrieve(query: string): any[];
}

export interface BaseParaMemory {
    // Parametric Memory (Long-term Knowledge)
    update(key: string, value: any): void;
}

export interface GeneralMemCubeConfig {
    cube_id: string;
    text_mem: BaseMemoryConfig;
    act_mem: BaseMemoryConfig;
    para_mem: BaseMemoryConfig;
    pref_mem: BaseMemoryConfig;
}

export class MemCube {
    public config: GeneralMemCubeConfig;

    // State validation
    private dirty: boolean = false;

    // IO Handlers (Injected from Context)
    private writeFile?: (path: string, content: string) => Promise<boolean>;
    private readFile?: (path: string) => Promise<string | null>;

    // The Four Pillars of MemOS Memory
    public text_mem: BaseTextMemory; // Working Logs / Chat
    public act_mem: BaseActMemory;   // Activation / Context
    public para_mem: BaseParaMemory; // Parametric / Knowledge Graph
    public pref_mem: BaseTextMemory; // User Preferences

    constructor(config: GeneralMemCubeConfig,
        writeFile?: (path: string, content: string) => Promise<boolean>,
        readFile?: (path: string) => Promise<string | null>) {
        this.config = config;
        this.writeFile = writeFile;
        this.readFile = readFile;

        // 1. TEXT MEMORY (Working Logs / Chat)
        this.text_mem = {
            add: (content: string) => {
                this.buffer.text.push(`[${new Date().toISOString()}] ${content}`);
                this.dirty = true;
            }
        };

        // 2. ACTIVATION MEMORY (Short-term context)
        this.act_mem = {
            add: (content: any) => {
                this.buffer.act.push({ ts: Date.now(), data: content });
                this.dirty = true;
            },
            retrieve: (query: string) => {
                return this.buffer.act.filter(i => JSON.stringify(i.data).includes(query));
            }
        };

        // 3. PARAMETRIC MEMORY (Long-term Knowledge / Graph)
        this.para_mem = {
            update: (key: string, value: any) => {
                this.buffer.para[key] = value;
                this.dirty = true;
            }
        };

        this.pref_mem = {
            add: (content: string) => { 
                // Using the text buffer for preferences for now, or we can use para.
                this.buffer.text.push(`[PREFERENCE] [${new Date().toISOString()}] ${content}`);
                this.dirty = true;
            }
        };
    }

    // In-Memory Buffer for the Session
    private buffer = {
        text: [] as string[],
        act: [] as any[],
        para: {} as Record<string, any>
    };

    public async load(dir: string) {
        if (!this.readFile) return;

        // Path normalization: Ensure no leading/double slashes except for absolute
        const cleanDir = dir.replace(/\/+$/, '') || '.';
        const targetPath = `${cleanDir}/memory_core.json`.replace(/\/+/g, '/');

        console.log(`[MemCube] Loading from ${targetPath}...`);

        try {
            // Try loading existing memory structure
            const data = await this.readFile(targetPath);
            if (data) {
                const parsed = JSON.parse(data);
                this.buffer = { ...this.buffer, ...parsed }; // Merge/Hydrate
            }
        } catch (e) {
            console.warn("[MemCube] No existing memory core found, starting fresh.");
        }
    }

    public async dump(dir: string): Promise<boolean> {
        if (!this.writeFile) {
            console.warn("[MemCube] Cannot Dump: No Write capability.");
            return false;
        }

        if (!this.dirty) {
            // No changes, skip write
            return true;
        }

        const cleanDir = dir.replace(/\/+$/, '') || '.';
        const targetPath = `${cleanDir}/memory_core.json`.replace(/\/+/g, '/');

        console.log(`[MemCube] Dumping to ${targetPath}...`);

        try {
            // Deterministic Dump: We write the state of the cube to the FS
            const payload = JSON.stringify(this.buffer, null, 2);

            // We write to a specific 'memory_core.json' in the target directory
            const success = await this.writeFile(targetPath, payload);

            if (success) {
                this.dirty = false;
            }
            return success;
        } catch (e) {
            console.error(`[MemCube] Dump failed on ${targetPath}`, e);
            return false;
        }
    }
}
