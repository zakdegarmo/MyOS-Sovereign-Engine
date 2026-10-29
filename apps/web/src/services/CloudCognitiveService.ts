/**
 * CloudCognitiveService.ts
 * 
 * Provides direct client-side integration with Gemini Cloud APIs
 * and the Zero-API Gemini Web DOM Bridge (localhost:8081).
 */

export interface CloudModelConfig {
  apiKey: string;
  provider: 'gemini' | 'anthropic' | 'openai';
  modelName: string;
  isActive: boolean;
  bridgeType?: 'api_key' | 'web_dom';
}

const STORAGE_KEY = 'myos_cloud_cognitive_config';

export function getSavedCloudConfig(): CloudModelConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read cloud cognitive config from localStorage', e);
  }
  return null;
}

export function saveCloudConfig(config: CloudModelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Could not save cloud cognitive config to localStorage', e);
  }
}

export function clearCloudConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Could not clear cloud cognitive config', e);
  }
}

/**
 * Generate a response using the user's own Gemini API key directly via REST
 */
export async function queryGeminiCloud(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string
): Promise<{ text: string; modelUsed: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini Cloud API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Oracle returned an empty transmission.";
  return { text, modelUsed: modelName };
}

/**
 * Generate a response via the Zero-API Gemini Web DOM Bridge (localhost:8081)
 * Leverages the user's active, authenticated gemini.google.com browser session.
 */
export async function queryGeminiWebDom(
  prompt: string,
  timeoutMs: number = 60000
): Promise<{ text: string; modelUsed: string }> {
  try {
    const resp = await fetch('http://localhost:8081/api/gemini-dom/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, timeoutMs })
    });

    if (!resp.ok) {
      throw new Error(`DOM Bridge request failed with HTTP ${resp.status}`);
    }

    const data = await resp.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      text: data.response || 'No response captured from Gemini Web DOM.',
      modelUsed: 'gemini.google.com (Web DOM Synapse)'
    };
  } catch (err: any) {
    console.error('Gemini Web DOM Bridge Error:', err);
    throw err;
  }
}
