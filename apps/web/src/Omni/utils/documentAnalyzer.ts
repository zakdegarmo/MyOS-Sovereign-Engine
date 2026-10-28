
import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import type { Book, GemId } from '@Omni/types';

export async function analyzeDocumentWithGemini(text: string, filename: string): Promise<Partial<Book>> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key Missing");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Analyze this document text.
    Return a valid JSON object with:
    - title: A concise title.
    - summary: A 1-sentence summary.
    - keywords: Array of 3-5 strings.
    - ddc: Object { number: "000-999 string", name: "Category Name", path: [{number: "parent", name: "parent"}] }
    - patron: Which of these Archetypes would govern this text? (Self, Thought, Logic, Unity, Existence, Improvement, Mastery, Resonance, Transcendence, Omni).
    
    Filename: ${filename}
    Text Sample: ${text.slice(0, 5000)}...
    `;

    const result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse Gemini analysis", e);
        return {
            title: filename,
            summary: "Analysis failed.",
            keywords: [],
            ddc: { number: "000", name: "Unclassified", path: [] },
            patron: 'Logic'
        };
    }
}
