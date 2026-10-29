/** @version 1.1.0-Omni @timestamp 2026-04-06 18:50 @author Antigravity-Omni */
import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, TransformControls, Html } from '@react-three/drei';

import * as THREE from 'three';
import type { FloorConfig } from './types';
import { COUNCIL_AGENTS, type CouncilAgent, type AgentId } from '../../council/agentRegistry';
import { useCouncil } from '../../council/CouncilContext';
import { WorldProps } from '../World/WorldProps';
// import { VoxelSprite } from '../World/VoxelSprite';
import { AvatarController } from '../Avatars/AvatarController';
import { generateCharacterSheet } from '../../engine/CharacterGenerator';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import type { LpcAction } from '../../hooks/useAvatarCompositor';
import { genomeFromPersonaTags } from '../../hooks/useOntologicalGenome';
import { useLpcManifest } from '../../hooks/useLpcManifest';
import { PILLAR_CLASSES } from '../../utils/pillarClasses';
import { PillarSprite } from '../Avatars/PillarSprite';
import { Fragment } from '../World/Fragment';
import { useWorld } from '../../engine/WorldContext';
import { topographyRegistry } from '../../engine/TopographyRegistry';

// --- SHARED KINETICS ---
export const GAIA_KINETIC_DAMPING = 12.0;

import { GlitchingWindowHub } from './GlitchingWindowHub';
import { EinsteinLabScene } from '../EinsteinLab/EinsteinLabScene';
import { type EnvironmentLayer } from './environmentRegistry';
import { MephitNPC } from './MephitNPC';
import { FaerunWorld, getFaerunElevation } from '../World/FaerunWorld';
import { WildernessTraversal } from '../World/WildernessTraversal';
import { AstraFaerunWorld } from '../World/AstraFaerunWorld';
import { AstraLabWorld } from '../World/AstraLabWorld';
import { AstraLabHUD } from '../World/AstraLabHUD';
import { TacticalEncounterHUD } from '../World/TacticalEncounterHUD';
import { YawningPortalTavernWorld } from '../World/YawningPortalTavernWorld';
import { UndermountainDungeonWorld } from '../World/UndermountainDungeonWorld';
import { PrinterPanicWorld } from '../World/PrinterPanicWorld';
import { HorseNPC } from '../Avatars/HorseNPC';
import { ModularBuildingSystem } from '../World/ModularBuilding';
import { ResonanceLinkEngine } from '../World/ResonanceLinkEngine';
import { EmeraldScout } from '../Avatars/EmeraldScout';
import { ManifestAvatar } from '../Avatars/ManifestAvatar';
import { RiggedAIBuddy } from '../Avatars/RiggedAIBuddy';
import { UniracerAvatar } from '../Avatars/UniracerAvatar';
import { generateDeterministic3DSpec } from '../../utils/ManifestationAlgorithm';
import { ModularAvatar } from '../Avatars/ModularAvatar';
import { FaerunLandscape } from '../World/FaerunLandscape';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';
import { DesktopDimension } from '../World/DesktopDimension';
import { FaerunMinimapHud } from '../HUDModules/FaerunMinimapHud';
import { MagicLabWorld } from '../World/MagicLabWorld';
import { BeringSeaShaderLab } from '../World/BeringSeaShaderLab';
import { PixelChatBubble } from '../Avatars/PixelChatBubble';
import { CombatEncounterArena } from '../CombatLab/CombatEncounterArena';
import { SoundstageWorld } from '../Soundstage/SoundstageWorld';
import { FilmSetWorld } from '../World/FilmSetWorld';
import { CinemaWorld } from '../Soundstage/CinemaWorld';
import { JunkyardWorld } from '../World/JunkyardWorld';
import { UniracersWorld } from '../World/UniracersWorld';
import { UniracersWorldHUD } from '../World/UniracersWorldHUD';
import { CycleParkWorld } from '../../cartridges/Glyphrider/editor/CycleParkWorld';
import { CycleParkEditorHUD } from '../../cartridges/Glyphrider/editor/CycleParkEditorHUD';
import { DiegeticDirectoryPrism, SOVEREIGN_REALMS } from '../World/DiegeticDirectoryPrism';
import type { DesktopFile } from '../../hooks/useDesktopFiles';

const AgentSpeechBubble: React.FC<{ agentId: string, genome?: any, scale?: number }> = React.memo(({ agentId, genome, scale = 2.0 }) => {
    const { agentMessages } = useCouncil();
    const msg = agentMessages?.[agentId as AgentId];
    if (!msg?.text) return null;
    const senderName = COUNCIL_AGENTS[agentId as AgentId]?.name || (agentId === 'orchestrator' ? 'Einstein' : agentId);
    return (
        <PixelChatBubble
            text={msg.text}
            sender={senderName}
            genome={genome}
            position={[0, scale * 1.35 + 0.35, 0]}
        />
    );
});

interface AvatarSceneProps {
    agents: CouncilAgent[];
    floorConfig: FloorConfig;
    lightConfig: { screenIntensity: number, ambientIntensity: number };
    cameraConfig: { x: number, y: number, z: number, fov: number };
    combat?: {
        entities: any[];
        isCombatActive: boolean;
        startCombat: () => void;
        stopCombat: () => void;
        spawnDrone: (pos: [number, number, number]) => void;
    };
    onAgentContextMenu?: (e: any, id: AgentId) => void;
    activeAgentId?: AgentId;
    agentTargets?: Record<string, string>;
    dynamicProps?: any[];
    selectedPropId?: string | null;
    transformMode?: 'translate' | 'scale';
    onPropSelect?: (id: string | null) => void;
    onPropContextMenu?: (e: any, id: string) => void;
    propOverrides?: Record<string, any>;
    onUpdatePropOverride?: (id: string, changes: any) => void;
    backgroundUrl?: string;
    isStagecraftMode?: boolean;
    isOrchestratorOpen?: boolean;
    visibleAgentIds: string[];
    isLevitationEnabled?: boolean;
    screenConfig?: { scale: number, x: number, y: number, z?: number, rotationY?: number };
    isOrbitActive?: boolean;
    onAssetDrop?: (assetUrl: string, position: [number, number, number]) => void;
    onAgentSelect?: (id: AgentId | null) => void;
    onUpdateAgentConfig?: (id: AgentId, config: any) => void;
    cameraRotationY?: number;
    cameraRotationX?: number;
    onCameraRotate?: (delta: number) => void;
    onCameraTilt?: (delta: number) => void;
    onCameraStrafeY?: (delta: number) => void;
    fogNear?: number;
    fogFar?: number;
    fogColor?: string;
    onCapture?: (base64: string) => void;
    onUserTrackPosition?: (pos: { x: number, y: number, z: number }) => void;
    impactedPropId?: string | null;
    onSyncPlayerPosition?: (pos: [number, number, number]) => void;
    onPortalClosed?: (id: string | null, state: string) => void;
    onTerminalActivate?: () => void;
    zoomLevel?: number;
    onZoom?: (zoom: number | ((prev: number) => number)) => void;
    currentDimension?: string;
    layers?: EnvironmentLayer[];
    style?: React.CSSProperties;
    onDimensionSwap?: (newEnvId: string) => void;
    isFacetDebugActive?: boolean;
    userGestalt?: any;
    onUpdateUserGestalt?: (update: any) => void;
    orchestratorFollowsUser?: boolean;
    orchestratorPos?: {x: number, y: number, z: number};
    cinemaReel?: string;
    isCinemaPlaying?: boolean;
    isCinemaMuted?: boolean;
    onToggleCinemaPlay?: () => void;
    onOpenSlate?: () => void;
    filmUserSprite?: boolean;
    filmCompanionSprite?: boolean;
    soundstageArchetype?: string;
    soundstageActionKey?: number;
    soundstageResetKey?: number;
    onSoundstageActionFinish?: () => void;
    isDiegeticPrismOpen?: boolean;
    onToggleDiegeticPrism?: (open: boolean) => void;
    activePrismPillarIndex?: number;
    onSelectPrismPillarIndex?: (idx: number) => void;
    onOpenPrismWorkspace?: (pillarId: string) => void;
}


const PILLAR_INDICES: Record<string, number> = {
    'self': 0, 'thought': 1, 'logic': 2, 'unity': 3, 'existence': 4,
    'improvement': 5, 'mastery': 6, 'resonance': 7, 'transcendence': 8, 'omni': 9,
    'orchestrator': 9 // Map to Omni position
};



interface CameraRigProps {
    config: { x: number, y: number, z: number, fov: number };
    targetPos?: THREE.Vector3;
    rotationY?: number;
    rotationX?: number;
    zoomLevel?: number;
    currentDimension?: string;
}

const CameraRig: React.FC<CameraRigProps> = ({ config, targetPos, rotationY, rotationX = 0, zoomLevel = 1.0, currentDimension }) => {
    const { camera } = useThree();
    const interpLookAt = useRef(new THREE.Vector3());

    // Static configuration updates
    useEffect(() => {
        if (currentDimension === 'uniracers_world') return;
        if (!targetPos) {
            camera.position.set(config.x, config.y, config.z);
        }
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.fov = config.fov;
            camera.updateProjectionMatrix();
        }
    }, [config, targetPos, camera, currentDimension]);

    useFrame((_state, delta) => {
        if (currentDimension === 'uniracers_world') return;
        if (!targetPos) return;

        // --- STABLE INTERPOLATION (Shared Damping) ---
        const dampFactor = 1 - Math.exp(-GAIA_KINETIC_DAMPING * delta);

        // 1. Calculate normalized zoom (0.1 to 2.5 range) - Clamped
        const clampedZoom = Math.max(0.1, Math.min(2.5, zoomLevel));
        const normalizedZoom = (clampedZoom - 0.1) / 2.4; // 0 to 1

        // --- EXPONENTIAL CURVE SYNTHESIS ---
        // We use a power curve (t^2) to make the zoom-up "steeper" at high values
        // and "flat" at low values (first person).
        const expZoom = Math.pow(normalizedZoom, 1.8);

        // 2. Interpolate Y based on user spec: 1.5 (close) to 12.5 (far)
        // At expZoom=0 (FPS), we set eye level at ~0.8m above targetPos.y
        const eyeLevel = 0.8;
        const isOffice = currentDimension === 'printer_panic';
        const dynamicY = isOffice
            ? 9.5 * clampedZoom
            : eyeLevel + (expZoom * 12.0);

        // 3. Interpolate LookAt Offset for pitch: 0.7 (straight ahead at eye level) to 2.5 (overhead)
        // We add the manual rotationX (tilt) to this offset.
        const lookAtOffset = isOffice
            ? 0.5 + (rotationX || 0)
            : 0.7 + (expZoom * 3.0) + (rotationX || 0);

        // 4. Calculate the rotation-offset vector
        // At FPS mode (clampedZoom=0.1), we want the camera to be slightly in front of the sprite.
        // We subtract a small amount from the orbit radius as we get closer.
        const zoomOffsetZ = isOffice
            ? 11.5 * clampedZoom
            : (config.z * clampedZoom) - (1 - normalizedZoom) * 1.5;
        const offset = new THREE.Vector3(config.x, dynamicY, zoomOffsetZ);

        if (rotationY) {
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        }

        const desiredPos = targetPos.clone().add(offset);

        // --- POSITION TRACKING ---
        // Smooth Position with Unified Damping
        // Increased damping for faster response during steep climbs
        const camDampFactor = 1 - Math.exp(-(GAIA_KINETIC_DAMPING * 1.5) * delta);
        camera.position.lerp(desiredPos, camDampFactor);

        // --- GROUND LOCKING (Zero-Clip Enforcement) ---
        const terrainTruth = (window as any).GET_FAERUN_ELEVATION;
        const groundElev = terrainTruth 
            ? terrainTruth(camera.position.x, camera.position.z) 
            : topographyRegistry.getElevation(camera.position.x, camera.position.z);
        if (groundElev !== undefined && isFinite(groundElev)) {
            const minCamY = groundElev + 1.2;
            if (camera.position.y < minCamY) {
                camera.position.y = minCamY;
            }
        }

        // --- LOOK-AT SMOOTHING ---
        const currentLookAt = new THREE.Vector3(targetPos.x, targetPos.y + lookAtOffset, targetPos.z);

        if (interpLookAt.current.length() === 0) {
            interpLookAt.current.copy(currentLookAt);
        }

        if (isFinite(currentLookAt.x) && isFinite(currentLookAt.y) && isFinite(currentLookAt.z)) {
            interpLookAt.current.lerp(currentLookAt, dampFactor);
            camera.lookAt(interpLookAt.current);
        }

        // Sync FOV (Capped for sanity)
        const targetFov = Math.max(10, Math.min(120, config.fov));
        if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - targetFov) > 0.1) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dampFactor);
            camera.updateProjectionMatrix();
        }
    });

    return null;
};


const textureCache = new Map<string, THREE.Texture>();

function createProceduralFallbackTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(2, 2, 60, 60);
        ctx.fillRect(66, 66, 60, 60);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

const SafeTexture = ({ url, onLoaded }: { url: string, onLoaded: (tex: THREE.Texture) => void }) => {
    useEffect(() => {
        if (!url) return;
        let isMounted = true;

        if (textureCache.has(url)) {
            onLoaded(textureCache.get(url)!);
            return;
        }

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');

        loader.load(
            url,
            (loadedTex) => {
                if (!isMounted) return;
                textureCache.set(url, loadedTex);
                onLoaded(loadedTex);
            },
            undefined,
            (err) => {
                console.warn(`[SafeTexture] Warning: Failed to load texture from "${url}". Using procedural stone fallback to prevent engine crash.`, err);
                const fallback = createProceduralFallbackTexture();
                textureCache.set(url, fallback);
                if (isMounted) {
                    onLoaded(fallback);
                }
            }
        );

        return () => {
            isMounted = false;
        };
    }, [url, onLoaded]);

    return null;
};

const Room: React.FC<{ config: FloorConfig, floorChunk?: [number, number] }> = ({ config, floorChunk = [0, 0] }) => {
    const [floorTexture, setFloorTexture] = useState<THREE.Texture | null>(null);
    const textureUrl = config.textureUrl || '/textures/stone_floor_1.jpg';

    const { x, y, z, width, depth, showGrid, showTexture, gridSize = 5 } = config;

    React.useMemo(() => {
        if (floorTexture) {
            floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
            floorTexture.colorSpace = THREE.SRGBColorSpace;

            // --- STABLE TILING MATH ---
            // If data map, stretch 1:1. If generic texture, tile by gridSize.
            if (config.textureUrl?.includes('/data/')) {
                floorTexture.repeat.set(1, 1);
                floorTexture.offset.set(0, 0);
            } else {
                // Tiling aligned to world units. 1 cell = gridSize. 1 tile = 10 cells (default).
                const patternScale = gridSize * 10;
                floorTexture.repeat.set(width / patternScale, depth / patternScale);

                // PIN TO WORLD: Correct for mesh movement to keep texture stationary
                floorTexture.offset.set(
                    (floorChunk[0] / patternScale) % 1,
                    -(floorChunk[1] / patternScale) % 1
                );
            }
            floorTexture.needsUpdate = true;
        }
    }, [floorTexture, config.textureUrl, width, depth, gridSize, floorChunk]);

    return (
        <group position={[x, y, z]}>
            <SafeTexture url={textureUrl} onLoaded={setFloorTexture} />

            {/* Standard Floor Geometry: use Plane for predictable UVs instead of Circle */}
            {showTexture && floorTexture && (
                <mesh name="tactical-floor" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[width, depth]} />
                    <meshStandardMaterial map={floorTexture} roughness={0.4} metalness={0.1} color="#666666" />
                </mesh>
            )}

            {/* Tactical Grid XZ (Floor) */}
            {showGrid && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
                    <gridHelper
                        args={[width, Math.floor(width / gridSize), "#00ffcc", "#00ffcc"]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                </mesh>
            )}

            {/* Dome Logic Removed: Use the Unified Parallax system for all cyclorama layers */}
        </group>
    );
};


// --- Economy Visualization Removed per User Request ---

// --- SCREEN-SPACE TUTOR COMPONENT (Removed to enable Player-Centric design) ---

const AvatarScene: React.FC<AvatarSceneProps> = ({
    agents, floorConfig, lightConfig,
    cameraConfig,
    onAgentContextMenu,
    activeAgentId,
    agentTargets,
    dynamicProps = [],
    selectedPropId,
    transformMode = 'translate',
    onPropSelect,
    onPropContextMenu,
    propOverrides = {},
    onUpdatePropOverride,
    visibleAgentIds = [],
    combat,
    isOrbitActive = false,
    isLevitationEnabled = false,
    cameraRotationY = 0,
    cameraRotationX = 0,
    onCameraRotate,
    onCameraTilt,
    onCameraStrafeY,
    onAssetDrop,
    onAgentSelect,
    onUpdateAgentConfig,
    onUserTrackPosition,
    fogNear = 10,
    fogFar = 1000,
    fogColor = '#2ecc71',
    impactedPropId,
    onSyncPlayerPosition,
    onPortalClosed,
    onTerminalActivate,
    onDimensionSwap,
    isFacetDebugActive = false,
    backgroundUrl,
    zoomLevel = 1.0,
    onZoom,
    isStagecraftMode,
    currentDimension,
    style,
    userGestalt,
    onUpdateUserGestalt,
    orchestratorFollowsUser,
    orchestratorPos,
    cinemaReel,
    isCinemaPlaying,
    isCinemaMuted,
    onToggleCinemaPlay,
    onOpenSlate,
    filmUserSprite = true,
    filmCompanionSprite = true,
    soundstageArchetype,
    soundstageActionKey,
    soundstageResetKey,
    onSoundstageActionFinish,
    isDiegeticPrismOpen = false,
    onToggleDiegeticPrism,
    activePrismPillarIndex = 0,
    onSelectPrismPillarIndex,
    onOpenPrismWorkspace
}) => {
    const { agentGenomes, agentLocomotion } = useCouncil();
    const manifest = useLpcManifest();
    const { currentEnvironment, startMission, population, mountState, swapDimension } = useWorld();

    const playerPos = usePersistentWorldStore(state => state.playerPos);
    const setPlayerPos = usePersistentWorldStore(state => state.setPlayerPos);
    const hasHydrated = usePersistentWorldStore(state => state._hasHydrated);

    const [isTacticalEncounterActive, setIsTacticalEncounterActive] = useState(false);
    const [companionKinesicAction, setCompanionKinesicAction] = useState<LpcAction | undefined>(undefined);
    const [selectedPrismDir, setSelectedPrismDir] = useState<DesktopFile | null>(null);
    const [prismAnchorPos, setPrismAnchorPos] = useState<[number, number, number] | null>(null);

    // Live adjustable avatar scale (persisted, default 1.45m - perfectly level with 1.52m unicycle)
    const [globalAvatarScale, setGlobalAvatarScale] = useState<number>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('myos_avatar_scale') : null;
        return saved ? parseFloat(saved) : 1.45;
    });

    useEffect(() => {
        const handleScaleKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;

            if (e.key === '[' || e.key === '{') {
                setGlobalAvatarScale(prev => {
                    const next = Math.max(0.6, Math.round((prev - 0.05) * 100) / 100);
                    localStorage.setItem('myos_avatar_scale', String(next));
                    console.log(`[AvatarScene] Avatar scale adjusted: ${next}`);
                    return next;
                });
            } else if (e.key === ']' || e.key === '}') {
                setGlobalAvatarScale(prev => {
                    const next = Math.min(3.0, Math.round((prev + 0.05) * 100) / 100);
                    localStorage.setItem('myos_avatar_scale', String(next));
                    console.log(`[AvatarScene] Avatar scale adjusted: ${next}`);
                    return next;
                });
            }
        };

        const handleDirectScale = (e: any) => {
            if (typeof e.detail === 'number') {
                setGlobalAvatarScale(e.detail);
                localStorage.setItem('myos_avatar_scale', String(e.detail));
            }
        };

        window.addEventListener('keydown', handleScaleKey);
        window.addEventListener('myos:set-avatar-scale', handleDirectScale);
        return () => {
            window.removeEventListener('keydown', handleScaleKey);
            window.removeEventListener('myos:set-avatar-scale', handleDirectScale);
        };
    }, []);

    // Kinesic Body Language: Listen to Companion / Orchestrator LLM speech actions
    useEffect(() => {
        let timeoutId: any = null;
        const handleKinesicAction = (e: Event) => {
            const customEvent = e as CustomEvent<{ action: string }>;
            if (customEvent.detail?.action) {
                setCompanionKinesicAction(customEvent.detail.action as LpcAction);
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    setCompanionKinesicAction(undefined);
                }, 3500);
            }
        };

        window.addEventListener('myos_companion_kinesic_action', handleKinesicAction);
        return () => {
            window.removeEventListener('myos_companion_kinesic_action', handleKinesicAction);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    // Topography for astra_lab is now handled dynamically by AstraFaerunWorld when it mounts

    // Debug Mount
    useEffect(() => {
        console.log("AvatarScene Mounted", { agents, floorConfig, onZoom: !!onZoom });
    }, [agents, floorConfig, onZoom]);

    // SURGICAL FIX: Differentiate between Screen Scrolling and Camera Zoom
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            // 1. If screen focus is locked, suppress camera zoom completely
            if ((window as any).__myos_screen_focus_locked) {
                return;
            }

            // 2. If scrolling over a 3D Screen, UI container, or scrollable element, allow native scroll and suppress camera zoom
            const target = e.target as HTMLElement | null;
            if (target) {
                if (
                    target.closest('.diegetic-screen-frame') ||
                    target.closest('[data-diegetic-screen]') ||
                    target.closest('.nexus-screen-container') ||
                    target.closest('.overflow-y-auto') ||
                    target.closest('.overflow-auto') ||
                    target.closest('.no-scrollbar') ||
                    target.closest('input') ||
                    target.closest('textarea')
                ) {
                    return;
                }
            }

            if (onZoom) {
                onZoom(prev => {
                    const next = prev + (e.deltaY * 0.001);
                    return Math.max(0.1, Math.min(2.5, next));
                });
            }
        };
        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [onZoom]);

    // Agora Camera Presets Listener
    useEffect(() => {
        const handlePreset = (e: any) => {
            const preset = e.detail;
            if (preset === 'player') {
                onZoom?.(1.0);
                onCameraTilt?.(0);
                onCameraRotate?.(0);
            } else if (preset === 'table') {
                onZoom?.(0.55);
                onCameraTilt?.(0.9);
            } else if (preset === 'council') {
                onZoom?.(1.9);
                onCameraTilt?.(0.25);
            }
        };
        window.addEventListener('myos:camera-preset', handlePreset);
        return () => window.removeEventListener('myos:camera-preset', handlePreset);
    }, [onZoom, onCameraTilt, onCameraRotate]);



    // Teleport player to office hallway spawn when entering printer_panic
    useEffect(() => {
        if (currentDimension === 'printer_panic') {
            const SPAWN: [number, number, number] = [-37.5, 0.1, -7.5];
            const cur = usePersistentWorldStore.getState().playerPos;
            if (!cur || Math.abs(cur[0]) > 50 || Math.abs(cur[2]) > 30 || (Math.abs(cur[0]) < 1 && Math.abs(cur[2]) < 1)) {
                setPlayerPos(SPAWN);
                setTrackPos(new THREE.Vector3(...SPAWN));
            }
        } else if (currentDimension === 'junkyard') {
            // Spawn in center of 14m x 14m hideout on rug in front of TV/couch
            const SPAWN: [number, number, number] = [0, 0.0, -1.8];
            const cur = usePersistentWorldStore.getState().playerPos;
            if (!cur || Math.abs(cur[0]) > 6.0 || Math.abs(cur[2]) > 6.0) {
                setPlayerPos(SPAWN);
                setTrackPos(new THREE.Vector3(...SPAWN));
            }
        } else if (currentDimension === 'cycle_park') {
            // Spawn at start runway South of the approach kicker (facing North towards funbox)
            const SPAWN: [number, number, number] = [0, 0.1, 44.0];
            const cur = usePersistentWorldStore.getState().playerPos;
            if (!cur || Math.abs(cur[0]) > 60.0 || Math.abs(cur[2]) > 60.0) {
                setPlayerPos(SPAWN);
                setTrackPos(new THREE.Vector3(...SPAWN));
            }
        }
    }, [currentDimension, setPlayerPos]);

    const getFormationPosition = (agentId: string): [number, number, number] => {
        // --- HORIZONTAL CIRCLE FORMATION (Fix: On the floor) ---
        // Characters are arranged in a staggered circle on the XZ plane.
        if (agentId === 'user') return usePersistentWorldStore.getState().playerPos || [0, 0.1, 0];
        if (agentId === 'orchestrator') return [3, 0.1, -4]; // Start near user initially

        // Dynamic NPCs: Spawn on floor in comfortable perimeter around the player
        if (agentId.startsWith('npc_')) {
            const player = usePersistentWorldStore.getState().playerPos || [0, 0.1, 0];
            const hash = agentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const angle = (hash % 360) * (Math.PI / 180);
            const dist = 3.0 + (hash % 8) * 0.7; // 3.0m - 7.9m around user
            return [
                player[0] + dist * Math.cos(angle),
                0.1,
                player[2] + dist * Math.sin(angle)
            ];
        }

        let i = PILLAR_INDICES[agentId];
        if (i === undefined) {
            i = Math.abs(agentId.split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)) % 10;
        }
        if (currentDimension === 'agora_sandbox') {
            // Dedicated Agora Sandbox: 6.5m circle around player in the sandbox
            const RADIUS = 6.5;
            const angle = (i / 10) * Math.PI * 2;
            const player = usePersistentWorldStore.getState().playerPos || [0, 0.1, 0];
            return [
                player[0] + RADIUS * Math.cos(angle),
                0.1,
                player[2] + RADIUS * Math.sin(angle)
            ];
        }

        // Standard Primary Desktop: Original distant 45m perimeter
        const RADIUS = 45.0;
        const angle = (i / 10) * Math.PI * 2;
        const stagger = (i % 2 === 0 ? 0 : 8);

        return [
            (RADIUS + stagger) * Math.cos(angle),
            0.1,
            (RADIUS + stagger) * Math.sin(angle)
        ];
    };

    const [trackPos, setTrackPos] = useState<THREE.Vector3>(new THREE.Vector3(0, 0.1, 0));
    const [worldOffset, setWorldOffset] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    const [floorChunk, setFloorChunk] = useState<[number, number]>([0, 0]);

    // --- HIGH-FREQUENCY SYNC REF ---
    const kineticPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.1, 0));
    const worldOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

    const lastTrackedPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-999, -999, -999));

    const handleTrackPosition = (pos: THREE.Vector3, velocity: number[], rotation: number) => {
        const currentPos = pos;

        // 1. Direct Ref Update (Bypass React for Physics/World)
        kineticPosRef.current.copy(currentPos);

        // In spherical mode, currentPos IS the tracking displacement from origin
        if (currentDimension === 'faerun') {
            worldOffsetRef.current.copy(currentPos);
        }

        // 2. React State (Throttled by 0.05m threshold to prevent 60Hz re-render cascade)
        if (currentPos.distanceToSquared(lastTrackedPosRef.current) > 0.0025) {
            lastTrackedPosRef.current.copy(currentPos);
            onUserTrackPosition?.({ x: currentPos.x, y: currentPos.y, z: currentPos.z });
            onSyncPlayerPosition?.([currentPos.x, currentPos.y, currentPos.z]);
            setPlayerPos([currentPos.x, currentPos.y, currentPos.z]);

            if (currentDimension !== 'faerun') {
                setTrackPos(currentPos.clone());
            } else {
                // In Spherical Treadmill mode, CameraRig target MUST remain at Center
                setTrackPos(new THREE.Vector3(0, 0.1, 0));
                // Sync shift offset for FaerunWorld rotation
                // 'currentPos' here is the localTrackPos from AvatarController (the displacement from origin)
                if (currentPos.distanceTo(worldOffset) > 0.01) {
                    setWorldOffset(currentPos.clone());
                }
            }
        }

        // Move floor in chunks to prevent constant state updates
        const chunkSize = 20;
        const chunkX = Math.round(currentPos.x / chunkSize) * chunkSize;
        const chunkZ = Math.round(currentPos.z / chunkSize) * chunkSize;
        if (chunkX !== floorChunk[0] || chunkZ !== floorChunk[1]) {
            setFloorChunk([chunkX, chunkZ]);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <Canvas
                shadows={{ type: THREE.PCFShadowMap }}
                camera={{ position: [0, 8, 22], fov: 45, far: currentDimension === 'uniracers_world' ? 20000 : 2000 }}
                gl={{ preserveDrawingBuffer: true, alpha: true, toneMappingExposure: currentDimension === 'desktop' ? 1.05 : 0.85 }}
                style={style}
            >
            {/* DYNAMIC CAMERA CONTROL */}
            <CameraRig
                config={cameraConfig}
                rotationY={cameraRotationY}
                rotationX={cameraRotationX}
                targetPos={trackPos}
                zoomLevel={zoomLevel}
                currentDimension={currentDimension}
            />
            {/* <ScreenshotHelper onCapture={onCapture} /> */}
            {isOrbitActive && <OrbitControls makeDefault />}

            {/* UNIFIED MULTI-PLANE HORIZON (Temporarily disabled to stabilize build) */}
            {/* <StageBackground url={backgroundUrl} useGlobalBackground={!isStagecraftMode} /> */}
            {/* <MultiPlaneBackground layers={layers} backgroundUrl={backgroundUrl} isStagecraftMode={isStagecraftMode} /> */}

            {/* Atmospheric Depth */}
            <fog attach="fog" args={[
                currentDimension === 'desktop' ? '#0f172a' : (currentDimension === 'uniracers_world' ? '#030511' : fogColor),
                currentDimension === 'desktop' ? 150 : (currentDimension === 'uniracers_world' ? 2500 : fogNear),
                currentDimension === 'desktop' ? 1000 : (currentDimension === 'uniracers_world' ? 35000 : fogFar)
            ]} />

            {/* BALANCED HIGH-CONTRAST LIGHTING RIG */}
            <ambientLight intensity={lightConfig?.ambientIntensity ?? (currentDimension === 'desktop' ? 1.4 : currentDimension === 'uniracers_world' ? 1.5 : 0.6)} />
            <hemisphereLight
                skyColor={currentDimension === 'desktop' ? "#f8fafc" : "#ffffff"}
                groundColor="#334155"
                intensity={currentDimension === 'desktop' ? 0.9 : currentDimension === 'uniracers_world' ? 1.2 : 0.4}
            />
            {currentDimension === 'uniracers_world' && (
                <directionalLight position={[0, 6000, 0]} intensity={2.2} color="#e2e8f0" />
            )}
            <spotLight
                position={[15, 35, 15]}
                angle={0.5}
                penumbra={0.8}
                intensity={currentDimension === 'desktop' ? 3.5 : 8.0}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <directionalLight
                position={[-10, 20, -10]}
                intensity={currentDimension === 'desktop' ? 1.4 : 1.2}
                color="#e2e8f0"
            />
            <directionalLight
                position={[15, 25, 20]}
                intensity={currentDimension === 'desktop' ? 1.6 : 0.8}
                color="#ffffff"
            />
            {currentDimension === 'desktop' && (
                <pointLight
                    position={[trackPos.x, trackPos.y + 4.0, trackPos.z + 3.0]}
                    intensity={12.0}
                    distance={25}
                    decay={2}
                    color="#ffffff"
                />
            )}
            <color attach="background" args={['#0f172a']} />


            <Suspense fallback={null}>
                {/* MASTER POS GROUP: "The Flight Deck" */}
                {/* Moves the entire floor together */}
                <group position={[floorConfig.x, floorConfig.y, floorConfig.z]}>

                    {/* INFINITE FLOOR (Grid/Floor) follows player chunk - VISIBLE IN VPN OR DIMENSIONS */}
                    {(currentEnvironment === 'vpn' || !!currentDimension) && (
                        <>
                            <group position={[floorChunk[0], 0, floorChunk[1]]}>
                                {/* 2.5D Hub Dimension Logic (Glitching Window) */}
                                {currentDimension === 'glitching_window' && (
                                    <GlitchingWindowHub
                                        onTerminalActivate={onTerminalActivate || (() => {
                                            // Fallback
                                            startMission('mission_1', 'node_1');
                                        })}
                                    />
                                )}

                                {/* Standard Floor Logic: Render if NOT in a specialized dimension that handles its own floor */}
                                {(!['glitching_window', 'yawning_portal', 'undermountain', 'wilderness', 'astra_faerun', 'astra_lab', 'faerun', 'printer_panic', 'magic_lab', 'soundstage', 'filmset', 'cinema', 'junkyard', 'uniracers_world', 'cycle_park', 'chrono_hyperdrive', 'bering_sea_lab'].includes(currentDimension || '')) && (
                                    <Room config={floorConfig} floorChunk={floorChunk} />
                                )}

                            </group>

                            {/* BERING SEA PARALLAX SHADER LAB (JIT VFX & INDEPENDENT BILLBOARD SHADERS) */}
                            {currentDimension === 'bering_sea_lab' && (
                                <BeringSeaShaderLab isActive={true} />
                            )}

                            {/* THE ASTRA WORLD: Neural Lattice Substrate */}
                            {currentDimension === 'astra_faerun' && (
                                <AstraFaerunWorld
                                    isActive={true}
                                    playerPosition={[trackPos.x, trackPos.y, trackPos.z]}
                                    size={2500}
                                />
                            )}

                            {/* THE YAWNING PORTAL TAVERN */}
                            {(currentDimension === 'yawning_portal' || currentDimension === 'glitching_window') && (
                                <YawningPortalTavernWorld
                                    isActive={true}
                                    playerPosition={[trackPos.x, trackPos.y, trackPos.z]}
                                />
                            )}

                            {/* UNDERMOUNTAIN LEVEL 1: THE DUNGEON LEVEL */}
                            {currentDimension === 'undermountain' && (
                                <UndermountainDungeonWorld
                                    isActive={true}
                                    playerPosition={[trackPos.x, trackPos.y, trackPos.z]}
                                />
                            )}

                            {/* SECTOR-404: PRINTER PANIC 3D CORPORATE FACILITY */}
                            {currentDimension === 'printer_panic' && (
                                <PrinterPanicWorld
                                    isActive={true}
                                    playerPosition={trackPos}
                                />
                            )}

                            {/* THE ASTRA LAB: Dedicated Sandbox Laboratory */}
                            {currentDimension === 'astra_lab' && (
                                <AstraLabWorld
                                    isActive={true}
                                    playerPosition={trackPos}
                                />
                            )}

                            {/* THE MAGIC VFX LAB: Sandbox for Spells */}
                            {currentDimension === 'magic_lab' && (
                                <MagicLabWorld isActive={true} playerPosition={trackPos} />
                            )}

                            {/* MYOS FILMSET SOUNDSTAGE (REAL-TIME MULTIPLANE CINEMA ENGINE) */}
                            {(currentDimension === 'soundstage' || currentDimension === 'filmset') && (
                                <FilmSetWorld
                                    isActive={true}
                                    playerPosition={trackPos}
                                    onDimensionSwap={onDimensionSwap}
                                    onOpenSlate={onOpenSlate}
                                    selectedArchetypeKey={soundstageArchetype}
                                    actionTriggerKey={soundstageActionKey}
                                    resetTriggerKey={soundstageResetKey}
                                    onActionComplete={onSoundstageActionFinish}
                                />
                            )}

                            {/* THE GRAND CINEMA (3D SCREENING THEATER) */}
                            {currentDimension === 'cinema' && (
                                <CinemaWorld
                                    isActive={true}
                                    playerPosition={trackPos}
                                    currentReel={cinemaReel}
                                    isPlaying={isCinemaPlaying}
                                    isMuted={isCinemaMuted}
                                    onScreenClick={onToggleCinemaPlay}
                                    onDimensionSwap={onDimensionSwap}
                                />
                            )}

                            {/* RED'S JUNKYARD HIDEOUT (UNIRACERS 2 SET) */}
                            {currentDimension === 'junkyard' && (
                                <JunkyardWorld
                                    isActive={true}
                                    playerPosition={trackPos}
                                    showRedOnCouch={false}
                                />
                            )}

                            {/* UNIRACERS WORLD (SPOKED TORUS KNOT 3D MANIFOLD) */}
                            {currentDimension === 'uniracers_world' && (
                                <UniracersWorld
                                    isActive={true}
                                    playerPosition={trackPos}
                                    onDimensionSwap={onDimensionSwap}
                                />
                            )}

                            {/* CYCLE-PARK STUDIO (UNIRACERS REAL-TIME LEVEL EDITOR) */}
                            {currentDimension === 'cycle_park' && (
                                <CycleParkWorld
                                    isActive={true}
                                    playerPosition={trackPos}
                                />
                            )}

                            {/* CHRONO-HYPERDRIVE: TESSERACT PROTOCOL (4D KINETIC EXTRACTION RUNNER) */}
                            {currentDimension === 'chrono_hyperdrive' && (
                                <Html fullscreen style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'auto' }}>
                                    <iframe 
                                        src="/chrono_hyperdrive.html" 
                                        style={{ width: '100vw', height: '100vh', border: 'none' }} 
                                        title="Chrono-Hyperdrive: Tesseract Protocol"
                                    />
                                </Html>
                            )}

                            {currentDimension === 'desktop' && (
                                <DesktopDimension 
                                    onDimensionSwap={onDimensionSwap}
                                    onOpenPrismForFile={(file) => {
                                        onToggleDiegeticPrism?.(false);
                                        const px = playerPos ? playerPos[0] : trackPos.x;
                                        const pz = playerPos ? playerPos[2] : trackPos.z;
                                        setPrismAnchorPos([px, 2.1, pz - 5.5]);
                                        setSelectedPrismDir(file);
                                    }}
                                />
                            )}

                            {/* Meta-JRPG Wilderness: Decoupled from jumping chunks for smooth parallax */}
                            {currentDimension === 'wilderness' && (
                                <WildernessTraversal isActive={true} playerPosition={trackPos} />
                            )}

                            {/* THE GAIA WORLD: Geometric Truth Ascension */}
                            {currentDimension === 'faerun' && (
                                <FaerunWorld
                                    isActive={true}
                                    playerPosition={kineticPosRef.current} // Pass the Direct Ref value
                                    worldOffset={worldOffsetRef.current}  // Pass the Cumulative Offset
                                    backgroundUrl={backgroundUrl}
                                >
                                    <WorldProps
                                        floorConfig={floorConfig}
                                        dynamicProps={dynamicProps}
                                        onSelect={onPropSelect}
                                        selectedId={selectedPropId}
                                        onContextMenu={onPropContextMenu}
                                        overrides={propOverrides}
                                        onUpdateOverride={onUpdatePropOverride}
                                        transformMode={transformMode}
                                        impactedPropId={impactedPropId}
                                        playerPosition={kineticPosRef.current.toArray() as [number, number, number]}
                                        onPortalClosed={onPortalClosed}
                                        getElevation={getFaerunElevation}
                                        liftFactor={0.48}
                                        isFacetDebugActive={isFacetDebugActive}
                                    />
                                </FaerunWorld>
                            )}

                            {/* Astra Props Cluster - Rendered for both Astra Faerun and Astra Lab */}
                            {['astra_faerun', 'astra_lab'].includes(currentDimension || '') && (
                                <WorldProps
                                    floorConfig={floorConfig}
                                    dynamicProps={dynamicProps}
                                    onSelect={onPropSelect}
                                    selectedId={selectedPropId}
                                    onContextMenu={onPropContextMenu}
                                    overrides={propOverrides}
                                    onUpdateOverride={onUpdatePropOverride}
                                    transformMode={transformMode}
                                    impactedPropId={impactedPropId}
                                    playerPosition={trackPos.toArray() as [number, number, number]}
                                    onPortalClosed={onPortalClosed}
                                    getElevation={(x, z) => topographyRegistry.getElevation(x, z)}
                                    liftFactor={0.0}
                                    isFacetDebugActive={isFacetDebugActive}
                                />
                            )}

                            {/* THE MOUNTED COMPANION (Whistle Mechanic) */}
                            <HorseNPC />

                            <ModularBuildingSystem />
                            <ResonanceLinkEngine />
                            <FaerunLandscape />

                            {/* --- PRIMARY MANIFESTATION LAYER --- */}
                        </>
                    )}


                    {/* Render Combat Entities (Hero, Drones, Fragments, Dropped Sprites) - Hero temporarily disabled as Tutor is hidden */}
                    {currentEnvironment !== 'hub' && combat?.entities.map(entity => (
                        <group key={entity.id} position={entity.position}>
                            {entity.npcId ? (
                                <SemanticAvatar
                                    pillarName={entity.npcId}
                                    pillarIndex={0}
                                    position={[0, 0, 0]}
                                    velocity={entity.velocity || [0, 0, 0]}
                                    cameraRotationY={cameraRotationY}
                                    action={entity.health <= 0 ? 'hurt' : 'idle'}
                                    scale={1.25}
                                    genome={genomeFromPersonaTags(generateCharacterSheet(entity.npcId).spriteTags, manifest)}
                                />
                            ) : entity.type === 'hero' ? (
                                null /* tutor hidden */
                            ) : entity.type === 'drone' ? (
                                entity.spriteUrl ? (
                                    <PillarSprite
                                        agentId={`drone-${entity.id}`}
                                        imageUrl={entity.spriteUrl}
                                        scale={1.25}
                                        position={[0, 0, 0]}
                                    />
                                ) : (
                                    <mesh>
                                        <sphereGeometry args={[0.5, 16, 16]} />
                                        <meshStandardMaterial color="#ff0000" emissive="#550000" />
                                    </mesh>
                                )
                            ) : entity.type === 'particle' ? (
                                <mesh>
                                    <boxGeometry args={[0.15, 0.15, 0.15]} />
                                    <meshStandardMaterial color={entity.color || '#ff0055'} emissive={entity.color || '#ff0055'} emissiveIntensity={0.8} />
                                </mesh>
                            ) : entity.type === 'fragment' ? (
                                entity.spriteUrl ? (
                                    <PillarSprite
                                        agentId={entity.id as any}
                                        imageUrl={entity.spriteUrl}
                                        scale={1.25}
                                        position={[0, 0, 0]}
                                    />
                                ) : (
                                    <Fragment
                                        id={entity.id}
                                        position={[0, 0, 0]}
                                        isSecured={entity.isSecured}
                                    />
                                )
                            ) : entity.type === 'boss' ? (
                                <group name="HEOP_FRAGMENT_PLACEHOLDER" />
                            ) : null}
                        </group>
                    ))}

                    {hasHydrated && agents.map((agent) => {
                        const isMainPlayer = agent.id === 'user';
                        const isOrchestrator = agent.id === 'orchestrator';

                        // Filming visibility toggles (hide user/companion if toggled off)
                        if (isMainPlayer && filmUserSprite === false) return null;
                        if (isOrchestrator && filmCompanionSprite === false) return null;

                        // Non-user agent visibility check (Pillars only visible in agora_sandbox unless explicitly toggled)
                        const isAgora = currentDimension === 'agora_sandbox';
                        const isPillar = PILLAR_INDICES[agent.id] !== undefined;
                        if (!isMainPlayer && !visibleAgentIds.includes(agent.id) && !(isAgora && isPillar)) return null;

                        const [fX, fY, fZ] = getFormationPosition(agent.id);

                        // Initial Position: Restore from persistent store if user, else formation.
                        const initialPosition: [number, number, number] = isMainPlayer ? (playerPos || [fX, fY, fZ]) : [fX, fY, fZ];
                        const rawGenome = agentGenomes[agent.id] || (isOrchestrator ? agentGenomes['companion'] : null) || (isMainPlayer ? userGestalt?.genome : null);
                        const activeGenome = rawGenome?.genome || rawGenome;
                        const isLpcGenome = !!(activeGenome && (activeGenome.body || activeGenome.torso || activeGenome.legs || activeGenome.hair));
                        const isUniracer = (isMainPlayer && (currentDimension === 'junkyard' || currentDimension === 'cycle_park')) ||
                                           activeGenome?.archetype === 'uniracer' || 
                                           activeGenome?.archetype === 'unicycle' ||
                                           activeGenome?.modelType === 'uniracer' || 
                                           rawGenome?.meta?.id === 'uniracer' || 
                                           rawGenome?.meta?.archetype === 'uniracer' ||
                                           agent.avatarConfig.archetype === 'uniracer' || 
                                           agent.avatarConfig.modelType === 'uniracer';
                        const is3DGenome = !isUniracer && !isLpcGenome && !!(activeGenome && (activeGenome.dimensions || activeGenome.archetype));
                        const hasSpriteGenome = !isUniracer && (isLpcGenome || !!activeGenome?.body);
                        const modelType = currentDimension === 'printer_panic'
                            ? 'sprite'
                            : (isUniracer 
                                ? 'uniracer' 
                                : (agent.avatarConfig.modelType === 'pillar_sprite' 
                                    ? 'pillar_sprite' 
                                    : (is3DGenome 
                                        ? 'procedural' 
                                        : (hasSpriteGenome 
                                            ? 'sprite' 
                                            : (agent.avatarConfig.modelType || 'sprite')))));

                        // Dynamic Orchestrator Navigation: Follow player at a comfortable flank/shoulder offset!
                        const dynamicTargetPos: [number, number, number] | undefined = (isOrchestrator && orchestratorFollowsUser && playerPos) 
                            ? [playerPos[0] + 3.2, playerPos[1], playerPos[2] + 2.4] 
                            : (isOrchestrator && orchestratorFollowsUser && orchestratorPos)
                                ? [orchestratorPos.x, orchestratorPos.y, orchestratorPos.z]
                                : undefined;

                        return (
                            <AvatarController
                                key={agent.id}
                                id={agent.id}
                                initialPosition={initialPosition}
                                targetCell={agentTargets?.[agent.id] || agentTargets?.[agent.id.toLowerCase()] || agentTargets?.[agent.id.toUpperCase()]}
                                targetPosition={dynamicTargetPos}
                                gridConfig={{ width: floorConfig.width, depth: floorConfig.depth }}
                                isWandering={(isAgora || modelType !== 'pillar_sprite') && activeAgentId !== agent.id && !isOrchestrator}
                                spawnPoint={agentLocomotion[agent.id]?.spawnPoint}
                                locomotionPath={agentLocomotion[agent.id]?.path}
                                isManualControl={isMainPlayer}
                                locomotionType={modelType === 'uniracer' ? 'uniracer' : 'humanoid'}
                                isLevitationEnabled={isLevitationEnabled}
                                cameraRotationY={cameraRotationY}
                                onCameraRotate={onCameraRotate}
                                onCameraTilt={onCameraTilt}
                                onCameraStrafeY={onCameraStrafeY}
                                onTrackPosition={isMainPlayer ? handleTrackPosition : undefined}
                                forcedAction={isOrchestrator ? (companionKinesicAction || agent.avatarConfig.action) : agent.avatarConfig.action}
                                getElevation={(x, z) => topographyRegistry.getElevation(x, z)}
                                liftFactor={['astra_faerun', 'astra_lab', 'cycle_park', 'junkyard'].includes(currentDimension || '') ? 0.0 : 0.15}
                                projection={currentDimension === 'faerun' ? 'spherical' : 'flat'}
                                currentDimension={currentDimension}
                            >
                                {({ position, velocity, rotation, state, kinesicVector, impactPulse, isSprinting, uniracerState }: any) => {
                                    const isSelected = activeAgentId === agent.id;
                                    const inner = (
                                        <group
                                            key={agent.id}
                                            name={`agent-${agent.id}`}
                                            position={(isSelected && isStagecraftMode) ? [0, position[1], 0] : position}
                                            rotation={(modelType === 'neo_retro' || modelType === 'procedural') ? [0, 0, 0] : [0, rotation || 0, 0]}
                                            onContextMenu={(e) => {
                                                if (onAgentContextMenu) {
                                                    e.stopPropagation();
                                                    onAgentContextMenu(e.nativeEvent, agent.id);
                                                }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (currentDimension === 'desktop') return;
                                                onAgentSelect?.(agent.id);
                                            }}
                                        >
                                            {modelType === 'uniracer' ? (
                                                <UniracerAvatar
                                                    isPlayerControlled={isMainPlayer}
                                                    scale={agent.avatarConfig.scale || 1.0}
                                                    position={[0, 0, 0]}
                                                    velocity={velocity}
                                                    uniracerState={uniracerState}
                                                />
                                            ) : modelType === 'pillar_sprite' ? (
                                                <PillarSprite
                                                    agentId={agent.id}
                                                    imageUrl={agent.avatarConfig.spriteUrl || ''}
                                                    scale={isAgora ? 1.4 : globalAvatarScale}
                                                    position={[0, 0, 0]}
                                                    onSelect={(id) => onAgentSelect?.(id as any)}
                                                />
                                            ) : modelType === 'glb' ? (
                                                agent.id === 'emerald_scout' ? (
                                                    <EmeraldScout
                                                        scale={agent.avatarConfig.scale || 1.5}
                                                        position={[0, 0, 0]}
                                                        velocity={velocity}
                                                        action={velocity[0] !== 0 || velocity[2] !== 0 ? 'walk' : 'idle'}
                                                    />
                                                ) : (
                                                    <RiggedAIBuddy
                                                        agentId={agent.id}
                                                        scale={agent.avatarConfig.scale || 0.65}
                                                        position={[0, 0, 0]}
                                                    />
                                                )
                                            ) : modelType === 'neo_retro' || modelType === 'procedural' ? (
                                                <ModularAvatar
                                                    genome={agentGenomes?.[agent.id]?.dimensions ? agentGenomes[agent.id] : (agent.id === 'user' && userGestalt?.genome ? userGestalt.genome : (agent.avatarConfig.neoRetroSpec || generateDeterministic3DSpec(agent.avatarConfig.genome || agentGenomes?.[agent.id] || {}, agent.id)))}
                                                    position={[0, 0, 0]}
                                                    scale={agent.avatarConfig.scale || 1.0}
                                                    action={agent.id === 'user' ? (velocity[0] !== 0 || velocity[2] !== 0 ? 'walk' : 'idle') : (state === 'talk' ? 'spellcast' : state)}
                                                    velocity={velocity}
                                                />
                                            ) : (
                                                <SemanticAvatar
                                                    pillarName={agent.id}
                                                    pillarIndex={agent.avatarConfig.pillarIndex ?? PILLAR_INDICES[agent.id] ?? 0}
                                                    position={[0, 0, 0]}
                                                    velocity={velocity}
                                                    cameraRotationY={cameraRotationY}
                                                    action={state === 'talk' ? (agent.id === 'orchestrator' ? 'talk' : 'spellcast') : (isSprinting ? 'sprint' : state)}
                                                    scale={globalAvatarScale}
                                                    genome={
                                                        currentDimension === 'printer_panic'
                                                            ? { body: '/actions/larry_idle_loop.png' }
                                                            : (activeGenome
                                                                ? activeGenome
                                                                : (agent.id === 'user' && userGestalt?.genome
                                                                    ? userGestalt.genome
                                                                    : ((agent.avatarConfig.genomeTags && agent.avatarConfig.genomeTags.length > 0)
                                                                        ? genomeFromPersonaTags(agent.avatarConfig.genomeTags, manifest)
                                                                        : (agent.avatarConfig.genome || agent.avatarConfig.spriteGenome || PILLAR_CLASSES[agent.id as keyof typeof PILLAR_CLASSES]))))
                                                    }
                                                    kinesicVector={kinesicVector}
                                                    impactPulse={impactPulse}
                                                    isMounted={isMainPlayer ? mountState.isMounted : false}
                                                    horseType={isMainPlayer ? mountState.horseType : undefined}
                                                />
                                            )}

                                            {/* 3D Billboard Speech Bubble (Decoupled from Scene Re-renders) */}
                                            <AgentSpeechBubble
                                                agentId={agent.id}
                                                genome={activeGenome}
                                                scale={globalAvatarScale}
                                            />
                                        </group>
                                    );

                                    if (isSelected && isStagecraftMode) {
                                        return (
                                            <TransformControls
                                                position={position}
                                                mode={transformMode}
                                                onMouseUp={(e: any) => {
                                                    if (e.target.object) {
                                                        const p = e.target.object.position.toArray();
                                                        const s = e.target.object.scale.x;
                                                        onUpdateAgentConfig?.(agent.id, {
                                                            scale: (agent.avatarConfig.scale || 1) * s,
                                                            _lastManualPosition: p
                                                        });
                                                        console.log(`Agent ${agent.id} transformed:`, { position: p, scale: s });
                                                    }
                                                }}
                                            >
                                                {inner}
                                            </TransformControls>
                                        );
                                    }

                                    return inner;
                                }}
                            </AvatarController>
                        );
                    })}

                    {/* DYNAMIC N-FACETED DIRECTORY PRISM (Unfurled from Desktop PrismaticTricon - Grounded on Floor Plane) */}
                    {selectedPrismDir && (
                        <DiegeticDirectoryPrism
                            directory={selectedPrismDir}
                            position={prismAnchorPos || [
                                (playerPos ? playerPos[0] : trackPos.x),
                                2.1,
                                (playerPos ? playerPos[2] : trackPos.z) - 5.5
                            ]}
                            onClose={() => {
                                setSelectedPrismDir(null);
                                setPrismAnchorPos(null);
                                onToggleDiegeticPrism?.(false);
                            }}
                            onDrillDirectory={(path) => {
                                setSelectedPrismDir(prev => prev ? { ...prev, path, name: path.split(/[\/\\]/).pop() || path } : null);
                            }}
                            onDimensionSwap={(targetRealm) => {
                                setSelectedPrismDir(null);
                                setPrismAnchorPos(null);
                                onToggleDiegeticPrism?.(false);
                                if (onDimensionSwap) onDimensionSwap(targetRealm);
                            }}
                        />
                    )}

                    {/* DIEGETIC DECAGONAL PRISM NAVIGATOR (3D NexusContainer above Avatar) */}
                    {isDiegeticPrismOpen && !selectedPrismDir && (
                        <DiegeticDirectoryPrism
                            directory={{
                                name: '10 Sovereign Realms',
                                path: 'realms',
                                isDirectory: true,
                                children: SOVEREIGN_REALMS
                            }}
                            position={[
                                (playerPos ? playerPos[0] : trackPos.x),
                                2.1,
                                (playerPos ? playerPos[2] : trackPos.z) - 5.5
                            ]}
                            onClose={() => onToggleDiegeticPrism?.(false)}
                            onDimensionSwap={(targetRealm) => {
                                onToggleDiegeticPrism?.(false);
                                if (onDimensionSwap) onDimensionSwap(targetRealm);
                            }}
                        />
                    )}

                    {/* Render Mephits - Population visible in non-hub biomes */}
                    {currentEnvironment !== 'hub' && currentDimension !== 'glitching_window' && population?.mephits?.map((m: any) => (
                        <MephitNPC
                            key={m.id}
                            id={m.id}
                            initialPosition={[m.pos[0], 0.1, m.pos[2]]}
                            bounds={floorConfig.width}
                            stationary={false}
                            onContextMenu={(e: any) => {
                                if (onAgentContextMenu) {
                                    onAgentContextMenu(e, m.id as any);
                                }
                            }}
                        />
                    ))}


                    {/* Global Aetherial Tutor (Removed in Player-Centric phase) */}

                    {/* Drag & Drop Manifestation Engine */}
                    {onAssetDrop && <SceneDnDManager onAssetDrop={onAssetDrop} />}

                    {/* Experimental Einstein Lab */}
                    {currentDimension === 'einstein_lab' && <EinsteinLabScene />}
                </group>
            </Suspense>
        </Canvas>
        <FaerunMinimapHud currentDimension={currentDimension} />
        {currentDimension === 'cycle_park' && <CycleParkEditorHUD />}
        {currentDimension === 'uniracers_world' && <UniracersWorldHUD />}
        {currentDimension === 'astra_lab' && (
            <>
                <AstraLabHUD
                    playerPos={playerPos || [0, 0.1, 0]}
                    poiBeacons={[
                        { id: 'poi_waterdeep', name: 'City of Waterdeep', category: 'Metropolis / Capital', description: 'The Crown of the North. Situated on the Sword Coast ocean harbour.', position: [-150, 0, 80], color: '#38bdf8' },
                        { id: 'poi_yawning_portal', name: 'The Yawning Portal Inn', category: 'Iconic Tavern / Dungeon Entrance', description: 'Famous tavern inside Waterdeep Castle Ward with shaft to Undermountain.', position: [-148, 0, 82], color: '#f59e0b' },
                        { id: 'poi_neverwinter', name: 'Neverwinter', category: 'Jewel of the North', description: 'Located ~170 miles North of Waterdeep along the Sword Coast.', position: [-180, 0, -140], color: '#10b981' },
                        { id: 'poi_baldurs_gate', name: "Baldur's Gate", category: 'Port City / Merchant Hub', description: 'Located ~400 miles South of Waterdeep on River Chionthar.', position: [-110, 0, 480], color: '#ef4444' },
                        { id: 'poi_candlekeep', name: 'Candlekeep Library Keep', category: 'Fortress Monastery / Archive', description: 'Located ~120 miles South of Baldur\'s Gate on coastal sea cliffs.', position: [-130, 0, 650], color: '#a855f7' },
                        { id: 'poi_icewind_dale', name: 'Icewind Dale', category: 'Frozen Wilderness Region', description: 'Located far North past the Spine of the World in frozen tundra.', position: [-220, 0, -650], color: '#06b6d4' }
                    ]}
                    onTeleport={(targetPos) => {
                        setPlayerPos(targetPos);
                    }}
                    onToggleCombat={() => setIsTacticalEncounterActive(!isTacticalEncounterActive)}
                />
                <TacticalEncounterHUD
                    isActive={isTacticalEncounterActive}
                    onClose={() => setIsTacticalEncounterActive(false)}
                />
            </>
        )}
        {currentDimension === 'combat_lab' && (
            <div className="absolute inset-0 z-50 pointer-events-auto">
                <CombatEncounterArena
                    onClose={() => onDimensionSwap?.('desktop')}
                />
            </div>
        )}
    </div>
    );
};


// --- SUB-COMPONENTS ---

/**
 * Handles Global Drag-and-Drop for manifesting assets in the 3D Scene.
 * MUST be rendered inside <Canvas> to use R3F hooks.
 */
const SceneDnDManager: React.FC<{ onAssetDrop: (url: string, pos: [number, number, number], geometryType?: string) => void }> = ({ onAssetDrop }) => {
    const { raycaster, mouse, camera, scene } = useThree();

    useEffect(() => {
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            const assetUrl = e.dataTransfer?.getData('assetUrl');
            const geometryType = e.dataTransfer?.getData('geometryType');

            if ((assetUrl || geometryType) && onAssetDrop) {
                // Determine drop position via raycasting
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);

                // Prioritize 'tactical-floor'
                const floorIntersect = intersects.find(i => i.object.name === 'tactical-floor') || intersects[0];

                if (floorIntersect) {
                    const { x, y, z } = floorIntersect.point;
                    onAssetDrop(assetUrl || '', [x, y + 0.5, z], geometryType);
                }
            }
        };

        const handleDragOver = (e: DragEvent) => e.preventDefault();

        window.addEventListener('drop', handleDrop);
        window.addEventListener('dragover', handleDragOver);
        return () => {
            window.removeEventListener('drop', handleDrop);
            window.removeEventListener('dragover', handleDragOver);
        };
    }, [onAssetDrop, raycaster, mouse, camera, scene]);

    return null;
};

export default AvatarScene;
