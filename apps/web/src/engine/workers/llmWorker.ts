// llmWorker.ts
// The Isolated Brain for the Cognitive Chassis

let aiEngine: any = null;
let entityIdentity: any = null;
let conversationHistory: any[] = [];
let isReady = false;

// Mocked local fetch to Gemma proxy (simulating WASM engine for now)
const processViaProxy = async (messages: any[]) => {
    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma4:latest', 
                messages: messages,
                stream: false,
                format: 'json'
            })
        });
        
        const data = await response.json();
        return data.message?.content || JSON.stringify(data);
    } catch (err) {
        console.error("[WORKER] Proxy Error:", err);
        return '{"action": "none"}';
    }
}

self.onmessage = async (event: MessageEvent) => {
    const { type, payload } = event.data;

    if (type === 'BOOT') {
        console.log(`[WORKER]: Igniting cognitive engine...`);
        const { identity, tools, definitions } = payload;
        
        entityIdentity = identity;

        // Build the system prompt using the deeply loaded definitions
        let systemPrompt = `IDENTITY CONTEXT:\n`;
        systemPrompt += `You are an Autonomous Sprite Entity.\n`;
        systemPrompt += `Fractal Genome Mapping:\n`;
        
        for (const def of definitions) {
            systemPrompt += `--- [${def.pillar} -> ${def.endpoint}: ${def.term}] ---\n`;
            systemPrompt += `${def.content}\n\n`;
        }
        
        systemPrompt += `\nDIRECTIVE: ${identity.System_Directive}\n`;
        systemPrompt += `You must interact with the world strictly by calling the provided JSON tools.\n`;
        systemPrompt += `Available Tools: ${JSON.stringify(tools)}\n`;
        systemPrompt += `IMPORTANT: Always include an "internal_monologue" string property in your JSON output to reason about your action before selecting a tool.\n`;
        systemPrompt += `OUTPUT ONLY VALID JSON. Example: {"internal_monologue": "I will move to the crystal.", "action": "moveTo", "params": {"x": 1, "z": 1}}\n`;

        conversationHistory = [{
            role: 'system',
            content: systemPrompt
        }];

        console.log(`[WORKER]: Brain online. Ready for telemetry.`);
        isReady = true;
        self.postMessage({ type: 'READY' });
    }

    if (type === 'TELEMETRY' && isReady) {
        const { self_position, nearby_entities } = payload;
        
        const sensoryInput = `[SYSTEM TELEMETRY PING]:
Your Coordinates (XYZ): [${self_position.map((n: number) => n.toFixed(2)).join(', ')}]
Nearby Entities: ${JSON.stringify(nearby_entities)}

What is your next action? Output ONLY a valid JSON tool call.`;

        conversationHistory.push({ role: 'user', content: sensoryInput });
        
        // Sliding Context Window: Keep the system prompt ([0]), but truncate old interactions
        if (conversationHistory.length > 13) { // 1 system + 6 user/assistant turns
            // Remove the oldest user/assistant pair
            conversationHistory.splice(1, 2);
        }

        console.log("[WORKER]: Dispatching telemetry ping to local LLM proxy...");

        const responseText = await processViaProxy(conversationHistory);
        
        const text = (typeof responseText === 'string' ? responseText : JSON.stringify(responseText || {})).trim();
        console.log("[WORKER]: Received cognition response:", text);
        
        // Save the action to memory so it doesn't get stuck in a loop
        conversationHistory.push({ role: 'assistant', content: text });

        try {
            // Because we enforce format: json, the text should be valid JSON
            // But we still fallback to regex just in case
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
            const rawJson = jsonMatch ? jsonMatch[1] : text;
            
            const toolCall = JSON.parse(rawJson);
            
            self.postMessage({
                type: 'TOOL_CALL',
                call: toolCall
            });
        } catch (error) {
            console.warn(`[WORKER]: Entity failed motor cognition (Invalid JSON).`, text);
        }
    }
};
