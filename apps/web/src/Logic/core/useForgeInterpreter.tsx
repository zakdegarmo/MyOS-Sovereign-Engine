import { useState } from 'react';
import { useCore } from './CoreContext';
import { ForgeDispatcher, ForgeCommand } from './core/ForgeDispatcher';
import { generateGemResponse } from '@Thought\/services\/geminiService';
import { getApiKey } from '@Omni/utils/apiKeyManager';


export const useForgeInterpreter = () => {
    const core = useCore();
    const [isThinking, setIsThinking] = useState(false);

    // Instantiate Dispatcher
    const dispatcher = new CoreDispatcher(core);

    const processInstruction = async (text: string, imageBase64?: string) => {
        setIsThinking(true);
        core.logToIDE(`Thinking: "${text}" ${imageBase64 ? '(+ Image)' : ''}`, 'info');

        try {
            // 1. Get API Key from Manager
            const apiKey = getApiKey();
            console.log("[ForgeInterpreter] API Key Status:", apiKey ? "Present" : "Missing");

            // Fallback for demo if no key is present (Mock)
            if (!apiKey) {
                core.logToIDE("No API Key detected. Falling back to Basic Mode.", 'system');
                await new Promise(r => setTimeout(r, 500));

                let commands: ForgeCommand[] = [];
                const lower = text.toLowerCase();
                if (lower.includes('box') || lower.includes('cube')) commands.push({ action: 'spawn', primitive: 'box', transform: { position: [0, 1, 0] } });
                else if (lower.includes('sphere') || lower.includes('ball')) commands.push({ action: 'spawn', primitive: 'sphere', transform: { position: [2, 1, 0] } });
                else if (lower.includes('clear')) { forge.clearScene(); return; }

                for (const cmd of commands) dispatcher.execute(cmd);
                if (commands.length === 0) core.logToIDE("Basic Mode: I only understand 'box', 'sphere', or 'clear'.", 'error');
                return;
            }

            // 2. Real API Call
            core.logToIDE("Contacting the Architect...", 'system');
            const { generateForgeCommands } = await import('@Thought\/services\/geminiService');

            console.log("[ForgeInterpreter] Requesting generation for:", text);
            const result = await generateForgeCommands(text, apiKey, imageBase64);
            console.log("[ForgeInterpreter] Architect Response:", result);

            if (result.explanation) {
                core.logToIDE(`Plan: ${result.explanation}`, 'info');
            }

            // 3. Execute Commands
            if (result.commands && Array.isArray(result.commands)) {
                for (const cmd of result.commands) {
                    console.log("[CoreInterpreter] Dispatching:", cmd);
                    const res = dispatcher.execute(cmd);
                    if (!res.success) core.logToIDE(`Cmd Failed: ${res.message}`, 'error');
                }
            } else {
                core.logToIDE("Architect returned no commands.", 'error');
            }

        } catch (e: any) {
            console.error("[CoreInterpreter] Error:", e);
            core.logToIDE(`Error: ${e.message}`, 'error');
        } finally {
            setIsThinking(false);
        }
    };

    return {
        processInstruction,
        isThinking
    };
};
