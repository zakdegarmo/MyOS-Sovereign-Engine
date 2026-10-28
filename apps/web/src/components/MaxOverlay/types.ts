export const AgentState = {
    IDLE: 'IDLE',
    THINKING: 'THINKING',
    INTERACTING: 'INTERACTING',
    ERROR: 'ERROR'
} as const;

export type AgentState = typeof AgentState[keyof typeof AgentState];

export interface FloorConfig {
    showGrid: boolean; // XZ Grid
    showDomeGrid?: boolean; // Replaces XY/YZ grids
    showTexture?: boolean;
    textureUrl?: string;
    showDomeTexture?: boolean;
    domeTextureUrl?: string;
    isDomeTextureVideo?: boolean;

    gridSize?: number; // Distance in feet per cell for XZ, e.g. 5
    domeGridSize?: number; // Distance per cell for Dome

    x: number;
    y: number;
    z: number;
    width: number; // Floor diameter
    depth: number; // Floor diameter
    domeRadius?: number;
    domeHeight?: number;
    layerDepth?: number; // Z-axis spacing multiplier for 2.5D layers
}

export type AgentId = 'self' | 'thought' | 'logic' | 'unity' | 'existence' | 'improvement' | 'mastery' | 'resonance' | 'transcendence' | 'omni';

export interface ApplicationManifest {
    id: string;
    version: string;
    metadata: {
        name: string;
        description: string;
        archetype: AgentId;
    };
    stagecraft: {
        backgroundUrl: string;
        fogNear: number;
        fogFar: number;
        fogColor: string;
        ambientIntensity: number;
    };
    floor: Partial<FloorConfig>;
    camera?: {
        position: [number, number, number];
        fov: number;
    };
    requirements?: {
        agents?: AgentId[];
        assets?: string[];
    };
}

export type KinesicState = 'neutral' | 'thinking' | 'skeptical' | 'resonant' | 'expressive' | 'alert';

export interface KinesicVector {
    eyeShiftY: number;    // -1 to 1 (squint/skeptical vs surprise)
    eyeWidening: number; // 0 to 1
    mouthScale: number;  // 0.5 to 1.5
    mouthOpen: number;   // 0 to 1
    headTilt: number;    // -Math.PI/12 to Math.PI/12
    intensity: number;   // 0 to 1 (global influence)
}
export interface AssetLayer {
    id: string;
    url: string;
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    visible: boolean;
    name: string;
}

export interface PropData {
    id: string;
    coordinate?: string;
    rawPosition?: [number, number, number];
    texturePath: string;
    scale?: number;
    animation?: 'bob' | 'none';
    geometryType?: 'sprite' | 'box' | 'plane' | 'sphere' | 'tetrahedron' | 'cylinder' | 'torus' | 'cone' | 'torusKnot' | 'icosahedron' | 'octahedron' | 'dodecahedron' | 'ring';
    color?: string;
    wireframe?: boolean;
    layers?: AssetLayer[];
    mass?: number;                // 0 to 1 (percentage of mass remaining)
    isVoxelized?: boolean;         // Use the Voxel Mass Engine
    pixelScale?: number;          // Size of each 'pixel' voxel
    initialPixelCount?: number;   // Total pixels at 100% mass
}
