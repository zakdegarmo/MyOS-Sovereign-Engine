import { useEffect } from 'react';
import * as THREE from 'three';
import { type ProceduralGenome } from '../utils/ManifestationAlgorithm';

/**
 * useAvatarMaterials
 * 
 * Logic for material mapping and color identity based on ProceduralGenome.
 */
export function useAvatarMaterials(clonedScene: THREE.Group, genome: ProceduralGenome) {
    useEffect(() => {
        if (!clonedScene) return;

        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
                const oldMat = child.material as THREE.MeshStandardMaterial;
                const newMat = new THREE.MeshStandardMaterial({
                    map: oldMat.map,
                    color: new THREE.Color(genome.colors.primary),
                    roughness: 0.6,
                    metalness: 0.1,
                    emissive: new THREE.Color(genome.colors.primary),
                    emissiveIntensity: 0.05
                });
                
                const name = child.name.toLowerCase();
                if (name.includes('hair')) {
                    newMat.color.set(genome.colors.hair);
                    newMat.emissive.set(genome.colors.hair);
                } else if (name.includes('skin') || name.includes('body')) {
                    newMat.color.set(genome.colors.skin);
                    newMat.emissive.set('#000000');
                    newMat.emissiveIntensity = 0;
                } else if (name.includes('eye')) {
                    newMat.color.set('#ffffff');
                    newMat.emissive.set('#ffffff');
                } else if (name.includes('cloak') || name.includes('robe') || name.includes('cloth')) {
                    newMat.color.set(genome.colors.secondary);
                } else if (name.includes('metal') || name.includes('armor')) {
                    newMat.color.set(genome.colors.accent);
                    newMat.metalness = 0.8;
                    newMat.roughness = 0.2;
                }
                
                child.material = newMat;
                child.frustumCulled = false;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [clonedScene, genome.colors]);
}
