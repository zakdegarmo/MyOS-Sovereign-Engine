import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * useAvatarCompositor.ts
 * 
 * Shared hook for LPC (Liberated Pixel Cup) avatar compositing.
 * Handles:
 * - Deterministic layering and rendering.
 * - Spritesheet animation frames.
 * - Color tinting for layers (skin, hair, clothes).
 * - "Refined Pixel" high-fidelity rendering.
 * - Category normalization for miscategorized assets.
 */

export const GENOME_LAYERS = [
    'body', 'legs', 'torso', 'hair', 'feet', 'hat', 'head', 'nose', 'ears', 'eyes', 'facial', 'shoulders', 'arms', 'weapon', 'offhand'
] as const;

export type GenomeLayer = typeof GENOME_LAYERS[number];
export type AvatarGenome = Record<string, string>;

export interface AtlasAction {
    row: number;
    frames: number;
    loop?: boolean;
    duration?: number;
    directionalOffset?: Record<string, number>;
}

export interface AtlasDefinition {
    grid: { width: number; height: number };
    actions: Record<string, AtlasAction>;
    directions?: Record<string, number>;
}

import type { KinesicVector } from '../components/MaxOverlay/types';

export interface CompositorOptions {
    resolution?: number;
    scale?: number;
    tint?: Record<string, string>;
    showGlow?: boolean;
    onRender?: () => void;
    allowRunningActions?: boolean;
    atlas?: AtlasDefinition;
    inkStyle?: 'default' | 'bold' | 'none';
    contrast?: number;
    celLevels?: number;
    isMounted?: boolean;
    horseType?: number;
}

const DEFAULT_RESOLUTION = 256;

export interface NeoRetroOptions {
    bloom?: number;
    scanlines?: boolean;
    pixelGrid?: boolean;
    chromaticAberration?: number;
    outlineColor?: string;
    thickness?: number;
}

export type LpcAction = 'idle' | 'walk' | 'slash' | 'thrust' | 'spellcast' | 'bow' | 'hurt' | 'jump' | 'agreeing' | 'dismissing_gesture' | 'combat_idle' | 'dance' | 'talk' | 'sprint' | 'run' | 'death' | 'clothing_layer';

export function useAvatarCompositor(
    genome: AvatarGenome,
    action: LpcAction = 'idle',
    direction: 'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR' = 'D',
    animProgressRef: React.MutableRefObject<number>,
    options: CompositorOptions & { neoRetro?: NeoRetroOptions } = {}
) {
    const resolution = options.resolution || DEFAULT_RESOLUTION;
    const canvas = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = resolution;
        c.height = resolution;
        return c;
    }, [resolution]);

    const [assetsLoadTick, setAssetsLoadTick] = useState(0);
    const imageCache = useRef<Record<string, HTMLImageElement>>({});

    const getAsset = useCallback((layerName: string, assetName: string, currentAction?: LpcAction): HTMLImageElement | null => {
        if (!assetName || assetName === 'none') return null;
        
        let finalPath = '';
        
        if (assetName.includes('horse_')) {
            const hType = assetName.split('_')[1] || '1';
            const suffix = assetName.split('_')[2] || 'eb.png';
            finalPath = `/assets/lpc/LPC_ride_0.9.0/${hType}/${suffix}`;
        } else if (assetName.includes('LPC_weapons_pack')) {
            const actionFolder = currentAction || 'idle';
            
            // The LPC weapons pack limits verbs. If it's an unsupported action (like idle or walk), skip loading to prevent 404 spam.
            const validWeaponActions = ['slash', 'thrust', 'shoot', 'bigslash', 'bigthrust', 'shield'];
            if (!validWeaponActions.includes(actionFolder)) {
                return null;
            }

            const bodyGenome = genome['body'] || '';
            const gender = bodyGenome.includes('female') ? 'female' : 'male';
            
            // Extract the actual filename (e.g., "1.png") from the potentially prefixed ID
            const filename = assetName.split('/').pop() || '';
            
            // Reconstruct high-fidelity path
            finalPath = `/assets/lpc/LPC_weapons_pack/LPC_weapons_pack/${gender}/${actionFolder}/${filename}`;
        } else if (assetName.startsWith('/') || assetName.startsWith('actions/')) {
            finalPath = assetName.startsWith('/') ? assetName : `/${assetName}`;
        } else if (assetName.startsWith('adult_universal_') || assetName.startsWith('animate_') || assetName.endsWith('_shield.png') || assetName.startsWith('assets/')) {
            finalPath = assetName.startsWith('assets/') ? `/${assetName}` : `/assets/lpc/${assetName}`;
        } else if (assetName.includes('/')) {
            finalPath = `/textures/avatars/lpc/${assetName}`;
        } else {
            if (layerName === 'head') {
                if (assetName.startsWith('head_nose') || assetName.startsWith('nose_')) {
                    finalPath = `/textures/avatars/lpc/head/nose/${assetName}`;
                } else if (assetName.startsWith('head_ears') || assetName.startsWith('ears_')) {
                    finalPath = `/textures/avatars/lpc/head/ears/${assetName}`;
                } else {
                    finalPath = `/textures/avatars/lpc/head/heads/${assetName}`;
                }
            } else if (layerName === 'body') {
                finalPath = `/textures/avatars/lpc/body/bodies/${assetName}`;
            } else if (layerName === 'torso') {
                if (assetName.startsWith('torso_armour')) {
                    finalPath = `/textures/avatars/lpc/torso/armour/${assetName}`;
                } else if (assetName.startsWith('torso_aprons')) {
                    finalPath = `/textures/avatars/lpc/torso/aprons/${assetName}`;
                } else if (assetName.startsWith('torso_clothes')) {
                    finalPath = `/textures/avatars/lpc/torso/clothes/${assetName}`;
                } else {
                    finalPath = `/assets/lpc/${assetName}`;
                }
            } else if (layerName === 'legs') {
                if (assetName.startsWith('legs_armour')) {
                    finalPath = `/textures/avatars/lpc/legs/armour/${assetName}`;
                } else if (assetName.startsWith('legs_cuffed')) {
                    finalPath = `/textures/avatars/lpc/legs/cuffed/${assetName}`;
                } else {
                    finalPath = `/assets/lpc/${assetName}`;
                }
            } else if (layerName === 'feet') {
                if (assetName.startsWith('feet_armour')) {
                    finalPath = `/textures/avatars/lpc/feet/armour/${assetName}`;
                } else if (assetName.startsWith('feet_boots')) {
                    finalPath = `/textures/avatars/lpc/feet/boots/${assetName}`;
                } else {
                    finalPath = `/assets/lpc/${assetName}`;
                }
            } else if (layerName === 'weapon' || layerName === 'offhand') {
                if (assetName.startsWith('weapon_magic')) {
                    finalPath = `/textures/avatars/lpc/weapon/magic/${assetName}`;
                } else {
                    finalPath = `/assets/lpc/${assetName}`;
                }
            } else {
                finalPath = `/textures/avatars/lpc/${layerName}/${assetName}`;
            }
        }
        let key = finalPath;

        if (imageCache.current[key]) {
            const img = imageCache.current[key];
            return (img.complete && img.naturalHeight !== 0) ? img : null;
        }

        const img = new window.Image();
        imageCache.current[key] = img;
        img.src = finalPath;

        // Smart Search logic for base layers...
        if (!assetName.includes('/') && !assetName.includes('LPC_weapons_pack')) {
            if (layerName === 'head') {
                if (assetName.includes('head_heads') || assetName.includes('heads_')) {
                    img.src = `/textures/avatars/lpc/head/heads/${assetName}`;
                } else if (assetName.includes('nose_') || assetName.includes('head_nose')) {
                    img.src = `/textures/avatars/lpc/head/nose/${assetName}`;
                } else if (assetName.includes('ears_') || assetName.includes('head_ears')) {
                    img.src = `/textures/avatars/lpc/head/ears/${assetName}`;
                }
            } else if (layerName === 'body') {
                if (assetName.includes('bodies_') || assetName.includes('body_bodies')) {
                    img.src = `/textures/avatars/lpc/body/bodies/${assetName}`;
                }
            } else if (layerName === 'torso') {
                if (assetName.includes('clothes_') || assetName.includes('torso_clothes')) {
                    img.src = `/textures/avatars/lpc/torso/clothes/${assetName}`;
                } else if (assetName.includes('armor_') || assetName.includes('torso_armor') || assetName.includes('platemail') || assetName.includes('chainmail') || assetName.includes('underdress') || assetName.includes('leathertorso')) {
                    img.src = `/textures/avatars/lpc/torso/armor/${assetName}`;
                }
            } else if (layerName === 'legs') {
                if (assetName.includes('pants_') || assetName.includes('legs_pants') || assetName.includes('heropants')) {
                    img.src = `/textures/avatars/lpc/legs/pants/${assetName}`;
                } else if (assetName.includes('armor_') || assetName.includes('legs_armor') || assetName.includes('plategreaves') || assetName.includes('goldengreaves')) {
                    img.src = `/textures/avatars/lpc/legs/armor/${assetName}`;
                }
            } else if (layerName === 'feet') {
                if (assetName.includes('boots_') || assetName.includes('feet_boots') || assetName.includes('goldenboots')) {
                    img.src = `/textures/avatars/lpc/feet/boots/${assetName}`;
                }
            }
        }

        img.onload = () => setAssetsLoadTick(prev => prev + 1);
        img.onerror = () => {
            console.warn(`Failed to load asset: ${img.src}, trying /assets/lpc/${assetName}`);
            img.onerror = null; // Prevent infinite loop
            if (!img.src.includes('/assets/lpc/')) {
                img.src = `/assets/lpc/${assetName}`;
            }
        };

        return null;
    }, []);

    // Helper to map genome keys to actual folders in the NEW Monorepo structure
    const normalizeLayer = (key: string, assetName?: string): string => {
        // 1. If we have an assetName, the prefix is the absolute truth
        if (assetName && assetName !== 'none') {
            // Strip any folder prefix first (e.g. "body/body_male.png" -> "body_male.png")
            const filename = assetName.split('/').pop() || '';
            if (filename.includes('_')) {
                const prefix = filename.split('_')[0].toLowerCase();
                // Map legacy prefixes to our new curated folders if needed
                if (['arms', 'legs', 'torso', 'feet', 'hat', 'head', 'hair', 'eyes', 'facial', 'weapon', 'offhand', 'shoulders', 'body'].includes(prefix)) {
                    return prefix;
                }
                if (prefix === 'nose' || prefix === 'ears') return 'head';
            }
        }

        // 2. Fallback to mapping the genome key to the most likely directory
        const mapping: Record<string, string> = {
            'bottoms': 'legs',
            'footwear': 'feet',
            'tops': 'torso',
            'armor': 'arms',
            'headwear': 'hat',
            'nose': 'head',
            'mouth': 'head',
            'cape': 'torso',
            'aura': 'hair'
        };
        return mapping[key] || key;
    };

    const genomeKey = JSON.stringify(genome);
    const tintKey = options.tint ? JSON.stringify(options.tint) : '';
    const onRenderCb = options.onRender;

    // --- PERSISTENT SCRUB POOL (OOM Fix) ---
    const tintCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const finalDrawCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const glowCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastRenderKeyRef = useRef<string>('');

    const getScrubCanvas = (ref: React.MutableRefObject<HTMLCanvasElement | null>, res: number) => {
        if (!ref.current) {
            ref.current = document.createElement('canvas');
        }
        if (ref.current.width !== res) {
            ref.current.width = res;
            ref.current.height = res;
        }
        const ctx = ref.current.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, res, res);
        }
        return ref.current;
    };

    const draw = useCallback(() => {
        const currentProgress = animProgressRef.current;
        // High-precision step quantization (72 steps) to ensure 6, 8, 9, 12, and 13 frame animations update every frame cleanly
        const step = Math.floor((currentProgress % 1.0) * 72) % 72;
        const renderKey = `${genomeKey}_${action}_${direction}_${step}_${assetsLoadTick}_${options.contrast || 1}_${options.inkStyle || 'none'}`;
        if (lastRenderKeyRef.current === renderKey) return;
        lastRenderKeyRef.current = renderKey;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.clearRect(0, 0, resolution, resolution);
        ctx.imageSmoothingEnabled = resolution >= 256;
        ctx.imageSmoothingQuality = 'high';

        const actionRowBase: Record<string, number> = {
            spellcast: 0,
            thrust: 4,
            walk: 8,
            sprint: 8,
            run: 8,
            slash: 12,
            bow: 16,
            hurt: 20,
            idle: 8,
            jump: 8
        };

        const dirOffset: Record<string, number> = { 
            'U': 0, 'L': 1, 'D': 2, 'R': 3,
            'UL': 1, 'UR': 3, 'DL': 2, 'DR': 2
        };
        const actionFrames: Record<string, number> = {
            spellcast: 7,
            thrust: 8,
            walk: 9,
            sprint: 8,
            run: 8,
            slash: 6,
            bow: 13,
            hurt: 6,
            idle: 1,
            jump: 9
        };

        const SRC_SIZE = 64;
        const destSize = resolution;

        const COMP_ORDER: string[] = [
            'body', 'head', 'ears', 'nose', 'eyes', 'facial', 'legs', 'feet', 'torso', 'arms', 'shoulders', 'hair', 'hat', 'weapon', 'offhand'
        ];

        const kv = options.kinesicVector;
        const eyeOffset = kv ? kv.eyeShiftY * 4 : 0;
        const eyeScale = kv ? (1 + kv.eyeWidening * 0.2) : 1;

        const parsedGenome = JSON.parse(genomeKey);
        const parsedTint = tintKey ? JSON.parse(tintKey) : null;

        const hType = options.horseType || 1;
        const isMounted = options.isMounted;

        // --- MOUNTED COMPOSITING PASS ---
        const drawHorseLayer = (destCtx: CanvasRenderingContext2D, layer: string) => {
            const hImg = getAsset('horse', `horse_${hType}_${layer}.png`);
            if (!hImg) return;
            const hRow = dirOffset[direction];
            const hFrames = actionFrames['walk'];
            const hFrameIdx = Math.floor(animProgressRef.current * (hFrames - 1));
            destCtx.drawImage(hImg, hFrameIdx * 64, hRow * 64, 64, 64, 0, 0, resolution, resolution);
        };

        if (isMounted) {
            drawHorseLayer(ctx, 'eb'); // Equine Back
            drawHorseLayer(ctx, 'sb'); // Saddle Back
            drawHorseLayer(ctx, 'rb'); // Rein Back
            ctx.save();
            ctx.translate(0, -4); 
        }

        COMP_ORDER.forEach(layerKey => {
            const assetName = parsedGenome[layerKey];
            if (!assetName || assetName === 'none') return;
            
            if (isMounted && (layerKey === 'legs' || layerKey === 'feet')) return;

            const folder = normalizeLayer(layerKey, assetName);
            
            let activeAction = action;
            if (action !== 'walk' && action !== 'idle' && (layerKey === 'legs' || layerKey === 'feet')) {
                if (options.allowRunningActions) {
                    activeAction = 'walk';
                }
            }

            const img = getAsset(folder, assetName, activeAction);
            if (!img) return;

            let row = 0;
            let numFrames = 1;
            let frameIndex = 0;

            // Robust LPC Tile size calculation:
            // Standard LPC is 64x64 tiles (13 cols = 832px width, 12 cols = 768px, 8 cols = 512px)
            // True HD 3D LPC is 128x128 tiles (13 cols = 1664px width, 12 cols = 1536px width)
            // Standalone 8x8 Action Atlases (1024x1024 = 128px tiles, 2048x2048 = 256px tiles)
            let currentTileWidth = 64;
            let currentTileHeight = 64;

            if (options.atlas) {
                const atlas = options.atlas;
                const atlasAction = atlas.actions[activeAction] || atlas.actions['idle'] || Object.values(atlas.actions)[0];
                const dirO = atlas.directions?.[direction] ?? atlasAction?.directionalOffset?.[direction] ?? 0;
                row = (atlasAction?.row ?? 0) + dirO;
                numFrames = atlasAction?.frames ?? 8;
                frameIndex = Math.floor((animProgressRef.current % 1.0) * numFrames) % numFrames;
                currentTileWidth = atlas.grid.width || 128;
                currentTileHeight = atlas.grid.height || 128;
            } else if ((img.naturalWidth === 1024 && img.naturalHeight === 1024) || (img.naturalWidth === 2048 && img.naturalHeight === 2048)) {
                // Standalone 8x8 Action Atlas (8 directions x 8 frames, 128px or 256px tiles)
                const matrixTileSize = img.naturalWidth / 8;
                currentTileWidth = matrixTileSize;
                currentTileHeight = matrixTileSize;
                // Filmed Matrix Rows: 0:S, 1:SW, 2:W, 3:NW, 4:N, 5:NE, 6:E, 7:SE
                const eightWayDirRows: Record<string, number> = {
                    'D': 0, 'DL': 1, 'L': 2, 'UL': 3,
                    'U': 4, 'UR': 5, 'R': 6, 'DR': 7
                };
                row = eightWayDirRows[direction] ?? 0;
                numFrames = 8;
                frameIndex = Math.floor((animProgressRef.current % 1.0) * 8) % 8;
            } else if ((img.naturalWidth === 1024 && img.naturalHeight === 512) || (img.naturalWidth === 2048 && img.naturalHeight === 1024)) {
                // 128x128 or 256x256 4-Row Directional Action Sheet (8 frames x 4 directions: 0:U, 1:L, 2:D, 3:R)
                const tileDim = img.naturalHeight / 4; // 512 / 4 = 128px, 1024 / 4 = 256px
                currentTileWidth = tileDim;
                currentTileHeight = tileDim;
                // LPC Standard 4-direction row mapping: 0:North(U), 1:West(L), 2:South(D), 3:East(R)
                const fourDirRows: Record<string, number> = {
                    'U': 0, 'UL': 1, 'L': 1, 'DL': 2,
                    'D': 2, 'DR': 2, 'R': 3, 'UR': 3
                };
                row = fourDirRows[direction] ?? 2;
                numFrames = 8;
                frameIndex = Math.floor((animProgressRef.current % 1.0) * 8) % 8;
            } else if (img.naturalWidth >= 1500 && img.naturalWidth % 128 === 0 && img.naturalHeight >= 2000) {
                // True HD 128x128 LPC Master Spritesheet (13 cols x 21+ rows -> 1664x2688+)
                currentTileWidth = 128;
                currentTileHeight = 128;
                let calculatedRow = (actionRowBase[activeAction] ?? 8) + (dirOffset[direction] ?? 2);
                row = calculatedRow;
                numFrames = actionFrames[activeAction] || 8;
                frameIndex = activeAction === 'idle' ? 0 : Math.floor((animProgressRef.current % 1.0) * numFrames) % numFrames;
            } else if (img.naturalWidth >= 512 && img.naturalWidth % 64 === 0) {
                // Standard 64x64 Classic LPC Spritesheet (e.g. 832x1344, 832x2944, 768x1344, 512x256)
                currentTileWidth = 64;
                currentTileHeight = 64;
                const maxSheetRows = Math.floor(img.naturalHeight / 64);
                if (maxSheetRows <= 4) {
                    // 4-row stance sheet (0:U, 1:L, 2:D, 3:R)
                    row = dirOffset[direction] ?? 2;
                } else {
                    row = (actionRowBase[activeAction] ?? 8) + (dirOffset[direction] ?? 2);
                }
                numFrames = actionFrames[activeAction] || 8;
                frameIndex = activeAction === 'idle' ? 0 : Math.floor((animProgressRef.current % 1.0) * numFrames) % numFrames;
            } else if (img.naturalWidth === 256 && img.naturalHeight === 256) {
                // 4-Quadrant 2x2 Stance (128x128 per quad: 0:U, 1:L, 2:D, 3:R)
                currentTileWidth = 128;
                currentTileHeight = 128;
                const quadDir: Record<string, { col: number, row: number }> = {
                    'U': { col: 0, row: 0 },
                    'L': { col: 1, row: 0 },
                    'D': { col: 0, row: 1 },
                    'R': { col: 1, row: 1 }
                };
                const q = quadDir[direction] || { col: 0, row: 1 };
                frameIndex = q.col;
                row = q.row;
                numFrames = 1;
            } else {
                // Fallback for smaller or single asset textures
                currentTileWidth = img.naturalWidth;
                currentTileHeight = img.naturalHeight;
                row = 0;
                numFrames = 1;
                frameIndex = 0;
            }

            // Safe bounded sampling to avoid clipping or sampling out-of-bounds tiles
            const maxCols = Math.max(1, Math.floor(img.naturalWidth / currentTileWidth));
            const maxRows = Math.max(1, Math.floor(img.naturalHeight / currentTileHeight));
            const safeFrameIdx = Math.min(frameIndex, maxCols - 1);
            const safeRowIdx = Math.min(row, maxRows - 1);

            const isFullSheet = img.naturalWidth > currentTileWidth || img.naturalHeight > currentTileHeight;
            const srcX = isFullSheet ? safeFrameIdx * currentTileWidth : 0;
            const srcY = isFullSheet ? safeRowIdx * currentTileHeight : 0;

            // Grounding Alignment Offset:
            // Action sheets rendered from the mannequin rig (Larry, flesh_base_mannequin, flesh_adventurer)
            // have an empty bottom air gap (e.g. Larry's feet end at y=208 vs Einstein/Lunaria at y=244 out of 256).
            // We shift these down so their shoes plant flush on the shadow ellipse and match Einstein's baseline.
            let groundOffset = 0;
            if (/larry/i.test(img.src)) {
                groundOffset = Math.round(destSize * (36 / 256));
            } else if (/flesh_base_mannequin|humanoid_mannequin/i.test(img.src)) {
                groundOffset = Math.round(destSize * (48 / 256));
            } else if (/flesh_adventurer/i.test(img.src)) {
                groundOffset = Math.round(destSize * (45 / 256));
            }

            const drawLayer = (destCtx: CanvasRenderingContext2D) => {
                let sW = currentTileWidth;
                let sH = currentTileHeight;
                let dW = destSize;
                let dH = destSize;

                if (!isFullSheet) {
                    sW = img.naturalWidth;
                    sH = img.naturalHeight;
                    const scale = Math.min(destSize / sW, destSize / sH);
                    dW = sW * scale;
                    dH = sH * scale;
                    const offX = (destSize - dW) / 2;
                    const offY = (destSize - dH) / 2;

                    if (parsedTint && parsedTint[layerKey]) {
                        const tCanvas = getScrubCanvas(tintCanvasRef, sW);
                        const tCtx = tCanvas.getContext('2d', { willReadFrequently: true });
                        if (tCtx) {
                            tCtx.drawImage(img, 0, 0, sW, sH, 0, 0, sW, sH);
                            tCtx.globalCompositeOperation = 'source-atop';
                            tCtx.fillStyle = parsedTint[layerKey];
                            tCtx.fillRect(0, 0, sW, sH);
                            tCtx.globalCompositeOperation = 'multiply';
                            tCtx.drawImage(img, 0, 0, sW, sH, 0, 0, sW, sH);
                            destCtx.drawImage(tCanvas, 0, 0, sW, sH, offX, offY + groundOffset, dW, dH);
                        }
                    } else {
                        destCtx.drawImage(img, 0, 0, sW, sH, offX, offY + groundOffset, dW, dH);
                    }
                    return;
                }

                if (parsedTint && parsedTint[layerKey]) {
                    const tCanvas = getScrubCanvas(tintCanvasRef, currentTileWidth);
                    const tCtx = tCanvas.getContext('2d', { willReadFrequently: true });
                    if (tCtx) {
                        tCtx.drawImage(img, srcX, srcY, currentTileWidth, currentTileHeight, 0, 0, currentTileWidth, currentTileHeight);
                        tCtx.globalCompositeOperation = 'source-atop';
                        tCtx.fillStyle = parsedTint[layerKey];
                        tCtx.fillRect(0, 0, currentTileWidth, currentTileHeight);
                        tCtx.globalCompositeOperation = 'multiply';
                        tCtx.drawImage(img, srcX, srcY, currentTileWidth, currentTileHeight, 0, 0, currentTileWidth, currentTileHeight);
                        destCtx.drawImage(tCanvas, 0, 0, currentTileWidth, currentTileHeight, 0, groundOffset, destSize, destSize);
                    }
                } else {
                    if (layerKey === 'eyes' && kv) {
                        const centerX = destSize / 2;
                        const centerY = destSize / 2;
                        destCtx.save();
                        destCtx.translate(0, eyeOffset + groundOffset);
                        destCtx.translate(centerX, centerY);
                        destCtx.scale(eyeScale, eyeScale);
                        destCtx.translate(-centerX, -centerY);
                        destCtx.drawImage(img, srcX, srcY, currentTileWidth, currentTileHeight, 0, groundOffset, destSize, destSize);
                        destCtx.restore();
                    } else {
                        destCtx.drawImage(img, srcX, srcY, currentTileWidth, currentTileHeight, 0, groundOffset, destSize, destSize);
                    }
                }
            };

            if (layerKey.includes('aura')) {
                ctx.globalAlpha = 0.5;
                drawLayer(ctx);
                ctx.globalAlpha = 1.0;
            } else {
                drawLayer(ctx);
            }
        });

        if (isMounted) {
            ctx.restore();
            // 3. Front
            drawHorseLayer(ctx, 'ef'); // Equine Front
            drawHorseLayer(ctx, 'sf'); // Saddle Front
            drawHorseLayer(ctx, 'rf'); // Rein Front
        }

        if (kv && kv.mouthOpen > 0.6) {
            const mouthImg = getAsset('body', 'body_wound_mouth.png');
            if (mouthImg) {
                const row = actionRowBase[action] + dirOffset[direction];
                const frameIndex = action === 'idle' ? 0 : Math.floor(animProgressRef.current * (actionFrames[action] - 1));
                ctx.drawImage(mouthImg, frameIndex * SRC_SIZE, row * SRC_SIZE, SRC_SIZE, SRC_SIZE, 0, 0, resolution, resolution);
            }
        }

        if (options.inkStyle && options.inkStyle !== 'none') {
            const tCanvas = getScrubCanvas(tempCanvasRef, resolution);
            const tempCtx = tCanvas.getContext('2d', { willReadFrequently: true });
            if (tempCtx) {
                tempCtx.imageSmoothingEnabled = false;
                tempCtx.drawImage(canvas, 0, 0);
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = '#111';
                tempCtx.fillRect(0, 0, resolution, resolution);

                const thickness = options.inkStyle === 'bold' ? 2 : 1;
                const fCanvas = getScrubCanvas(finalDrawCanvasRef, resolution);
                const finalDraw = fCanvas.getContext('2d', { willReadFrequently: true })!;
                finalDraw.imageSmoothingEnabled = false;

                for (let x = -thickness; x <= thickness; x++) {
                    for (let y = -thickness; y <= thickness; y++) {
                        if (x === 0 && y === 0) continue;
                        finalDraw.drawImage(tCanvas, x, y);
                    }
                }
                finalDraw.drawImage(canvas, 0, 0);

                if (options.contrast || options.celLevels) {
                    const imageData = finalDraw.getImageData(0, 0, resolution, resolution);
                    const data = imageData.data;
                    const contrast = options.contrast || 1.1;
                    const levels = options.celLevels || 6;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] < 10) continue;
                        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
                        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
                        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));
                        if (options.celLevels) {
                            const bucketSize = 256 / levels;
                            data[i] = Math.round(data[i] / bucketSize) * bucketSize;
                            data[i + 1] = Math.round(data[i + 1] / bucketSize) * bucketSize;
                            data[i + 2] = Math.round(data[i + 2] / bucketSize) * bucketSize;
                        }
                    }
                    finalDraw.putImageData(imageData, 0, 0);
                }
                ctx.clearRect(0, 0, resolution, resolution);
                ctx.drawImage(fCanvas, 0, 0);
            }
        }

        if (options.showGlow !== false) {
            const gCanvas = getScrubCanvas(glowCanvasRef, resolution);
            const gCtx = gCanvas.getContext('2d', { willReadFrequently: true });
            if (gCtx) {
                gCtx.imageSmoothingEnabled = true;
                gCtx.filter = 'blur(8px) brightness(1.5)';
                gCtx.drawImage(canvas, 0, 0);
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = 0.3;
                ctx.drawImage(gCanvas, 0, 0);
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        const cX = resolution * 0.5;
        const cY = resolution * 0.88;
        ctx.ellipse(cX, cY, resolution * 0.18, resolution * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // --- NEO-RETRO HD-2D POST-PROCESSING ---
        if (options.neoRetro) {
            const neo = options.neoRetro;
            const fCanvas = getScrubCanvas(finalDrawCanvasRef, resolution);
            const fCtx = fCanvas.getContext('2d', { willReadFrequently: true })!;
            fCtx.imageSmoothingEnabled = false;
            fCtx.drawImage(canvas, 0, 0);

            // 1. Chromatic Aberration
            if (neo.chromaticAberration) {
                const shift = neo.chromaticAberration * (resolution / 64);
                ctx.clearRect(0, 0, resolution, resolution);
                ctx.globalCompositeOperation = 'screen';
                
                // Red Channel
                ctx.globalAlpha = 1.0;
                ctx.filter = `matrix(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0)`;
                ctx.drawImage(fCanvas, -shift, 0);
                
                // Green Channel
                ctx.filter = `matrix(0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0)`;
                ctx.drawImage(fCanvas, 0, 0);
                
                // Blue Channel
                ctx.filter = `matrix(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0)`;
                ctx.drawImage(fCanvas, shift, 0);
                
                ctx.globalCompositeOperation = 'source-over';
                ctx.filter = 'none';
            }

            // 2. Scanlines / Pixel Grid
            if (neo.scanlines || neo.pixelGrid) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                const step = resolution / 64;
                for (let i = 0; i < resolution; i += step) {
                    if (neo.scanlines) ctx.fillRect(0, i, resolution, 1);
                    if (neo.pixelGrid) ctx.fillRect(i, 0, 1, resolution);
                }
            }

            // 3. Bloom / Glow
            if (neo.bloom) {
                const bCanvas = getScrubCanvas(glowCanvasRef, resolution);
                const bCtx = bCanvas.getContext('2d')!;
                bCtx.filter = `blur(${neo.bloom}px) brightness(1.5) saturate(1.5)`;
                bCtx.drawImage(canvas, 0, 0);
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = 0.4;
                ctx.drawImage(bCanvas, 0, 0);
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        if (onRenderCb) onRenderCb();
    }, [canvas, genomeKey, action, direction, resolution, getAsset, tintKey, options.showGlow, assetsLoadTick, onRenderCb, options.kinesicVector, options.atlas, options.allowRunningActions, options.inkStyle, options.contrast, options.celLevels, options.neoRetro]);

    useEffect(() => {
        draw();
    }, [draw]);

    return {
        canvas,
        isLoaded: assetsLoadTick > 0,
        draw
    };
}
