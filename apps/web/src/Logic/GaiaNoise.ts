/** @version 1.1.0-Omni @timestamp 2026-04-06 18:45 @author Antigravity-Omni */
import { createNoise2D } from 'simplex-noise';
import Alea from 'alea';

/**
 * GaiaNoise Engine
 * -------------------
 * Provides deterministic, seeded Simplex Noise for the planetary heightmap.
 * Every (Lat, Lon) coordinate maps to a stable elevation.
 */
export class GaiaNoise {
    private elevationNoise: (x: number, y: number) => number;
    private moistureNoise: (x: number, y: number) => number;
    private seed: string;

    constructor(seed: string = 'MYOS_GAIA_PRIME_V2') {
        this.seed = seed;
        this.elevationNoise = createNoise2D(Alea(seed + '_ELEVATION'));
        this.moistureNoise = createNoise2D(Alea(seed + '_MOISTURE'));
    }

    /**
     * Get the biome data for a specific spherical coordinate.
     * Maps to a specific LPC terrain-map-v7 tile ID.
     */
    public getTileData(lat: number, lon: number): { height: number, tileID: number } {
        // Landscape frequency scale. 
        // 0.02 makes it rolling hills. 0.1 makes it jagged and small.
        const scale = 0.04; 
        
        const nx = lat * scale;
        const ny = lon * scale;

        // 1. ELEVATION NOISE (Octaves)
        let e = 0;
        e += 1.00 * this.elevationNoise(nx, ny);
        e += 0.50 * this.elevationNoise(nx * 2, ny * 2);
        e += 0.25 * this.elevationNoise(nx * 4, ny * 4);
        e = e / (1.00 + 0.50 + 0.25); // Normalize to [-1, 1]
        
        // Push negative elevations toward 0 (more ocean/flat areas), curve positive up (mountains)
        e = Math.pow(Math.abs(e), 1.5) * Math.sign(e); 

        // 2. MOISTURE NOISE (Octaves)
        let m = 0;
        m += 1.00 * this.moistureNoise(nx * 0.8, ny * 0.8);
        m += 0.50 * this.moistureNoise(nx * 2.5, ny * 2.5);
        m = m / (1.00 + 0.50); // Normalize to [-1, 1]

        // 3. BIOME RESOLUTION & HEIGHT SCALING
        let height = 0;
        let tileID = 5; // Default: Grass

        // Height Map
        // Scale the normalized elevation into actual Y engine units
        // If elevation < 0, it's an ocean (height 0). 
        // If > 0, it's land (height goes up to 40).
        if (e <= 0) {
            height = 0;
        } else {
            // Stepped terraces (Minecraft style blocks)
            height = Math.floor(e * 40);
        }

        // BIOME MAPPING matrix (Elevation x Moisture)
        // LPC IDs: Water=28, Sand=22, Grass=5, Dirt=0, Rock=19, Snow=23
        if (e <= 0) {
            // Ocean
            tileID = 28; // Water
        } else if (e < 0.1) {
            // Beaches / Swamps
            if (m < 0.2) tileID = 22; // Sand
            else tileID = 0; // Dirt (Swampy coast)
        } else if (e < 0.6) {
            // Plains / Forests / Badlands
            if (m < -0.3) tileID = 22; // Desert Sand inland
            else if (m < 0.5) tileID = 5; // Grass
            else tileID = 0; // Deep Dirt/Forest floor
        } else if (e < 0.85) {
            // Mountains
            if (m < 0) tileID = 19; // Bare Rock
            else tileID = 23; // Snowy lower peak
        } else {
            // High Peaks
            tileID = 23; // Snow
        }

        return { height, tileID };
    }

    /**
     * Backward-compatibility wrapper for any old height calls
     */
    public getHeight(lat: number, lon: number): number {
        return this.getTileData(lat, lon).height;
    }

    /**
     * Get a unique pseudo-random value for a coordinate (for 'Thing' placement)
     */
    public getSeedAt(lat: number, lon: number): number {
        const prng = Alea(`${this.seed}_${lat}_${lon}`);
        return prng();
    }
}

export const gaiaNoise = new GaiaNoise();
