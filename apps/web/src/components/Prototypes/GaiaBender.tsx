/** @version 1.1.0-Omni @timestamp 2026-04-06 03:05 @author Antigravity-Omni */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GaiaBender Prototype
 * -------------------
 * Demonstrates the "Spherical Sector" geometry of an Earth-sized world (R=6.37M).
 * The player stays at the center (0,0,0) and the world geometry 'bends' down
 * based on the planetary curvature.
 */
export const GaiaBender: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const EARTH_RADIUS = 6371000;
    const RENDER_DISTANCE = 2000;
    const GRID_DIVISIONS = 40;

    // --- GAIA ENGINE SHADER MATH ---
    // This shader calculates the Earth's curvature displacement per vertex.
    const shaderArgs = useMemo(() => ({
        uniforms: {
            uRadius: { value: EARTH_RADIUS },
            uColor: { value: new THREE.Color('#00ffcc') },
            uOpacity: { value: 0.3 }
        },
        vertexShader: `
            uniform float uRadius;
            varying float vDist;
            
            void main() {
                // Calculate distance from center (Player position)
                vec3 worldPos = (instanceMatrix * vec4(position, 1.0)).xyz;
                float d = length(position.xz);
                
                // SPHERICAL DISPLACEMENT MATH
                // The Drop (h) = R - sqrt(R^2 - d^2)
                float drop = uRadius - sqrt(max(0.0, uRadius * uRadius - d * d));
                
                vec3 transformed = position;
                transformed.y -= drop;
                
                vDist = d;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vDist;
            
            void main() {
                // Fade out at the horizon (The edge of the Cone Sector)
                float fade = 1.0 - smoothstep(1500.0, 2000.0, vDist);
                gl_FragColor = vec4(uColor, uOpacity * fade);
            }
        `
    }), [EARTH_RADIUS]);

    return (
        <group name="GaiaBender_Prototype">
            {/* The Earth Sector Plane (Wireframe) */}
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[RENDER_DISTANCE * 2, RENDER_DISTANCE * 2, GRID_DIVISIONS, GRID_DIVISIONS]} />
                <shaderMaterial 
                    {...shaderArgs} 
                    transparent 
                    wireframe 
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Visualizer for the "Monitoring Cone" Apex - representing Earth's Center */}
            {/* Note: Scaled down for visualization, but represents the radius-down point */}
            <mesh position={[0, -5, 0]}>
                <coneGeometry args={[2, 10, 32]} rotation={[Math.PI, 0, 0]} />
                <meshBasicMaterial color="#ff0055" wireframe />
            </mesh>
            
            <ambientLight intensity={0.5} />
        </group>
    );
};
