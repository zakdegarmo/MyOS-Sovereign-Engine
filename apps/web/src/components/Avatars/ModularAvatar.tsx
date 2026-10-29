import React, { useRef, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { type ProceduralGenome } from '../../utils/ManifestationAlgorithm';

// 🧬 Purified Hooks
import { useAvatarModulation } from '../../hooks/useAvatarModulation';
import { useAvatarMaterials } from '../../hooks/useAvatarMaterials';
import { useAvatarAnimations } from '../../hooks/useAvatarAnimations';

interface ModularAvatarProps {
    genome: ProceduralGenome;
    position?: [number, number, number];
    scale?: number;
    action?: string;
    velocity?: [number, number, number];
    debugBones?: boolean;
    onAnimationsLoaded?: (names: string[]) => void;
    animationOverride?: string;
    animationIndexOverride?: number;
}

const CLASS_MODELS: Record<string, string> = {
    fighter: '/models/meshy ai glb/rigged/Meshy_AI_Armored_Adventurer_biped/Meshy_AI_Armored_Adventurer_biped/Meshy_AI_Armored_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    ranger: '/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    wizard: '/models/meshy ai glb/rigged/Meshy_AI_Moonlit_Mage_biped/Meshy_AI_Moonlit_Mage_biped/Meshy_AI_Moonlit_Mage_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    artificer: '/models/meshy ai glb/rigged/Meshy_AI_Azure_Adventurer_biped/Meshy_AI_Azure_Adventurer_biped/Meshy_AI_Azure_Adventurer_biped_Meshy_AI_Meshy_Merged_Animations.glb',
    rogue: '/models/meshy ai glb/rigged/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped_Character_output.glb',
    paladin: '/models/meshy ai glb/rigged/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped_Character_output.glb'
};

const SHARED_ANIMS: Record<string, string> = {
    'idle': '/models/meshy ai glb/rigged/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped_Animation_Idle_withSkin.glb',
    'walk': '/models/meshy ai glb/rigged/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped_Animation_Walking_withSkin.glb',
    'run': '/models/meshy ai glb/rigged/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped/Meshy_AI_Sunlit_Paladin_biped_Animation_Running_withSkin.glb'
};

const ROGUE_ANIM_MAP: Record<string, string> = {
    'idle': '/models/meshy ai glb/rigged/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped_Animation_Idle_withSkin.glb',
    'walk': '/models/meshy ai glb/rigged/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped_Animation_Walking_withSkin.glb',
    'run': '/models/meshy ai glb/rigged/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped/Meshy_AI_Midnight_Huntsman_biped_Animation_Running_withSkin.glb'
};

export const ModularAvatar: React.FC<ModularAvatarProps> = ({ 
    genome,
    position = [0, 0, 0], 
    scale = 1.0,
    action = 'idle',
    velocity = [0, 0, 0],
    debugBones = false,
    onAnimationsLoaded,
    animationOverride,
    animationIndexOverride
}) => {
    const characterClass = useMemo(() => {
        if (!genome) return 'ranger';
        if (genome.archetype) return genome.archetype;
        const id = (genome.id || '').toLowerCase();
        if (id.includes('fighter')) return 'fighter';
        if (id.includes('wizard')) return 'wizard';
        if (id.includes('artificer')) return 'artificer';
        if (id.includes('rogue')) return 'rogue';
        if (id.includes('paladin')) return 'paladin';
        if (id.includes('ranger')) return 'ranger';
        return 'ranger';
    }, [genome?.id, genome?.archetype]);
    
    // 1. Load the Base Model (The Skin)
    const baseModelPath = CLASS_MODELS[characterClass] || CLASS_MODELS.ranger;
    const { scene: baseScene } = useGLTF(baseModelPath);
    
    // 2. Load the Animation Template (The Skeleton/Motion)
    // CRITICAL: If the base model ALREADY has animations (Meshy AI merged), use them!
    const { animations: baseAnimations } = useGLTF(baseModelPath);
    
    const actionKey = action.toLowerCase();
    const animTemplatePath = (characterClass === 'rogue') 
        ? (ROGUE_ANIM_MAP[actionKey] || ROGUE_ANIM_MAP['idle'])
        : (SHARED_ANIMS[actionKey] || SHARED_ANIMS['idle']);
        
    const { animations: templateAnimations } = useGLTF(animTemplatePath);
    
    // Choose animations: 
    // We merge base animations with template animations so the engine has both available.
    // This allows manual mappings to point to internal clips, while defaults can still find the safe templates.
    const finalAnimations = useMemo(() => {
        // We put templates FIRST so that safe names like 'Walking' are found 
        // before potentially broken internal model clips.
        return [...templateAnimations, ...baseAnimations];
    }, [baseAnimations, templateAnimations]);
    
    // 3. Clone and Graft
    const clonedScene = useMemo(() => SkeletonUtils.clone(baseScene), [baseScene]);
    const { actions } = useAnimations(finalAnimations, clonedScene);
    
    const groupRef = useRef<THREE.Group>(null);
    const rotationRef = useRef<THREE.Group>(null);
    const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);

    // 🧭 Stable Quaternion Orientation Logic (Eliminates Gimbal Lock)
    useFrame((_state, delta) => {
        if (!rotationRef.current) return;
        const [vx, , vz] = velocity;
        
        if (Math.abs(vx) > 0.01 || Math.abs(vz) > 0.01) {
            const targetRotation = Math.atan2(vx, vz);
            targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
            rotationRef.current.quaternion.slerp(targetQuaternion, 0.15);
        }
    });

    // 🧬 Apply Purified Logics
    useAvatarModulation(clonedScene as any, genome, debugBones);
    useAvatarMaterials(clonedScene as any, genome);
    useAvatarAnimations(actions as any, animationOverride || action, {
        onAnimationsLoaded,
        characterClass,
        mapping: genome.animationMapping
    }, finalAnimations, animationIndexOverride);

    const modelOffset = useMemo(() => {
        const userPos = genome.dimensions?.position || [0, 0, 0];
        return [userPos[0], userPos[1], userPos[2]] as [number, number, number];
    }, [genome.dimensions?.position]);

    return (
        <group ref={groupRef} position={position}>
            <group ref={rotationRef}>
                <primitive 
                    object={clonedScene} 
                    scale={[scale, scale, scale]} 
                    position={modelOffset}
                />
            </group>
        </group>
    );
};

// Preload models
Object.values(CLASS_MODELS).forEach(path => useGLTF.preload(path));
Object.values(ROGUE_ANIM_MAP).forEach(path => useGLTF.preload(path));
Object.values(SHARED_ANIMS).forEach(path => useGLTF.preload(path));
