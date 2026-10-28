import { GoogleGenAI } from "@google/genai";
import { getApiKey } from '@Omni/utils/apiKeyManager';
import type { GemId } from '@Omni/types';

async function runGeminiTool(
  prompt: string,
  modelName: 'gemini-flash-latest' | 'gemini-3-pro-preview' = 'gemini-flash-latest'
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("KEY_RESET_REQUIRED");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || "No response text.";
  } catch (error: any) {
    console.error("Gemini Tool Error:", error);
    if (error.message?.includes('API key')) {
      throw new Error("KEY_RESET_REQUIRED");
    }
    throw new Error(error.message || "An unknown error occurred with the API.");
  }
}

export async function executeGeminiTool(
  gemId: GemId,
  inputText: string,
  options?: any
): Promise<string> {
  let prompt = "";
  let model: 'gemini-flash-latest' | 'gemini-3-pro-preview' = 'gemini-flash-latest';

  switch (gemId) {
    case 'Self':
      model = 'gemini-3-pro-preview';
      prompt = `Analyze the following text to determine the author's core values, goals, and sense of self. Present the analysis as a 'Gestalt Profile' using markdown.\n\nTEXT:\n"""${inputText}"""\n\nGESTALT PROFILE:`;
      break;
    case 'Thought':
      prompt = `You are a creative brainstormer. Take the following core idea and expand upon it, generating three distinct and interesting directions or possibilities. Use markdown for lists.\n\nCORE IDEA:\n"""${inputText}"""\n\nEXPANDED POSSIBILITIES:`;
      break;
    case 'Logic':
      model = 'gemini-3-pro-preview';
      prompt = `You are a logician. Analyze the following text for its argument structure and identify any logical fallacies. Present your analysis in a clear, structured format using markdown.\n\nTEXT:\n"""${inputText}"""\n\nANALYSIS:`;
      break;
    case 'Unity':
      model = 'gemini-3-pro-preview';
      prompt = `Synthesize the following two perspectives into a unified summary that captures the core essence of both. Identify the key points of agreement and disagreement. The perspectives are separated by '---'.\n\nTEXT:\n"""${inputText}"""\n\nSYNTHESIS:`;
      break;
    case 'Existence':
      prompt = `You are a project manager. Extract a list of concrete, actionable steps from the following text. For each step, identify potential resources required (e.g., time, money, people). Format the output using markdown.\n\nTEXT:\n"""${inputText}"""\n\nACTION PLAN:`;
      break;
    case 'Improvement':
      prompt = `You are an expert editor. Refine the following text to be clearer, more concise, and more impactful. Do not change the core meaning. Return only the refined text.\n\nTEXT:\n"""${inputText}"""\n\nREFINED TEXT:`;
      break;
    case 'Mastery':
      prompt = `Generate a high-level, step-by-step plan for learning the following skill. The plan should include key concepts, suggested projects, and milestones. Format as a markdown list.\n\nSKILL:\n"""${inputText}"""\n\nLEARNING PLAN:`;
      break;
    case 'Resonance':
      const tone = options?.tone || 'professional';
      prompt = `You are an expert communicator specializing in tone. Rewrite the following text to have a ${tone} tone. Maintain the original meaning. Return only the rewritten text.\n\nORIGINAL TEXT:\n"""${inputText}"""\n\nREWRITTEN TEXT (TONE: ${tone.toUpperCase()}):`;
      break;
    case 'Transcendence':
      model = 'gemini-3-pro-preview';
      prompt = `Generate a powerful metaphor or analogy to explain the following complex concept in a new light. Explain the metaphor briefly.\n\nCOMPLEX CONCEPT:\n"""${inputText}"""\n\nMETAPHOR:`;
      break;
    case 'Omni':
      model = 'gemini-3-pro-preview';
      prompt = `Distill the following text down to its absolute core essence. The result should be a single, profound sentence or a short, koan-like statement.\n\nTEXT:\n"""${inputText}"""\n\nESSENCE:`;
      break;
    default:
      throw new Error("Unknown Gem ID for tool execution.");
  }

  return runGeminiTool(prompt, model);
}
