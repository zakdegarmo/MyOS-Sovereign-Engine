import { SwarmClient } from '../Omni/lib/swarm-client';
import { SemanticGenome } from '../sys/SemanticGenome';

const swarm = new SwarmClient('http://localhost:3000');

export interface GemmaResponse {
    text: string;
    telemetry?: any;
    libraryEntry?: any;
}

/**
 * Logs a ThoughtPacket to the SWARM telemetry.
 */
const logTelemetry = async (packet: any) => {
    try {
        await fetch('http://localhost:3000/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(packet)
        });
    } catch (err) {
        // Silently fail telemetry to avoid UX interruption
    }
};

/**
 * mistralLocalService.ts
 * 
 * Handles communication with the local Mystra/Mistral LLM via the SWARM server.
 * Supports telemetry tracking (ThoughtPackets) and rolling conversation logs.
 */
export const gemmaLocalService = {
    /**
     * Generates a response from the local LLM.
     */
    generateResponse: async (
        prompt: string, 
        context: string, 
        history: { role: 'user' | 'assistant', content: string }[] = [],
        agentId: string = 'mystra'
    ): Promise<GemmaResponse> => {
        try {
            // Log the 'Intent' to telemetry before generating (Pre-computation signal)
            await logTelemetry({
                id: `tp-${Date.now()}`,
                source: agentId as any,
                intent: `Generating response for: "${prompt.slice(0, 30)}..."`,
                status: 'pre-computation',
                timestamp: Date.now(),
                context: 'local-llm-bridge'
            });

            const fullContext = `${SemanticGenome.getSystemPrompt()}\n\n${context}`;

            const payload = {
                method: 'llm/generate',
                params: {
                    model: 'gemma4',
                    system: fullContext,
                    prompt: prompt,
                    history: history,
                    agentId: agentId
                }
            };

            // Try the structured JSON-RPC first
            try {
                const result = await swarm.sendMessage('llm/generate', payload.params);
                if (result && (result.text || result.response)) {
                    const text = result.text || result.response;
                    
                    // Log completion signal
                    await logTelemetry({
                        id: `tp-${Date.now()}-done`,
                        source: agentId as any,
                        intent: `Generated: "${text.slice(0, 30)}..."`,
                        status: 'completion',
                        timestamp: Date.now(),
                        context: 'local-llm-bridge'
                    });

                    return {
                        text,
                        libraryEntry: result.libraryEntry
                    };
                }
            } catch (rpcErr) {
                console.warn("RPC llm/generate failed, falling back to /messages", rpcErr);
            }

            // Fallback to the known /messages endpoint used in useSwarm.ts
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const res = await fetch('http://localhost:3000/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ 
                    chat: prompt,
                    context: context,
                    history: history,
                    agent: agentId,
                    telemetry: true
                })
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                
                // Log completion signal for fallback
                await logTelemetry({
                    id: `tp-${Date.now()}-done-fb`,
                    source: agentId as any,
                    intent: `Generated (FB): "${(data.response || data.text || "").slice(0, 30)}..."`,
                    status: 'completion',
                    timestamp: Date.now(),
                    context: 'local-llm-bridge-fallback'
                });

                return {
                    text: data.response || data.text || "...",
                    libraryEntry: data.libraryEntry
                };
            }

            return { text: "The Local Mesh is silent. Check SWARM at :3000." };
        } catch (err) {
            console.error("Mistral Local Error:", err);
            return { text: "Circuit break detected in the Local Bridge." };
        }
    },

    generateGroundedResponse: async (
        prompt: string, 
        context: string, 
        history: { role: 'user' | 'assistant', content: string }[] = [],
        agentId: string = 'mystra'
    ): Promise<GemmaResponse> => {
        try {
            await logTelemetry({
                id: `tp-${Date.now()}-grounding`,
                source: agentId as any,
                intent: `Generating GROUNDED response: "${prompt.slice(0, 30)}..."`,
                status: 'pre-computation',
                timestamp: Date.now(),
                context: 'local-llm-grounding-bridge'
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const res = await fetch('http://localhost:3000/grounded-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({ 
                    chat: prompt,
                    system: context,
                    history: history,
                    agent: agentId,
                    model: 'gemma4'
                })
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                return {
                    text: data.message?.content || data.response || data.text || "...",
                };
            }

            return { text: "The Grounding Link is severed." };
        } catch (err) {
            console.error("Mistral Grounded Error:", err);
            return { text: "Grounding circuit break." };
        }
    },

    logTelemetry
};
