import { useMemo, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import type { AvatarGenome } from './useAvatarCompositor';

const LPC_GRID_WIDTH = 13;
const LPC_GRID_HEIGHT = 21;
const TILE_SIZE = 64;

export const SHEET_WIDTH = LPC_GRID_WIDTH * TILE_SIZE; // 832
export const SHEET_HEIGHT = LPC_GRID_HEIGHT * TILE_SIZE; // 1344

export function useLpcTexture(genome: AvatarGenome) {
    const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
    const imageCache = useRef<Record<string, HTMLImageElement>>({});

    const getAsset = (layerName: string, assetName: string): HTMLImageElement | null => {
        if (!assetName || assetName === 'none') return null;
        
        let finalPath = '';
        if (assetName.startsWith('/')) {
            finalPath = assetName;
        } else if (assetName.includes('/')) {
            finalPath = `/textures/avatars/lpc/${assetName}`;
        } else {
            if (layerName === 'head') finalPath = `/textures/avatars/lpc/head/heads/${assetName}`;
            else if (layerName === 'body') finalPath = `/textures/avatars/lpc/body/bodies/${assetName}`;
            else if (layerName === 'torso') finalPath = `/assets/lpc/${assetName}`;
            else if (layerName === 'legs') finalPath = `/assets/lpc/${assetName}`;
            else if (layerName === 'feet') finalPath = `/assets/lpc/${assetName}`;
            else if (layerName === 'weapon' || layerName === 'offhand') finalPath = `/assets/lpc/${assetName}`;
            else finalPath = `/textures/avatars/lpc/${layerName}/${assetName}`;
        }
        
        let key = finalPath;

        if (imageCache.current[key]) {
            const img = imageCache.current[key];
            return (img.complete && img.naturalHeight !== 0) ? img : null;
        }

        const img = new window.Image();
        imageCache.current[key] = img;
        img.src = finalPath;
        
        // Smart Search logic fallback
        if (!assetName.includes('/')) {
            if (layerName === 'torso' && (assetName.includes('clothes_') || assetName.includes('torso_clothes'))) {
                img.src = `/textures/avatars/lpc/torso/clothes/${assetName}`;
            } else if (layerName === 'torso' && (assetName.includes('armor_') || assetName.includes('torso_armor') || assetName.includes('platemail') || assetName.includes('chainmail'))) {
                img.src = `/textures/avatars/lpc/torso/armor/${assetName}`;
            } else if (layerName === 'legs' && (assetName.includes('pants_') || assetName.includes('legs_pants'))) {
                img.src = `/textures/avatars/lpc/legs/pants/${assetName}`;
            } else if (layerName === 'legs' && (assetName.includes('armor_') || assetName.includes('legs_armor'))) {
                img.src = `/textures/avatars/lpc/legs/armor/${assetName}`;
            } else if (layerName === 'feet' && (assetName.includes('boots_') || assetName.includes('feet_boots'))) {
                img.src = `/textures/avatars/lpc/feet/boots/${assetName}`;
            }
        }

        img.onload = () => {
            // Force re-eval
        };

        return null;
    };

    const normalizeLayer = (key: string, assetName?: string): string => {
        if (assetName && assetName !== 'none') {
            const filename = assetName.split('/').pop() || '';
            if (filename.includes('_')) {
                const prefix = filename.split('_')[0].toLowerCase();
                if (prefix === 'arms') return 'arms';
                if (prefix === 'legs') return 'legs';
                if (prefix === 'torso') return 'torso';
                if (prefix === 'feet') return 'feet';
                if (prefix === 'hat') return 'hat';
                if (prefix === 'head') return 'head';
                return prefix;
            }
        }
        const mapping: Record<string, string> = {
            'bottoms': 'legs', 'footwear': 'feet', 'tops': 'torso', 'armor': 'arms', 'headwear': 'hat'
        };
        return mapping[key] || key;
    };

    useEffect(() => {
        let isCancelled = false;
        let animationFrameId: number;

        const COMP_ORDER: string[] = [
            'body', 'head', 'ears', 'nose', 'eyes', 'facial', 'legs', 'feet', 'torso', 'arms', 'shoulders', 'hair', 'hat', 'weapon', 'offhand'
        ];

        const requiredAssets = COMP_ORDER.map(layerKey => {
            const assetName = genome[layerKey];
            if (!assetName || assetName === 'none') return null;
            return { layerKey, folder: normalizeLayer(layerKey, assetName), assetName };
        }).filter(Boolean) as {layerKey: string, folder: string, assetName: string}[];

        const checkAndBake = () => {
            if (isCancelled) return;
            let allLoaded = true;
            for (const { folder, assetName } of requiredAssets) {
                if (!getAsset(folder, assetName)) {
                    allLoaded = false;
                }
            }

            if (!allLoaded) {
                animationFrameId = requestAnimationFrame(checkAndBake);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = SHEET_WIDTH;
            canvas.height = SHEET_HEIGHT;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.imageSmoothingEnabled = false;
            
            for (const { folder, assetName } of requiredAssets) {
                const img = getAsset(folder, assetName);
                if (img) {
                    ctx.drawImage(img, 0, 0);
                }
            }

            const newTexture = new THREE.CanvasTexture(canvas);
            newTexture.magFilter = THREE.NearestFilter;
            newTexture.minFilter = THREE.NearestFilter;
            // Ensure texture coordinates map top-to-bottom as expected by ThreeJS planes
            newTexture.flipY = false;

            if (!isCancelled) {
                setTexture(newTexture);
            }
        };

        checkAndBake();

        return () => {
            isCancelled = true;
            cancelAnimationFrame(animationFrameId);
        };
    }, [JSON.stringify(genome)]);

    return texture;
}
