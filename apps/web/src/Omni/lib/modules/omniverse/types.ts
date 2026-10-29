
// Core Spatial Types
export interface Transform {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

export interface ScreenState extends Transform {
    id: string | number;
    isVisible: boolean;
    url?: string;
}

export interface DoorState extends Transform {
    id: string | number;
    name: string;
    url: string;
}

export type SceneObjectType = 'model' | 'hologram' | 'primitive';

export interface SceneObjectState extends Transform {
    id: string | number;
    type: SceneObjectType;
    url?: string;
    primitiveType?: string; // Relaxed for now
    primitiveParameters?: any;
}

// MOOSE-BOT (Omni Avatar)
export interface MooseBotState extends Transform {
    url: string;
    dialogue: string;
    activeAnimation: string;
}

// Room Generation Types (Transcendence)
export interface GeometryConfig {
    sphere: { widthSegments: number; heightSegments: number };
    box: { widthSegments: number; heightSegments: number; depthSegments: number };
    cylinder: { radialSegments: number; heightSegments: number };
    cone: { radialSegments: number; heightSegments: number };
    torus: { radialSegments: number; tubularSegments: number };
    icosahedron: { detail: number };
    dodecahedron: { detail: number };
}

export interface RoomConfig {
    size: number;
    shape: 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'icosahedron' | 'dodecahedron';
    wallColor: string;
    floorColor: string;
    ambientLightIntensity: number;
    pointLightIntensity: number;
    pointLightColor: string;
    fogColor: string;
    fogDensity: number; // 0-100
    geometryConfig: GeometryConfig;
}

export interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

// --- Omni Knowledge Types ---

import type { TranscendenceState } from '../transcendence/types';

export interface KnowledgeNode {
    id: string;
    label: string;
    type: 'Concept' | 'Action' | 'Pattern' | 'Reflection';
    data: any;
    connections: string[]; // IDs of connected nodes
}

export interface OmniState {
    version: number;
    totalNodes: number;
    recentReflections: TranscendenceState[]; // The "Gold" collected
    contextString: string; // The "Vibe" emanating to Self
}
