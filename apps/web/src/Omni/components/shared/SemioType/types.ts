import { Vector3 } from 'three';

export interface VoxelData {
    id: string;
    x: number;
    y: number;
    z: number;
    originX: number;
    originY: number;
    originZ: number;
    color: string;
}

export type VoxelGeometryType = 'cube' | 'sphere' | 'tetra' | 'octa' | 'icosa';

export interface FontSettings {
    text: string;
    voxelSize: number;
    gap: number;
    explosionForce: number;
    returnSpeed: number;
    drag: number;
    colorMode: 'solid' | 'gradient' | 'random' | 'custom';
    customColor: string;
    voxelGeometry: VoxelGeometryType;
}

export interface GlyphMap {
    [key: string]: number[][];
}
