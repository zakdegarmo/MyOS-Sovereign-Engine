import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Manually define StateStorage to avoid problematic imports in Vite
interface StateStorage {
    getItem: (name: string) => string | null | Promise<string | null>;
    setItem: (name: string, value: string) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
}

// Throttled bridge writer to prevent 60FPS filesystem spam
let timeout: any;
let pendingValue: string | null = null;

const bridgeStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            const res = await fetch('http://localhost:8081/api/fs/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `apps/web/public/data/${name}.json` })
            });
            if (!res.ok) {
                return localStorage.getItem(name);
            }
            const data = await res.json();
            return data.content;
        } catch (e) {
            console.warn("Failed to read from bridgeStorage", e);
            return localStorage.getItem(name);
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        // Save state directly to localStorage for instant local persistence
        localStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        localStorage.removeItem(name);
    },
};

interface PersistentWorldState {
    playerPos: [number, number, number];
    playerRot: number;
    cameraZoom: number;
    agentPositions: Record<string, [number, number, number]>;
    _hasHydrated: boolean;
    environmentSpec?: {
        terrainHeight: number;
        terrainScale: number;
        grassColor: string;
        dirtColor: string;
        stoneColor: string;
    };
    setPlayerPos: (pos: [number, number, number]) => void;
    setPlayerRot: (rot: number) => void;
    setCameraZoom: (zoom: number) => void;
    setAgentPosition: (id: string, pos: [number, number, number]) => void;
    setHasHydrated: (state: boolean) => void;
    setEnvironmentSpec: (spec: any) => void;
}

export const usePersistentWorldStore = create<PersistentWorldState>()(
    persist(
        (set) => ({
            playerPos: [0, 0.1, 0],
            playerRot: 0,
            cameraZoom: 1.0,
            agentPositions: {},
            _hasHydrated: false,
            environmentSpec: {
                terrainHeight: 25.0,
                terrainScale: 0.005,
                grassColor: "#1a4d1a",
                dirtColor: "#4d331a",
                stoneColor: "#4d4d4d",
            },
            setPlayerPos: (pos) => set({ playerPos: pos }),
            setPlayerRot: (rot) => set({ playerRot: rot }),
            setCameraZoom: (zoom) => set({ cameraZoom: zoom }),
            setAgentPosition: (id, pos) => set((state) => ({ agentPositions: { ...state.agentPositions, [id]: pos } })),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            setEnvironmentSpec: (spec) => set((state) => ({ environmentSpec: { ...state.environmentSpec, ...spec } })),
        }),
        {
            name: 'world-state', // Becomes apps/web/world-state.json
            storage: bridgeStorage,
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated(true);
                }
            }
        }
    )
);
