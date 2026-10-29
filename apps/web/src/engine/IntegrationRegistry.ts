const AUDIT_REPORT: any[] = [];
import INSTALLED_APPS from './installed_apps.json';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';

/**
 * IntegrationRegistry.ts
 * 
 * Maps Semantic Symbol Paths to Integration Sandboxes.
 * The Path is the Address; the Content is the Stage.
 */

export interface IntegrationDefinition {
    id: string;
    name: string;
    path: string; // The Symbol Path (e.g., '🜄.🜄')
    type: 'iframe-web' | 'iframe-local' | 'vite-project' | 'react' | 'web-component';
    entryPoint: string;
    description: string;
    rationale?: string; // AI-generated rationale from audit
    forceDarkTheme?: boolean; // If true, applies a CSS invert + hue-rotate filter to iframe to simulate dark mode
}

const CORE_INTEGRATIONS: Record<string, IntegrationDefinition> = {
    // 🜄 (EXISTENCE) ROOT
    '🜄.🜔': { // Existence -> Logic (Obeys)
        id: 'glyphrider',
        name: 'Glyphrider Rail-Racer',
        path: '🜄.🜔',
        type: 'react',
        entryPoint: '@myos/glyphrider/App',
        description: 'Torus-Knot procedural rail racer for information traversal.'
    },
    '🜄.🜋': { // Existence -> Omni
        id: 'dnd-lore-app',
        name: 'Library of Intrigue (D&D Lore)',
        path: '🜄.🜋',
        type: 'react',
        entryPoint: 'HUDModules/DnDLoreApp',
        description: 'Isolated D&D Lore RAG querying Mistral.'
    },
    '🜄.☉': { // Existence -> Mastery (Actualizes)
        id: 'manifestation-chamber',
        name: 'Manifestation Chamber',
        path: '🜄.☉',
        type: 'react',
        entryPoint: 'HUDModules/ManifestationChamber',
        description: '3D Asset generation and manifestation bridge.'
    },
    '🜄.🜍.🜄': { // Existence -> Transcendence -> Existence
        id: 'test-sandbox',
        name: 'Isolated Test Sandbox',
        path: '🜄.🜍.🜄',
        type: 'react',
        entryPoint: 'MaxOverlay/IsolatedTestSandbox',
        description: 'Sterile 3D physics room for GLB drops and Bone Mapping.'
    },

    // ⚹ (SELF) ROOT - DEEP MANIFESTATIONS
    '⚹.🜄': { // Self -> Existence (Identity Manifests In)
        id: 'skeleton-builder',
        name: 'The Construct (Avatar Creator)',
        path: '⚹.🜄', 
        type: 'react',
        entryPoint: '../../integrations/skeleton-builder/App',
        description: 'AI-driven voxel mannequin creator driven by ontological intent.'
    },
    
    // ☿ (THOUGHT) ROOT
    '☿.♀': { // Thought -> Resonance (Articulates)
        id: 'maestro-studio',
        name: 'Maestro Studio (AI Orchestra)',
        path: '☿.♀',
        type: 'react',
        entryPoint: '../../integrations/maestro-studio/App',
        description: '128-step audio-reactive sequencer and AI orchestral conductor.'
    },
    '☿.⚹': { // Thought -> Self (Synthesizes Identity)
        id: 'max-companion',
        name: 'Max Headroom (AI Companion)',
        path: '☿.⚹',
        type: 'react',
        entryPoint: '../../integrations/max-companion/App',
        description: 'Live AI proxy companion with vision, stutter-TTS, and glitch-physics.'
    },
    '☿.🜔': { // Thought -> Logic (Utilizes Logic)
        id: 'repoman-habitat',
        name: 'RepoMan Habitat',
        path: '☿.🜔', 
        type: 'react',
        entryPoint: '../../integrations/repoman-habitat/App',
        description: '3D Project graph and code visualization habitat.'
    },

    // 🜏 (IMPROVEMENT) ROOT
    '🜏.🜔': { // Improvement -> Logic (Systematizes)
        id: 'b-movie-beatdown',
        name: 'B-Movie Beatdown',
        path: '🜏.🜔',
        type: 'iframe-local',
        entryPoint: 'b-movie-beatdown/index.html',
        description: 'Schlock-horror combat engine for data purging.'
    },
    '🜏.🜋': { // Improvement -> Omni
        id: 'software-installer',
        name: 'Software Installer (App Store)',
        path: '🜏.🜋',
        type: 'react',
        entryPoint: 'HUDModules/SoftwareInstaller',
        description: 'Download and integrate 3rd party packages into the OmniOS.'
    },
    
    // NEW MAPPED WEB & SYSTEM INTEGRATIONS
    '⚹.☿': { // Self -> Thought
        id: 'excalidraw',
        name: 'Excalidraw Whiteboard',
        path: '⚹.☿',
        type: 'iframe-web',
        entryPoint: 'https://excalidraw.com/?theme=dark',
        description: 'Infinite Canvas & Architecture Planning'
    },
    '⚹.🜔': { // Self -> Logic
        id: 'desmos',
        name: 'Desmos Graphing Engine',
        path: '⚹.🜔',
        type: 'iframe-web',
        entryPoint: 'https://www.desmos.com/calculator',
        description: 'Mathematical & Parametric Graphing'
    },
    '🜄.☿': { // Existence -> Thought
        id: 'zamn_bot_engine',
        name: 'ZAMN Bot HD-2D Engine',
        path: '🜄.☿',
        type: 'iframe-local',
        entryPoint: 'zamn_bot_engine.html',
        description: 'Survival Sandbox & Bot Logic'
    },
    '🜄.♀': { // Existence -> Resonance
        id: 'mystra_local_brain',
        name: 'Local Brain Topology',
        path: '🜄.♀',
        type: 'iframe-local',
        entryPoint: 'mystra_local_brain.html',
        description: 'Offline Neural Navigator'
    },
    '☿.🜏': { // Thought -> Improvement
        id: 'davinci-appsmasher',
        name: 'DaVinci AppSmasher V7',
        path: '☿.🜏',
        type: 'vite-project',
        entryPoint: 'davinci-appsmasher (7)', 
        description: 'Advanced Tool Fusion & React Prototyping'
    },
    '☿.☉': { // Thought -> Mastery
        id: 'morphos',
        name: 'Morphos',
        path: '☿.☉',
        type: 'vite-project',
        entryPoint: 'morphos',
        description: 'Shape/Form Transformation Engine'
    },

    // 🜋 (OMNI) ROOT
    '🜋.🜋': { // Omni -> Omni (Is Aspect Of)
        id: 'omni-lab',
        name: 'The OmniLab',
        path: '🜋.🜋',
        type: 'react',
        entryPoint: '../../integrations/omni-lab/OmniLab',
        description: 'The Ringmaster\'s FAFO sandbox for experimental cartridges.'
    },

    // ☉ (MASTERY) ROOT - NEW INTEGRATIONS
    '☉.🜔': { // Mastery -> Logic (Applies Perfected)
        id: 'hyperaetherpilgrim',
        name: 'HyperAetherPilgrim',
        path: '☉.🜔',
        type: 'iframe-local',
        entryPoint: 'HyperAetherPilgrim/index.html',
        description: 'Recursive Ontological Web Crawler & Aetheric Analyzer.'
    },

    // ⚹.🜄.🜋 (SELF.EXISTENCE.OMNI) - AETHER SCRAPER MINIGAME
    '⚹.🜄.🜋': {
        id: 'aether-scraper',
        name: 'Aether Scraper (Logic Test)',
        path: '⚹.🜄.🜋',
        type: 'react',
        entryPoint: '../../integrations/aether-scraper/App',
        description: 'Logic test for LPC interaction and semantic address retrieval.'
    },

    // --- MANIFESTED DECA-PILLAR CORE (Pillars 1-10) ---
    '⚹': { // SELF (Pillar 1)
        id: 'gestalt-mirror',
        name: 'Gestalt Mirror (P1: Self)',
        path: '⚹',
        type: 'react',
        entryPoint: 'HUDModules/GestaltMirror',
        description: 'Primary identity reflection and genome resonance monitor.'
    },
    '☿': { // THOUGHT (Pillar 2)
        id: 'thought-orchestrator',
        name: 'Thought Orchestrator (P2: Thought)',
        path: '☿',
        type: 'react',
        entryPoint: 'HUDModules/ThoughtOrchestrator',
        description: 'Recursive cognitive expansion and agent scheduling.'
    },
    '🜔': { // LOGIC (Pillar 3)
        id: 'logic-gate',
        name: 'Logic Gate 5.2.1 (P3: Logic)',
        path: '🜔',
        type: 'react',
        entryPoint: 'HUDModules/LogicGate',
        description: 'Axiomatic verification and structural grounding.'
    },
    '🝧': { // UNITY (Pillar 4)
        id: 'unity-interlink',
        name: 'Unity Interlink (P4: Unity)',
        path: '🝧',
        type: 'react',
        entryPoint: 'HUDModules/UnityInterlink',
        description: 'Social interlink and collaborative holographic protocols.'
    },
    '🜄': { // EXISTENCE (Pillar 5)
        id: 'existence-sensor',
        name: 'Existence Sensor (P5: Existence)',
        path: '🜄',
        type: 'react',
        entryPoint: 'HUDModules/EnvironmentControls',
        description: 'Environmental telemetry and physical manifest controls.'
    },
    '🜏': { // IMPROVEMENT (Pillar 6)
        id: 'improvement-vault',
        name: 'Improvement Vault (P6: Improvement)',
        path: '🜏',
        type: 'react',
        entryPoint: 'HUDModules/InventoryModule',
        description: 'Iterative asset optimization and inventory management.'
    },
    '☉': { // MASTERY (Pillar 7)
        id: 'mastery-consolidator',
        name: 'Mastery Consolidator (P7: Mastery)',
        path: '☉',
        type: 'react',
        entryPoint: 'HUDModules/MasteryConsolidator',
        description: 'Total domain actualization and achievement tracking.'
    },
    '♀': { // RESONANCE (Pillar 8)
        id: 'vibe-scanner',
        name: 'Vibe Scanner (P8: Resonance)',
        path: '♀',
        type: 'react',
        entryPoint: 'HUDModules/VibeScanner',
        description: 'Frequency alignment and semantic resonance detector.'
    },
    '🜍': { // TRANSCENDENCE (Pillar 9)
        id: 'paradigm-shifter',
        name: 'Paradigm Shifter (P9: Transcendence)',
        path: '🜍',
        type: 'react',
        entryPoint: 'HUDModules/ParadigmShifter',
        description: 'Reality warping and aesthetic frequency modulation.'
    },
    '🜋': { // OMNI (Pillar 10)
        id: 'aether-archive',
        name: 'Aether Archive (P10: Omni)',
        path: '🜋',
        type: 'react',
        entryPoint: 'HUDModules/AetherArchive',
        description: 'Infinite memory access and system-wide potential.'
    }
};


/**
 * 2. Recursive Registry Assembly
 * We start with Core apps and then "stack" audited apps deeper if collisions occur.
 */
const UNIFIED_REGISTRY: Record<string, IntegrationDefinition> = { ...CORE_INTEGRATIONS };

(AUDIT_REPORT as any[]).forEach(item => {
    if (item.sequence && item.sequence.length >= 2) {
        // Resolve symbols
        // Some sequences might be ['⚹', '🜄'] and some might be ['Self', 'Existence']
        const s1 = item.sequence[0].length > 1 ? (ID_TO_SYMBOL as any)[item.sequence[0]] : item.sequence[0];
        const s2 = item.sequence[1].length > 1 ? (ID_TO_SYMBOL as any)[item.sequence[1]] : item.sequence[1];
        
        if (!s1 || !s2) return;

        let targetPath = `${s1}.${s2}`;
        const rootSymbol = s1;

        // Recursive Stacking Logic: Push deeper if the slot is occupied
        // This creates "Ontological Time Tunnels" where related apps branch deeper
        while (UNIFIED_REGISTRY[targetPath]) {
            targetPath = `${targetPath}.${rootSymbol}`;
            if (targetPath.split('.').length > 10) break; // Hard ceiling at depth 10
        }

        UNIFIED_REGISTRY[targetPath] = {
            id: item.folder,
            name: item.suggested_name || item.folder,
            path: targetPath,
            type: 'iframe-local',
            entryPoint: `${item.folder}/index.html`,
            description: item.suggested_description || '',
            rationale: item.rationale
        };
    }
});

// Load dynamically installed apps
(INSTALLED_APPS as any[]).forEach(item => {
    if (item.path && !UNIFIED_REGISTRY[item.path]) {
        UNIFIED_REGISTRY[item.path] = {
            id: item.id,
            name: item.name,
            path: item.path,
            type: item.type || 'react',
            entryPoint: item.entryPoint,
            description: item.description || ''
        };
    }
});

export const INTEGRATION_REGISTRY = UNIFIED_REGISTRY;

/**
 * Helper to check if a semantic path has a registered integration.
 */
export const getIntegrationAtAddress = (symbolPath: string): IntegrationDefinition | null => {
    return INTEGRATION_REGISTRY[symbolPath] || null;
};
