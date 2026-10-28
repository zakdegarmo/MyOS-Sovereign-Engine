
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

class MoosePageService {
    private pages: Record<string, MooseManifest> = {};

    constructor() {
        this.loadPages();
    }

    private loadPages() {
        const saved = localStorage.getItem('mystra_moose_pages');
        if (saved) {
            try {
                this.pages = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to load MOOSE pages", e);
            }
        }
    }

    private savePages() {
        localStorage.setItem('mystra_moose_pages', JSON.stringify(this.pages));
    }

    registerPage(manifest: MooseManifest) {
        this.pages[manifest.id] = manifest;
        this.savePages();
    }

    getPage(id: string): MooseManifest | undefined {
        return this.pages[id];
    }

    getAllPages(): MooseManifest[] {
        return Object.values(this.pages);
    }

    deletePage(id: string) {
        delete this.pages[id];
        this.savePages();
    }

    // Helper to generate a default/empty manifest for a project
    createInitialManifest(id: string, intent: string): MooseManifest {
        return {
            id,
            title: "New Manifestation",
            description: "A spatial environment generated from intent.",
            intent,
            roomConfig: {
                size: 50,
                shape: 'box',
                wallColor: '#111111',
                floorColor: '#222222',
                ambientLightIntensity: 0.5,
                pointLightIntensity: 1,
                pointLightColor: '#ffffff',
                fogColor: '#000000',
                fogDensity: 10,
                geometryConfig: {
                    sphere: { widthSegments: 32, heightSegments: 32 },
                    box: { widthSegments: 1, heightSegments: 1, depthSegments: 1 },
                    cylinder: { radialSegments: 32, heightSegments: 1 },
                    cone: { radialSegments: 32, heightSegments: 1 },
                    torus: { radialSegments: 32, tubularSegments: 20 },
                    icosahedron: { detail: 0 },
                    dodecahedron: { detail: 0 }
                }
            },
            screens: [],
            doors: [],
            sceneObjects: [],
            createdAt: Date.now()
        };
    }
}

export const moosePageService = new MoosePageService();
