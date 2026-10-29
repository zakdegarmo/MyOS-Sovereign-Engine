import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { BodyPartName } from './VoxelAvatar';

// --- Geometry Generators ---

// 1. Trapezoid (Prism) Logic for Hips/Torso
// We can use Cylinder with 4 radial segments to make a box/pyramid
const createTrapezoid = (widthTop: number, widthBot: number, height: number, depth: number) => {
    // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
    // We want a box, so radialSegments = 4.
    // Rotate it 45 deg to align flat sides?
    const geo = new THREE.CylinderGeometry(widthTop, widthBot, height, 4);
    geo.rotateY(Math.PI / 4); // Align flat side to Z
    geo.scale(1, 1, depth / widthTop); // Flatten depth
    return geo;
};

// 2. Wedge for Hands/Feet
const createWedge = (width: number, length: number, thickness: number) => {
    // Box Geometry tapering to tip?
    // Using simple Box for now, or Cylinder with 3 segments (Prism)
    const geo = new THREE.CylinderGeometry(0, width, length, 4);
    geo.translate(0, length / 2, 0); // Base at origin
    geo.scale(1, 1, thickness / width);
    return geo;
};

export const BoneMesh = ({ part, width, height, realLength }: { part: BodyPartName, width: number, height: number, realLength?: number }) => {

    const isLimb = part.includes('Leg') || part.includes('Arm');
    const len = realLength || height;

    // Materials
    const boneMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.3,
        metalness: 0.0,
    }), []);

    const jointMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#94a3b8', // Darker joint
        roughness: 0.5,
        metalness: 0.2,
    }), []);


    // --- Specific Shapes ---

    if (part === 'Head') {
        // Simple Sphere
        return (
            <mesh material={boneMaterial}>
                <sphereGeometry args={[height * 0.4, 24, 24]} />
            </mesh>
        );
    }

    if (part === 'Neck') {
        // Short Cylinder
        return (
            <mesh position={[0, len / 2, 0]} material={boneMaterial}>
                <cylinderGeometry args={[width * 0.8, width, len, 16]} />
            </mesh>
        );
    }

    if (part === 'Torso' || part === 'Spine') {
        // Square/Wedge
        // Let's use a Box or clean Cylinder
        return (
            <mesh position={[0, len / 2, 0]} material={boneMaterial}>
                <boxGeometry args={[width * 2, len, width]} />
            </mesh>
        );
    }

    if (part === 'Hips') {
        // Trapezoid (Wide end up)
        // Cylinder with 4 segs, top wider than bottom
        return (
            <mesh position={[0, 0, 0]} material={boneMaterial}>
                <cylinderGeometry args={[width, width * 0.5, height, 4]} />
            </mesh>
        );
    }

    if (part.includes('Shoulder')) {
        // Sphere or Short Cylinder
        return (
            <mesh position={[0, len / 2, 0]} material={boneMaterial}>
                <sphereGeometry args={[width, 16, 16]} />
            </mesh>
        );
    }

    if (part.includes('Hand') || part.includes('Foot')) {
        // Wedge
        // A simple box scaled
        return (
            <mesh position={[0, len / 2, 0]} material={boneMaterial}>
                <boxGeometry args={[width, len, width * 0.3]} />
            </mesh>
        );
    }

    // Limbs (Arms / Legs) - Cylinder with Joints
    if (isLimb) {
        return (
            <group>
                {/* Joint (Sphere/Tetrahedron) at Origin */}
                <mesh material={jointMaterial}>
                    <sphereGeometry args={[width * 0.7, 16, 16]} />
                </mesh>

                {/* Shaft (Cylinder) */}
                <mesh position={[0, len / 2, 0]} material={boneMaterial}>
                    <cylinderGeometry args={[width * 0.5, width * 0.5, len, 12]} />
                </mesh>
            </group>
        );
    }

    // Default Fallback
    return (
        <mesh material={jointMaterial}>
            <sphereGeometry args={[width * 0.5, 16, 16]} />
        </mesh>
    );
};
