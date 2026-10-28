import * as THREE from 'three';

// Helper: Canvas-based shape generator (High Res "Pixel" Shapes)
// This technique ensures ANY unicode character can be rendered as a 3D shape.
function createShapesFromSystemFont(char: string): THREE.Shape[] {
    const size = 256;
    const padding = 40;
    const canvas = document.createElement('canvas'); // Not attached to DOM, invisible
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Use a robust font stack for symbols
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size - padding * 2}px "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const shapes: THREE.Shape[] = [];

    // Resolution for the geometry (64x64 produces good detail without too many polys)
    const resolution = 64;
    const step = size / resolution;

    // Helper to check if a block has enough "white"
    const hasColor = (sx: number, sy: number) => {
        if (sx < 0 || sx >= size || sy < 0 || sy >= size) return false;
        const idx = (Math.floor(sy) * size + Math.floor(sx)) * 4;
        return data[idx] > 100; // Red channel check
    };

    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            // Sample center of the grid block
            const sx = x * step + step / 2;
            const sy = y * step + step / 2;

            if (hasColor(sx, sy)) {
                const rect = new THREE.Shape();
                // Map to World Coords (Centered)
                // x: 0..resolution -> -0.5..0.5
                const wx = (x / resolution) - 0.5;
                const wy = ((resolution - y) / resolution) - 0.5; // Flip Y
                const wSize = 1 / resolution;

                // A slight overlap helps merge adjacent faces visually
                const o = 0.05;
                // Multiply by 10 to give it reasonable size
                rect.moveTo(wx * 10, wy * 10);
                rect.lineTo((wx + wSize) * 10 + o, wy * 10);
                rect.lineTo((wx + wSize) * 10 + o, (wy + wSize) * 10 + o);
                rect.lineTo(wx * 10, (wy + wSize) * 10 + o);
                rect.closePath();
                shapes.push(rect);
            }
        }
    }
    return shapes;
}

// Cache for generated geometries to prevent duplicates
const geometryCache: Record<string, THREE.BufferGeometry> = {};

export function createUniglyphGeometry(char: string, depth: number = 0.5): THREE.BufferGeometry {
    const cacheKey = `${char}_${depth}`;
    if (geometryCache[cacheKey]) {
        return geometryCache[cacheKey].clone();
    }

    const shapes = createShapesFromSystemFont(char);

    if (shapes.length === 0) {
        // Fallback for whitespace or invisible chars
        const box = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        geometryCache[cacheKey] = box;
        return box;
    }

    const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: depth,
        bevelEnabled: false, // Clean straight extrusion
    });

    // Center geometry
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    if (geometry.boundingBox) {
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);
    }

    geometryCache[cacheKey] = geometry;
    return geometry;
}
