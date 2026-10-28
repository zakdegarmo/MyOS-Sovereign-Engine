/** @version 1.2.3-Faerun @timestamp 2026-04-11 09:50 @author Antigravity-Omni */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FaerunFloorProps {
    radius: number;
}

export const FaerunFloor: React.FC<FaerunFloorProps> = ({ radius }) => {
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
                    float gridX = abs(sin(vPosition.x * 0.2));
                    float gridZ = abs(sin(vPosition.z * 0.2));
                    float grid = smoothstep(0.8, 0.95, gridX) + smoothstep(0.8, 0.95, gridZ);
                    grid = clamp(grid, 0.0, 1.0);

                    float distFromPole = length(vPosition.xz);
                    float pulse = 0.5 + 0.5 * sin(distFromPole * 0.01 - uTime * 3.0);
                    
                    float fade = 1.0 - smoothstep(100.0, 500.0, distFromPole);

                    vec3 color = uColor * pulse * (0.2 + 0.8 * grid);
                    gl_FragColor = vec4(color, 0.7 * fade);
                }
            `,
            transparent: true,
            wireframe: true,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
    }, [radius]);

    useFrame((state) => {
        const mat = meshRef.current?.material as THREE.ShaderMaterial;
        if (mat && mat.uniforms && mat.uniforms.uTime) {
            mat.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <group name="Faerun_Geodesic_Matrix">
            <mesh geometry={floorGeom} material={material} ref={meshRef} name="faerun_floor" />
            <mesh geometry={floorGeom}>
                <meshBasicMaterial 
                    color="#000a05" 
                    transparent 
                    opacity={0.3} 
                    side={THREE.DoubleSide} 
                    polygonOffset={true}
                    polygonOffsetFactor={1}
                />
            </mesh>
        </group>
    );
};
