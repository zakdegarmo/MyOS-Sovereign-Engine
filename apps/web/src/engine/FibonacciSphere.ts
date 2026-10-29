/**
 * Ontological Header: FibonacciSphere.ts
 * Module: HyperAether / Astra Spatial Logic
 * Description: Generates uniform, non-overlapping 3D point distributions on a sphere 
 * using the golden angle (Fibonacci spiral projection).
 */

import * as THREE from 'three';

export interface FibonacciPointOptions {
    samples: number;
    radius?: number;
    center?: THREE.Vector3;
    hemisphereOnly?: boolean; // Top hemisphere (for sky domes or terrain features)
}

/**
 * Generates N evenly distributed 3D points on a sphere of radius R.
 * Uses the Golden Ratio (phi = pi * (3 - sqrt(5))) for optimal low-discrepancy sampling.
 */
export function getFibonacciSpherePoints(samples: number, radius: number = 1.0, center: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const phi = Math.PI * (3.0 - Math.sqrt(5.0)); // ~2.3999632 rad (137.5 degrees)

    for (let i = 0; i < samples; i++) {
        const y = 1.0 - (i / Math.max(1, samples - 1)) * 2.0; // y ranges from 1 to -1
        const r = Math.sqrt(Math.max(0, 1.0 - y * y));       // radius at height y
        const theta = phi * i;                              // golden angle increment

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        points.push(new THREE.Vector3(
            center.x + x * radius,
            center.y + y * radius,
            center.z + z * radius
        ));
    }

    return points;
}

/**
 * Generates points constrained to the upper hemisphere (y >= 0).
 * Great for skybox cyclotron nodes, dome lighting, or mountain feature distribution.
 */
export function getFibonacciHemispherePoints(samples: number, radius: number = 1.0, center: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const phi = Math.PI * (3.0 - Math.sqrt(5.0));

    for (let i = 0; i < samples; i++) {
        const y = 1.0 - (i / Math.max(1, samples - 1)); // y ranges from 1 to 0 (upper hemisphere)
        const r = Math.sqrt(Math.max(0, 1.0 - y * y));
        const theta = phi * i;

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        points.push(new THREE.Vector3(
            center.x + x * radius,
            center.y + y * radius,
            center.z + z * radius
        ));
    }

    return points;
}
