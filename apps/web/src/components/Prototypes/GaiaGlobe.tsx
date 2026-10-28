/** @version 1.1.5-Omni @timestamp 2026-04-06 18:15 @author Antigravity-Omni */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Grid, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * GaiaGlobe Prototype (Geometric Truth)
 * -------------------
 * Now with real-time WASD movement.
 * - Player at [0, 0, 0].
 * - Earth at [0, -R, 0].
 * - Controls: WASD or Arrow Keys.
 */
export const GaiaGlobe: React.FC = () => {
    const pivotRef = useRef<THREE.Group>(null);
    const EARTH_RADIUS = 6371000;
    const [, get] = useKeyboardControls();

    // --- GIANT MARKERS FOR VISIBILITY ---
    const markers = useMemo(() => {
        const points = [];
        // Place markers in a 4-direction cross for navigation reference
        const axes = [
            { n: 'N', d: [0, 0, 1] }, { n: 'S', d: [0, 0, -1] },
            { n: 'E', d: [1, 0, 0] }, { n: 'W', d: [-1, 0, 0] }
        ];

        axes.forEach(axis => {
            for (let i = 1; i <= 3; i++) {
                const dist = i * 10000; // 10km, 20km, 30km
                const angle = dist / EARTH_RADIUS;
                
                // Using a slightly more sophisticated Cartesian transformation
                const x = EARTH_RADIUS * Math.sin(angle) * axis.d[0];
                const z = EARTH_RADIUS * Math.sin(angle) * axis.d[2];
                const y = EARTH_RADIUS * Math.cos(angle);
                
                points.push({
                    id: `marker_${axis.n}_${i}`,
                    position: [x, y, z] as [number, number, number],
                    // Basic alignment: just rotate to face center
                    rotation: [axis.d[2] * angle, 0, -axis.d[0] * angle] as [number, number, number],
                    color: axis.n === 'N' || axis.n === 'S' ? '#00ffcc' : '#ff0055',
                    label: `${axis.n} ${i*10}km`
                });
            }
        });
        return points;
    }, [EARTH_RADIUS]);

    useFrame((state, delta) => {
        if (!pivotRef.current) return;
        
        const { forward, backward, left, right } = get();
        
        // Speed: 1000 m/s for fast testing (about 2,200 mph)
        const speed = 1000; 
        const dist = speed * delta;
        const angle = dist / EARTH_RADIUS;

        if (forward || backward || left || right) {
            const rotQ = new THREE.Quaternion();
            
            // NORTH/SOUTH (Rotation around World-X)
            if (forward) rotQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle));
            if (backward) rotQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle));
            
            // EAST/WEST (Rotation around World-Z)
            if (left) rotQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle));
            if (right) rotQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle));

            // Apply rotation to the Pivot
            pivotRef.current.quaternion.multiplyQuaternions(rotQ, pivotRef.current.quaternion);
        }
    });

    return (
        <group name="GaiaGlobe_Prototype">
            {/* LOCAL TANGENT GRID (Indicates movement speed) */}
            <Grid 
                infiniteGrid 
                fadeDistance={2000} 
                sectionSize={100} 
                sectionColor="#004455"
                cellColor="#002233"
                cellThickness={1}
            />

            {/* THE PLANETARY PIVOT */}
            <group ref={pivotRef} position={[0, -EARTH_RADIUS, 0]}>
                
                {/* Visualizing the massive sphere cap (High visibility) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <sphereGeometry args={[EARTH_RADIUS, 128, 64, 0, Math.PI * 2, 0, 0.1]} />
                    <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.15} />
                </mesh>

                {/* THE GIANT PILLARS (500m tall) */}
                {markers.map((m) => (
                    <group key={m.id} position={m.position} rotation={m.rotation}>
                        <mesh position={[0, 250, 0]}>
                            <boxGeometry args={[40, 500, 40]} />
                            <meshStandardMaterial color={m.color} emissive={m.color} emissiveIntensity={0.8} />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* MINI-MAP (Global Truth) */}
            <group position={[-10, -5, -20]} scale={[1.5, 1.5, 1.5]}>
                <Sphere args={[1, 32, 32]}>
                    <meshBasicMaterial color="#ffffff" wireframe />
                </Sphere>
                <group ref={(node) => {
                    if (node && pivotRef.current) node.quaternion.copy(pivotRef.current.quaternion);
                }}>
                    <mesh position={[0, 1.1, 0]}>
                        <coneGeometry args={[0.1, 0.4, 8]} />
                        <meshBasicMaterial color="#ff00ff" />
                    </mesh>
                </group>
            </group>

            <ambientLight intensity={1} />
            <pointLight position={[500, 500, 500]} intensity={2} />
        </group>
    );
};
