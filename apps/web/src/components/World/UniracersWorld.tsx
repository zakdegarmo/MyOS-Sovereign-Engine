// apps/web/src/components/World/UniracersWorld.tsx
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
    UniracersHighwayGraph,
    type HighwayBranch,
    HUB_RADIUS,
    CITY_DISTANCE,
    PILLAR_NAMES
} from './UniracersHighwayGraph';
import {
    createHighwayRibbonGeometry,
    createBellEndTubeGeometry,
    createSplitRibbonPairGeometries,
    createBellEndCollarGeometry,
    type BellEndConfig,
    type SplitRibbonConfig
} from './UniracersTrackTopology';
import { generatePillarCities, type CityLandmark } from './UniracersCityGenerator';
import { useUniracersWorldStore } from './UniracersWorldStore';
import { UniracerAvatar, type UniracerPhysicsState } from '../Avatars/UniracerAvatar';
import { TrickSystem } from './UniracersTrickSystem';

export interface UniracersWorldProps {
    isActive?: boolean;
    playerPosition?: [number, number, number] | THREE.Vector3;
    onDimensionSwap?: (dim: string) => void;
}

export const UniracersWorld: React.FC<UniracersWorldProps> = ({ isActive = true }) => {
    const { camera } = useThree();

    // 1. Initialize Master Highway Graph and Procedural Cities
    const highwayGraph = useMemo(() => new UniracersHighwayGraph(), []);
    const pillarCities = useMemo(() => generatePillarCities(), []);
    const trickSystemRef = useRef<TrickSystem>(new TrickSystem());

    // 2. Kinematic State for Player Unicycle
    const [currentBranchId, setCurrentBranchId] = useState<string>('hub_roundabout');
    const [lastTrickText, setLastTrickText] = useState<string>('');
    const [upcomingJunction, setUpcomingJunction] = useState<string | undefined>(undefined);
    const cameraMode = useUniracersWorldStore((s) => s.cameraMode);
    const toggleCamera = useUniracersWorldStore((s) => s.toggleCamera);

    // Internal physics refs (for smooth 60fps frame loop without React state jitter)
    const physicsRef = useRef({
        branchId: 'hub_roundabout',
        trackT: 0.0,
        speed: 140, // Comfortable initial cruising speed
        lateralOffset: 0.0, // Lateral position across ribbon / angle around tube
        altitude: 0.0,
        verticalVelocity: 0.0,
        isGrounded: true,
        isWipingOut: false,
        wipeoutTimer: 0.0,
        isDrifting: false,
        driftCharge: 0.0,
        driftTier: 0,
        jumpCharge: 0.0,
        airborneRotation: new THREE.Quaternion(),
        worldPosition: new THREE.Vector3(0, 45, HUB_RADIUS),
        headingTangent: new THREE.Vector3(1, 0, 0),
        normalVec: new THREE.Vector3(0, 1, 0),
        binormalVec: new THREE.Vector3(0, 0, 1)
    });

    const unicycleGroupRef = useRef<THREE.Group>(null);
    const lastHudSyncRef = useRef<number>(0);
    const isFirstFrameRef = useRef<boolean>(true);
    const prevCameraModeRef = useRef<string>('NORMAL');
    const uniracerStateRef = useRef<UniracerPhysicsState>({
        speed: 140,
        heading: 0,
        pitchLean: 0,
        bankLean: 0,
        airborneRotation: new THREE.Quaternion(),
        isGrounded: true,
        isWipingOut: false,
        trickText: ''
    });

    // Keyboard state
    const keysRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            const isInput = activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName);
            if (isInput) return;

            keysRef.current[e.key.toLowerCase()] = true;
            if (e.code === 'Space') keysRef.current[' '] = true;

            // Camera toggle hotkey: 'C'
            if (e.code === 'KeyC') {
                e.preventDefault();
                toggleCamera();
            }

            // Tactical map toggle hotkey: 'M'
            if (e.code === 'KeyM') {
                e.preventDefault();
                useUniracersWorldStore.getState().toggleTacticalMap();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysRef.current[e.key.toLowerCase()] = false;
            if (e.code === 'Space') keysRef.current[' '] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // 3. Pre-generate Highway Roadbed, Stunt Tubes, Bell-End Manifolds & Split Ribbons
    const highwayMeshes = useMemo(() => {
        const meshes: { id: string; geometry: THREE.BufferGeometry; material: THREE.Material }[] = [];

        const ribbonMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.35,
            metalness: 0.25,
            side: THREE.DoubleSide
        });

        const tubeMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.28,
            metalness: 0.35,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.88
        });

        const collarMaterial = new THREE.MeshStandardMaterial({
            color: '#FFD700',
            metalness: 0.92,
            roughness: 0.15
        });

        // A. Central Roundabout Hub (R = 1,200):
        // 1. Supersonic 1994 Red/Yellow Tube Ring with flared Bell-End exits
        const roundabout = highwayGraph.getBranch('hub_roundabout');
        if (roundabout) {
            const bells: BellEndConfig[] = [];
            for (let k = 0; k < 10; k++) {
                const angle = (k / 10) * Math.PI * 2;
                const startAngle = (angle - 0.28 + Math.PI * 2) % (Math.PI * 2);
                const centerT = startAngle / (Math.PI * 2);
                bells.push({
                    startT: Math.max(0, centerT - 0.015),
                    endT: Math.min(1, centerT + 0.015),
                    baseRadius: 24,
                    flaredRadius: 42,
                    isIngress: true
                });
            }
            const roundaboutTubeGeom = createBellEndTubeGeometry(
                roundabout.curve,
                480,
                24,
                24,
                bells
            );
            meshes.push({ id: 'roundabout_tube', geometry: roundaboutTubeGeom, material: tubeMaterial });

            // 2. Inner Connecting Flat Ribbon Deck
            const innerRibbonGeom = createHighwayRibbonGeometry(
                roundabout.curve,
                360,
                48
            );
            meshes.push({ id: 'roundabout_ribbon', geometry: innerRibbonGeom, material: ribbonMaterial });
        }

        // B. 10 Spoke Superhighways:
        // Authentic Tube -> Bell End Flare -> Split Dual Ribbons -> Reverse Bell End Funnel -> Tube -> City Gate
        for (let k = 0; k < 10; k++) {
            const spoke = highwayGraph.getBranch(`spoke_${k}`);
            if (!spoke) continue;

            const curve = spoke.curve;

            // 1. Ingress 1994 Tube Section from Roundabout (t: 0.0 -> 0.35)
            // Flares open into a trumpet mouth at t: 0.28 -> 0.35
            const bell1: BellEndConfig[] = [
                { startT: 0.28, endT: 0.35, baseRadius: 22, flaredRadius: 48, isIngress: true }
            ];
            const tube1Geom = createBellEndTubeGeometry(
                curve,
                160,
                22,
                22,
                bell1,
                0.0,
                0.35
            );
            meshes.push({ id: `spoke_${k}_tube1`, geometry: tube1Geom, material: tubeMaterial });

            // Flange Collar at Split Threshold (t = 0.35)
            const collar1Geom = createBellEndCollarGeometry(curve, 0.35, 48, 3.8);
            meshes.push({ id: `spoke_${k}_collar1`, geometry: collar1Geom, material: collarMaterial });

            // 2. Split Dual Ribbon Tracks (t: 0.35 -> 0.65)
            // Left Upper Stunt Ribbon & Right Lower Speed Ribbon with open air between them
            const splitGeoms = createSplitRibbonPairGeometries(curve, 180, {
                startT: 0.35,
                endT: 0.65,
                ribbonWidth: 26,
                baseSpread: 22,
                maxDivergence: 36,
                maxElevation: 30
            });
            meshes.push({ id: `spoke_${k}_split_left`, geometry: splitGeoms.leftGeometry, material: ribbonMaterial });
            meshes.push({ id: `spoke_${k}_split_right`, geometry: splitGeoms.rightGeometry, material: ribbonMaterial });

            // Flange Collar at Merge Threshold (t = 0.65)
            const collar2Geom = createBellEndCollarGeometry(curve, 0.65, 48, 3.8);
            meshes.push({ id: `spoke_${k}_collar2`, geometry: collar2Geom, material: collarMaterial });

            // 3. Inverted Reverse Bell-End Funnel & Continuing Tube Section (t: 0.65 -> 0.92)
            // Reverse bell narrows in at t: 0.65 -> 0.72 from r=48 to r=22, then flares at t: 0.86 -> 0.92 for city arrival
            const bell2: BellEndConfig[] = [
                { startT: 0.65, endT: 0.72, baseRadius: 22, flaredRadius: 48, isIngress: false },
                { startT: 0.86, endT: 0.92, baseRadius: 22, flaredRadius: 44, isIngress: true }
            ];
            const tube2Geom = createBellEndTubeGeometry(
                curve,
                160,
                22,
                22,
                bell2,
                0.65,
                0.92
            );
            meshes.push({ id: `spoke_${k}_tube2`, geometry: tube2Geom, material: tubeMaterial });

            // Flange Collar at City Approach (t = 0.92)
            const collar3Geom = createBellEndCollarGeometry(curve, 0.92, 44, 3.5);
            meshes.push({ id: `spoke_${k}_collar3`, geometry: collar3Geom, material: collarMaterial });

            // 4. City Gateway Ribbon Approach (t: 0.92 -> 1.0)
            const gatewayRibbon = createHighwayRibbonGeometry(
                curve,
                60,
                52
            );
            meshes.push({ id: `spoke_${k}_gateway`, geometry: gatewayRibbon, material: ribbonMaterial });

            // C. 10 City Arterials & Satellite Stunt Circuits
            const arterial = highwayGraph.getBranch(`arterial_${k}`);
            if (arterial) {
                const arterialGeom = createHighwayRibbonGeometry(arterial.curve, 180, 50);
                meshes.push({ id: `arterial_${k}`, geometry: arterialGeom, material: ribbonMaterial });
            }

            const stuntTrack = highwayGraph.getBranch(`track_${k}`);
            if (stuntTrack) {
                const bellsStunt: BellEndConfig[] = [
                    { startT: 0.0, endT: 0.08, baseRadius: 18, flaredRadius: 36, isIngress: true },
                    { startT: 0.92, endT: 1.0, baseRadius: 18, flaredRadius: 36, isIngress: false }
                ];
                const stuntGeom = createBellEndTubeGeometry(stuntTrack.curve, 220, 20, 18, bellsStunt);
                meshes.push({ id: `stunt_track_${k}`, geometry: stuntGeom, material: tubeMaterial });
            }
        }

        return meshes;
    }, [highwayGraph]);

    // 4. Kinematics Simulation Loop
    useFrame((_, delta) => {
        if (!isActive) return;
        const dt = Math.min(delta, 0.05);
        const keys = keysRef.current;
        const phys = physicsRef.current;

        const currentBranch = highwayGraph.getBranch(phys.branchId);
        if (!currentBranch) return;

        // --- Controls matching previous version (W/S/A/D, SPACE jump, Arrows pitch/roll, Q/E yaw) ---
        const accel = !!keys['w'];
        const brake = !!keys['s'];
        const steerLeft = !!keys['a'] || !!keys['arrowleft'];
        const steerRight = !!keys['d'] || !!keys['arrowright'];
        const jump = !!keys[' '];

        const steerInput = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);

        // --- 1. Wipeout State (Tumbling / Skidding) ---
        if (phys.isWipingOut) {
            phys.wipeoutTimer -= dt;
            phys.speed *= 0.96; // Friction skid

            // Cartoonish Tumbling Rotation
            const tumbleSpeed = 16.0;
            phys.airborneRotation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(
                (Math.random() - 0.5) * tumbleSpeed * dt,
                (Math.random() - 0.5) * tumbleSpeed * dt,
                (Math.random() - 0.5) * tumbleSpeed * dt
            )));

            // High Bounce Logic
            if (phys.altitude <= 0 && phys.verticalVelocity < 0) {
                phys.verticalVelocity = -phys.verticalVelocity * 0.7;
                if (phys.verticalVelocity < 30) phys.verticalVelocity = 30;
                phys.altitude = 0.1;
            }

            phys.verticalVelocity -= 140 * dt;
            phys.altitude += phys.verticalVelocity * dt;

            if (phys.wipeoutTimer <= 0) {
                phys.isWipingOut = false;
                phys.airborneRotation.identity();
                phys.isGrounded = true;
                phys.altitude = 0;
                phys.verticalVelocity = 0;
            }
        }

        // --- 2. Lateral Handling, Drift & Power-slide ---
        const wantsDrift = phys.isGrounded && !phys.isWipingOut && brake && Math.abs(steerInput) > 0.1 && phys.speed > 50;

        if (wantsDrift) {
            phys.isDrifting = true;
            phys.driftCharge += dt * (phys.speed / 140);
            if (phys.driftCharge >= 1.6) {
                phys.driftTier = 2; // Fiery Gold Sparks
            } else if (phys.driftCharge >= 0.7) {
                phys.driftTier = 1; // Electric Blue Sparks
            }
            phys.speed *= 0.985;
        } else {
            // Drift Release Boost!
            if (phys.isDrifting) {
                if (phys.driftTier === 2) {
                    phys.speed = Math.min(phys.speed + 200, 750);
                    useUniracersWorldStore.getState().addScore(150);
                    setLastTrickText('TURBO POWER-SLIDE (+200 BOOST!)');
                } else if (phys.driftTier === 1) {
                    phys.speed = Math.min(phys.speed + 90, 650);
                    useUniracersWorldStore.getState().addScore(50);
                    setLastTrickText('DRIFT BOOST (+90!)');
                }
                phys.isDrifting = false;
                phys.driftTier = 0;
                phys.driftCharge = 0;
            }
        }

        // --- Lateral Steering / Tube Orbit ---
        if (currentBranch.isRibbon) {
            // Lateral position across highway lanes (-W/2 .. +W/2)
            const maxLateral = (currentBranch.roadWidth / 2) - 4;
            phys.lateralOffset = Math.max(-maxLateral, Math.min(maxLateral, phys.lateralOffset + steerInput * 38 * dt));
        } else {
            // Angle around 360-degree cylindrical tube
            phys.lateralOffset += steerInput * 4.0 * dt;
        }

        // --- 3. Grounded Linear Speed Dynamics & Jump Charging ---
        if (phys.isGrounded && !phys.isWipingOut) {
            if (!phys.isDrifting) {
                if (accel) {
                    phys.speed = Math.min(phys.speed + 350 * dt, 550);
                } else if (brake) {
                    phys.speed = Math.max(phys.speed - 500 * dt, 0);
                } else {
                    // Natural roll decay down to stop
                    phys.speed = Math.max(phys.speed - 65 * dt, 0);
                }
            }

            // Snap upright when rolling grounded
            phys.airborneRotation.slerp(new THREE.Quaternion(), Math.min(1.0, 12 * dt));

            // Jump Logic (Hold to charge, release to launch)
            if (jump) {
                phys.jumpCharge += dt;
                phys.jumpCharge = Math.min(phys.jumpCharge, 0.9);
            } else if (phys.jumpCharge > 0) {
                phys.isGrounded = false;
                const chargeRatio = phys.jumpCharge / 0.9;
                const multiplier = 1.0 + chargeRatio * 0.9; // 1.0x to 1.9x
                phys.verticalVelocity = 90 * multiplier;
                trickSystemRef.current.startJump(phys.airborneRotation);
                phys.jumpCharge = 0;
                setLastTrickText('AIRTIME LAUNCH!');
            }
        } else if (!phys.isGrounded && !phys.isWipingOut) {
            // --- 4. Airborne Flight & 6-DOF Trick System ---
            phys.verticalVelocity -= 140 * dt; // Gravity
            phys.altitude += phys.verticalVelocity * dt;

            // Pitch: Up/Down Arrows (or W/S while in air)
            const pitch = (keys['arrowup'] || keys['w'] ? 1 : 0) - (keys['arrowdown'] || keys['s'] ? 1 : 0);
            const pitchDelta = pitch * 5.5 * dt;

            // Roll: Left/Right Arrows (or A/D while in air)
            const roll = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
            const rollDelta = roll * 5.5 * dt;

            // Yaw: Q/E Bumper Spins
            const yaw = (keys['e'] ? 1 : 0) - (keys['q'] ? 1 : 0);
            const yawDelta = yaw * 5.0 * dt;

            const euler = new THREE.Euler(pitchDelta, yawDelta, rollDelta, 'YXZ');
            const rotDelta = new THREE.Quaternion().setFromEuler(euler);
            phys.airborneRotation.multiply(rotDelta);

            // Update Trick System with raw deltas
            trickSystemRef.current.updateInputDeltas(pitchDelta, yawDelta, rollDelta);

            // Landing check
            if (phys.altitude <= 0) {
                phys.altitude = 0;
                phys.verticalVelocity = 0;
                phys.isGrounded = true;

                // Check Upright Angle: is saddle facing upward?
                const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(phys.airborneRotation);

                if (localUp.y < 0.4) {
                    // Wipeout crash landing!
                    phys.isWipingOut = true;
                    phys.wipeoutTimer = 2.0;
                    phys.isGrounded = false;
                    phys.verticalVelocity = 35;
                    phys.speed *= 0.5;
                    setLastTrickText('WIPEOUT!');
                } else {
                    // Clean upright landing!
                    phys.airborneRotation.identity();
                    const result = trickSystemRef.current.completeJump();
                    if (result) {
                        phys.speed = Math.min(phys.speed + result.boost, 750);
                        useUniracersWorldStore.getState().addScore(result.points);
                        setLastTrickText(`${result.name} (+${result.boost} BOOST, +${result.points} PTS)!`);
                    } else {
                        setLastTrickText('CLEAN LANDING!');
                    }
                }
            }
        }

        // --- Arc-Length Progress Along Spline ---
        const distStep = phys.speed * dt;
        phys.trackT += distStep / currentBranch.length;

        if (currentBranch.isClosed) {
            phys.trackT %= 1.0;
            if (phys.trackT < 0) phys.trackT += 1.0;
        } else {
            // End of Spoke highway: loop back or bounce
            if (phys.trackT >= 1.0) {
                phys.trackT = 0.99;
                phys.speed = -phys.speed * 0.5; // Turn around
            } else if (phys.trackT < 0.0) {
                phys.trackT = 0.01;
            }
        }

        // --- Junction Checking / Highway Interchanges ---
        const transfer = highwayGraph.checkJunctionTransfer(phys.branchId, phys.trackT, steerInput);
        if (transfer) {
            phys.branchId = transfer.branch.id;
            phys.trackT = transfer.targetT;
            setCurrentBranchId(transfer.branch.id);
            setLastTrickText(`ENTERED: ${transfer.branch.name}`);
        }

        // Upcoming junction signage detection
        let nextJuncLabel: string | undefined = undefined;
        for (const j of currentBranch.junctions) {
            if (Math.abs(phys.trackT - j.t) < 0.06) {
                nextJuncLabel = `[STEER ${j.steerDirection === -1 ? 'LEFT' : 'RIGHT'}] -> ${j.label}`;
                break;
            }
        }
        setUpcomingJunction(nextJuncLabel);

        // --- 3D World Position & Orientation Calculation ---
        const centerPos = currentBranch.curve.getPointAt(phys.trackT);
        const tangent = currentBranch.curve.getTangentAt(phys.trackT).normalize();

        // Approximate Frenet frame
        let norm = new THREE.Vector3(0, 1, 0);
        if (Math.abs(tangent.dot(norm)) > 0.9) norm.set(1, 0, 0);
        const binorm = new THREE.Vector3().crossVectors(tangent, norm).normalize();
        norm.crossVectors(binorm, tangent).normalize();

        phys.headingTangent.copy(tangent);
        phys.normalVec.copy(norm);
        phys.binormalVec.copy(binorm);

        let finalPos: THREE.Vector3;
        const isSpoke = currentBranch.type === 'spoke';

        if (isSpoke) {
            if (phys.trackT < 0.35) {
                // Section 1: Ingress Supersonic 1994 Tube (r=22)
                const r = 22 + phys.altitude;
                finalPos = centerPos.clone()
                    .add(norm.clone().multiplyScalar(Math.cos(phys.lateralOffset) * r))
                    .add(binorm.clone().multiplyScalar(Math.sin(phys.lateralOffset) * r));
            } else if (phys.trackT >= 0.35 && phys.trackT <= 0.65) {
                // Section 2: Split Dual Ribbon Tracks (Left Upper Stunt, Right Lower Speed)
                const frac = (phys.trackT - 0.35) / 0.30;
                const hump = Math.sin(frac * Math.PI);
                const isLeftTrack = phys.lateralOffset >= 0;

                const baseLat = isLeftTrack ? (22 + 36 * hump) : -(22 + 36 * hump);
                const elev = (isLeftTrack ? (30 * hump) : -(9 * hump)) + phys.altitude;
                const clampLocalLat = Math.min(10, Math.max(-10, isLeftTrack ? phys.lateralOffset - 10 : phys.lateralOffset + 10));

                finalPos = centerPos.clone()
                    .add(binorm.clone().multiplyScalar(baseLat + clampLocalLat))
                    .add(norm.clone().multiplyScalar(elev));
            } else if (phys.trackT > 0.65 && phys.trackT <= 0.92) {
                // Section 3: Reverse Bell-End Merged Tube (r=22)
                const r = 22 + phys.altitude;
                finalPos = centerPos.clone()
                    .add(norm.clone().multiplyScalar(Math.cos(phys.lateralOffset) * r))
                    .add(binorm.clone().multiplyScalar(Math.sin(phys.lateralOffset) * r));
            } else {
                // Section 4: City Gateway Ribbon
                finalPos = centerPos.clone()
                    .add(binorm.clone().multiplyScalar(phys.lateralOffset))
                    .add(norm.clone().multiplyScalar(phys.altitude + 0.5));
            }
        } else if (currentBranch.type === 'roundabout') {
            // Central Roundabout: outer high-speed tube or inner ribbon
            if (Math.abs(phys.lateralOffset) > 20) {
                const r = 24 + phys.altitude;
                finalPos = centerPos.clone()
                    .add(norm.clone().multiplyScalar(Math.cos(phys.lateralOffset * 0.1) * r))
                    .add(binorm.clone().multiplyScalar(Math.sin(phys.lateralOffset * 0.1) * r));
            } else {
                finalPos = centerPos.clone()
                    .add(binorm.clone().multiplyScalar(phys.lateralOffset))
                    .add(norm.clone().multiplyScalar(phys.altitude + 0.5));
            }
        } else {
            // Arterials & Stunt Tracks
            if (currentBranch.isRibbon) {
                finalPos = centerPos.clone()
                    .add(binorm.clone().multiplyScalar(phys.lateralOffset))
                    .add(norm.clone().multiplyScalar(phys.altitude + 0.5));
            } else {
                const r = currentBranch.tubeRadius + phys.altitude;
                finalPos = centerPos.clone()
                    .add(norm.clone().multiplyScalar(Math.cos(phys.lateralOffset) * r))
                    .add(binorm.clone().multiplyScalar(Math.sin(phys.lateralOffset) * r));
            }
        }

        phys.worldPosition.copy(finalPos);

        // Update 60 FPS animation parameters on the rigged Uniracer hero model
        const accelInput = !!keys['w'] || !!keys['arrowup'];
        const brakeInput = !!keys['shift'];
        uniracerStateRef.current.speed = phys.speed;
        uniracerStateRef.current.pitchLean = accelInput ? -0.28 : brakeInput ? 0.35 : 0;
        uniracerStateRef.current.bankLean = -steerInput * 0.34;
        uniracerStateRef.current.airborneRotation = phys.airborneRotation;
        uniracerStateRef.current.isGrounded = phys.isGrounded;
        uniracerStateRef.current.trickText = lastTrickText;

        // Update Unicycle 3D Group Transform
        if (unicycleGroupRef.current) {
            unicycleGroupRef.current.position.copy(finalPos);

            // Orient unicycle perpendicular to current surface (radial outward on tube, upward on ribbon)
            const surfaceNormal = (currentBranch.type === 'arterial' && !currentBranch.isRibbon)
                ? finalPos.clone().sub(centerPos).normalize()
                : norm.clone();

            unicycleGroupRef.current.up.copy(surfaceNormal);

            // Base orientation facing along track tangent
            const lookTarget = finalPos.clone().add(tangent);
            unicycleGroupRef.current.lookAt(lookTarget);

            // Note: Airborne 6-DOF trick rotation is applied directly to the model chassis inside UniracerAvatar
        }

        // --- Dynamic Multi-Angle Camera Rig ---
        const modeChanged = prevCameraModeRef.current !== cameraMode;
        prevCameraModeRef.current = cameraMode;

        let targetCam = finalPos.clone();
        let targetLookAt = finalPos.clone();

        switch (cameraMode) {
            case 'NORMAL': {
                // High-speed dynamic chase camera right behind unicycle
                targetCam = finalPos.clone()
                    .sub(tangent.clone().multiplyScalar(38))
                    .add(norm.clone().multiplyScalar(16));
                targetLookAt = finalPos.clone().add(tangent.clone().multiplyScalar(22)).add(norm.clone().multiplyScalar(3));
                break;
            }
            case 'WIDE': {
                // High-altitude wide camera showcasing cities and highway spans
                targetCam = finalPos.clone()
                    .sub(tangent.clone().multiplyScalar(90))
                    .add(norm.clone().multiplyScalar(46));
                targetLookAt = finalPos.clone().add(tangent.clone().multiplyScalar(32)).add(norm.clone().multiplyScalar(6));
                break;
            }
            case 'REAR': {
                // Low pursuit view looking back at the unicycle
                targetCam = finalPos.clone()
                    .add(tangent.clone().multiplyScalar(35))
                    .add(norm.clone().multiplyScalar(12));
                targetLookAt = finalPos.clone().add(norm.clone().multiplyScalar(3));
                break;
            }
            case 'SIDE_2D': {
                // Authentic 1994 Uniracers 2.5D profile camera (decoupled from unicycle roll)
                targetCam = centerPos.clone()
                    .add(binorm.clone().multiplyScalar(110))
                    .add(norm.clone().multiplyScalar(12));
                targetLookAt = centerPos.clone().add(tangent.clone().multiplyScalar(16)).add(norm.clone().multiplyScalar(4));
                break;
            }
            case 'TOP_DOWN': {
                // Planetary Satellite overview: high above the world center/player showing the entire world structure
                targetCam = new THREE.Vector3(finalPos.x * 0.25, 2600, finalPos.z * 0.25 + 60);
                targetLookAt = new THREE.Vector3(finalPos.x * 0.25, 0, finalPos.z * 0.25);
                break;
            }
        }

        if (isFirstFrameRef.current || modeChanged) {
            camera.position.copy(targetCam);
            camera.lookAt(targetLookAt);
            isFirstFrameRef.current = false;
        } else {
            camera.position.lerp(targetCam, cameraMode === 'REAR' ? 0.25 : 0.14);
            camera.lookAt(targetLookAt);
        }

        // Sync state to UniracersWorldStore
        const now = performance.now();
        if (now - lastHudSyncRef.current > 50) {
            lastHudSyncRef.current = now;
            const branch = highwayGraph.getBranch(currentBranchId);
            const headingRad = Math.atan2(tangent.x, tangent.z);
            useUniracersWorldStore.setState({
                speed: phys.speed,
                currentBranchName: branch?.name || 'Central Roundabout Hub Highway',
                currentPillarName: branch?.pillarName || 'The Nexus Core',
                upcomingJunctionLabel: upcomingJunction,
                lastTrickText,
                playerWorldPos: [finalPos.x, finalPos.y, finalPos.z],
                playerHeading: headingRad
            });
        }
    });

    const activeBranch = highwayGraph.getBranch(currentBranchId);

    return (
        <group>
            {/* World High-Contrast Cinematic Lighting Rig */}
            <ambientLight intensity={1.1} />
            <directionalLight position={[600, 1500, 900]} intensity={2.6} castShadow />
            <directionalLight position={[-600, 1000, -900]} intensity={1.4} />
            <hemisphereLight skyColor="#38bdf8" groundColor="#0f172a" intensity={1.1} />

            {/* Colossal Planetary World Floor (Infinite Grid Plate) */}
            <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[16000, 16000, 32, 32]} />
                <meshStandardMaterial color="#050814" roughness={0.9} metalness={0.1} />
            </mesh>

            {/* Central Hub Landmark: Golden Sovereign Spire at (0, 0, 0) */}
            <group position={[0, 0, 0]}>
                <mesh position={[0, 150, 0]}>
                    <coneGeometry args={[90, 300, 8]} />
                    <meshStandardMaterial color="#FFE500" metalness={0.9} roughness={0.2} emissive="#FFE500" emissiveIntensity={0.3} />
                </mesh>
                <mesh position={[0, 45, 0]}>
                    <torusGeometry args={[HUB_RADIUS, 18, 16, 64]} />
                    <meshBasicMaterial color="#FFE500" wireframe />
                </mesh>
            </group>

            {/* Render All Highway Roadbeds & Stunt Tubes */}
            {highwayMeshes.map((m) => (
                <mesh key={m.id} geometry={m.geometry} material={m.material} receiveShadow castShadow />
            ))}

            {/* Render 10 Themed Pillar City Landmarks */}
            {pillarCities.map((city) => (
                <primitive key={city.pillarIndex} object={city.group} />
            ))}

            {/* Player Unicycle 3D Avatar (Canonical Hero Rig with 8 Bones & 60 FPS Dynamics) */}
            <group ref={unicycleGroupRef} position={[0, 45, HUB_RADIUS]}>
                <group rotation={[0, Math.PI, 0]}>
                    <React.Suspense fallback={null}>
                        <UniracerAvatar
                            isPlayerControlled={true}
                            scale={3.6}
                            position={[0, 0, 0]}
                            uniracerState={uniracerStateRef.current}
                        />
                    </React.Suspense>
                </group>
            </group>


        </group>
    );
};
