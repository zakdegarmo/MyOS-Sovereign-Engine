/**
 * BurbanWarfare/systems/burbanMaterials.ts
 * 
 * Pre-cached static Three.js materials for 0-allocation high-framerate rendering.
 */

import * as THREE from 'three';

const createPixelTexture = (draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
        ctx.imageSmoothingEnabled = false;
        draw(ctx);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
};

// 1. Enemy Textures
const zombieTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(20, 12, 24, 18);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(24, 18, 6, 4);
    ctx.fillRect(34, 18, 6, 4);
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(16, 30, 32, 18);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(22, 34, 8, 4);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(20, 48, 10, 14);
    ctx.fillRect(34, 48, 10, 14);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(8, 32, 8, 8);
    ctx.fillRect(48, 32, 8, 8);
});

const mephitTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.ellipse(32, 32, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(24, 24, 6, 6);
    ctx.fillRect(34, 24, 6, 6);
    ctx.fillStyle = '#4c1d95';
    ctx.fillRect(6, 20, 12, 16);
    ctx.fillRect(46, 20, 12, 16);
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(28, 40, 8, 8);
});

const chainsawTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(20, 8, 24, 20);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(24, 14, 4, 4);
    ctx.fillRect(36, 14, 4, 4);
    ctx.fillRect(30, 20, 4, 4);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(12, 28, 40, 24);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(20, 32, 8, 10);
    ctx.fillRect(34, 40, 10, 6);
    ctx.fillStyle = '#475569';
    ctx.fillRect(46, 24, 16, 10);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(52, 22, 10, 3);
    ctx.fillRect(52, 34, 10, 3);
});

const flamingoTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(24, 16, 16, 24);
    ctx.fillRect(36, 8, 8, 16);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(44, 10, 8, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(38, 10, 3, 3);
    ctx.fillStyle = '#475569';
    ctx.fillRect(28, 40, 3, 20);
});

const alienTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(18, 14, 28, 26);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(22, 18, 8, 12);
    ctx.fillRect(34, 18, 8, 12);
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(28, 34, 8, 8);
});

// 2. Neighbor Textures
const bbqTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(20, 4, 24, 14);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(22, 18, 20, 12);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(24, 24, 16, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(16, 30, 32, 22);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(26, 36, 12, 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(46, 20, 6, 22);
    ctx.fillRect(42, 18, 14, 4);
});

const cheerleaderTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#fde047';
    ctx.fillRect(18, 8, 28, 16);
    ctx.fillRect(12, 12, 8, 14);
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(22, 18, 20, 12);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(18, 30, 28, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 44, 28, 10);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(8, 28, 10, 10);
    ctx.fillRect(46, 28, 10, 10);
});

const dogTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(16, 24, 32, 20);
    ctx.fillRect(36, 14, 18, 16);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(32, 16, 8, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(50, 20, 6, 6);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(10, 18, 8, 8);
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(48, 26, 6, 6);
});

const chemistTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(20, 8, 24, 12);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(22, 16, 20, 12);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(24, 18, 6, 6);
    ctx.fillRect(34, 18, 6, 6);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(18, 28, 28, 24);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(44, 34, 10, 14);
});

const grandmaTex = createPixelTexture((ctx) => {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(20, 6, 24, 16);
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(22, 18, 20, 12);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(24, 20, 16, 4);
    ctx.fillStyle = '#9333ea';
    ctx.fillRect(18, 30, 28, 26);
});

export const burbanMaterials = {
    enemies: {
        shuffler: new THREE.MeshBasicMaterial({ map: zombieTex, transparent: true, side: THREE.DoubleSide }),
        toxic_mephit: new THREE.MeshBasicMaterial({ map: mephitTex, transparent: true, side: THREE.DoubleSide }),
        chainsaw_clone: new THREE.MeshBasicMaterial({ map: chainsawTex, transparent: true, side: THREE.DoubleSide }),
        lawn_ghoul: new THREE.MeshBasicMaterial({ map: flamingoTex, transparent: true, side: THREE.DoubleSide }),
        alien_spitter: new THREE.MeshBasicMaterial({ map: alienTex, transparent: true, side: THREE.DoubleSide }),
        hitFlash: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
    },
    neighbors: {
        bbq_dad: new THREE.MeshBasicMaterial({ map: bbqTex, transparent: true, side: THREE.DoubleSide }),
        cheerleader: new THREE.MeshBasicMaterial({ map: cheerleaderTex, transparent: true, side: THREE.DoubleSide }),
        doggo: new THREE.MeshBasicMaterial({ map: dogTex, transparent: true, side: THREE.DoubleSide }),
        science_kid: new THREE.MeshBasicMaterial({ map: chemistTex, transparent: true, side: THREE.DoubleSide }),
        trampoline_grandma: new THREE.MeshBasicMaterial({ map: grandmaTex, transparent: true, side: THREE.DoubleSide })
    },
    shadow: new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35 }),
    healthBarRed: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
    beaconReady: new THREE.MeshBasicMaterial({ color: '#facc15', transparent: true, opacity: 0.85 }),
    beaconDistress: new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.9 })
};
