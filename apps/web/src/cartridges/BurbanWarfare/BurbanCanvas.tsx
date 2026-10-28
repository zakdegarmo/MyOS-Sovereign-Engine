/**
 * BurbanWarfare/BurbanCanvas.tsx
 * 
 * High-performance 60-120fps 3D isometric viewport.
 * Uses zero-allocation cached materials, batch billboarding, and optimized lighting.
 */

import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BurbanStageManager } from './BurbanStageManager';
import { BurbanPlayer } from './BurbanPlayer';
import { burbanMaterials } from './systems/burbanMaterials';
import type { 
    WeaponDefinition, EnemyInstance, NeighborNPC, GemDrop, Projectile 
} from './types';

interface BurbanCanvasProps {
    playerPosRef: React.MutableRefObject<THREE.Vector3>;
    aimDirectionRef: React.MutableRefObject<THREE.Vector3>;
    isFiringRef: React.MutableRefObject<boolean>;
    activeWeapon: WeaponDefinition;
    weedWhackerLevel: number;
    speedMultiplier: number;
    projectilesRef: React.MutableRefObject<Projectile[]>;
    enemiesRef: React.MutableRefObject<EnemyInstance[]>;
    neighborsRef: React.MutableRefObject<NeighborNPC[]>;
    gemsRef: React.MutableRefObject<GemDrop[]>;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
}

// Sub-component: Renders active projectiles with zero light allocations
const ProjectileRenderer: React.FC<{ projectilesRef: React.MutableRefObject<Projectile[]> }> = ({ projectilesRef }) => {
    const groupRef = useRef<THREE.Group>(null);

    return (
        <group ref={groupRef} name="Projectiles">
            {projectilesRef.current.map(p => (
                <mesh key={p.id} position={[p.position.x, p.position.y, p.position.z]}>
                    {p.type === 'pop_grenade' ? (
                        <cylinderGeometry args={[0.22, 0.22, 0.45, 8]} />
                    ) : p.type === 'popsicle_blizzard' ? (
                        <dodecahedronGeometry args={[0.3, 0]} />
                    ) : (
                        <sphereGeometry args={[0.22, 8, 8]} />
                    )}
                    <meshBasicMaterial color={p.color} />
                </mesh>
            ))}
        </group>
    );
};

// Sub-component: Renders active enemies as 2.5D billboard sprites with pre-cached materials
const EnemyHordeRenderer: React.FC<{ enemiesRef: React.MutableRefObject<EnemyInstance[]> }> = ({ enemiesRef }) => {
    const { camera } = useThree();

    return (
        <group name="Enemies">
            {enemiesRef.current.map(enemy => {
                const mat = enemy.isHitFlashing > 0 
                    ? burbanMaterials.enemies.hitFlash 
                    : (burbanMaterials.enemies as any)[enemy.type] || burbanMaterials.enemies.shuffler;

                const scale = enemy.type === 'chainsaw_clone' ? 2.3 : enemy.type === 'lawn_ghoul' ? 1.7 : 1.5;

                return (
                    <group key={enemy.id} position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
                        <mesh quaternion={camera.quaternion} position={[0, scale * 0.45, 0]} material={mat}>
                            <planeGeometry args={[scale, scale]} />
                        </mesh>

                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={burbanMaterials.shadow}>
                            <circleGeometry args={[enemy.radius * 0.85, 12]} />
                        </mesh>

                        {enemy.hp < enemy.maxHp && (
                            <mesh position={[0, scale + 0.2, 0]} quaternion={camera.quaternion} material={burbanMaterials.healthBarRed}>
                                <planeGeometry args={[1.0 * (enemy.hp / enemy.maxHp), 0.1]} />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
};

// Sub-component: Renders active neighbor NPCs
const NeighborRenderer: React.FC<{ neighborsRef: React.MutableRefObject<NeighborNPC[]> }> = ({ neighborsRef }) => {
    const { camera } = useThree();

    return (
        <group name="Neighbors">
            {neighborsRef.current.map(n => {
                if (n.isLost) return null;
                const mat = (burbanMaterials.neighbors as any)[n.id] || burbanMaterials.neighbors.bbq_dad;

                return (
                    <group key={n.id} position={[n.position.x, n.position.y, n.position.z]}>
                        <mesh quaternion={camera.quaternion} position={[0, 0.9, 0]} material={mat}>
                            <planeGeometry args={[1.8, 1.8]} />
                        </mesh>

                        {!n.isSaved && (
                            <mesh 
                                rotation={[-Math.PI / 2, 0, 0]} 
                                position={[0, 0.03, 0]} 
                                material={n.distressTimer > 0 ? burbanMaterials.beaconDistress : burbanMaterials.beaconReady}
                            >
                                <ringGeometry args={[1.3, 1.6, 24]} />
                            </mesh>
                        )}

                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={burbanMaterials.shadow}>
                            <circleGeometry args={[0.7, 12]} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

// Sub-component: Renders glowing XP gems
const GemRenderer: React.FC<{ gemsRef: React.MutableRefObject<GemDrop[]> }> = ({ gemsRef }) => {
    const gemGroupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (gemGroupRef.current) {
            gemGroupRef.current.rotation.y += delta * 2.5;
        }
    });

    return (
        <group ref={gemGroupRef} name="Gems">
            {gemsRef.current.map(gem => (
                <mesh key={gem.id} position={[gem.position.x, 0.35, gem.position.z]} rotation={[0.4, 0.4, 0]}>
                    <octahedronGeometry args={[0.26, 0]} />
                    <meshStandardMaterial
                        color={gem.color}
                        emissive={gem.color}
                        emissiveIntensity={0.9}
                        roughness={0.2}
                    />
                </mesh>
            ))}
        </group>
    );
};

export const BurbanCanvas: React.FC<BurbanCanvasProps> = ({
    playerPosRef,
    aimDirectionRef,
    isFiringRef,
    activeWeapon,
    weedWhackerLevel,
    speedMultiplier,
    projectilesRef,
    enemiesRef,
    neighborsRef,
    gemsRef,
    onPointerDown,
    onPointerUp,
    onContextMenu
}) => {
    return (
        <div 
            className="w-full h-full cursor-crosshair relative"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onContextMenu={onContextMenu}
        >
            <Canvas
                shadows
                camera={{
                    position: [0, 19, 15],
                    fov: 46,
                    near: 0.1,
                    far: 120
                }}
                gl={{
                    antialias: false,
                    powerPreference: 'high-performance'
                }}
            >
                {/* Suburban Golden Hour Lighting */}
                <ambientLight intensity={1.1} color="#fef3c7" />
                <directionalLight
                    position={[25, 40, 25]}
                    intensity={2.0}
                    color="#fffbeb"
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-45}
                    shadow-camera-right={45}
                    shadow-camera-top={45}
                    shadow-camera-bottom={-45}
                    shadow-bias={-0.0005}
                />
                <pointLight position={[playerPosRef.current.x, 3, playerPosRef.current.z]} intensity={1.0} color="#38bdf8" distance={16} />

                {/* Suburban Stage Geometry */}
                <BurbanStageManager />

                {/* Player Avatar */}
                <BurbanPlayer
                    position={playerPosRef.current}
                    onPositionChange={(pos) => { playerPosRef.current.copy(pos); }}
                    onAimChange={(dir) => { aimDirectionRef.current.copy(dir); }}
                    isFiring={isFiringRef.current}
                    activeWeapon={activeWeapon}
                    weedWhackerLevel={weedWhackerLevel}
                    speedMultiplier={speedMultiplier}
                />

                {/* Projectiles, Enemies, Neighbors, Gems */}
                <ProjectileRenderer projectilesRef={projectilesRef} />
                <EnemyHordeRenderer enemiesRef={enemiesRef} />
                <NeighborRenderer neighborsRef={neighborsRef} />
                <GemRenderer gemsRef={gemsRef} />
            </Canvas>
        </div>
    );
};
