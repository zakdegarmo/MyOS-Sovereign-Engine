import { useState, useCallback, useEffect } from 'react';

/**
 * --- MYOS PARADIGM ENGINE ---
 * PILLAR 9 / 11: TRANSCENDENCE & SINGULARITY
 * This hook drives global system resonance shifts.
 */

export const useParadigm = () => {
    const [isShifted, setIsShifted] = useState(false);
    const [syncLevel, setSyncLevel] = useState(0);

    const initiateShift = useCallback(() => {
        setIsShifted(true);
        console.log("[ParadigmEngine] TRANSCENDENCE_INITIATED: Shifting resonance to 432Hz Core.");
        
        // Update CSS Variables Globally
        const root = document.documentElement;
        root.style.setProperty('--nexus-primary', '#fbbf24'); // Gold
        root.style.setProperty('--nexus-glow', 'rgba(251, 191, 36, 0.5)');
        root.style.setProperty('--nexus-bg', 'rgba(69, 26, 3, 0.2)'); // Amber-950/20
        
        // Dispatch Global Event for Applets
        window.dispatchEvent(new CustomEvent('paradigm-shift', { detail: { state: 'active' } }));
    }, []);

    const resetParadigm = useCallback(() => {
        setIsShifted(false);
        const root = document.documentElement;
        root.style.setProperty('--nexus-primary', '#4444ff'); // Blue
        root.style.setProperty('--nexus-glow', 'rgba(64, 64, 255, 0.3)');
        root.style.setProperty('--nexus-bg', 'rgba(8, 8, 168, 0.2)');
        
        window.dispatchEvent(new CustomEvent('paradigm-shift', { detail: { state: 'reset' } }));
    }, []);

    return {
        isShifted,
        syncLevel,
        setSyncLevel,
        initiateShift,
        resetParadigm
    };
};
