import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTexture, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { useWorld } from '../../engine/WorldContext';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';

interface YawningPortalTavernWorldProps {
    isActive: boolean;
    playerPosition?: [number, number, number];
    children?: React.ReactNode;
}

// Canonical Lore Patrons & Durnan Barkeep
const TAVERN_NPCS = [
    {
        id: 'durnan',
        name: 'Durnan the Barkeep',
        pos: [0, 0, -22] as [number, number, number],
        genome: {
            body: 'body/bodies/body_bodies_male.png',
            torso: 'torso/shirts/torso_shirts_male_brown.png',
            legs: 'legs/pants/legs_pants_male_brown.png',
            hair: 'hair/short/hair_short_male_gray.png'
        }
    },
    {
        id: 'bonnie',
        name: 'Bonnie (Barmaid)',
        pos: [-6, 0, -16] as [number, number, number],
        genome: {
            body: 'body/bodies/body_bodies_female.png',
            torso: 'torso/tunics/torso_tunics_female_red.png',
            hair: 'hair/bangs/hair_bangs_female_blonde.png'
        }
    },
    {
        id: 'threestrings',
        name: 'Matrim "Threestrings"',
        pos: [16, 0, 10] as [number, number, number],
        genome: {
            body: 'body/bodies/body_bodies_male.png',
            torso: 'torso/tunics/torso_tunics_male_green.png',
            hair: 'hair/messy/hair_messy_male_brown.png'
        }
    },
    {
        id: 'yagra',
        name: 'Yagra Stonefist',
        pos: [-16, 0, 12] as [number, number, number],
        genome: {
            body: 'body/bodies/body_bodies_female.png',
            legs: 'legs/pants/legs_pants_female_black.png',
            hair: 'hair/braid/hair_braid_female_black.png'
        }
    }
];

export const YawningPortalTavernWorld: React.FC<YawningPortalTavernWorldProps> = ({
    isActive,
    playerPosition,
    children
}) => {
    const { swapDimension } = useWorld();
    
    // Dynamic Flickering Fire Lights
    const hearthLight1 = useRef<THREE.PointLight>(null);
    const hearthLight2 = useRef<THREE.PointLight>(null);
    const chandelierLight = useRef<THREE.PointLight>(null);
    
    // Elevator & Toll State
    const elevatorRef = useRef<THREE.Group>(null);
    const [elevatorY, setElevatorY] = useState(0.8);
    const [showTollPrompt, setShowTollPrompt] = useState(false);
    const [isElevatorDescending, setIsElevatorDescending] = useState(false);
    const [playerGold, setPlayerGold] = useState(10); // Player starts with 10 GP

    // Load HD Textures
    const tavernFloorTex = useTexture('/textures/fantasy_tavern_floor.jpg');
    const stoneWallTex = useTexture('/textures/stone_floor_2.jpg');

    useMemo(() => {
        tavernFloorTex.wrapS = tavernFloorTex.wrapT = THREE.RepeatWrapping;
        tavernFloorTex.repeat.set(12, 12);
        tavernFloorTex.colorSpace = THREE.SRGBColorSpace;

        stoneWallTex.wrapS = stoneWallTex.wrapT = THREE.RepeatWrapping;
        stoneWallTex.repeat.set(6, 6);
    }, [tavernFloorTex, stoneWallTex]);

    // Lore Dimensions
    const wellRadius = 6.09;
    const wellDepth = 42.6;

    // Staircase Bounds
    const leftStairsX = -26.0;
    const rightStairsX = 26.0;
    const flight1ZMin = -5.0;
    const flight1ZMax = 20.0;
    const flight2ZMin = -25.0;
    const flight2ZMax = -10.0;

    const getTavernElevation = (x: number, z: number): number => {
        const distToWell = Math.sqrt(x * x + z * z);
        
        if (distToWell < wellRadius) {
            return elevatorY;
        }

        // Flight 1 Staircase
        if (Math.abs(x - leftStairsX) < 4.0 && z >= flight1ZMin && z <= flight1ZMax) {
            return ((z - flight1ZMin) / (flight1ZMax - flight1ZMin)) * 10.0;
        }
        if (Math.abs(x - rightStairsX) < 4.0 && z >= flight1ZMin && z <= flight1ZMax) {
            return ((z - flight1ZMin) / (flight1ZMax - flight1ZMin)) * 10.0;
        }

        // Flight 2 Staircase
        if (Math.abs(x - leftStairsX) < 4.0 && z >= flight2ZMin && z <= flight2ZMax) {
            return 10.0 + ((1.0 - ((z - flight2ZMin) / (flight2ZMax - flight2ZMin))) * 10.0);
        }
        if (Math.abs(x - rightStairsX) < 4.0 && z >= flight2ZMin && z <= flight2ZMax) {
            return 10.0 + ((1.0 - ((z - flight2ZMin) / (flight2ZMax - flight2ZMin))) * 10.0);
        }

        // Balconies
        if (distToWell > wellRadius + 2.0 && distToWell < wellRadius + 22.0) {
            if (playerPosition && playerPosition[1] > 15.0) return 20.0;
            if (playerPosition && playerPosition[1] > 5.0) return 10.0;
        }

        return 0.0;
    };

    useEffect(() => {
        if (!isActive) return;
        topographyRegistry.register({
            id: 'yawning_portal',
            getElevation: getTavernElevation,
            projection: 'flat'
        });
        topographyRegistry.setCurrent('yawning_portal');

        return () => {
            topographyRegistry.unregister('yawning_portal');
        };
    }, [isActive, elevatorY]);

    // Animate Lighting & Elevator Descent
    useFrame((state) => {
        if (!isActive) return;
        const t = state.clock.getElapsedTime();
        if (hearthLight1.current) hearthLight1.current.intensity = 3.5 + Math.sin(t * 12.0) * 0.6;
        if (hearthLight2.current) hearthLight2.current.intensity = 3.5 + Math.cos(t * 14.0) * 0.6;
        if (chandelierLight.current) chandelierLight.current.intensity = 5.0 + Math.sin(t * 8.0) * 0.3;

        if (playerPosition) {
            const [px, py, pz] = playerPosition;
            const distToWell = Math.sqrt(px * px + pz * pz);
            
            // Trigger 1 GP Toll Prompt when stepping on Elevator Platform!
            if (distToWell < 3.0 && py < 2.0 && !isElevatorDescending && !showTollPrompt) {
                setShowTollPrompt(true);
            }

            if (isElevatorDescending) {
                setElevatorY(prev => {
                    const nextY = prev - 0.2;
                    if (nextY <= -38.0) {
                        swapDimension('undermountain');
                        return -38.0;
                    }
                    return nextY;
                });
            }
        }
    });

    const handlePayTollAndDescend = () => {
        if (playerGold >= 1) {
            setPlayerGold(prev => prev - 1);
            setShowTollPrompt(false);
            setIsElevatorDescending(true);
        }
    };

    if (!isActive) return null;

    return (
        <group name="YawningPortalTavernSubstrate">
            {/* AMBIENT LIGHTING RIG */}
            <ambientLight intensity={0.65} color="#ffedd5" />
            <pointLight ref={chandelierLight} position={[0, 22, 0]} intensity={5.0} color="#f97316" distance={90} castShadow />

            {/* Flickering Fireplaces */}
            <pointLight ref={hearthLight1} position={[-38, 4, 0]} intensity={3.5} color="#ea580c" distance={40} />
            <pointLight ref={hearthLight2} position={[38, 4, 0]} intensity={3.5} color="#ea580c" distance={40} />

            {/* GROUND FLOOR TIMBER PLANKS */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <ringGeometry args={[wellRadius, 70, 48]} />
                <meshStandardMaterial map={tavernFloorTex} roughness={0.7} />
            </mesh>

            {/* 1. CENTRAL ENTRY WELL & ELEVATOR ASSEMBLY */}
            <group position={[0, 0, 0]}>
                <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
                    <cylinderGeometry args={[wellRadius + 0.5, wellRadius + 0.8, 0.8, 48, 1, true]} />
                    <meshStandardMaterial color="#475569" roughness={0.8} />
                </mesh>
                <mesh position={[0, -wellDepth / 2, 0]}>
                    <cylinderGeometry args={[wellRadius, wellRadius, wellDepth, 48, 1, true]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.9} side={THREE.BackSide} />
                </mesh>

                {/* DURNAN'S ELEVATOR BUCKET PLATFORM */}
                <group ref={elevatorRef} position={[0, elevatorY, 0]}>
                    <mesh position={[0, 0, 0]} receiveShadow castShadow>
                        <cylinderGeometry args={[2.8, 2.8, 0.4, 24]} />
                        <meshStandardMaterial color="#78350f" roughness={0.6} />
                    </mesh>
                    <mesh position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[2.8, 2.8, 1.2, 24, 1, true]} />
                        <meshStandardMaterial color="#451a03" roughness={0.7} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[0, (10 - elevatorY) / 2, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, Math.max(1, 10 - elevatorY), 8]} />
                        <meshStandardMaterial color="#d97706" />
                    </mesh>
                </group>
            </group>

            {/* 2. U-SHAPED BALCONIES */}
            {[10, 20].map((height, idx) => (
                <group key={`balcony_tier_${idx}`} position={[0, height, 0]}>
                    <mesh position={[0, 0, -10]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[wellRadius + 2.5, wellRadius + 22, 32, 1, Math.PI * 0.15, Math.PI * 1.7]} />
                        <meshStandardMaterial map={tavernFloorTex} roughness={0.7} />
                    </mesh>
                    <mesh position={[0, -0.1, -10]} rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[wellRadius + 2.5, wellRadius + 22, 32, 1, Math.PI * 0.15, Math.PI * 1.7]} />
                        <meshStandardMaterial color="#271003" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.6, 0]}>
                        <cylinderGeometry args={[wellRadius + 2.6, wellRadius + 2.6, 1.2, 32, 1, true, Math.PI * 0.15, Math.PI * 1.7]} />
                        <meshStandardMaterial color="#78350f" roughness={0.7} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            ))}

            {/* 3. FLIGHT 1 & FLIGHT 2 STAIRCASES */}
            {[-1, 1].map((dir, i) => {
                const sx = dir * leftStairsX;
                return (
                    <group key={`f1_stair_${i}`} position={[sx, 0, 0]}>
                        {Array.from({ length: 12 }).map((_, stepIdx) => {
                            const stepZ = flight1ZMin + (stepIdx * (flight1ZMax - flight1ZMin) / 12);
                            const stepY = (stepIdx / 12) * 10.0;
                            return (
                                <mesh key={`f1_step_${stepIdx}`} position={[0, stepY + 0.25, stepZ]} castShadow receiveShadow>
                                    <boxGeometry args={[4.5, 0.5, 2.2]} />
                                    <meshStandardMaterial color="#451a03" roughness={0.6} />
                                </mesh>
                            );
                        })}
                    </group>
                );
            })}

            {/* 4. DURNAN'S BAR & CANONICAL PATRONS */}
            <group position={[0, 0, -25]}>
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[22, 3, 2.5]} />
                    <meshStandardMaterial color="#451a03" roughness={0.5} />
                </mesh>
            </group>

            {TAVERN_NPCS.map(npc => (
                <SemanticAvatar
                    key={npc.id}
                    pillarName={npc.id}
                    pillarIndex={1}
                    position={npc.pos}
                    scale={1.8}
                    genome={npc.genome}
                />
            ))}

            {/* HTML INTERACTIVE 1 GP ELEVATOR TOLL PROMPT */}
            {showTollPrompt && (
                <Html center zIndexRange={[9999, 0]}>
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '2px solid #eab308',
                        borderRadius: '12px',
                        padding: '24px',
                        color: '#fff',
                        fontFamily: 'serif',
                        width: '380px',
                        textAlign: 'center',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                        pointerEvents: 'auto'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#eab308', fontSize: '1.4rem' }}>
                            🪙 Durnan's Hoist Toll
                        </h3>
                        <p style={{ fontSize: '1rem', lineHeight: '1.5', color: '#cbd5e1', marginBottom: '16px' }}>
                            "One gold piece to go down, one gold piece to come back up. Pay up or step away from the edge."
                        </p>
                        <div style={{ fontSize: '0.9rem', color: '#fef08a', marginBottom: '20px', fontWeight: 'bold' }}>
                            Your Purse: {playerGold} GP
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={handlePayTollAndDescend}
                                style={{
                                    background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                                    border: 'none',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    padding: '10px 18px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Pay 1 GP & Descend
                            </button>
                            <button
                                onClick={() => setShowTollPrompt(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    padding: '10px 18px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Step Back
                            </button>
                        </div>
                    </div>
                </Html>
            )}

            {children}
        </group>
    );
};
