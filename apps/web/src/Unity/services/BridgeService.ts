import type { GemId } from '@Omni/types';

interface AppState {
    activeGem?: GemId;
    activeModule?: string;
    activeGene?: string;
    focus?: string;
    flowState?: boolean;
}

class BridgeService {
    private debounceTimer: NodeJS.Timeout | null = null;
    private lastState: AppState = {};
    private endpoint = 'http://localhost:3001/state';

    public update(newState: Partial<AppState>) {
        this.lastState = { ...this.lastState, ...newState };
        this.emit();
    }

    private emit() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(() => {
            this.send(this.lastState);
        }, 500); // 500ms debounce
    }

    private async send(state: AppState) {
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
        } catch (e) {
            // Silently fail if bridge is not running (dev mode without bridge)
            // console.warn('Bridge not connected:', e);
        }
    }
}

export const Bridge = new BridgeService();
