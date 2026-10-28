// apps/web/src/components/Soundstage/types.ts

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface Rotation3D {
    x_deg: number;
    y_deg: number;
    z_deg: number;
}

export interface ShotCameraMovement {
    type: 'STATIC' | 'DOLLY' | 'CRANE' | 'PAN' | 'ORBIT';
    start_pos: [number, number, number];
    end_pos: [number, number, number];
    start_rot_deg?: [number, number, number];
    end_rot_deg?: [number, number, number];
    interpolation?: 'BEZIER' | 'LINEAR';
}

export interface ShotDefinition {
    shot_id: number;
    name: string;
    description?: string;
    frame_start: number;
    frame_end: number;
    lens_mm: number;
    dof_fstop?: number;
    focus_target?: string;
    camera_movement: ShotCameraMovement;
}

export interface LightingRigItem {
    name: string;
    type: 'SUN' | 'SPOT' | 'POINT' | 'AREA';
    energy: number;
    color_rgb: [number, number, number];
    rotation_deg?: [number, number, number];
    position?: [number, number, number];
}

export interface CharacterAction {
    frame: number;
    animation: string;
    target?: string;
}

export interface ProductionCharacter {
    id: string;
    name: string;
    source_object: string;
    initial_transform: {
        location: [number, number, number];
        rotation_euler_deg: [number, number, number];
        scale?: [number, number, number];
    };
    equipment?: Array<{
        name: string;
        socket: string;
        blend_file?: string;
    }>;
    actions?: CharacterAction[];
}

export interface ProductionManifest {
    metadata: {
        title: string;
        production_id?: string;
        fps: number;
        resolution: {
            width: number;
            height: number;
        };
        total_frames: number;
        engine: 'BLENDER_EEVEE' | 'BLENDER_EEVEE_NEXT' | 'CYCLES';
        style_prompt?: string;
    };
    environment: {
        base_blend: string;
        terrain?: {
            type: string;
            material: string;
        };
        backdrop?: {
            type: string;
            color_top?: [number, number, number];
            color_bottom?: [number, number, number];
        };
    };
    lighting: LightingRigItem[];
    characters: ProductionCharacter[];
    shots: ShotDefinition[];
}

export type PipelineStage = 
    | 'idle' 
    | 'manifesting' 
    | 'filming' 
    | 'stitching' 
    | 'screening' 
    | 'error';

export interface PipelineStep {
    id: string;
    name: string;
    label: string;
    description: string;
    agent: 'director' | 'dp' | 'gaffer' | 'compiler';
}

export interface ScreeningReel {
    id: string;
    title: string;
    filename: string;
    durationSeconds: number;
    fps: number;
    totalFrames: number;
    aspectRatio: string;
    resolution: string;
    genre: string;
    description: string;
    thumbnailUrl?: string;
    manifest: ProductionManifest;
}

export interface CrewMember {
    id: 'director' | 'dp' | 'gaffer' | 'user';
    name: string;
    role: string;
    title: string;
    station: string;
    position: [number, number, number];
    color: string;
    speechBubble?: string;
}

// ═════════════════════════════════════════════════════════════════
// FILM SCHOOL IN A DATA STRUCTURE (DIRECTOR'S PRODUCTION BRIEF)
// ═════════════════════════════════════════════════════════════════

export type ProductionFormat = 
    | 'short'          // 8-15s Cinematic Teaser / Short
    | 'episodic'       // 15-30s Narrative Dialogue / Clash
    | 'feature_scene'  // 30-60s Multi-Shot Setpiece
    | 'motion_comic'   // Stylized Pan & Scan Keyframe Tweening
    | 'action_reel';   // Kinetic Choreography Benchmark

export type FilmGenre = 
    | 'dark_fantasy'
    | 'cyberpunk'
    | 'sci_fi'
    | 'film_noir'
    | 'gothic_horror'
    | 'space_opera'
    | 'martial_arts'
    | 'retro_futurism';

export type CinematicStyle = 
    | 'bakshi_frazetta_cel'      // 1980s Heavy Metal, 3-step constant cel shading, chiaroscuro rims
    | 'panavision_anamorphic'    // 1970s Panavision, 2.39:1, warm lens flares, organic film grain
    | 'cyberpunk_neon_bloom'     // Neo-Tokyo, hyper-saturated neon key, wet surface reflections
    | 'film_noir_chiaroscuro'    // High contrast monochrome/amber, harsh venetian blinds, Dutch tilts
    | 'modern_action_hfr';       // Hyper-crisp 60fps, dynamic motion blur, fast shutter angle

export type AspectRatio = '16:9' | '2.39:1' | '4:3' | '9:16';

export type LightingMood = 
    | 'sunset_chiaroscuro'       // Amber Key, Sanguine Rim, Indigo Twilight Fill
    | 'cyberpunk_neon'           // Cyan Key, Magenta Rim, Deep Midnight Fill
    | 'highbay_daylight'         // Neutral 5500K bright industrial studio flood
    | 'lowkey_noir'              // Harsh tungsten spot, deep impenetrable shadows
    | 'dungeon_torchlight';      // Flickering warm amber point lights

export type DramaticArc = 
    | 'classical_three_act'      // Setup -> Escalation -> Climax -> Resolution
    | 'cold_open_clash'          // Immediate weapon clash -> dynamic separation
    | 'tension_escalation'       // Slow standoff circling -> sudden explosive strike
    | 'dramatic_freeze';         // Slow-motion hero framing

export interface CastSocketConfig {
    characterId: string;
    characterName: string;
    modelUrl: string;
    mark: 'mark_a' | 'mark_b';
    role: string;
    wardrobe: string;
    weaponRight?: string;
    weaponLeft?: string;
    animationAction: string;
}

export interface ProductionBrief {
    // 1. Identity & Format
    productionId: string;
    title: string;
    logline: string;
    format: ProductionFormat;

    // 2. Genre & Aesthetics
    primaryGenre: FilmGenre;
    subGenres: string[];
    filmStyle: CinematicStyle;
    lightingMood: LightingMood;

    // 3. Technical Parameters
    aspectRatio: AspectRatio;
    fps: 24 | 30 | 60;
    runtimeSeconds: number;
    resolution: { width: number; height: number };
    renderEngine: 'BLENDER_EEVEE' | 'BLENDER_EEVEE_NEXT' | 'CYCLES';

    // 4. Narrative Arc & Direction
    dramaticArc: DramaticArc;
    cameraLanguage: string[];

    // 5. Cast Configuration
    cast: {
        leadA: CastSocketConfig;
        leadB: CastSocketConfig;
    };

    // 6. User Custom Direction
    additionalNotes?: string;
}
