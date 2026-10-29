import React, { useMemo, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { OfficeSectorExtruder, type ExtrudedOfficeResult, type InteractivePrinter, type InteractiveServer, type GuardPatrolRoute } from '../../engine/OfficeSectorExtruder';
import { usePrinterPanicStore, type GuardEntity } from '../../store/usePrinterPanicStore';
import { officeAudio } from '../../engine/OfficeAudioSynth';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { LarryAutonomousAgent } from '../../engine/LarryAutonomousAgent';

interface PrinterPanicWorldProps {
    isActive: boolean;
    playerPosition: THREE.Vector3;
    children?: React.ReactNode;
}

const COWORKERS = [
    {
        id: 'bob',
        name: 'Bob Jenkins',
        role: 'Quantum Accounting',
        position: [12.0, 0.02, -22.0] as [number, number, number],
        speech: 'The quarterly audit prints in 5 min and LaserJet 1 is jammed again!',
        facing: 0
    },
    {
        id: 'brenda',
        name: 'Brenda Vance',
        role: 'Firmware Compliance',
        position: [12.0, 0.02, -10.0] as [number, number, number],
        speech: 'Why is Corporate Security patrolling the breakroom with flashlights?!',
        facing: Math.PI / 2
    },
    {
        id: 'kevin',
        name: 'Kevin Zhao',
        role: 'Systems Intern',
        position: [12.0, 0.02, 8.0] as [number, number, number],
        speech: "Don't look at me, I put standard 20lb bond paper in tray 2...",
        facing: Math.PI
    }
];

interface CubicleWorkerProps {
    id: string;
    name: string;
    role: string;
    position: [number, number, number];
    speech: string;
    facing?: number;
}

const CubicleWorker: React.FC<CubicleWorkerProps> = ({
    id,
    name,
    role,
    position,
    speech,
    facing = 0
}) => {
    return (
        <group position={position} rotation={[0, facing, 0]}>
            {/* Ergonomic Office Chair */}
            <mesh position={[0, 0.45, 0.35]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
                <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.85, 0.55]}>
                <boxGeometry args={[0.5, 0.7, 0.08]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
            </mesh>

            {/* Dual Widescreen LCD Displays on Desk */}
            <mesh position={[-0.4, 0.85 + 0.3, -0.2]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[0.7, 0.45, 0.04]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
            <mesh position={[-0.4, 0.85 + 0.3, -0.17]} rotation={[0, 0.2, 0]}>
                <planeGeometry args={[0.66, 0.41]} />
                <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[0.4, 0.85 + 0.3, -0.2]} rotation={[0, -0.2, 0]}>
                <boxGeometry args={[0.7, 0.45, 0.04]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
            <mesh position={[0.4, 0.85 + 0.3, -0.17]} rotation={[0, -0.2, 0]}>
                <planeGeometry args={[0.66, 0.41]} />
                <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
            </mesh>

            {/* Living Flesh Golem Worker */}
            <SemanticAvatar
                pillarName={`worker_${id}`}
                pillarIndex={2}
                scale={1.8}
                position={[0, 0.05, 0.3]}
                action="talk"
                genome={{ body: '/actions/flesh_base_mannequin_idle_loop.png' }}
            />

            {/* Diegetic Comic Speech Bubble */}
            <Html center position={[0, 2.5, 0.3]} distanceFactor={22}>
                <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md w-52 text-center pointer-events-none select-none">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">{name} ({role})</div>
                    <div className="text-xs text-slate-200 leading-snug italic font-sans">"{speech}"</div>
                </div>
            </Html>
        </group>
    );
};

interface GuardAvatarProps {
    route: GuardPatrolRoute;
    guards: GuardEntity[];
    getPos: () => THREE.Vector3;
    getRot: () => number;
}

const GuardAvatar: React.FC<GuardAvatarProps> = ({
    route,
    guards,
    getPos,
    getRot
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const spotLightTargetRef = useRef<THREE.Object3D>(null);
    const gid = route.id;
    const guardStoreData = guards.find(g => g.id === gid);
    const isSlipped = guardStoreData?.state === 'slipped';
    const isAlert = guardStoreData?.state === 'alert';
    const isInvestigating = guardStoreData?.state === 'investigating';
    const detectionPct = Math.round((guardStoreData?.detectionLevel || 0) * 100);

    useFrame(() => {
        if (!groupRef.current) return;
        const pos = getPos();
        const rotY = getRot();
        if (pos) groupRef.current.position.set(pos.x, pos.y, pos.z);
        if (rotY !== undefined) groupRef.current.rotation.y = rotY;

        if (isSlipped) {
            groupRef.current.rotation.x = Math.PI / 2;
            groupRef.current.rotation.z += 0.08;
        } else {
            groupRef.current.rotation.x = 0;
            groupRef.current.rotation.z = 0;
        }
    });

    const coneColor = isSlipped ? '#38bdf8' : isAlert ? '#ef4444' : isInvestigating ? '#f59e0b' : '#fef08a';

    return (
        <group ref={groupRef}>
            {/* Flesh Golem Security Guard Avatar */}
            <SemanticAvatar
                pillarName={`guard_${gid}`}
                pillarIndex={1}
                scale={2.2}
                position={[0, 0, 0]}
                action={isSlipped ? 'damage' : isAlert ? 'sprint' : isInvestigating ? 'talk' : 'walk'}
                genome={{ body: '/actions/flesh_base_mannequin_idle_loop.png' }}
            />

            {/* Guard Flashlight / Spotlight */}
            {!isSlipped && (
                <>
                    <object3D ref={spotLightTargetRef} position={[0, -1.2, 8]} />
                    <spotLight
                        position={[0, 1.2, 0.4]}
                        target={spotLightTargetRef.current || undefined}
                        color={coneColor}
                        intensity={isAlert ? 10.0 : isInvestigating ? 7.5 : 5.0}
                        distance={16}
                        angle={isInvestigating ? 0.6 : 0.45}
                        penumbra={0.4}
                    />
                </>
            )}

            {/* Diegetic Floating Status Badge */}
            <Html center position={[0, 2.7, 0]} distanceFactor={18}>
                {isSlipped ? (
                    <div className="px-2.5 py-1 rounded-full bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 text-xs font-bold tracking-wider animate-bounce shadow-lg shadow-cyan-500/50 flex items-center gap-1.5 select-none whitespace-nowrap">
                        <span>💫</span>
                        <span>SLIPPED!</span>
                    </div>
                ) : isAlert ? (
                    <div className="px-2.5 py-1 rounded-full bg-red-950/95 border-2 border-red-500 text-red-100 text-xs font-bold tracking-wider animate-pulse shadow-lg shadow-red-500/50 flex items-center gap-1.5 select-none whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>INTRUDER DETECTED!</span>
                    </div>
                ) : isInvestigating ? (
                    <div className="px-2.5 py-1 rounded-full bg-amber-950/95 border-2 border-amber-500 text-amber-100 text-xs font-bold tracking-wider shadow-lg shadow-amber-500/40 flex items-center gap-1.5 select-none whitespace-nowrap">
                        <span>❓</span>
                        <span>SUSPICIOUS ({detectionPct}%)</span>
                    </div>
                ) : (
                    <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-600 text-slate-300 text-[10px] font-mono tracking-wider select-none whitespace-nowrap">
                        👁 PATROL
                    </div>
                )}
            </Html>
        </group>
    );
};

export const PrinterPanicWorld: React.FC<PrinterPanicWorldProps> = ({
    isActive,
    playerPosition,
    children
}) => {
    // Topography registration (flat elevation + office collision)
    useEffect(() => {
        if (!isActive) return;
        topographyRegistry.register({
            id: 'printer_panic',
            getElevation: () => 0.0,
            projection: 'flat',
            isBlocked: (x, z, radius) => OfficeSectorExtruder.isBlocked(x, z, radius)
        });
        topographyRegistry.setCurrent('printer_panic');

        return () => {
            topographyRegistry.unregister('printer_panic');
        };
    }, [isActive]);

    // Extrude 3D Office Sector Geometry (cached)
    const officeData: ExtrudedOfficeResult = useMemo(() => {
        return OfficeSectorExtruder.extrudeMap();
    }, []);

    // Local state for interactive objects
    const [printerStates, setPrinterStates] = useState<Record<string, boolean>>({
        printer_1: true,
        printer_2: true,
        printer_3: true,
        printer_4: true
    });

    const [serverStates, setServerStates] = useState<Record<string, boolean>>({
        server_1: true,
        server_2: false,
        server_3: true,
        server_4: false
    });

    // Guard positions & AI refs
    const guardPatrolIdx = useRef<Record<string, number>>({
        guard_alpha: 0,
        guard_bravo: 0,
        guard_charlie: 0
    });

    const guardPosRefs = useRef<Record<string, THREE.Vector3>>({
        guard_alpha: new THREE.Vector3(-18, 0.1, -15),
        guard_bravo: new THREE.Vector3(10, 0.1, -6),
        guard_charlie: new THREE.Vector3(-25, 0.1, 12)
    });

    const guardRotRefs = useRef<Record<string, number>>({
        guard_alpha: 0,
        guard_bravo: 0,
        guard_charlie: 0
    });

    // Store bindings
    const traps = usePrinterPanicStore(s => s.traps);
    const guards = usePrinterPanicStore(s => s.guards);
    const gameStatus = usePrinterPanicStore(s => s.gameStatus);
    const deployThermalSlick = usePrinterPanicStore(s => s.deployThermalSlick);
    const deployMemo = usePrinterPanicStore(s => s.deployMemo);
    const servicePrinter = usePrinterPanicStore(s => s.servicePrinter);
    const rebootServer = usePrinterPanicStore(s => s.rebootServer);
    const triggerCaffeine = usePrinterPanicStore(s => s.triggerCaffeine);
    const setGuardSlipped = usePrinterPanicStore(s => s.setGuardSlipped);
    const setGuardAlert = usePrinterPanicStore(s => s.setGuardAlert);
    const setGuardInvestigating = usePrinterPanicStore(s => s.setGuardInvestigating);
    const setGuardPatrol = usePrinterPanicStore(s => s.setGuardPatrol);
    const updateGuardDetection = usePrinterPanicStore(s => s.updateGuardDetection);
    const setActivePrompt = usePrinterPanicStore(s => s.setActivePrompt);
    const tick = usePrinterPanicStore(s => s.tick);

    // Autonomous Mode & Cooldown Store Bindings
    const isAutonomousMode = usePrinterPanicStore(s => s.isAutonomousMode);
    const autonomousStatus = usePrinterPanicStore(s => s.autonomousStatus);
    const toggleAutonomousMode = usePrinterPanicStore(s => s.toggleAutonomousMode);
    const setAutonomousStatus = usePrinterPanicStore(s => s.setAutonomousStatus);
    const thermalSlickCooldown = usePrinterPanicStore(s => s.thermalSlickCooldown);
    const memoCooldown = usePrinterPanicStore(s => s.memoCooldown);
    const caffeineRemaining = usePrinterPanicStore(s => s.caffeineRemaining);

    // Keyboard controls: Universal Space action, F/2 Decoy Memo, Z Autonomous Mode (Q/E strictly reserved for camera rotation)
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

            const pPos: [number, number, number] = [playerPosition.x, playerPosition.y, playerPosition.z];

            // 1. Universal Action Button: Space
            if (e.code === 'Space') {
                e.preventDefault();
                const prompt = usePrinterPanicStore.getState().activePrompt;
                if (prompt) {
                    if (prompt.actionId.startsWith('printer_')) {
                        const pid = prompt.actionId;
                        if (printerStates[pid]) {
                            setPrinterStates(prev => ({ ...prev, [pid]: false }));
                            servicePrinter(pid);
                            setActivePrompt(null);
                        }
                    } else if (prompt.actionId.startsWith('server_')) {
                        const sid = prompt.actionId;
                        if (serverStates[sid]) {
                            setServerStates(prev => ({ ...prev, [sid]: false }));
                            rebootServer(sid);
                            setActivePrompt(null);
                        }
                    } else if (prompt.actionId === 'vending') {
                        triggerCaffeine();
                        setActivePrompt(null);
                    } else if (prompt.actionId === 'water_cooler') {
                        deployThermalSlick(pPos); // spills water trap
                        setActivePrompt(null);
                    }
                } else {
                    // Not in prompt proximity: deploy thermal paper slick trap!
                    deployThermalSlick(pPos);
                }
            } else if (e.code === 'KeyF' || e.code === 'Digit2') {
                // Secondary Gadget: Decoy Memo
                e.preventDefault();
                deployMemo(pPos);
            } else if (e.code === 'Digit1') {
                e.preventDefault();
                deployThermalSlick(pPos);
            } else if (e.code === 'KeyZ') {
                // Toggle Autonomous Idle Agent Mode
                e.preventDefault();
                toggleAutonomousMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, playerPosition, printerStates, serverStates, deployThermalSlick, deployMemo, servicePrinter, rebootServer, triggerCaffeine, setActivePrompt, toggleAutonomousMode]);

    // Footstep audio throttle & performance timers
    const lastPlayerPosRef = useRef(new THREE.Vector3());
    const stepDistAccumRef = useRef(0);
    const tickAccumRef = useRef(0);
    const lastPromptKeyRef = useRef<string | null>(null);
    const lastAutoVecRef = useRef<{ x: number; y: number; sprinting: boolean; action: string | null } | null>(null);
    const lastAutoStatusRef = useRef<string>('');
    const guardSlippedTimers = useRef<Record<string, number>>({});

    // Frame Loop: Ticks game state, moves guards, runs AI detection and collision
    useFrame((_state, delta) => {
        if (!isActive || gameStatus !== 'PLAYING') return;

        // 1. Tick Store (throttled to 10Hz to prevent 60-144fps Zustand re-renders)
        tickAccumRef.current += delta;
        if (tickAccumRef.current >= 0.1) {
            tick(tickAccumRef.current);
            tickAccumRef.current = 0;
        }

        // 2. Footstep SFX when player moves
        const movedDist = playerPosition.distanceTo(lastPlayerPosRef.current);
        lastPlayerPosRef.current.copy(playerPosition);
        stepDistAccumRef.current += movedDist;
        if (stepDistAccumRef.current > 1.8) {
            officeAudio.playFootstep();
            stepDistAccumRef.current = 0;
        }

        // 3. Proximity Interaction Check (Printer, Server, Vending, Water Cooler)
        let foundPrompt: { label: string; keyHint: string; actionId: string } | null = null;

        // Printers
        for (const p of officeData.printers) {
            const pPos = new THREE.Vector3(...p.position);
            const dist = playerPosition.distanceTo(pPos);
            if (dist < 2.8 && printerStates[p.id]) {
                foundPrompt = {
                    label: `Service ${p.name} (${p.jamCode})`,
                    keyHint: 'SPACE',
                    actionId: p.id
                };
                break;
            }
        }

        // Servers
        if (!foundPrompt) {
            for (const s of officeData.servers) {
                const sPos = new THREE.Vector3(...s.position);
                const dist = playerPosition.distanceTo(sPos);
                if (dist < 2.4 && serverStates[s.id]) {
                    foundPrompt = {
                        label: `Reboot Glitching ${s.rackName}`,
                        keyHint: 'SPACE',
                        actionId: s.id
                    };
                    break;
                }
            }
        }

        // Vending
        if (!foundPrompt) {
            const vPos = new THREE.Vector3(...officeData.vendingPos);
            if (playerPosition.distanceTo(vPos) < 2.5) {
                foundPrompt = {
                    label: 'Buy Cold Brew Espresso (+50% Speed)',
                    keyHint: 'SPACE',
                    actionId: 'vending'
                };
            }
        }

        // Water Cooler
        if (!foundPrompt) {
            const wPos = new THREE.Vector3(...officeData.waterCoolerPos);
            if (playerPosition.distanceTo(wPos) < 2.5) {
                foundPrompt = {
                    label: 'Spill Water Puddle Trap',
                    keyHint: 'SPACE',
                    actionId: 'water_cooler'
                };
            }
        }

        const currentPromptKey = foundPrompt ? `${foundPrompt.actionId}_${foundPrompt.label}` : null;
        if (lastPromptKeyRef.current !== currentPromptKey) {
            lastPromptKeyRef.current = currentPromptKey;
            setActivePrompt(foundPrompt);
        }

        // 3.5 Autonomous Agent AI Loop (When Idle / Autonomous Mode is active)
        if (isAutonomousMode) {
            const decision = LarryAutonomousAgent.decideNextAction(
                playerPosition,
                officeData.printers,
                printerStates,
                officeData.servers,
                serverStates,
                officeData.vendingPos,
                guards,
                thermalSlickCooldown,
                memoCooldown,
                caffeineRemaining
            );

            if (decision.type === 'evade') {
                if (decision.actionType === 'slick' && thermalSlickCooldown <= 0) {
                    deployThermalSlick([playerPosition.x, playerPosition.y, playerPosition.z]);
                    LarryAutonomousAgent.fetchInternalMonologue('evade').then(thought => {
                        setAutonomousStatus(decision.statusText, decision.targetName, thought);
                    });
                } else if (decision.actionType === 'memo' && memoCooldown <= 0) {
                    deployMemo([playerPosition.x, playerPosition.y, playerPosition.z]);
                    LarryAutonomousAgent.fetchInternalMonologue('evade').then(thought => {
                        setAutonomousStatus(decision.statusText, decision.targetName, thought);
                    });
                }
            } else if (decision.type === 'interact') {
                if (!lastAutoVecRef.current || lastAutoVecRef.current.action !== 'repair') {
                    lastAutoVecRef.current = { x: 0, y: 0, sprinting: false, action: 'repair' };
                    usePrinterPanicStore.setState({
                        autonomousMoveVector: null,
                        autonomousForcedAction: 'repair'
                    });
                }

                if (decision.actionType === 'service_printer' && decision.actionId) {
                    const pid = decision.actionId;
                    if (printerStates[pid]) {
                        setPrinterStates(prev => ({ ...prev, [pid]: false }));
                        servicePrinter(pid);
                        setActivePrompt(null);
                        LarryAutonomousAgent.fetchInternalMonologue('printer').then(thought => {
                            setAutonomousStatus(`✓ Serviced ${decision.targetName}!`, decision.targetName, thought);
                        });
                    }
                } else if (decision.actionType === 'reboot_server' && decision.actionId) {
                    const sid = decision.actionId;
                    if (serverStates[sid]) {
                        setServerStates(prev => ({ ...prev, [sid]: false }));
                        rebootServer(sid);
                        setActivePrompt(null);
                        LarryAutonomousAgent.fetchInternalMonologue('server').then(thought => {
                            setAutonomousStatus(`✓ Rebooted ${decision.targetName}!`, decision.targetName, thought);
                        });
                    }
                } else if (decision.actionType === 'vending') {
                    triggerCaffeine();
                    setActivePrompt(null);
                    LarryAutonomousAgent.fetchInternalMonologue('caffeine').then(thought => {
                        setAutonomousStatus(`✓ Cold brew acquired!`, 'Cold Brew', thought);
                    });
                }
            } else if (decision.type === 'move') {
                const nextWp = LarryAutonomousAgent.getNextWaypoint(playerPosition, decision.targetPos);
                const toWp = new THREE.Vector2(nextWp.x - playerPosition.x, nextWp.z - playerPosition.z);
                const distToWp = toWp.length();

                if (distToWp > 0.4) {
                    toWp.normalize();
                    const prev = lastAutoVecRef.current;
                    const targetAction = decision.isSprinting ? 'sprint' : 'walk';
                    const isDiff = !prev ||
                        Math.abs(prev.x - toWp.x) > 0.05 ||
                        Math.abs(prev.y - toWp.y) > 0.05 ||
                        prev.sprinting !== decision.isSprinting ||
                        prev.action !== targetAction;

                    if (isDiff) {
                        lastAutoVecRef.current = { x: toWp.x, y: toWp.y, sprinting: decision.isSprinting, action: targetAction };
                        usePrinterPanicStore.setState({
                            autonomousMoveVector: [toWp.x, toWp.y],
                            autonomousIsSprinting: decision.isSprinting,
                            autonomousForcedAction: targetAction
                        });
                    }
                } else {
                    if (!lastAutoVecRef.current || lastAutoVecRef.current.action !== 'idle') {
                        lastAutoVecRef.current = { x: 0, y: 0, sprinting: false, action: 'idle' };
                        usePrinterPanicStore.setState({
                            autonomousMoveVector: null,
                            autonomousForcedAction: 'idle'
                        });
                    }
                }

                if (decision.statusText !== lastAutoStatusRef.current) {
                    lastAutoStatusRef.current = decision.statusText;
                    setAutonomousStatus(decision.statusText, decision.targetName);
                }
            }
        }

        // 4. Guard AI & Patrol Navigation with Line-of-Sight & Sliding Collision
        officeData.guardRoutes.forEach((route) => {
            const gid = route.id;
            const currentPos = guardPosRefs.current[gid];
            if (!currentPos) return;

            const guardStoreData = guards.find(g => g.id === gid);
            const guardState = guardStoreData?.state || 'patrol';
            let detection = guardStoreData?.detectionLevel || 0;

            // SLIPPED: Spinning comically on carpet (smooth ref countdown, zero 60fps store mutations)
            if (guardState === 'slipped') {
                if (guardSlippedTimers.current[gid] === undefined) {
                    guardSlippedTimers.current[gid] = guardStoreData?.timer || 5.0;
                }
                guardSlippedTimers.current[gid] -= delta;
                if (guardSlippedTimers.current[gid] <= 0) {
                    delete guardSlippedTimers.current[gid];
                    setGuardPatrol(gid);
                }
                return;
            }

            // Check if guard stepped on any active traps
            for (const trap of traps) {
                const trapPos = new THREE.Vector3(...trap.position);
                if (currentPos.distanceTo(trapPos) < 1.6) {
                    if (trap.type === 'slick' || trap.type === 'puddle') {
                        setGuardSlipped(gid);
                        return;
                    }
                }
            }

            // Check if guard is lured by a deployed memo
            let nearestMemo: THREE.Vector3 | null = null;
            let memoDist = 999;
            for (const trap of traps) {
                if (trap.type === 'memo') {
                    const mPos = new THREE.Vector3(...trap.position);
                    const d = currentPos.distanceTo(mPos);
                    if (d < 14.0 && d < memoDist) {
                        memoDist = d;
                        nearestMemo = mPos;
                    }
                }
            }

            // STEALTH DETECTION / LINE OF SIGHT RAYCAST
            const toPlayer = new THREE.Vector3().subVectors(playerPosition, currentPos);
            toPlayer.y = 0;
            const distToPlayer = toPlayer.length();

            let canSeePlayer = false;
            if (distToPlayer < 14.0) {
                // Check forward field of view cone (~75 degrees = dot > 0.40) or close proximity (< 2.5m)
                const guardHeading = new THREE.Vector3(
                    Math.sin(guardRotRefs.current[gid]),
                    0,
                    Math.cos(guardRotRefs.current[gid])
                );
                const normToPlayer = toPlayer.clone().normalize();
                const dot = guardHeading.dot(normToPlayer);

                if (dot > 0.40 || distToPlayer < 2.5) {
                    // Raycast through office grid: walls, servers, and cubicles BLOCK line of sight!
                    canSeePlayer = OfficeSectorExtruder.hasLineOfSight(
                        currentPos.x, currentPos.z,
                        playerPosition.x, playerPosition.z
                    );
                }
            }

            // Detection Accumulator logic:
            if (canSeePlayer) {
                // Accumulate faster if close
                const rate = Math.max(0.45, (14.0 - distToPlayer) / 6.0);
                detection = Math.min(1.0, detection + rate * delta);
            } else {
                // Slowly decay when out of sight
                detection = Math.max(0.0, detection - 0.35 * delta);
            }

            // State transitions based on progressive detection
            if (detection >= 1.0 && guardState !== 'alert') {
                setGuardAlert(gid);
            } else if (detection > 0.30 && guardState === 'patrol') {
                setGuardInvestigating(gid, [playerPosition.x, playerPosition.y, playerPosition.z]);
            } else if (detection <= 0.05 && (guardState === 'investigating' || (guardState === 'alert' && distToPlayer > 18.0))) {
                setGuardPatrol(gid);
            } else if (guardState !== 'alert') {
                // Throttled detection sync: only update store if detection differs notably (> 0.08)
                const lastSynced = guardStoreData?.detectionLevel || 0;
                if (Math.abs(detection - lastSynced) > 0.08) {
                    updateGuardDetection(gid, detection);
                }
            }

            // Target destination and speed
            let targetTarget: THREE.Vector3;
            let moveSpeed = 2.4;

            if (nearestMemo && memoDist < 14.0) {
                // Lured by leaked memo!
                targetTarget = nearestMemo;
                moveSpeed = 2.0;
            } else if (guardState === 'alert') {
                // Chasing player at sprint speed!
                targetTarget = playerPosition;
                moveSpeed = 4.4;
            } else if (guardState === 'investigating') {
                // Cautiously sweeping disturbance area
                targetTarget = guardStoreData?.investigatingPos ? new THREE.Vector3(...guardStoreData.investigatingPos) : playerPosition;
                moveSpeed = 1.8;
            } else {
                // Waypoint patrol
                let wpIdx = guardPatrolIdx.current[gid] || 0;
                const waypoints = route.waypoints;
                const currentWp = new THREE.Vector3(...waypoints[wpIdx]);

                if (currentPos.distanceTo(currentWp) < 1.2) {
                    wpIdx = (wpIdx + 1) % waypoints.length;
                    guardPatrolIdx.current[gid] = wpIdx;
                }
                targetTarget = new THREE.Vector3(...waypoints[wpIdx]);
                moveSpeed = 2.4;
            }

            // Move towards target with AXIS-DECOUPLED SLIDING COLLISION
            // Prevents guards from EVER clipping through walls, cubicles, servers, or desks!
            const moveDir = new THREE.Vector3().subVectors(targetTarget, currentPos);
            moveDir.y = 0;
            if (moveDir.lengthSq() > 0.01) {
                moveDir.normalize();

                const stepX = moveDir.x * moveSpeed * delta;
                const stepZ = moveDir.z * moveSpeed * delta;
                const guardRadius = 0.45;

                const nextX = currentPos.x + stepX;
                const nextZ = currentPos.z + stepZ;

                if (!topographyRegistry.isBlocked(nextX, currentPos.z, guardRadius)) {
                    currentPos.x = nextX;
                }
                if (!topographyRegistry.isBlocked(currentPos.x, nextZ, guardRadius)) {
                    currentPos.z = nextZ;
                }

                const targetRot = Math.atan2(moveDir.x, moveDir.z);
                guardRotRefs.current[gid] = targetRot;
            }
        });
    });

    if (!isActive) return null;

    return (
        <group name="PrinterPanicWorldSubstrate">
            {/* Cyber-Office Lighting: Bright commercial downlights + cool accents */}
            <ambientLight intensity={1.5} color="#e2e8f0" />
            <directionalLight position={[25, 35, 20]} intensity={2.2} color="#ffffff" castShadow />
            <directionalLight position={[-25, 25, -20]} intensity={1.2} color="#38bdf8" />

            {/* Extruded 3D Instanced Office Meshes (Walls, Cubicles, Desks, Servers, Floor) */}
            <primitive object={officeData.wallMesh} />
            <primitive object={officeData.cubicleMesh} />
            <primitive object={officeData.deskMesh} />
            <primitive object={officeData.serverMesh} />
            <primitive object={officeData.floorMesh} />

            {/* Ceiling Troffer Downlights */}
            {officeData.lights.map((l, idx) => (
                <group key={idx} position={l.position}>
                    <pointLight intensity={l.intensity * 1.5} color={l.color} distance={20} decay={2} />
                    <mesh position={[0, -0.05, 0]}>
                        <boxGeometry args={[1.6, 0.08, 0.8]} />
                        <meshBasicMaterial color={l.color} />
                    </mesh>
                </group>
            ))}

            {/* Living Flesh Golem Coworkers Seated in Cubicles */}
            {COWORKERS.map((worker) => (
                <CubicleWorker
                    key={worker.id}
                    id={worker.id}
                    name={worker.name}
                    role={worker.role}
                    position={worker.position}
                    speech={worker.speech}
                    facing={worker.facing}
                />
            ))}

            {/* Interactive 3D Industrial Laser Printers with Diegetic Badges */}
            {officeData.printers.map((printer) => {
                const isJammed = printerStates[printer.id];
                return (
                    <group key={printer.id} position={printer.position}>
                        {/* Heavy-Duty Laser Printer Chassis */}
                        <mesh position={[0, 0.6, 0]} castShadow>
                            <boxGeometry args={[1.3, 1.2, 1.1]} />
                            <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.2} />
                        </mesh>
                        {/* Paper Input Drawers */}
                        <mesh position={[0, 0.35, 0.56]}>
                            <boxGeometry args={[1.1, 0.4, 0.04]} />
                            <meshStandardMaterial color="#334155" roughness={0.6} />
                        </mesh>
                        {/* Scanner Bed Glass */}
                        <mesh position={[0, 1.21, 0]}>
                            <boxGeometry args={[1.2, 0.04, 0.9]} />
                            <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} />
                        </mesh>
                        {/* Top Document Feeder Tray */}
                        <mesh position={[0, 1.35, -0.1]}>
                            <boxGeometry args={[0.9, 0.15, 0.7]} />
                            <meshStandardMaterial color="#475569" />
                        </mesh>
                        {/* Side Output Sorter Tray */}
                        <mesh position={[0.75, 0.85, 0]} rotation={[0, 0, -0.2]}>
                            <boxGeometry args={[0.4, 0.05, 0.8]} />
                            <meshStandardMaterial color="#334155" />
                        </mesh>

                        {/* Status Beacon Pole */}
                        <mesh position={[0.5, 1.45, -0.4]}>
                            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                            <meshStandardMaterial color="#1e293b" metalness={0.9} />
                        </mesh>
                        {/* High-Intensity Beacon Light */}
                        <mesh position={[0.5, 1.7, -0.4]}>
                            <sphereGeometry args={[0.1, 16, 16]} />
                            <meshStandardMaterial
                                color={isJammed ? '#ef4444' : '#10b981'}
                                emissive={isJammed ? '#ef4444' : '#10b981'}
                                emissiveIntensity={isJammed ? 3.5 : 1.5}
                            />
                        </mesh>
                        <pointLight
                            position={[0.5, 1.7, -0.4]}
                            intensity={isJammed ? 4.0 : 1.5}
                            color={isJammed ? '#ef4444' : '#10b981'}
                            distance={8}
                        />

                        {/* Jammed Paper Ribbon Spooling Out */}
                        {isJammed && (
                            <mesh position={[0.1, 0.82, 0.65]} rotation={[0.4, 0.2, 0]}>
                                <planeGeometry args={[0.45, 1.1]} />
                                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                            </mesh>
                        )}

                        {/* Diegetic 3D In-World Floating Prompt Badge */}
                        <Html center position={[0, 2.2, 0]} distanceFactor={18}>
                            {isJammed ? (
                                <div
                                    onClick={() => {
                                        setPrinterStates(prev => ({ ...prev, [printer.id]: false }));
                                        servicePrinter(printer.id);
                                        setActivePrompt(null);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/95 border-2 border-red-500 text-red-100 font-bold text-xs shadow-[0_0_25px_rgba(239,68,68,0.7)] cursor-pointer hover:scale-105 active:scale-95 transition-all select-none whitespace-nowrap"
                                >
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                                    <span>[SPACE] SERVICE {printer.jamCode.split(':')[0]}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/70 text-emerald-300 font-mono text-[11px] shadow-[0_0_15px_rgba(16,185,129,0.4)] select-none whitespace-nowrap">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>[✓] ONLINE (60 PPM)</span>
                                </div>
                            )}
                        </Html>
                    </group>
                );
            })}

            {/* Interactive 3D Datacenter Server Racks with Diegetic Badges */}
            {officeData.servers.map((server) => {
                const isGlitching = serverStates[server.id];
                return (
                    <group key={server.id} position={server.position}>
                        {/* Server Rack Chassis */}
                        <mesh position={[0, 1.2, 0]} castShadow>
                            <boxGeometry args={[1.2, 2.4, 1.2]} />
                            <meshStandardMaterial color="#090d16" roughness={0.3} metalness={0.9} />
                        </mesh>
                        {/* Front Blade Faceplate Glass */}
                        <mesh position={[0, 1.2, 0.61]}>
                            <planeGeometry args={[1.0, 2.2]} />
                            <meshStandardMaterial
                                color={isGlitching ? '#f59e0b' : '#0284c7'}
                                emissive={isGlitching ? '#f59e0b' : '#0284c7'}
                                emissiveIntensity={isGlitching ? 1.5 : 0.6}
                                roughness={0.2}
                            />
                        </mesh>
                        <pointLight
                            position={[0, 1.5, 0.9]}
                            color={isGlitching ? '#f59e0b' : '#0284c7'}
                            intensity={isGlitching ? 3.0 : 1.2}
                            distance={6}
                        />

                        {/* Diegetic 3D Floating Server Status Badge */}
                        <Html center position={[0, 2.7, 0]} distanceFactor={18}>
                            {isGlitching ? (
                                <div
                                    onClick={() => {
                                        setServerStates(prev => ({ ...prev, [server.id]: false }));
                                        rebootServer(server.id);
                                        setActivePrompt(null);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/95 border-2 border-amber-500 text-amber-200 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all select-none whitespace-nowrap animate-pulse"
                                >
                                    <span>⚡</span>
                                    <span>[SPACE] REBOOT {server.rackName}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/50 text-sky-300 font-mono text-[10px] select-none whitespace-nowrap">
                                    <span>✓</span>
                                    <span>{server.rackName} STABLE</span>
                                </div>
                            )}
                        </Html>
                    </group>
                );
            })}

            {/* Breakroom Vending Machine with Diegetic Badge */}
            <group position={officeData.vendingPos}>
                <mesh position={[0, 1.1, 0]} castShadow>
                    <boxGeometry args={[1.4, 2.2, 1.0]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.5} />
                </mesh>
                {/* Lit Front Glass Display */}
                <mesh position={[0, 1.3, 0.51]}>
                    <planeGeometry args={[1.1, 1.2]} />
                    <meshStandardMaterial
                        color="#06b6d4"
                        emissive="#06b6d4"
                        emissiveIntensity={1.2}
                        roughness={0.2}
                    />
                </mesh>
                <pointLight position={[0, 1.3, 0.9]} color="#06b6d4" intensity={2.5} distance={6} />

                {/* Diegetic 3D Floating Vending Badge */}
                <Html center position={[0, 2.5, 0]} distanceFactor={18}>
                    <div
                        onClick={() => {
                            triggerCaffeine();
                            setActivePrompt(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/90 border-2 border-cyan-400 text-cyan-200 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer hover:scale-105 active:scale-95 transition-all select-none whitespace-nowrap"
                    >
                        <span>☕</span>
                        <span>[SPACE] COLD BREW (+50% SPEED)</span>
                    </div>
                </Html>
            </group>

            {/* Breakroom Water Cooler with Diegetic Badge */}
            <group position={officeData.waterCoolerPos}>
                {/* Dispenser Base */}
                <mesh position={[0, 0.6, 0]}>
                    <cylinderGeometry args={[0.3, 0.35, 1.2, 16]} />
                    <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
                </mesh>
                {/* Translucent Blue Water Reservoir Jug */}
                <mesh position={[0, 1.4, 0]}>
                    <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
                    <meshPhysicalMaterial
                        color="#38bdf8"
                        transmission={0.8}
                        opacity={0.85}
                        transparent
                        roughness={0.1}
                        ior={1.33}
                    />
                </mesh>

                {/* Diegetic 3D Floating Water Cooler Badge */}
                <Html center position={[0, 2.0, 0]} distanceFactor={18}>
                    <div
                        onClick={() => {
                            deployThermalSlick([officeData.waterCoolerPos[0], 0.1, officeData.waterCoolerPos[2]]);
                            setActivePrompt(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/90 border-2 border-blue-400 text-blue-200 font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.5)] cursor-pointer hover:scale-105 active:scale-95 transition-all select-none whitespace-nowrap"
                    >
                        <span>💧</span>
                        <span>[SPACE] SPILL WATER SLICK</span>
                    </div>
                </Html>
            </group>

            {/* Diegetic 3D Floating Larry Autonomous Agent Telemetry Badge */}
            {isAutonomousMode && (
                <group position={[playerPosition.x, 2.8, playerPosition.z]}>
                    <Html center distanceFactor={20}>
                        <div className="bg-cyan-950/95 border-2 border-cyan-400 rounded-xl px-3 py-1.5 shadow-[0_0_25px_rgba(6,182,212,0.5)] backdrop-blur-md w-64 text-center pointer-events-none select-none animate-in fade-in">
                            <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider text-cyan-300 mb-0.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                <span>🤖 LARRY AI • AUTONOMOUS MODE</span>
                            </div>
                            <div className="text-[11px] text-amber-300 font-mono leading-tight font-bold truncate">
                                {autonomousStatus}
                            </div>
                        </div>
                    </Html>
                </group>
            )}

            {/* Deployed Floor Traps (Thermal Slicks & Memos) */}
            {traps.map((trap) => {
                if (trap.type === 'slick' || trap.type === 'puddle') {
                    return (
                        <group key={trap.id} position={trap.position}>
                            {/* Reflective Slippery Thermal Paper Ribbon / Puddle */}
                            <mesh rotation={[-Math.PI / 2, 0, Math.sin(trap.createdAt)]}>
                                <planeGeometry args={[1.8, 1.8]} />
                                <meshStandardMaterial
                                    color={trap.type === 'slick' ? '#f8fafc' : '#0284c7'}
                                    roughness={0.05}
                                    metalness={0.8}
                                    transparent
                                    opacity={0.85}
                                />
                            </mesh>
                        </group>
                    );
                } else if (trap.type === 'memo') {
                    return (
                        <group key={trap.id} position={trap.position}>
                            {/* Glowing Classified Corporate Memo Folder */}
                            <mesh position={[0, 0.15, 0]} rotation={[0, trap.createdAt % 6, 0]}>
                                <boxGeometry args={[0.5, 0.05, 0.7]} />
                                <meshStandardMaterial
                                    color="#f59e0b"
                                    emissive="#f59e0b"
                                    emissiveIntensity={2.2}
                                />
                            </mesh>
                            <pointLight position={[0, 0.4, 0]} color="#f59e0b" intensity={3.0} distance={6} />
                        </group>
                    );
                }
                return null;
            })}

            {/* 3D Patrolling Corporate ICE Enforcers (Flesh Golem Security Guards) */}
            {officeData.guardRoutes.map((route) => (
                <GuardAvatar
                    key={route.id}
                    route={route}
                    guards={guards}
                    getPos={() => guardPosRefs.current[route.id] || new THREE.Vector3()}
                    getRot={() => guardRotRefs.current[route.id] || 0}
                />
            ))}

            {children}
        </group>
    );
};
