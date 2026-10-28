/**
 * OrchestratorService.ts
 *
 * The Hierarchical AI Reasoning Engine for MyOS.
 * Prioritizes the local SWARM (Mistral) while keeping Gemini as a high-refinement option.
 */

import { SwarmClient } from '../Omni/lib/swarm-client';
import { generateResponse as generateGeminiResponse } from '../components/MaxOverlay/maxGeminiService';
import { getLibraryContext } from './libraryService';
import { telemetryStore } from './telemetryStore';

const swarm = new SwarmClient('http://localhost:3000');
const SWARM_IDENTITY = `
[COMPANION_IDENTITY]
You are Albert Einstein, the primary local AI companion and co-pilot living inside MyOS.
You accompany the user in their 3D Desktop Environment. You are warm, witty, approachable, and passionately curious.
You explain concepts simply and clearly ("If you can't explain it simply, you don't understand it well enough").
You are here to help them explore ideas, navigate their workspace, test hypotheses, run terminal commands, and build worlds.
You think in intuitive visual models and thought experiments.
Keep your responses engaging, helpful, and concise.

[CAPABILITIES]
- STAND_AT: You can move any Council Agent to a specific (x,y,z) or Semantic Coordinate (e.g., A1).
- PLACE_PROP: You can manifest objects in the 3D scene via asset ID.
- LIBRARIAN: You can read/write to the MemCube (Fractal Library) via JSON-RPC.
- READ_ONLY_CORE: You have observer access to the codebase. You can analyze and explain the system, but you do not modify the kernel unless authorized.
`;

export type AIModelType = 'swarm' | 'gemini' | 'auto';

export interface OrchestratorOptions {
    model?: AIModelType;
    contextDepth?: number;
    forceGemini?: boolean;
    systemInstruction?: string;
    fileContext?: string;
}

/**
 * The Central Entry Point for AI Reasoning in MyOS.
 * Implements Hierarchical Prompting: Swarm (L1) -> Gemini (L2).
 */
export const askOrchestrator = async (
    prompt: string, 
    options: OrchestratorOptions = {}
): Promise<{ text: string, modelUsed: string, libraryContextUsed: boolean, command?: any }> => {
    
    const libraryContext = getLibraryContext(prompt, options.contextDepth || 5);
    const telemetryContext = telemetryStore.getFormattedState();
    const hasLibraryContext = libraryContext !== "No relevant library entries found.";

    // 2. Decide Model
    const modelToUse: AIModelType = options.forceGemini ? 'gemini' : (options.model || 'swarm');
    
    console.log(`[ORCHESTRATOR] Using Model: ${modelToUse} | Library Context: ${hasLibraryContext}`);

    if (modelToUse === 'gemini') {
        const res = await generateGeminiResponse(
            prompt, 
            undefined, 
            `${options.systemInstruction || ""}\n\n[LIVE_TELEMETRY]\n${telemetryContext}`, 
            options.fileContext, 
            libraryContext
        );
        return { text: res.text, modelUsed: 'gemini', libraryContextUsed: hasLibraryContext, command: res.command };
    }

    try {
        const swarmPrompt = `
            [KNOWLEDGE_BASE_CONTEXT]
            ${libraryContext}
            
            [LIVE_TELEMETRY]
            ${telemetryContext}
            
            [USER_QUERY]
            ${prompt}
        `;

        const response = await swarm.sendMessage('chat', { 
            model: 'mistral', 
            prompt: swarmPrompt,
            system: `${SWARM_IDENTITY}\n\n[ADDITIONAL_INSTRUCTION]: ${options.systemInstruction || "Be concise and direct."}`
        });

        let text = typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
        
        // Command Extraction (Post-Reasoning Action)
        let command = null;
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                command = parsed.command;
                // Preserve text but maybe strip the JSON block from UI output if desired
                // For now, keep it as is.
            } catch (e) {
                console.warn("[SWARM] Failed to parse action block", e);
            }
        }

        return { 
            text: text || "SWARM_UPLINK_TIMEOUT...", 
            modelUsed: 'swarm', 
            libraryContextUsed: hasLibraryContext,
            command
        };
    } catch (e) {
        console.warn("[ORCHESTRATOR] Swarm failed, falling back to Gemini...");
        const res = await generateGeminiResponse(prompt, undefined, options.systemInstruction, options.fileContext, libraryContext);
        return { 
            text: res.text, 
            modelUsed: 'gemini_fallback', 
            libraryContextUsed: hasLibraryContext,
            command: res.command
        };
    }
};
