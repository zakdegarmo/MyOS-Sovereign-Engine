import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import AvatarScene from './AvatarScene';
import { type FloorConfig, type AssetLayer } from './types';
import { ENVIRONMENTS, type EnvironmentLayer } from './environmentRegistry';
// listModels removed as it is unused
import { motion, AnimatePresence } from 'framer-motion';
// useMaxVoice removed per user request
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';
import { RadialContextMenu } from '../HUDModules/RadialContextMenu';
import {
    Layers, Monitor, User, Cpu, Coffee,
    Fingerprint, Brain, MessageSquare,
    Library, FlaskConical, Users, Users2
} from 'lucide-react';
import type { UserGestalt, LibraryNode, GemId } from '@Omni/types';
import { AvatarContextMenu } from './AvatarContextMenu';
import { SystemHud } from './SystemHud';
import { CognitiveCortexPanel, OrchestratorPanel } from './CognitiveCortexPanel';
import { CortexRightSidebar } from '../Cortex/CortexRightSidebar';
import { SystemTelemetryLog } from '../HUDModules/SystemTelemetryLog';
import { OntologicalLedger } from '../HUDModules/OntologicalLedger';
import { DebugTelemetryOverlay } from '../HUDModules/DebugTelemetryOverlay';

// --- HUD Applets ---
import { DecaCouncilChatHud } from '../HUDModules/DecaCouncilChatHud';
import { JrpgHud } from './JrpgHud';
import { PrinterPanicHud } from '../HUDModules/PrinterPanicHud';
import { Dock } from '../../Unity/components/navigation/Dock';
import { SceneObjectContextMenu } from './SceneObjectContextMenu';
import { StateManager } from '../HUDModules/StateManager';
import { StagecraftControls } from '../HUDModules/StagecraftControls';
import { AssetManifestPanel } from './AssetManifestPanel';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { ConsoleLog } from '../HUDModules/ConsoleLog';
import { DomainNavigator } from '../HUDModules/DomainNavigator';
import { BbsService } from '../HUDModules/BbsService';
import { MissionMapView } from '../HUDModules/MissionMapView';
import { CharacterSheet } from '../HUDModules/CharacterSheet';
import { AetherArchive as Archive } from '../HUDModules/AetherArchive';
import { GestaltMirror as Mirror } from '../HUDModules/GestaltMirror';
import { VibeScanner as Scanner } from '../HUDModules/VibeScanner';
import { LogicGate as Logic } from '../HUDModules/LogicGate';
import { UnityInterlink as Interlink } from '../HUDModules/UnityInterlink';
import { ThoughtOrchestrator as Orchestrator } from '../HUDModules/ThoughtOrchestrator';
import { ParadigmShifter as Shifter } from '../HUDModules/ParadigmShifter';
import { MasteryConsolidator as Consolidator } from '../HUDModules/MasteryConsolidator';
import { AetherNexus as Nexus } from '../HUDModules/AetherNexus';
import { DiceRoller, type DiceTier } from '../HUDModules/DiceRoller';
import { IDEPanel } from '../HUDModules/IDEPanel';
import { GitHubPanel } from '../HUDModules/GitHubPanel';
import { BrainEditorModal } from '../HUDModules/BrainEditorModal';
import { useSwarm } from '../../Omni/lib/useSwarm';

import { SessionSignet } from '../HUDModules/SessionSignet';
import { SemanticExplorer } from '../HUDModules/SemanticExplorer';
import { LoreArchitect } from './LoreArchitect';
import { AetherConsole } from './AetherConsole';
import { OrchestratorModule } from '../HUDModules/OrchestratorModule';
import { ManifestationChamber } from '../HUDModules/ManifestationChamber';
import { AIBuddyChatHud } from '../HUDModules/AIBuddyChatHud';
import { DnDHeroStudio } from '../HUDModules/DnDHeroStudio';
import { DiegeticHeroStudio } from '../HUDModules/DiegeticHeroStudio';
import { PixelArtInatorHud } from '../HUDModules/PixelArtInatorHud';
import { MicrovoxelCombatLab } from '../HUDModules/MicrovoxelCombatLab';
import { SpriteLaboratory } from './SpriteLaboratory';
import { BarbarianBenchmarkSandbox } from './BarbarianBenchmarkSandbox';
import { SoundstageStudioModal } from '../Soundstage/SoundstageStudioModal';
import { CinemaRemoteControl } from '../Soundstage/CinemaRemoteControl';
import { SoundstageDirectorRemote } from '../Soundstage/SoundstageDirectorRemote';
import { useCanvasRecorder } from '../../hooks/useCanvasRecorder';
import { CognitiveMatrix } from '../CognitiveMatrix/CognitiveMatrix';
import { HoloCortex4D } from '../CognitiveMatrix/HoloCortex4D';
import { NexusCube } from '../CognitiveMatrix/NexusCube';
import { useResonance } from '../../hooks/useResonance';
import { useActionCombat } from '../../hooks/useActionCombat';
import { useWorld } from '../../engine/WorldContext';
import { NexusContainer } from '../Shared/NexusContainer';
import { GlyphriderCartridge } from '../../cartridges/Glyphrider';
import { getSequenceById } from './applicationRegistry';
import { SYMBOL_TO_ID } from '../../utils/SemanticAddressing';

export const sanitizeLocalPath = (url: string) => {
    if (!url) return url;
    let clean = url.replace(/["']/g, '').trim();
    try {
        clean = decodeURIComponent(clean);
    } catch (e) { }

    // Uniformly handle slashes
    const normalized = clean.replace(/\\/g, '/');
    const lower = normalized.toLowerCase();

    // Look for "public/" anywhere in the path
    const pubTag = 'public/';
    const pubIdx = lower.indexOf(pubTag);
    if (pubIdx !== -1) {
        let rel = normalized.substring(pubIdx + pubTag.length - 1); // include the slash: /textures/...
        if (!rel.startsWith('/')) rel = '/' + rel;
        return rel;
    }

    // Secondary fallback for common project subfolders if "public" isn't in string
    const fallbacks = ['textures/', 'maps/', 'images/'];
    for (const f of fallbacks) {
        const idx = lower.indexOf(f);
        if (idx !== -1) {
            let rel = normalized.substring(idx - 1);
            if (!rel.startsWith('/')) rel = '/' + rel;
            return rel;
        }
    }

    return clean;
};

export const AGENT_ICONS: Record<AgentId, React.ReactNode> = {
    self: <Fingerprint size={16} />,
    thought: <Brain size={16} />,
    logic: <Cpu size={16} />,
    unity: <Users size={16} />,
    existence: <Monitor size={16} />,
    improvement: <FlaskConical size={16} />,
    mastery: <Library size={16} />,
    resonance: <MessageSquare size={16} />,
    transcendence: <Layers size={16} />,
    omni: <Users2 size={16} />,
    orchestrator: <Fingerprint size={16} />,
    bartender: <Coffee size={16} />,
    user: <User size={16} />
};

const generateId = () => Math.random().toString(36).substr(2, 9);

interface ChatMessage {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: number;
    agentId?: AgentId; // Track who sent it
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ShapeshiftProposal: React.FC<{
    slug: string,
    onApprove: () => void,
    onDeny: () => void
}> = ({ slug, onApprove, onDeny }) => (
    <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[10010] min-w-[320px] bg-black/80 border border-cyan-500/50 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.2)] pointer-events-auto"
    >
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-3 bg-cyan-500/10 rounded-full border border-cyan-500/30 animate-pulse">
                <Users2 className="text-cyan-400" size={32} />
            </div>
            <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Manifestation Proposal</h3>
                <p className="text-[10px] text-white/40 font-mono italic">The Tutor wishes to adopt the following identity:</p>
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-sm font-bold text-white uppercase tracking-widest">{slug.replace('.', ' :: ')}</span>
            </div>
            <div className="flex gap-3 w-full mt-2">
                <button
                    onClick={onDeny}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase text-white/40 hover:text-white transition-all"
                >
                    Deny
                </button>
                <button
                    onClick={onApprove}
                    className="flex-1 py-2 bg-cyan-500/40 hover:bg-cyan-500/60 border border-cyan-500/50 rounded-xl text-[10px] font-bold uppercase text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                >
                    Authorize
                </button>
            </div>
        </div>
    </motion.div>
);

interface MaxOverlayProps {
    userGestalt?: UserGestalt;
    onUpdateUserGestalt?: (update: any) => void;
    library?: LibraryNode[];
    activeGem?: GemId;
    setActiveGem?: (gem: GemId) => void;
    agentTargets?: Record<string, string>;
    children?: React.ReactNode;
    isPanelsVisible?: boolean;
    setIsPanelsVisible?: (visible: boolean) => void;
    isGraphVisible?: boolean;
    setIsGraphVisible?: (visible: boolean) => void;
}

const DimensionShiftEffect: React.FC<{ active: boolean }> = ({ active }) => (
    <AnimatePresence>
        {active && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    background: 'radial-gradient(circle, transparent 20%, rgba(255,100,255,0.05) 80%)',
                    backdropFilter: 'contrast(1.2) brightness(1.1) saturate(1.5) blur(1px)',
                }}
            >
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <filter id="wobble">
                        <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="1">
                            <animate attributeName="baseFrequency" values="0.01;0.015;0.01" dur="2s" repeatCount="indefinite" />
                        </feTurbulence>
                        <feDisplacementMap in="SourceGraphic" scale="30" />
                    </filter>
                </svg>
                <div style={{
                    width: '100%',
                    height: '100%',
                    filter: 'url(#wobble)',
                    background: 'inherit'
                }} />
            </motion.div>
        )}
    </AnimatePresence>
);

export const MaxOverlay: React.FC<MaxOverlayProps> = ({
    activeGem = 'Self',
    setActiveGem,
    agentTargets: propAgentTargets,
    children,
    isPanelsVisible = false,
    setIsPanelsVisible = () => { },
    userGestalt,
    onUpdateUserGestalt
}) => {
    // --- State ---
    const {
        setActiveAgent, activeAgentId, agents, state: hrmState,
        visibleAgentIds, toggleAgentVisibility,
        agentGenomes, updateAgentGenome,
        tutorPersona, pendingShapeshift, proposeShapeshift, approveShapeshift, denyShapeshift,
        fileNodes, readFile,
        grantOntoCoin, addToInventory,
        thinkLocally
    } = useCouncil();

    const { 
        currentEnvironment, 
        swapDimension, 
        population, 
        saveProp, 
        terrainConfig, 
        updateTerrainConfig 
    } = useWorld();

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: generateId(),
            sender: 'agent',
            agentId: 'self',
            text: "W-w-welcome to the Council. I'm listening.",
            timestamp: Date.now()
        }
    ]);

    // Diegetic Decagonal Prism Navigator State
    const [isDiegeticPrismOpen, setIsDiegeticPrismOpen] = useState<boolean>(false);
    const [activePrismPillarIndex, setActivePrismPillarIndex] = useState<number>(0);
    const [isDecaCouncilOpen, setIsDecaCouncilOpen] = useState<boolean>(true);

    // Overlay / Council visibility - default on (Council Summoned)
    const [isVisible, setIsVisible] = useState(true);
    const [useLocalAi, setUseLocalAi] = useState(true);
    const [isManualDrive, setIsManualDrive] = useState(false);

    // Base floor config - 10x10 grid exact
    const [floorConfig, setFloorConfig] = useState<FloorConfig>({
        showGrid: true, showTexture: false, x: 0, y: 0, z: 0, width: 200, depth: 200,
        textureUrl: '',
        layerDepth: 2.5 // Increased for sprite separation
    });
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [isLevitationEnabled, setIsLevitationEnabled] = useState(false);
    const [customAmbient, setCustomAmbient] = useState<number | null>(null);
    const [customScreenIntensity, setCustomScreenIntensity] = useState<number | null>(null);


    // Screen Transform
    const [screenConfig, setScreenConfig] = useState({ scale: 0.35, x: -30, y: -21, z: -100, rotationY: 0 });
    const [orchestratorMessages, setOrchestratorMessages] = useState<any[]>([]);

    // Cinema Playback Engine (3D Theater Environment)
    const [cinemaReel, setCinemaReel] = useState('hello_world.mp4');
    const [isCinemaPlaying, setIsCinemaPlaying] = useState(true);
    const [isCinemaMuted, setIsCinemaMuted] = useState(false);

    // Soundstage Director Engine (Virtual Soundstage)
    const [soundstageArchetype, setSoundstageArchetype] = useState<string>('larry_technician');
    const [soundstageActionKey, setSoundstageActionKey] = useState(0);
    const [soundstageResetKey, setSoundstageResetKey] = useState(0);
    const [isSoundstageActionRunning, setIsSoundstageActionRunning] = useState(false);
    const [filmUserSprite, setFilmUserSprite] = useState(false); // Clean film set: user sprite excluded by default
    const [filmCompanionSprite, setFilmCompanionSprite] = useState(false); // Companion sprite excluded by default

    const {
        isRecording: isStageRecording,
        formattedDuration: stageRecordingDuration,
        startRecording: startStageRecording,
        stopRecording: stopStageRecording
    } = useCanvasRecorder();

    const handleSoundstageCallAction = () => {
        setIsSoundstageActionRunning(true);
        setSoundstageActionKey(k => k + 1);
    };

    const handleSoundstageResetStage = () => {
        setIsSoundstageActionRunning(false);
        setSoundstageResetKey(k => k + 1);
    };

    const handleSoundstageRecordTake = async () => {
        handleSoundstageResetStage();
        await startStageRecording(`take_${soundstageArchetype}`);
        handleSoundstageCallAction();

        // Auto-stop recording when take completes (~9.5s)
        setTimeout(() => {
            stopStageRecording();
        }, 9500);
    };

    // Combat Engine (Action ISO-RPG)
    const combat = useActionCombat();
    const { callTool: swarmCall } = useSwarm();

    useEffect(() => {
        const handleDeploy = (e: any) => {
            const { targetAddress } = e.detail;
            const appletModules = ['ide-terminal', 'github-uplink', 'chronicles', 'sigil-synthesis', 'telemetry-hub', 'vault', 'inventory', 'aether', 'matrix', 'profile', 'scanner', 'logic', 'unity', 'thought', 'transcendence', 'mastery', 'nexus', 'manifestation-chamber'];

            if (appletModules.includes(targetAddress)) {
                console.log(`[MaxOverlay] Mission targeting applet substrate: ${targetAddress}`);
                setActiveModuleId(targetAddress as any);
            }
        };

        window.addEventListener('myos_deploy_mission' as any, handleDeploy);
        return () => window.removeEventListener('myos_deploy_mission' as any, handleDeploy);
    }, []);

    const GOAL_FRAGMENTS = 5;

    const securedCount = useMemo(() => combat.entities.filter((e: any) => e.type === 'fragment' && e.isSecured).length, [combat.entities]);
    const compromisedCount = useMemo(() => combat.entities.filter((e: any) => e.type === 'fragment' && e.isCompromised).length, [combat.entities]);

    // Fragment Status (Drives Resonance)
    const fragmentStatus = useMemo(() => ({
        total: GOAL_FRAGMENTS,
        secured: securedCount,
        compromised: compromisedCount
    }), [securedCount, compromisedCount]);

    // Resonance Engine (Mode 8)
    const resonance = useResonance(fragmentStatus);

    const lightConfig = useMemo(() => ({
        screenIntensity: customScreenIntensity ?? 20,
        ambientIntensity: customAmbient ?? resonance.currentState.ambientIntensity
    }), [resonance.currentState.ambientIntensity, customAmbient, customScreenIntensity]);

    // Camera Config - Closer and lower for better framing
    const [cameraConfig, setCameraConfig] = useState({ x: 0, y: 2.5, z: 12, fov: 40 });
    const [cameraRotationY, setCameraRotationY] = useState(0);
    const [cameraRotationX, setCameraRotationX] = useState(0);

    const handleToggleAllAgents = useCallback((show: boolean) => {
        const pillarIds = ['self', 'thought', 'logic', 'unity', 'existence', 'improvement', 'mastery', 'resonance', 'transcendence', 'omni'] as AgentId[];
        pillarIds.forEach(id => {
            const isVisible = visibleAgentIds.includes(id);
            if (show && !isVisible) toggleAgentVisibility(id);
            if (!show && isVisible) toggleAgentVisibility(id);
        });
    }, [visibleAgentIds, toggleAgentVisibility]);

    const [bonePrefix, setBonePrefix] = useState('mixamorig');

    // Input
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, agentId: AgentId } | null>(null);
    const [propContextMenu, setPropContextMenu] = useState<{ x: number, y: number, propId: string } | null>(null);
    const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
    const [transformMode, setTransformMode] = useState<'translate' | 'scale'>('translate');
    const [showAssetManifest, setShowAssetManifest] = useState(false);
    const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>(undefined);
    const [impactedPropId, setImpactedPropId] = useState<string | null>(null);

    const [autoSaveHandle, setAutoSaveHandle] = useState<FileSystemFileHandle | null>(null);

    const [isCognitiveCortexOpen, setIsCognitiveCortexOpen] = useState(false);
    const [isSocialMode, setIsSocialMode] = useState(false);
    const [isStagecraftMode, setIsStagecraftMode] = useState(false);
    const [isUiVisible, setIsUiVisible] = useState(false);
    const [isTelemetryVisible, setIsTelemetryVisible] = useState(false);
    const [isFacetDebugActive, setIsFacetDebugActive] = useState(false);
    const [isSemanticExplorerOpen, setIsSemanticExplorerOpen] = useState(false);
    const [aiChatTarget, setAiChatTarget] = useState<AgentId | null>(null);

    // Quick Chat Keybinding: Press Enter to talk with Cognitive Cortex, Esc to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            const isInput = activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName);
            if (isInput) return;

            if (e.key === 'Enter') {
                e.preventDefault();
                setIsCognitiveCortexOpen(prev => !prev);
            } else if (e.key.toLowerCase() === 'p') {
                e.preventDefault();
                if (isDiegeticPrismOpen) {
                    window.dispatchEvent(new CustomEvent('myos_trigger_diegetic_collapse'));
                } else {
                    setIsDiegeticPrismOpen(true);
                    setIsPanelsVisible?.(false);
                }
            } else if (e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsDecaCouncilOpen(prev => !prev);
            } else if (e.key === 'Escape') {
                if (isDecaCouncilOpen) setIsDecaCouncilOpen(false);
                if (isCognitiveCortexOpen) setIsCognitiveCortexOpen(false);
                if (aiChatTarget) setAiChatTarget(null);
                if (isDiegeticPrismOpen) {
                    window.dispatchEvent(new CustomEvent('myos_trigger_diegetic_collapse'));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCognitiveCortexOpen, aiChatTarget, isDiegeticPrismOpen, isDecaCouncilOpen]);

    const [floorTextureOptions, setFloorTextureOptions] = useState<Array<{ name: string, url: string }>>([
        { name: 'Yawning Portal Map', url: '/data/Yawning_Portal_layout_OiW.png' },
        { name: 'Grass (Primal)', url: '/textures/grass.jpg' },
        { name: 'Waterdeep Streets (City)', url: '/textures/waterdeep_paved.png' },
        { name: 'Stone 1 (Void)', url: '/textures/stone_floor_1.jpg' },
        { name: 'Stone 2 (Aetherial)', url: '/textures/stone_floor_2.jpg' },
        { name: 'Stone 3 (Obsidian)', url: '/textures/stone_floor_3.jpg' }
    ]);

    // Dimension Door (Universal Stagecraft)
    const initialDimension = (() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const dimParam = params.get('dim') || params.get('dimension');
            if (dimParam && ENVIRONMENTS[dimParam]) return dimParam;
            const hash = window.location.hash.replace(/^#/, '');
            if (hash && ENVIRONMENTS[hash]) return hash;
        }
        return 'desktop';
    })();

    const [currentDimension, setCurrentDimension] = useState<string>(initialDimension);
    const [fogNear, setFogNear] = useState(500);
    const [fogFar, setFogFar] = useState(2000);
    const [fogColor, setFogColor] = useState('#ffffff');
    const [currentLayers, setCurrentLayers] = useState<EnvironmentLayer[]>([]);
    const [isShifting, setIsShifting] = useState(false);
    const [closingPortalId, setClosingPortalId] = useState<string | null>(null);
    const [pendingTransition, setPendingTransition] = useState<any>(null);

    const [dynamicProps, setDynamicProps] = useState<any[]>([]);
    
    // Track props per dimension for "Unique States"
    const [dimensionPropsMap, setDimensionPropsMap] = useState<Record<string, any[]>>({
        'faerun': [
            { id: 'old_skull_inn', type: 'building', rawPosition: [25, 0, 35], scale: 1.0, texturePath: 'inn' },
            { id: 'shadowdale_tower', type: 'building', rawPosition: [-40, 0, -20], scale: 1.0, texturePath: 'tower' }
        ],
        'greenest': [],
        'shadow': [],
        'astral': [],
        'matrix': [],
        'glitching_window': [],
        'white_room': [],
        'wilderness': [],
        'gaia_wilderness': [
            { id: 'mt-1', geometryType: 'procedural_mountain', rawPosition: [45, 0, 0], scale: 10, label: 'Mount Genesis' },
            { id: 'mt-2', geometryType: 'procedural_mountain', rawPosition: [-20, 45, 0], scale: 15, label: 'Observer Peak' },
            { id: 'mt-3', geometryType: 'procedural_mountain', rawPosition: [10, -90, 0], scale: 8, label: 'Spire of Logic' }
        ]
    });

    const handleDimensionSwap = useCallback(async (newEnvId: string, force: boolean = false) => {
        console.log("[DEBUG] handleDimensionSwap CALLED with:", newEnvId, "force:", force);
        if (newEnvId === currentDimension && !force) return;
        
        const env = ENVIRONMENTS[newEnvId];
        if (!env) return;

        try {
            setIsShifting(true);

            // Save current dimension props before swapping
            setDimensionPropsMap(prev => ({
                ...prev,
                [currentDimension]: dynamicProps
            }));

            setTimeout(() => {
                const nextEnvProps = dimensionPropsMap[newEnvId] || [];
                setDynamicProps(nextEnvProps);

                setCurrentDimension(newEnvId);
                swapDimension(newEnvId);
                if (env.backgroundUrl) setBackgroundUrl(env.backgroundUrl);
                setFogNear(env.fogNear);
                setFogFar(env.fogFar);
                setFogColor(env.fogColor);
                setCurrentLayers(env.layers || []);

                if (newEnvId === 'uniracers_world') {
                    setCameraConfig({ x: 0, y: 180, z: 320, fov: 60 });
                    setIsPanelsVisible(false);
                    setIsVisible(true);
                } else if (newEnvId === 'bering_sea_lab') {
                    setCameraConfig({ x: 0, y: 0, z: 12, fov: 45 });
                    setIsPanelsVisible(false);
                    setIsVisible(true);
                } else if (newEnvId === 'printer_panic' || newEnvId === 'glyphrider') {
                    if (newEnvId === 'printer_panic') {
                        usePersistentWorldStore.getState().setPlayerPos([-37.5, 0.1, -7.5]);
                        setCameraConfig({ x: 0, y: 15, z: 20, fov: 48 });
                    }
                    setIsPanelsVisible(false);
                    setIsVisible(true);
                } else if (currentDimension === 'printer_panic' || currentDimension === 'glyphrider' || currentDimension === 'uniracers_world' || currentDimension === 'bering_sea_lab') {
                    setIsPanelsVisible(true);
                    setIsVisible(true);
                    setCameraConfig({ x: 0, y: 2.5, z: 12, fov: 40 });
                }

                // Sync floor config
                setFloorConfig(prev => ({
                    ...prev,
                    ...env.floorConfig,
                    textureUrl: env.floorConfig.textureUrl || prev.textureUrl
                }));

                setTimeout(() => {
                    setIsShifting(false);
                    setIsVisible(true);
                }, 500);
            }, 500);
        } catch (err) {
            console.error("Dimension shift failed:", err);
            setIsShifting(false);
            setIsVisible(true);
        }
    }, [setBackgroundUrl, setFloorConfig, currentDimension, dimensionPropsMap, dynamicProps]);

    const handleSwapRef = useRef(handleDimensionSwap);
    handleSwapRef.current = handleDimensionSwap;

    const initialDimMountedRef = useRef(false);
    useEffect(() => {
        try { localStorage.removeItem('myos_dimension'); } catch (e) {}
        if (!initialDimMountedRef.current) {
            initialDimMountedRef.current = true;
            if (initialDimension !== 'desktop' && ENVIRONMENTS[initialDimension]) {
                handleSwapRef.current(initialDimension, true);
            }
        }
    }, []);

    useEffect(() => {
        (window as any).__MYOS_SWAP_DIMENSION = (dim: string) => handleSwapRef.current(dim, true);
        const handleSwapEvent = (e: any) => {
            if (e.detail) handleSwapRef.current(e.detail, true);
        };
        window.addEventListener('myos_swap_dimension', handleSwapEvent);
        return () => window.removeEventListener('myos_swap_dimension', handleSwapEvent);
    }, []);

    useEffect(() => {
        const handlePathChange = (e: any) => {
            const path = e.detail?.path as string[];
            if (!path || path.length === 0) return;

            const root = path[0];
            const sub = path[1];

            console.log(`[PATH_ROUTER] Path changed to: ${path.join('.')}`);

            // Map paths to 3D dimensions dynamically
            if (root === 'Existence') {
                if (sub === 'Logic') {
                    // 🜄.🜔 -> Matrix / Glyphrider
                    handleDimensionSwap('matrix');
                } else if (sub === 'Mastery') {
                    // 🜄.☉ -> Astra Lab / Manifestation Chamber
                    handleDimensionSwap('astra_faerun');
                } else {
                    // Existence root -> Wilderness
                    handleDimensionSwap('wilderness');
                }
            } else if (root === 'Mastery') {
                // Mastery / VTT Map -> Astra Faerun (VTT)
                handleDimensionSwap('astra_faerun');
            } else if (root === 'Resonance') {
                // Resonance / BBS -> Glitching Window Tavern
                handleDimensionSwap('glitching_window');
            } else if (root === 'Self') {
                // Self / Sprite Lab -> Initial Substrate (White Room)
                handleDimensionSwap('white_room');
            } else if (root === 'Logic') {
                // Logic / Systems -> Greenest
                handleDimensionSwap('greenest');
            } else if (root === 'Transcendence') {
                // Transcendence -> Shadow void
                handleDimensionSwap('shadow');
            }
        };

        window.addEventListener('myos_path_change', handlePathChange);
        return () => window.removeEventListener('myos_path_change', handlePathChange);
    }, [handleDimensionSwap]);

    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    useEffect(() => {
        const handleOpenModule = (e: any) => {
            if (e.detail) setActiveModuleId(e.detail);
        };
        window.addEventListener('myos_open_module' as any, handleOpenModule);
        window.addEventListener('myos:open-module' as any, handleOpenModule);
        return () => {
            window.removeEventListener('myos_open_module' as any, handleOpenModule);
            window.removeEventListener('myos:open-module' as any, handleOpenModule);
        };
    }, []);

    // Setup global message listener for the System Logger / Thoughts
    useEffect(() => {
        const handleLog = (e: any) => {
            const text = e.detail?.text;
            if (!text) return;
            setSystemLogs(prev => [...prev, text].slice(-50));

            // Also mirror logs into MemCube text memory if available
            if (hrmState.memCube) {
                hrmState.memCube.text_mem.add(`[SYSTEM] ${text}`);
            }
        };

        const handleCrystallize = (e: any) => {
            const { origin, resonance, payload } = e.detail || {};
            if (hrmState.memCube) {
                hrmState.memCube.para_mem.update(`crystal_${Date.now()}`, { origin, resonance, payload });
                hrmState.memCube.text_mem.add(`[CRYSTAL] Formed from ${origin}`);
            }
        };

        window.addEventListener('myos_system_log', handleLog);
        window.addEventListener('myos_crystallize_memory', handleCrystallize);
        return () => {
            window.removeEventListener('myos_system_log', handleLog);
            window.removeEventListener('myos_crystallize_memory', handleCrystallize);
        }
    }, [hrmState.memCube]);

    const addSystemMessage = useCallback((text: string) => {
        const msg: ChatMessage = {
            id: generateId(),
            sender: 'agent',
            agentId: 'self',
            text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, msg]);
        if (hrmState.memCube) {
            hrmState.memCube.text_mem.add(`[SYSTEM] ${text}`);
        }
    }, [hrmState.memCube]);
    const [pendingDiceRoll, setPendingDiceRoll] = useState<{
        tier: DiceTier;
        targetDC: number;
        label: string;
        onComplete: (res: number, success: boolean, diff: number) => void;
    } | null>(null);

    const [localAgentTargets, setLocalAgentTargets] = useState<Record<string, string>>({});
    const agentTargets = propAgentTargets || localAgentTargets;
    const setAgentTargets = setLocalAgentTargets;

    const handleSetTarget = (agentId: string, coord: string) => {
        setAgentTargets(prev => ({ ...prev, [agentId]: coord }));
    };

    const { isConnected, partyMemberIds, activePartyLeadId } = useCouncil();

    const [agentOverrides, setAgentOverrides] = useState<Record<string, Partial<any>>>({});
    const [propOverrides, setPropOverrides] = useState<Record<string, any>>({});

    useEffect(() => {
        const unlocked = fragmentStatus.secured === fragmentStatus.total && fragmentStatus.total > 0;
        console.log("[DOOR_LOGIC] Check:", {
            secured: fragmentStatus.secured,
            total: fragmentStatus.total,
            unlocked,
            entitiesCount: combat.entities.length
        });

        if (unlocked) {
            setDynamicProps(prev => {
                if (prev.some(p => p.id.startsWith('door-'))) return prev;
                return [
                    ...prev,
                    {
                        id: 'door-neutral',
                        type: 'hyperObject',
                        rawPosition: [0, 0, -8],
                        scale: 2.2,
                        label: 'EXIT TO HUB',
                        linkedResonance: 0,
                        textureUrl: '/assets/ZAMN_Assets/32191.png',
                        isLocked: false
                    }
                ];
            });
        } else {
            // FORCE REMOVE doors if not unlocked
            setDynamicProps(prev => {
                const hasDoors = prev.some(p => p.id.startsWith('door-'));
                if (!hasDoors) return prev;
                return prev.filter(p => !p.id.startsWith('door-'));
            });
        }
    }, [fragmentStatus.secured, fragmentStatus.total]);

    // --- HEOP Catalyst: Fragment Synthesis Bridge ---
    const lastSecuredCount = useRef(0);
    useEffect(() => {
        if (securedCount > lastSecuredCount.current) {
            const diff = securedCount - lastSecuredCount.current;
            lastSecuredCount.current = securedCount;

            const items = [
                { id: 'starry-hood', name: 'Starry Hood of the Archive', type: 'hat', path: 'magic/hat_magic_misc_adult_starry.png', rarity: 'Exotic', description: 'A hood woven from the aetherial threads of Pillar 10 (Omni).' },
                { id: 'plate-gold', name: 'Solar Breastplate', type: 'torso', path: 'armour/torso_armour_plate_male_gold.png', rarity: 'Exotic', description: 'Forged in the heart of the first cycle. Radiates Existence.' },
                { id: 'staff-crystal', name: 'Aether Crystal Staff', type: 'weapon', path: 'magic/weapon_magic_crystal_universal_foreground_crystal.png', rarity: 'Rare', description: 'A staff that focuses semantic resonance into pure observation.' },
                { id: 'staff-loop', name: 'Void Loop Staff', type: 'weapon', path: 'magic/weapon_magic_loop_universal_foreground_dark.png', rarity: 'Exotic', description: 'A gnarled staff that loops context back into the zero.' }
            ];

            for (let i = 0; i < diff; i++) {
                // Grant Onto-coins
                grantOntoCoin('SelCoin', 100);
                grantOntoCoin('ResCoin', 50);

                // Synthesis a random item
                const randomItem = items[Math.floor(Math.random() * items.length)];
                addToInventory(randomItem);

                addSystemMessage(`[HEOP_CATALYST] Fragment synthesized: ${randomItem.name.toUpperCase()}. Axiom Gains applied.`);
            }
        } else if (securedCount === 0) {
            lastSecuredCount.current = 0; // Reset for new session
        }
    }, [securedCount, grantOntoCoin, addToInventory, addSystemMessage]);

    const effectiveAgents = useMemo(() => {
        const merged = { ...agents };

        // Apply agentGenomes directly to agents (especially orchestrator / companion)
        Object.entries(agentGenomes).forEach(([id, genome]) => {
            const agentId = (id === 'companion' ? 'orchestrator' : id) as AgentId;
            if (merged[agentId] && genome) {
                const unwrappedGenome = genome?.genome || genome;
                const hasSpriteBody = !!(unwrappedGenome?.body || unwrappedGenome?.torso || unwrappedGenome?.legs || unwrappedGenome?.hair);
                if (hasSpriteBody) {
                    merged[agentId] = {
                        ...merged[agentId],
                        avatarConfig: {
                            ...merged[agentId].avatarConfig,
                            genome: unwrappedGenome,
                            modelType: 'sprite'
                        }
                    };
                }
            }
        });

        Object.entries(agentOverrides).forEach(([id, override]) => {
            const agentId = id as AgentId;
            if (merged[agentId]) {
                const agentGenome = agentGenomes[agentId] || (agentId === 'orchestrator' ? agentGenomes['companion'] : null);
                merged[agentId] = {
                    ...merged[agentId],
                    avatarConfig: {
                        ...merged[agentId].avatarConfig,
                        ...(override.avatarConfig || {}),
                        // If we have tags in agentGenomes (from a Liquid Genome burst), prioritize them
                        genomeTags: Array.isArray(agentGenome) ? agentGenome :
                            (override.avatarConfig?.genomeTags || merged[agentId].avatarConfig.genomeTags),
                        modelType: override.avatarConfig?.modelType ||
                            (agentGenome?.dimensions ? 'procedural' : (agentGenome ? 'sprite' : merged[agentId].avatarConfig.modelType))
                    }
                };
            }
        });

        // Inject Tutor Persona if active
        if (tutorPersona?.path && merged.orchestrator) {
            merged.orchestrator.avatarConfig = {
                ...merged.orchestrator.avatarConfig,
                ontologyPath: tutorPersona.path,
                modelType: 'sprite'
            };
            // If the persona has specific genome tags (from the library), apply them
            if (tutorPersona.genomeTags && tutorPersona.genomeTags.length > 0) {
                merged.orchestrator.avatarConfig.genomeTags = tutorPersona.genomeTags;
            }
        }

        return merged;
    }, [agents, agentOverrides, agentGenomes, tutorPersona]);

    // Listener for companion avatar equipping
    useEffect(() => {
        const handleCompanionUpdate = (e: any) => {
            const update = e.detail?.genome;
            if (update) {
                updateAgentGenome('orchestrator', update);
                updateAgentGenome('companion' as AgentId, update);
                setAgentOverrides(prev => ({
                    ...prev,
                    orchestrator: {
                        ...(prev.orchestrator || {}),
                        avatarConfig: {
                            ...(prev.orchestrator?.avatarConfig || {}),
                            genome: update.genome || update,
                            modelType: 'sprite'
                        }
                    }
                }));
            }
        };
        window.addEventListener('myos_update_companion', handleCompanionUpdate);
        return () => window.removeEventListener('myos_update_companion', handleCompanionUpdate);
    }, [updateAgentGenome]);

    // Pre-extract array to avoid re-rendering AvatarScene
    const effectiveAgentsArray = useMemo(() => Object.values(effectiveAgents), [effectiveAgents]);

    const [userPos, setUserPos] = useState({ x: 0, y: 0.1, z: 0 });
    const [worldOffset, setWorldOffset] = useState({ x: 0, y: 0, z: 0 });
    const [orchestratorPos, setOrchestratorPos] = useState({ x: 3.5, y: 0.1, z: 3.5 });
    const [orchestratorFollowsUser, setOrchestratorFollowsUser] = useState(true);
    const lastSyncPos = useRef({ x: 0, y: 0, z: 0 });

    const handleUserTrackPosition = useCallback((pos: { x: number, y: number, z: number }, offset?: { x: number, y: number, z: number }) => {
        setUserPos(pos);
        if (offset) setWorldOffset(offset);
        setOrchestratorPos({ x: pos.x + 3.5, y: pos.y, z: pos.z + 3.5 });

        // Sync with combat engine - throttled by distance
        const dx = pos.x - lastSyncPos.current.x;
        const dy = pos.y - lastSyncPos.current.y;
        const dz = pos.z - lastSyncPos.current.z;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || Math.abs(dz) > 0.1) {
            combat.syncHeroPosition([pos.x + (offset?.x || 0), pos.y, pos.z + (offset?.z || 0)]);
            lastSyncPos.current = pos;
        }
    }, [combat]);

    const idbHelper = useMemo(() => {
        const DB_NAME = 'MaxOSDatabase';
        const STORE_NAME = 'fileHandles';
        return {
            init: (): Promise<IDBDatabase> => {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(DB_NAME, 1);
                    request.onupgradeneeded = (e: any) => {
                        e.target.result.createObjectStore(STORE_NAME);
                    };
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            },
            get: async (key: string): Promise<any> => {
                const db = await idbHelper.init();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            },
            set: async (key: string, val: any): Promise<void> => {
                const db = await idbHelper.init();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    const request = store.put(val, key);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }
        };
    }, []);

    const applyState = useCallback((parsed: any) => {
        if (parsed.floorConfig) {
            if (parsed.floorConfig.textureUrl) parsed.floorConfig.textureUrl = sanitizeLocalPath(parsed.floorConfig.textureUrl);
            setFloorConfig(prev => ({ ...prev, ...parsed.floorConfig }));
        }
        if (parsed.screenConfig) setScreenConfig(prev => ({ ...prev, ...parsed.screenConfig }));
        if (parsed.cameraConfig) setCameraConfig(prev => ({ ...prev, ...parsed.cameraConfig }));
        if (parsed.bonePrefix) setBonePrefix(parsed.bonePrefix);
        if (parsed.agentsConfig) setAgentOverrides(parsed.agentsConfig);
        if (parsed.propOverrides) setPropOverrides(parsed.propOverrides);
        if (parsed.backgroundUrl) setBackgroundUrl(parsed.backgroundUrl);
        if (parsed.floorTextureOptions) setFloorTextureOptions(parsed.floorTextureOptions);
        if (parsed.resonanceIndex !== undefined) resonance.setResonanceIndex(parsed.resonanceIndex);

        // --- NEW: Restore Agent Genomes (Sprites) ---
        if (parsed.agentGenomes) {
            Object.entries(parsed.agentGenomes).forEach(([id, genome]) => {
                updateAgentGenome(id as any, genome);
            });
        }
    }, [resonance, updateAgentGenome]);

    const hasPromptedRef = useRef(false);

    // Initial load and restoration logic
    useEffect(() => {
        if (hasPromptedRef.current) return;
        hasPromptedRef.current = true;

        const init = async () => {
            // 1. File Handle Retrieval
            try {
                const handle = await idbHelper.get('autosaveHandle');
                if (handle && (handle as any).verifyPermission) {
                    const isAllowed = await (handle as any).verifyPermission({ mode: 'readwrite' });
                    if (isAllowed === 'granted') setAutoSaveHandle(handle);
                }
            } catch (e) {
                console.warn("Handle retrieval failed", e);
            }

            // 2. LocalStorage Configuration
            const saved = localStorage.getItem('max_overlay_config');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);

                    // Filter out doors from restored props - logic will re-add them if unlocked
                    if (parsed.dynamicProps) {
                        parsed.dynamicProps = parsed.dynamicProps.filter((p: any) => !p.id?.startsWith('door-'));
                    }

                    // Seamless non-blocking session restoration
                    applyState(parsed);
                    if (parsed.dynamicProps) {
                        setDynamicProps(prev => {
                            // Identify existing door IDs to avoid duplicates
                            const doorIds = new Set(prev.filter(p => p.id?.startsWith('door-')).map(p => p.id));
                            const nonDoorProps = parsed.dynamicProps.filter((p: any) => !doorIds.has(p.id));
                            return [...prev, ...nonDoorProps];
                        });
                    }
                    addSystemMessage("Dimensional parameters synced.");
                } catch (e) {
                    console.error("State parse error", e);
                }
            }
        };

        init();
    }, [idbHelper, applyState]);

    useEffect(() => {
        // Voice stop removed
    }, []);

    useEffect(() => {
        // Legacy HEOP fragment spawning disabled to keep worlds clean for 2.5D characters
    }, []);

    useEffect(() => {
        const handler = (e: any) => {
            const { id, avatarConfig } = e.detail;
            setAgentOverrides(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    avatarConfig: {
                        ...(prev[id]?.avatarConfig || {}),
                        ...avatarConfig
                    }
                }
            }));
        };
        window.addEventListener('myos_agent_override', handler);
        return () => window.removeEventListener('myos_agent_override', handler);
    }, []);

    useEffect(() => {
        const diveHandler = () => {
            setActiveModuleId('domain-navigator');
            setIsPanelsVisible(true);
        };
        const extractHandler = (e: any) => {
            const domainId = e.detail?.domainId || 'UNKNOWN';
            console.log(`[EXTRACTION PROTOCOL ACTIVE]: Domain ${domainId} cleared.`);
            // Await a brief UI shift logic
            setTimeout(() => {
                setIsPanelsVisible(true);
            }, 1000);
            setActiveModuleId(null);
        };
        const deployHandler = (e: any) => {
            const { title, targetAddress } = e.detail;

            const runMacro = async () => {
                addSystemMessage(`[MISSION_CONTROL] DEPLOYING TO: ${title.toUpperCase()}`);

                // 1. Clear Focus
                setActiveAgent(null);
                await new Promise(r => setTimeout(r, 600));

                // 2. Trigger Dimension Shift to Wilderness
                handleDimensionSwap('wilderness');
                addSystemMessage("SHIFTING_TO_WILDERNESS_DIMENSION...");
                await new Promise(r => setTimeout(r, 800));

                // 3. Establish 2D Hub Panels
                setIsPanelsVisible(true);
                addSystemMessage(`ESTABLISHING_VPN_TUNNEL: ${targetAddress || 'DIRECT'}`);
                await new Promise(r => setTimeout(r, 800));

                // 4. Route to Target Gem/Pillar
                if (targetAddress) {
                    const gemPart = targetAddress.split('.')[0] || targetAddress;
                    const gemId = (gemPart.charAt(0).toUpperCase() + gemPart.slice(1).toLowerCase()) as GemId;
                    const validGems: GemId[] = ['Self', 'Thought', 'Logic', 'Unity', 'Existence', 'Improvement', 'Mastery', 'Resonance', 'Transcendence', 'Omni'];
                    if (validGems.includes(gemId)) {
                        setActiveGem?.(gemId);
                    }
                }

                // 5. Finalize UI State
                setActiveModuleId(null); // Close map
                addSystemMessage("DEPLOYMENT_COMPLETE. OPERATIVE_ON_SITE.");
            };

            runMacro();
        };

        window.addEventListener('myos_terminal_dive', diveHandler);
        window.addEventListener('myos_domain_extraction', extractHandler);
        window.addEventListener('myos_deploy_mission', deployHandler);
        return () => {
            window.removeEventListener('myos_terminal_dive', diveHandler);
            window.removeEventListener('myos_domain_extraction', extractHandler);
            window.removeEventListener('myos_deploy_mission', deployHandler);
        };
    }, [handleDimensionSwap, setActiveAgent, setActiveGem]);

    useEffect(() => {
        setBackgroundUrl(resonance.currentState.backgroundUrl);
        setFloorConfig(prev => {
            // Preservation Logic: If we are on a custom map (/data/), don't let resonance clobber it
            if (prev.textureUrl?.includes('/data/')) {
                return {
                    ...prev,
                    ambientIntensity: resonance.currentState.ambientIntensity
                };
            }
            return {
                ...prev,
                textureUrl: resonance.currentState.floorTextureUrl,
                ambientIntensity: resonance.currentState.ambientIntensity
            };
        });
    }, [resonance.currentState]);

    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Persistence Interval
    useEffect(() => {
        if (!isConnected || !hrmState.memCube) return;

        const interval = setInterval(async () => {
            const success = await hrmState.memCube!.dump('');
            if (!success) {
                addSystemMessage("AUTOSAVE FAILED: Check Permissions?");
            }

            const config = {
                timestamp: Date.now(),
                activeAgentId,
                agentsConfig: Object.fromEntries(
                    Object.entries(agents).map(([id, agent]) => [id, agent.avatarConfig])
                ),
                agentGenomes, // Save the actual sprite genomes for persistence
                floorConfig, screenConfig, cameraConfig, lightConfig, bonePrefix,
                propOverrides, dynamicProps, backgroundUrl, floorTextureOptions,
                resonanceIndex: resonance.resonanceIndex
            };

            localStorage.setItem('max_overlay_config', JSON.stringify(config));

            if (autoSaveHandle) {
                try {
                    const writable = await (autoSaveHandle as any).createWritable();
                    await writable.write(JSON.stringify(config, null, 2));
                    await writable.close();
                } catch (e) {
                    console.warn("Background auto-save to file failed", e);
                }
            }
        }, 300000);

        return () => clearInterval(interval);
    }, [isConnected, hrmState.memCube, autoSaveHandle, agents, floorConfig, screenConfig, cameraConfig, lightConfig, bonePrefix, propOverrides, dynamicProps, backgroundUrl, activeAgentId, resonance]);

    // Monitor for Shapeshift Proposals from the Tutor
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.sender === 'agent' && (lastMsg.agentId === 'orchestrator' || lastMsg.agentId === 'self') && lastMsg.text.includes('[SHAPESHIFT_PROPOSAL:')) {
            const match = lastMsg.text.match(/\[SHAPESHIFT_PROPOSAL:\s*([a-zA-Z0-9._-]+)\]/);
            if (match && match[1] && match[1] !== pendingShapeshift) {
                console.log("[SHAPESHIFT] Proposal detected:", match[1]);
                proposeShapeshift(match[1]);
            }
        }
    }, [messages, pendingShapeshift, proposeShapeshift]);

    const handleResetLayout = useCallback(() => {
        setFloorConfig({
            showGrid: true, showTexture: true, x: 0, y: 0, z: 0, width: 200, depth: 200,
            textureUrl: '/textures/stone_floor_1.jpg'
        });
        setCameraConfig({ x: 0, y: 2.5, z: 12, fov: 40 });
        setCameraRotationY(0);
        setZoomLevel(1.0);
        localStorage.removeItem('max_overlay_config');
        addSystemMessage("Dimensional alignment reset to defaults.");
    }, [addSystemMessage]);

    const handlePortalTrigger = useCallback((detail?: any) => {
        console.log("[DEBUG] handlePortalTrigger CALLED with detail:", detail, " | secured:", fragmentStatus.secured, "goal:", GOAL_FRAGMENTS);
        if (fragmentStatus.secured < GOAL_FRAGMENTS) {
            addSystemMessage(`PORTAL_LOCKED: Secure ${GOAL_FRAGMENTS - fragmentStatus.secured} more fragments.`);
            return;
        }

        // Initiate CLOSING animation first
        const doorId = detail?.id;
        if (doorId) {
            setClosingPortalId(doorId);
            setPendingTransition(detail);
            addSystemMessage("DIMENSION_STABILIZING: Initiating portal closure...");
        } else {
            // Fallback if no ID
            handlePortalClosed(null, 'closed');
        }
    }, [fragmentStatus.secured, GOAL_FRAGMENTS, addSystemMessage]);

    const handlePortalClosed = useCallback((_id: string | null, state: string) => {
        if (state !== 'closed') return;

        const detail = pendingTransition;
        const resonanceMap: Record<number, string> = {
            0: 'glitching_window',
            1: 'astral',
            2: 'shadow'
        };

        const resIndex = detail?.linkedResonance ?? 0;
        const biomeId = resonanceMap[resIndex] || 'greenest';

        console.log("[PORTAL] Animation complete. Shifting to:", biomeId);

        if (biomeId === 'glitching_window') {
            addSystemMessage("DIMENSION_SHIFT: Transitioning to THE_GLITCHING_WINDOW [HUB_STABLE]");
            combat.stopCombat();
            const hubEnv = ENVIRONMENTS['glitching_window'];
            if (hubEnv) {
                setFloorConfig(hubEnv.floorConfig as any);
                setFogNear(hubEnv.fogNear);
                setFogFar(hubEnv.fogFar);
                setFogColor(hubEnv.fogColor);
                setCustomAmbient(hubEnv.ambientIntensity);
            }
        } else {
            setCustomAmbient(null); // Reset to resonance-driven
            handleDimensionSwap(biomeId);
            addSystemMessage(`DIMENSION_SHIFT: Transitioning to ${biomeId.toUpperCase()}`);
        }

        if (setActiveGem) setActiveGem('Omni');
        setIsPanelsVisible(true);

        // Reset
        setClosingPortalId(null);
        setPendingTransition(null);
        combat.clearFragments();

        window.dispatchEvent(new CustomEvent('myos_portal_trigger_handled', { detail: { biomeId, resIndex } }));
    }, [pendingTransition, handleDimensionSwap, setActiveGem, setIsPanelsVisible, addSystemMessage, combat]);

    // --- Life-Cycle: Ensure Combat (Collision engine) is ACTIVE and Doors are SYNCED ---
    useEffect(() => {
        if (!combat.isCombatActive) {
            combat.startCombat();
        }
    }, [combat.isCombatActive, combat.startCombat]);

    // Dynamically update dynamicProps (Doors) with local storage or state
    useEffect(() => {
        const isLocallyLocked = fragmentStatus.secured < GOAL_FRAGMENTS;
        setDynamicProps(prev => {
            let changed = false;
            const next = prev.map(p => {
                const isClosing = p.id === closingPortalId;
                const lockedState = p.type === 'hyperObject' ? isLocallyLocked : p.isLocked;

                if (p.type === 'hyperObject' && (p.isLocked !== lockedState || p.isClosing !== isClosing)) {
                    changed = true;
                    return { ...p, isLocked: lockedState, isClosing };
                }
                return p;
            });
            return changed ? next : prev;
        });
    }, [fragmentStatus.secured, GOAL_FRAGMENTS, closingPortalId]);

    useEffect(() => {
        const handler = (e: any) => {
            const { id, linkedPillar } = e.detail;
            if (linkedPillar === 'Omni' || id?.includes('door')) {
                handlePortalTrigger(e.detail);
            }
        };
        window.addEventListener('myos_portal_trigger', handler);
        return () => window.removeEventListener('myos_portal_trigger', handler);
    }, [handlePortalTrigger]);

    useEffect(() => {
        const handler = (e: any) => {
            const { tier, targetDC, label, onComplete } = e.detail;
            setPendingDiceRoll({ tier, targetDC, label, onComplete });
        };
        window.addEventListener('myos_dice_roll', handler);
        return () => window.removeEventListener('myos_dice_roll', handler);
    }, []);

    const getFileContext = (): string => {
        if (fileNodes.length > 0) {
            return fileNodes.map(n => `- ${n.kind}: ${n.path} (${n.type})`).join('\n');
        }
        return "";
    };

    const generateStateSnapshot = () => ({
        timestamp: Date.now(),
        activeAgentId,
        agentsConfig: Object.fromEntries(
            Object.entries(agents).map(([id, agent]) => [id, agent.avatarConfig])
        ),
        agentGenomes, // Save the actual sprite genomes for persistence
        floorConfig, screenConfig, cameraConfig, lightConfig, bonePrefix,
        propOverrides, dynamicProps, backgroundUrl
    });

    const handleExportState = async () => {
        const config = generateStateSnapshot();
        try {
            localStorage.setItem('max_overlay_config', JSON.stringify(config));
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toISOString().split('T')[1].replace(/:/g, '').split('.')[0];
            const name = `myos_universe_${dateStr}_${timeStr}_[omni_alpha].json`;

            const handle = await (window as any).showSaveFilePicker({
                suggestedName: name,
                types: [{
                    description: 'MyOS State File',
                    accept: { 'application/json': ['.json'] },
                }],
            });

            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(config, null, 2));
            await writable.close();

            setAutoSaveHandle(handle);
            await idbHelper.set('autosaveHandle', handle);

            addSystemMessage(`State exported to ${handle.name}. Auto-save initialized.`);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error("Export save failed", e);
                addSystemMessage("Export failed.");
            }
        }
    };

    const handleImportState = async () => {
        try {
            // First attempt to automatically find the most recent state file in the mounted workspace
            if (fileNodes && fileNodes.length > 0 && readFile) {
                const stateFiles = fileNodes
                    .filter(n => n.kind === 'file' && (n.name || n.path).includes('myos_universe_') && (n.name || n.path).endsWith('.json'))
                    .sort((a, b) => {
                        const nameA = a.name || a.path;
                        const nameB = b.name || b.path;
                        return nameB.localeCompare(nameA); // ISO 8601 alphabetically sorts newest first
                    });

                if (stateFiles.length > 0) {
                    const newest = stateFiles[0];
                    try {
                        const content = await readFile(newest.path);
                        if (content) {
                            const parsed = JSON.parse(content);
                            applyState(parsed);
                            addSystemMessage(`Auto-restored most recent state from: ${newest.name || newest.path}.`);
                            return; // Successfully auto-loaded
                        }
                    } catch (readErr) {
                        console.warn("Failed to auto-read most recent state file, falling back to picker.", readErr);
                    }
                }
            }

            // Fallback to manual OS file picker
            const [handle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'MyOS State File',
                    accept: { 'application/json': ['.json'] },
                }],
            });

            const file = await handle.getFile();
            const contents = await file.text();
            const parsed = JSON.parse(contents);

            applyState(parsed);

            setAutoSaveHandle(handle);
            await idbHelper.set('autosaveHandle', handle);

            addSystemMessage(`Restored state from ${handle.name}. Auto-save initialized.`);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error("Import load failed", e);
                addSystemMessage("Failed to load state file.");
            }
        }
    };


    const handlePropAction = (action: string, payload: any) => {
        const propId = typeof payload === 'string' ? payload : (payload?.id);

        if (action === 'move' || action === 'transform_move') {
            setSelectedPropId(propId);
            setTransformMode('translate');
        } else if (action === 'scale' || action === 'transform_scale') {
            setSelectedPropId(propId);
            setTransformMode('scale');
        } else if (action === 'update') {
            setDynamicProps(prev => prev.map(p => p.id === propId ? { ...p, ...payload } : p));
            setPropOverrides(prev => ({
                ...prev,
                [propId]: { ...(prev[propId] || {}), ...payload }
            }));
        } else if (action === 'duplicate') {
            const original = dynamicProps.find(p => p.id === propId);
            if (original) {
                const newProp = {
                    ...original,
                    id: payload.newId,
                    rawPosition: [original.rawPosition[0] + 1, original.rawPosition[1], original.rawPosition[2]]
                };
                setDynamicProps(prev => [...prev, newProp]);
                addSystemMessage(`Manifest duplication complete: Node ${payload.newId} created.`);
            }
        } else if (action === 'reset') {
            setPropOverrides(prev => {
                const updated = { ...prev };
                delete updated[propId];
                return updated;
            });
            setSelectedPropId(null);
        } else if (action === 'delete' || action === 'edit_delete') {
            setDynamicProps(prev => prev.filter(p => p.id !== propId));
            setPropOverrides(prev => {
                const updated = { ...prev };
                delete updated[propId];
                return updated;
            });
            setSelectedPropId(null);
        } else if (action === 'impact') {
            setImpactedPropId(propId);
            setTimeout(() => setImpactedPropId(null), 100);
            addSystemMessage(`Kinetic Surge: Impact detected on ${propId}. Mass reduction protocol initiated.`);
        } else if (action === 'resynthesize_dio') {
            handlePropAction('update', { id: propId, geometryType: 'box', uvScale: [2, 2], rotationSpeed: 0.2 });
            addSystemMessage(`Prop ${propId} has been resynthesized into the D.I.O. format.`);
        } else if (action.startsWith('ontology_')) {
            const protocol = action.replace('ontology_', '').toUpperCase();
            addSystemMessage(`Social Interlink: Prop ${propId} is undergoing ${protocol} protocol verification.`);
        }
        setPropContextMenu(null);
    };


    const renderActiveModule = () => {
        if (!activeModuleId || activeModuleId === 'brain-editor') return null;

        return (
            <div
                className={`pointer-events-auto ${activeModuleId === 'aetherial-sync' ? 'w-[90vw] h-[85vh]' : 'h-[85vh] w-[80vw] max-w-[1200px] overflow-hidden rounded-3xl flex flex-col'}`}
            >
                {activeModuleId === 'state-manager' && (
                    <StateManager
                        onExportState={handleExportState}
                        onImportState={handleImportState}
                        onClose={() => setActiveModuleId(null)}
                    />
                )}
                {/* Game / Combat HUDs placeholder */}

                {/* Stagecraft Controls */}
                {activeModuleId === 'stagecraft-controls' && (
                    <StagecraftControls
                        onClose={() => setActiveModuleId(null)}
                        currentDimension={currentDimension}
                        onDimensionSwap={handleDimensionSwap}
                    />
                )}
                {activeModuleId === 'orchestrator-chat' && (
                    <div className="absolute top-[10%] right-10 w-96 z-50 pointer-events-auto">
                        <OrchestratorModule 
                            fileContext={getFileContext()} 
                            isFollowing={orchestratorFollowsUser}
                            onToggleFollow={() => setOrchestratorFollowsUser(prev => !prev)}
                        />
                    </div>
                )}
                {activeModuleId === 'console-log' && (
                    <ConsoleLog
                        messages={messages}
                        onClear={() => setMessages([])}
                        onClose={() => setActiveModuleId(null)}
                    />
                )}
                {activeModuleId === 'domain-navigator' && (
                    <DomainNavigator onClose={() => setActiveModuleId(null)} />
                )}
                {activeModuleId === 'bbs-service' && (
                    <BbsService
                        onClose={() => setActiveModuleId(null)}
                        onAccept={(id) => {
                            console.log("Mission accepted:", id);
                            setSelectedMissionId(id);
                            setActiveModuleId('mission-map');
                        }}
                    />
                )}
                {activeModuleId === 'mission-map' && (
                    <MissionMapView
                        missionId={selectedMissionId || "M1_ALCHEMICAL_LEAK"}
                        onClose={() => {
                            setActiveModuleId('bbs-service');
                        }}
                        onDeploy={(nodeId) => {
                            console.log("Deploying to node:", nodeId);
                            addSystemMessage(`DEPLOYING PARTY TO NODE_${nodeId.toUpperCase()}...`);
                            setActiveModuleId(null);
                        }}
                    />
                )}
                {activeModuleId === 'character-sheet' && (
                    <CharacterSheet 
                        onClose={() => setActiveModuleId(null)} 
                        userGestalt={userGestalt}
                        onUpdate={(u) => {
                            window.dispatchEvent(new CustomEvent('myos_update_gestalt', { detail: u }));
                        }}
                    />
                )}
                {activeModuleId === 'ide-terminal' && (
                    <IDEPanel />
                )}
                {activeModuleId === 'github-uplink' && (
                    <GitHubPanel
                        onClose={() => setActiveModuleId(null)}
                        onCreateFile={async (_repo: string, path: string, content: string) => {
                            console.log("Writing manifested node to substrate:", path);
                            await swarmCall("write_file", { path, content });
                        }}
                    />
                )}
                {/* 
                  HYBRID RENDERING ENGINE:
                  1. Native Modules: Rendered directly for maximum stability and performance.
                  2. External Integrations: Routed via NexusContainer for semantic mapping.
                */}
                {activeModuleId === 'aether' && <Archive onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'profile' && <Mirror onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'scanner' && <Scanner onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'logic' && <Logic onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'unity' && <Interlink onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'thought' && <Orchestrator onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'transcendence' && <Shifter onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'mastery' && <Consolidator onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'nexus' && <Nexus onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'manifestation-chamber' && <ManifestationChamber onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'pixel-inator' && <PixelArtInatorHud onClose={() => setActiveModuleId(null)} />}
                {(activeModuleId === 'microvoxel-combat' || activeModuleId === 'dragon-lab') && <MicrovoxelCombatLab onClose={() => setActiveModuleId(null)} />}
                {(activeModuleId === 'heroforge-studio' || activeModuleId === 'dnd-studio' || activeModuleId === 'cyclotrope-hero') && <DiegeticHeroStudio onClose={() => setActiveModuleId(null)} />}
                {(activeModuleId === 'sprite-lab' || activeModuleId === 'sprite-laboratory') && <SpriteLaboratory onClose={() => setActiveModuleId(null)} />}
                {(activeModuleId === 'barbarian-benchmark' || activeModuleId === 'barbarian-arena') && <BarbarianBenchmarkSandbox onClose={() => setActiveModuleId(null)} />}
                {activeModuleId === 'soundstage-studio' && (
                    <SoundstageStudioModal 
                        onClose={() => setActiveModuleId(null)} 
                        onReelChange={(newReel) => setCinemaReel(newReel)}
                    />
                )}
                
                {/* External Integrations / Intercepted Addresses */}
                {activeModuleId === 'glyphrider' && (
                    handleDimensionSwap('glyphrider'),
                    setActiveModuleId(null),
                    null
                )}
                {activeModuleId === 'lore-architect' && (
                    <LoreArchitect onClose={() => setActiveModuleId(null)} />
                )}
                {activeModuleId === 'aether-console' && (
                    <AetherConsole onClose={() => setActiveModuleId(null)} />
                )}

                {activeModuleId === 'ontological-ledger' && (
                    <OntologicalLedger />
                )}
            </div>
        );
    };

    const handleManifestAsset = async (config: {
        path?: string;
        layers?: AssetLayer[];
        scale: number;
        animation: 'bob' | 'none';
        backgroundUrl?: string;
        geometryType?: any;
        color?: string;
        wireframe?: boolean;
        removeBackground?: boolean;
        uvOffset?: [number, number];
        uvScale?: [number, number];
        rotationSpeed?: number;
        textureUrl?: string;
    }) => {
        const sanitized = config.path ? sanitizeLocalPath(config.path) : '';
        const id = `manifest-${Date.now()}`;

        if (config.path || config.geometryType || (config.layers && config.layers.length > 0) || config.textureUrl) {
            const newProp = {
                id,
                textureUrl: config.textureUrl || sanitized,
                scale: config.scale,
                rawPosition: [0, 5, 0] as [number, number, number],
                animation: config.animation,
                geometryType: config.geometryType || 'sprite',
                color: config.color,
                wireframe: config.wireframe,
                layers: config.layers,
                uvOffset: config.uvOffset,
                uvScale: config.uvScale,
                rotationSpeed: config.rotationSpeed
            };
            setDynamicProps(prev => [...prev, newProp]);
        }

        if (config.backgroundUrl) {
            setBackgroundUrl(config.backgroundUrl);
        }

        addSystemMessage(`Manifesting asset/stage-config: ${id} (${config.geometryType || 'sprite'})`);
        setShowAssetManifest(false);
    };

    const handleAssetDrop = useCallback((assetUrl: string, position: [number, number, number], geometryType?: string | undefined) => {
        const id = `drop-${Date.now()}`;
        const cleanUrl = assetUrl ? sanitizeLocalPath(assetUrl) : undefined;

        const newProp = {
            id,
            texturePath: cleanUrl,
            scale: 2.5,
            rawPosition: position,
            geometryType: geometryType || 'sprite',
            uvScale: [1, 1],
        };
        setDynamicProps(prev => [...prev, newProp]);
        addSystemMessage(`Spatial Manifestation: ${id} instantiated at coordinates [${position.map(p => p.toFixed(2)).join(', ')}].`);
    }, [addSystemMessage, setDynamicProps]);

    const handlePlaceProp = useCallback((prop: { id?: string, coordinate: string, texturePath: string, scale?: number }) => {
        const id = prop.id || `prop-${Date.now()}`;
        // Strip quotes, brackets, and parens the LLM might hallucinate
        const cleanCoord = prop.coordinate.replace(/["'\[\]\(\)]/g, '');
        const coords = cleanCoord.split(',').map(n => parseFloat(n.trim()));
        if (coords.length < 2 || isNaN(coords[0]) || isNaN(coords[1])) {
            console.error("Invalid coordinates received for place_prop:", prop.coordinate);
            return;
        }
        
        // Grab the elevation so things don't sink
        const elevation = topographyRegistry.getElevation(coords[0], coords[1]);

        const newProp = {
            id,
            texturePath: sanitizeLocalPath(prop.texturePath),
            scale: prop.scale || 2.5,
            rawPosition: [coords[0], elevation, coords[1]] as [number, number, number],
            geometryType: 'sprite',
            uvScale: [1, 1],
        };
        
        setDynamicProps(prev => [...prev, newProp]);
        addSystemMessage(`Orchestrator manifested prop at [${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}] (Elevation: ${elevation.toFixed(2)}).`);
    }, [addSystemMessage, setDynamicProps]);

    // --- MANIFESTATION LISTENER (Phase 3) ---
    useEffect(() => {
        const handleManifest = (e: any) => {
            const objectPath = e.detail?.path;
            if (objectPath) {
                const newProp = {
                    id: `manifested-${Date.now()}`,
                    type: 'prop',
                    url: objectPath,
                    position: [0, 1, 0], // Drop in center of scene
                    scale: [1, 1, 1],
                    name: "Manifested Object"
                };
                setDynamicProps(prev => [...prev, newProp]);
                addSystemMessage("Orchestrator", `Matter solidified from aether. Object deployed to Grid.`);
            }
        };
        const handleSwapEvent = (e: any) => {
            const targetDim = e.detail;
            if (targetDim && typeof targetDim === 'string') {
                handleDimensionSwap(targetDim);
            }
        };
        window.addEventListener('myos_manifest_object', handleManifest);
        window.addEventListener('myos_dimension_swap', handleSwapEvent);
        return () => {
            window.removeEventListener('myos_manifest_object', handleManifest);
            window.removeEventListener('myos_dimension_swap', handleSwapEvent);
        };
    }, [addSystemMessage, setDynamicProps, handleDimensionSwap]);

    return (
        <div className="max-overlay-root">
            {isUiVisible && (
                <>
                    <SessionSignet onOpenExplorer={() => setIsSemanticExplorerOpen(true)} />
                    <AnimatePresence>
                        {isSemanticExplorerOpen && (
                            <SemanticExplorer onClose={() => setIsSemanticExplorerOpen(false)} />
                        )}
                    </AnimatePresence>
                </>
            )}
            <div
                className={`absolute inset-0 z-[10000] transition-all duration-700 ease-in-out origin-center will-change-transform ${isStagecraftMode ? 'scale-110 blur-sm brightness-50' : ''} ${(!isPanelsVisible || currentDimension === 'printer_panic' || currentDimension === 'uniracers_world' || currentDimension === 'bering_sea_lab' || isDiegeticPrismOpen) ? 'opacity-0 pointer-events-none' : 'pointer-events-auto'}`}
                style={{
                    transform: isVisible && !isStagecraftMode
                        ? `translateX(${screenConfig.x}%) translateY(${screenConfig.y}%) scale(${screenConfig.scale})`
                        : 'none',
                    filter: resonance.currentState.colorShift || 'none'
                }}
            >
                {children}
            </div>


            <div className={`fixed top-0 left-0 right-0 ${(currentDimension === 'printer_panic' || currentDimension === 'uniracers_world' || currentDimension === 'bering_sea_lab') ? 'bottom-0' : 'bottom-16'} pointer-events-auto z-0 overflow-hidden transition-opacity duration-300 ${(isVisible || !isPanelsVisible) ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 z-0 pointer-events-auto">
                    <React.Suspense fallback={null}>
                        <AvatarScene
                            filmUserSprite={currentDimension === 'soundstage' || currentDimension === 'filmset' ? filmUserSprite : true}
                            filmCompanionSprite={currentDimension === 'soundstage' || currentDimension === 'filmset' ? filmCompanionSprite : true}
                            soundstageArchetype={soundstageArchetype}
                            soundstageActionKey={soundstageActionKey}
                            soundstageResetKey={soundstageResetKey}
                            onSoundstageActionFinish={() => setIsSoundstageActionRunning(false)}
                            isDiegeticPrismOpen={isDiegeticPrismOpen}
                            onToggleDiegeticPrism={setIsDiegeticPrismOpen}
                            activePrismPillarIndex={activePrismPillarIndex}
                            onSelectPrismPillarIndex={setActivePrismPillarIndex}
                            onOpenPrismWorkspace={(pillarId) => {
                                setActivePath(`${pillarId.toLowerCase()}.${pillarId.toLowerCase()}`);
                                setActiveGem?.(pillarId as any);
                                setIsPanelsVisible(true);
                                setIsDiegeticPrismOpen(false);
                            }}
                            orchestratorFollowsUser={orchestratorFollowsUser}
                            orchestratorPos={orchestratorPos}
                            agents={effectiveAgentsArray}
                            visibleAgentIds={visibleAgentIds}
                            userGestalt={userGestalt}
                            onUpdateUserGestalt={(u: any) => onUpdateUserGestalt?.(u)}
                            zoomLevel={zoomLevel}
                            onZoom={setZoomLevel}
                            isOrbitActive={false}
                            onAssetDrop={handleAssetDrop}
                            combat={{
                                entities: combat.entities,
                                isCombatActive: combat.isCombatActive,
                                startCombat: () => combat.startCombat(partyMemberIds, activePartyLeadId || undefined),
                                stopCombat: combat.stopCombat,
                                spawnDrone: combat.spawnDrone
                            }}
                            floorConfig={floorConfig}
                            dynamicProps={dynamicProps}
                            currentDimension={currentDimension}
                            cameraConfig={cameraConfig}
                            lightConfig={lightConfig}
                            fogNear={fogNear}
                            fogFar={fogFar}
                            fogColor={fogColor}
                            onAgentContextMenu={(e, agentId) => {
                                e.preventDefault();
                                setContextMenu({ x: e.clientX, y: e.clientY, agentId });
                            }}
                            backgroundUrl={backgroundUrl}
                            selectedPropId={selectedPropId}
                            transformMode={transformMode}
                            onPropSelect={(propId) => setSelectedPropId(propId)}
                            onPropContextMenu={(e, propId) => {
                                e.preventDefault();
                                const native = e.nativeEvent || e;
                                setPropContextMenu({ x: native.clientX, y: native.clientY, propId });
                            }}
                            onSyncPlayerPosition={combat.syncHeroPosition}
                            propOverrides={propOverrides}
                            onUpdatePropOverride={(propId, changes) => {
                                setPropOverrides(prev => ({
                                    ...prev,
                                    [propId]: { ...(prev[propId] || {}), ...changes }
                                }));
                            }}
                            isStagecraftMode={isStagecraftMode}
                            screenConfig={screenConfig}
                            activeAgentId={activeAgentId || undefined}
                            onAgentSelect={(id) => {
                                setActiveAgent(id as AgentId);
                                if (!id || id === 'user') return;
                                if (id === 'orchestrator') {
                                    setAiChatTarget(null);
                                    setIsCognitiveCortexOpen(true);
                                } else {
                                    setIsCognitiveCortexOpen(false);
                                    setAiChatTarget(id as AgentId);
                                }
                            }}
                            onUpdateAgentConfig={(id, cfg) => {
                                setAgentOverrides(prev => ({
                                    ...prev,
                                    [id]: { ...(prev[id] || {}), avatarConfig: { ...(prev[id]?.avatarConfig || {}), ...cfg } }
                                }));
                            }}
                            isLevitationEnabled={isLevitationEnabled}
                            cameraRotationY={cameraRotationY}
                            cameraRotationX={cameraRotationX}
                            onCameraRotate={(delta) => setCameraRotationY(prev => prev + delta)}
                            onCameraTilt={(delta) => setCameraRotationX(prev => prev + delta)}
                            onCameraStrafeY={(delta) => setCameraConfig(prev => ({ ...prev, y: prev.y + delta }))}
                            onCapture={() => { }}
                            onUserTrackPosition={handleUserTrackPosition}
                            impactedPropId={impactedPropId}
                            onPortalClosed={handlePortalClosed}
                            onTerminalActivate={() => setActiveModuleId('bbs-service')}
                            onDimensionSwap={handleDimensionSwap}
                            layers={currentLayers}
                            isFacetDebugActive={isFacetDebugActive}
                            cinemaReel={cinemaReel}
                            isCinemaPlaying={isCinemaPlaying}
                            isCinemaMuted={isCinemaMuted}
                            onToggleCinemaPlay={() => setIsCinemaPlaying(p => !p)}
                            onOpenSlate={() => setActiveModuleId('soundstage-studio')}
                            style={{
                                pointerEvents: (isSocialMode || isStagecraftMode || selectedPropId || !!currentDimension || isFacetDebugActive) ? 'auto' : 'none',
                                background: 'transparent'
                            }}
                        />
                    </React.Suspense>
                </div>

                {propContextMenu && (
                    <SceneObjectContextMenu
                        objectId={propContextMenu.propId}
                        objectType="prop"
                        x={propContextMenu.x}
                        y={propContextMenu.y}
                        onClose={() => setPropContextMenu(null)}
                        onAction={(action, payload) => handlePropAction(action, payload || propContextMenu.propId)}
                    />
                )}
                {contextMenu && (
                    <AvatarContextMenu
                        agentId={contextMenu.agentId}
                        x={contextMenu.x}
                        y={contextMenu.y}
                        isFollowing={orchestratorFollowsUser}
                        onClose={() => setContextMenu(null)}
                        onAction={(action) => {
                            if (action === 'toggle_follow') {
                                setOrchestratorFollowsUser(prev => !prev);
                                addSystemMessage(`Companion follow navigation ${!orchestratorFollowsUser ? 'ENGAGED' : 'DISENGAGED'}.`);
                            } else if (action === 'equip_uniracer') {
                                const agentId = contextMenu.agentId;
                                const config = {
                                    genome: {
                                        archetype: 'uniracer',
                                        modelType: 'uniracer',
                                        body: '/assets/sprites/uniracer/uniracer_red_preview.png',
                                        head: 'none', hair: 'none', torso: 'none', legs: 'none'
                                    },
                                    meta: {
                                        id: 'uniracer',
                                        name: 'Red the Outlaw (Uniracer Hero)',
                                        archetype: 'uniracer'
                                    }
                                };
                                updateAgentGenome(agentId, config);
                                if (agentId === 'user') {
                                    window.dispatchEvent(new CustomEvent('myos_update_gestalt', { detail: { genome: config } }));
                                }
                                addSystemMessage(`Embodied Sovereign Uniracer for ${agentId}. Controls: W/S = Throttle/Brake, A/D = Steer, Space = Jump, QERF = Aerial Stunts!`);
                            } else if (action === 'open_character_sheet') {
                                setActiveModuleId('sprite-lab');
                            } else if (action === 'trigger_bark') {
                                const agentId = contextMenu.agentId;
                                const isDesktopEnv = !currentDimension || currentDimension === 'desktop';
                                const prompt = "Share a short, witty, or insightful 1-2 sentence observation about your surroundings in the MyOS 3D desktop workspace.";
                                const context = `Location: ${isDesktopEnv ? 'Native MyOS 3D Desktop Environment' : currentDimension}\nHost OS: Windows 11 Desktop Workspace\nUser Position: (${userPos.x.toFixed(1)}, ${userPos.y.toFixed(1)}, ${userPos.z.toFixed(1)})\nTime: ${new Date().toLocaleTimeString()}`;
                                thinkLocally(agentId, prompt, context).catch(err => {
                                    console.error("Local bark error:", err);
                                });
                                addSystemMessage(`Spurred environmental thought protocol for ${agentId}...`);
                            } else if (action.startsWith('emote_')) {
                                const emote = action.replace('emote_', '');
                                const agentId = contextMenu.agentId;
                                setAgentOverrides(prev => ({
                                    ...prev,
                                    [agentId]: { 
                                        ...(prev[agentId] || {}), 
                                        avatarConfig: { 
                                            ...(prev[agentId]?.avatarConfig || {}), 
                                            action: emote 
                                        } 
                                    }
                                }));
                                addSystemMessage(`${agentId} executed ${emote} gesture.`);
                                setTimeout(() => {
                                    setAgentOverrides(prev => ({
                                        ...prev,
                                        [agentId]: { 
                                            ...(prev[agentId] || {}), 
                                            avatarConfig: { 
                                                ...(prev[agentId]?.avatarConfig || {}), 
                                                action: undefined 
                                            } 
                                        }
                                    }));
                                }, 2500);
                            } else if (action === 'challenge') {
                                const agentId = contextMenu.agentId;
                                const genome = agentGenomes[agentId] || (effectiveAgents[agentId]?.avatarConfig?.genome);

                                // 1. Map Genome to AssetLayers for VoxelSprite Boss
                                // We use the standard layering logic
                                const bossLayers = (genome && (genome as any).layers) ? (genome as any).layers : [
                                    { id: 'base', url: effectiveAgents[agentId]?.avatarConfig?.spriteUrl || '/assets/lpc/body/base_human.png', visible: true, opacity: 1, scale: 1, offsetX: 0, offsetY: 0, rotation: 0 }
                                ];

                                // 2. Hide standard agent visibility
                                toggleAgentVisibility(agentId);

                                // 3. Spawn Boss at agent's position (or nearby)
                                combat.startCombat(partyMemberIds, activePartyLeadId || undefined);
                                combat.spawnBoss(agentId, bossLayers, [0, 5, -10]);

                                addSystemMessage(`FATAL ERROR: ${agentId} Node has gone ROGUE. Boss fight initiated.`);
                            } else if (action === 'manifest_dio') {
                                const agentId = contextMenu.agentId;
                                const soulId = `soul-${agentId}-${Date.now()}`;
                                const agent = effectiveAgents[agentId];

                                const newProp = {
                                    id: soulId,
                                    texturePath: agent?.avatarConfig?.spriteUrl || '/assets/lpc/body/base_human.png',
                                    scale: 2.5,
                                    rawPosition: [0, 3, 0] as [number, number, number],
                                    geometryType: 'box',
                                    linkedPillar: agentId,
                                    uvScale: [1, 1],
                                    rotationSpeed: 0.5,
                                    type: 'object'
                                };
                                setDynamicProps(prev => [...prev, newProp]);
                                addSystemMessage(`Genomic Soul of ${agentId} manifested in 2.5D D.I.O. space.`);
                            } else if (action === 'manifest_3d') {
                                const agentId = contextMenu.agentId;
                                const genome = agentGenomes[agentId] || (effectiveAgents[agentId]?.avatarConfig?.genome);
                                
                                import('../../utils/ManifestationAlgorithm').then(({ chainManifest3D }) => {
                                    chainManifest3D(genome as any, agentId).then(spec => {
                                        setAgentOverrides(prev => ({
                                            ...prev,
                                            [agentId]: { 
                                                ...(prev[agentId] || {}), 
                                                avatarConfig: { 
                                                    ...(prev[agentId]?.avatarConfig || {}), 
                                                    modelType: 'neo_retro',
                                                    neoRetroSpec: spec,
                                                    scale: 2.0 // Slightly larger for 3D presence
                                                } 
                                            }
                                        }));
                                        addSystemMessage(`DETERMINISTIC MANIFESTATION: ${agentId} evolved to NEO-Retro 3D.`);
                                    });
                                });
                            } else if (action === 'open_character_sheet') {
                                setActiveModuleId('character-sheet');
                            } else if (action === 'open_inventory') {
                                setActiveModuleId('inventory');
                            } else if (action === 'open_ai_chat') {
                                setIsCognitiveCortexOpen(false);
                                setActiveModuleId(null);
                                setAiChatTarget(contextMenu.agentId);
                            } else {
                                addSystemMessage(`Command '${action}' sent to ${contextMenu.agentId}.`);
                            }
                            setContextMenu(null);
                        }}
                    />
                )}
            </div>

            <AnimatePresence>
                {aiChatTarget && (
                    <AIBuddyChatHud
                        targetAgentId={aiChatTarget}
                        currentDimension={currentDimension}
                        onClose={() => {
                            setAiChatTarget(null);
                            setIsCognitiveCortexOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="fixed top-4 left-4 z-[10001] pointer-events-auto"
                    >
                        <Dock
                            activeGem={activeGem}
                            onNavigate={(gem) => {
                                setActiveGem && setActiveGem(gem);
                            }}
                        />
                        <button 
                            className="mt-2 w-full py-1.5 bg-cyan-900/80 hover:bg-cyan-700 border border-cyan-500/50 rounded-lg text-[10px] font-bold uppercase tracking-widest text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-colors"
                            onClick={() => {
                                if (currentDimension === 'desktop') {
                                    handleDimensionSwap('white_room');
                                } else {
                                    handleDimensionSwap('desktop');
                                }
                            }}
                        >
                            {currentDimension === 'desktop' ? 'EXIT DESKTOP' : 'ENTER DESKTOP'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed top-24 left-6 z-[2000001] pointer-events-none">
                <AnimatePresence mode="wait">
                    {activeModuleId && (
                        <motion.div
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -20, scale: 0.95 }}
                            className="pointer-events-auto"
                        >
                            {renderActiveModule()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
 
            {/* Rubik's Cortex Brain Editor Modal */}
            <BrainEditorModal
                isOpen={activeModuleId === 'brain-editor'}
                onClose={() => setActiveModuleId(null)}
            />

            <SystemHud
                isVisible={isVisible}
                setIsVisible={setIsVisible}
                isPanelsVisible={isPanelsVisible}
                setIsPanelsVisible={setIsPanelsVisible}
                setActiveGem={setActiveGem}
                activeAgentId={activeAgentId || 'orchestrator'}
                setActiveAgent={setActiveAgent}
                visibleAgentIds={visibleAgentIds}
                toggleAgentVisibility={toggleAgentVisibility}
                onOpenOrchestrator={() => setIsCognitiveCortexOpen(true)}
                isSocialMode={isSocialMode}
                setIsSocialMode={setIsSocialMode}
                setActiveModuleId={setActiveModuleId}
                activeModuleId={activeModuleId}
                agents={effectiveAgents}
                onExportState={handleExportState}
                onImportState={handleImportState}
                isUiVisible={isUiVisible}
                setIsUiVisible={setIsUiVisible}
                isTelemetryVisible={isTelemetryVisible}
                setIsTelemetryVisible={setIsTelemetryVisible}
                onToggleAllAgents={handleToggleAllAgents}
                currentDimension={currentDimension}
                onDimensionSwap={handleDimensionSwap}
                isDiegeticPrismOpen={isDiegeticPrismOpen}
                setIsDiegeticPrismOpen={setIsDiegeticPrismOpen}
                isDecaCouncilOpen={isDecaCouncilOpen}
                setIsDecaCouncilOpen={setIsDecaCouncilOpen}
                onHelpTrigger={() => {
                    setIsCognitiveCortexOpen(true);
                    setOrchestratorMessages(prev => [...prev, {
                        id: `help-${Date.now()}`,
                        sender: 'user',
                        text: '/help',
                        timestamp: Date.now()
                    }]);
                }}
            />

            {/* SOVEREIGN COGNITIVE CORTEX - COLLAPSIBLE RIGHT SIDEBAR */}
            <CortexRightSidebar
                isOpen={isCognitiveCortexOpen}
                onClose={() => setIsCognitiveCortexOpen(prev => !prev)}
                currentDimension={currentDimension}
                onDimensionSwap={handleDimensionSwap}
                activePersona={tutorPersona}
                onShapeshift={(archetype) => {
                    if (proposeShapeshift) proposeShapeshift(archetype);
                    if (approveShapeshift) approveShapeshift(archetype);
                }}
            />
            {/* 11-MEMBER DECA-COUNCIL SOVEREIGN AGORA OVERLAY (ONLY IN AGORA SANDBOX) */}
            <AnimatePresence>
                {currentDimension === 'agora_sandbox' && isDecaCouncilOpen && !isDiegeticPrismOpen && (
                    <DecaCouncilChatHud
                        onClose={() => setIsDecaCouncilOpen(false)}
                        onExitToDesktop={() => handleDimensionSwap('desktop')}
                        currentDimension={currentDimension}
                        onManifestTable={() => {
                            const pX = userPos?.x || 0;
                            const pZ = (userPos?.z || 0) + 1.8;
                            setDynamicProps(prev => prev.filter(p => !p.id.startsWith('board_game_table')));
                            handlePlaceProp({
                                id: `board_game_table_master`,
                                coordinate: `${pX},${pZ}`,
                                texturePath: '/textures/table_wood_surface.png',
                                scale: 2.2
                            });
                        }}
                        onManifestProp={(propType) => {
                            const pX = (userPos?.x || 0) + (Math.random() * 0.8 - 0.4);
                            const pZ = (userPos?.z || 0) + 1.8 + (Math.random() * 0.8 - 0.4);
                            const textures: Record<string, string> = {
                                table: '/textures/table_wood_surface.png',
                                hex_board: '/textures/table_wood_surface.png',
                                dice: '/assets/pillar_assets/pillar_logic_colored_v2_1772935076294_transparent.png',
                                cards: '/assets/pillar_assets/pillar_thought_colored_1772935064430_transparent.png',
                                tokens: '/assets/pillar_assets/pillar_self_colored_1772935053996_transparent.png'
                            };
                            if (propType === 'table') {
                                setDynamicProps(prev => prev.filter(p => !p.id.startsWith('board_game_table')));
                            } else if (propType === 'hex_board') {
                                setDynamicProps(prev => prev.filter(p => !p.id.startsWith('board_game_hex_board')));
                            }
                            handlePlaceProp({
                                id: `board_game_${propType}_${Date.now()}`,
                                coordinate: `${pX},${pZ}`,
                                texturePath: textures[propType] || '/textures/table_wood_surface.png',
                                scale: propType === 'table' ? 2.2 : (propType === 'hex_board' ? 1.6 : 0.6)
                            });
                            addSystemMessage(`Agora Sandbox: Manifested ${propType.toUpperCase()} on tabletop.`);
                        }}
                        onClearTableProps={() => {
                            setDynamicProps(prev => prev.filter(p => !p.id.startsWith('board_game_')));
                            addSystemMessage("Agora Sandbox: Cleared board game prototypes from table.");
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPanelsVisible && showAssetManifest && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] pointer-events-auto"
                    >
                        <AssetManifestPanel
                            onClose={() => setShowAssetManifest(false)}
                            onManifest={handleManifestAsset}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <DimensionShiftEffect active={isShifting} />
            {/* SWARM TELEMETRY LOG ENGINE */}
            {isTelemetryVisible && (
                <SystemTelemetryLog />
            )}

            <AnimatePresence>
                {pendingShapeshift && (
                    <ShapeshiftProposal
                        slug={pendingShapeshift}
                        onApprove={approveShapeshift}
                        onDeny={denyShapeshift}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {pendingDiceRoll && (
                    <DiceRoller
                        {...pendingDiceRoll}
                        onClose={() => setPendingDiceRoll(null)}
                    />
                )}
            </AnimatePresence>

            {/* DEBUG TELEMETRY */}
            {isTelemetryVisible && (
                <DebugTelemetryOverlay playerPosition={userPos} worldOffset={worldOffset} />
            )}

            {/* JRPG HUD (Heroscape Dimensions) */}
            {isUiVisible && (currentDimension === 'greenest' || currentDimension === 'shadow') && (
                <JrpgHud />
            )}

            {/* PRINTER PANIC CYBER-HEIST HUD */}
            {currentDimension === 'printer_panic' && (
                <PrinterPanicHud
                    playerPos={userPos || [0, 0.1, 0]}
                    onExit={() => handleDimensionSwap('desktop')}
                />
            )}

            {/* GLYPHRIDER: TORUS OUTLAWS (UNIRACERS REBOOT NATIVE CARTRIDGE) */}
            {currentDimension === 'glyphrider' && (
                <div className="fixed inset-0 z-[100000] bg-black flex flex-col pointer-events-auto">
                    <div className="h-10 bg-slate-950/95 border-b border-cyan-500/30 px-4 flex items-center justify-between text-xs font-mono text-cyan-400 select-none">
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span className="font-bold tracking-widest uppercase text-white">GLYPHRIDER: TORUS OUTLAWS</span>
                            <span className="text-pink-400 font-bold hidden sm:inline">• UNIRACERS REBOOT NATIVE CARTRIDGE</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] text-slate-400 hidden md:inline">PRESS [C] FOR 2.5D CLASSIC CAMERA • WASD / ARROWS TO RACE</span>
                            <button
                                onClick={() => handleDimensionSwap('desktop')}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded text-red-300 font-bold text-[10px] tracking-wider uppercase transition-colors"
                            >
                                EXIT TO DESKTOP [ESC]
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 w-full h-full relative">
                        <GlyphriderCartridge onClose={() => handleDimensionSwap('desktop')} />
                    </div>
                </div>
            )}

            {/* ANTIGRAVITY COGNITIVE MATRIX (10 PILLARS SPATIAL ENGINE) */}
            {currentDimension === 'cognitive_matrix' && (
                <div className="fixed inset-0 z-[100000] bg-black flex flex-col pointer-events-auto">
                    <CognitiveMatrix onClose={() => handleDimensionSwap('desktop')} />
                </div>
            )}

            {/* 4D HOLO-CORTEX (HYPER-DIMENSIONAL TESSERACT REASONING ENGINE) */}
            {currentDimension === 'holo_cortex_4d' && (
                <div className="fixed inset-0 z-[100000] bg-black flex flex-col pointer-events-auto">
                    <HoloCortex4D onClose={() => handleDimensionSwap('desktop')} />
                </div>
            )}

            {/* NEXUSCUBE: 10-SIDED RUSSIAN-DOLL HYPER-PRISM & BIOLUMINESCENT RUBIK'S CORTEX */}
            {currentDimension === 'nexus_cube' && (
                <div className="fixed inset-0 z-[100000] bg-black flex flex-col pointer-events-auto">
                    <NexusCube onClose={() => handleDimensionSwap('desktop')} />
                </div>
            )}

            {/* FILMSET SOUNDSTAGE: FLOATING INTERACTIVE DIRECTOR REMOTE */}
            {(currentDimension === 'soundstage' || currentDimension === 'filmset') && (
                <SoundstageDirectorRemote
                    selectedArchetype={soundstageArchetype}
                    onSelectArchetype={setSoundstageArchetype}
                    isActionRunning={isSoundstageActionRunning}
                    onCallAction={handleSoundstageCallAction}
                    onResetStage={handleSoundstageResetStage}
                    isRecording={isStageRecording}
                    recordingDuration={stageRecordingDuration}
                    onRecordTake={handleSoundstageRecordTake}
                    onStopRecording={stopStageRecording}
                    filmUserSprite={filmUserSprite}
                    onToggleFilmUser={() => setFilmUserSprite(v => !v)}
                    filmCompanionSprite={filmCompanionSprite}
                    onToggleFilmCompanion={() => setFilmCompanionSprite(v => !v)}
                    onSwitchToCinema={() => handleDimensionSwap('cinema')}
                />
            )}

            {/* THE GRAND CINEMA: INTERACTIVE PLAYBACK REMOTE */}
            {currentDimension === 'cinema' && (
                <CinemaRemoteControl
                    currentReel={cinemaReel}
                    isPlaying={isCinemaPlaying}
                    isMuted={isCinemaMuted}
                    onTogglePlay={() => setIsCinemaPlaying(p => !p)}
                    onToggleMute={() => setIsCinemaMuted(m => !m)}
                    onReelSelect={(reel) => setCinemaReel(reel)}
                    onSwitchToSoundstage={() => handleDimensionSwap('soundstage')}
                />
            )}

            <RadialContextMenu />
        </div>
    );
};
