import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';
import { useAvatarCompositor, type LpcAction } from '../../hooks/useAvatarCompositor';
import { type KinesicVector } from '../MaxOverlay/types';
import { useOntologicalGenome } from '../../hooks/useOntologicalGenome';
import { useLpcManifest } from '../../hooks/useLpcManifest';
// --- SEMANTIC DEFINITIONS ---



// Semantic definitions based on the 8-Layer Quarks-to-Pillars architecture.
export type SemanticState = "self" | "thought" | "logic" | "unity" | "existence" | "improvement" | "mastery" | "resonance" | "transcendence" | "omni";

export const PILLAR_NAMES: SemanticState[] = ["self", "thought", "logic", "unity", "existence", "improvement", "mastery", "resonance", "transcendence", "omni"];

interface SemanticAvatarProps {
    genome?: Record<string, string | undefined>;
    pillarIndex?: number;
    pillarName?: string; // The AgentId string
    position?: [number, number, number];
    velocity?: [number, number, number];
    cameraRotationY?: number;
    action?: LpcAction;
    scale?: number;
    hueShift?: number;
    ontologyPath?: string;
    inkStyle?: 'bold' | 'default' | 'none';
    kinesicVector?: KinesicVector;
    impactPulse?: number;
    isMounted?: boolean;
    horseType?: number;
    isNeoRetro?: boolean;
}

export function SemanticAvatar({
    genome: propGenome,
    pillarIndex = 0,
    pillarName = 'self',
    position = [0, 0, 0],
    velocity = [0, 0, 0],
    cameraRotationY = 0,
    action: propAction,
    scale = 1,
    hueShift: propHueShift,
    ontologyPath,
    inkStyle = 'bold',
    kinesicVector,
    isMounted,
    horseType,
    isNeoRetro = true
}: SemanticAvatarProps) {
    const { camera } = useThree();
    // Setup
    const meshRef = useRef<THREE.Mesh>(null);
    const textureRef = useRef<THREE.CanvasTexture | null>(null);
    const { agentGenomes, agentMessages } = useCouncil();
    const manifest = useLpcManifest();
    const lastAnimUpdate = useRef(0);

    // Dynamic Genome from Ontology/Persona (Baseline)
    const { genome: ontGenome, hue: ontHue } = useOntologicalGenome(ontologyPath || '', manifest);

    // Derived Action & Direction
    const isMoving = Math.abs(velocity[0]) > 0.1 || Math.abs(velocity[2]) > 0.1;
    const action: LpcAction = propAction || (isMoving ? 'walk' : 'idle');

    const agentId = pillarName as AgentId;
    const persistedData = agentGenomes[agentId];

    // --- GENOME UNWRAPPING & FUSION ---
    const persistedGenome = persistedData?.genome || persistedData;
    const persistedHue = persistedData?.hueShift;

    const defaultValidGenome = {
        body: 'body/bodies/body_bodies_male.png',
        eyes: 'eyes/human/eyes_human_adult_blue.png',
        head: 'head/heads/head_heads_human_male.png',
        legs: 'legs/pants/legs_pants_male_brown.png',
        hair: 'hair/bangs/hair_bangs_male_orange.png'
    };

    const incoming = (propGenome as any)?.genome || propGenome || persistedGenome || {};
    const hasStandaloneBody = incoming.body && incoming.body !== 'none';
    const isActionBody = typeof incoming.body === 'string' && (incoming.body.includes('/actions/') || incoming.body.includes('_loop.png') || incoming.body.includes('_preview.png'));

    let finalGenome: Record<string, string>;
    if (hasStandaloneBody && (isActionBody || (incoming.hair === 'none' && incoming.legs === 'none'))) {
        finalGenome = {
            body: incoming.body,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none',
            ...incoming
        };
    } else {
        const baseGenome = (ontGenome && ontologyPath) ? ontGenome : defaultValidGenome;
        finalGenome = {
            ...baseGenome,
            ...incoming
        };
    }

    if (pillarName === 'horse') {
        finalGenome = {
            body: `horse_${pillarIndex}_eb.png`
        };
    }

    const isChibiAdventurer = Boolean(finalGenome.body && (finalGenome.body.includes('chibi_adventurer') || finalGenome.body.includes('chibi_fighter') || finalGenome.body.includes('fighter')));
    const isMannequin = Boolean(finalGenome.body && (finalGenome.body.includes('humanoid_mannequin') || finalGenome.body.includes('flesh_base_mannequin')));
    const isLpcMannequin = Boolean(finalGenome.body && (finalGenome.body.includes('lpc_mannequin') || finalGenome.body.includes('lpc_modern')));
    const isMoonlitMage = Boolean(finalGenome.body && finalGenome.body.includes('moonlit_mage'));
    const isSunlitPaladin = Boolean(finalGenome.body && finalGenome.body.includes('sunlit_paladin'));
    const isShadowRogue = Boolean(finalGenome.body && (finalGenome.body.includes('shadow_rogue') || finalGenome.body.includes('rogue')));
    const isFrankie = Boolean(finalGenome.body && (finalGenome.body.includes('frankie') || finalGenome.body.includes('squirrel')));
    const isFleshFemaleAdventurer = Boolean(finalGenome.body && (finalGenome.body.includes('flesh_female') || finalGenome.body.includes('flesh_adventurer')));
    const hasShapeshiftLayers = Boolean((finalGenome.torso && finalGenome.torso !== 'none') || (finalGenome.hair && finalGenome.hair !== 'none') || (finalGenome.legs && finalGenome.legs !== 'none'));
    const isEinstein = Boolean(
        (finalGenome.body && finalGenome.body.includes('einstein')) ||
        (pillarName === 'orchestrator' && !hasShapeshiftLayers && (!finalGenome.body || finalGenome.body.includes('einstein') || finalGenome.body.includes('flesh_base')))
    );
    const isLarry = Boolean(finalGenome.body && finalGenome.body.includes('larry'));
    
    // Dynamic match for ANY synthesized / registered action sheet in /actions/
    const actionMatch = finalGenome.body ? finalGenome.body.match(/\/actions\/([a-zA-Z0-9_-]+?)_(?:idle|walk|run|sprint|slash|spellcast|hurt|death|preview)(?:_loop)?\.png/i) : null;
    const isGenericActionSheet = Boolean(actionMatch && !isChibiAdventurer && !isMannequin && !isLpcMannequin && !isMoonlitMage && !isSunlitPaladin && !isShadowRogue && !isFrankie && !isFleshFemaleAdventurer && !isEinstein && !isLarry);

    const isStandaloneActionSheet = isChibiAdventurer || isMannequin || isLpcMannequin || isMoonlitMage || isSunlitPaladin || isShadowRogue || isFrankie || isFleshFemaleAdventurer || isEinstein || isLarry || isGenericActionSheet || isActionBody;

    if (isFleshFemaleAdventurer) {
        let actionSheet = '/actions/flesh_female_adventurer_idle.png';
        if (action === 'walk' || (action as any) === 'move') {
            actionSheet = '/actions/flesh_female_adventurer_walk.png';
        } else if (action === 'run' || (action as any) === 'sprint') {
            actionSheet = '/actions/flesh_female_adventurer_run.png';
        } else if (action === 'clothing_layer' || (action as any) === 'layer') {
            actionSheet = '/actions/clothing_layer_forest_traveler_walk.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isChibiAdventurer) {
        let actionSheet = '/actions/chibi_adventurer_idle_loop.png';
        if (action === 'walk') {
            actionSheet = '/actions/chibi_adventurer_walk_loop.png';
        } else if (action === 'sprint' || action === 'run') {
            actionSheet = '/actions/chibi_adventurer_run_loop.png';
        } else if (action === 'slash') {
            actionSheet = '/actions/chibi_adventurer_slash_loop.png';
        } else if (action === 'spellcast') {
            actionSheet = '/actions/chibi_adventurer_spellcast_loop.png';
        } else if (action === 'hurt') {
            actionSheet = '/actions/chibi_adventurer_hurt_loop.png';
        } else if (action === 'death') {
            actionSheet = '/actions/chibi_adventurer_death_loop.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isMoonlitMage) {
        let actionSheet = '/actions/moonlit_mage_idle_loop.png';
        if (action === 'walk' || (action as any) === 'move') {
            actionSheet = '/actions/moonlit_mage_walk_loop.png';
        } else if (action === 'sprint' || action === 'run' || (action as any) === 'dash') {
            actionSheet = '/actions/moonlit_mage_run_loop.png';
        } else if (action === 'slash' || (action as any) === 'melee_attack') {
            actionSheet = '/actions/moonlit_mage_slash_loop.png';
        } else if (action === 'spellcast' || (action as any) === 'cast_spell' || (action as any) === 'ranged_attack') {
            actionSheet = '/actions/moonlit_mage_spellcast_loop.png';
        } else if (action === 'hurt' || (action as any) === 'take_damage') {
            actionSheet = '/actions/moonlit_mage_hurt_loop.png';
        } else if (action === 'death') {
            actionSheet = '/actions/moonlit_mage_death_loop.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isSunlitPaladin) {
        let actionSheet = '/actions/sunlit_paladin_idle_loop.png';
        if (action === 'walk' || (action as any) === 'move') {
            actionSheet = '/actions/sunlit_paladin_walk_loop.png';
        } else if (action === 'sprint' || action === 'run' || (action as any) === 'dash') {
            actionSheet = '/actions/sunlit_paladin_run_loop.png';
        } else if (action === 'slash' || (action as any) === 'melee_attack' || (action as any) === 'attack') {
            actionSheet = '/actions/sunlit_paladin_slash_loop.png';
        } else if (action === 'spellcast' || (action as any) === 'cast_spell' || (action as any) === 'ranged_attack') {
            actionSheet = '/actions/sunlit_paladin_spellcast_loop.png';
        } else if (action === 'hurt' || (action as any) === 'take_damage') {
            actionSheet = '/actions/sunlit_paladin_hurt_loop.png';
        } else if (action === 'death') {
            actionSheet = '/actions/sunlit_paladin_death_loop.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isShadowRogue) {
        let actionSheet = '/actions/shadow_rogue_idle_loop.png';
        if (action === 'walk' || (action as any) === 'move') {
            actionSheet = '/actions/shadow_rogue_walk_loop.png';
        } else if (action === 'sprint' || action === 'run' || (action as any) === 'dash') {
            actionSheet = '/actions/shadow_rogue_run_loop.png';
        } else if (action === 'slash' || (action as any) === 'melee_attack' || (action as any) === 'attack') {
            actionSheet = '/actions/shadow_rogue_slash_loop.png';
        } else if (action === 'spellcast' || (action as any) === 'cast_spell' || (action as any) === 'ranged_attack') {
            actionSheet = '/actions/shadow_rogue_spellcast_loop.png';
        } else if (action === 'hurt' || (action as any) === 'take_damage') {
            actionSheet = '/actions/shadow_rogue_hurt_loop.png';
        } else if (action === 'death') {
            actionSheet = '/actions/shadow_rogue_death_loop.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isMannequin) {
        const isFleshBase = Boolean(finalGenome.body && finalGenome.body.includes('flesh_base_mannequin'));
        let actionSheet = isFleshBase ? '/actions/flesh_base_mannequin_idle_loop.png' : '/actions/humanoid_mannequin_idle_loop.png';
        if (action === 'walk') {
            actionSheet = isFleshBase ? '/actions/flesh_base_mannequin_walk_loop.png' : '/actions/humanoid_mannequin_walk_loop.png';
        } else if (action === 'sprint' || action === 'run') {
            actionSheet = isFleshBase ? '/actions/flesh_base_mannequin_sprint_loop.png' : '/actions/humanoid_mannequin_run_loop.png';
        } else if (action === 'slash') {
            actionSheet = isFleshBase ? '/actions/flesh_base_mannequin_slash_loop.png' : '/actions/humanoid_mannequin_slash_loop.png';
        } else if (action === 'spellcast') {
            actionSheet = isFleshBase ? '/actions/flesh_base_mannequin_spellcast_loop.png' : '/actions/humanoid_mannequin_spellcast_loop.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isLpcMannequin) {
        let actionSheet = '/actions/lpc_mannequin_8way_idle.png';
        if (action === 'walk' || (action as any) === 'move' || (action as any) === 'run' || (action as any) === 'sprint') {
            actionSheet = '/actions/lpc_mannequin_8way_walk.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isFrankie) {
        let actionSheet = '/actions/frankie_8way_idle.png';
        if (action === 'walk' || (action as any) === 'move' || (action as any) === 'run' || (action as any) === 'sprint') {
            actionSheet = '/actions/frankie_8way_walk.png';
        } else if (action === 'spellcast' || (action as any) === 'talk' || (action as any) === 'visemes') {
            actionSheet = '/actions/frankie_8way_visemes.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isEinstein) {
        let actionSheet = '/actions/einstein_idle_loop.png';
        if (action === 'walk' || (action as any) === 'move') {
            actionSheet = '/actions/einstein_walk_loop.png';
        } else if (action === 'sprint' || action === 'run' || (action as any) === 'dash') {
            actionSheet = '/actions/einstein_run_loop.png';
        } else if (action === 'spellcast' || (action as any) === 'cast_spell' || (action as any) === 'repair') {
            actionSheet = '/actions/einstein_spellcast_loop.png';
        } else if (action === 'agreeing') {
            actionSheet = '/actions/flesh_base_mannequin_sitting_talk_loop.png';
        } else if (action === 'dismissing_gesture' || action === 'combat_idle') {
            actionSheet = '/actions/flesh_base_mannequin_combat_idle_loop.png';
        } else if (action === 'dance') {
            actionSheet = '/actions/flesh_base_mannequin_dance_loop.png';
        } else if (action === 'talk') {
            actionSheet = '/actions/einstein_spellcast_loop.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isLarry) {
        let actionSheet = '/actions/larry_idle_loop.png';
        if (action === 'walk' || (action as any) === 'move') {
            actionSheet = '/actions/larry_walk_loop.png';
        } else if (action === 'sprint' || action === 'run' || (action as any) === 'dash') {
            actionSheet = '/actions/larry_sprint_loop.png';
        } else if ((action as any) === 'repair' || (action as any) === 'interact' || action === 'spellcast' || (action as any) === 'slash') {
            actionSheet = '/actions/larry_repair_loop.png';
        } else if (action === 'hurt' || (action as any) === 'damage') {
            actionSheet = '/actions/larry_damage_loop.png';
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    } else if (isGenericActionSheet && actionMatch) {
        const slug = actionMatch[1];
        let actionSheet = `/actions/${slug}_idle_loop.png`;
        if (action === 'walk' || (action as any) === 'move') {
            actionSheet = `/actions/${slug}_walk_loop.png`;
        } else if (action === 'sprint' || action === 'run' || (action as any) === 'dash') {
            actionSheet = `/actions/${slug}_run_loop.png`;
        } else if (action === 'spellcast' || (action as any) === 'cast_spell' || (action as any) === 'talk') {
            actionSheet = `/actions/${slug}_spellcast_loop.png`;
        }
        finalGenome = {
            body: actionSheet,
            hair: 'none',
            legs: 'none',
            torso: 'none',
            feet: 'none',
            arms: 'none',
            head: 'none',
            eyes: 'none'
        };
    }

    const animTimeRef = useRef(0);
    const frameInterval = isStandaloneActionSheet ? 0.00833 : 0.0833; // 120 FPS ultra-high refresh rate sync (0.00833s per frame)

    useFrame((_, delta) => {
        lastAnimUpdate.current += delta;
        if (lastAnimUpdate.current < frameInterval) return;

        const tickDelta = lastAnimUpdate.current;
        lastAnimUpdate.current = 0;

        let nextTime = animTimeRef.current;
        if (action === 'walk') {
            nextTime = (animTimeRef.current + tickDelta * 1.0) % 1;
        } else if (action === 'sprint' || action === 'run') {
            nextTime = (animTimeRef.current + tickDelta * (isStandaloneActionSheet ? 2.0 : 1.5)) % 1;
        } else if (action === 'idle') {
            nextTime = isStandaloneActionSheet ? (animTimeRef.current + tickDelta * 0.5) % 1 : 0;
        } else {
            nextTime = Math.min(1, animTimeRef.current + tickDelta / (isStandaloneActionSheet ? 0.5 : 0.6));
        }

        if (Math.abs(nextTime - animTimeRef.current) > 0.001 || (action === 'idle' && !isStandaloneActionSheet && animTimeRef.current !== 0)) {
            animTimeRef.current = nextTime;
            if (drawNowRef.current) drawNowRef.current();
        }
    });

    // Cleanup resources
    useEffect(() => {
        return () => {
            if (textureRef.current) {
                textureRef.current.dispose();
            }
        };
    }, []);

    const [lastDir, setLastDir] = useState<'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR'>('D');

    // Key-Locked direction calculation
    const direction = useMemo(() => {
        const vel = new THREE.Vector3(velocity[0], 0, velocity[2]);
        if (vel.length() < 0.001) return lastDir;

        // --- CAMERA-ALIGNMENT SINGULARITY ---
        // We transform the velocity vector by the camera rotation so that 
        // "Forward/Up" is always "Away from the screen".
        if (cameraRotationY) {
            vel.applyAxisAngle(new THREE.Vector3(0, 1, 0), -cameraRotationY);
        }

        let newDir = lastDir;

        const angle = Math.atan2(vel.z, vel.x);
        let index = Math.round(angle / (Math.PI / 4));
        if (index < 0) index += 8;
        if (index === 8) index = 0;
        
        const dirs = ['R', 'DR', 'D', 'DL', 'L', 'UL', 'U', 'UR'] as const;
        newDir = dirs[index];

        return newDir;
    }, [velocity, lastDir, cameraRotationY]);

    const quadHeight = scale * (isStandaloneActionSheet ? 1.05 : 1.0);
    const halfHeight = quadHeight * 0.5;

    useFrame((stateObj) => {
        if (meshRef.current) {
            // Clean bottom-edge plane alignment: bottom edge sits flush at y=0 on raycasted polygon surface
            const groundSink = 0.12 * scale;
            meshRef.current.position.y = halfHeight - groundSink;
            
            // Perfect Y-Axis Billboard Singularity
            // Using absolute quaternion copy for Y-rotation prevents 'Inside-Out' disappearing
            const lookTarget = new THREE.Vector3();
            stateObj.camera.getWorldPosition(lookTarget);
            
            const worldPos = new THREE.Vector3();
            meshRef.current.getWorldPosition(worldPos);
            
            meshRef.current.lookAt(lookTarget.x, worldPos.y, lookTarget.z);
        }
    });

    useEffect(() => {
        if (direction !== lastDir) {
            setLastDir(direction);
        }
    }, [direction, lastDir]);

    useEffect(() => {
        // Reset animation timer whenever the action changes to a non-looping one (e.g. slash, hurt)
        if (!['walk', 'sprint', 'run', 'idle'].includes(action)) {
            animTimeRef.current = 0;
            if (drawNowRef.current) drawNowRef.current();
        }
    }, [action]);

    // Consolidated Hue calculation
    const hueShift = propHueShift ?? (ontologyPath ? ontHue : (persistedHue ?? 0));

    const flagTextureUpdate = useCallback(() => {
        if (textureRef.current) {
            textureRef.current.needsUpdate = true;
        }
    }, []);

    const [atlas, setAtlas] = useState<any>(null);
    useEffect(() => {
        if (finalGenome.body?.includes('4004.png')) {
            fetch('/assets/ZAMN_Assets/zeke_atlas.json')
                .then(r => r.json())
                .then(setAtlas)
                .catch(err => console.error("ZAMN Atlas Load Fail", err));
        } else {
            setAtlas(null);
        }
    }, [finalGenome.body]);

    const drawNowRef = useRef<() => void>();

    // Use our new consolidated compositor
    const { canvas, draw } = useAvatarCompositor(
        finalGenome,
        action,
        direction as any,
        animTimeRef,
        {
            resolution: isStandaloneActionSheet ? 512 : 256,
            showGlow: false,
            allowRunningActions: isMoving, // Enable Running Slash!
            atlas: atlas || undefined,
            onRender: flagTextureUpdate,
            inkStyle: isStandaloneActionSheet ? 'none' : inkStyle,
            contrast: 1.0,
            celLevels: isStandaloneActionSheet ? 0 : 5,
            kinesicVector,
            isMounted,
            horseType
        }
    );

    useEffect(() => {
        drawNowRef.current = draw;
    }, [draw]);


    return (
        <group position={position}>
            <mesh 
                ref={meshRef} 
                scale={[quadHeight, quadHeight, 1]} 
                position={[0, halfHeight, 0]}
                frustumCulled={false}
                renderOrder={100}
            >

                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial 
                    transparent={true} 
                    side={THREE.DoubleSide} 
                    depthWrite={false} 
                    toneMapped={false}
                    alphaTest={0.01}
                >
                    <canvasTexture
                        ref={textureRef}
                        attach="map"
                        image={canvas}
                        magFilter={isMannequin ? THREE.LinearFilter : THREE.NearestFilter}
                        minFilter={isMannequin ? THREE.LinearFilter : THREE.NearestFilter}
                        colorSpace={THREE.SRGBColorSpace}
                    />
                </meshBasicMaterial>
            </mesh>

        </group>
    );
}

