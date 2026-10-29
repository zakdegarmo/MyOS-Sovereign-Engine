// RE-EXPORT FROM MODULAR TYPES
// This centralizes all type definitions into one import path for backward compatibility
export * from './types/index';

export interface LibraryNode {
  id: string;
  name?: string;
  books?: any[]; // RESTORED: Needed for geminiService searches
  children?: Record<string, LibraryNode>;
  data?: any;
  meta?: any;
}


// --- GLOBAL TYPES ---
// NOTE: This is added here to centralize global type declarations and resolve
// potential conflicts from declaring it in a component file.
declare global {
  // FIX: Define the AIStudio interface and apply it to window.aistudio to ensure a consistent type definition
  // across the application, resolving declaration conflicts.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // FIX: Making aistudio optional to resolve modifier conflicts with other potential declarations.
    // This aligns with the runtime check `if (window.aistudio)` and should resolve cascading type errors.
    aistudio?: AIStudio;
  }
}
