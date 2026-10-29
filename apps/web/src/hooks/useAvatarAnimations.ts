import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * useAvatarAnimations
 * 
 * Simple, rock-solid locomotion mapping.
 */
export interface AnimationOptions {
    onAnimationsLoaded?: (names: string[]) => void;
    characterClass?: string;
    mapping?: { idle: string; walk: string; run: string };
}

const CLASS_INDEX_MAP: Record<string, Record<string, number>> = {
    'wizard': { 'idle': 11, 'walk': 1, 'run': 2 },
    'fighter': { 'idle': 7, 'walk': 3, 'run': 3 },
    'ranger': { 'idle': 1, 'walk': 4, 'run': 3 },
    'artificer': { 'idle': 8, 'walk': 2, 'run': 1 }
};

const CLASS_NAME_MAP: Record<string, Record<string, string>> = {
    'artificer': { 'idle': 'Boxing_Practice' },
    'wizard': { 'idle': 'You_Groove' }
};

export function useAvatarAnimations(
    actions: Record<string, THREE.AnimationAction | null>,
    action: string,
    options: AnimationOptions = {},
    animations: THREE.AnimationClip[] = [],
    animationIndexOverride?: number
) {
    const lastActionRef = useRef<THREE.AnimationAction | null>(null);

    useEffect(() => {
        if (!actions || animations.length === 0) return;
        
        const characterClass = options.characterClass?.toLowerCase() || '';
        const actionKey = action.toLowerCase();
        const mapping = options.mapping as Record<string, number | string>;

        let targetIndex: number | null = null;
        
        // 0. Index Override (Absolute Authority)
        if (animationIndexOverride !== undefined) {
            targetIndex = animationIndexOverride;
        }

        // 1. Manual Mapping (Priority)
        if (targetIndex === null && mapping && mapping[actionKey] !== undefined && mapping[actionKey] !== '') {
            const val = mapping[actionKey];
            targetIndex = typeof val === 'number' ? val : parseInt(val as string);
        }

        // 2. Class-map Index Fallback
        if (targetIndex === null && characterClass) {
            const classMap = CLASS_INDEX_MAP[characterClass] || {};
            if (classMap[actionKey] !== undefined) {
                targetIndex = classMap[actionKey];
            }
        }

        // 3. Absolute Fallback: Index 0
        if (targetIndex === null) {
            targetIndex = 0;
        }

        const targetClip = animations[targetIndex] || animations[0];
        if (!targetClip) return;

        const targetAction = actions[targetClip.name];

        if (targetAction) {
            // Smoothly cross-fade from previous state
            if (lastActionRef.current && lastActionRef.current !== targetAction) {
                lastActionRef.current.fadeOut(0.2);
            }
            
            targetAction.reset().fadeIn(0.2).play();
            lastActionRef.current = targetAction;
        }

        if (options.onAnimationsLoaded) {
            options.onAnimationsLoaded(animations.map(a => a.name));
        }
    }, [actions, action, animations, options.characterClass, options.mapping, animationIndexOverride]);
}
