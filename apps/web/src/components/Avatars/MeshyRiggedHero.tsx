import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

export type MeshyArchetype = 
    | 'moonlit_mage' 
    | 'wilderness_scout' 
    | 'armored_adventurer' 
    | 'azure_adventurer' 
    | 'sir_valor' 
    | 'sunlit_paladin' 
    | 'midnight_huntsman';

export interface MeshyModelMeta {
    id: MeshyArchetype;
    name: string;
    title: string;
    role: string;
    glbPath: string;
    icon: string;
    color: string;
}

export const MESHY_HERO_CATALOG: Record<MeshyArchetype, MeshyModelMeta> = {
    moonlit_mage: {
        id: 'moonlit_mage',
        name: 'Moonlit Mage',
        title: 'Arcane Pyromancer',
        role: 'Wizard / Sorcerer',
        glbPath: '/models/meshy ai glb/rigged/Meshy_AI_Moonlit_Mage_biped/Meshy_AI_Moonlit_Mage_biped/Meshy_AI_Moonlit_Mage_biped_Meshy_AI_Meshy_Merged_Animations.glb',
        icon: '🔮',
        color: '#aa44ff'
    },
    wilderness_scout: {
        id: 'wilderness_scout',
        name: 'Wilderness Scout',
        title: 'Emerald Ranger',
        role: 'Ranger / Druid',
        glbPath: '/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb',
        icon: '🏹',
        color: '#10b981'
    },
    armored_adventurer: {
        id: 'armored_adventurer',
        name: 'Armored Adventurer',
        title: 'Iron Vanguard',
        role: 'Fighter / Barbarian',
        glbPath: '/models/meshy ai glb/rigged/Meshy_AI_Armored_Adventurer_biped/Meshy_AI_Armored_Adventurer_biped/Meshy_AI_Armored_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb',
        icon: '⚔️',
        color: '#f59e0b'
    },
    azure_adventurer: {
        id: 'azure_adventurer',
        name: 'Azure Adventurer',
        title: 'Sky Blade',
        role: 'Rogue / Duelist',
        glbPath: '/models/meshy ai glb/rigged/Meshy_AI_Azure_Adventurer_biped/Meshy_AI_Azure_Adventurer_biped/Meshy_AI_Azure_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb',
        icon: '🗡️',
        color: '#3b82f6'
    },
    sir_valor: {
        id: 'sir_valor',
        name: 'Sir Valor',
        title: 'Knight of the Realm',
        role: 'Paladin / Champion',
        glbPath: '/models/meshy ai glb/rigged/Meshy_AI_Sir_Valor_biped/Meshy_AI_Sir_Valor_biped/Meshy_AI_Sir_Valor_biped_Animation_Walking_withSkin.glb',
        icon: '🛡️',
        color: '#eab308'
    },
    sunlit_paladin: {
        id: 'sunlit_paladin',
        name: 'Sunlit Paladin',
        title: 'Radiant Crusader',
        role: 'Cleric / Paladin',
        glbPath: '/models/meshy ai glb/rigged/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped_Animation_Walking_withSkin.glb',
        icon: '☀️',
        color: '#fbbf24'
    },
    midnight_huntsman: {
        id: 'midnight_huntsman',
        name: 'Midnight Huntsman',
        title: 'Shadow Stalker',
        role: 'Rogue / Warlock',
        glbPath: '/models/meshy ai glb/rigged/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped_Animation_Walking_withSkin.glb',
        icon: '🌑',
        color: '#6366f1'
    }
};

interface MeshyRiggedHeroProps {
    archetype: MeshyArchetype;
    position?: [number, number, number];
    scale?: number;
    action?: 'idle' | 'walk' | 'sprint' | 'slash' | 'spellcast' | 'hurt';
    velocity?: [number, number, number];
}

export const MeshyRiggedHero: React.FC<MeshyRiggedHeroProps> = ({
    archetype = 'moonlit_mage',
    position = [0, 0, 0],
    scale = 1.4,
    action = 'idle',
    velocity = [0, 0, 0]
}) => {
    const heroMeta = MESHY_HERO_CATALOG[archetype] || MESHY_HERO_CATALOG.moonlit_mage;
    const { scene, animations } = useGLTF(heroMeta.glbPath);

    // Clone scene with SkeletonUtils for independent skeletal instances
    const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const { actions } = useAnimations(animations, clonedScene);
    const groupRef = useRef<THREE.Group>(null);
    const currentActionRef = useRef<string>('');

    // Play action
    useEffect(() => {
        if (!actions || !action) return;
        if (currentActionRef.current === action) return;

        const animationNames = Object.keys(actions);
        const findAction = (name: string) => {
            if (actions[name]) return actions[name];
            const lower = animationNames.find(k => k.toLowerCase() === name.toLowerCase());
            if (lower) return actions[lower];
            const partial = animationNames.find(k => k.toLowerCase().includes(name.toLowerCase()));
            if (partial) return actions[partial];
            return null;
        };

        let targetAction = null;
        if (action === 'idle') {
            targetAction = findAction('Boxing_Practice') || findAction('Standing') || findAction('Idle') || findAction('Walk');
        } else if (action === 'walk') {
            targetAction = findAction('Walking') || findAction('Walk');
        } else if (action === 'sprint') {
            targetAction = findAction('Running') || findAction('Run') || findAction('Walking');
        } else if (action === 'slash') {
            targetAction = findAction('Combo') || findAction('Attack') || findAction('Skill_03') || findAction('You_Groove');
        } else if (action === 'spellcast') {
            targetAction = findAction('You_Groove') || findAction('Spellcast') || findAction('Skill');
        } else if (action === 'hurt') {
            targetAction = findAction('Dead') || findAction('Hurt') || findAction('Arise');
        }

        if (!targetAction && animationNames.length > 0) {
            targetAction = actions[animationNames[0]];
        }

        if (targetAction) {
            targetAction.reset().fadeIn(0.3).play();
            targetAction.setLoop(THREE.LoopRepeat, Infinity);
            currentActionRef.current = action;
        }

        return () => {
            if (targetAction) targetAction.fadeOut(0.3);
        };
    }, [actions, action, archetype]);

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <primitive object={clonedScene} />
        </group>
    );
};
