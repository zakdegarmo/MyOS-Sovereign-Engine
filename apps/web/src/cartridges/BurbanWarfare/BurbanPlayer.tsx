/**
 * BurbanWarfare/BurbanPlayer.tsx
 * 
 * High-definition animated Player Avatar using extracted video spritesheet
 * (/assets/lpc/burban_hero.png) with 4-direction walk/shoot animations,
 * 360° mouse aiming reticle, sub-pixel physics, and dynamic shadow.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { WeaponDefinition } from './types';

interface BurbanPlayerProps {
    position: THREE.Vector3;
    onPositionChange: (pos: THREE.Vector3) => void;
    onAimChange: (aimDir: THREE.Vector3) => void;
    isFiring: boolean;
    activeWeapon: WeaponDefinition;
    weedWhackerLevel: number;
    speedMultiplier: number;
}

export const BurbanPlayer: React.FC<BurbanPlayerProps> = ({
    position,
    onPositionChange,
    onAimChange,
    isFiring,
    activeWeapon,
    weedWhackerLevel,
    speedMultiplier
}) => {
    const playerGroupRef = useRef<THREE.Group>(null);
    const spriteMeshRef = useRef<THREE.Mesh>(null);
    const aimReticleRef = useRef<THREE.Group>(null);
    const orbitBladesRef = useRef<THREE.Group>(null);

    const { camera, raycaster, pointer } = useThree();

    // Input state
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const aimVector = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
    const targetReticlePos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.5, 5));
    const currentFacing = useRef<'down' | 'left' | 'right' | 'up'>('down');
    const animTimer = useRef<number>(0);
    const animFrame = useRef<number>(0);

    // Keyboard event listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current[e.code] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.code] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Load and configure extracted character spritesheet
    const { heroTexture, heroMaterial } = useMemo(() => {
        const loader = new THREE.TextureLoader();
        const tex = loader.load('/assets/lpc/burban_hero.png');
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.repeat.set(0.25, 0.25);
        tex.offset.set(0, 0.75); // Start on Row 0 (Front)

        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide
        });

        return { heroTexture: tex, heroMaterial: mat };
    }, []);

    // Frame Tick
    useFrame((state, delta) => {
        if (!playerGroupRef.current) return;

        // 1. WASD Directional Locomotion
        const move = new THREE.Vector3();
        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) move.z -= 1;
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) move.z += 1;
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) move.x -= 1;
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) move.x += 1;

        const isMoving = move.lengthSq() > 0;
        if (isMoving) {
            move.normalize();
            const baseSpeed = 9.5 * speedMultiplier;
            position.addScaledVector(move, baseSpeed * delta);

            position.x = THREE.MathUtils.clamp(position.x, -36, 36);
            position.z = THREE.MathUtils.clamp(position.z, -32, 32);

            playerGroupRef.current.position.copy(position);
            onPositionChange(position);

            // Step animation frame
            animTimer.current += delta;
            if (animTimer.current > 0.12) {
                animTimer.current = 0;
                animFrame.current = (animFrame.current + 1) % 4;
            }
        } else if (isFiring) {
            // Step firing animation frames
            animTimer.current += delta;
            if (animTimer.current > 0.1) {
                animTimer.current = 0;
                animFrame.current = (animFrame.current + 1) % 4;
            }
        } else {
            animFrame.current = 0;
        }

        // 2. 360° Mouse Aim Calculation
        raycaster.setFromCamera(pointer, camera);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
        const mouseWorldIntersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, mouseWorldIntersect);

        if (mouseWorldIntersect) {
            const dir = new THREE.Vector3().subVectors(mouseWorldIntersect, position).setY(0);
            if (dir.lengthSq() > 0.01) {
                dir.normalize();
                aimVector.current.copy(dir);
                onAimChange(dir);

                // Determine facing direction from aim
                if (Math.abs(dir.x) > Math.abs(dir.z)) {
                    currentFacing.current = dir.x > 0 ? 'right' : 'left';
                } else {
                    currentFacing.current = dir.z > 0 ? 'down' : 'up';
                }

                targetReticlePos.current.copy(mouseWorldIntersect);

                if (aimReticleRef.current) {
                    aimReticleRef.current.position.copy(mouseWorldIntersect);
                }
            }
        }

        // 3. Update UV texture offset for spritesheet animation
        if (heroTexture) {
            const rowOffset = currentFacing.current === 'down' 
                ? 0.75 
                : currentFacing.current === 'left' 
                ? 0.50 
                : currentFacing.current === 'right' 
                ? 0.25 
                : 0.00;

            const colOffset = (animFrame.current % 4) * 0.25;
            heroTexture.offset.set(colOffset, rowOffset);
        }

        // 4. Billboard facing
        if (spriteMeshRef.current) {
            spriteMeshRef.current.quaternion.copy(camera.quaternion);
        }

        // 5. Smooth Camera Follow
        const cameraTarget = position.clone().add(new THREE.Vector3(0, 19, 15));
        camera.position.lerp(cameraTarget, 0.12);
        camera.lookAt(position.x, 0.5, position.z);

        // 6. Weed Whacker Orbit Rotation
        if (orbitBladesRef.current && weedWhackerLevel > 0) {
            orbitBladesRef.current.rotation.y += delta * 7.5;
        }
    });

    return (
        <>
            <group ref={playerGroupRef} position={[position.x, position.y, position.z]}>
                {/* 2.5D Animated Sprite Billboard using extracted video spritesheet */}
                <mesh ref={spriteMeshRef} position={[0, 0.95, 0]} material={heroMaterial} castShadow>
                    <planeGeometry args={[2.0, 2.0]} />
                </mesh>

                {/* Drop Shadow Decal */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                    <circleGeometry args={[0.65, 16]} />
                    <meshBasicMaterial color="#000000" transparent opacity={0.4} />
                </mesh>

                {/* Weed Whacker Orbiting Blades */}
                {weedWhackerLevel > 0 && (
                    <group ref={orbitBladesRef} position={[0, 0.6, 0]}>
                        <mesh position={[2.6, 0, 0]}>
                            <boxGeometry args={[0.7, 0.1, 0.25]} />
                            <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.9} />
                        </mesh>
                        <mesh position={[-2.6, 0, 0]}>
                            <boxGeometry args={[0.7, 0.1, 0.25]} />
                            <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.9} />
                        </mesh>
                        {weedWhackerLevel >= 3 && (
                            <>
                                <mesh position={[0, 0, 2.6]}>
                                    <boxGeometry args={[0.25, 0.1, 0.7]} />
                                    <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.9} />
                                </mesh>
                                <mesh position={[0, 0, -2.6]}>
                                    <boxGeometry args={[0.25, 0.1, 0.7]} />
                                    <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={0.9} />
                                </mesh>
                            </>
                        )}
                    </group>
                )}
            </group>

            {/* 360° Mouse Reticle Crosshair */}
            <group ref={aimReticleRef} position={[0, 0.5, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.45, 0.55, 32]} />
                    <meshBasicMaterial color="#ff0055" transparent opacity={0.85} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.12, 16]} />
                    <meshBasicMaterial color="#00ffff" />
                </mesh>
            </group>
        </>
    );
};
