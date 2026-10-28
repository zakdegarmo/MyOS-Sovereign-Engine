/** @version 1.1.0-Omni @timestamp 2026-04-06 18:45 @author Antigravity-Omni */
import * as THREE from 'three';

/**
 * GeodesicEngine
 * -------------------
 * Subdivides an Icosahedron to create a Goldberg Polyhedron (Hex/Pent grid).
 * Provides the 'Interlocked Prism' geometry for the Micro-Voxel world.
 */
export class GeodesicEngine {
    private radius: number;

    constructor(radius: number = 6371000) {
        this.radius = radius;
    }

    /**
     * Generates a single Geodesic Prism (Micro-Voxel) at a given (Lat, Lon).
     */
    public createPrismGeometry(height: number, isPentagon: boolean = false): THREE.BufferGeometry {
        const sides = isPentagon ? 5 : 6;
        const faceRadius = 1.0; // Normalized size per voxel
        const vertices: number[] = [];
        const indices: number[] = [];

        // --- TOP FACET (The Player's Floor) ---
        // Center of the top face
        vertices.push(0, height, 0); // index 0
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            vertices.push(Math.cos(angle) * faceRadius, height, Math.sin(angle) * faceRadius);
        }
        // Indices for the top face (Fan)
        for (let i = 1; i <= sides; i++) {
            indices.push(0, i, i % sides + 1);
        }

        // --- BOTTOM FACET (Inside the Earth) ---
        const baseIndex = sides + 1;
        vertices.push(0, 0, 0); // Center of bottom index
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            vertices.push(Math.cos(angle) * faceRadius, 0, Math.sin(angle) * faceRadius);
        }
        // Indices for the bottom face (Fan)
        for (let i = baseIndex + 1; i <= baseIndex + sides; i++) {
            indices.push(baseIndex, i % sides + baseIndex + 1, i);
        }

        // --- SIDE FACETS (The Interlocking Walls) ---
        for (let i = 0; i < sides; i++) {
            const t1 = i + 1;
            const t2 = i % sides + 1;
            const b1 = t1 + baseIndex;
            const b2 = t2 + baseIndex;

            // Quad for each side (two triangles)
            indices.push(t1, b1, t2);
            indices.push(t2, b1, b2);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }

    /**
     * Map a spherical coordinate to the nearest prism's normal and orientation.
     */
    public getPrismTransform(lat: number, lon: number): { position: THREE.Vector3, quaternion: THREE.Quaternion } {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = this.radius * Math.sin(phi) * Math.cos(theta);
        const y = this.radius * Math.cos(phi);
        const z = this.radius * Math.sin(phi) * Math.sin(theta);

        const position = new THREE.Vector3(x, y, z);
        const up = new THREE.Vector3(0, 1, 0);
        const normal = position.clone().normalize();
        
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

        return { position, quaternion };
    }
}

export const geodesicEngine = new GeodesicEngine();
