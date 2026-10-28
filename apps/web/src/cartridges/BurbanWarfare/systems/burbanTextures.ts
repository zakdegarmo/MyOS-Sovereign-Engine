/**
 * BurbanWarfare/systems/burbanTextures.ts
 * 
 * High-definition 16-bit LucasArts pixel texture synthesizer & atlas loader.
 * Generates crisp, authentic retro materials with zero bilinear blur (NearestFilter).
 */

import * as THREE from 'three';

class BurbanTextureFactory {
    private cache: Map<string, THREE.CanvasTexture> = new Map();

    /**
     * Create crisp NearestFilter CanvasTexture
     */
    private createTexture(key: string, draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 128): THREE.CanvasTexture {
        if (this.cache.has(key)) return this.cache.get(key)!;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            draw(ctx, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        this.cache.set(key, texture);
        return texture;
    }

    /**
     * Lush Suburban Grass with Clover & Mower Stripes
     */
    public getGrassTexture(): THREE.CanvasTexture {
        return this.createTexture('suburban_grass', (ctx, size) => {
            // Base lawn greens
            ctx.fillStyle = '#2d6a4f';
            ctx.fillRect(0, 0, size, size);

            // Mower lawn stripes
            for (let y = 0; y < size; y += 16) {
                ctx.fillStyle = (y / 16) % 2 === 0 ? '#40916c' : '#1b4332';
                ctx.fillRect(0, y, size, 16);
            }

            // Pixel grass blades & clover details
            for (let i = 0; i < 400; i++) {
                const rx = Math.floor(Math.random() * size);
                const ry = Math.floor(Math.random() * size);
                const roll = Math.random();

                if (roll < 0.6) {
                    ctx.fillStyle = '#52b788';
                    ctx.fillRect(rx, ry, 2, 4);
                } else if (roll < 0.85) {
                    ctx.fillStyle = '#74c69d';
                    ctx.fillRect(rx, ry, 1, 3);
                } else if (roll < 0.95) {
                    // Dandelion / yellow weed flower
                    ctx.fillStyle = '#ffd166';
                    ctx.fillRect(rx, ry, 3, 3);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(rx + 1, ry + 1, 1, 1);
                } else {
                    // Small white clover
                    ctx.fillStyle = '#f8f9fa';
                    ctx.fillRect(rx, ry, 2, 2);
                }
            }
        }, 128);
    }

    /**
     * Asphalt Cul-de-Sac Road with Yellow Dashes & Cracks
     */
    public getRoadTexture(): THREE.CanvasTexture {
        return this.createTexture('suburban_road', (ctx, size) => {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, size, size);

            // Asphalt gravel grit
            for (let i = 0; i < 500; i++) {
                const rx = Math.floor(Math.random() * size);
                const ry = Math.floor(Math.random() * size);
                ctx.fillStyle = Math.random() > 0.5 ? '#334155' : '#0f172a';
                ctx.fillRect(rx, ry, 2, 2);
            }

            // Center yellow road line dashes
            ctx.fillStyle = '#fbbf24';
            for (let y = 8; y < size; y += 32) {
                ctx.fillRect(size / 2 - 2, y, 4, 18);
            }

            // Concrete curbs on borders
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(0, 0, 4, size);
            ctx.fillRect(size - 4, 0, 4, size);
        }, 128);
    }

    /**
     * Cedar Hedge Leaf Atlas
     */
    public getHedgeTexture(): THREE.CanvasTexture {
        return this.createTexture('cedar_hedge', (ctx, size) => {
            ctx.fillStyle = '#14532d';
            ctx.fillRect(0, 0, size, size);

            // Leaf clusters
            for (let i = 0; i < 600; i++) {
                const rx = Math.floor(Math.random() * size);
                const ry = Math.floor(Math.random() * size);
                const c = Math.random();
                ctx.fillStyle = c < 0.4 ? '#166534' : c < 0.8 ? '#15803d' : '#22c55e';
                ctx.fillRect(rx, ry, 3, 3);
            }
        }, 64);
    }

    /**
     * 16-Bit Suburban House Brick Siding & Windows
     */
    public getHouseFacadeTexture(): THREE.CanvasTexture {
        return this.createTexture('house_facade', (ctx, size) => {
            // Brick foundation
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(0, 0, size, size);

            // Brick mortar lines
            ctx.fillStyle = '#e2e8f0';
            for (let y = 0; y < size; y += 8) {
                ctx.fillRect(0, y, size, 1);
                const offset = (y / 8) % 2 === 0 ? 0 : 8;
                for (let x = offset; x < size; x += 16) {
                    ctx.fillRect(x, y, 1, 8);
                }
            }

            // Large glowing 90s picture window
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(24, 24, 80, 50);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(28, 28, 72, 42);
            // Window mullions
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(62, 28, 4, 42);
            ctx.fillRect(28, 48, 72, 4);
        }, 128);
    }

    /**
     * Roof Shingles Texture
     */
    public getRoofTexture(): THREE.CanvasTexture {
        return this.createTexture('roof_shingles', (ctx, size) => {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(0, 0, size, size);

            ctx.fillStyle = '#92400e';
            for (let y = 0; y < size; y += 12) {
                ctx.fillRect(0, y, size, 2);
                const offset = (y / 12) % 2 === 0 ? 0 : 10;
                for (let x = offset; x < size; x += 20) {
                    ctx.fillStyle = '#451a03';
                    ctx.fillRect(x, y, 2, 12);
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(x + 2, y + 2, 16, 8);
                }
            }
        }, 128);
    }

    /**
     * Swimming Pool Caustic Water Tile
     */
    public getPoolWaterTexture(): THREE.CanvasTexture {
        return this.createTexture('pool_water', (ctx, size) => {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(0, 0, size, size);

            // Shimmering caustics
            ctx.fillStyle = '#38bdf8';
            for (let i = 0; i < 200; i++) {
                const rx = Math.floor(Math.random() * size);
                const ry = Math.floor(Math.random() * size);
                ctx.fillRect(rx, ry, 6, 3);
            }
            ctx.fillStyle = '#bae6fd';
            for (let i = 0; i < 100; i++) {
                const rx = Math.floor(Math.random() * size);
                const ry = Math.floor(Math.random() * size);
                ctx.fillRect(rx, ry, 3, 2);
            }
        }, 128);
    }
}

export const burbanTextures = new BurbanTextureFactory();
