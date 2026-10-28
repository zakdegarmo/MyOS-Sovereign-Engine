/**
 * CartridgeLockManager.ts
 * Sovereign "Load & Lock" Protection Subsystem for MyOS 2.0
 * 
 * Prevents accidental ejection from active game cartridges (Uniracers, Glyphrider, Printer Panic)
 * and active documents caused by fat-fingered mouse clicks, controller twitches, or single ESC taps.
 * 
 * Implements the Triple-Confirmation State Machine (TCSM):
 * IDLE -> LOCKED -> PENDING_UNLOCK (Dwell Time / Hold B) -> EJECT
 */

export interface CartridgeLockState {
    isLocked: boolean;
    activeCartridgeId: string | null;
    cartridgeTitle: string;
    unlockProgress: number; // 0.0 to 1.0 (fill gauge)
    isHoldingUnlock: boolean;
    lockMessage: string;
}

type Listener = (state: CartridgeLockState) => void;

class CartridgeLockService {
    private state: CartridgeLockState = {
        isLocked: false,
        activeCartridgeId: null,
        cartridgeTitle: '',
        unlockProgress: 0,
        isHoldingUnlock: false,
        lockMessage: ''
    };

    private listeners: Set<Listener> = new Set();
    private unlockHoldTimer: any = null;
    private holdStartTime: number = 0;
    private readonly HOLD_DURATION_MS = 1200; // 1.2s deliberate dwell time

    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        for (const listener of this.listeners) {
            listener({ ...this.state });
        }
    }

    /**
     * Lock a cartridge into the sovereign chassis.
     */
    public lockCartridge(cartridgeId: string, title?: string) {
        this.state = {
            isLocked: true,
            activeCartridgeId: cartridgeId,
            cartridgeTitle: title || cartridgeId.toUpperCase(),
            unlockProgress: 0,
            isHoldingUnlock: false,
            lockMessage: `CARTRIDGE LOADED & LOCKED: [${title || cartridgeId.toUpperCase()}]`
        };
        console.log(`[CartridgeLockManager] 🔒 LOCKED into chassis: ${cartridgeId}`);
        this.notify();
    }

    /**
     * Call when user begins holding unlock button (e.g. Gamepad B or Keyboard ESC)
     */
    public startUnlockHold() {
        if (!this.state.isLocked || this.state.isHoldingUnlock) return;

        this.holdStartTime = performance.now();
        this.state.isHoldingUnlock = true;
        this.state.unlockProgress = 0;
        this.notify();

        const tick = () => {
            if (!this.state.isHoldingUnlock) return;
            const elapsed = performance.now() - this.holdStartTime;
            const progress = Math.min(1.0, elapsed / this.HOLD_DURATION_MS);
            this.state.unlockProgress = progress;

            if (progress >= 1.0) {
                // Deliberate unlock confirmed!
                this.forceEject();
            } else {
                this.notify();
                this.unlockHoldTimer = requestAnimationFrame(tick);
            }
        };

        this.unlockHoldTimer = requestAnimationFrame(tick);
    }

    /**
     * Call when user releases unlock button before dwell time completes
     */
    public cancelUnlockHold() {
        if (!this.state.isHoldingUnlock) return;
        if (this.unlockHoldTimer) {
            cancelAnimationFrame(this.unlockHoldTimer);
            this.unlockHoldTimer = null;
        }
        this.state.isHoldingUnlock = false;
        this.state.unlockProgress = 0;
        this.state.lockMessage = 'EJECT ABORTED // CARTRIDGE SECURED 🔒';
        this.notify();

        setTimeout(() => {
            if (this.state.isLocked) {
                this.state.lockMessage = '';
                this.notify();
            }
        }, 2000);
    }

    /**
     * Force eject (e.g. Chord SELECT + B or dwell complete)
     */
    public forceEject() {
        if (this.unlockHoldTimer) {
            cancelAnimationFrame(this.unlockHoldTimer);
            this.unlockHoldTimer = null;
        }
        const ejectedId = this.state.activeCartridgeId;
        console.log(`[CartridgeLockManager] 🔓 EJECTED cartridge: ${ejectedId}`);

        this.state = {
            isLocked: false,
            activeCartridgeId: null,
            cartridgeTitle: '',
            unlockProgress: 0,
            isHoldingUnlock: false,
            lockMessage: `EJECTED: [${ejectedId?.toUpperCase()}]`
        };
        this.notify();

        // Dispatch system dimension swap back to desktop
        window.dispatchEvent(new CustomEvent('myos_dimension_swap', { detail: 'desktop' }));
        window.dispatchEvent(new CustomEvent('myos_cartridge_ejected', { detail: { cartridgeId: ejectedId } }));
    }

    public isLocked(): boolean {
        return this.state.isLocked;
    }

    public getActiveCartridge(): string | null {
        return this.state.activeCartridgeId;
    }
}

export const CartridgeLockManager = new CartridgeLockService();
