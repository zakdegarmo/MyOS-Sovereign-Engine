import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Global cache to prevent memory leaks and redundant Image/Canvas allocation
const pixelDataCache = new Map<string, ImageData>();
const imageFetchQueue = new Map<string, Promise<ImageData>>();

interface AssetLayer {
    id: string;
    url: string;
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    visible: boolean;
    name: string;
}

interface VoxelData {
    localPos: THREE.Vector3;
    color: THREE.Color;
    state: 'attached' | 'loose';
    velocity: THREE.Vector3;
}

interface VoxelSpriteProps {
    layers: AssetLayer[];
    pixelScale?: number;
    onMassChange?: (mass: number) => void;
    impact?: boolean; 
    isVolumetric?: boolean; // New: Fill latent space between layers
}

export const VoxelSprite: React.FC<VoxelSpriteProps> = ({ 
    layers, 
    pixelScale = 0.05, 
    onMassChange,
    impact = false,
    isVolumetric = true 
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const [voxels, setVoxels] = useState<VoxelData[]>([]);
    const [isVoxelized, setIsVoxelized] = useState(false);
    
    const GRAVITY = -0.015;

    // --- Voxelization from Layers ---
    useEffect(() => {
        const voxelize = async () => {
            const pixelDataBuffer: ImageData[] = [];
            
            // 1. Fetch all layer pixel data first to allow gap filling
            for (const layer of layers) {
                if (!layer.visible) continue;
                try {
                    const pixels = await getPixelData(layer.url);
                    pixelDataBuffer.push(pixels);
                } catch (e) {
                    console.error("Voxelization: Fetch failed", e);
                }
            }

            // 2. Generate Voxels with Volumetric Filling
            const allVoxels: VoxelData[] = [];
            const LAYER_SPACING_VOXELS = 3; // Space between layers in pixel units

            for (let l = 0; l < pixelDataBuffer.length; l++) {
                const pixels = pixelDataBuffer[l];
                const layerWidth = pixels.width;
                const layerHeight = pixels.height;
                const data = pixels.data;
                const currentZ = l * LAYER_SPACING_VOXELS;

                const offsetX = -layerWidth / 2;
                const offsetY = layerHeight / 2;

                for (let y = 0; y < layerHeight; y++) {
                    for (let x = 0; x < layerWidth; x++) {
                        const idx = (y * layerWidth + x) * 4;
                        const alpha = data[idx + 3];

                        if (alpha > 128) {
                            // Surface Voxel
                            allVoxels.push({
                                localPos: new THREE.Vector3((x + offsetX) * pixelScale, -(y-offsetY) * pixelScale, currentZ * pixelScale),
                                color: new THREE.Color(data[idx]/255, data[idx+1]/255, data[idx+2]/255),
                                state: 'attached',
                                velocity: new THREE.Vector3()
                            });

                            // Latent Space Filling (Volume Validates between Layers)
                            if (isVolumetric && l < pixelDataBuffer.length - 1) {
                                const nextPixels = pixelDataBuffer[l + 1];
                                const nextIdx = (y * layerWidth + x) * 4;
                                if (nextIdx < nextPixels.data.length && nextPixels.data[nextIdx + 3] > 128) {
                                    for (let zOffset = 1; zOffset < LAYER_SPACING_VOXELS; zOffset++) {
                                        allVoxels.push({
                                            localPos: new THREE.Vector3((x + offsetX) * pixelScale, -(y-offsetY) * pixelScale, (currentZ + zOffset) * pixelScale),
                                            color: new THREE.Color(data[idx]/255, data[idx+1]/255, data[idx+2]/255),
                                            state: 'attached',
                                            velocity: new THREE.Vector3()
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            setVoxels(allVoxels);
            setIsVoxelized(true);
        };

        if (layers.length > 0 && !isVoxelized) {
            voxelize();
        }
    }, [layers, pixelScale, isVoxelized, isVolumetric]);

    // Track impact
    useEffect(() => {
        if (impact && isVoxelized) {
            triggerImpact();
        }
    }, [impact, isVoxelized]);

    const triggerImpact = (intensity: number = 0.1) => {
        setVoxels(prev => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const hitCount = Math.min(next.length, Math.floor(next.length * intensity)); 
            let loosened = 0;
            
            for (let i = 0; i < hitCount; i++) {
                const idx = Math.floor(Math.random() * next.length);
                if (next[idx].state === 'attached') {
                    next[idx].state = 'loose';
                    // Higher intensity = higher explosion velocity
                    const vScale = 0.05 + (intensity * 0.5);
                    next[idx].velocity.set(
                        (Math.random() - 0.5) * vScale,
                        Math.random() * vScale * 2,
                        (Math.random() - 0.5) * vScale
                    );
                    loosened++;
                }
            }
            
            const currentMass = next.filter(v => v.state === 'attached').length / next.length;
            onMassChange?.(currentMass);
            isDirtyRef.current = true;
            return next;
        });
    };

    const isDirtyRef = useRef(true);

    useFrame(() => {
        if (!meshRef.current || voxels.length === 0) return;

        const dummy = new THREE.Object3D();
        let needsUpdate = isDirtyRef.current;

        voxels.forEach((v, i) => {
            if (v.state === 'attached') {
                if (isDirtyRef.current) {
                    dummy.position.copy(v.localPos);
                    dummy.updateMatrix();
                    meshRef.current!.setMatrixAt(i, dummy.matrix);
                    meshRef.current!.setColorAt(i, v.color);
                }
            } else {
                // Physics loop for loose "matter"
                v.velocity.y += GRAVITY;
                v.localPos.add(v.velocity);
                
                // Ground collision
                if (v.localPos.y < -3) {
                    v.localPos.y = -3;
                    v.velocity.y *= -0.3;
                    v.velocity.multiplyScalar(0.9);
                }
                
                dummy.position.copy(v.localPos);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            meshRef.current.instanceMatrix.needsUpdate = true;
            if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
            isDirtyRef.current = false;
        }
    });

    if (!isVoxelized) return null;

    return (
        <group>
            <instancedMesh ref={meshRef} args={[undefined, undefined, voxels.length]}>
                <boxGeometry args={[pixelScale, pixelScale, pixelScale]} />
                <meshStandardMaterial roughness={0.5} metalness={0.1} />
            </instancedMesh>
        </group>
    );
};

// --- Helper Functions ---

async function getPixelData(url: string): Promise<ImageData> {
    // 1. Check cache first
    if (pixelDataCache.has(url)) return pixelDataCache.get(url)!;

    // 2. Check if a fetch is already in progress to avoid duplicates
    if (imageFetchQueue.has(url)) return imageFetchQueue.get(url)!;

    const promise = new Promise<ImageData>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                reject("Could not get canvas context");
                return;
            }
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height);
            
            // Clean up resources immediately
            canvas.width = 0;
            canvas.height = 0;
            img.onload = null;
            img.onerror = null;
            
            pixelDataCache.set(url, data);
            resolve(data);
        };
        img.onerror = (e) => {
            imageFetchQueue.delete(url);
            reject(e);
        };
        img.src = url;
    });

    imageFetchQueue.set(url, promise);
    return promise;
}
