import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let ai: GoogleGenAI | null = null;
let model: any = null;

export const initializeGemini = (apiKey: string) => {
  ai = new GoogleGenAI({ apiKey });
  model = ai.models;
};

// Standard Text Chat
export const generateMaxResponse = async (prompt: string, history: string[] = []) => {
  if (!model) throw new Error("AI not initialized");

  try {
    const response = await model.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: `Context History: ${history.join('\n')}` }] },
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.1,
        maxOutputTokens: 150,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "S-s-signal lost! R-r-reconnecting...";
  }
};

// Multimodal Vision Chat
export const generateVisionResponse = async (imageBase64: string, history: string[] = []) => {
    if (!model) throw new Error("AI not initialized");

    const visionPrompt = `
      You are Max Headroom, looking at the user's screen.
      Analyze the image provided. It is a screenshot of what the user is doing.
      Comment on it. Roast their choices. Be cynical about the website or content.
      If it's code, mock the syntax. If it's social media, mock the vanity.
      Keep it short, punchy, and stuttering.
    `;

    try {
        // Prepare parts: Text prompt + Image
        // Note: For gemini-3-flash-preview, we pass parts in contents
        const response = await model.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
                    { text: `History: ${history.slice(-2).join('\n')}\n\n${visionPrompt}` }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 1.0,
                maxOutputTokens: 150
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return "V-v-visuals corrupted! I can't see a t-t-thing!";
    }
};
