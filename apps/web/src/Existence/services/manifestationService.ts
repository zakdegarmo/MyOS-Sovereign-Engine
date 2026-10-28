import type { ManifestationState, ManifestationStep, ManifestationProgress, UserGestalt, LibraryNode, LoadingState, MooseManifest } from '@Omni/types';
import { generateGemResponse } from '@Thought/services/geminiService';
import { moosePageService } from './moosePageService';

import holodeckLibrary from '@Omni/lib/holodeck_library.json';

// The "Single Shot" Factory - No more linear theatre.
// V3: Now with Meshy AI Generation
class ManifestationService {
    private state: ManifestationState | null = null;
    private subscribers: ((state: ManifestationState | null) => void)[] = [];

    constructor() {
        const saved = localStorage.getItem('mystra_manifestation_state');
        if (saved) {
            try { this.state = JSON.parse(saved); } catch (e) { }
        }
    }

    getState() { return this.state; }

    subscribe(callback: (state: ManifestationState | null) => void) {
        this.subscribers.push(callback);
        callback(this.state);
        return () => { this.subscribers = this.subscribers.filter(s => s !== callback); };
    }

    private notify() {
        localStorage.setItem('mystra_manifestation_state', JSON.stringify(this.state));
        this.subscribers.forEach(s => s(this.state));
    }

    // THE ALGORITHM (Stochastic Procedural Manifestation Engine)
    async startManifestation(intent: string, userGestalt: UserGestalt, library: LibraryNode | null, onLog: (msg: string) => void) {
        if (!onLog) onLog = console.log; // Fallback

        console.log("SPME: Starting generation for:", intent);

        const manifestationId = Date.now().toString();
        this.state = {
            id: manifestationId,
            intent,
            steps: {} as any, // Legacy field
            currentStep: 'transcendence', // Jump straight to the end
            manifest: moosePageService.createInitialManifest(manifestationId, intent),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.notify();

        try {
            // STEP 1: SEMANTIC DECOMPOSITION (Thought Agent)
            onLog("Thought Agent: Decomposing Intent...");
            const analysisPrompt = `
                Analyze the user's intent: "${intent}".
                Extract the following parameters in JSON format:
                {
                    "theme": "SciFi" | "Nature" | "Void" | "Industrial" | "Library",
                    "mood": "Calm" | "Energetic" | "Dark" | "Ethereal",
                    "dominantShape": "Cube" | "Sphere" | "Torus" | "Tetrahedron" | "Model",
                    "complexity": 0.1 to 1.0 (float),
                    "keywords": ["tag1", "tag2"]
                }
            `;
            const analysisRes = await generateGemResponse('Thought', [], analysisPrompt, userGestalt, library, { location: { currentInterface: 'existence', activeTab: 'main' } } as any, () => { });
            const analysis = this.parseJSON(analysisRes.text) || { theme: 'Void', mood: 'Dark', dominantShape: 'Cube', complexity: 0.5, keywords: [] };

            onLog(`Detected Theme: ${analysis.theme} | Mood: ${analysis.mood}`);

            // STEP 2: ASSET RETRIEVAL (The Holodeck)
            onLog("Transcendence Agent: Querying Holodeck Library...");
            // Simple keyword matching against our JSON library
            const availableAssets = holodeckLibrary.map(item => ({ id: item.id, tags: item.tags, url: item.url }));
            const matchedAssets = availableAssets.filter(asset =>
                asset.tags.some(tag => analysis.keywords.includes(tag) || intent.toLowerCase().includes(tag))
            );

            if (matchedAssets.length > 0) {
                onLog(`Found ${matchedAssets.length} matching asset(s) in Holodeck: ${matchedAssets.map(a => a.id).join(', ')}`);
            } else {
                onLog("No assets found. Using procedural attributes.");
            }


            // STEP 3: STOCHASTIC ASSEMBLY (Logic Agent / Procedural)
            onLog("Logic Agent: Configuring Scene Graph...");

            const manifestPrompt = `
                generate a MOOSE Manifest JSON for a 3D scene.
                Theme: ${analysis.theme}
                Mood: ${analysis.mood}
                Dominant Shape: ${analysis.dominantShape}
                Complexity: ${analysis.complexity}
                Available External Assets (GLTF): ${JSON.stringify(matchedAssets)}

                Return ONLY the JSON matching this structure:
                {
                    "title": "Title of Space",
                    "description": "Short description",
                    "roomConfig": {
                        "wallColor": "hex string",
                        "floorColor": "hex string",
                        "skybox": "sunset" | "night" | "grid" | "fog",
                        "gridVisible": boolean,
                        "fogColor": "hex string",
                        "fogDensity": 0 to 100
                    },
                    "sceneObjects": [
                        { 
                          "id": "1", 
                          "type": "cube" | "sphere" | "cone" | "model", 
                          "url": "full_glb_url_if_type_is_model",
                          "position": [0, 1, 0], 
                          "scale": [1, 1, 1], 
                          "color": "hex (if primitive)", 
                          "emissive": boolean, 
                          "animation": "rotate" | "float" | "pulse" 
                        }
                    ]
                }
                If matched assets are present, prefer using them with type="model" and use the exact URL provided.
                Generate using ${Math.floor(analysis.complexity * 10) + 3} objects.
            `;

            const manifestRes = await generateGemResponse('Logic', [], manifestPrompt, userGestalt, library, { location: { currentInterface: 'transcendence', activeTab: 'main' } } as any, () => { });
            const generatedData = this.parseJSON(manifestRes.text);

            if (generatedData) {
                // Merge into State
                this.state.manifest = {
                    ...this.state.manifest,
                    title: generatedData.title || intent,
                    description: generatedData.description || "Procedurally generated space.",
                    roomConfig: { ...this.state.manifest.roomConfig, ...generatedData.roomConfig },
                    sceneObjects: generatedData.sceneObjects || []
                };

                // Commit to Registry
                moosePageService.registerPage(this.state.manifest);
                onLog("Manifestation Complete. Warping available.");

                this.state.currentStep = 'omni'; // Done
                this.notify();
            } else {
                throw new Error("Failed to generate valid Manifest JSON.");
            }

        } catch (e: any) {
            console.error("Manifestation Failed:", e);
            onLog(`ERROR: ${e.message}`);
        }
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch (e) { return null; }
        return null;
    }

    reset() {
        this.state = null;
        localStorage.removeItem('mystra_manifestation_state');
        this.notify();
    }
}

export const manifestationService = new ManifestationService();
