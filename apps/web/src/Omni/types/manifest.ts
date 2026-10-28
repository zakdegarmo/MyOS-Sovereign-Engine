
import type { RoomConfig, ScreenState, DoorState, SceneObjectState } from '@Existence/Factors/Manifests/types';

export interface MooseManifest {
    id: string;
    title: string;
    description: string;
    intent: string;
    roomConfig: RoomConfig;
    screens: ScreenState[];
    doors: DoorState[];
    sceneObjects: SceneObjectState[];
    createdAt: number;
}

export type ManifestationStep =
    | 'self'
    | 'thought'
    | 'logic'
    | 'unity'
    | 'existence'
    | 'improvement'
    | 'mastery'
    | 'resonance'
    | 'transcendence'
    | 'omni';

export interface ManifestationProgress {
    step: ManifestationStep;
    status: 'pending' | 'active' | 'completed' | 'failed';
    output?: string; // Stored result of the step (e.g., Schema JSON, Intent Text)
    thoughts?: string[]; // Agent internal monologue/intermediate steps
    details?: Record<string, any>;
}

export interface ManifestationState {
    id: string;
    intent: string;
    steps: Record<ManifestationStep, ManifestationProgress>;
    currentStep: ManifestationStep;
    manifest: MooseManifest; // The evolving 3D environment
    createdAt: number;
    updatedAt: number;
}
