// apps/web/src/components/Soundstage/productionPresets.ts
import type { ProductionBrief, ProductionManifest } from './types';

export const CANONICAL_PRESETS: ProductionBrief[] = [
    {
        productionId: "crimson-zenith-01",
        title: "Crimson Zenith: Duel of the Sundered Sisterhood",
        logline: "Two warrior sisters bound by blood and sundered by fate clash atop a jagged cliff plateau at burning dusk.",
        format: "short",
        primaryGenre: "dark_fantasy",
        subGenres: ["sword_and_sorcery", "heavy_metal", "chiaroscuro_action"],
        filmStyle: "bakshi_frazetta_cel",
        lightingMood: "sunset_chiaroscuro",
        aspectRatio: "16:9",
        fps: 30,
        runtimeSeconds: 8.0,
        resolution: { width: 640, height: 360 },
        renderEngine: "BLENDER_EEVEE",
        dramaticArc: "classical_three_act",
        cameraLanguage: [
            "Shot 1: 28mm Wide Low-Angle Dolly Across the Abyss",
            "Shot 2: 45mm Reverse OTS Hero Crane on Blade Cleave",
            "Shot 3: 35mm Low-Angle Horizon Pan Silhouetted Against Sunset"
        ],
        cast: {
            leadA: {
                characterId: "warrior_lunaria",
                characterName: "Lunaria (Elder Sister)",
                modelUrl: "/models/lunaria_flesh_golem.glb",
                mark: "mark_a",
                role: "Protagonist • Attacker",
                wardrobe: "Lunaria Barbarian Gown & Cape",
                weaponRight: "Modular_1H_Sword",
                animationAction: "Melee_Weapon_Attack"
            },
            leadB: {
                characterId: "warrior_vespera",
                characterName: "Vespera (Younger Sister)",
                modelUrl: "/models/vespera_flesh_golem.glb",
                mark: "mark_b",
                role: "Antagonist • Defender",
                wardrobe: "Combat Leather Skirt",
                weaponRight: "Modular_1H_Sword",
                weaponLeft: "Modular_Round_Shield",
                animationAction: "Melee_Weapon_Idle"
            }
        },
        additionalNotes: "Handcrafted 3-step constant cel shading, intense rim highlights, fast cut rhythm."
    },
    {
        productionId: "neon-syndicate-02",
        title: "Neon Syndicate: Rain Alley Infiltration",
        logline: "A covert operative confronts an enforcer in a rain-slicked alleyway beneath flickering holographic neon.",
        format: "episodic",
        primaryGenre: "cyberpunk",
        subGenres: ["neo_noir", "dystopian_rain", "tactical_standoff"],
        filmStyle: "cyberpunk_neon_bloom",
        lightingMood: "cyberpunk_neon",
        aspectRatio: "2.39:1",
        fps: 30,
        runtimeSeconds: 10.0,
        resolution: { width: 854, height: 360 },
        renderEngine: "BLENDER_EEVEE",
        dramaticArc: "tension_escalation",
        cameraLanguage: [
            "Shot 1: 24mm Wet-Asphalt Dutch Tilt Tracking Infiltration",
            "Shot 2: 50mm Over-the-Shoulder Neon Push on Gun Draw",
            "Shot 3: 85mm Hero Silhouette Pullback Through Steam Vents"
        ],
        cast: {
            leadA: {
                characterId: "operative_lunaria",
                characterName: "Lunaria (Spectre Operative)",
                modelUrl: "/models/lunaria_flesh_golem.glb",
                mark: "mark_a",
                role: "Covert Infiltrator",
                wardrobe: "Tactical Stealth Weave",
                weaponRight: "Modular_Pistol",
                animationAction: "Pistol_Aim_Neutral"
            },
            leadB: {
                characterId: "enforcer_vespera",
                characterName: "Vespera (Syndicate Enforcer)",
                modelUrl: "/models/vespera_flesh_golem.glb",
                mark: "mark_b",
                role: "District Enforcer",
                wardrobe: "Reinforced Combat Armor",
                animationAction: "Idle_Talking_Loop"
            }
        },
        additionalNotes: "Volumetric neon bloom, puddles with specular light bounces, slow trenchcoat flutter."
    },
    {
        productionId: "obsidian-cathedral-03",
        title: "Obsidian Cathedral: Rite of the Blood Moon",
        logline: "Ancient sorceresses duel across the crumbling nave of an obsidian citadel beneath the eclipse.",
        format: "feature_scene",
        primaryGenre: "gothic_horror",
        subGenres: ["dark_fantasy", "sorcery_duel", "blood_moon"],
        filmStyle: "film_noir_chiaroscuro",
        lightingMood: "dungeon_torchlight",
        aspectRatio: "16:9",
        fps: 24,
        runtimeSeconds: 12.0,
        resolution: { width: 640, height: 360 },
        renderEngine: "BLENDER_EEVEE",
        dramaticArc: "classical_three_act",
        cameraLanguage: [
            "Shot 1: 35mm Stained Glass Descent to Altar",
            "Shot 2: 70mm Spellcast Incantation Close-up with Dynamic Sparks",
            "Shot 3: 28mm Wide Aerial Orbit of the Broken Nave"
        ],
        cast: {
            leadA: {
                characterId: "sorceress_lunaria",
                characterName: "Lunaria (High Priestess)",
                modelUrl: "/models/lunaria_flesh_golem.glb",
                mark: "mark_a",
                role: "Eclipse Invoker",
                wardrobe: "Gown & Moon Crown",
                animationAction: "Spell_Simple_Shoot"
            },
            leadB: {
                characterId: "sorceress_vespera",
                characterName: "Vespera (Rift Caller)",
                modelUrl: "/models/vespera_flesh_golem.glb",
                mark: "mark_b",
                role: "Rift Challenger",
                wardrobe: "Obsidian Stole",
                animationAction: "Spell_Simple_Idle_Loop"
            }
        },
        additionalNotes: "High contrast chiaroscuro shadows, harsh tungsten brazier glows, floating particle embers."
    },
    {
        productionId: "orbital-valkyrie-04",
        title: "Orbital Valkyrie: Edge of the Radiator Ring",
        logline: "Zero-G melee confrontation atop the radiator wings of an orbital colony ship.",
        format: "action_reel",
        primaryGenre: "space_opera",
        subGenres: ["sci_fi", "orbital_action", "high_velocity"],
        filmStyle: "modern_action_hfr",
        lightingMood: "highbay_daylight",
        aspectRatio: "2.39:1",
        fps: 60,
        runtimeSeconds: 8.0,
        resolution: { width: 854, height: 360 },
        renderEngine: "BLENDER_EEVEE",
        dramaticArc: "cold_open_clash",
        cameraLanguage: [
            "Shot 1: 20mm High-Velocity Flyby Tracking Solar Ring Horizon",
            "Shot 2: 50mm Telephoto Kinetic Blade Clash Parry",
            "Shot 3: 35mm Slow-Motion Zero-G Aerial Separation"
        ],
        cast: {
            leadA: {
                characterId: "valkyrie_lunaria",
                characterName: "Lunaria (Valkyrie Prime)",
                modelUrl: "/models/lunaria_flesh_golem.glb",
                mark: "mark_a",
                role: "Orbital Interceptor",
                wardrobe: "Composite Flight Suit",
                weaponRight: "Modular_1H_Sword",
                animationAction: "Melee_Weapon_Attack"
            },
            leadB: {
                characterId: "valkyrie_vespera",
                characterName: "Vespera (Rogue Valkyrie)",
                modelUrl: "/models/vespera_flesh_golem.glb",
                mark: "mark_b",
                role: "Rogue Interceptor",
                wardrobe: "Combat Flight Armor",
                weaponRight: "Modular_1H_Sword",
                animationAction: "Melee_Weapon_Idle"
            }
        },
        additionalNotes: "Hyper-crisp 60fps, planetary rim back-lighting, deep space stellar starfield."
    }
];

// Helper: Compile structured ProductionBrief into a deterministic ProductionManifest
export function compileBriefToManifest(brief: ProductionBrief): ProductionManifest {
    const totalFrames = Math.floor(brief.runtimeSeconds * brief.fps);
    const framePerShot = Math.floor(totalFrames / (brief.cameraLanguage.length || 3));

    return {
        metadata: {
            title: brief.title,
            production_id: brief.productionId,
            fps: brief.fps,
            resolution: brief.resolution,
            total_frames: totalFrames,
            engine: brief.renderEngine,
            style_prompt: `${brief.filmStyle} • ${brief.primaryGenre} • ${brief.logline}`
        },
        environment: {
            base_blend: "lunaria_flesh_mannequin.blend",
            terrain: {
                type: brief.primaryGenre === 'cyberpunk' ? "wet_asphalt" : "cliff_plateau",
                material: brief.primaryGenre === 'cyberpunk' ? "Pavement_Neon" : "Crag_Rock"
            },
            backdrop: {
                type: brief.lightingMood === 'cyberpunk_neon' ? "neon_skyline" : "gradient_sunset",
                color_top: brief.lightingMood === 'cyberpunk_neon' ? [0.05, 0.05, 0.15] : [0.15, 0.05, 0.25],
                color_bottom: brief.lightingMood === 'cyberpunk_neon' ? [0.0, 0.8, 0.9] : [0.95, 0.45, 0.15]
            }
        },
        lighting: [
            {
                name: "KeySun",
                type: "SUN",
                energy: brief.lightingMood === 'sunset_chiaroscuro' ? 5.5 : 4.0,
                color_rgb: brief.lightingMood === 'sunset_chiaroscuro' ? [1.0, 0.55, 0.2] : [0.0, 0.85, 1.0],
                rotation_deg: [65, -15, -45]
            },
            {
                name: "RimSun",
                type: "SUN",
                energy: brief.lightingMood === 'sunset_chiaroscuro' ? 8.0 : 6.5,
                color_rgb: brief.lightingMood === 'sunset_chiaroscuro' ? [1.0, 0.1, 0.5] : [1.0, 0.1, 0.7],
                rotation_deg: [-40, 20, 135]
            },
            {
                name: "FillSun",
                type: "SUN",
                energy: 1.2,
                color_rgb: [0.2, 0.25, 0.6]
            }
        ],
        characters: [
            {
                id: brief.cast.leadA.characterId,
                name: brief.cast.leadA.characterName,
                source_object: "Armature",
                initial_transform: {
                    location: [-1.2, 0.0, 0.0],
                    rotation_euler_deg: [0, 0, 85]
                },
                equipment: [
                    ...(brief.cast.leadA.weaponRight ? [{ name: brief.cast.leadA.weaponRight, socket: "Hand.R_Socket" }] : []),
                    ...(brief.cast.leadA.weaponLeft ? [{ name: brief.cast.leadA.weaponLeft, socket: "Hand.L_Socket" }] : []),
                    { name: "Modular_Combat_Skirt", socket: "Hips" }
                ],
                actions: [
                    { frame: 1, animation: `${brief.cast.leadA.animationAction} (Continuous Cycles Loop)` }
                ]
            },
            {
                id: brief.cast.leadB.characterId,
                name: brief.cast.leadB.characterName,
                source_object: "Warrior2_Armature",
                initial_transform: {
                    location: [1.2, 0.0, 0.0],
                    rotation_euler_deg: [0, 0, -85]
                },
                equipment: [
                    ...(brief.cast.leadB.weaponRight ? [{ name: brief.cast.leadB.weaponRight, socket: "Hand.R_Socket" }] : []),
                    ...(brief.cast.leadB.weaponLeft ? [{ name: brief.cast.leadB.weaponLeft, socket: "Hand.L_Socket" }] : [])
                ],
                actions: [
                    { frame: 1, animation: `${brief.cast.leadB.animationAction} (Continuous Cycles Loop)` }
                ]
            }
        ],
        shots: brief.cameraLanguage.map((camShot, idx) => {
            const startF = idx * framePerShot + 1;
            const endF = idx === brief.cameraLanguage.length - 1 ? totalFrames : (idx + 1) * framePerShot;
            return {
                shot_id: idx + 1,
                name: camShot,
                frame_start: startF,
                frame_end: endF,
                lens_mm: idx === 0 ? 28 : (idx === 1 ? 45 : 35),
                camera_movement: {
                    type: idx === 0 ? "DOLLY" : (idx === 1 ? "CRANE" : "PAN"),
                    start_pos: idx === 0 ? [-4.8, -4.5, 0.8] : (idx === 1 ? [0.0, -2.2, 0.2] : [-2.0, -4.0, 0.4]),
                    end_pos: idx === 0 ? [-3.2, -3.8, 0.5] : (idx === 1 ? [0.3, -1.5, 0.9] : [2.0, -3.8, 0.6]),
                    start_rot_deg: [78, 0, -40],
                    end_rot_deg: [82, 0, -32],
                    interpolation: "BEZIER"
                }
            };
        })
    };
}
