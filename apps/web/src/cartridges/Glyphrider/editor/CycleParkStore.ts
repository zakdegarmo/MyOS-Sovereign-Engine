// apps/web/src/cartridges/Glyphrider/editor/CycleParkStore.ts
import { create } from 'zustand';
import * as THREE from 'three';
import { topographyRegistry } from '../../../engine/TopographyRegistry';

export type ObstacleType = 
    | 'kicker'
    | 'quarterpipe'
    | 'halfpipe'
    | 'spine'
    | 'rail_straight'
    | 'rail_kinked'
    | 'funbox'
    | 'tire_bowl'
    | 'polyhedral_cube'
    | 'polyhedral_tetra';

export type MaterialKey = 
    | 'plywood'
    | 'galvanized_steel'
    | 'rusty_iron'
    | 'concrete'
    | 'neon_cyan'
    | 'toxic_magenta';

export interface PlacedObstacle {
    id: string;
    type: ObstacleType;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    materialKey: MaterialKey;
    customProps?: Record<string, any>;
}

export interface CycleParkManifest {
    version: string;
    name: string;
    createdAt: string;
    modifiedAt: string;
    obstacles: PlacedObstacle[];
    environment: {
        lightingTheme: 'studio_clean' | 'twilight_outlaw' | 'neon_synthwave';
        floorMaterial: MaterialKey;
    };
}

export interface CycleParkState {
    // Mode
    mode: 'edit' | 'ride';
    setMode: (mode: 'edit' | 'ride') => void;
    toggleMode: () => void;

    // Transform Controls
    transformMode: 'translate' | 'rotate' | 'scale';
    setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    gridSize: number;
    setGridSize: (size: number) => void;

    // Active Selection
    selectedId: string | null;
    selectObstacle: (id: string | null) => void;

    // Objects
    obstacles: PlacedObstacle[];
    addObstacle: (type: ObstacleType, position?: [number, number, number]) => string;
    updateObstacle: (id: string, updates: Partial<PlacedObstacle>) => void;
    removeObstacle: (id: string) => void;
    duplicateObstacle: (id: string) => string | null;
    clearPark: () => void;

    // Manifest
    activeManifestName: string;
    exportManifest: () => CycleParkManifest;
    importManifest: (manifest: CycleParkManifest) => void;
    loadPreset: (presetName: string) => void;

    // History (Undo / Redo)
    history: PlacedObstacle[][];
    historyIndex: number;
    undo: () => void;
    redo: () => void;
    pushHistory: (obstacles: PlacedObstacle[]) => void;

    // Topography Sync
    syncTopography: () => void;
}

// Built-in starter preset scaled for the 3.0m hero unicycle
const DEFAULT_OBSTACLES: PlacedObstacle[] = [
    // Central Funbox (18m x 18m)
    {
        id: 'obs_funbox_center',
        type: 'funbox',
        name: 'Grand Central Funbox',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        materialKey: 'concrete'
    },
    // Approach Wedge Kicker (Pointing towards the funbox from South runway at Z = +26)
    {
        id: 'obs_kicker_approach',
        type: 'kicker',
        name: 'Mega Wedge Kicker',
        position: [0, 0, 26],
        rotation: [0, Math.PI, 0],
        scale: [1, 1, 1],
        materialKey: 'plywood'
    },
    // North Vert Half-Pipe (Behind funbox at North Z = -36)
    {
        id: 'obs_halfpipe_north',
        type: 'halfpipe',
        name: 'X-Games Vert Half-Pipe',
        position: [0, 0, -36],
        rotation: [0, Math.PI / 2, 0],
        scale: [1, 1, 1],
        materialKey: 'plywood'
    },
    // East Straight Coping Rail (Axle height 1.4m, Length 20m)
    {
        id: 'obs_rail_east',
        type: 'rail_straight',
        name: 'East Coping Flat Rail',
        position: [16, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        materialKey: 'galvanized_steel'
    },
    // West Outlaw Kinked Rail (Length 24m)
    {
        id: 'obs_rail_west',
        type: 'rail_kinked',
        name: 'West Outlaw Kinked Rail',
        position: [-16, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        materialKey: 'rusty_iron'
    },
    // South-West Giant Earthmover Tire Bowl (Radius 14m)
    {
        id: 'obs_tire_bowl_sw',
        type: 'tire_bowl',
        name: 'Giant Earthmover Tire Bowl',
        position: [-28, 0, 24],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        materialKey: 'rusty_iron'
    },
    // North-East Spine Transfer Ramp
    {
        id: 'obs_spine_ne',
        type: 'spine',
        name: 'Aero Spine Transfer',
        position: [28, 0, -24],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        materialKey: 'plywood'
    },
    // 2.5D Quantum Billboard Cube
    {
        id: 'obs_polyhedral_cube',
        type: 'polyhedral_cube',
        name: '2.5D Quantum Billboard Cube',
        position: [28, 6.0, 0],
        rotation: [0, 0.4, 0],
        scale: [2.0, 2.0, 2.0],
        materialKey: 'neon_cyan'
    }
];

export const useCycleParkStore = create<CycleParkState>((set, get) => ({
    mode: 'edit',
    setMode: (mode) => set({ mode }),
    toggleMode: () => {
        const next = get().mode === 'edit' ? 'ride' : 'edit';
        set({ mode: next });
    },

    transformMode: 'translate',
    setTransformMode: (transformMode) => set({ transformMode }),
    snapToGrid: true,
    setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
    gridSize: 1.0,
    setGridSize: (gridSize) => set({ gridSize }),

    selectedId: 'obs_funbox_center',
    selectObstacle: (selectedId) => set({ selectedId }),

    obstacles: DEFAULT_OBSTACLES,
    activeManifestName: 'Downtown Outlaw Park',

    history: [DEFAULT_OBSTACLES],
    historyIndex: 0,

    pushHistory: (newObstacles: PlacedObstacle[]) => {
        const { history, historyIndex } = get();
        const trimmed = history.slice(0, historyIndex + 1);
        set({
            history: [...trimmed, newObstacles],
            historyIndex: trimmed.length
        });
    },

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
            const nextIdx = historyIndex - 1;
            const state = history[nextIdx];
            set({ obstacles: state, historyIndex: nextIdx });
            get().syncTopography();
        }
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            const nextIdx = historyIndex + 1;
            const state = history[nextIdx];
            set({ obstacles: state, historyIndex: nextIdx });
            get().syncTopography();
        }
    },

    addObstacle: (type, position) => {
        const id = `obs_${type}_${Date.now().toString(36)}`;
        const pos: [number, number, number] = position || [0, 0, 0];
        const newObs: PlacedObstacle = {
            id,
            type,
            name: `${type.toUpperCase()} #${get().obstacles.length + 1}`,
            position: pos,
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            materialKey: 'plywood'
        };

        const nextList = [...get().obstacles, newObs];
        set({
            obstacles: nextList,
            selectedId: id
        });
        get().pushHistory(nextList);
        get().syncTopography();
        return id;
    },

    updateObstacle: (id, updates) => {
        const list = get().obstacles.map(obs => {
            if (obs.id === id) {
                return { ...obs, ...updates };
            }
            return obs;
        });
        set({ obstacles: list });
        get().syncTopography();
    },

    removeObstacle: (id) => {
        const list = get().obstacles.filter(obs => obs.id !== id);
        set({
            obstacles: list,
            selectedId: get().selectedId === id ? null : get().selectedId
        });
        get().pushHistory(list);
        get().syncTopography();
    },

    duplicateObstacle: (id) => {
        const target = get().obstacles.find(o => o.id === id);
        if (!target) return null;
        const newId = `obs_${target.type}_${Date.now().toString(36)}`;
        const dup: PlacedObstacle = {
            ...target,
            id: newId,
            name: `${target.name} (Copy)`,
            position: [target.position[0] + 1.5, target.position[1], target.position[2] + 1.5]
        };
        const nextList = [...get().obstacles, dup];
        set({
            obstacles: nextList,
            selectedId: newId
        });
        get().pushHistory(nextList);
        get().syncTopography();
        return newId;
    },

    clearPark: () => {
        set({ obstacles: [], selectedId: null });
        get().pushHistory([]);
        get().syncTopography();
    },

    exportManifest: () => {
        const { obstacles, activeManifestName } = get();
        return {
            version: '1.0.0',
            name: activeManifestName,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            obstacles,
            environment: {
                lightingTheme: 'studio_clean',
                floorMaterial: 'concrete'
            }
        };
    },

    importManifest: (manifest) => {
        if (!manifest || !Array.isArray(manifest.obstacles)) return;
        set({
            obstacles: manifest.obstacles,
            activeManifestName: manifest.name || 'Imported Park',
            selectedId: manifest.obstacles[0]?.id || null
        });
        get().pushHistory(manifest.obstacles);
        get().syncTopography();
    },

    loadPreset: (_presetName) => {
        set({
            obstacles: DEFAULT_OBSTACLES,
            selectedId: 'obs_funbox_center',
            activeManifestName: 'Downtown Outlaw Park'
        });
        get().pushHistory(DEFAULT_OBSTACLES);
        get().syncTopography();
    },

    syncTopography: () => {
        const { obstacles } = get();

        // Register custom elevation calculator for the cycle_park dimension
        topographyRegistry.register({
            id: 'cycle_park',
            projection: 'flat',
            getElevation: (x: number, z: number): number => {
                let maxElev = 0.0;

                for (const obs of obstacles) {
                    const [ox, oy, oz] = obs.position;
                    const [sx, sy, sz] = obs.scale;
                    const rotY = obs.rotation[1];

                    // Transform (x, z) into obstacle's local frame
                    const dx = x - ox;
                    const dz = z - oz;
                    const cosR = Math.cos(-rotY);
                    const sinR = Math.sin(-rotY);
                    const lx = dx * cosR - dz * sinR;
                    const lz = dx * sinR + dz * cosR;

                    // 1. KICKER RAMP
                    // Width = 8.0 * sx, Length = 14.0 * sz, Height = 4.5 * sy
                    // Front entry at lz = -7.0*sz (y=0), Takeoff lip at lz = 7.0*sz (y=4.5*sy)
                    if (obs.type === 'kicker') {
                        const halfW = 4.0 * sx;
                        const halfL = 7.0 * sz;
                        const rampH = 4.5 * sy;
                        if (Math.abs(lx) <= halfW && lz >= -halfL && lz <= halfL) {
                            const t = (lz + halfL) / (2.0 * halfL);
                            const elev = oy + t * rampH;
                            if (elev > maxElev) maxElev = elev;
                        }
                    }

                    // 2. QUARTER-PIPE
                    // Width = 16.0 * sx, Run = 10.0 * sz, Deck = 3.0 * sz, Height = 6.5 * sy
                    // Entry at lz = -5.0*sz (y=0), Lip at lz = 5.0*sz (y=6.5*sy), Deck to lz = 8.0*sz
                    else if (obs.type === 'quarterpipe') {
                        const halfW = 8.0 * sx;
                        const halfL = 5.0 * sz;
                        const deckL = 3.0 * sz;
                        const pipeH = 6.5 * sy;
                        if (Math.abs(lx) <= halfW) {
                            if (lz >= -halfL && lz <= halfL) {
                                const t = (lz + halfL) / (2.0 * halfL);
                                const elev = oy + pipeH * (1.0 - Math.cos(t * Math.PI * 0.5));
                                if (elev > maxElev) maxElev = elev;
                            } else if (lz > halfL && lz <= halfL + deckL) {
                                const elev = oy + pipeH;
                                if (elev > maxElev) maxElev = elev;
                            }
                        }
                    }

                    // 3. HALF-PIPE
                    // Width = 18.0 * sx, Channel = 6.0 * sz, Run = 10.0 * sz, Deck = 3.0 * sz, Height = 7.0 * sy
                    // Flat channel: lz in [-3.0*sz, 3.0*sz]
                    // North transition: lz in [3.0*sz, 13.0*sz], Deck in [13.0*sz, 16.0*sz]
                    // South transition: lz in [-13.0*sz, -3.0*sz], Deck in [-16.0*sz, -13.0*sz]
                    else if (obs.type === 'halfpipe') {
                        const halfW = 9.0 * sx;
                        const halfC = 3.0 * sz;
                        const runL = 10.0 * sz;
                        const deckL = 3.0 * sz;
                        const pipeH = 7.0 * sy;
                        if (Math.abs(lx) <= halfW) {
                            if (Math.abs(lz) <= halfC) {
                                if (oy > maxElev) maxElev = oy;
                            } else if (lz > halfC && lz <= halfC + runL) {
                                const t = (lz - halfC) / runL;
                                const elev = oy + pipeH * (1.0 - Math.cos(t * Math.PI * 0.5));
                                if (elev > maxElev) maxElev = elev;
                            } else if (lz > halfC + runL && lz <= halfC + runL + deckL) {
                                const elev = oy + pipeH;
                                if (elev > maxElev) maxElev = elev;
                            } else if (lz < -halfC && lz >= -halfC - runL) {
                                const t = (-lz - halfC) / runL;
                                const elev = oy + pipeH * (1.0 - Math.cos(t * Math.PI * 0.5));
                                if (elev > maxElev) maxElev = elev;
                            } else if (lz < -halfC - runL && lz >= -halfC - runL - deckL) {
                                const elev = oy + pipeH;
                                if (elev > maxElev) maxElev = elev;
                            }
                        }
                    }

                    // 4. SPINE TRANSFER
                    // Width = 16.0 * sx, Run = 8.0 * sz each side, Height = 6.0 * sy
                    else if (obs.type === 'spine') {
                        const halfW = 8.0 * sx;
                        const runL = 8.0 * sz;
                        const spineH = 6.0 * sy;
                        if (Math.abs(lx) <= halfW && Math.abs(lz) <= runL) {
                            const t = 1.0 - Math.abs(lz) / runL;
                            const elev = oy + spineH * Math.sin(t * Math.PI * 0.5);
                            if (elev > maxElev) maxElev = elev;
                        }
                    }

                    // 5. STRAIGHT GRIND RAIL
                    // Width snap = 0.6m, Length = 20.0 * sz, Height = 1.4 * sy
                    else if (obs.type === 'rail_straight') {
                        const halfW = 0.6 * sx;
                        const halfL = 10.0 * sz;
                        const railH = 1.4 * sy;
                        if (Math.abs(lx) <= halfW && Math.abs(lz) <= halfL) {
                            const elev = oy + railH;
                            if (elev > maxElev) maxElev = elev;
                        }
                    }

                    // 6. KINKED GRIND RAIL
                    // Length = 24.0 * sz, High = 2.4 * sy, Low = 1.3 * sy
                    // lz in [-12*sz, -5*sz]: high flat (2.4m)
                    // lz in [-5*sz, 3*sz]: slope down
                    // lz in [3*sz, 12*sz]: low flat (1.3m)
                    else if (obs.type === 'rail_kinked') {
                        const halfW = 0.6 * sx;
                        const highH = 2.4 * sy;
                        const lowH = 1.3 * sy;
                        if (Math.abs(lx) <= halfW && lz >= -12.0 * sz && lz <= 12.0 * sz) {
                            let rH = lowH;
                            if (lz <= -5.0 * sz) {
                                rH = highH;
                            } else if (lz < 3.0 * sz) {
                                const t = (lz - (-5.0 * sz)) / (8.0 * sz);
                                rH = highH - t * (highH - lowH);
                            }
                            const elev = oy + rH;
                            if (elev > maxElev) maxElev = elev;
                        }
                    }

                    // 7. STREET FUNBOX
                    // Total Size = 18m x 18m, Center Deck = 8m x 8m at Height = 2.2m * sy
                    else if (obs.type === 'funbox') {
                        const halfW = 9.0 * sx;
                        const halfL = 9.0 * sz;
                        const deckH = 2.2 * sy;
                        const innerW = 4.0 * sx;
                        const innerL = 4.0 * sz;
                        if (Math.abs(lx) <= halfW && Math.abs(lz) <= halfL) {
                            if (Math.abs(lx) <= innerW && Math.abs(lz) <= innerL) {
                                const elev = oy + deckH;
                                if (elev > maxElev) maxElev = elev;
                            } else {
                                const bankFactor = Math.min(
                                    (halfW - Math.abs(lx)) / (halfW - innerW),
                                    (halfL - Math.abs(lz)) / (halfL - innerL)
                                );
                                const elev = oy + deckH * Math.max(0, Math.min(1, bankFactor));
                                if (elev > maxElev) maxElev = elev;
                            }
                        }
                    }

                    // 8. EARTHMOVER TIRE BOWL
                    // Radius = 14.0 * sx, Thickness = 4.0 * sx, Wall Height = 3.5 * sy
                    else if (obs.type === 'tire_bowl') {
                        const dist = Math.hypot(lx, lz);
                        const radius = 14.0 * sx;
                        const thickness = 4.0 * sx;
                        const bowlH = 3.5 * sy;
                        if (dist >= radius - thickness && dist <= radius + thickness) {
                            const u = 1.0 - Math.abs(dist - radius) / thickness;
                            const elev = oy + bowlH * Math.sin(u * Math.PI * 0.5);
                            if (elev > maxElev) maxElev = elev;
                        }
                    }
                }

                return maxElev;
            }
        });
    }
}));

// Initialize topography once
useCycleParkStore.getState().syncTopography();
