// apps/web/src/components/World/FilmSetWorld.tsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ParallaxatronEngine, type ParallaxLayerSpec } from './ParallaxatronEngine';
import { SpatialPropCompositor, type SpatialPropItem } from './SpatialPropCompositor';
import { FILM_CHARACTER_ARCHETYPES, type CharacterArchetype } from './filmArchetypes';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { useCanvasRecorder } from '../../hooks/useCanvasRecorder';

export interface FilmSetWorldProps {
    isActive?: boolean;
    playerPosition?: [number, number, number] | THREE.Vector3;
    onDimensionSwap?: (dim: string) => void;
    onOpenSlate?: () => void;
    selectedArchetypeKey?: string;
    actionTriggerKey?: number;
    resetTriggerKey?: number;
    onActionComplete?: () => void;
}

// Multiplane Parallax Cylinder Specifications for FilmSetWorld
const FILMSET_PARALLAX_LAYERS: ParallaxLayerSpec[] = [
    {
        id: 'filmset_sky',
        geometryType: 'cylinder',
        textureUrl: '/assets/textures/parallax_sky_layer1.png',
        radius: 1200,
        height: 800,
        position: [0, 120, 0],
        isStationary: false,
        speedY: 0.002,
        repeatX: 4,
        repeatY: 1
    },
    {
        id: 'filmset_clouds',
        geometryType: 'cylinder',
        textureUrl: '/assets/textures/parallax_clouds_layer2.png',
        radius: 950,
        height: 600,
        position: [0, 90, 0],
        isStationary: false,
        speedY: 0.008,
        opacity: 0.9,
        alphaTest: 0.05,
        repeatX: 3,
        repeatY: 1
    },
    {
        id: 'filmset_distant_silhouettes',
        geometryType: 'cylinder',
        textureUrl: '/assets/textures/parallax_creatures_layer3.png',
        radius: 750,
        height: 450,
        position: [0, 60, 0],
        isStationary: false,
        speedY: 0.015,
        opacity: 0.85,
        alphaTest: 0.05,
        repeatX: 3,
        repeatY: 1
    }
];

// Midground Environmental Props
const FILMSET_PROPS: SpatialPropItem[] = [
    {
        id: 'prop_tree_1',
        name: 'Stage Tree Left',
        textureUrl: '/assets/lpc/green_trees_0.png',
        position: [-16, 0, -4],
        scale: [5, 6, 1]
    },
    {
        id: 'prop_tree_2',
        name: 'Stage Tree Right',
        textureUrl: '/assets/lpc/cherry_blossom_trees_1.png',
        position: [16, 0, -5],
        scale: [5.5, 6.5, 1]
    },
    {
        id: 'prop_street_lamp_1',
        name: 'Key Lamp Left',
        textureUrl: '/assets/lpc/street_light.png',
        position: [-8, 0, -2],
        scale: [1.8, 3.2, 1]
    },
    {
        id: 'prop_street_lamp_2',
        name: 'Key Lamp Right',
        textureUrl: '/assets/lpc/street_light.png',
        position: [8, 0, -2],
        scale: [1.8, 3.2, 1]
    }
];

export const FilmSetWorld: React.FC<FilmSetWorldProps> = ({
    isActive = true,
    playerPosition = [0, 0, 0],
    onDimensionSwap,
    onOpenSlate,
    selectedArchetypeKey: propSelectedArchetypeKey,
    actionTriggerKey,
    resetTriggerKey,
    onActionComplete
}) => {
    const { camera } = useThree();
    const { isRecording, formattedDuration, startRecording, stopRecording } = useCanvasRecorder();

    // Archetype selection - prioritize prop if provided
    const [internalArchetypeKey, setInternalArchetypeKey] = useState<string>('larry_technician');
    const activeKey = propSelectedArchetypeKey || internalArchetypeKey;
    const archetype: CharacterArchetype = FILM_CHARACTER_ARCHETYPES[activeKey] || FILM_CHARACTER_ARCHETYPES.larry_technician;

    // Choreography State Machine
    const [isActionRunning, setIsActionRunning] = useState(false);
    const [choreographyProgress, setChoreographyProgress] = useState(0); // 0 to 1
    const [actorCurrentAction, setActorCurrentAction] = useState<string>('idle');
    const [actorPos, setActorPos] = useState<[number, number, number]>([-10, 0, 0]);

    // Hover states for in-world triggers
    const [isHoveringSlate, setIsHoveringSlate] = useState(false);
    const [isHoveringDoor, setIsHoveringDoor] = useState(false);

    // Resilient floor texture loader with procedural fallback
    const [floorTexture, setFloorTexture] = useState<THREE.Texture>(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 128, 128);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(16, 16);
        return tex;
    });

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
            '/textures/stone_floor_1.jpg',
            (tex) => {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(16, 16);
                setFloorTexture(tex);
            },
            undefined,
            (err) => {
                console.warn('[FilmSetWorld] Could not load stone floor texture. Using resilient fallback.', err);
            }
        );
    }, []);

    // External triggers from SoundstageDirectorRemote
    useEffect(() => {
        if (actionTriggerKey && actionTriggerKey > 0) {
            triggerAction();
        }
    }, [actionTriggerKey]);

    useEffect(() => {
        if (resetTriggerKey && resetTriggerKey > 0) {
            resetStage();
        }
    }, [resetTriggerKey]);

    // Choreography Animation Loop
    useFrame((_state, delta) => {
        if (!isActionRunning) return;

        setChoreographyProgress(prev => {
            const next = prev + delta * 0.12; // ~8.3 seconds full take
            if (next >= 1.0) {
                // Take complete
                setIsActionRunning(false);
                setActorCurrentAction('idle');
                onActionComplete?.();
                return 1.0;
            }

            // Phase 1 (0.0 to 0.4): Walk from Mark A (-10) to Mark Center (0)
            if (next < 0.4) {
                const t = next / 0.4;
                const newX = -10 + t * 10;
                setActorPos([newX, 0, 0]);
                setActorCurrentAction('walk');
            }
            // Phase 2 (0.4 to 0.75): Stop at Center Mark and perform Primary Hero Action
            else if (next < 0.75) {
                setActorPos([0, 0, 0]);
                setActorCurrentAction(archetype.defaultActions.actionPrimary);
            }
            // Phase 3 (0.75 to 1.0): Victory Pose / Dance
            else {
                setActorPos([0, 0, 0]);
                setActorCurrentAction(archetype.defaultActions.victory);
            }

            return next;
        });
    });

    const triggerAction = () => {
        setChoreographyProgress(0);
        setActorPos([-10, 0, 0]);
        setActorCurrentAction('walk');
        setIsActionRunning(true);
    };

    const resetStage = () => {
        setIsActionRunning(false);
        setChoreographyProgress(0);
        setActorPos([-10, 0, 0]);
        setActorCurrentAction('idle');
    };

    const triggerRecordedTake = async () => {
        resetStage();
        await startRecording(`take_${archetype.id}`);
        triggerAction();

        // Automatically stop recording when choreography finishes (~9 seconds)
        setTimeout(() => {
            stopRecording();
        }, 9000);
    };

    if (!isActive) return null;

    return (
        <group name="FilmSetWorld">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 1. LIGHTING RIG (Cinematic 3-Point Cel / Chiaroscuro Stage)       */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <ambientLight intensity={0.6} color="#e0f2fe" />
            {/* Key Sun (Warm Golden Spotlight onto Actor Mark) */}
            <directionalLight
                position={[15, 25, 15]}
                intensity={2.2}
                color="#fef08a"
                castShadow
                shadow-mapSize={[2048, 2048]}
            />
            {/* Rim Light (High Contrast Silhouette Accent) */}
            <directionalLight
                position={[-18, 14, -12]}
                intensity={1.8}
                color={archetype.colorAccent}
            />
            {/* Soft Ambient Fill */}
            <pointLight position={[0, 8, 4]} intensity={1.2} color="#93c5fd" distance={30} />

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 2. MULTIPLANE CYCLOTROPIC PARALLAX CYLINDERS (Astra Lab Substrate)*/}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <ParallaxatronEngine
                customLayers={FILMSET_PARALLAX_LAYERS}
                anchorPosition={[0, 0, 0]}
            />

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 3. THE SOUNDSTAGE FLOOR & DIRECTOR'S MARKS                       */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[120, 80]} />
                <meshStandardMaterial
                    map={floorTexture}
                    roughness={0.7}
                    metalness={0.15}
                    color="#1e293b"
                />
            </mesh>

            {/* Subtle Stage Grid */}
            <gridHelper args={[100, 50, '#38bdf8', '#1e293b']} position={[0, 0.005, 0]} />

            {/* Mark A (Stage Left Spawning Plinth) */}
            <group position={[-10, 0.01, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.7, 0.9, 32]} />
                    <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <Text position={[0, 0.05, 1.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.35} color="#38bdf8">
                    MARK A
                </Text>
            </group>

            {/* Mark Center (Hero Action Plinth) */}
            <group position={[0, 0.01, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.0, 1.25, 32]} />
                    <meshBasicMaterial color="#fbbf24" />
                </mesh>
                <Text position={[0, 0.05, 1.8]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.4} color="#fbbf24">
                    ★ MARK CENTER (ACTION SPOT)
                </Text>
            </group>

            {/* Mark B (Stage Right Exit Plinth) */}
            <group position={[10, 0.01, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.7, 0.9, 32]} />
                    <meshBasicMaterial color="#f43f5e" />
                </mesh>
                <Text position={[0, 0.05, 1.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.35} color="#f43f5e">
                    MARK B
                </Text>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 4. MIDGROUND ENVIRONMENTAL PROPS                                 */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <SpatialPropCompositor props={FILMSET_PROPS} />

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 5. THE ACTOR MARK (BILLBOARD SPRITE ON STAGE)                    */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group position={actorPos}>
                {/* Character Aura / Spotlight */}
                <pointLight position={[0, 2.5, 0.5]} intensity={1.5} color={archetype.emissiveColor} distance={8} />

                {/* Overhead Dynamic Actor Tag */}
                <Text
                    position={[0, 3.2, 0]}
                    fontSize={0.22}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {`${archetype.name.toUpperCase()} (${actorCurrentAction.toUpperCase()})`}
                </Text>

                {/* The Stage Performer */}
                <SemanticAvatar
                    position={[0, 0, 0]}
                    scale={archetype.stageScale[0]}
                    velocity={actorCurrentAction === 'walk' ? [1, 0, 0] : [0, 0, 0]}
                    action={actorCurrentAction === 'walk' ? 'walk' : 'idle'}
                    genome={{
                        body: archetype.spriteSheetUrl || '/actions/flesh_base_mannequin_idle_loop.png'
                    }}
                />
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 6. SILHOUETTED FOREGROUND MULTIPLANE FRAME (DISNEY 1937 CAMERA)   */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group position={[0, 5, 8]}>
                {/* Overhanging Left Foreground Silhouette */}
                <mesh position={[-11, 0, 0]} rotation={[0, 0, 0.15]}>
                    <boxGeometry args={[4.5, 14, 0.2]} />
                    <meshBasicMaterial color="#030712" />
                </mesh>
                {/* Overhanging Right Foreground Silhouette */}
                <mesh position={[11, 0, 0]} rotation={[0, 0, -0.15]}>
                    <boxGeometry args={[4.5, 14, 0.2]} />
                    <meshBasicMaterial color="#030712" />
                </mesh>
                {/* Top Overhead Theatrical Proscenium Rafters */}
                <mesh position={[0, 6.5, 0]}>
                    <boxGeometry args={[30, 2.5, 0.2]} />
                    <meshBasicMaterial color="#030712" />
                </mesh>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 7. DIEGETIC 3D DIRECTOR'S CLAPPERBOARD PROP                      */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[-6, 1.2, 5]}
                rotation={[0, 0.35, 0]}
                onClick={() => triggerAction()}
                onPointerOver={() => setIsHoveringSlate(true)}
                onPointerOut={() => setIsHoveringSlate(false)}
            >
                {/* Tripod Stand */}
                <mesh position={[0, -0.6, 0]}>
                    <cylinderGeometry args={[0.04, 0.07, 1.2, 16]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} />
                </mesh>
                {/* Slate Board */}
                <mesh position={[0, 0.2, 0]} rotation={[-0.2, 0, 0]}>
                    <boxGeometry args={[1.8, 1.2, 0.05]} />
                    <meshStandardMaterial
                        color={isHoveringSlate ? '#1e1b4b' : '#09090b'}
                        roughness={0.4}
                        metalness={0.2}
                    />
                </mesh>
                {/* Top Clapper Arm */}
                <mesh position={[0, 0.82, 0.01]} rotation={[-0.2, 0, isActionRunning ? 0.25 : 0.05]}>
                    <boxGeometry args={[1.8, 0.18, 0.06]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.3} />
                </mesh>
                {/* Diegetic Chalk Labels */}
                <Text
                    position={[0, 0.5, 0.04]}
                    rotation={[-0.2, 0, 0]}
                    fontSize={0.095}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    MYOS SOVEREIGN SOUNDSTAGE
                </Text>
                <Text
                    position={[0, 0.28, 0.04]}
                    rotation={[-0.2, 0, 0]}
                    fontSize={0.08}
                    color="#f43f5e"
                    anchorX="center"
                    anchorY="middle"
                >
                    {`SCENE: 01  |  TAKE: ${archetype.name.toUpperCase()}`}
                </Text>
                <Text
                    position={[0, 0.06, 0.04]}
                    rotation={[-0.2, 0, 0]}
                    fontSize={0.065}
                    color={isActionRunning ? '#fbbf24' : '#94a3b8'}
                    anchorX="center"
                    anchorY="middle"
                >
                    {isActionRunning ? '▶ [ROLLING TAKE]' : '[CLICK SLATE TO CALL ACTION]'}
                </Text>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 8. IN-WORLD PORTAL DOOR: ➔ TO THE GRAND CINEMA                  */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[24.0, 2.2, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                onClick={() => onDimensionSwap?.('cinema')}
                onPointerOver={() => setIsHoveringDoor(true)}
                onPointerOut={() => setIsHoveringDoor(false)}
            >
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[4.0, 4.4, 0.4]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
                <mesh position={[-0.95, -0.1, 0.05]}>
                    <boxGeometry args={[1.8, 4.0, 0.1]} />
                    <meshStandardMaterial
                        color={isHoveringDoor ? '#f43f5e' : '#4c0519'}
                        roughness={0.5}
                        metalness={0.3}
                    />
                </mesh>
                <mesh position={[0.95, -0.1, 0.05]}>
                    <boxGeometry args={[1.8, 4.0, 0.1]} />
                    <meshStandardMaterial
                        color={isHoveringDoor ? '#f43f5e' : '#4c0519'}
                        roughness={0.5}
                        metalness={0.3}
                    />
                </mesh>
                <mesh position={[0, 2.5, 0.2]}>
                    <boxGeometry args={[4.6, 0.8, 0.15]} />
                    <meshStandardMaterial
                        color="#881337"
                        emissive="#f43f5e"
                        emissiveIntensity={isHoveringDoor ? 1.0 : 0.6}
                    />
                </mesh>
                <Text
                    position={[0, 2.5, 0.32]}
                    fontSize={0.28}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    ➔ THE GRAND CINEMA
                </Text>
            </group>
        </group>
    );
};

export default FilmSetWorld;
