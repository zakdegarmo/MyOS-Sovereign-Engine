import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export type ParallaxGeometryType = 'cylinder' | 'sphere' | 'plane' | 'cone';

export interface ParallaxLayerSpec {
    id: string;
    geometryType?: ParallaxGeometryType;
    textureUrl: string;
    radius?: number;          // Cylinder/Sphere radius or Plane width
    height?: number;          // Cylinder/Sphere height or Plane height
    position?: [number, number, number];
    rotation?: [number, number, number];
    isStationary?: boolean;
    speedY?: number;          // Yaw rotation speed (rad/sec)
    speedX?: number;          // Pitch rotation speed (rad/sec)
    scrollUvX?: number;       // UV horizontal scroll speed
    scrollUvY?: number;       // UV vertical scroll speed
    opacity?: number;
    alphaTest?: number;
    repeatX?: number;
    repeatY?: number;
    color?: string;
    isLocalFx?: boolean;      // If true, position is absolute in world, not anchored to player
}

export interface ParallaxatronPreset {
    id: string;
    layers: ParallaxLayerSpec[];
}

export const PARALLAXATRON_PRESETS: Record<string, ParallaxLayerSpec[]> = {
    faerun_overland: [
        {
            id: 'overland_sky',
            geometryType: 'cylinder',
            textureUrl: '/assets/textures/parallax_sky_layer1.png',
            radius: 1200,
            height: 800,
            position: [0, 120, 0],
            isStationary: true,
            repeatX: 4,
            repeatY: 1
        },
        {
            id: 'overland_clouds',
            geometryType: 'cylinder',
            textureUrl: '/assets/textures/parallax_clouds_layer2.png',
            radius: 1000,
            height: 650,
            position: [0, 100, 0],
            isStationary: false,
            speedY: 0.006,
            opacity: 0.95,
            alphaTest: 0.05,
            repeatX: 3,
            repeatY: 1
        },
        {
            id: 'overland_creatures',
            geometryType: 'cylinder',
            textureUrl: '/assets/textures/parallax_creatures_layer3.png',
            radius: 800,
            height: 500,
            position: [0, 80, 0],
            isStationary: false,
            speedY: 0.015,
            opacity: 0.95,
            alphaTest: 0.05,
            repeatX: 3,
            repeatY: 1
        }
    ],
    yawning_portal: [
        {
            id: 'tavern_rafters',
            geometryType: 'cylinder',
            textureUrl: '/textures/stone_floor_2.jpg',
            radius: 40,
            height: 25,
            position: [0, 10, 0],
            isStationary: true,
            opacity: 0.9,
            repeatX: 6,
            repeatY: 2
        }
    ],
    fireball_vortex: [
        {
            id: 'fire_inner_core',
            geometryType: 'sphere',
            textureUrl: '/assets/textures/parallax_sky_layer1.png',
            radius: 4,
            position: [0, 2, 0],
            isStationary: false,
            speedY: 0.5,
            speedX: 0.3,
            color: '#ef4444',
            opacity: 0.9,
            isLocalFx: true
        },
        {
            id: 'fire_outer_plasma',
            geometryType: 'sphere',
            textureUrl: '/assets/textures/parallax_clouds_layer2.png',
            radius: 6,
            position: [0, 2, 0],
            isStationary: false,
            speedY: -0.8,
            color: '#f59e0b',
            opacity: 0.7,
            alphaTest: 0.05,
            isLocalFx: true
        }
    ]
};

interface ParallaxatronEngineProps {
    presetId?: string;
    customLayers?: ParallaxLayerSpec[];
    anchorPosition?: [number, number, number];
}

/**
 * Single Parallaxatron Layer Mesh Renderer with Multiplane Rotation & UV Motion
 */
const ParallaxLayerItem: React.FC<{
    spec: ParallaxLayerSpec;
    anchorPos: [number, number, number];
}> = ({ spec, anchorPos }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useTexture(spec.textureUrl);

    useMemo(() => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(spec.repeatX || 1, spec.repeatY || 1);
        if (!spec.alphaTest && !spec.opacity) {
            texture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [texture, spec.repeatX, spec.repeatY, spec.alphaTest, spec.opacity]);

    useFrame((_state, delta) => {
        if (!meshRef.current) return;

        // Position: Local FX uses absolute position; Environment rings track anchor position (Player Pos)
        if (!spec.isLocalFx) {
            const relPos = spec.position || [0, 0, 0];
            meshRef.current.position.set(
                anchorPos[0] + relPos[0],
                anchorPos[1] + relPos[1],
                anchorPos[2] + relPos[2]
            );
        } else if (spec.position) {
            meshRef.current.position.set(...spec.position);
        }

        // Multiplane Rotations (Yaw / Pitch)
        if (!spec.isStationary) {
            if (spec.speedY) meshRef.current.rotation.y += delta * spec.speedY;
            if (spec.speedX) meshRef.current.rotation.x += delta * spec.speedX;
        }

        // UV Scroll Motion
        if (spec.scrollUvX) texture.offset.x += delta * spec.scrollUvX;
        if (spec.scrollUvY) texture.offset.y += delta * spec.scrollUvY;
    });

    const geometry = useMemo(() => {
        const radius = spec.radius || 1000;
        const height = spec.height || 600;
        const type = spec.geometryType || 'cylinder';

        switch (type) {
            case 'sphere':
                return <sphereGeometry args={[radius, 32, 32]} />;
            case 'plane':
                return <planeGeometry args={[radius, height]} />;
            case 'cone':
                return <coneGeometry args={[radius, height, 32, 1, true]} />;
            case 'cylinder':
            default:
                return <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />;
        }
    }, [spec.geometryType, spec.radius, spec.height]);

    return (
        <mesh
            ref={meshRef}
            rotation={spec.rotation || [0, 0, 0]}
        >
            {geometry}
            <meshBasicMaterial
                map={texture}
                transparent={!!spec.alphaTest || (spec.opacity !== undefined && spec.opacity < 1.0)}
                alphaTest={spec.alphaTest || 0}
                opacity={spec.opacity !== undefined ? spec.opacity : 1.0}
                color={spec.color ? new THREE.Color(spec.color) : undefined}
                side={spec.geometryType === 'sphere' ? THREE.BackSide : THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

/**
 * ParallaxatronEngine
 * 
 * Standalone Cyclotronic Multiplane Parallax & Special Effects Engine for MyOS.
 * Renders arbitrary concentric parallax layers, spell vortexes, and localized FX.
 */
export const ParallaxatronEngine: React.FC<ParallaxatronEngineProps> = ({
    presetId = 'faerun_overland',
    customLayers,
    anchorPosition = [0, 0, 0]
}) => {
    const layers = useMemo(() => {
        if (customLayers && customLayers.length > 0) return customLayers;
        return PARALLAXATRON_PRESETS[presetId] || PARALLAXATRON_PRESETS.faerun_overland;
    }, [presetId, customLayers]);

    return (
        <group name="ParallaxatronEngine">
            {layers.map(layer => (
                <React.Suspense key={layer.id} fallback={null}>
                    <ParallaxLayerItem spec={layer} anchorPos={anchorPosition} />
                </React.Suspense>
            ))}
        </group>
    );
};
