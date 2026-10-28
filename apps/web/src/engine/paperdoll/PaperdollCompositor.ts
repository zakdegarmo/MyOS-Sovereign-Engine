/**
 * PaperdollCompositor.ts
 * 
 * High-performance 0ms client-side 2.5D paperdoll layer compositor.
 * Stacks 7 modular transparent layers (base, emoteDecal, breeches, boots, tunic, belt, hair)
 * at 60 FPS (<16ms frame budget) with zero server-side latency.
 * 
 * Calibrates vertical grounding so mannequin soles touch ground plane (Y >= 118px in 128px tiles).
 * Masks rear facial decals for NW, N, NE angles.
 */

export type PaperdollDirection = 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE';
export type PaperdollAction = 'idle' | 'walk' | 'run';
export type PaperdollLayerKey = 'base' | 'emoteDecal' | 'breeches' | 'boots' | 'tunic' | 'belt' | 'hair';

export const PAPERDOLL_LAYER_ORDER: PaperdollLayerKey[] = [
  'base',
  'emoteDecal',
  'breeches',
  'boots',
  'tunic',
  'belt',
  'hair'
];

export interface PaperdollConfiguration {
  base: string;
  emoteDecal?: string;
  breeches?: string;
  boots?: string;
  tunic?: string;
  belt?: string;
  hair?: string;
  direction: PaperdollDirection;
  action: PaperdollAction;
  frameIndex: number;
}

export interface SpriteSliceCoordinates {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export const DIRECTION_ROW_MAP: Record<PaperdollDirection, number> = {
  'S': 0,
  'SW': 1,
  'W': 2,
  'NW': 3,
  'N': 4,
  'NE': 5,
  'E': 6,
  'SE': 7
};

export function computeSpriteCoordinates(
  direction: PaperdollDirection,
  frameIndex: number,
  tileSize: number = 128,
  canvasSize: number = 256,
  groundingOffsetY: number = 0
): SpriteSliceCoordinates {
  const row = DIRECTION_ROW_MAP[direction] ?? 0;
  const safeFrame = Number.isFinite(frameIndex)
    ? Math.max(0, Math.min(7, Math.floor(frameIndex)))
    : 0;

  const sx = safeFrame * tileSize;
  const sy = row * tileSize;
  const sw = tileSize;
  const sh = tileSize;

  const dx = 0;
  const dy = Number.isFinite(groundingOffsetY) ? groundingOffsetY : 0;
  const dw = canvasSize;
  const dh = canvasSize;

  return { sx, sy, sw, sh, dx, dy, dw, dh };
}

export function computeDecalProjection(
  direction: PaperdollDirection,
  headCenterX: number = 64,
  headCenterY: number = 32,
  radiusMeters: number = 0.18,
  angleYaw: number = 0
): { visible: boolean; x: number; y: number; scaleX: number; opacity: number } {
  const rearAngles: PaperdollDirection[] = ['NW', 'N', 'NE'];
  if (rearAngles.includes(direction)) {
    return { visible: false, x: headCenterX, y: headCenterY, scaleX: 0, opacity: 0 };
  }

  const yawRad = (angleYaw * Math.PI) / 180;
  const xOffset = Math.sin(yawRad) * (radiusMeters * 100);
  const clampedX = Math.max(-radiusMeters, Math.min(radiusMeters, xOffset / 100));

  // Spherical sagitta curvature calculation
  const sagitta = radiusMeters - Math.sqrt(Math.max(0, radiusMeters * radiusMeters - clampedX * clampedX));
  const yOffset = sagitta * 40;

  const cosYaw = Math.cos(yawRad);
  const scaleX = Math.max(0.2, Math.abs(cosYaw));
  const opacity = Math.max(0, Math.min(1, cosYaw * 0.8 + 0.2));

  return {
    visible: true,
    x: headCenterX + xOffset,
    y: headCenterY + yOffset,
    scaleX,
    opacity
  };
}

export class PaperdollEngine {
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private resolution: number;

  constructor(resolution: number = 256) {
    this.resolution = resolution;
  }

  public preloadAsset(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load asset: ${url}`));
      img.src = url;
    });
  }

  public getCachedAsset(url: string): HTMLImageElement | null {
    return this.imageCache.get(url) || null;
  }

  /**
   * Render complete paperdoll configuration onto target canvas
   */
  public composite(
    config: PaperdollConfiguration,
    targetCanvas: HTMLCanvasElement,
    groundingOffsetY: number = 12 // Default grounding offset for mannequin soles
  ): void {
    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.imageSmoothingEnabled = false; // Pixel-perfect crispness

    for (const layerKey of PAPERDOLL_LAYER_ORDER) {
      const assetUrl = config[layerKey];
      if (!assetUrl) continue;

      if (layerKey === 'emoteDecal') {
        const projection = computeDecalProjection(config.direction);
        if (!projection.visible) continue;

        const img = this.getCachedAsset(assetUrl);
        if (!img) continue;

        ctx.save();
        ctx.globalAlpha = projection.opacity;
        const coords = computeSpriteCoordinates(config.direction, config.frameIndex, 128, targetCanvas.width, groundingOffsetY);
        ctx.drawImage(
          img,
          coords.sx, coords.sy, coords.sw, coords.sh,
          coords.dx, coords.dy, coords.dw, coords.dh
        );
        ctx.restore();
      } else {
        const img = this.getCachedAsset(assetUrl);
        if (!img) continue;

        const coords = computeSpriteCoordinates(config.direction, config.frameIndex, 128, targetCanvas.width, groundingOffsetY);
        ctx.drawImage(
          img,
          coords.sx, coords.sy, coords.sw, coords.sh,
          coords.dx, coords.dy, coords.dw, coords.dh
        );
      }
    }
  }
}
