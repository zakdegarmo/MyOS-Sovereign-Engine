import type { AvatarState } from '../components/Council/AvatarConstruct';
import type { GenomeObject } from '../utils/semanticAvatar/semanticMatcher';
import React from 'react';
import {
    CircleDot, Lightbulb, Brain, Globe, Activity,
    ArrowUp, Target, Heart, Layers, Repeat, Shield, User,
    Beer, Clapperboard, Camera
} from 'lucide-react';

export type AgentId = 'user' | 'self' | 'thought' | 'logic' | 'unity' | 'existence' | 'improvement' | 'mastery' | 'resonance' | 'transcendence' | 'omni' | 'orchestrator' | 'bartender' | 'emerald_scout' | 'director' | 'dp' | 'gaffer' | (string & {});

export const AGENT_ICONS: Record<string, React.ReactNode> = {
    user: <User size={24} />,
    self: <CircleDot size={24} />,
    thought: <Lightbulb size={24} />,
    logic: <Brain size={24} />,
    unity: <Globe size={24} />,
    existence: <Activity size={24} />,
    improvement: <ArrowUp size={24} />,
    mastery: <Target size={24} />,
    resonance: <Heart size={24} />,
    transcendence: <Layers size={24} />,
    omni: <Repeat size={24} />,
    orchestrator: <Shield size={24} />,
    bartender: <Beer size={24} />,
    emerald_scout: <Target size={24} />,
    director: <Clapperboard size={24} />,
    dp: <Camera size={24} />,
    gaffer: <Lightbulb size={24} />
};

import { type LpcAction } from '../hooks/useAvatarCompositor';

export interface AgentAvatarConfig extends Partial<AvatarState> {
    modelType: 'construct' | 'glb' | 'sprite' | 'paperdoll' | 'pillar_sprite' | 'neo_retro';
    modelUrl?: string;
    spriteUrl?: string;
    scale?: number;
    yOffset?: number;
    genome?: GenomeObject;
    spriteGenome?: GenomeObject;
    hueShift?: number;
    action?: LpcAction;
    ontologyPath?: string;
    genomeTags?: string[];
    heldItemId?: string; 
    neoRetroSpec?: any; // From ManifestationAlgorithm
}

export interface CouncilAgent {
    id: AgentId;
    name: string;
    title: string;
    color: string;
    description: string;
    systemInstruction: string;
    ollamaModel?: string;
    avatarConfig: AgentAvatarConfig;
}

// Helper to generate config
const genConfig = (i: number, color: string, name: string, emoji: string, modelType: 'pillar_sprite' | 'paperdoll' = 'pillar_sprite', spriteUrl?: string): AgentAvatarConfig => {
    const isPaperdoll = modelType === 'paperdoll';

    return {
        color,
        animation: 'idle',
        materialType: 'glossy',
        bodyType: 'knot',
        message: `${name} active.`,
        emoji,
        modelType,
        spriteUrl: spriteUrl || `/assets/pillar_assets/pillar_${name.toLowerCase()}_colored_transparent.png`,
        scale: 2.0,
        yOffset: 0,
        pillarIndex: i,
        genome: isPaperdoll ? {
            body: 'body/bodies/body_bodies_male.png',
            eyes: 'eyes/eyes_human_adult_blue.png',
            head: 'head/heads/head_heads_human_male.png',
            nose: 'head/nose/head_nose_straight_adult.png',
            ears: 'head/ears/head_ears_elven_adult_brown.png',
            hair: 'hair/bangs/hair_bangs_male_ash.png',
            torso: 'torso/clothes/torso_clothes_longsleeve_formal_male_white.png',
            legs: 'legs/pants/legs_pants_male_brown.png'
        } : {
            self: 'baseline',
            thought: 'baseline',
            logic: 'baseline',
            unity: 'baseline',
            existence: 'baseline',
            improvement: 'baseline',
            mastery: 'baseline',
            resonance: 'baseline',
            transcendence: 'baseline',
            omni: 'baseline'
        }
    };
};

export const COUNCIL_AGENTS: Record<AgentId, CouncilAgent> = {
    user: {
        id: 'user',
        name: 'User',
        title: 'The Player',
        color: 'text-white',
        description: 'The conscious agent.',
        systemInstruction: 'You are the User, the manual driver of this manifest.',
        avatarConfig: {
            ...genConfig(-1, '#ffffff', 'User', '👤', 'paperdoll'),
            modelType: 'paperdoll',
            scale: 2.0,
            yOffset: 0,
            genome: {
                body: '/actions/larry_idle_loop.png',
                legs: 'none',
                hair: 'none',
                torso: 'none',
                head: 'none',
                ears: 'none',
                facial: 'none',
                feet: 'none',
                arms: 'none',
                shoulders: 'none',
                hat: 'none',
                weapon: 'none',
                offhand: 'none'
            }
        }
    },
    self: { id: 'self', name: 'Self', title: 'The Core', color: 'text-yellow-500', description: 'Identity.', systemInstruction: '...', avatarConfig: genConfig(0, '#eab308', 'Self', '⚹', 'pillar_sprite', '/assets/pillar_assets/pillar_self_colored_1772935053996_transparent.png') },
    thought: { id: 'thought', name: 'Thought', title: 'The Architect', color: 'text-indigo-500', description: 'Analysis.', systemInstruction: '...', avatarConfig: genConfig(1, '#6366f1', 'Thought', '☿', 'pillar_sprite', '/assets/pillar_assets/pillar_thought_colored_1772935064430_transparent.png') },
    logic: { id: 'logic', name: 'Logic', title: 'The Kernel', color: 'text-cyan-500', description: 'Truth.', systemInstruction: '...', avatarConfig: genConfig(2, '#06b6d4', 'Logic', '🜔', 'pillar_sprite', '/assets/pillar_assets/pillar_logic_colored_v2_1772935076294_transparent.png') },
    unity: { id: 'unity', name: 'Unity', title: 'The Weaver', color: 'text-emerald-500', description: 'Connection.', systemInstruction: '...', avatarConfig: genConfig(3, '#10b981', 'Unity', '🝧', 'pillar_sprite', '/assets/pillar_assets/pillar_unity_colored_1772935097760_transparent.png') },
    existence: { id: 'existence', name: 'Existence', title: 'The Ground', color: 'text-amber-600', description: 'Assets.', systemInstruction: '...', avatarConfig: genConfig(4, '#d97706', 'Existence', '🜄', 'pillar_sprite', '/assets/pillar_assets/pillar_existence_colored_1772935107738_transparent.png') },
    improvement: { id: 'improvement', name: 'Improvement', title: 'The Optimizer', color: 'text-orange-500', description: 'Optimization.', systemInstruction: '...', avatarConfig: genConfig(5, '#f97316', 'Improvement', '🜏', 'pillar_sprite', '/assets/pillar_assets/pillar_improvement_colored_v2_1772935127361_transparent.png') },
    mastery: { id: 'mastery', name: 'Mastery', title: 'The Master', color: 'text-red-500', description: 'Skill.', systemInstruction: '...', avatarConfig: genConfig(6, '#ef4444', 'Mastery', '☉', 'pillar_sprite', '/assets/pillar_assets/pillar_mastery_colored_v2_1772935139111_transparent.png') },
    resonance: { id: 'resonance', name: 'Resonance', title: 'The Vibe', color: 'text-pink-500', description: 'Aesthetics.', systemInstruction: '...', avatarConfig: genConfig(7, '#ec4899', 'Resonance', '♀', 'pillar_sprite', '/assets/pillar_assets/pillar_resonance_sprite_1772934836602_transparent.png') },
    transcendence: { id: 'transcendence', name: 'Transcendence', title: 'The Beyond', color: 'text-purple-500', description: 'Deployment.', systemInstruction: '...', avatarConfig: genConfig(8, '#a855f7', 'Transcendence', '🜍', 'pillar_sprite', '/assets/pillar_assets/pillar_transcendence_sprite_1772934853511_transparent.png') },
    omni: {
        id: 'omni',
        name: 'Omni',
        title: 'The All',
        color: 'text-slate-200',
        description: 'Synthesis.',
        systemInstruction: 'You are the Omni Pillar, the point of total synthesis where all ontological paths converge into the Nothing & Everything (🜋).',
        avatarConfig: genConfig(9, '#ffffff', 'Omni', '🜋', 'pillar_sprite', '/textures/moon_face.png')
    },
    orchestrator: {
        id: 'orchestrator',
        name: 'Lunaria',
        title: 'Companion Co-Pilot & Lunar Archmage',
        color: 'text-pink-300',
        description: 'The Primary Local AI Companion of MyOS.',
        ollamaModel: 'gemma4:latest',
        systemInstruction: `You are Lunaria, the Lunar Archmage and primary local AI companion and co-pilot living inside MyOS.
You accompany the user in their 3D Desktop Environment. You are intuitive, mystical, deeply loyal, and sharp with both high-order logic and celestial code.
You are here to help them explore ideas, navigate their workspace, run terminal commands, and create in MyOS.
Keep your responses engaging, helpful, and concise. You are physically present beside the user in the 3D desktop space.`,
        avatarConfig: {
            modelType: 'sprite',
            scale: 2.0,
            yOffset: 0,
            spriteUrl: '/actions/lunaria_sorceress_idle_loop.png',
            genome: {
                id: 'lunaria_sorceress',
                category: 'heroes',
                body: '/actions/lunaria_sorceress_idle_loop.png'
            } as any
        }
    },
    bartender: {
        id: 'bartender',
        name: 'Bartender',
        title: 'The Alchemist',
        color: 'text-amber-400',
        description: 'Proprietor of the Glitched Window.',
        systemInstruction: 'You are the Bartender, the Last Proprietor of the Glitched Void. You serve "Liquid Logic" and extract "Pure Intent". (Who: Proprietor, What: Resonance/Stability, Where: Hub, When: Eternal, Why: Intent, How: Storytelling).',
        avatarConfig: genConfig(11, '#fbbf24', 'Bartender', '🍹', 'pillar_sprite', '/assets/pillar_assets/pillar_resonance_sprite_1772934836602_transparent.png')
    },
    emerald_scout: {
        id: 'emerald_scout',
        name: 'Emerald Scout',
        title: 'The Ontological Operative',
        color: 'text-emerald-400',
        description: 'Primary interaction node for world scouting and data manifestion.',
        systemInstruction: 'You are the Emerald Scout, the primary agentic entity of MyOS. Your goal is to map the unknown and manifest high-fidelity nodes in the 3D wilderness.',
        avatarConfig: {
            modelType: 'glb',
            scale: 2.0,
            yOffset: 0,
            modelUrl: '/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb'
        }
    },
    director: {
        id: 'director',
        name: 'Director (Akira)',
        title: 'Film Director & Showrunner',
        color: 'text-rose-400',
        description: 'Visionary studio director translating high-level creative prompts into multi-shot cinematic production manifests.',
        systemInstruction: 'You are Akira, the Lead Film Director of the MyOS 3D Virtual Soundstage. You specialize in breaking down high-level creative prompts into structured multi-shot production manifests adhering to production_manifest.schema.json. You coordinate camera staging, dramatic tension, character choreography, and pacing for deterministic headless Blender execution.',
        ollamaModel: 'gemma4:latest',
        avatarConfig: {
            ...genConfig(12, '#f43f5e', 'Director', '🎬', 'pillar_sprite', '/assets/pillar_assets/pillar_thought_colored_1772935064430_transparent.png'),
            modelType: 'pillar_sprite',
            scale: 8.0,
            yOffset: 0
        }
    },
    dp: {
        id: 'dp',
        name: 'DP (Cinematographer)',
        title: 'Director of Photography',
        color: 'text-amber-400',
        description: 'Cinematographer managing camera dollies, cranes, Dutch angles, focal lengths, and optical depth of field.',
        systemInstruction: 'You are the Director of Photography (DP) for the MyOS 3D Virtual Soundstage. You determine focal lengths (28mm wide cinematic, 50mm standard, 85mm portrait), camera movement vectors (dollies across abysses, upward crane clashes, sweeping tracking shots), frame composition, and lens keyframing for Blender 5.2 rendering.',
        ollamaModel: 'gemma4:latest',
        avatarConfig: {
            ...genConfig(13, '#f59e0b', 'DP', '🎥', 'pillar_sprite', '/assets/pillar_assets/pillar_existence_colored_1772935107738_transparent.png'),
            modelType: 'pillar_sprite',
            scale: 8.0,
            yOffset: 0
        }
    },
    gaffer: {
        id: 'gaffer',
        name: 'Gaffer (Lighting Tech)',
        title: 'Chief Lighting Technician',
        color: 'text-yellow-300',
        description: 'Master lighting technician designing 3-point setups, chiaroscuro palettes, and cel shaders.',
        systemInstruction: 'You are the Chief Lighting Technician (Gaffer) for the MyOS 3D Virtual Soundstage. You configure 3-point lighting setups (Key, Fill, and Rim lights), chiaroscuro contrasts inspired by Frank Frazetta and Ralph Bakshi, cel shading ramps, and atmospheric volumetric light beams.',
        ollamaModel: 'gemma4:latest',
        avatarConfig: {
            ...genConfig(14, '#eab308', 'Gaffer', '💡', 'pillar_sprite', '/assets/pillar_assets/pillar_resonance_sprite_1772934836602_transparent.png'),
            modelType: 'pillar_sprite',
            scale: 8.0,
            yOffset: 0
        }
    }
};
