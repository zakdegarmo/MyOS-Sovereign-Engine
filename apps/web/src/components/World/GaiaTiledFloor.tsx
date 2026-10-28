/** @version 1.2.2-Gaia @timestamp 2026-04-08 03:41 @author Antigravity-Omni */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GaiaTiledFloorProps {
    radius: number;
}

/**
 * GaiaTiledFloor: Geodesic Scan Matrix.
 * ------------------------------------
 * High-fidelity holographic wireframe with a 'scanning' pulse that
 * emanates from the North Pole (player footprint).
 */
export const GaiaTiledFloor: React.FC<GaiaTiledFloorProps> = ({ radius }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const segmentWidthDegrees = 0.08;
    const segmentTheta = THREE.MathUtils.degToRad(segmentWidthDegrees);

    const floorGeom = useMemo(() => {
        return new THREE.SphereGeometry(
            radius,
            256, 128,
            0, Math.PI * 2,
            0, segmentTheta
        );
    }, [radius, segmentTheta]);

    // --- GEODESIC SCAN SHADER ---
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color("#2ecc71") },
                uRadius: { value: radius },
            },
            vertexShader: `
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPosition;
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uRadius;

                void main() {
                    // 1. Grid Logic (Higher frequency for Gaia scale)
                    float gridX = abs(sin(vPosition.x * 2.0));
                    float gridZ = abs(sin(vPosition.z * 2.0));
                    float grid = smoothstep(0.8, 0.95, gridX) + smoothstep(0.8, 0.95, gridZ);
                    grid = clamp(grid, 0.0, 1.0);

                    // 2. Holographic Pulse (Scanning out from North Pole)
                    float distFromPole = length(vPosition.xz);
                    float pulse = 0.5 + 0.5 * sin(distFromPole * 0.1 - uTime * 3.0);
                    
                    // 3. Horizon Fade (Fixed range for Gaia)
                    float fade = 1.0 - smoothstep(8000.0, 10000.0, distFromPole);

                    vec3 color = uColor * pulse * (0.2 + 0.8 * grid);
                    gl_FragColor = vec4(color, 0.7 * fade);
                }
            `,
            transparent: true,
            wireframe: true,
            side: THREE.DoubleSide
        });
    }, [radius]);

    useFrame((state) => {
        const mat = meshRef.current?.material as THREE.ShaderMaterial;
        if (mat && mat.uniforms && mat.uniforms.uTime) {
            mat.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <group name="Gaia_Geodesic_Matrix">
            <mesh geometry={floorGeom} material={material} ref={meshRef} name="gaia" />

            {/* PHYSICAL OCCLUSION LAYER */}
            <mesh geometry={floorGeom}>
                <meshBasicMaterial color="#000a05" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};
