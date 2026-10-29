import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";
import { SYSTEM_INSTRUCTION_BASE } from "../constants";

let genAI: GoogleGenAI | null = null;

export const initGemini = (apiKey: string) => {
  genAI = new GoogleGenAI({ apiKey });
};

export const sendMessageToGemini = async (
  history: ChatMessage[], 
  newMessage: string, 
  image?: string,
  useThinking: boolean = true
): Promise<{ text: string, libraryEntry?: any }> => {
  if (!genAI) throw new Error("Gemini not initialized");

  const modelName = "gemini-3-pro-preview"; // Hard requirement from prompt

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION_BASE,
  };

  // Thinking Mode Configuration
  if (useThinking) {
    // Max budget for 3-pro is 32768
    config.thinkingConfig = { thinkingBudget: 16000 }; // Using a safe high number
    // Note: Do NOT set maxOutputTokens when using thinkingConfig
  } else {
    config.maxOutputTokens = 8000;
  }

  // Construct history for the API
  // We need to convert our ChatMessage[] to the format SDK expects (Content[])
  // But strictly, we use ai.models.generateContent for single turn or manually managed history.
  // For simplicity and robustness with the shapeshifter persona, we will construct a prompt chain manually 
  // or use chat session if strictly text. 
  // Given we might send images, `generateContent` with a robust history context string is often safer than chat sessions for complex multi-modal turns in simple demos.
  // However, let's try to use the chat struct if possible, but mixing images in history is tricky.
  // We will construct a massive "contents" array.

  const contents = history.map(msg => {
    const parts: any[] = [];
    if (msg.image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg", // Assuming jpeg for simplicity in this demo context
          data: msg.image.split(',')[1]
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

  try {
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: contents,
      config: config
    });

    const fullText = response.text || "";
    
    // Extract JSON library entry if present
    const jsonMatch = fullText.match(/```json\s*(\{[\s\S]*?"library_entry"[\s\S]*?\})\s*```/);
    let libraryEntry = null;
    let cleanText = fullText;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.library_entry) {
          libraryEntry = parsed.library_entry;
          // Optionally remove the JSON from the chat display to keep it clean, 
          // or keep it. Let's keep it but formatted.
          // For now, we'll return both.
        }
      } catch (e) {
        console.warn("Failed to parse library entry", e);
      }
    }

    return { text: cleanText, libraryEntry };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
