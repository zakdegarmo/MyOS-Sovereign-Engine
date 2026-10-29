/**
 * BurbanWarfare/BurbanStageManager.tsx
 * 
 * Stage 1: Sunnyvale Backyard BBQ (High-Fidelity LucasArts Pixel Remaster)
 * Stylized low-poly 3D world meshes wrapped in crisp pixel-art atlas textures.
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { burbanTextures } from './systems/burbanTextures';

export const BurbanStageManager: React.FC = () => {
    const waterMeshRef = useRef<THREE.Mesh>(null);
    const smokeParticlesRef = useRef<THREE.Points>(null);

    // Build rich materials with NearestFilter textures
    const materials = useMemo(() => {
        const grassTex = burbanTextures.getGrassTexture();
        grassTex.repeat.set(12, 12);

        const roadTex = burbanTextures.getRoadTexture();
        roadTex.repeat.set(1, 8);

        const hedgeTex = burbanTextures.getHedgeTexture();
        hedgeTex.repeat.set(8, 2);

        const houseTex = burbanTextures.getHouseFacadeTexture();
        const roofTex = burbanTextures.getRoofTexture();
        roofTex.repeat.set(3, 3);

        const waterTex = burbanTextures.getPoolWaterTexture();
        waterTex.repeat.set(3, 4);

        return {
            grass: new THREE.MeshStandardMaterial({
                map: grassTex,
                roughness: 0.85,
                metalness: 0.05
            }),
            road: new THREE.MeshStandardMaterial({
                map: roadTex,
                roughness: 0.9
            }),
            patio: new THREE.MeshStandardMaterial({
                color: '#cbd5e1',
                roughness: 0.7,
                flatShading: true
            }),
            hedge: new THREE.MeshStandardMaterial({
                map: hedgeTex,
                roughness: 0.8
            }),
            fence: new THREE.MeshStandardMaterial({
                color: '#d97706',
                roughness: 0.6,
                flatShading: true
            }),
            houseWallA: new THREE.MeshStandardMaterial({
                map: houseTex,
                roughness: 0.5
            }),
            houseWallB: new THREE.MeshStandardMaterial({
                map: houseTex,
                roughness: 0.5
            }),
            roof: new THREE.MeshStandardMaterial({
                map: roofTex,
                roughness: 0.4
            }),
            poolWater: new THREE.MeshStandardMaterial({
                map: waterTex,
                roughness: 0.1,
                metalness: 0.3,
                transparent: true,
                opacity: 0.9
            }),
            poolBorder: new THREE.MeshStandardMaterial({
                color: '#f1f5f9',
                roughness: 0.3,
                flatShading: true
            }),
            grill: new THREE.MeshStandardMaterial({
                color: '#111827',
                metalness: 0.85,
                roughness: 0.25
            }),
            table: new THREE.MeshStandardMaterial({
                color: '#ef4444',
                roughness: 0.5,
                flatShading: true
            }),
            umbrella: new THREE.MeshStandardMaterial({
                color: '#facc15',
                roughness: 0.4,
                flatShading: true
            }),
            trampolineMat: new THREE.MeshStandardMaterial({
                color: '#0284c7',
                roughness: 0.9
            })
        };
    }, []);

    // BBQ Smoke Particle Geometry
    const smokeGeo = useMemo(() => {
        const count = 30;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.4;
            positions[i * 3 + 1] = Math.random() * 2.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, []);

    // Frame animation for pool water and BBQ smoke
    useFrame((state, delta) => {
        if (waterMeshRef.current) {
            const mat = waterMeshRef.current.material as THREE.MeshStandardMaterial;
            if (mat.map) {
                mat.map.offset.x += delta * 0.05;
                mat.map.offset.y += delta * 0.03;
            }
        }

        if (smokeParticlesRef.current) {
            const posAttr = smokeParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < posAttr.count; i++) {
                let y = posAttr.getY(i) + delta * 0.8;
                if (y > 3.0) y = 0;
                posAttr.setY(i, y);
            }
            posAttr.needsUpdate = true;
        }
    });

    return (
        <group name="SunnyvaleNeighborhood">
            {/* --- GROUND FLOORS --- */}
            {/* Main Suburban Grass Field */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={materials.grass}>
                <planeGeometry args={[120, 120]} />
            </mesh>

            {/* Asphalt Road & Cul-de-Sac */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]} receiveShadow material={materials.road}>
                <planeGeometry args={[14, 80]} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 35]} receiveShadow material={materials.road}>
                <circleGeometry args={[16, 32]} />
            </mesh>

            {/* Concrete Patios */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.02, 8]} receiveShadow material={materials.patio}>
                <planeGeometry args={[12, 12]} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, 0.02, 10]} receiveShadow material={materials.patio}>
                <planeGeometry args={[14, 12]} />
            </mesh>

            {/* --- 3D CEDAR HEDGES --- */}
            {/* North Boundary Hedges */}
            <mesh position={[0, 1.2, -35]} castShadow receiveShadow material={materials.hedge}>
                <boxGeometry args={[70, 2.4, 2.0]} />
            </mesh>
            {/* East & West Property Dividers */}
            <mesh position={[24, 1.0, 0]} castShadow receiveShadow material={materials.hedge}>
                <boxGeometry args={[2.0, 2.0, 42]} />
            </mesh>
            <mesh position={[-24, 1.0, 0]} castShadow receiveShadow material={materials.hedge}>
                <boxGeometry args={[2.0, 2.0, 42]} />
            </mesh>
            <mesh position={[14, 0.8, -15]} castShadow receiveShadow material={materials.hedge}>
                <boxGeometry args={[18, 1.6, 1.8]} />
            </mesh>
            <mesh position={[-14, 0.8, -15]} castShadow receiveShadow material={materials.hedge}>
                <boxGeometry args={[18, 1.6, 1.8]} />
            </mesh>

            {/* --- 3D WOODEN PICKED FENCES --- */}
            <group position={[29, 0.75, 12]}>
                <mesh castShadow receiveShadow material={materials.fence}>
                    <boxGeometry args={[0.2, 1.5, 24]} />
                </mesh>
            </group>
            <group position={[-29, 0.75, 12]}>
                <mesh castShadow receiveShadow material={materials.fence}>
                    <boxGeometry args={[0.2, 1.5, 24]} />
                </mesh>
            </group>

            {/* --- SUBURBAN HOUSES --- */}
            {/* East House */}
            <group position={[28, 0, -5]}>
                <mesh position={[0, 3, 0]} castShadow receiveShadow material={materials.houseWallA}>
                    <boxGeometry args={[12, 6, 14]} />
                </mesh>
                <mesh position={[0, 7.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={materials.roof}>
                    <coneGeometry args={[10.5, 4.0, 4]} />
                </mesh>
                {/* Porch Light */}
                <pointLight position={[-6.2, 3, 2]} intensity={1.5} color="#fef08a" distance={10} />
            </group>

            {/* West House */}
            <group position={[-28, 0, -5]}>
                <mesh position={[0, 3, 0]} castShadow receiveShadow material={materials.houseWallB}>
                    <boxGeometry args={[12, 6, 14]} />
                </mesh>
                <mesh position={[0, 7.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={materials.roof}>
                    <coneGeometry args={[10.5, 4.0, 4]} />
                </mesh>
                {/* Porch Light */}
                <pointLight position={[6.2, 3, 2]} intensity={1.5} color="#fef08a" distance={10} />
            </group>

            {/* --- SWIMMING POOL (West Backyard) --- */}
            <group position={[-15, 0, 14]}>
                {/* Pool Deck Border */}
                <mesh position={[0, 0.1, 0]} receiveShadow material={materials.poolBorder}>
                    <boxGeometry args={[9.0, 0.25, 13.0]} />
                </mesh>
                {/* Animated Caustic Water */}
                <mesh 
                    ref={waterMeshRef} 
                    position={[0, 0.2, 0]} 
                    rotation={[-Math.PI / 2, 0, 0]} 
                    material={materials.poolWater}
                >
                    <planeGeometry args={[8.0, 12.0]} />
                </mesh>
                {/* Floating Inflatable Flamingo Ring */}
                <group position={[1.5, 0.35, 1.5]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[0.8, 0.25, 12, 24]} />
                        <meshStandardMaterial color="#ec4899" roughness={0.3} />
                    </mesh>
                </group>
            </group>

            {/* --- BBQ GRILL & PATIO PICNIC TABLE (East Backyard) --- */}
            <group position={[14, 0, 9]}>
                {/* Kettle Grill */}
                <mesh position={[0, 0.9, 0]} castShadow material={materials.grill}>
                    <cylinderGeometry args={[0.55, 0.55, 0.9, 16]} />
                </mesh>
                <mesh position={[0, 1.4, 0]} castShadow material={materials.grill}>
                    <sphereGeometry args={[0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                </mesh>
                {/* Red Glowing Charcoal Core */}
                <pointLight position={[0, 1.1, 0]} intensity={2.0} color="#f97316" distance={5} />

                {/* BBQ Smoke Particles */}
                <points ref={smokeParticlesRef} position={[0, 1.5, 0]} geometry={smokeGeo}>
                    <pointsMaterial size={0.3} color="#94a3b8" transparent opacity={0.6} />
                </points>

                {/* Picnic Table with Red/White Checkered Top */}
                <mesh position={[-3.5, 0.75, 0]} castShadow receiveShadow material={materials.table}>
                    <boxGeometry args={[3.2, 0.15, 2.0]} />
                </mesh>
                {/* Patio Umbrella */}
                <mesh position={[-3.5, 2.8, 0]} castShadow material={materials.umbrella}>
                    <coneGeometry args={[2.2, 0.8, 8]} />
                </mesh>
                <mesh position={[-3.5, 1.5, 0]} material={materials.grill}>
                    <cylinderGeometry args={[0.08, 0.08, 3.0]} />
                </mesh>
            </group>

            {/* --- BACKYARD TRAMPOLINE (South Park) --- */}
            <group position={[0, 0, 20]}>
                <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.grill}>
                    <ringGeometry args={[3.0, 3.4, 32]} />
                </mesh>
                <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.trampolineMat}>
                    <circleGeometry args={[3.0, 32]} />
                </mesh>
            </group>

            {/* --- STREETLIGHT AT CUL-DE-SAC --- */}
            <group position={[10, 0, 32]}>
                <mesh position={[0, 3.5, 0]} material={materials.grill}>
                    <cylinderGeometry args={[0.12, 0.15, 7.0, 8]} />
                </mesh>
                <mesh position={[-0.8, 7.0, 0]} rotation={[0, 0, -Math.PI / 4]} material={materials.grill}>
                    <cylinderGeometry args={[0.1, 0.1, 2.2, 8]} />
                </mesh>
                {/* Warm Volumetric Street Lamp */}
                <pointLight position={[-1.5, 7.2, 0]} intensity={3.5} color="#fef08a" distance={25} castShadow />
            </group>
        </group>
    );
};
