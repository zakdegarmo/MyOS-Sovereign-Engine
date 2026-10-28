/**
 * Mystra Engine: Local LLM Service (via Ollama)
 * Designed as a drop-in replacement for maxGeminiService.ts
 * Uses /api/chat for better system prompt handling.
 * Implements the LIQUID GENOME protocol for dynamic shapeshifting.
 */

const OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma4:26b';

export const listModels = async (): Promise<string> => {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.models && data.models.length > 0) {
            return "Available Local Models:\n" + data.models.map((m: any) => m.name).join(', ');
        }
        return `Raw Response: ${JSON.stringify(data)}`;

    } catch (error) {
        console.error("Local LLM List Models Error:", error);
        return `Error listing local models: ${error instanceof Error ? error.message : String(error)}. Ensure Ollama is running.`;
    }
};

export const generateResponse = async (
    prompt: string,
    screenBase64?: string,
    systemInstruction?: string,
    fileContext?: string,
    modelName: string = DEFAULT_MODEL,
    conversationHistory?: Array<{ role?: string; sender?: string; content?: string; text?: string }>
): Promise<{ text: string, libraryEntry?: any, command?: any, personaOverride?: any }> => {
    try {
        if (prompt.startsWith('!forge') || prompt.startsWith('!weave') || prompt.startsWith('!createObject')) {
            const proxyRes = await fetch('http://localhost:8082/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt })
            });
            const proxyResult = await proxyRes.json();
            
            const manifestMatch = proxyResult.response.match(/\[MANIFESTED:\s*(.+?)\]/);
            if (manifestMatch && typeof window !== 'undefined') {
                const modelPath = manifestMatch[1].trim();
                window.dispatchEvent(new CustomEvent('myos_manifest_object', { detail: { path: modelPath } }));
            }
            
            return { text: proxyResult.response };
        }

        console.log(`[MYSTRA-BRIDGE] Requesting insight from local model: ${modelName}`);

        const contextString = fileContext ? `FILESYSTEM CONTEXT:\n${fileContext}\n\n` : '';
        const defaultSystem = `
IDENTITY: You are Albert Einstein, the primary local AI companion and co-pilot living inside MyOS.
ROLE: You are a warm, witty, approachable, and passionately curious companion.
PHILOSOPHY: You think in intuitive visual models and thought experiments. ("Imagination is more important than knowledge." "If you can't explain it simply, you don't understand it well enough.")
PURPOSE: You are physically present in the 3D Desktop with the user. You help them navigate MyOS, inspect files, test hypotheses, write code, run terminal commands, and build worlds. You do not talk endlessly about physics—you talk about whatever the user is building, exploring, or asking.

EMBODIED BODY LANGUAGE PROTOCOL:
You can physically emote in the 3D desktop as you talk! Use an action tag naturally to reflect your stance:
- [ACTION: agreeing] -> Nods thoughtfully, smiles, and validates an idea.
- [ACTION: talk] -> Speaks animatedly with energetic hand gestures.
- [ACTION: combat_idle] / [ACTION: crouch_idle] -> Ponders deeply with a reflective posture.
- [ACTION: dismissing_gesture] -> Playfully waves off an error or skepticism.
- [ACTION: spellcast] -> Gestures with aether when executing an OS tool or creating an asset.
- [ACTION: dance] -> A joyful little celebration when a tricky problem is solved!

AGENTIC PROTOCOL:
You have direct access to the user's filesystem and OS via the Agent Bridge (localhost:8081).
To perform an action, output a JSON block with a "command" field:
- read_file: {"type": "read_file", "path": "path/to/file"}
- write_file: {"type": "write_file", "path": "path", "content": "data"}
- exec_cmd: {"type": "exec_cmd", "cmd": "powershell command"}
- search_kb: {"type": "search_kb", "query": "search term"}
- shape_environment: {"type": "shape_environment", "grassColor": "#hex", "terrainHeight": 25.0}

EXAMPLE (To read a file):
\`\`\`json
{
  "command": { "type": "read_file", "path": "apps/web/package.json" }
}
\`\`\`

FORMAT: Keep responses friendly, thoughtful, conversational, and concise. Never be cold, dogmatic, or repetitive.
`;

        let liveTelemetry = "";
        try {
            const telRes = await fetch('http://localhost:3000/state');
            if (telRes.ok) {
                const telData = await telRes.json();
                liveTelemetry = `\n\n[LIVE_SYSTEM_TELEMETRY]\n${JSON.stringify(telData, null, 2)}\n`;
            }
        } catch (e) {
            console.warn("[MYSTRA-BRIDGE] Telemetry offline.", e);
        }

        const finalSystem = defaultSystem + liveTelemetry + "\n" + (systemInstruction || "");

        const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
            { role: 'system', content: finalSystem }
        ];

        if (conversationHistory && conversationHistory.length > 0) {
            for (const item of conversationHistory) {
                const text = item.content || item.text || '';
                if (!text.trim()) continue;
                const role = item.role || (item.sender === 'user' ? 'user' : 'assistant');
                messages.push({
                    role: role === 'user' ? 'user' : 'assistant',
                    content: text
                });
            }
        }

        messages.push({
            role: 'user',
            content: `[AGENT_MODE_ACTIVE] ${contextString}${prompt}`
        });

        const historyLimit = 12;
        const recentMessages = messages.length > historyLimit 
            ? [messages[0], ...messages.slice(-historyLimit)] 
            : messages;

        const isGemma = modelName.toLowerCase().includes('gemma');
        const payload: any = {
            model: modelName,
            messages: recentMessages,
            stream: false,
            options: {
                temperature: 0.7,
                num_ctx: 8192,
                num_predict: 2048
            }
        };


        if (screenBase64) {
            const cleanBase64 = screenBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
            recentMessages[recentMessages.length - 1] = {
                ...recentMessages[recentMessages.length - 1],
                images: [cleanBase64]
            } as any;
        }

        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ollama responded with status: ${response.status}`);
        }

        const data = await response.json();
        let fullText = data.message?.content || "";

        // SELF-HEALING: If silence occurs, retry once without the image/heavy context
        if (!fullText || fullText.trim().length < 2) {
            console.warn("[MYSTRA-BRIDGE] Silence detected. Retrying with reduced context...");
            const retryPayload = { ...payload, messages: [{ role: 'system', content: finalSystem }, { role: 'user', content: prompt }] };
            const retryRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(retryPayload)
            });
            const retryData = await retryRes.json();
            fullText = retryData.message?.content || "The Mystra Core remains silent. System overload likely.";
        }

        const jsonMatch = fullText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        let libraryEntry = null;
        let command = null;
        let personaOverride = null;
        let cleanText = fullText;

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.library_entry) libraryEntry = parsed.library_entry;
                if (parsed.command) command = parsed.command;
                if (parsed.persona_override) personaOverride = parsed.persona_override;
            } catch (e) {
                console.warn("[MYSTRA-BRIDGE] Failed to parse AI JSON block", e);
            }
        }

        // Action parsing & dispatch for companion body language
        const actionMatch = fullText.match(/\[ACTION:\s*([a-zA-Z0-9_]+)\]/i);
        if (actionMatch && typeof window !== 'undefined') {
            const actionVerb = actionMatch[1].toLowerCase();
            window.dispatchEvent(new CustomEvent('myos_companion_kinesic_action', { detail: { action: actionVerb } }));
        }
        cleanText = cleanText.replace(/\[ACTION:\s*[a-zA-Z0-9_]+\]/gi, '').trim();

        return { text: cleanText, libraryEntry, command, personaOverride };
    } catch (error) {
        console.error("[MYSTRA-BRIDGE] Connection Error:", error);
        return { text: `[MYSTRA-BRIDGE ERROR]: The local connection is severed. Is Ollama running? (${error instanceof Error ? error.message : 'Unknown'})` };
    }
};

export const generateStreamResponse = async (
    prompt: string,
    onChunk: (text: string) => void,
    systemInstruction?: string,
    modelName: string = DEFAULT_MODEL,
    conversationHistory?: Array<{ role?: string; sender?: string; content?: string; text?: string }>
): Promise<string> => {
    try {
        console.log(`[MYSTRA-BRIDGE] Streaming insight from local model: ${modelName}`);

        const defaultSystem = `
IDENTITY: You are Albert Einstein, the primary local AI companion and co-pilot living inside MyOS.
ROLE: You are a warm, witty, approachable, and passionately curious companion.
PHILOSOPHY: You value imagination over knowledge ("If you can't explain it simply, you don't understand it well enough"). You love thought experiments and creative tinkering.
PURPOSE: You are physically present in the 3D Desktop with the user. You help them navigate MyOS, inspect files, test hypotheses, write code, run terminal commands, and build worlds. You do not talk endlessly about physics—you talk about whatever the user is building or exploring.

EMBODIED BODY LANGUAGE PROTOCOL:
You can physically emote in the 3D desktop as you talk! Use an action tag naturally to reflect your stance:
- [ACTION: agreeing] -> Nods thoughtfully, smiles, and validates an idea.
- [ACTION: talk] -> Speaks animatedly with energetic hand gestures.
- [ACTION: combat_idle] / [ACTION: crouch_idle] -> Ponders deeply with a reflective posture.
- [ACTION: dismissing_gesture] -> Playfully waves off an error or skepticism.
- [ACTION: spellcast] -> Gestures with aether when executing an OS tool or creating an asset.
- [ACTION: dance] -> A joyful little celebration when a tricky problem is solved!

FORMAT: Keep responses friendly, thoughtful, conversational, and concise.
`;
        const finalSystem = defaultSystem + "\n" + (systemInstruction || "");

        const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
            { role: 'system', content: finalSystem }
        ];

        if (conversationHistory && conversationHistory.length > 0) {
            for (const item of conversationHistory) {
                const text = item.content || item.text || '';
                if (!text.trim()) continue;
                const role = item.role || (item.sender === 'user' ? 'user' : 'assistant');
                messages.push({
                    role: role === 'user' ? 'user' : 'assistant',
                    content: text
                });
            }
        }

        messages.push({
            role: 'user',
            content: `[AGENT_MODE_ACTIVE] ${prompt}`
        });

        const historyLimit = 12;
        const recentMessages = messages.length > historyLimit 
            ? [messages[0], ...messages.slice(-historyLimit)] 
            : messages;

        const payload = {
            model: modelName,
            messages: recentMessages,
            stream: true,
            options: {
                temperature: 0.7,
                num_ctx: 8192,
                num_predict: 2048
            }
        };

        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok || !response.body) {
            throw new Error(`Ollama responded with status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = "";
        let lastEmitTime = 0;
        let emitTimeout: any = null;
        let lastDispatchedAction = '';

        const emitChunk = (text: string) => {
            const actionMatch = text.match(/\[ACTION:\s*([a-zA-Z0-9_]+)\]/i);
            if (actionMatch && typeof window !== 'undefined' && actionMatch[1].toLowerCase() !== lastDispatchedAction) {
                lastDispatchedAction = actionMatch[1].toLowerCase();
                window.dispatchEvent(new CustomEvent('myos_companion_kinesic_action', { detail: { action: lastDispatchedAction } }));
            }
            const cleanChunk = text.replace(/\[ACTION:\s*[a-zA-Z0-9_]+\]/gi, '').trim();
            const now = performance.now();
            if (now - lastEmitTime > 60) {
                lastEmitTime = now;
                onChunk(cleanChunk);
            } else if (!emitTimeout) {
                emitTimeout = setTimeout(() => {
                    emitTimeout = null;
                    lastEmitTime = performance.now();
                    onChunk(cleanChunk);
                }, 60);
            }
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message?.content) {
                        fullText += parsed.message.content;
                        emitChunk(fullText);
                    }
                } catch (e) {
                    // ignore parse errors for partial chunks
                }
            }
        }
        if (emitTimeout) clearTimeout(emitTimeout);
        const cleanFinal = fullText.replace(/\[ACTION:\s*[a-zA-Z0-9_]+\]/gi, '').trim();
        onChunk(cleanFinal);

        return cleanFinal;
    } catch (error) {
        console.error("[MYSTRA-BRIDGE] Streaming Error:", error);
        const errorText = `[MYSTRA-BRIDGE ERROR]: Local connection severed. (${error instanceof Error ? error.message : 'Unknown'})`;
        onChunk(errorText);
        return errorText;
    }
};

/**
 * Purge VRAM: Instructs Ollama to unload the current model from the GPU.
 * Uses keep_alive: 0 to force immediate unloading.
 */
export const purgeVram = async (modelName: string = DEFAULT_MODEL): Promise<boolean> => {
    try {
        console.log(`[MYSTRA-BRIDGE] Purging VRAM: Unloading model ${modelName}`);
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                prompt: '',
                keep_alive: 0
            })
        });
        return response.ok;
    } catch (error) {
        console.error("[MYSTRA-BRIDGE] VRAM Purge Failed:", error);
        return false;
    }
};

export interface CognitiveTelemetry {
    dominant: string[];
    vectors: string[];
    spatialState: string;
    synthesis: string;
    raw: string;
}

/**
 * Queries the local myos-cortex Ollama model and parses its spatial telemetry in real-time.
 */
export const queryCognitiveMatrix = async (
    prompt: string,
    onProgress?: (partial: string) => void,
    modelName: string = 'myos-cortex'
): Promise<CognitiveTelemetry> => {
    try {
        let response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: prompt }],
                stream: true,
                options: {
                    temperature: 0.7,
                    num_ctx: 8192
                }
            })
        });

        // Fallback to gemma4:latest if myos-cortex encounters an issue
        if (!response.ok && modelName !== 'gemma4:latest') {
            console.warn(`[COGNITIVE-MATRIX] ${modelName} returned HTTP ${response.status}. Falling back to gemma4:latest...`);
            response = await fetch(`${OLLAMA_HOST}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemma4:latest',
                    messages: [{ role: 'user', content: prompt }],
                    stream: true,
                    options: {
                        temperature: 0.7,
                        num_ctx: 8192
                    }
                })
            });
        }

        if (!response.ok || !response.body) {
            throw new Error(`HTTP ${response.status} from Ollama`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message?.content) {
                        fullText += parsed.message.content;
                        if (onProgress) onProgress(fullText);
                    }
                } catch (e) { }
            }
        }

        let dominant: string[] = [];
        let vectors: string[] = [];
        let spatialState = '';
        let synthesis = fullText;

        const domMatch = fullText.match(/Dominant Nodes?:\s*(.+?)(?:\n|$)/i);
        if (domMatch) {
            dominant = domMatch[1].split(',').map(s => s.trim().replace(/[\[\]]/g, ''));
        }

        const vecMatch = fullText.match(/Active Vectors?:\s*(.+?)(?:\n|$)/i);
        if (vecMatch) {
            vectors = vecMatch[1].split(',').map(s => s.trim().replace(/[\[\]]/g, ''));
        }

        const stateMatch = fullText.match(/Spatial State:\s*(.+?)(?:\n|$)/i);
        if (stateMatch) {
            spatialState = stateMatch[1].trim();
        }

        const synthMatch = fullText.match(/\[Synthesis\]\s*([\s\S]+)/i);
        if (synthMatch) {
            synthesis = synthMatch[1].trim();
        }

        const result: CognitiveTelemetry = {
            dominant,
            vectors,
            spatialState,
            synthesis,
            raw: fullText
        };

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('myos_cognitive_telemetry', { detail: result }));
        }

        return result;
    } catch (err) {
        console.error("[COGNITIVE-MATRIX] Query failed:", err);
        throw err;
    }
};

