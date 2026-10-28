export interface GlobalSystemConfig {
    // PHYSICS (The "Cosmic" Layer)
    repulsionStrength: number;
    linkDistance: number;
    particleSpeed: number;
    nodeResolution: number; // 4-64

    // UI APPEARANCE (The "Skin" Layer)
    themeMode: 'cyber' | 'obsidian' | 'paper';
    primaryColor: string; // Hex
    borderRadius: number; // px
    fontScale: number; // multiplier (0.8 - 1.2)
    glassOpacity: number; // 0.0 - 1.0

    // INTERFACE SPECIFIC TOGGLES
    showExistenceParticles: boolean;
    showForgeGrid: boolean;
}

export const DEFAULT_SYSTEM_CONFIG: GlobalSystemConfig = {
    // Physics
    repulsionStrength: -1500,
    linkDistance: 200,
    particleSpeed: 0.003,
    nodeResolution: 32,

    // UI
    themeMode: 'obsidian',
    primaryColor: '#10b981', // Emerald
    borderRadius: 8,
    fontScale: 1.0,
    glassOpacity: 0.1,

    // Toggles
    showExistenceParticles: true,
    showForgeGrid: false
};

// Singleton State
let currentConfig: GlobalSystemConfig = { ...DEFAULT_SYSTEM_CONFIG };
const listeners: Set<(config: GlobalSystemConfig) => void> = new Set();

export const graphConfigService = {
    get: () => currentConfig,
    set: (updates: Partial<GlobalSystemConfig>) => {
        currentConfig = { ...currentConfig, ...updates };
        listeners.forEach(cb => cb(currentConfig));
    },
    subscribe: (cb: (config: GlobalSystemConfig) => void) => {
        listeners.add(cb);
        return () => { listeners.delete(cb); }; // Fixed: Return void function
    }
};
