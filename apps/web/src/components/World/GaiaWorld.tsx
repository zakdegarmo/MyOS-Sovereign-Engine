/** @version 2.1.0-Inertial @timestamp 2026-04-08 03:40 @author Antigravity-Omni */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GaiaTiledFloor } from './GaiaTiledFloor';
import { PapercraftBuilding } from './PapercraftBuilding';
import { WildernessTraversal } from './WildernessTraversal';

interface GaiaWorldProps {
    isActive: boolean;
    playerPosition: THREE.Vector3;
    backgroundUrl?: string;
    children?: React.ReactNode;
}

const EARTH_RADIUS = 3185500; // REDUCED SCALE (Half of Earth)

export const GaiaWorld: React.FC<GaiaWorldProps> = ({ isActive, playerPosition, backgroundUrl, children }) => {
    const planetRef = useRef<THREE.Group>(null);
    const planetRotation = useRef(new THREE.Quaternion());
    const lastPos = useRef(new THREE.Vector3());
    const currentVel = useRef(new THREE.Vector3());

    // --- BASE GLOBE TEXTURE ---
    const floorTexture = useTexture('/integrations/Images/Assets for VTT/2minTTdungeonBuilder/Floor.png');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(1000, 1000);

    // --- PTOLEMAIC INERTIAL ENGINE ---
    useFrame((_state, delta) => {
        if (!planetRef.current || !isActive) return;

        // 1. Calculate TANGENT VELOCITY (Rolling delta)
        const vel = new THREE.Vector3().subVectors(playerPosition, lastPos.current);
        
        // --- ORIGIN SHIFT STABILIZATION ---
        // If the player position jumped a massive distance (the origin reset), 
        // we use the PREVIOUS velocity instead of zeroing out, to maintain inertial momentum.
        const SHIFT_THRESHOLD = 1500;
        if (vel.length() > SHIFT_THRESHOLD) {
            vel.copy(currentVel.current); // Maintain previous frame's momentum
        }

        lastPos.current.copy(playerPosition);
        
        // 2. Direct 1:1 Gear Ratio (No Damping to prevent sliding)
        // Since Input is already smoothed in AvatarController, the World follows 1:1.
        currentVel.current.copy(vel);

        if (currentVel.current.lengthSq() > 0.00000001) {
            // 3. Convert Velocity to Quaternion Rotation
            // Angle = Displacement / Radius
            const angle = currentVel.current.length() / EARTH_RADIUS;
            
            // Axis is perpendicular to velocity mapping for spherical rolling
            const axis = new THREE.Vector3(currentVel.current.z, 0, -currentVel.current.x).normalize();
            
            if (isFinite(axis.x) && isFinite(axis.z)) {
                const deltaRotation = new THREE.Quaternion().setFromAxisAngle(axis, angle);
                
                // Apply delta in local-to-world-aligned space
                planetRotation.current.premultiply(deltaRotation);
                planetRotation.current.normalize(); // Prevent drift accumulation
                planetRef.current.setRotationFromQuaternion(planetRotation.current);
            }
        }

        // 4. GAIA'S BREATH (Atmospheric Suspension Float)
        // Subtly pulse the height and position based on a low-frequency oscillator
        const floatFreq = 0.5; // slow breath
        const floatAmp = 0.08; // meters
        const wobble = Math.sin(_state.clock.elapsedTime * floatFreq) * floatAmp;
        
        // Offset center down, but apply the 'wobble' to the North Pole position
        // Also apply a tiny -0.01 offset to the entire planet group to resolve 
        // Z-fighting between the floor mesh and sprites at Y=0.
        planetRef.current.position.set(0, -EARTH_RADIUS + wobble - 0.01, 0);
    });

    if (!isActive) return null;

    return (
        <group name="GaiaWorld_Dimension">
            {/* THE INTERTIAL SPHERE: Rotates everything within it globally */}
            <group ref={planetRef}>
                {/* 1. THE HI-FI TILED GROUND GRID (Anchored to North Pole) */}
                <group position={[0, EARTH_RADIUS, 0]}>
                    <GaiaTiledFloor radius={EARTH_RADIUS} />
                </group>

                {/* 2. DATA WILDERNESS (Anchored to Lat/Lon on the Ball) */}
                <group position={[0, EARTH_RADIUS, 0]}>
                    <WildernessTraversal isActive={true} playerPosition={playerPosition} />
                </group>

                {/* 3. PHYSICAL ARCHITECTURE & PORTENTS */}
                <PapercraftBuilding 
                    position={[10, EARTH_RADIUS + 0.5, -10]} 
                    scale={5} 
                    type="portent" 
                />

                {/* 4. DYNAMIC AGENTS/NPCs */}
                <group position={[0, EARTH_RADIUS, 0]}>
                   {children}
                </group>
            </group>

            {/* ATMOSPHERIC PANORAMA (Static, non-rotating) */}
            <mesh>
                <sphereGeometry args={[EARTH_RADIUS * 4, 32, 32]} />
                <meshBasicMaterial color="#000205" side={THREE.BackSide} toneMapped={false} />
            </mesh>

            <ambientLight intensity={2.5} />
            <directionalLight position={[10, 20, 10]} intensity={3} castShadow />
            <pointLight position={[10, EARTH_RADIUS + 10, -10]} color="#00ffff" intensity={15} distance={100} />
        </group>
    );
};
