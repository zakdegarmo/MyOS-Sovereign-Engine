import { GoogleGenAI, Type, type FunctionDeclaration, type Content } from "@google/genai";
import { COUNCIL, RELATIONSHIPS } from '@Omni/constants';
import { SystemLogger } from '../../engine/SystemLogger';
import type { GemId, Message, Book, UserGestalt, LoadingState, ToolLog, LibraryNode } from '@Omni/types';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { translateContextToSound, type SonicPalette } from '@Omni/utils/symphonyUtils';
import type { NexusContext } from '@Omni/types_context';

// Helper to recursively search the library
function searchLibrary(node: LibraryNode, query: string): Book[] {
  let results: Book[] = [];
  const q = query.toLowerCase();

  // Search books in current node
  if (node.books) {
    results.push(...node.books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.summary.toLowerCase().includes(q) ||
      b.keywords.some((k: string) => k.toLowerCase().includes(q))
    ));
  }

  // Recurse into children
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

  SystemLogger.log(`Consulting library for: "${query}"`, { source: 'Tool', silent: true });
  const matches = searchLibrary(library, query);

  if (matches.length === 0) {
    return `No direct matches found in the Library for "${query}".`;
  }

  // Sort by relevance (simple weight check for now) or just return top 3
  const topMatches = matches.slice(0, 3).map(b =>
    `[${b.callNumber}] "${b.title}" (Patron: ${b.patron})\n   Summary: ${b.summary}`
  ).join('\n\n');

  return `Found ${matches.length} matching scrolls. Top results:\n\n${topMatches}`;
}

function execute_calculation(expression: string): number {
  SystemLogger.log(`Calculating: "${expression}"`, { source: 'Tool', silent: true });
  try {
    // WARNING: Using eval is insecure in a real application. This is for demonstration only.
    // A production implementation should use a safe math expression parser.
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

// MODULE 1: GESTALT CORE - Format the gestalt for the prompt
function getGestaltContext(gestalt: UserGestalt): string {
  return `
USER HOLON CONTEXT (The User's Digital Soul):
- Archetype: ${gestalt.archetype} (Level ${gestalt.attributes.construct.level + gestalt.attributes.vision.level})
- Narrative Arc: ${gestalt.narrativeArc}
- Core Values: ${gestalt.coreValues.join(', ')}
- Logic Preference: ${gestalt.logicPreference}
- Cognitive Model: ${gestalt.cognitiveModel.learningStyle.toUpperCase()} learner, ${gestalt.cognitiveModel.communicationDensity} communication.

ATTRIBUTES (Current Stats):
- Construct (Logic): Lvl ${gestalt.attributes.construct.level}
- Resonance (Empathy): Lvl ${gestalt.attributes.resonance.level}
- Vision (Planning): Lvl ${gestalt.attributes.vision.level}
- Endurance (Focus): Lvl ${gestalt.attributes.endurance.level}

SYMBIOSIS METRICS:
- Coherence: ${gestalt.symbiosis.coherence}% (System Understanding)
- Friction: ${gestalt.symbiosis.friction}%
`;
}

// MODULE 3: HAND OF IRON - Define tools
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
    description: "Search the Mystra Nexus library for books or documents based on a query.",
    parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } } },
  },
  {
    name: "execute_calculation",
    description: "Perform a mathematical calculation.",
    parameters: { type: Type.OBJECT, properties: { expression: { type: Type.STRING } } },
  },
  {
    name: "list_project_files",
    description: "List all files in the current project (The Forge). Use this to explore the directory structure.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "read_file",
    description: "Read the content of a specific file in the project.",
    parameters: { type: Type.OBJECT, properties: { filepath: { type: Type.STRING, description: "Relative path to the file." } }, required: ["filepath"] }
  },
  {
    name: "edit_file",
    description: "Overwrite the content of a file. USE WITH CAUTION. Always read the file first.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        filepath: { type: Type.STRING },
        content: { type: Type.STRING, description: "The full new content of the file." }
      },
      required: ["filepath", "content"]
    },
  },
  {
    name: "compose_soundscape",
    description: "Generate a musical soundscape to express the emotional or logical state of the conversation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        valence: { type: Type.NUMBER, description: "Emotional positivity (-1.0 to 1.0).", minimum: -1, maximum: 1 },
        arousal: { type: Type.NUMBER, description: "Energy level (0.0 to 1.0).", minimum: 0, maximum: 1 },
        complexity: { type: Type.NUMBER, description: "Intellectual complexity (0.0 to 1.0).", minimum: 0, maximum: 1 }
      },
      required: ["valence", "arousal", "complexity"]
    }
  },
  {
    name: "search_codebase_memory",
    description: "Search the 'Forge' (Local Vector Database) for code snippets, functions, or architectural patterns relevant to your query. Use this when the user asks about specific files, classes, or how the system works.",
    parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ["query"] }
  },
  {
    name: "crystallize_memory",
    description: "Save a profound interaction, answer, or realization as a permanent 'MemCube' in the User's Graph. Use this when the user answers a Control Question or shares a significant insight.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "The text content of the memory (User's answer or the shared insight)." },
        origin: { type: Type.STRING, enum: ["who", "what", "where", "when", "why", "how", "general"], description: "The ontology dimension or origin of this memory." },
        resonance: { type: Type.NUMBER, description: "Estimated emotional resonance (0.0 to 1.0)." },
        context: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords or tags for retrieval." }
      },
      required: ["content", "origin"]
    }
  }
];

export type GemResponse = {
  text: string;
  gestaltUpdate?: Partial<UserGestalt>;
  toolLog?: ToolLog;
  musicalParams?: SonicPalette; // New field for audio data
}

export async function generateGemResponse(
  gemId: GemId,
  history: Message[],
  userInput: string,
  userGestalt: UserGestalt,
  library: LibraryNode | null,
  nexusContext: NexusContext, // NEW: Context Injection
  onStageChange: (stage: LoadingState) => void,
  _workflowInstruction?: string,
  retries = 3
): Promise<GemResponse> {

  const gemData = COUNCIL[gemId];
  const gestaltContext = getGestaltContext(userGestalt);
  const matrixContext = getRelationalContext(gemId);
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key missing. Please check your configuration or enter a key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // NEXUS CONTEXT INJECTION
  const contextString = `
  NEXUS SYSTEM CONTEXT (Situational Awareness):
  - Current Location: ${nexusContext.location?.currentInterface || 'Unknown'} (Active Agent: ${nexusContext.location?.activeAgent || 'None'})
  - Last Action: ${nexusContext.lastPacket ? `[${nexusContext.lastPacket.source} -> ${nexusContext.lastPacket.target}] ${nexusContext.lastPacket.type}` : 'None'}
  - System Telemetry: Resonance ${nexusContext.system?.telemetry?.resonance || 50}%, Vitality ${nexusContext.system?.telemetry?.vitality || 50}%
  `;

  // WORKFLOW ENGINE OVERRIDE
  const coreInstruction = `${gestaltContext}\n${contextString}\nSYSTEM INSTRUCTION:\n${gemData.instructions}\n${matrixContext}`;

  const finalSystemInstruction = coreInstruction;
  const systemInstruction = finalSystemInstruction;

  // 2. Prepare Context (History)
  const contents: Content[] = [];
  let buffer: string[] = [];

  // 1. Process existing history (Limited to last 30 messages to conserve context)
  const recentHistory = history.slice(-30);
  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      buffer.push(msg.content);
    } else {
      // Flush buffer if we hit a model message
      if (buffer.length > 0) {
        contents.push({ role: 'user', parts: [{ text: buffer.join('\n\n') }] });
        buffer = [];
      }

      // Add Model Message (and tool parts)
      if (msg.toolLog) {
        contents.push({
          role: 'model',
          parts: [{ functionCall: { name: msg.toolLog.toolName, args: msg.toolLog.toolInput } }]
        });
        contents.push({
          role: 'tool', // Correct role for new SDK is 'tool', not 'function'
          parts: [{ functionResponse: { name: msg.toolLog.toolName, response: { result: msg.toolLog.toolOutput } } }]
        });
      }
      contents.push({
        role: 'model',
        parts: [{ text: `RESPONSE AS ${msg.gemId} (${(msg.gemId && COUNCIL[msg.gemId]) ? COUNCIL[msg.gemId].symbol : '?'}):\n${msg.content}` }]
      });
    }
  }

  // 2. Append current user input to buffer
  if (userInput.trim()) {
    buffer.push(userInput);
  }

  // 3. Flush final buffer (User's latest turn)
  if (buffer.length > 0) {
    contents.push({ role: 'user', parts: [{ text: buffer.join('\n\n') }] });
  }

  onStageChange('drafting');
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const draftResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // USER SPECIFIED MODEL
        contents,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: tools }]
        },
      });

      // MODULE 3: HAND OF IRON - Function Calling Logic
      if (draftResponse.functionCalls && draftResponse.functionCalls.length > 0) {
        const fc = draftResponse.functionCalls[0];
        let toolOutput;
        let functionResponsePayload = { name: fc.name, response: {} };
        let musicalParams: SonicPalette | undefined;

        if (fc.name === 'update_gestalt') {
          onStageChange(false);
          return {
            text: `[${gemId}]: Acknowledged. I've updated your Gestalt profile based on our conversation.`,
            gestaltUpdate: fc.args,
          };
        }

        try {
          if (fc.name === 'consult_library') {
            toolOutput = consult_library((fc.args as any).query, library);
          } else if (fc.name === 'execute_calculation') {
            toolOutput = execute_calculation((fc.args as any).expression);
          } else if (fc.name === 'list_project_files') {
            SystemLogger.log("Listing files...", { source: 'Tool', silent: true });
            const res = await fetch('/api/project-structure');
            const json = await res.json();
            const flatten = (arr: any[]): string[] => {
              let res: string[] = [];
              for (const item of arr) {
                if (item.type === 'file') res.push(item.path);
                if (item.type === 'directory') res.push(...flatten(item.children));
              }
              return res;
            };
            const files = flatten(json);
            toolOutput = "Project Files:\n" + files.slice(0, 50).join('\n') + (files.length > 50 ? `\n...and ${files.length - 50} more.` : '');
          } else if (fc.name === 'read_file') {
            const path = (fc.args as any).filepath;
            SystemLogger.log(`Reading file: ${path}`, { source: 'Tool', silent: true });
            const res = await fetch(`/api/read-file?filepath=${encodeURIComponent(path)}`);
            const json = await res.json();
            if (json.content) toolOutput = json.content.substring(0, 10000);
            else throw new Error(json.message);
          } else if (fc.name === 'edit_file') {
            const args = fc.args as any;
            SystemLogger.log(`Editing file: ${args.filepath}`, { source: 'Tool', silent: true });
            const res = await fetch('/api/write-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filepath: args.filepath, content: args.content })
            });
            const json = await res.json();
            if (json.success) toolOutput = "File updated successfully.";
            else throw new Error(json.message);
          } else if (fc.name === 'compose_soundscape') {
            // Special case: Logic calculates the palette locally
            const args = fc.args as any;
            musicalParams = translateContextToSound(args.valence, args.arousal, args.complexity);
            toolOutput = "Soundscape composed.";
          } else if (fc.name === 'search_codebase_memory') {
            const query = (fc.args as any).query;
            SystemLogger.log(`Searching Forge Memory: "${query}"`, { source: 'Tool', silent: true });

            // Only search if we have an API key (server needs it for embedding, or we pass it)
            // Ideally server uses its own environment key, but our implementation expects one passed.
            const res = await fetch('/api/forge/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, apiKey })
            });
            const json = await res.json();

            if (json.success && json.results.length > 0) {
              const hits = json.results.map((h: any) =>
                `FILE: ${h.path} (Score: ${h.score?.toFixed(2)})\n---\n${h.content.substring(0, 500)}...\n---`
              ).join('\n\n');
              toolOutput = `Found relevant code in The Forge:\n\n${hits}`;
            } else {
              toolOutput = "No relevant memory found in The Forge.";
            }
          } else if (fc.name === 'crystallize_memory') {
            const args = fc.args as any;
            SystemLogger.log(`Crystallizing MemCube: [${args.origin}]`, { source: 'Tool', silent: true });

            // Dispatch event for HRM/MemCube to pick up and persist
            window.dispatchEvent(new CustomEvent('myos_crystallize_memory', {
                detail: { origin: args.origin, resonance: args.resonance, payload: args.payload || args.content }
            }));

            toolOutput = `MemCube Crystallized.\nOrigin: ${args.origin}\nResonance: ${args.resonance || 0.5}`;
          }

          functionResponsePayload.response = { result: toolOutput };
        } catch (e: any) {
          functionResponsePayload.response = { error: e.message };
        }

        const toolLog: ToolLog = { toolName: fc.name, toolInput: fc.args, toolOutput: String(toolOutput ?? "") };

        const modelResponseContent = draftResponse.candidates?.[0]?.content;
        if (!modelResponseContent) throw new Error("No model response content found.");

        const toolResponseContent: Content = {
          role: 'tool',
          parts: [{ functionResponse: functionResponsePayload }]
        };

        const finalResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: [...contents, modelResponseContent, toolResponseContent],
          config: { systemInstruction },
        });

        const text = finalResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
        onStageChange(false);
        return { text, toolLog, musicalParams };
      }

      // No tool called
      const text = draftResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
      onStageChange(false);
      return { text };

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      onStageChange(`Retrying (Attempt ${attempt + 1}/${retries})...` as any);
      if (attempt === retries) break;
      await delay(1000 * Math.pow(2, attempt));
    }
  }

  onStageChange(false);
  return { text: `[SYSTEM ERROR]: ${lastError?.message || "Unknown error"}` };
}

// MODULE 4: THE FORGE (Manifestation)
export async function generateForgeCommands(
  userInput: string,
  apiKey: string,
  imageBase64?: string
): Promise<any> { // Returns parsed JSON object

  // Debug: Check API Key
  SystemLogger.log(`Initializing with Key length: ${apiKey?.length}`, { source: 'GeminiForge', silent: true });
  const genAI = new GoogleGenAI({ apiKey });

  const systemPrompt = `
  You are the FORGE 3D ARCHITECT.
  
  GOAL: 
  Analyze the User's command and "build" the object by assembling basic 3D Primitives onto the base model.
  Do NOT use Voxels. The user wants smooth, clean geometry.
  
  AVAILABLE PRIMITIVES:
  - 'box', 'sphere', 'cylinder', 'cone', 'torus'

  COMMANDS:
  1. "spawn": Create a new primitive.
  2. "update_object": Modify the base Moose-Bot.
     - modifiers.hiddenNodes: Try hiding "Antlers", "Hat", "Glasses" if they exist.
     - modifiers.material: Apply "color", "metalness", "roughness".

  RECIPE BOOK (USE THESE FOR SPECIFIC PERSONAS):

  A. "SELF" / CARL JUNG / ANALYST
     - Vibe: Tweed suit, glasses, pipe, scholarly.
     - Actions:
       1. Base: Color #2c3e50 (Dark Blue/Grey), Roughness 0.8.
       2. Glasses: Spawn 2 'torus' (Black) on eyes.
       3. Pipe: Spawn 1 'cylinder' (Stem) + 1 'sphere' (Bowl) near mouth relative to (0, 1.5, 0.5).
       4. Book: Spawn 1 'box' (Red) floating nearby.

  B. "THOUGHT" / DA VINCI / INVENTOR
     - Vibe: Parchment tones, brass machinery, halo of ideas.
     - Actions:
       1. Base: Color #f4e4bc (Parchment), Metalness 0.1.
       2. Halo: Spawn 'torus' (Gold, Emissive) above head.
       3. Wings: Spawn 2 flattened 'cone' or 'cylinder' shapes on back.

  C. "EXISTENCE" / MARCUS AURELIUS / EMPEROR
     - Vibe: Stone, marble, gold, stoic.
     - Actions:
       1. Base: Color #aaaaaa (Marble Grey), Roughness 0.4.
       2. Crown: Spawn 'torus' (Gold) on head.
       3. Pillar: Spawn 'cylinder' (Stone) as a staff or base.

  D. "MASTERY" / MUSASHI / RONIN
     - Vibe: Red/Black lacquer, swords, focus.
     - Actions:
       1. Base: Color #800000 (Dark Red).
       2. Sword: Spawn long thin 'box' (Silver) on back.
       3. Blindfold: Spawn flattened 'box' (Black) over eyes.

  GENERAL RULES:
  1. Return ONLY valid JSON.
  2. Use "transform" for placement. Assume Moose head is around y=1.5 to y=1.8.
  3. Center accessories relative to (0,0,0) (Moose feet).
  `;

  try {
    const parts: any[] = [{ text: systemPrompt + "\n\nUSER REQUEST: " + userInput }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg"
        }
      });
    }

    // Correct API call for @google/genai SDK
    const result = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json' }
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    // Clean code blocks if present
    const cleanJson = text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    SystemLogger.log("Clean JSON Result manifested.", { source: 'GeminiForge', silent: true });

    return JSON.parse(cleanJson);

  } catch (error: any) {
    console.error("Gemini Forge API Error:", error);
    // Return a visible error in the forge explanation if possible, or just fail safely
    return {
      explanation: `I encountered an error connecting to the Forge: ${error.message}`,
      commands: []
    };
  }
}

// MODULE 5: THE OBSERVER (Code Analysis)
export async function analyzeCode(
  code: string,
  filename: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey });

  const systemPrompt = `
  You are the LOGIC ENGINE, a specialized code analysis AI.
  Your task is to analyze the provided code snippet from file: "${filename}".
  
  PROVIDE A STRUCTURED ANALYSIS:
  1. **Summary**: What does this code do? (1-2 sentences)
  2. **Key Components**: List main classes, functions, or exports.
  3. **Observations**:
     - Architecture Pattern (e.g., MVC, Hook-based)
     - Potential Issues (Bugs, Security, Performance)
     - Style / Best Practices
  4. **Relation to System**: Hypothesize how this fits into the larger application based on its imports/content.
  
  Keep it concise and technical.
  `;

  try {
    // Correct SDK usage for @google/genai v0.1+
    const result = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: code }] }],
      config: {
        systemInstruction: systemPrompt
      }
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "Analysis resulted in empty response.";
  } catch (error: any) {
    console.error("Code Analysis Error:", error);
    return `Analysis Failed: ${error.message}`;
  }
}

// MODULE 6: THE ARCHITECT (System-Wide Analysis)
export async function analyzeSystemArchitecture(
  fileTree: string[],
  coreFiles: { name: string, content: string }[],
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey });

  const systemPrompt = `
  You are the IMPROVEMENT ENGINE (The Architect).
  Your goal is to analyze the provided project structure and core files to suggest high-level improvements.

  INPUT:
  1. File Tree (Structure)
  2. Core Constants/Types (Context)

  OUTPUT:
  A Markdown-formatted "Blueprint for Improvement":
  - **Architecture Health**: Grade the structure (S/A/B/C).
  - **Bottlenecks**: Identify potential scaling issues.
  - **Refactor Opportunities**: Suggest components that should be split or modernized.
  - **Feature Ideas**: Creative features based on the project's apparent purpose ("Mystra Nexus" Agentic System).

  Keep the tone constructive, visionary, and technical.
  `;

  const userContent = `
  FILE TREE:
  ${fileTree.slice(0, 200).join('\n')}
  ${fileTree.length > 200 ? '...(truncated)' : ''}

  CORE FILES:
  ${coreFiles.map(f => `--- ${f.name} ---\n${f.content.substring(0, 2000)}`).join('\n\n')}
  `;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      config: { systemInstruction: systemPrompt }
    });

    return result.candidates?.[0]?.content?.parts?.[0]?.text || "System Analysis Failed.";
  } catch (error: any) {
    return `Architect Error: ${error.message}`;
  }
}

// MODULE 7: FOLDER ANALYST (Recursive Summary)
export async function analyzeFolder(
  path: string,
  files: { name: string, content: string }[],
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey });

  const systemPrompt = `
  You are an expert Codebase Analyst.
  Your task is to analyze the CONTENTS of a specific DIRECTORY: "${path}".

  INPUT:
  - List of important files in this folder (and subfolders) with their contents.

  OUTPUT:
  A concise Markdown summary:
  1. **Purpose**: What does this module/folder do?
  2. **Key Components**: Main classes/functions export.
  3. **Dependencies**: What external or internal modules does it rely on?
  4. **Complexity Score**: 1-10 (Why?)

  Be precise and technical.
  `;

  // Limit content to prevent token overflow. Take top 10 files, truncated.
  const userContent = `
  DIRECTORY: ${path}
  FILES:
  ${files.slice(0, 10).map(f => `--- ${f.name} ---\n${f.content.substring(0, 3000)}`).join('\n\n')}
  ${files.length > 10 ? `...and ${files.length - 10} more files.` : ''}
  `;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      config: { systemInstruction: systemPrompt }
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "Folder Analysis Failed.";
  } catch (error: any) {
    return `Folder Analysis Error: ${error.message}`;
  }
}

// MODULE 8: THE MECHANICUS (Auto-Fixer)
export async function fixCode(
  code: string,
  instructions: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey });

  const systemPrompt = `
  You are THE MECHANICUS (Top-Tier Auto-Fixer Engine).
  Your goal is to IMPROVE the provided code based on the user's request.
  
  RULES:
  1. Output ONLY the fixed code. No markdown fences, no explanations.
  2. If the user asks to "Fix Lints", look for common issues (missing types, unused vars) and fix them.
  3. Keep the same style/indentation.
  4. Do not remove comments unless they are obsolete.

  This output will be written DIRECTLY to the file, so be precise.
  `;

  const userContent = `
  INSTRUCTIONS: ${instructions || "Fix any lint errors, bugs, or types."}
  
  CODE:
  ${code}
  `;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      config: { systemInstruction: systemPrompt }
    });
    let text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Clean potential markdown fences just in case
    text = text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    return text;
  } catch (error: any) {
    console.error("Mechanicus Failed:", error);
    return code; // Return original on fail
  }
}

// MODULE 9: THE ALCHEMIST (Transmutation)
export async function transmuteCode(
  reagents: string[],
  context: string,
  _apiKey?: string // Kept for signature compatibility, unused
): Promise<string> {
  try {
    const response = await fetch('/api/transmute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reagents, context })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error: any) {
    console.error("Transmutation Error:", error);
    throw error;
  }
}
