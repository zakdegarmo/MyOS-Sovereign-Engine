/**
 * TopographyRegistry: The Centralized Truth for World Elevation.
 * 
 * Ensures that all components (Avatars, Props, Camera) use the exact same 
 * mathematical grounding as the visual terrain for their specific active environment.
 */

export type ElevationFunc = (x: number, z: number) => number;
export type BlockedFunc = (x: number, z: number, radius?: number, y?: number) => boolean;

interface TopographyContext {
    id: string;
    getElevation: ElevationFunc;
    projection: 'flat' | 'spherical';
    radius?: number; // Only for spherical
    isBlocked?: BlockedFunc;
}

class TopographyRegistry {
    private contexts: Map<string, TopographyContext> = new Map();
    private currentContextId: string | null = null;

    register(context: TopographyContext) {
        this.contexts.set(context.id, context);
        console.log(`[TopographyRegistry] Registered: ${context.id} (${context.projection})`);
    }

    unregister(id: string) {
        this.contexts.delete(id);
        if (this.currentContextId === id) {
            this.currentContextId = null;
        }
        console.log(`[TopographyRegistry] Unregistered: ${id}`);
    }

    setCurrent(id: string | null) {
        this.currentContextId = id;
    }

    getCurrentId(): string | null {
        return this.currentContextId;
    }

    getElevation(x: number, z: number): number {
        if (!this.currentContextId) return 0;
        const ctx = this.contexts.get(this.currentContextId);
        if (!ctx) return 0; // If current environment has no heightmap registered, ground is strictly 0 (FLAT PLANE)

        return ctx.getElevation(x, z);
    }

    isBlocked(x: number, z: number, radius: number = 0.4, y?: number): boolean {
        if (!this.currentContextId) return false;
        const ctx = this.contexts.get(this.currentContextId);
        if (!ctx || !ctx.isBlocked) return false;
        return ctx.isBlocked(x, z, radius, y);
    }

    getProjection(): 'flat' | 'spherical' {
        if (!this.currentContextId) return 'flat';
        const ctx = this.contexts.get(this.currentContextId);
        return ctx?.projection || 'flat';
    }

    getContext() {
        if (!this.currentContextId) return null;
        return this.contexts.get(this.currentContextId);
    }
}

export const topographyRegistry = new TopographyRegistry();
if (typeof window !== 'undefined') {
    (window as any).topographyRegistry = topographyRegistry;
}
