import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type LpcAction } from '../../hooks/useAvatarCompositor';
import type { KinesicVector } from '../MaxOverlay/types';
import { useWorld } from '../../engine/WorldContext';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { usePrinterPanicStore } from '../../store/usePrinterPanicStore';
import { uniracerAudio } from '../../utils/uniracerAudio';
import { UniracerTrickTracker } from '../../utils/uniracerTrickSystem';
import type { UniracerPhysicsState } from './UniracerAvatar';

export type AvatarState = LpcAction | 'talk' | 'slash' | 'hurt' | 'drive';

interface AvatarControllerProps {
    id: string;
    initialPosition?: [number, number, number];
    targetCell?: string;
    gridConfig?: { width: number, depth: number };
    isWandering?: boolean;
    spawnPoint?: string;
    locomotionPath?: string;
    getElevation?: (x: number, z: number) => number;
    liftFactor?: number;
    targetPosition?: [number, number, number];
    isManualControl?: boolean;
    locomotionType?: 'humanoid' | 'uniracer';
    speed?: number;
    isLevitationEnabled?: boolean;
    cameraRotationY?: number;
    onCameraRotate?: (delta: number) => void;
    onCameraTilt?: (delta: number) => void;
    onCameraStrafeY?: (delta: number) => void;
    onTrackPosition?: (pos: THREE.Vector3, velocity: number[], rotation: number) => void;
    interactionCount?: number;
    forcedAction?: LpcAction;
    onStrike?: () => void;
    projection?: 'flat' | 'spherical';
    currentDimension?: string;
    children: (props: {
        position: [number, number, number];
        velocity: [number, number, number];
        rotation?: number;
        state: AvatarState;
        isDashing: boolean;
        isSprinting: boolean;
        kinesicVector: KinesicVector;
        impactPulse: number;
        isPlayerInSight?: boolean;
        uniracerState?: UniracerPhysicsState;
    }) => React.ReactNode;
}

export const AvatarController: React.FC<AvatarControllerProps> = (props) => {
    const {
        id,
        initialPosition = [0, 50, 0], // START IN SKY TO PREVENT UNDERGROUND SPAWN
        isManualControl,
        locomotionType = 'humanoid',
        speed = 1.0, isLevitationEnabled = false,
        cameraRotationY = 0, onCameraRotate, onCameraTilt, onCameraStrafeY, onTrackPosition,
        forcedAction, onStrike, projection = 'flat',
        getElevation, liftFactor, children
    } = props;

    const { stashedPosition, currentDimension } = useWorld();
    const activeDimension = props.currentDimension || currentDimension || 'desktop';

    const [renderState, setRenderState] = useState({
        position: initialPosition,
        velocity: [0, 0, 0] as [number, number, number],
        state: 'idle' as AvatarState,
        isDashing: false,
        isSprinting: false,
        kinesicVector: { eyeShiftY: 0, eyeWidening: 0, mouthScale: 1, mouthOpen: 0, headTilt: 0, intensity: 0 },
        impactPulse: 0,
        isPlayerInSight: false
    });

    const posRef = useRef<[number, number, number]>([initialPosition[0], 50.0, initialPosition[2]]);
    const velRef = useRef<[number, number, number]>([0, 0, 0]);
    const keys = useRef<Record<string, boolean>>({});
    const localTrackPosRef = useRef(new THREE.Vector3(0, 0, 0));
    const GRID_SIZE = 1.524;
    const GRAVITY = -30.0;
    const lastRenderTime = useRef(0);
    const lastIntentionalVel = useRef<[number, number, number]>([0, 0, 0]);
    const prevRotRef = useRef(0);
    const jumpCountRef = useRef(0);
    const stateRef = useRef<AvatarState>('idle');
    const stateTimer = useRef(0);

    // NON-DESTRUCTIVE GENTLE EXPLORATION REFS
    const wanderTargetRef = useRef<[number, number] | null>(null);
    const wanderTimerRef = useRef<number>(3.0 + Math.random() * 4.0);
    const anchorPosRef = useRef<[number, number]>([initialPosition[0], initialPosition[2]]);

    // UNIRACER SOVEREIGN PHYSICS REFS
    const headingRef = useRef<number>(0);
    const unicycleSpeedRef = useRef<number>(0);
    const bankLeanRef = useRef<number>(0);
    const pitchLeanRef = useRef<number>(0);
    const airborneRotationRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
    const isAirborneRef = useRef<boolean>(false);
    const isWipingOutRef = useRef<boolean>(false);
    const wipeoutTimerRef = useRef<number>(0);
    const isBrakeGluedToggleRef = useRef<boolean>(false);
    const [trickBanner, setTrickBanner] = useState<string>('');
    const trickTrackerRef = useRef(new UniracerTrickTracker());
    const grindTimerRef = useRef<number>(0);
    const isGrindingRef = useRef<boolean>(false);
    const prevPadButtonsRef = useRef<boolean[]>([]);

    // DETERMINISTIC TOPOGRAPHY BRIDGING
    const localTopographyRef = useRef<number>(0);
    const lastGroundYRef = useRef<number>(0);
    const marioWalkTimerRef = useRef<number>(0);

    useEffect(() => {
        const handleMarioWalk = () => {
            if (isManualControl) {
                marioWalkTimerRef.current = 1.4; // 1.4s kinematic walk forward through doorway // 850ms kinematic walk forward into doorway
            }
        };
        window.addEventListener('myos:mario-walk-in', handleMarioWalk);
        return () => window.removeEventListener('myos:mario-walk-in', handleMarioWalk);
    }, [isManualControl]);

    // Bridge: Ensure the registry knows what dimension we are in
    useEffect(() => {
        topographyRegistry.setCurrent(activeDimension);
    }, [activeDimension]);

    const raycasterRef = useRef(new THREE.Raycaster());

    const storePlayerPos = usePersistentWorldStore(state => state.playerPos);
    const lastTeleportPos = useRef<[number, number, number] | null>(null);

    useEffect(() => {
        if (isManualControl && storePlayerPos) {
            const distFromCurrent = Math.hypot(
                storePlayerPos[0] - posRef.current[0],
                storePlayerPos[2] - posRef.current[2]
            );
            // Only warp/teleport if this is a genuine position jump (> 3.0 meters away)
            if (!lastTeleportPos.current || distFromCurrent > 3.0) {
                posRef.current[0] = storePlayerPos[0];
                posRef.current[2] = storePlayerPos[2];
                const elev = topographyRegistry.getElevation(storePlayerPos[0], storePlayerPos[2]);
                posRef.current[1] = elev + (liftFactor !== undefined ? liftFactor : 1.0);
                localTrackPosRef.current.set(storePlayerPos[0], posRef.current[1], storePlayerPos[2]);
                lastTeleportPos.current = [...storePlayerPos];
            }
        }
    }, [storePlayerPos, isManualControl, liftFactor]);

    useLayoutEffect(() => {
        if (isManualControl && stashedPosition) {
            posRef.current[0] = stashedPosition[0];
            posRef.current[2] = stashedPosition[2];
            const initY = topographyRegistry.getElevation(stashedPosition[0], stashedPosition[2]);
            posRef.current[1] = initY + (liftFactor !== undefined ? liftFactor : 1.0);
            localTrackPosRef.current.set(stashedPosition[0], posRef.current[1], stashedPosition[2]);
        } else {
            const initY = topographyRegistry.getElevation(posRef.current[0], posRef.current[2]);
            posRef.current[1] = initY + (liftFactor !== undefined ? liftFactor : 1.0);
        }

        // Clear velocity on transition
        velRef.current = [0, 0, 0];
    }, [currentDimension]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((window as any).__myos_screen_focus_locked) {
                keys.current = {};
                return;
            }
            if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                keys.current[e.code] = true;
                if (e.code === 'KeyB') {
                    isBrakeGluedToggleRef.current = !isBrakeGluedToggleRef.current;
                }
            }
        };
        const up = (e: KeyboardEvent) => { 
            if ((window as any).__myos_screen_focus_locked) {
                keys.current = {};
                return;
            }
            keys.current[e.code] = false; 
        };
        window.addEventListener('keydown', down); window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    useFrame((_state, delta) => {
        // Decrement animation timers
        if (stateTimer.current > 0) stateTimer.current -= delta;

        if (!isManualControl) {
            // --- NPC GROUNDING & PHYSICS ---
            if (!isLevitationEnabled) {
                velRef.current[1] += GRAVITY * delta;
            }
            posRef.current[1] += velRef.current[1] * delta;

            let isNpcMoving = false;
            let npcRotation = prevRotRef.current;
            let npcVelocity: [number, number, number] = [0, 0, 0];

            if (props.targetPosition) {
                const targetX = props.targetPosition[0];
                const targetZ = props.targetPosition[2];
                const distToTarget = Math.hypot(targetX - posRef.current[0], targetZ - posRef.current[2]);

                // Generous conversational follow distance (idle when <= 3.5m, walk when > 4.5m, sprint when > 9.0m)
                if (distToTarget > 4.5) {
                    const dirX = (targetX - posRef.current[0]) / distToTarget;
                    const dirZ = (targetZ - posRef.current[2]) / distToTarget;
                    const isSprinting = distToTarget > 9.0;
                    const npcMoveSpeed = (isSprinting ? 5.2 : 2.5) * speed;
                    
                    posRef.current[0] += dirX * npcMoveSpeed * delta;
                    posRef.current[2] += dirZ * npcMoveSpeed * delta;
                    
                    npcVelocity = [dirX * npcMoveSpeed, 0, dirZ * npcMoveSpeed];
                    npcRotation = locomotionType === 'uniracer' ? Math.atan2(-dirX, -dirZ) : Math.atan2(dirX, dirZ);
                    prevRotRef.current = npcRotation;
                    isNpcMoving = true;
                    stateRef.current = isSprinting ? 'sprint' : 'walk';
                } else {
                    stateRef.current = 'idle';
                    // Face slightly towards target when idle
                    const dirX = targetX - posRef.current[0];
                    const dirZ = targetZ - posRef.current[2];
                    if (Math.hypot(dirX, dirZ) > 0.5) {
                        npcRotation = locomotionType === 'uniracer' ? Math.atan2(-dirX, -dirZ) : Math.atan2(dirX, dirZ);
                        prevRotRef.current = npcRotation;
                    }
                }
            } else if (props.isWandering) {
                // Non-destructive gentle exploration with table-awareness
                wanderTimerRef.current -= delta;

                if (wanderTimerRef.current <= 0) {
                    const exploreMode = Math.random();
                    if (exploreMode < 0.55) {
                        // Gentle pacing near their anchor (radius 2.5m)
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 0.8 + Math.random() * 2.0;
                        wanderTargetRef.current = [
                            anchorPosRef.current[0] + Math.cos(angle) * dist,
                            anchorPosRef.current[1] + Math.sin(angle) * dist
                        ];
                    } else if (exploreMode < 0.82) {
                        // Step up respectfully to observe the board game table (at radius 2.3m from center)
                        const tableX = 0;
                        const tableZ = 1.8;
                        const toAngle = Math.atan2(anchorPosRef.current[1] - tableZ, anchorPosRef.current[0] - tableX);
                        wanderTargetRef.current = [
                            tableX + Math.cos(toAngle) * 2.3,
                            tableZ + Math.sin(toAngle) * 2.3
                        ];
                    } else {
                        // Return to home circle anchor
                        wanderTargetRef.current = [...anchorPosRef.current];
                    }
                    wanderTimerRef.current = 4.5 + Math.random() * 5.0; // Thoughtful pause
                }

                if (wanderTargetRef.current) {
                    const tX = wanderTargetRef.current[0];
                    const tZ = wanderTargetRef.current[1];
                    const dist = Math.hypot(tX - posRef.current[0], tZ - posRef.current[2]);

                    if (dist > 0.35) {
                        let dirX = (tX - posRef.current[0]) / dist;
                        let dirZ = (tZ - posRef.current[2]) / dist;

                        // Soft table collision repulsion (table at [0, 1.8])
                        const distToTable = Math.hypot(posRef.current[0] - 0, posRef.current[2] - 1.8);
                        if (distToTable < 2.0) {
                            const pushAwayX = (posRef.current[0] - 0) / (distToTable || 1);
                            const pushAwayZ = (posRef.current[2] - 1.8) / (distToTable || 1);
                            dirX = dirX * 0.4 + pushAwayX * 0.6;
                            dirZ = dirZ * 0.4 + pushAwayZ * 0.6;
                        }

                        const walkSpeed = 0.95 * speed;
                        const nextX = posRef.current[0] + dirX * walkSpeed * delta;
                        const nextZ = posRef.current[2] + dirZ * walkSpeed * delta;

                        // Environment boundary clamp (stay safely within Agora perimeter)
                        if (Math.hypot(nextX, nextZ) < 12.0) {
                            posRef.current[0] = nextX;
                            posRef.current[2] = nextZ;
                        }

                        npcVelocity = [dirX * walkSpeed, 0, dirZ * walkSpeed];
                        npcRotation = Math.atan2(dirX, dirZ);
                        prevRotRef.current = npcRotation;
                        isNpcMoving = true;
                        stateRef.current = 'walk';
                    } else {
                        stateRef.current = 'idle';
                        wanderTargetRef.current = null;
                        // Turn to face center table when idling
                        const faceDirX = 0 - posRef.current[0];
                        const faceDirZ = 1.8 - posRef.current[2];
                        if (Math.hypot(faceDirX, faceDirZ) > 0.2) {
                            npcRotation = Math.atan2(faceDirX, faceDirZ);
                            prevRotRef.current = npcRotation;
                        }
                    }
                }
            }

            const samplingX = projection === 'spherical' ? localTrackPosRef.current.x : posRef.current[0];
            const samplingZ = projection === 'spherical' ? localTrackPosRef.current.z : posRef.current[2];
            
            const groundY = topographyRegistry.getElevation(samplingX, samplingZ);
            const targetPhysicsY = groundY + (liftFactor !== undefined ? liftFactor : 1.0);

            if (posRef.current[1] <= targetPhysicsY) {
                posRef.current[1] = targetPhysicsY;
                velRef.current[1] = 0;
            }

            if (performance.now() - lastRenderTime.current > 16) {
                const activeAction: AvatarState = forcedAction || stateRef.current || (isNpcMoving ? 'walk' : 'idle');
                const isPosDiff = Math.abs(posRef.current[0] - renderState.position[0]) > 0.001 ||
                                  Math.abs(posRef.current[1] - renderState.position[1]) > 0.001 ||
                                  Math.abs(posRef.current[2] - renderState.position[2]) > 0.001 ||
                                  activeAction !== renderState.state ||
                                  npcRotation !== (renderState as any).rotation;
                
                if (isPosDiff) {
                    setRenderState(prev => ({
                        ...prev,
                        position: [posRef.current[0], posRef.current[1], posRef.current[2]],
                        velocity: npcVelocity,
                        state: activeAction,
                        rotation: npcRotation
                    } as any));
                }
                // Broadcast to Spatial Registry
                usePersistentWorldStore.getState().setAgentPosition(id, [posRef.current[0], posRef.current[1], posRef.current[2]]);
                lastRenderTime.current = performance.now();
            }
            return;
        }



        const dt = Math.min(delta, 0.05);

        // --- 0. GAMEPAD SOVEREIGN ENGINE POLLING ---
        let padX = 0;
        let padY = 0;
        let padCamX = 0;
        let padCamY = 0;
        let padJump = false;
        let padSprint = false;
        let padSlash = false;
        let padActionY = false;
        let padActionB = false;
        let padDpadUp = false;
        let padDpadDown = false;
        let padDpadLeft = false;
        let padDpadRight = false;
        let padLB = false;
        let padRB = false;
        let padLT = 0;
        let padRT = 0;

        const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
        for (const gp of gamepads) {
            if (!gp || !gp.connected) continue;

            const isDown = (idx: number) => {
                const b = gp.buttons[idx];
                return typeof b === 'object' ? b.pressed : b > 0.5;
            };
            const wasDown = (idx: number) => !!prevPadButtonsRef.current[idx];
            const isJustPressed = (idx: number) => isDown(idx) && !wasDown(idx);

            // Left Stick: Locomotion / Steering (deadzone 0.15)
            if (Math.abs(gp.axes[0] || 0) > 0.15) padX = gp.axes[0];
            if (Math.abs(gp.axes[1] || 0) > 0.15) padY = gp.axes[1];

            // Right Stick: Camera (deadzone 0.15)
            if (Math.abs(gp.axes[2] || 0) > 0.15) padCamX = gp.axes[2];
            if (Math.abs(gp.axes[3] || 0) > 0.15) padCamY = gp.axes[3];

            // Triggers (analog or digital)
            const rawLT = typeof gp.buttons[6] === 'object' ? gp.buttons[6].value : (gp.buttons[6] ? 1 : 0);
            const rawRT = typeof gp.buttons[7] === 'object' ? gp.buttons[7].value : (gp.buttons[7] ? 1 : 0);
            if (rawLT > 0.1) padLT = rawLT;
            if (rawRT > 0.1) padRT = rawRT;

            if (isDown(7) || isDown(10)) padSprint = true; // RT or L3 click
            if (isJustPressed(0)) padJump = true;          // A / Cross
            if (isJustPressed(1)) padActionB = true;       // B / Circle (Brake Glue toggle for Red / Talk for Larry)
            if (isJustPressed(2)) padSlash = true;         // X / Square (Slash / Stunt)
            if (isJustPressed(3)) padActionY = true;       // Y / Triangle (Spellcast / Emote)
            if (isDown(4)) padLB = true;                   // LB
            if (isDown(5)) padRB = true;                   // RB

            // D-Pad discrete emote triggers
            if (isJustPressed(12)) padDpadUp = true;       // D-pad Up (Agree)
            if (isJustPressed(13)) padDpadDown = true;     // D-pad Down (Dismiss / Crouch)
            if (isJustPressed(14)) padDpadLeft = true;     // D-pad Left (Dance)
            if (isJustPressed(15)) padDpadRight = true;    // D-pad Right (Combat Stance)

            // Save previous button states for edge detection
            const currentButtons: boolean[] = [];
            for (let i = 0; i < gp.buttons.length; i++) {
                currentButtons[i] = isDown(i);
            }
            prevPadButtonsRef.current = currentButtons;
            break; // Primary gamepad processed
        }

        if (padActionB && locomotionType === 'uniracer') {
            isBrakeGluedToggleRef.current = !isBrakeGluedToggleRef.current;
        }

        // 0. CAMERA & UTILITY INPUTS
        // When on flat ground (not performing in-air stunts), Q and E revolve the viewport around the user!
        const isStuntingInAir = locomotionType === 'uniracer' && isAirborneRef.current;
        if (!isStuntingInAir) {
            if (onCameraRotate) {
                const rotDelta = (keys.current['KeyQ'] ? 1 : 0) - (keys.current['KeyE'] ? 1 : 0) + (Math.abs(padCamX) > 0.15 ? -padCamX * 1.5 : 0) + (padLB ? 1 : 0) - (padRB ? 1 : 0);
                if (rotDelta !== 0) onCameraRotate(rotDelta * 2.5 * dt);
            }
            if (onCameraTilt) {
                const tiltDelta = (keys.current['KeyR'] ? 1 : 0) - (keys.current['KeyF'] ? 1 : 0) + (Math.abs(padCamY) > 0.15 ? -padCamY * 1.5 : 0);
                if (tiltDelta !== 0) onCameraTilt(tiltDelta * 2.5 * dt);
            }
        }
        if (onCameraStrafeY) {
            const strafeDelta = (keys.current['KeyT'] ? 1 : 0) - (keys.current['KeyG'] ? 1 : 0);
            if (strafeDelta !== 0) onCameraStrafeY(strafeDelta * 15.0 * dt);
        }

        // =========================================================================
        // UNIRACER SOVEREIGN LOCOMOTION & STUNT ENGINE
        // =========================================================================
        if (locomotionType === 'uniracer') {
            // Safety sanitization against NaN
            if (!isFinite(posRef.current[0]) || !isFinite(posRef.current[1]) || !isFinite(posRef.current[2])) {
                const elev = topographyRegistry.getElevation(0, 0);
                posRef.current = [0, elev + (liftFactor !== undefined ? liftFactor : 0.0), -1.8];
                velRef.current = [0, 0, 0];
                headingRef.current = 0;
                unicycleSpeedRef.current = 0;
                bankLeanRef.current = 0;
                pitchLeanRef.current = 0;
                airborneRotationRef.current.identity();
            }

            const isAccelerating = !!(keys.current['KeyW']) || padY < -0.25 || padRT > 0.2;
            const isBraking = !!(keys.current['KeyS']) || padY > 0.25 || padLT > 0.2;
            // Directional Steering strictly on A and D or Gamepad Left Stick X
            const steerVal = ((keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)) + (Math.abs(padX) > 0.15 ? padX : 0);
            const isJumpPressed = !!(keys.current['Space']) || padJump;

            // 0. BRAKE GLUE ("TIRE GLUE") EMOTE LOCK
            // Locks the bottom of the tire to the ground or cushion so Red stays stationary,
            // allowing W/S (pitch) and A/D (camber) to be used exclusively for expressive character acting during filming.
            const isBrakeGlued = (isBrakeGluedToggleRef.current || !!(keys.current['ShiftLeft'] || keys.current['ShiftRight'] || keys.current['KeyB'])) && !isAirborneRef.current;

            // 1. Steering & Banking
            if (isBrakeGlued) {
                // Ground contact is glued: A/D directly cambers unicycle frame left/right without rotating heading
                const targetBank = steerVal * 0.38; // KeyD tilts right (+0.38 rad), KeyA tilts left (-0.38 rad)
                bankLeanRef.current = THREE.MathUtils.lerp(bankLeanRef.current, targetBank, Math.min(1.0, 10 * dt));
            } else {
                if (steerVal !== 0 && !isWipingOutRef.current) {
                    const turnMultiplier = Math.abs(unicycleSpeedRef.current) > 1.0 ? 3.0 : 2.2;
                    headingRef.current -= steerVal * turnMultiplier * dt;
                }
                const targetBank = -steerVal * (Math.abs(unicycleSpeedRef.current) > 1.0 ? 0.35 : 0.15);
                bankLeanRef.current = THREE.MathUtils.lerp(bankLeanRef.current, targetBank, Math.min(1.0, 10 * dt));
            }

            // 2. Linear Throttle & Momentum Physics
            if (isBrakeGlued) {
                // Ground contact is glued: Speed is strictly 0. W/S leans pitch forward/backward for head/body acting
                unicycleSpeedRef.current = 0;
                const targetPitch = (isAccelerating ? -0.42 : 0) + (isBraking ? 0.42 : 0);
                pitchLeanRef.current = THREE.MathUtils.lerp(pitchLeanRef.current, targetPitch, Math.min(1.0, 10 * dt));
            } else if (!isWipingOutRef.current) {
                if (isAccelerating) {
                    const maxSpd = 16.0 * speed;
                    unicycleSpeedRef.current = Math.min(maxSpd, unicycleSpeedRef.current + 18.0 * dt);
                    pitchLeanRef.current = THREE.MathUtils.lerp(pitchLeanRef.current, -0.26, Math.min(1.0, 12 * dt));
                } else if (isBraking) {
                    unicycleSpeedRef.current = Math.max(-6.0 * speed, unicycleSpeedRef.current - 22.0 * dt);
                    pitchLeanRef.current = THREE.MathUtils.lerp(pitchLeanRef.current, 0.32, Math.min(1.0, 12 * dt));
                } else {
                    unicycleSpeedRef.current *= Math.pow(0.965, dt * 60);
                    if (Math.abs(unicycleSpeedRef.current) < 0.05) unicycleSpeedRef.current = 0;
                    pitchLeanRef.current = THREE.MathUtils.lerp(pitchLeanRef.current, 0, Math.min(1.0, 8 * dt));
                }
            } else {
                unicycleSpeedRef.current *= Math.pow(0.92, dt * 60);
                pitchLeanRef.current = THREE.MathUtils.lerp(pitchLeanRef.current, 0, Math.min(1.0, 8 * dt));
            }

            // 3. Jump Launching
            if (isJumpPressed && !isAirborneRef.current && !isWipingOutRef.current) {
                velRef.current[1] = 11.5;
                isAirborneRef.current = true;
                trickTrackerRef.current.startJump();
                uniracerAudio.playJumpWhoosh();
                keys.current['Space'] = false;
            }

            // 4. In-Air 6-DOF Stunt Rotations:
            // Left/Right Arrow keys or Gamepad Left Stick / D-Pad = Z-axis Barrel Roll
            // Up/Down Arrow keys, R/F, or Gamepad Left Stick Y = X-axis Pitch Flip
            // Q/E, LB/RB, or X/Y buttons = Y-axis Yaw Spin
            if (isAirborneRef.current && !isWipingOutRef.current) {
                const pitchInput = ((keys.current['KeyF'] || keys.current['ArrowDown'] ? 1 : 0) - (keys.current['KeyR'] || keys.current['ArrowUp'] ? 1 : 0)) + (Math.abs(padY) > 0.2 ? padY : 0);
                const yawInput = ((keys.current['KeyQ'] ? 1 : 0) - (keys.current['KeyE'] ? 1 : 0)) + (padLB ? 1 : 0) - (padRB ? 1 : 0) + (padSlash ? 1 : 0) - (padActionY ? 1 : 0);
                const rollInput = ((keys.current['ArrowLeft'] ? 1 : 0) - (keys.current['ArrowRight'] ? 1 : 0)) + (Math.abs(padX) > 0.2 ? -padX : 0) + (padDpadLeft ? 1 : 0) - (padDpadRight ? 1 : 0);

                const pitchDelta = pitchInput * 6.5 * dt;
                const yawDelta = yawInput * 6.5 * dt;
                const rollDelta = rollInput * 5.5 * dt;

                const stuntEuler = new THREE.Euler(pitchDelta, yawDelta, rollDelta, 'YXZ');
                const stuntQuat = new THREE.Quaternion().setFromEuler(stuntEuler);
                airborneRotationRef.current.multiply(stuntQuat);
                airborneRotationRef.current.normalize();

                trickTrackerRef.current.updateAirborneDeltas(pitchDelta, yawDelta, rollDelta);
            }

            // 5. Wipeout Tumbling
            if (isWipingOutRef.current) {
                wipeoutTimerRef.current -= dt;
                const tumbleSpeed = 16.0;
                const tumbleEuler = new THREE.Euler(
                    (Math.random() - 0.5) * tumbleSpeed * dt,
                    (Math.random() - 0.5) * tumbleSpeed * dt,
                    (Math.random() - 0.5) * tumbleSpeed * dt
                );
                airborneRotationRef.current.multiply(new THREE.Quaternion().setFromEuler(tumbleEuler));
                airborneRotationRef.current.normalize();

                if (wipeoutTimerRef.current <= 0) {
                    isWipingOutRef.current = false;
                    airborneRotationRef.current.identity();
                }
            }

            // 6. Horizontal Translation
            const moveVx = isBrakeGlued ? 0 : -Math.sin(headingRef.current) * unicycleSpeedRef.current;
            const moveVz = isBrakeGlued ? 0 : -Math.cos(headingRef.current) * unicycleSpeedRef.current;

            const curX = posRef.current[0];
            const curY = posRef.current[1];
            const curZ = posRef.current[2];
            const targetX = curX + moveVx * dt;
            const targetZ = curZ + moveVz * dt;

            if (!topographyRegistry.isBlocked(targetX, curZ, 0.45, curY)) {
                posRef.current[0] = targetX;
            }
            if (!topographyRegistry.isBlocked(posRef.current[0], targetZ, 0.45, curY)) {
                posRef.current[2] = targetZ;
            }

            // 7. Vertical Physics & Grounding
            if (topographyRegistry.getCurrentId() !== activeDimension) {
                topographyRegistry.setCurrent(activeDimension);
            }

            velRef.current[1] += GRAVITY * dt;
            posRef.current[1] += velRef.current[1] * dt;

            const groundY = props.getElevation 
                ? props.getElevation(posRef.current[0], posRef.current[2])
                : topographyRegistry.getElevation(posRef.current[0], posRef.current[2]);
            const targetPhysicsY = groundY + (liftFactor !== undefined ? liftFactor : 0.0);

            // Dynamic ramp climb momentum (convert horizontal speed up slope into vertical lift)
            if (!isAirborneRef.current && !isWipingOutRef.current && dt > 0) {
                const slopeLift = (groundY - lastGroundYRef.current) / dt;
                if (slopeLift > 1.2) {
                    velRef.current[1] = Math.max(velRef.current[1], slopeLift * 0.95);
                }
            }
            lastGroundYRef.current = groundY;

            // Lip takeoff detection: if launched upward past the ramp lip, become airborne smoothly!
            if (posRef.current[1] > targetPhysicsY + 0.25 && velRef.current[1] > 2.5 && !isAirborneRef.current && !isWipingOutRef.current) {
                isAirborneRef.current = true;
                trickTrackerRef.current.startJump();
                uniracerAudio.playJumpWhoosh();
            }

            if (posRef.current[1] <= targetPhysicsY) {
                posRef.current[1] = targetPhysicsY;

                if (isAirborneRef.current) {
                    isAirborneRef.current = false;
                    velRef.current[1] = 0;

                    const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(airborneRotationRef.current);
                    if (localUp.y < 0.45) {
                        isWipingOutRef.current = true;
                        wipeoutTimerRef.current = 2.0;
                        velRef.current[1] = 6.0;
                        unicycleSpeedRef.current *= 0.4;
                        setTrickBanner("WIPEOUT!");
                        uniracerAudio.playWipeoutBounce();
                        setTimeout(() => setTrickBanner(""), 2000);
                    } else {
                        uniracerAudio.playLandingThud();
                        airborneRotationRef.current.identity();
                        const stunt = trickTrackerRef.current.completeJump();
                        if (stunt) {
                            unicycleSpeedRef.current += stunt.boost;
                            uniracerAudio.playStuntChime(stunt.tier);
                            setTrickBanner(`${stunt.name} (+${stunt.score})`);
                            setTimeout(() => setTrickBanner(""), 2200);
                        }
                    }
                } else if (!isWipingOutRef.current) {
                    velRef.current[1] = 0;
                    airborneRotationRef.current.slerp(new THREE.Quaternion(), Math.min(1.0, 12 * dt));
                }
            }

            // 8. Rail Grind Friction & Spark Audio
            const isOnRailOrCoping = !isAirborneRef.current && !isWipingOutRef.current && groundY >= 1.25 && Math.abs(unicycleSpeedRef.current) > 1.8;
            if (isOnRailOrCoping) {
                uniracerAudio.playGrindSpark();
                grindTimerRef.current += dt;
                if (grindTimerRef.current > 0.35 && !isGrindingRef.current) {
                    isGrindingRef.current = true;
                    setTrickBanner("RAIL 50-50 GRIND (+250)");
                    uniracerAudio.playStuntChime(1);
                }
            } else {
                if (isGrindingRef.current) {
                    isGrindingRef.current = false;
                    setTimeout(() => setTrickBanner(""), 1200);
                }
                grindTimerRef.current = 0;
            }

            // Sync render state
            const currentVelocity: [number, number, number] = [moveVx, velRef.current[1], moveVz];
            prevRotRef.current = headingRef.current;

            if (performance.now() - lastRenderTime.current > 16) {
                setRenderState({
                    position: [posRef.current[0], posRef.current[1], posRef.current[2]],
                    velocity: currentVelocity,
                    rotation: headingRef.current,
                    state: Math.abs(unicycleSpeedRef.current) > 0.1 ? 'drive' : 'idle',
                    isDashing: false,
                    isSprinting: Math.abs(unicycleSpeedRef.current) > 10.0,
                    kinesicVector: renderState.kinesicVector,
                    impactPulse: 0,
                    isPlayerInSight: false,
                    uniracerState: {
                        speed: unicycleSpeedRef.current,
                        heading: headingRef.current,
                        pitchLean: pitchLeanRef.current,
                        bankLean: bankLeanRef.current,
                        airborneRotation: airborneRotationRef.current,
                        isGrounded: !isAirborneRef.current,
                        isWipingOut: isWipingOutRef.current,
                        trickText: trickBanner,
                        isBrakeGlued: isBrakeGlued
                    }
                } as any);

                if (onTrackPosition) {
                    onTrackPosition(new THREE.Vector3(...posRef.current), velRef.current, headingRef.current);
                }
                lastRenderTime.current = performance.now();
            }
            return;
        }

        // 0.5 INTERACTION LOCKS (ATTACK / HURT / EMOTES)
        if (isManualControl) {
            let requestedAction: AvatarState | null = null;
            if (keys.current['KeyH']) {
                requestedAction = 'hurt';
                keys.current['KeyH'] = false; // consume
            } else if (keys.current['KeyJ'] || padSlash) {
                requestedAction = 'slash';
                keys.current['KeyJ'] = false; // consume
            } else if (padActionY) {
                requestedAction = 'spellcast';
            } else if (padActionB) {
                requestedAction = 'talk';
            } else if (padDpadLeft) {
                requestedAction = 'dance';
            } else if (padDpadRight) {
                requestedAction = 'combat_idle';
            } else if (padDpadUp) {
                requestedAction = 'agreeing';
            } else if (padDpadDown) {
                requestedAction = 'dismissing_gesture';
            }

            if (requestedAction) {
                // Interruption Priority Queue: hurt > slash > emotes
                if (requestedAction === 'hurt') {
                    stateRef.current = 'hurt';
                    stateTimer.current = 0.6; // 600ms lock
                } else if (requestedAction === 'slash') {
                    // Only allow slash if not currently hurt
                    if (stateRef.current !== 'hurt' || stateTimer.current <= 0) {
                        stateRef.current = 'slash';
                        stateTimer.current = 0.5; // 500ms lock
                        if (onStrike) onStrike();
                    }
                } else {
                    stateRef.current = requestedAction;
                    stateTimer.current = 0.75; // Emote action lock
                }
            }
        }

        const isActionLocked = stateTimer.current > 0 && (stateRef.current === 'slash' || stateRef.current === 'hurt');

        const keyVx = (keys.current['KeyD'] || keys.current['ArrowRight'] ? 1 : 0) - (keys.current['KeyA'] || keys.current['ArrowLeft'] ? 1 : 0);
        const keyVz = (keys.current['KeyS'] || keys.current['ArrowDown'] ? 1 : 0) - (keys.current['KeyW'] || keys.current['ArrowUp'] ? 1 : 0);
        let vxRaw = isActionLocked ? 0 : (keyVx + (Math.abs(padX) > 0.15 ? padX : 0));
        let vzRaw = isActionLocked ? 0 : (keyVz + (Math.abs(padY) > 0.15 ? padY : 0));

        // Mario 64 Walk-in Threshold: avatar walks straight into the portal doorway toward -Z
        if (marioWalkTimerRef.current > 0) {
            marioWalkTimerRef.current -= delta;
            vzRaw = -1.0;
            vxRaw = 0.0;
            stateRef.current = 'walk';
        }
        let isMoving = Math.abs(vxRaw) > 0.05 || Math.abs(vzRaw) > 0.05;
        let isSprinting = !isActionLocked && (keys.current['ShiftLeft'] || keys.current['ShiftRight'] || padSprint);

        // Check if Printer Panic autonomous idle mode is active
        const panicStore = usePrinterPanicStore.getState();
        const isPanicAutonomous = isManualControl && currentDimension === 'printer_panic' && panicStore.isAutonomousMode;

        let autoDx = 0;
        let autoDz = 0;
        if (isPanicAutonomous && !isMoving) {
            const autoVec = panicStore.autonomousMoveVector;
            if (autoVec) {
                autoDx = autoVec[0];
                autoDz = autoVec[1];
                isMoving = true;
                if (panicStore.autonomousIsSprinting) {
                    isSprinting = true;
                }
            }
        }

        // 1. HORIZONTAL INTENT
        let dx = 0, dz = 0;
        const moveSpeed = (isSprinting ? 6.0 : 3.0) * speed;

        if (projection === 'spherical') {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(_state.camera.quaternion); forward.y = 0; forward.normalize();
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(_state.camera.quaternion); right.y = 0; right.normalize();
            const moveDir = new THREE.Vector3().addScaledVector(forward, -vzRaw).addScaledVector(right, vxRaw);
            if (moveDir.lengthSq() > 0.001) {
                moveDir.normalize();
                lastIntentionalVel.current = [moveDir.x, 0, moveDir.z];
            }
            dx = moveDir.x * moveSpeed * delta;
            dz = moveDir.z * moveSpeed * delta;
            localTrackPosRef.current.x += dx;
            localTrackPosRef.current.z += dz;
            posRef.current[0] = 0; posRef.current[2] = 0;
        } else {
            const moveVec = new THREE.Vector3(vxRaw, 0, vzRaw);
            if (cameraRotationY && (vxRaw !== 0 || vzRaw !== 0)) {
                moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY);
            } else if (autoDx !== 0 || autoDz !== 0) {
                moveVec.set(autoDx, 0, autoDz);
            }
            if (isMoving) {
                lastIntentionalVel.current = [moveVec.x, 0, moveVec.z];
            }
            dx = moveVec.x * moveSpeed * delta;
            dz = moveVec.z * moveSpeed * delta;

            // Axis-decoupled sliding collision against world obstacles
            const curX = posRef.current[0];
            const curY = posRef.current[1];
            const curZ = posRef.current[2];
            const targetX = curX + dx;
            const targetZ = curZ + dz;

            if (!topographyRegistry.isBlocked(targetX, curZ, 0.45, curY)) {
                posRef.current[0] = targetX;
            }
            if (!topographyRegistry.isBlocked(posRef.current[0], targetZ, 0.45, curY)) {
                posRef.current[2] = targetZ;
            }
        }

        // 2. VERTICAL PHYSICS
        if (!isLevitationEnabled) {
            velRef.current[1] += GRAVITY * delta;
        }
        posRef.current[1] += velRef.current[1] * delta;

        // --- DETERMINISTIC HEIGHTMAP GROUNDING ENGINE ---
        const samplingX = projection === 'spherical' ? localTrackPosRef.current.x : posRef.current[0];
        const samplingZ = projection === 'spherical' ? localTrackPosRef.current.z : posRef.current[2];

        // Sample exact ground elevation from topography registry
        const groundY = topographyRegistry.getElevation(samplingX, samplingZ);
        localTopographyRef.current = groundY;

        const targetPhysicsY = groundY + (liftFactor !== undefined ? liftFactor : 1.0);

        // DEBUG BRIDGE
        (window as any).GROUND_DEBUG = {
            id, y: posRef.current[1], groundY, targetPhysicsY, dimension: currentDimension
        };

        // Ground Collision & Continuous Floor Clinging (Player Y continuously tracks terrain heightmap)
        if (!isLevitationEnabled) {
            if (velRef.current[1] <= 0 || posRef.current[1] <= targetPhysicsY) {
                posRef.current[1] = targetPhysicsY;
                velRef.current[1] = 0;
                jumpCountRef.current = 0;
            }
        }

        // Jump Trigger (Disabled in Sector-404 Printer Panic so Space is purely action/interaction)
        if ((keys.current['Space'] || padJump) && jumpCountRef.current < 2 && !isLevitationEnabled && currentDimension !== 'printer_panic') {
            velRef.current[1] = 10.0;
            jumpCountRef.current++;
            keys.current['Space'] = false;
        }

        // 4. RENDER SYNC
        if (performance.now() - lastRenderTime.current > 33) {
            let activeState: AvatarState = 'idle';
            if (isPanicAutonomous && panicStore.autonomousForcedAction) {
                activeState = panicStore.autonomousForcedAction as AvatarState;
                stateRef.current = activeState;
            } else if (forcedAction) {
                activeState = forcedAction;
                stateRef.current = forcedAction;
            } else if (stateTimer.current > 0) {
                activeState = stateRef.current;
            } else {
                activeState = isMoving ? (isSprinting ? 'sprint' : 'walk') : 'idle';
                stateRef.current = activeState;
            }

            let rotation = prevRotRef.current;
            if (isMoving && isManualControl) {
                rotation = Math.atan2(lastIntentionalVel.current[0], lastIntentionalVel.current[2]);
                prevRotRef.current = rotation;
            }

            const worldVelocity: [number, number, number] = isMoving ? [lastIntentionalVel.current[0], 0, lastIntentionalVel.current[2]] : [0, 0, 0];

            // Prevent React re-renders if nothing changed!
            const isPosDiff = Math.abs(posRef.current[0] - renderState.position[0]) > 0.001 ||
                              Math.abs(posRef.current[1] - renderState.position[1]) > 0.001 ||
                              Math.abs(posRef.current[2] - renderState.position[2]) > 0.001;
            const isVelDiff = worldVelocity[0] !== renderState.velocity[0] || worldVelocity[2] !== renderState.velocity[2];
            const isRotDiff = rotation !== renderState.rotation;
            const isStateDiff = stateRef.current !== renderState.state;

            if (isPosDiff || isVelDiff || isRotDiff || isStateDiff) {
                setRenderState({
                    position: [posRef.current[0], posRef.current[1], posRef.current[2]],
                    velocity: worldVelocity,
                    rotation: rotation,
                    state: stateRef.current,
                    isDashing: false,
                    isSprinting: !!isSprinting,
                    kinesicVector: renderState.kinesicVector, // keep ref stable
                    impactPulse: 0,
                    isPlayerInSight: false
                });
            }

            if (onTrackPosition) {
                const trackedPos = projection === 'spherical' ? localTrackPosRef.current : new THREE.Vector3(...posRef.current);
                onTrackPosition(trackedPos, velRef.current, rotation);
            }
            lastRenderTime.current = performance.now();
        }
    });

    return <>{children(renderState as any)}</>;
}
