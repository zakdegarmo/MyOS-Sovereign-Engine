import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from "../components/Tutor/types";
import { SYSTEM_INSTRUCTION_BASE } from "../components/Tutor/constants";
import { getApiKey } from '@Omni/utils/apiKeyManager';

let genAI: GoogleGenAI | null = null;

export const initGemini = () => {
    const apiKey = getApiKey();
    if (apiKey) {
        genAI = new GoogleGenAI({ apiKey });
    }
    return genAI;
};

export const getEmbedding = async (text: string): Promise<number[] | null> => {
    if (!genAI) initGemini();
    if (!genAI) return null;

    try {
        // Using @google/genai SDK syntax
        const response = await genAI.models.embedContent({
            model: "text-embedding-004",
            contents: { role: "user", parts: [{ text }] }
        });

        return response.embeddings?.[0]?.values || null;
    } catch (e: any) {
        // Fallback to older model if 004 fails
        try {
            const response = await genAI.models.embedContent({
                model: "models/gemini-embedding-001",
                contents: { role: "user", parts: [{ text }] }
            });
            return response.embeddings?.[0]?.values || null;
        } catch (retryError) {
            console.error("Embedding Error:", e);
            return null;
        }
    }
};

export const sendMessageToGemini = async (
    history: ChatMessage[],
    newMessage: string,
    image?: string,
    _useThinking: boolean = true,
    contextItems: any[] = []
): Promise<{ text: string, libraryEntry?: any }> => {
    if (!genAI) initGemini();
    if (!genAI) throw new Error("Gemini API Key missing");

    // User requested 'gemini-3-pro-preview'. 
    const modelName = "gemini-3-pro-preview";

    const DYNAMIC_VIEW_INSTRUCTION = `
    DYNAMIC VIEW PROTOCOL (OPAL):
    You have the ability to "Shapeshift" and render "Dynamic Content".
    
    1. SHAPESHIFTING:
    To change your persona (avatar/name), include this JSON at the start of your response:
    \`\`\`json
    { "persona": { "name": "Marcus Aurelius", "avatar": "https://upload.wikimedia.org/wikipedia/commons/6/63/Marcus_Aurelius_Glyptothek_Munich.jpg", "tone": "Stoic, Regal" } }
    \`\`\`
    
    2. DYNAMIC CONTENT:
    To render HTML/UI, use the 'dynamic_view' block:
    \`\`\`html
    <div class="p-4 bg-slate-800 rounded-lg border border-indigo-500">
        <h3 class="text-xl font-bold">Concept Visualization</h3>
        <!-- You can use Tailwind classes -->
    </div>
    \`\`\`
    `;

    // Construct Context Block
    let contextBlock = "";
    if (contextItems.length > 0) {
        contextBlock = `\n\n[[ EXOCORTEX MEMORY ACCESSED ]]\nThe following files from the user's library are relevant to this query. USE THEM to answer if applicable:\n\n`;
        contextItems.forEach((item, idx) => {
            // Truncate content to avoid token explosion
            const contentSnippet = item.content.length > 2000 ? item.content.substring(0, 2000) + "...[TRUNCATED]" : item.content;
            contextBlock += `FILE ${idx + 1}: ${item.title} (Dewey: ${item.deweyCode})\nCONTENT:\n${contentSnippet}\n--------------------------------------------------\n`;
        });
    }

    const config: any = {
        systemInstruction: SYSTEM_INSTRUCTION_BASE + "\n" + DYNAMIC_VIEW_INSTRUCTION + contextBlock,
    };

    const contents = history.map(msg => {
        const parts: any[] = [];
        if (msg.image) {
            parts.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: msg.image.split(',')[1] // remove data:image/jpeg;base64, prefix
                }
            });
        }
        if (msg.text) {
            parts.push({ text: msg.text });
        }
        return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: parts
        };
    });

    // Add the new message
    const newParts: any[] = [];
    if (image) {
        newParts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: image.split(',')[1]
            }
        });
    }
    newParts.push({ text: newMessage });

    contents.push({
        role: 'user',
        parts: newParts
    });

    console.log(`[Tutor] Sending to ${modelName}...`);

    try {
        const response = await genAI.models.generateContent({
            model: modelName,
            contents: contents as any,
            config: config
        });

        const fullText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log(`[Tutor] Response received: ${fullText.length} chars`);

        // Extract JSON library entry if present
        const jsonMatch = fullText.match(/```json\s*(\{[\s\S]*?"library_entry"[\s\S]*?\})\s*```/);
        let libraryEntry = null;
        let cleanText = fullText;

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.library_entry) {
                    libraryEntry = parsed.library_entry;
                }
            } catch (e) {
                console.warn("Failed to parse library entry", e);
            }
        }

        return { text: cleanText, libraryEntry };

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        // Fallback for user visibility
        return { text: `Error connecting to the Aether: ${error.message || error}` };
    }
};

// Helper: Parse Response for Dynamic Features
export const parseGeminiResponse = (responseText: string): {
    cleanText: string,
    persona?: { name: string, avatar: string, tone: string },
    libraryEntry?: any,
    dynamicHtml?: string
} => {
    let cleanText = responseText;
    let persona = undefined;
    let libraryEntry = null;
    let dynamicHtml = undefined;

    // 1. Extract Persona JSON
    const personaMatch = cleanText.match(/```json\s*(\{[\s\S]*?"persona"[\s\S]*?\})\s*```/);
    if (personaMatch) {
        try {
            const parsed = JSON.parse(personaMatch[1]);
            if (parsed.persona) {
                persona = parsed.persona;
                cleanText = cleanText.replace(personaMatch[0], '').trim();
            }
        } catch (e) { console.warn("Persona Parse Error", e); }
    }

    // 2. Extract Library Entry (Existing)
    const libMatch = cleanText.match(/```json\s*(\{[\s\S]*?"library_entry"[\s\S]*?\})\s*```/);
    if (libMatch) {
        try {
            const parsed = JSON.parse(libMatch[1]);
            if (parsed.library_entry) {
                libraryEntry = parsed.library_entry;
                // Don't necessarily remove library entry text if we want the user to see it, 
                // but usually we want to hide the raw JSON.
                cleanText = cleanText.replace(libMatch[0], '').trim();
            }
        } catch (e) { }
    }

    // 3. Extract Dynamic HTML
    // Looking for raw HTML blocks or explicit ```html blocks
    const htmlMatch = cleanText.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlMatch) {
        dynamicHtml = htmlMatch[1];
        cleanText = cleanText.replace(htmlMatch[0], '').trim();
    }

    return { cleanText, persona, libraryEntry, dynamicHtml };
};
