import { create } from 'zustand';
import { radioLiaison, type RadioTransmission, type DebriefStats } from '../engine/OfficeRadioLiaison';
import { officeAudio } from '../engine/OfficeAudioSynth';

export interface TrapEntity {
    id: string;
    type: 'slick' | 'memo' | 'puddle';
    position: [number, number, number];
    createdAt: number;
    duration: number; // in seconds
}

export interface GuardEntity {
    id: string;
    position: [number, number, number];
    rotationY: number;
    state: 'patrol' | 'alert' | 'slipped' | 'investigating';
    timer: number;
    detectionLevel: number; // 0.0 to 1.0
    investigatingPos?: [number, number, number];
}

interface PrinterPanicState {
    panic: number;
    panicPeak: number;
    throughput: number;
    targetQuota: number;
    printersFixed: number;
    totalPrinters: number;
    serversRebooted: number;
    totalServers: number;
    guardsSlipped: number;
    memosDeployed: number;
    elapsedSeconds: number;
    gracePeriodRemaining: number;
    isDialogueOpen: boolean;
    gameStatus: 'PLAYING' | 'VICTORY' | 'DEFEAT';
    
    // Cooldowns
    thermalSlickCooldown: number;
    memoCooldown: number;
    caffeineRemaining: number;

    // Interaction Prompt
    activePrompt: { label: string; keyHint: string; actionId: string } | null;

    // Traps and Guards
    traps: TrapEntity[];
    guards: GuardEntity[];

    // Autonomous Mode (Idle Agent / Local Model)
    isAutonomousMode: boolean;
    autonomousStatus: string;
    autonomousTargetName: string | null;
    autonomousThought: string;
    autonomousMoveVector: [number, number] | null;
    autonomousForcedAction: 'idle' | 'walk' | 'sprint' | 'repair' | 'damage' | null;
    autonomousIsSprinting: boolean;

    // Radio
    transmissions: RadioTransmission[];
    victoryReport: {
        grade: 'S' | 'A' | 'B' | 'C';
        title: string;
        debriefMessage: string;
        itCommNote: string;
        corporateNotice: string;
    } | null;

    // Actions
    tick: (delta: number) => void;
    deployThermalSlick: (pos: [number, number, number]) => boolean;
    deployMemo: (pos: [number, number, number]) => boolean;
    triggerCaffeine: () => void;
    servicePrinter: (printerId: string) => void;
    rebootServer: (serverId: string) => void;
    setActivePrompt: (prompt: { label: string; keyHint: string; actionId: string } | null) => void;
    addTransmission: (tx: RadioTransmission) => void;
    restartShift: () => void;
    setGuardSlipped: (guardId: string) => void;
    setGuardAlert: (guardId: string) => void;
    setGuardInvestigating: (guardId: string, pos?: [number, number, number]) => void;
    setGuardPatrol: (guardId: string) => void;
    updateGuardDetection: (guardId: string, level: number) => void;
    setDialogueOpen: (open: boolean) => void;
    toggleAutonomousMode: () => void;
    setAutonomousMode: (active: boolean) => void;
    setAutonomousStatus: (status: string, targetName?: string | null, thought?: string) => void;
}

const INITIAL_QUOTA = 900;
const INITIAL_THROUGHPUT = 180;
const INITIAL_PANIC = 5;
const INITIAL_GRACE_PERIOD = 30; // 30 seconds orientation grace period where panic does not climb

export const usePrinterPanicStore = create<PrinterPanicState>((set, get) => ({
    panic: INITIAL_PANIC,
    panicPeak: INITIAL_PANIC,
    throughput: INITIAL_THROUGHPUT,
    targetQuota: INITIAL_QUOTA,
    printersFixed: 0,
    totalPrinters: 3,
    serversRebooted: 0,
    totalServers: 2,
    guardsSlipped: 0,
    memosDeployed: 0,
    elapsedSeconds: 0,
    gracePeriodRemaining: INITIAL_GRACE_PERIOD,
    isDialogueOpen: false,
    gameStatus: 'PLAYING',

    thermalSlickCooldown: 0,
    memoCooldown: 0,
    caffeineRemaining: 0,
    activePrompt: null,

    // Autonomous Mode initial state
    isAutonomousMode: false,
    autonomousStatus: 'STANDBY (MANUAL CONTROL)',
    autonomousTargetName: null,
    autonomousThought: 'Awaiting manual shift instructions or autonomous agent engagement.',
    autonomousMoveVector: null,
    autonomousForcedAction: null,
    autonomousIsSprinting: false,

    traps: [],
    guards: [
        { id: 'guard_alpha', position: [-18, 0.1, -15], rotationY: 0, state: 'patrol', timer: 0, detectionLevel: 0 },
        { id: 'guard_bravo', position: [10, 0.1, -6], rotationY: 0, state: 'patrol', timer: 0, detectionLevel: 0 },
        { id: 'guard_charlie', position: [-25, 0.1, 12], rotationY: 0, state: 'patrol', timer: 0, detectionLevel: 0 }
    ],

    transmissions: [
        radioLiaison.getIncidentChatter('START')
    ],
    victoryReport: null,

    tick: (delta: number) => {
        const state = get();
        if (state.gameStatus !== 'PLAYING') return;

        // If story dialogue is open, PAUSE game panic and elapsed time completely!
        if (state.isDialogueOpen) return;

        const newElapsed = state.elapsedSeconds + delta;
        const newSlickCd = Math.max(0, state.thermalSlickCooldown - delta);
        const newMemoCd = Math.max(0, state.memoCooldown - delta);
        const newCaff = Math.max(0, state.caffeineRemaining - delta);
        const newGrace = Math.max(0, state.gracePeriodRemaining - delta);

        // Throughput natural growth
        const activeThroughput = state.throughput + (12 + state.serversRebooted * 8) * delta;

        // Panic delta: during grace period, panic does not rise at all!
        // Once grace period expires, rises at a balanced arcade pace (3.5 - 4.5 minutes to 100%)
        let newPanic = state.panic;
        if (newGrace <= 0) {
            const unservicedPrinters = Math.max(0, state.totalPrinters - state.printersFixed);
            if (unservicedPrinters > 0) {
                const panicRate = 0.08 + unservicedPrinters * 0.10; // 0.38/sec with 3 printers (~4.4 minutes to 100%)
                newPanic = Math.min(100, Math.max(0, state.panic + panicRate * delta));
            } else {
                // All printers fixed: panic slowly subsides!
                newPanic = Math.max(0, state.panic - 0.4 * delta);
            }
        }
        const newPanicPeak = Math.max(state.panicPeak, newPanic);

        // Filter expired traps
        const now = Date.now();
        const activeTraps = state.traps.filter(t => (now - t.createdAt) < t.duration * 1000);

        // Check victory / defeat conditions
        if (newPanic >= 100) {
            officeAudio.playAlertPing();
            set({
                panic: 100,
                panicPeak: 100,
                gameStatus: 'DEFEAT'
            });
            return;
        }

        if (state.printersFixed >= state.totalPrinters && activeThroughput >= state.targetQuota) {
            officeAudio.playVictory();
            const debriefStats: DebriefStats = {
                throughput: Math.round(activeThroughput),
                panicPeak: Math.round(newPanicPeak),
                printersServiced: state.printersFixed,
                guardsSlipped: state.guardsSlipped,
                memosDeployed: state.memosDeployed,
                elapsedSeconds: Math.round(newElapsed)
            };
            const victoryReport = radioLiaison.generateVictoryDebrief(debriefStats);

            set({
                throughput: activeThroughput,
                panic: newPanic,
                panicPeak: newPanicPeak,
                elapsedSeconds: newElapsed,
                gracePeriodRemaining: newGrace,
                gameStatus: 'VICTORY',
                victoryReport
            });
            return;
        }

        set({
            elapsedSeconds: newElapsed,
            gracePeriodRemaining: newGrace,
            thermalSlickCooldown: newSlickCd,
            memoCooldown: newMemoCd,
            caffeineRemaining: newCaff,
            throughput: activeThroughput,
            panic: newPanic,
            panicPeak: newPanicPeak,
            traps: activeTraps
        });
    },

    deployThermalSlick: (pos: [number, number, number]) => {
        const state = get();
        if (state.thermalSlickCooldown > 0 || state.gameStatus !== 'PLAYING') return false;

        officeAudio.playDeployGadget();
        const newTrap: TrapEntity = {
            id: `slick_${Date.now()}`,
            type: 'slick',
            position: [pos[0], 0.05, pos[2]],
            createdAt: Date.now(),
            duration: 18 // stays on floor for 18 seconds
        };

        set(s => ({
            traps: [...s.traps, newTrap],
            thermalSlickCooldown: 4.5
        }));
        return true;
    },

    deployMemo: (pos: [number, number, number]) => {
        const state = get();
        if (state.memoCooldown > 0 || state.gameStatus !== 'PLAYING') return false;

        officeAudio.playDeployGadget();
        const newTrap: TrapEntity = {
            id: `memo_${Date.now()}`,
            type: 'memo',
            position: [pos[0], 0.05, pos[2]],
            createdAt: Date.now(),
            duration: 14 // stays for 14 seconds
        };

        const tx = radioLiaison.getIncidentChatter('MEMO_DROPPED');
        officeAudio.playRadioChime();

        set(s => ({
            traps: [...s.traps, newTrap],
            memoCooldown: 9.0,
            memosDeployed: s.memosDeployed + 1,
            transmissions: [...s.transmissions.slice(-4), tx]
        }));
        return true;
    },

    triggerCaffeine: () => {
        officeAudio.playRepairSuccess();
        set({ caffeineRemaining: 8.0 });
    },

    servicePrinter: (printerId: string) => {
        const state = get();
        if (state.gameStatus !== 'PLAYING') return;

        officeAudio.playRepairSuccess();
        const newPrintersFixed = state.printersFixed + 1;
        const newThroughput = state.throughput + 280;
        const newPanic = Math.max(0, state.panic - 25);

        const tx = radioLiaison.getIncidentChatter('PRINTER_FIXED');
        officeAudio.playRadioChime();

        set(s => ({
            printersFixed: newPrintersFixed,
            throughput: newThroughput,
            panic: newPanic,
            transmissions: [...s.transmissions.slice(-4), tx]
        }));
    },

    rebootServer: (serverId: string) => {
        const state = get();
        if (state.gameStatus !== 'PLAYING') return;

        officeAudio.playRepairSuccess();
        const newThroughput = state.throughput + 200;
        const newServers = state.serversRebooted + 1;

        set(s => ({
            throughput: newThroughput,
            serversRebooted: newServers
        }));
    },

    setGuardSlipped: (guardId: string) => {
        officeAudio.playGuardSlip();
        const tx = radioLiaison.getIncidentChatter('GUARD_SLIPPED');
        officeAudio.playRadioChime();

        set(s => ({
            guardsSlipped: s.guardsSlipped + 1,
            panic: Math.max(0, s.panic - 8),
            guards: s.guards.map(g => g.id === guardId ? { ...g, state: 'slipped', timer: 4.5 } : g),
            transmissions: [...s.transmissions.slice(-4), tx]
        }));
    },

    setGuardAlert: (guardId: string) => {
        officeAudio.playAlertPing();
        const tx = radioLiaison.getIncidentChatter('GUARD_ALERT');
        officeAudio.playRadioChime();

        set(s => ({
            panic: Math.min(100, s.panic + 12),
            guards: s.guards.map(g => g.id === guardId ? { ...g, state: 'alert', timer: 4.5, detectionLevel: 1.0 } : g),
            transmissions: [...s.transmissions.slice(-4), tx]
        }));
    },

    setGuardInvestigating: (guardId: string, pos?: [number, number, number]) => {
        set(s => ({
            guards: s.guards.map(g => g.id === guardId ? {
                ...g,
                state: 'investigating',
                timer: 4.0,
                investigatingPos: pos || g.position
            } : g)
        }));
    },

    setGuardPatrol: (guardId: string) => {
        set(s => ({
            guards: s.guards.map(g => g.id === guardId ? {
                ...g,
                state: 'patrol',
                timer: 0,
                detectionLevel: 0,
                investigatingPos: undefined
            } : g)
        }));
    },

    updateGuardDetection: (guardId: string, level: number) => {
        set(s => ({
            guards: s.guards.map(g => g.id === guardId ? {
                ...g,
                detectionLevel: Math.max(0, Math.min(1.0, level))
            } : g)
        }));
    },

    setDialogueOpen: (open: boolean) => {
        set({ isDialogueOpen: open });
    },

    setActivePrompt: (prompt) => set({ activePrompt: prompt }),

    addTransmission: (tx) => {
        officeAudio.playRadioChime();
        set(s => ({
            transmissions: [...s.transmissions.slice(-4), tx]
        }));
    },

    toggleAutonomousMode: () => {
        const next = !get().isAutonomousMode;
        set({
            isAutonomousMode: next,
            autonomousStatus: next ? 'INITIALIZING AUTONOMOUS PROTOCOL...' : 'STANDBY (MANUAL CONTROL)',
            autonomousThought: next ? 'Engaging sysadmin neural loop. Let me handle these tickets...' : 'Manual override engaged. You have the wheel.'
        });
        if (next) {
            officeAudio.playRepairSuccess();
        } else {
            officeAudio.playDeployGadget();
        }
    },

    setAutonomousMode: (active: boolean) => {
        set({
            isAutonomousMode: active,
            autonomousStatus: active ? 'INITIALIZING AUTONOMOUS PROTOCOL...' : 'STANDBY (MANUAL CONTROL)',
            autonomousThought: active ? 'Engaging sysadmin neural loop. Scanning Sector-404...' : 'Manual override engaged.'
        });
    },

    setAutonomousStatus: (status: string, targetName?: string | null, thought?: string) => {
        set(s => ({
            autonomousStatus: status,
            ...(targetName !== undefined ? { autonomousTargetName: targetName } : {}),
            ...(thought ? { autonomousThought: thought } : {})
        }));
    },

    restartShift: () => {
        set({
            panic: INITIAL_PANIC,
            panicPeak: INITIAL_PANIC,
            throughput: INITIAL_THROUGHPUT,
            targetQuota: INITIAL_QUOTA,
            printersFixed: 0,
            serversRebooted: 0,
            guardsSlipped: 0,
            memosDeployed: 0,
            elapsedSeconds: 0,
            gracePeriodRemaining: INITIAL_GRACE_PERIOD,
            isDialogueOpen: false,
            gameStatus: 'PLAYING',
            thermalSlickCooldown: 0,
            memoCooldown: 0,
            caffeineRemaining: 0,
            activePrompt: null,
            isAutonomousMode: false,
            autonomousStatus: 'STANDBY (MANUAL CONTROL)',
            autonomousTargetName: null,
            autonomousThought: 'Shift reset. Systems nominal.',
            autonomousMoveVector: null,
            autonomousForcedAction: null,
            autonomousIsSprinting: false,
            traps: [],
            victoryReport: null,
            guards: [
                { id: 'guard_alpha', position: [-18, 0.1, -15], rotationY: 0, state: 'patrol', timer: 0, detectionLevel: 0 },
                { id: 'guard_bravo', position: [10, 0.1, -6], rotationY: 0, state: 'patrol', timer: 0, detectionLevel: 0 },
                { id: 'guard_charlie', position: [-25, 0.1, 12], rotationY: 0, state: 'patrol', timer: 0, detectionLevel: 0 }
            ],
            transmissions: [
                radioLiaison.getIncidentChatter('START')
            ]
        });
    }
}));
