import * as THREE from 'three';

export interface RiggedPart {
    texture: THREE.Texture;
    heightPercentage: number;
    yOffset: number;
}

export interface SpriteRig {
    head: RiggedPart;
    torso: RiggedPart;
    legs: RiggedPart;
    fullTexture: THREE.CanvasTexture;
}

export class SpriteRigGenerator {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    }

    /**
     * Cleans a sprite slot from a sheet and returns a rigged version.
     * @param image The source spritesheet image
     * @param sx Source X
     * @param sy Source Y
     * @param sWidth Source width (e.g., 32px)
     * @param sHeight Source height (e.g., 32px)
     * @param backgroundColor Color to key out (default: #D7DCE2)
     */
    public generateRig(
        image: HTMLImageElement,
        sx: number,
        sy: number,
        sWidth: number,
        sHeight: number,
        backgroundColor: string = '#D7DCE2'
    ): SpriteRig {
        this.canvas.width = sWidth;
        this.canvas.height = sHeight;

        // 1. Draw Raw Segment
        this.ctx.clearRect(0, 0, sWidth, sHeight);
        this.ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

        // 2. Color Keying (Background Removal)
        const imgData = this.ctx.getImageData(0, 0, sWidth, sHeight);
        const data = imgData.data;
        const target = this.hexToRgb(backgroundColor);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Simple distance check to handle JPG compression noise
            const dist = Math.sqrt(
                Math.pow(r - target.r, 2) +
                Math.pow(g - target.g, 2) +
                Math.pow(b - target.b, 2)
            );

            if (dist < 40) {
                data[i + 3] = 0; // Set Alpha to 0
            }
        }
        this.ctx.putImageData(imgData, 0, 0);

        // 3. Silhouette Scanning (Finding true character height)
        let top = sHeight;
        let bottom = 0;
        for (let y = 0; y < sHeight; y++) {
            for (let x = 0; x < sWidth; x++) {
                const alpha = data[(y * sWidth + x) * 4 + 3];
                if (alpha > 0) {
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                }
            }
        }

        const fullTexture = new THREE.CanvasTexture(this.canvas);
        fullTexture.magFilter = THREE.NearestFilter;
        fullTexture.minFilter = THREE.NearestFilter;

        // 4. Create Partial Textures (Head, Torso, Legs)
        // We do this by cloning and setting offsets/repeats
        // Head: Top 35%, Torso: Middle 45%, Legs: Bottom 20%

        const createPart = (startPct: number, endPct: number, yOffset: number): RiggedPart => {
            const texture = fullTexture.clone();
            texture.needsUpdate = true;
            const h = (endPct - startPct);
            texture.repeat.set(1, h);
            texture.offset.set(0, 1 - endPct);
            return { texture, heightPercentage: h, yOffset };
        };

        return {
            head: createPart(0, 0.35, 0.4),
            torso: createPart(0.35, 0.8, 0.15),
            legs: createPart(0.8, 1.0, 0),
            fullTexture
        };
    }

    private hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 215, g: 220, b: 226 };
    }
}
