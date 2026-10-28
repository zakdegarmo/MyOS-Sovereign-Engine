// apps/web/src/components/MaxOverlay/environmentRegistry.ts
import type { FloorConfig } from './types';

export interface EnvironmentLayer {
    url: string;
    distance: number; // Radius of the cyclorama
    height?: number;
    opacity?: number;
    rotationSpeed?: number; // To simulate movement/drift
    color?: string;
}

export interface EnvironmentPreset {
    id: string;
    name: string;
    tier: 'production' | 'development';
    floorConfig: Partial<FloorConfig>;
    backgroundUrl: string;
    layers?: EnvironmentLayer[];
    fogColor: string;
    fogNear: number;
    fogFar: number;
    ambientIntensity: number;
    description?: string;
}

export const ENVIRONMENTS: Record<string, EnvironmentPreset> = {
    // ═════════════════════════════════════════════════════════════════════════
    // 🌟 PRODUCTION ENVIRONMENTS (Stable, Demo-Ready Worlds & Game Stages)
    // ═════════════════════════════════════════════════════════════════════════
    agora_sandbox: {
        id: 'agora_sandbox',
        name: 'Sovereign Agora: 10-Pillar Team Sandbox',
        tier: 'production',
        floorConfig: {
            showGrid: true,
            gridSize: 2,
            width: 100,
            depth: 100,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#030712',
        fogNear: 20,
        fogFar: 140,
        ambientIntensity: 1.1,
        description: 'Dedicated multi-agent sandbox where the 10 Pillar Guardians interact, ideate, and prototype games and architecture.'
    },
    cognitive_matrix: {
        id: 'cognitive_matrix',
        name: 'Antigravity Cognitive Matrix (10 Pillars)',
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 200,
            depth: 200,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#07060b',
        fogNear: 20,
        fogFar: 800,
        ambientIntensity: 1.0,
        description: '10-Pillar Content-Addressable Spatial Reasoning Engine & Local AI Telemetry Matrix'
    },
    chrono_hyperdrive: {
        id: 'chrono_hyperdrive',
        name: 'Chrono-Hyperdrive: Tesseract Protocol',
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 250,
            depth: 250,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#020308',
        fogNear: 25,
        fogFar: 600,
        ambientIntensity: 1.2,
        description: 'Bleeding-Edge 4D Tesseract Kinetic Extraction Runner: Phase-shifting, Pillar Glyphs, and High-Speed Spatial Physics'
    },
    uniracers_world: {
        id: 'uniracers_world',
        name: 'Uniracers World (GTA Sandbox & 10 Pillar Cities)',
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 14000,
            depth: 14000,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#050814',
        fogNear: 200,
        fogFar: 16000,
        ambientIntensity: 1.2,
        description: 'Colossal GTA-Scale Open-World Sandbox: Central Roundabout Hub Highway, 10 Radiating Spoke Highways, and 10 Themed Pillar Cities'
    },
    glyphrider: {
        id: 'glyphrider',
        name: 'Glyphrider: Torus Outlaws (Uniracers 3D)',
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 200,
            depth: 200,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#050010',
        fogNear: 50,
        fogFar: 1200,
        ambientIntensity: 1.5,
        description: 'The Uniracers Exoneration Circuit: Outlaw Unicycle Racing on Writhing Torus Knots'
    },
    junkyard: {
        id: 'junkyard',
        name: "Red's Junkyard Hideout (Uniracers 2 Set)",
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 60,
            depth: 60,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#070a10',
        fogNear: 15,
        fogFar: 75,
        ambientIntensity: 0.6,
        description: 'Exile hideout of Red: 80s couch with broken helical suspension spring, cathode ray CRT TV, 10W-40 tin can, and burning barrel'
    },
    cycle_park: {
        id: 'cycle_park',
        name: 'Cycle-Park Studio (Uniracers Level Editor)',
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 140,
            depth: 140,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#090d16',
        fogNear: 60,
        fogFar: 250,
        ambientIntensity: 1.1,
        description: 'Interactive 3D Skatepark Level Editor: Real-time obstacle placement, spline grind rails, and instant unicycle playtesting'
    },
    soundstage: {
        id: 'soundstage',
        name: 'FilmSet Soundstage (Multiplane Cinema)',
        tier: 'production',
        floorConfig: {
            showGrid: true,
            gridSize: 2,
            width: 120,
            depth: 80,
            showTexture: true,
            textureUrl: '/textures/stone_floor_1.jpg'
        },
        backgroundUrl: '',
        fogColor: '#0a0a14',
        fogNear: 40,
        fogFar: 200,
        ambientIntensity: 0.8,
        description: 'Real-Time Virtual Production Soundstage: Concentric Cyclotropic Parallax, Handcrafted Archetypes, and Direct In-Engine 60fps Viewport Filming'
    },
    cinema: {
        id: 'cinema',
        name: 'The Grand Cinema (Screening Theater)',
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 60,
            depth: 80,
            showTexture: true,
            textureUrl: '/textures/stone_floor_1.jpg'
        },
        backgroundUrl: '',
        fogColor: '#050208',
        fogNear: 15,
        fogFar: 100,
        ambientIntensity: 0.5,
        description: 'Atmospheric 3D Movie Theater with Tiered Plush Velvet Seats, Dynamic Screen Glow, and Playback Remote'
    },
    desktop: {
        id: 'desktop',
        name: 'Native Desktop',
        tier: 'production',
        floorConfig: {
            showGrid: true,
            gridSize: 10,
            width: 200,
            depth: 200,
            showTexture: false,
            textureUrl: ''
        },
        backgroundUrl: '',
        fogColor: '#001122',
        fogNear: 50,
        fogFar: 300,
        ambientIntensity: 2.0,
        description: 'Native 3D Desktop environment mapping user files and games to interactive nodes'
    },
    printer_panic: {
        id: 'printer_panic',
        name: 'Sector-404: Corporate Facility (Printer Panic)',
        tier: 'production',
        floorConfig: {
            showGrid: false,
            gridSize: 2,
            width: 140,
            depth: 100,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#0f172a',
        fogNear: 80,
        fogFar: 350,
        ambientIntensity: 3.5,
        description: 'Tactical stealth-heist office sandbox: silence alarms, patch server nodes, and slip security'
    },
    yawning_portal: {
        id: 'yawning_portal',
        name: 'The Yawning Portal Tavern',
        tier: 'production',
        floorConfig: {
            textureUrl: '/data/Yawning_Portal_layout_OiW.png',
            gridSize: 5,
            width: 200,
            depth: 200,
            showTexture: true,
            showGrid: false
        },
        backgroundUrl: '',
        fogColor: '#1a1a1a',
        fogNear: 200,
        fogFar: 1000,
        ambientIntensity: 2.5,
        description: 'VTT battlemap & historic adventurer tavern hub'
    },
    undermountain: {
        id: 'undermountain',
        name: 'Undermountain Level 1: The Dungeon Level',
        tier: 'production',
        floorConfig: {
            textureUrl: '/textures/stone_floor_2.jpg',
            gridSize: 10,
            width: 500,
            depth: 500,
            showTexture: true,
            showGrid: true
        },
        backgroundUrl: '',
        fogColor: '#0a0d14',
        fogNear: 50,
        fogFar: 400,
        ambientIntensity: 1.8,
        description: 'Classic stone dungeon crawler level'
    },
    astra_faerun: {
        id: 'astra_faerun',
        name: 'Astra Faerûn (VTT)',
        tier: 'production',
        floorConfig: {
            showGrid: true,
            gridSize: 5,
            width: 100,
            depth: 100,
            showTexture: false
        },
        backgroundUrl: '/assets/backgrounds/digital_void.mp4',
        layers: [
            { url: '/assets/backgrounds/static_noise.png', distance: 200, opacity: 0.05, rotationSpeed: 0.005 }
        ],
        fogColor: '#000814',
        fogNear: 50,
        fogFar: 1000,
        ambientIntensity: 1.5,
        description: 'Holographic VTT tactical tabletop'
    },

    // ═════════════════════════════════════════════════════════════════════════
    // 🧪 TEST & DEVELOPMENT ENVIRONMENTS (Sandboxes, Prototypes & Benchmarks)
    // ═════════════════════════════════════════════════════════════════════════
    einstein_lab: {
        id: 'einstein_lab',
        name: 'Einstein Thought Lab',
        tier: 'development',
        floorConfig: {
            showGrid: false,
            gridSize: 10,
            width: 200,
            depth: 200,
            showTexture: true,
            textureUrl: '/textures/stone_floor_1.jpg'
        },
        backgroundUrl: '',
        fogColor: '#1a2b3c',
        fogNear: 50,
        fogFar: 300,
        ambientIntensity: 2.5,
        description: 'Cosmic relativistic thought experiment sandbox'
    },
    faerun: {
        id: 'faerun',
        name: 'Overland Realm (Repurposed Prototype)',
        tier: 'development',
        floorConfig: {
            textureUrl: '/textures/stone_floor_2.jpg',
            gridSize: 20,
            width: 2000,
            depth: 2000,
            showTexture: true,
            showGrid: false
        },
        backgroundUrl: '/integrations/Images/Bgs/HDRPanoramas0044_8_350.jpg',
        layers: [],
        fogColor: '#004d40', 
        fogNear: 100,
        fogFar: 5000, 
        ambientIntensity: 3.5,
        description: 'Expansive outdoor terrain prototype for custom game development'
    },
    bering_sea_lab: {
        id: 'bering_sea_lab',
        name: 'Bering Sea Parallax Shader Lab (JIT VFX)',
        tier: 'development',
        floorConfig: {
            showGrid: false,
            width: 200,
            depth: 200,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#020611',
        fogNear: 30,
        fogFar: 300,
        ambientIntensity: 0.8,
        description: 'Multi-layer 2.5D Parallax JIT Shader Lab: Arctic oceanic swells, procedural breaker crests, aurora borealis, and independent billboard shaders.'
    },
    holo_cortex_4d: {
        id: 'holo_cortex_4d',
        name: '4D Holo-Cortex (Hyper-Dimensional Matrix)',
        tier: 'development',
        floorConfig: {
            showGrid: false,
            width: 200,
            depth: 200,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#030208',
        fogNear: 20,
        fogFar: 500,
        ambientIntensity: 1.0,
        description: 'Intentional Hybrid: 4D Tesseract Geometry (holo_window.html) merged with the Antigravity Cognitive Matrix. Visualizes neural firing, compressed graph hops, and multidimensional reasoning.'
    },
    nexus_cube: {
        id: 'nexus_cube',
        name: "NexusCube: 10-Pillar Hyper-Prism & Rubik's Cortex",
        tier: 'development',
        floorConfig: {
            showGrid: false,
            width: 200,
            depth: 200,
            showTexture: false
        },
        backgroundUrl: '',
        fogColor: '#03020a',
        fogNear: 20,
        fogFar: 500,
        ambientIntensity: 1.0,
        description: '10-Sided Russian-Doll Hyper-Decagonal Prism (NexusContainer & NestedDock Window Manager) wrapping the Bioluminescent Glass-Mesh Rubik\'s Cortex with shortest-hop slice rotations and live streaming neuron firing.'
    },
    magic_lab: {
        id: 'magic_lab',
        name: 'Magic VFX Lab',
        tier: 'development',
        floorConfig: {
            showGrid: true,
            gridColor: '#ff00ff',
            gridOpacity: 0.4
        },
        backgroundUrl: '/assets/backgrounds/digital_void.mp4',
        fogColor: '#1a0b2e',
        fogNear: 10,
        fogFar: 150,
        ambientIntensity: 0.3,
        description: 'Shader, particle, and voxel VFX benchmark'
    },
    astra_lab: {
        id: 'astra_lab',
        name: 'Astra Lab',
        tier: 'development',
        floorConfig: {
            showGrid: true,
            gridSize: 5,
            width: 500,
            depth: 500,
            showTexture: false
        },
        backgroundUrl: '/integrations/Images/Bgs/HDRPanoramas0044_8_350.jpg',
        layers: [
            { url: '/integrations/Images/Bgs/HDRPanoramas0044_8_350.jpg', distance: 3500, opacity: 0.9, height: 1200 }
        ],
        fogColor: '#001a33',
        fogNear: 150,
        fogFar: 5000,
        ambientIntensity: 3.0,
        description: 'High-altitude coordinate calibration grid'
    },
    wilderness: {
        id: 'wilderness',
        name: 'The Data Wilderness',
        tier: 'development',
        floorConfig: {
            textureUrl: '/textures/stone_floor_2.jpg',
            gridSize: 20,
            width: 2000,
            depth: 2000,
            showTexture: true,
            showGrid: false
        },
        backgroundUrl: '/assets/video/Recording 2025-08-02 144319.mp4',
        layers: [
            { url: '/assets/video/Recording 2025-08-02 144319.mp4', distance: 1500, opacity: 0.3, rotationSpeed: 0.0005 },
            { url: '/assets/backgrounds/ghost_smoke.webm', distance: 800, opacity: 0.2, rotationSpeed: 0.001, height: 500 }
        ],
        fogColor: '#0a0015',
        fogNear: 150,
        fogFar: 1000,
        ambientIntensity: 2.5,
        description: 'Video cyclorama and atmospheric drift testbed'
    },
    zamn_prototype: {
        id: 'zamn_prototype',
        name: 'ZAMN Combat Arena (Prototype)',
        tier: 'development',
        floorConfig: {
            showGrid: true,
            gridSize: 8,
            width: 300,
            depth: 300,
            showTexture: true,
            textureUrl: '/textures/stone_floor_2.jpg'
        },
        backgroundUrl: '',
        fogColor: '#05101a',
        fogNear: 40,
        fogFar: 250,
        ambientIntensity: 2.2,
        description: 'Top-down arcade arena for collision and horde testing'
    },
    combat_lab: {
        id: 'combat_lab',
        name: 'Combat Encounter Test Lab',
        tier: 'development',
        floorConfig: {
            showGrid: true,
            gridSize: 5,
            width: 100,
            depth: 100,
            showTexture: true,
            textureUrl: '/textures/stone_floor_2.jpg'
        },
        backgroundUrl: '',
        fogColor: '#0c0f1d',
        fogNear: 40,
        fogFar: 200,
        ambientIntensity: 2.2,
        description: 'Turn-based tactical 5e D&D combat arena with classic SNES JRPG menu UX'
    }
};

