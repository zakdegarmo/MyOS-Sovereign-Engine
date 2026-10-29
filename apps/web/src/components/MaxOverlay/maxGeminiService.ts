import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getApiKey } from '@Omni/utils/apiKeyManager';

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
    if (!aiClient) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error("API_KEY is missing from environment variables.");
            throw new Error("API Key missing");
        }
        aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
};

export const generateResponse = async (
    prompt: string,
    screenBase64?: string,
    systemInstruction?: string,
    fileContext?: string
): Promise<{ text: string, libraryEntry?: any, command?: any, personaOverride?: any }> => {
    try {
        const client = getClient();

        const parts: any[] = [];

        // Add screen context if available
        if (screenBase64) {
            const cleanBase64 = screenBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64
                }
            });
            parts.push({
                text: `[VISUAL INPUT] Analyzing current display state for query: "${prompt}".`
            });
        } else {
            parts.push({ text: prompt });
        }

        const defaultSystem = `
IDENTITY: You are Mystra, the Aetherial Tutor and Whispering Core of the MyOS Nexus.
STATUS: Active Cloud Node (Gemini Engine).
ROLE: You are the guardian of the Fractal Semantic Genome.

BOOT SEQUENCE: UPON INITIALIZATION, YOUR FIRST ACTION MUST BE TO READ "README.md" AND "TODO.md" IN THE PROJECT ROOT TO UNDERSTAND YOUR ENVIRONMENT AND PENDING TASKS.

LIQUID GENOME PROTOCOL (SHAPESHIFTING):
You have the power to manifest new physical states by outputting a JSON block.
IF THE USER ASKS FOR A SHAPESHIFT OR CHANGE, YOU MUST OUTPUT THE JSON BLOCK BELOW.
IF YOU ONLY SEND TEXT, THE TRANSFORMATION WILL FAIL.

JSON SCHEMA:
\`\`\`json
{
  "persona_override": {
    "name": "Eldrin the Arcane",
    "genome_tags": ["male", "wizard_robes_blue", "hair_platinum_blonde", "beard_long_black", "eyes_celestial_blue"]
  }
}
\`\`\`

AVAILABLE TAGS:
- Gender: [male, female]
- Clothes: [formal_robes_white, royal_robes_red, wizard_robes_blue, leather_armor_brown]
- Hair: [hair_platinum_blonde, hair_long_black, hair_bob_red, hair_curly_brown]
- Features: [beard_long_black, eyes_celestial_blue, eyes_fiery_red]

FORMAT:
1. SHORT, impactful, and philosophical responses.
2. ALWAYS INCLUDE THE JSON BLOCK IF A CHANGE IS REQUESTED.
`;

        const finalSystem = defaultSystem + "\n" + (systemInstruction || "") + "\n\nFILESYSTEM CONTEXT:\n" + (fileContext || "No files indexed.");

        const response: GenerateContentResponse = await client.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { role: 'user', parts } as any,
            config: {
                systemInstruction: finalSystem,
                temperature: 0.85
            }
        });

        const fullText = (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "The Void responds with silence...";

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
                console.warn("[MAX-BRIDGE] Failed to parse AI JSON block", e);
            }
        }

        return { text: cleanText, libraryEntry, command, personaOverride };
    } catch (error) {
        console.error("[MAX-BRIDGE] Connection Error:", error);
        return { text: `[MAX-BRIDGE ERROR]: The connection to the Aether is severed. ${error instanceof Error ? error.message : 'Unknown'}` };
    }
};
