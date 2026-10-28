import { MooseBotState, GeometryConfig, RoomConfig } from './types';

export const INITIAL_MOOSE_BOT_STATE: MooseBotState = {
    url: '/moose-bot.glb',
    dialogue: 'Hello! I am MOOSE-BOT. Please provide a Gemini API key to chat with me.',
    activeAnimation: 'Idle',
    position: [0, -125, 15],
    rotation: [0, Math.PI, 0],
    scale: 6,
};

export const INITIAL_GEOMETRY_CONFIG: GeometryConfig = {
    sphere: { widthSegments: 64, heightSegments: 64 },
    box: { widthSegments: 1, heightSegments: 1, depthSegments: 1 },
    cylinder: { radialSegments: 64, heightSegments: 1 },
    cone: { radialSegments: 64, heightSegments: 1 },
    torus: { radialSegments: 16, tubularSegments: 100 },
    icosahedron: { detail: 1 },
    dodecahedron: { detail: 1 },
};

export const INITIAL_ROOM_CONFIG: RoomConfig = {
    size: 250,
    shape: 'sphere',
    wallColor: '#444444',
    floorColor: '#555555',
    ambientLightIntensity: 3.0,
    pointLightIntensity: 15,
    pointLightColor: '#ff8844',
    fogColor: '#101010',
    fogDensity: 50, // Mid-range density
    geometryConfig: INITIAL_GEOMETRY_CONFIG,
};
