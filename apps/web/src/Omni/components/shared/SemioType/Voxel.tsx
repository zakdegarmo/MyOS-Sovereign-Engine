import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color, Mesh } from 'three';
import type { VoxelData, FontSettings } from './types';

// Extend JSX.IntrinsicElements to include R3F elements
declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}

interface VoxelProps {
    data: VoxelData;
    settings: FontSettings;
    mousePos: React.MutableRefObject<Vector3>;
}

const Voxel: React.FC<VoxelProps> = ({ data, settings, mousePos }) => {
    const meshRef = useRef<Mesh>(null);

    // Physics state
    const position = useRef(new Vector3(data.x, data.y, data.z));
    const velocity = useRef(new Vector3(0, 0, 0));
    const target = useMemo(() => new Vector3(data.originX, data.originY, data.originZ), [data]);

    // Random offset for organic movement
    const randomOffset = useMemo(() => Math.random() * 100, []);

    // Compute color based on settings
    const baseColor = useMemo(() => {
        return new Color(data.color);
    }, [data.color]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // 1. Calculate forces
        const force = new Vector3(0, 0, 0);

        // Spring force to return to target (Hooke's Law)
        const displacement = new Vector3().subVectors(target, position.current);
        const springForce = displacement.multiplyScalar(settings.returnSpeed);
        force.add(springForce);

        // Mouse Repulsion (Interactive Physics)
        const distToMouse = position.current.distanceTo(mousePos.current);
        // Radius of influence
        const influenceRadius = 4;

        if (distToMouse < influenceRadius) {
            const repulsionDir = new Vector3().subVectors(position.current, mousePos.current).normalize();
            // Inverse square law-ish for explosion feeling
            const repulsionStrength = (influenceRadius - distToMouse) * settings.explosionForce;
            force.add(repulsionDir.multiplyScalar(repulsionStrength));
        }

        // Floating/Breathing effect when idle
        if (distToMouse > influenceRadius) {
            force.y += Math.sin(state.clock.elapsedTime * 2 + randomOffset) * 0.5;
        }

        // 2. Integration (Euler)
        // Apply drag
        velocity.current.multiplyScalar(settings.drag);
        // Apply force to velocity
        velocity.current.add(force.multiplyScalar(delta));
        // Apply velocity to position
        position.current.add(velocity.current.multiplyScalar(delta * 20)); // Scaling for visual speed

        // 3. Update Mesh
        meshRef.current.position.copy(position.current);

        // Rotate based on velocity for dynamic feel
        meshRef.current.rotation.x = velocity.current.z * 0.1;
        meshRef.current.rotation.z = -velocity.current.x * 0.1;

        // Scale pulse on impact
        const speed = velocity.current.length();
        const scale = settings.voxelSize + (speed * 0.05);
        meshRef.current.scale.setScalar(Math.min(scale, settings.voxelSize * 1.5));

        // Dynamic coloring based on velocity
        if (settings.colorMode === 'gradient') {
            const intensity = Math.min(speed * 0.5, 1);
            meshRef.current.material.color.lerpColors(baseColor, new Color('#ffffff'), intensity);
        } else {
            meshRef.current.material.color.set(baseColor);
        }
    });

    // Render different geometry based on settings
    // Radius for polyhedrons is roughly half size to match cube visual weight
    const radius = settings.voxelSize * 0.6;

    return (
        <mesh ref={meshRef} position={[data.x, data.y, data.z]}>
            {settings.voxelGeometry === 'cube' && (
                <boxGeometry args={[settings.voxelSize, settings.voxelSize, settings.voxelSize]} />
            )}
            {settings.voxelGeometry === 'sphere' && (
                <sphereGeometry args={[radius, 16, 16]} />
            )}
            {settings.voxelGeometry === 'tetra' && (
                <tetrahedronGeometry args={[radius, 0]} />
            )}
            {settings.voxelGeometry === 'octa' && (
                <octahedronGeometry args={[radius, 0]} />
            )}
            {settings.voxelGeometry === 'icosa' && (
                <icosahedronGeometry args={[radius, 0]} />
            )}

            <meshStandardMaterial
                color={baseColor}
                roughness={0.2}
                metalness={0.8}
                emissive={baseColor}
                emissiveIntensity={0.2}
                flatShading={settings.voxelGeometry !== 'sphere'} // Smooth shading for spheres only
            />
        </mesh>
    );
};

export default Voxel;
