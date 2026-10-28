import { create } from 'zustand';

export type Formation = 'line' | 'wedge' | 'scatter' | 'orbit';

interface SpelljammerState {
    speed: number;
    formation: Formation;
    target: string | null;
    logs: string[];

    // Genome
    genome: any; // Using any for now to avoid circular dependency with All.tsx types
    setGenome: (g: any) => void;

    isNavMode: boolean;
    setNavMode: (active: boolean) => void;
}

export const useSpelljammerStore = create<SpelljammerState>((set) => ({
    speed: 1,
    formation: 'line',
    target: null,
    logs: [
        "> SPELLJAMMER OS v9.2 INITIALIZED...",
        "> CONNECTION ESTABLISHED: 10 AVATAR NODES",
        "> WAITING FOR COMMAND...",
    ],
    genome: null,
    isNavMode: false,

    addLog: (msg: string) => set((state) => ({
        logs: [...state.logs.slice(-4), `> ${msg}`]
    })),

    setFormation: (f: Formation) => {
        set({ formation: f });
    },

    setSpeed: (s: number) => set({ speed: s }),
    setGenome: (g: any) => set({ genome: g }),
    setNavMode: (active: boolean) => set({ isNavMode: active }),
}));
