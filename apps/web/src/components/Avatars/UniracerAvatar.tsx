import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';

export interface UniracerPhysicsState {
    speed: number;
    heading: number;
    pitchLean: number;
    bankLean: number;
    airborneRotation: THREE.Quaternion;
    isGrounded: boolean;
    isWipingOut: boolean;
    trickText: string;
    isBrakeGlued?: boolean;
}

interface UniracerAvatarProps {
    isPlayerControlled?: boolean;
    scale?: number;
    position?: [number, number, number];
    velocity?: [number, number, number];
    uniracerState?: UniracerPhysicsState;
}

export const UniracerAvatar: React.FC<UniracerAvatarProps> = ({
    isPlayerControlled = false,
    scale = 1.0,
    position = [0, 0, 0],
    velocity = [0, 0, 0],
    uniracerState
}) => {
    const { scene, animations } = useGLTF('/models/uniracer_hero.glb');
    const clonedScene = useMemo(() => scene.clone(true), [scene]);
    const { actions } = useAnimations(animations, clonedScene);

    const rootGroupRef = useRef<THREE.Group>(null);
    const chassisContainerRef = useRef<THREE.Group>(null);

    const bonesRef = useRef<{
        wheel: THREE.Object3D | null;
        frame: THREE.Object3D | null;
        saddleHead: THREE.Object3D | null;
        crankL: THREE.Object3D | null;
        pedalL: THREE.Object3D | null;
        crankR: THREE.Object3D | null;
        pedalR: THREE.Object3D | null;
    }>({
        wheel: null,
        frame: null,
        saddleHead: null,
        crankL: null,
        pedalL: null,
        crankR: null,
        pedalR: null
    });

    const wheelRotationRef = useRef<number>(0);
    const qCounterRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
    const axisXRef = useRef<THREE.Vector3>(new THREE.Vector3(1, 0, 0));
    // Calibrated flat horizontal rest quaternions (wide side facing UP and DOWN, pedals pointing OUTWARDS)
    const initialRotationsRef = useRef<{
        pedalL: THREE.Quaternion;
        pedalR: THREE.Quaternion;
        saddleHead: number;
    }>({
        pedalL: new THREE.Quaternion(-0.9238795, 0, 0, 0.3826834),
        pedalR: new THREE.Quaternion(0.3826834, 0, 0, 0.9238795),
        saddleHead: 0
    });

    // Identify bones and enhance materials for WebGL vibrancy
    useEffect(() => {
        const bones = bonesRef.current;
        clonedScene.traverse((child) => {
            if (child.name === 'Bone_Wheel' || child.name === 'Wheel') {
                bones.wheel = child;
            } else if (child.name === 'Bone_Frame' || child.name === 'Frame') {
                bones.frame = child;
            } else if (child.name === 'Bone_SaddleHead' || child.name === 'SaddleHead') {
                bones.saddleHead = child;
            } else if (child.name === 'Bone_Crank_L') {
                bones.crankL = child;
            } else if (child.name === 'Bone_Pedal_L') {
                bones.pedalL = child;
            } else if (child.name === 'Bone_Crank_R') {
                bones.crankR = child;
            } else if (child.name === 'Bone_Pedal_R') {
                bones.pedalR = child;
            }

            // Material polish
            if (child instanceof THREE.Mesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => {
                    if (m instanceof THREE.MeshStandardMaterial) {
                        const mName = (m.name || '').toLowerCase();
                        if (mName.includes('body')) {
                            m.color.set('#d81124'); // Vibrant Outlaw Cherry Red
                            m.roughness = 0.22;
                            m.metalness = 0.45;
                        } else if (mName.includes('chrome')) {
                            m.color.set('#f4f4f8');
                            m.roughness = 0.12;
                            m.metalness = 0.92;
                        } else if (mName.includes('pedal')) {
                            m.color.set('#383f4d'); // Clean industrial slate pedal body
                            m.roughness = 0.45;
                            m.metalness = 0.25;
                        } else if (mName.includes('reflector')) {
                            m.color.set('#ff8800');
                            m.emissive.set('#ff6600');
                            m.emissiveIntensity = 0.8;
                        } else if (mName.includes('tire')) {
                            m.color.set('#222428'); // Rich graphite rubber
                            m.roughness = 0.75;
                        } else if (mName.includes('seat')) {
                            m.color.set('#202226'); // Textured racing saddle
                            m.roughness = 0.55;
                        }
                    }
                });
            }
        });

        // Capture initial rest rotations from glTF
        if (bones.wheel) bones.wheel.rotation.order = 'ZYX';
        if (bones.frame) bones.frame.rotation.order = 'ZYX';
        if (bones.pedalL) bones.pedalL.quaternion.copy(initialRotationsRef.current.pedalL);
        if (bones.pedalR) bones.pedalR.quaternion.copy(initialRotationsRef.current.pedalR);
        if (bones.saddleHead) initialRotationsRef.current.saddleHead = bones.saddleHead.rotation.x;
    }, [clonedScene]);

    // Continuous dynamic animation loop
    useFrame((_state, delta) => {
        const dt = Math.min(delta, 0.05);
        const bones = bonesRef.current;
        const rawSpeed = uniracerState ? uniracerState.speed : Math.hypot(velocity[0], velocity[2]);
        const currentSpeed = isFinite(rawSpeed) ? rawSpeed : 0;

        // 1. Wheel Rolling & Opposing Pedals
        // Model wheel radius in raw units is 12.5; scaled factor is ~0.042 -> world radius ~0.525m
        const worldWheelRadius = 0.525;
        const rollDelta = (currentSpeed * dt) / worldWheelRadius;
        wheelRotationRef.current -= rollDelta;

        // 2. Chassis Pitch & Bank Lean
        const targetPitch = uniracerState && isFinite(uniracerState.pitchLean) ? uniracerState.pitchLean : 0;
        const targetBank = uniracerState && isFinite(uniracerState.bankLean) ? uniracerState.bankLean : 0;

        if (bones.frame) {
            bones.frame.rotation.x = THREE.MathUtils.lerp(bones.frame.rotation.x, targetPitch, Math.min(1.0, 12 * dt));
            bones.frame.rotation.z = THREE.MathUtils.lerp(bones.frame.rotation.z, targetBank, Math.min(1.0, 10 * dt));
        }

        // Wheel is clamped rigidly inside fork dropouts:
        // rolls forward around axle X while banking in 100% lockstep with frame around Z.
        // It stays strictly within the bounds of the upright fork blades at all bank angles.
        if (bones.wheel) {
            bones.wheel.rotation.x = wheelRotationRef.current;
            if (bones.frame) {
                bones.wheel.rotation.z = bones.frame.rotation.z;
            }
        }

        // Keep pedals horizontal relative to ground despite crank spin:
        // Counter-rotate around local axle axis X from the exact glTF rest pose
        const qCounter = qCounterRef.current.setFromAxisAngle(axisXRef.current, -wheelRotationRef.current);
        if (bones.pedalL) {
            bones.pedalL.quaternion.copy(qCounter).multiply(initialRotationsRef.current.pedalL);
        }
        if (bones.pedalR) {
            bones.pedalR.quaternion.copy(qCounter).multiply(initialRotationsRef.current.pedalR);
        }

        // 3. Saddle Head Camber & Apex Look
        // Keeps the saddle head perfectly parallel to the ground ("watching where it is going")
        // as the unicycle frame leans forward during acceleration or back during braking.
        if (bones.saddleHead && bones.frame) {
            const targetHeadPitch = initialRotationsRef.current.saddleHead - bones.frame.rotation.x;
            const targetHeadYaw = targetBank * 0.35;
            bones.saddleHead.rotation.x = THREE.MathUtils.lerp(bones.saddleHead.rotation.x, targetHeadPitch, Math.min(1.0, 16 * dt));
            bones.saddleHead.rotation.y = THREE.MathUtils.lerp(bones.saddleHead.rotation.y, targetHeadYaw, Math.min(1.0, 12 * dt));
        }

        // 4. Airborne 6-DOF Stunt & Wipeout Orientation
        if (chassisContainerRef.current) {
            if (uniracerState && !uniracerState.isGrounded && uniracerState.airborneRotation) {
                chassisContainerRef.current.quaternion.slerp(uniracerState.airborneRotation, Math.min(1.0, 20 * dt));
            } else if (uniracerState && uniracerState.isWipingOut && uniracerState.airborneRotation) {
                chassisContainerRef.current.quaternion.slerp(uniracerState.airborneRotation, Math.min(1.0, 15 * dt));
            } else {
                chassisContainerRef.current.quaternion.slerp(new THREE.Quaternion(), Math.min(1.0, 12 * dt));
            }
        }
    });

    // 5. Trigger Baked Blender SNES Stunt Animations
    const lastStuntRef = useRef<string>('');
    useEffect(() => {
        const text = (uniracerState?.trickText || '').toUpperCase();
        if (text && text !== lastStuntRef.current) {
            lastStuntRef.current = text;
            if (text.includes('FLIP') || text.includes('Z-FLIP') || text.includes('BACKFLIP')) {
                const act = actions['stunt_z_flip'];
                if (act) {
                    act.reset();
                    act.setLoop(THREE.LoopOnce, 1);
                    act.clampWhenFinished = true;
                    act.fadeIn(0.06).play();
                }
            } else if (text.includes('CORKSCREW') || text.includes('TWIST') || text.includes('ROLL')) {
                const act = actions['stunt_corkscrew'];
                if (act) {
                    act.reset();
                    act.setLoop(THREE.LoopOnce, 1);
                    act.clampWhenFinished = true;
                    act.fadeIn(0.06).play();
                }
            }
        }
    }, [uniracerState?.trickText, actions]);

    useEffect(() => {
        if (uniracerState?.isGrounded) {
            actions['stunt_z_flip']?.fadeOut(0.12);
            actions['stunt_corkscrew']?.fadeOut(0.12);
        }
    }, [uniracerState?.isGrounded, actions]);

    // Native height normalization:
    // Model total height is 36.16 units with wheel center at (0,0,0) and tire bottom at Y = -12.61.
    // Normalized scale factor 0.042 gives ~1.52m tall unicycle.
    // An offset of +0.53m in Y rests the tire tread directly on the world floor (Y = 0).
    const BASE_SCALE = 0.042 * scale;
    const GROUND_CONTACT_OFFSET_Y = 0.53 * scale;

    const trickText = uniracerState?.trickText || "";

    return (
        <group ref={rootGroupRef} position={position}>
            {/* Holographic Stunt Banner */}
            {trickText && (
                <Html position={[0, 1.75 * scale, 0]} center pointerEvents="none">
                    <div className="px-3 py-1.5 rounded-full bg-black/90 border-2 border-yellow-400 text-yellow-300 font-black text-sm tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.8)] uppercase whitespace-nowrap animate-bounce font-mono">
                        ⚡ {trickText} ⚡
                    </div>
                </Html>
            )}

            {/* Airborne Stunt Container */}
            <group ref={chassisContainerRef}>
                {/* Visual Uniracer GLB with ground contact offset */}
                <group position={[0, GROUND_CONTACT_OFFSET_Y, 0]} scale={[BASE_SCALE, BASE_SCALE, BASE_SCALE]}>
                    <primitive object={clonedScene} />
                </group>
            </group>
        </group>
    );
};

// Preload the hero GLB asset
useGLTF.preload('/models/uniracer_hero.glb');
