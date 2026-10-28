import React, { useEffect, useState } from 'react';
import { CartridgeLockManager, type CartridgeLockState } from '../../engine/CartridgeLockManager';

export const CartridgeLockHUD: React.FC = () => {
    const [state, setState] = useState<CartridgeLockState>({
        isLocked: false,
        activeCartridgeId: null,
        cartridgeTitle: '',
        unlockProgress: 0,
        isHoldingUnlock: false,
        lockMessage: ''
    });

    useEffect(() => {
        return CartridgeLockManager.subscribe(setState);
    }, []);

    // Global Key Listener for ESC dwell and Gamepad polling
    useEffect(() => {
        if (!state.isLocked) return;

        let holdingEsc = false;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !holdingEsc) {
                e.preventDefault();
                holdingEsc = true;
                CartridgeLockManager.startUnlockHold();
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                holdingEsc = false;
                CartridgeLockManager.cancelUnlockHold();
            }
        };

        // Gamepad polling loop for B-button dwell & chords
        let pollInterval: any = null;
        let holdingB = false;

        const pollGamepad = () => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[0] || gamepads[1];
            if (!gp) return;

            // Button 1 is B (East button on standard layout)
            // Button 8 is Select / Back / Share
            const bPressed = gp.buttons[1]?.pressed;
            const selectPressed = gp.buttons[8]?.pressed;

            // Chord: SELECT + B -> Instant Eject!
            if (selectPressed && bPressed) {
                CartridgeLockManager.forceEject();
                return;
            }

            if (bPressed && !holdingB) {
                holdingB = true;
                CartridgeLockManager.startUnlockHold();
            } else if (!bPressed && holdingB) {
                holdingB = false;
                CartridgeLockManager.cancelUnlockHold();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        pollInterval = setInterval(pollGamepad, 16); // 60 FPS gamepad polling

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [state.isLocked]);

    if (!state.isLocked) return null;

    const strokeDashoffset = 283 - (283 * state.unlockProgress);

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1.5px solid #00f0ff',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)',
            borderRadius: '12px',
            padding: '10px 18px',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            fontFamily: 'monospace',
            userSelect: 'none',
            pointerEvents: 'none'
        }}>
            {/* Circular Dwell Fill Gauge */}
            <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                <svg width="40" height="40" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="#334155"
                        strokeWidth="10"
                        fill="transparent"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke={state.unlockProgress > 0 ? '#ff0055' : '#00f0ff'}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray="283"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                }}>
                    {state.unlockProgress > 0 ? '⚠️' : '🔒'}
                </div>
            </div>

            {/* Lock Information */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#00f0ff', letterSpacing: '1px' }}>
                    CARTRIDGE LOADED & LOCKED
                </div>
                <div style={{ fontSize: '11px', color: state.unlockProgress > 0 ? '#ff0055' : '#94a3b8' }}>
                    {state.unlockProgress > 0
                        ? `EJECTING... ${Math.round(state.unlockProgress * 100)}% (HOLD [B] / [ESC])`
                        : `[${state.cartridgeTitle}] // HOLD [B] OR [ESC] TO EJECT`}
                </div>
            </div>
        </div>
    );
};
