// Safe storage accessor for SSR/Node environments
const getStorage = () => typeof sessionStorage !== 'undefined' ? sessionStorage : null;

let manualKey: string | null = getStorage()?.getItem('manual_api_key') || null;

export function setManualApiKey(key: string): void {
  manualKey = key;
  getStorage()?.setItem('manual_api_key', key);
}

export function getApiKey(): string | null {
  // Manual key takes precedence
  if (manualKey) {
    return manualKey;
  }

  // Helper to validate key format (simple check)
  const isValid = (k: string | undefined) => k && !k.startsWith('INSERT_') && !k.startsWith('YOUR_') && k.length > 20;

  // Fallback to the injected key if it exists
  if (typeof process !== 'undefined' && process.env) {
    if (isValid(process.env.REACT_APP_GEMINI_API_KEY)) return process.env.REACT_APP_GEMINI_API_KEY!;
    if (isValid(process.env.NEXT_PUBLIC_GEMINI_API_KEY)) return process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
    if (isValid(process.env.API_KEY)) return process.env.API_KEY!;
  }

  // VITE SUPPORT
  if (import.meta && (import.meta as any).env) {
    if (isValid((import.meta as any).env.VITE_GEMINI_API_KEY)) return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }

  // Try directly accessing env for Node contexts if previous failed
  if (typeof process !== 'undefined' && process.env && process.env.VITE_GEMINI_API_KEY) {
    if (isValid(process.env.VITE_GEMINI_API_KEY)) return process.env.VITE_GEMINI_API_KEY;
  }
  return null;
}

export function clearManualApiKey(): void {
  manualKey = null;
  getStorage()?.removeItem('manual_api_key');
}
