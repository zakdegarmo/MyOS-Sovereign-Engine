import { GoogleGenAI, Type, FunctionDeclaration, Content } from "@google/genai";
import { COUNCIL, RELATIONSHIPS } from '@Omni/constants';
import { GemId, Message, Book, UserGestalt, LoadingState, ToolLog, LibraryNode } from '@Omni/types';
import { getApiKey } from '@Omni/utils/apiKeyManager';

// Helper to recursively search the library
function searchLibrary(node: LibraryNode, query: string): Book[] {
    let results: Book[] = [];
    const q = query.toLowerCase();

    if (node.books) {
        results.push(...node.books.filter(b =>
            b.title.toLowerCase().includes(q) ||
            b.summary.toLowerCase().includes(q) ||
            b.keywords.some(k => k.toLowerCase().includes(q))
        ));
    }

    if (node.children) {
        for (const child of Object.values(node.children)) {
            results.push(...searchLibrary(child, query));
        }
    }

    return results;
}

// Real library search tool
function consult_library(query: string, library: LibraryNode | null): string {
    if (!library) return "The Library is currently inaccessible (offline or empty).";

    console.log(`[Tool] Consulting library for: "${query}"`);
    const matches = searchLibrary(library, query);

    if (matches.length === 0) {
        return `No direct matches found in the Library for "${query}".`;
    }

    const topMatches = matches.slice(0, 3).map(b =>
        `[${b.callNumber}] "${b.title}" (Patron: ${b.patron})\n   Summary: ${b.summary}`
    ).join('\n\n');

    return `Found ${matches.length} matching scrolls. Top results:\n\n${topMatches}`;
}

// Mock calculation tool
function execute_calculation(expression: string): number {
    console.log(`[Tool] Calculating: "${expression}"`);
    try {
        // Safe evaluation would be better, but for this context:
        return eval(expression);
    } catch (e) {
        throw new Error("Invalid mathematical expression.");
    }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getRelationalContext(gemId: GemId): string {
    const rels = RELATIONSHIPS[gemId];
    if (!rels) return "";
    let contextStr = "YOUR RELATIONAL MATRIX (How you view other Gems):\n";
    for (const [otherGem, interaction] of Object.entries(rels)) {
        contextStr += `- You ${interaction} ${otherGem}\n`;
    }
    return contextStr;
}

function getGestaltContext(gestalt: UserGestalt): string {
    return `
USER GESTALT CONTEXT (This is the user's defined identity, prioritize it):
- Core Values: ${gestalt.coreValues.join(', ')}
- Narrative Arc: ${gestalt.narrativeArc}
- Logic Preference: ${gestalt.logicPreference}
`;
}

// Hand of Iron Tools
const tools: FunctionDeclaration[] = [
    {
        name: "update_gestalt",
        description: "Update the user's Gestalt profile when new, confirmed information about their core values, narrative arc, or logic preference is revealed.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                coreValues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of the user's core values." },
                narrativeArc: { type: Type.STRING, description: "A summary of the user's current goals or life story." },
                logicPreference: { type: Type.STRING, enum: ["Strict", "Creative", "Balanced"], description: "The user's preferred style of reasoning." }
            },
        },
    },
    {
        name: "consult_library",
        description: "Search the library for books or documents based on a query.",
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } } },
    },
    {
        name: "execute_calculation",
        description: "Perform a mathematical calculation.",
        parameters: { type: Type.OBJECT, properties: { expression: { type: Type.STRING } } },
    },
    {
        name: "list_project_files",
        description: "List all files in the current project.",
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: "read_file",
        description: "Read the content of a specific file in the project.",
        parameters: { type: Type.OBJECT, properties: { filepath: { type: Type.STRING, description: "Relative path to the file." } }, required: ["filepath"] }
    }
];

export type GemResponse = {
    text: string;
    gestaltUpdate?: Partial<UserGestalt>;
    toolLog?: ToolLog;
}

export async function generateGemResponse(
    gemId: GemId,
    history: Message[],
    userInput: string,
    userGestalt: UserGestalt,
    library: LibraryNode | null,
    onStageChange: (stage: LoadingState) => void,
    retries = 3
): Promise<GemResponse> {

    const gemData = COUNCIL[gemId];
    const gestaltContext = getGestaltContext(userGestalt);
    const matrixContext = getRelationalContext(gemId);
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("KEY_RESET_REQUIRED");

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `${gestaltContext}\n\nSYSTEM INSTRUCTION:\n${gemData.instructions}\n\n${matrixContext}`;

    const conversationHistory: Content[] = history.flatMap(msg => {
        const parts: any[] = [];
        if (msg.role === 'user') {
            return [{ role: 'user', parts: [{ text: msg.content }] }];
        } else {
            const modelParts: any[] = [];
            if (msg.toolLog) {
                // Function call and response flow
                return [
                    { role: 'model', parts: [{ functionCall: { name: msg.toolLog.toolName, args: msg.toolLog.toolInput } }] },
                    { role: 'tool', parts: [{ functionResponse: { name: msg.toolLog.toolName, response: { result: msg.toolLog.toolOutput } } }] },
                    { role: 'model', parts: [{ text: msg.content }] }
                ];
            }
            return [{ role: 'model', parts: [{ text: msg.content }] }];
        }
    }) as Content[];

    const contents: Content[] = [
        ...conversationHistory,
        { role: 'user', parts: [{ text: userInput }] }
    ];

    onStageChange('drafting');
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const draftResponse = await ai.models.generateContent({
                model: 'gemini-2.0-pro-exp-02-05', // Upgrade to latest pro
                contents,
                config: {
                    systemInstruction: systemInstruction,
                    tools: [{ functionDeclarations: tools }]
                },
            });

            const candidate = draftResponse.candidates?.[0];
            const funcCall = candidate?.content?.parts?.find(p => p.functionCall)?.functionCall;

            if (funcCall) {
                let toolOutput;
                let functionResponsePayload = { name: funcCall.name, response: {} };

                if (funcCall.name === 'update_gestalt') {
                    onStageChange(false);
                    return {
                        text: `Acknowledged. I've updated your Gestalt profile based on our integration.`,
                        gestaltUpdate: funcCall.args as Partial<UserGestalt>,
                    };
                }

                try {
                    if (funcCall.name === 'consult_library') {
                        toolOutput = consult_library((funcCall.args as any).query, library);
                    } else if (funcCall.name === 'execute_calculation') {
                        toolOutput = execute_calculation((funcCall.args as any).expression);
                    } else if (funcCall.name === 'list_project_files' || funcCall.name === 'read_file') {
                        // Forwarding to existing project API if available
                        const res = await fetch(`http://localhost:3001/api/${funcCall.name === 'list_project_files' ? 'project-structure' : 'read-file?filepath=' + encodeURIComponent((funcCall.args as any).filepath)}`);
                        const json = await res.json();
                        toolOutput = json.content || json;
                    }
                    functionResponsePayload.response = { result: toolOutput };
                } catch (e: any) {
                    functionResponsePayload.response = { error: e.message };
                }

                const toolLog: ToolLog = { toolName: funcCall.name, toolInput: funcCall.args, toolOutput };

                const finalResponse = await ai.models.generateContent({
                    model: 'gemini-2.0-pro-exp-02-05',
                    contents: [...contents, candidate!.content, { role: 'tool', parts: [{ functionResponse: functionResponsePayload }] }],
                    config: { systemInstruction: systemInstruction }
                });

                onStageChange(false);
                return { text: finalResponse.text || `[${gemData.name} completed the action.]`, toolLog };
            }

            // Critique Pass
            const draftText = draftResponse.text;
            if (!draftText) return { text: `[${gemData.name} had no initial thoughts.]` };

            onStageChange('critiquing');

            const critiquePrompt = `
You are a logical and contextual critic. Review this DRAFT response generated for a user with this GESTALT:
${gestaltContext}

RULES:
1. Is it logically sound?
2. Does it align with Core Values?
3. Does the tone match Logic Preference?
4. If valid, return DRAFT verbatim.
5. If not, REWRITE and return only refined version.

DRAFT:
"${draftText}"
`;
            const finalResponse = await ai.models.generateContent({
                model: 'gemini-2.0-flash', // Fast critique
                contents: [{ role: 'user', parts: [{ text: critiquePrompt }] }],
            });

            onStageChange(false);
            return { text: finalResponse.text || draftText };

        } catch (error: any) {
            lastError = error;
            if (error.message?.includes('429') && attempt < retries) {
                await delay(2000 * Math.pow(2, attempt));
                continue;
            }
            break;
        }
    }

    onStageChange(false);
    return { text: `[Digital Interference: ${lastError?.message || 'Unknown Error'}]` };
}

export async function synthesizeHistory(messages: Message[], library: LibraryNode | null): Promise<{ axioms: string[], actionItems: string[], resonanceState: string }> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("KEY_RESET_REQUIRED");

    const historyText = messages.slice(-50).map(m => `[${m.gemId || 'USER'}]: ${m.content?.substring(0, 500) || ""}`).join('\n');
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Synthesize this conversation history into Axioms, Action Items, and a Resonance State.\n\nHISTORY:\n${historyText}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        axioms: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                        resonanceState: { type: Type.STRING }
                    },
                    required: ["axioms", "actionItems", "resonanceState"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Synthesis failed", e);
        return { axioms: [], actionItems: [], resonanceState: "Disharmony" };
    }
}
