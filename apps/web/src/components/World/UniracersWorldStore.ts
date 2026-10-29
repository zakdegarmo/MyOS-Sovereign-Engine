// apps/web/src/components/World/UniracersWorldStore.ts
import { create } from 'zustand';

export type CameraMode = 'NORMAL' | 'WIDE' | 'REAR' | 'SIDE_2D' | 'TOP_DOWN';

export interface UniracersWorldState {
    speed: number;
    score: number;
    currentBranchName: string;
    currentPillarName: string;
    cameraMode: CameraMode;
    upcomingJunctionLabel?: string;
    lastTrickText?: string;
    playerWorldPos: [number, number, number];
    playerHeading: number;
    isTacticalMapOpen: boolean;
    activeEmote?: string;
    setSpeed: (speed: number) => void;
    addScore: (points: number) => void;
    setBranch: (branch: string, pillar: string) => void;
    setCameraMode: (mode: CameraMode | ((prev: CameraMode) => CameraMode)) => void;
    toggleCamera: () => void;
    setUpcomingJunction: (junction?: string) => void;
    setLastTrickText: (trick: string) => void;
    setPlayerWorldPos: (pos: [number, number, number]) => void;
    setPlayerHeading: (heading: number) => void;
    setTacticalMapOpen: (open: boolean) => void;
    toggleTacticalMap: () => void;
    setActiveEmote: (emote?: string) => void;
}

export const useUniracersWorldStore = create<UniracersWorldState>((set) => ({
    speed: 0,
    score: 0,
    currentBranchName: 'Central Roundabout Hub Highway',
    currentPillarName: 'The Nexus Core',
    cameraMode: 'NORMAL',
    upcomingJunctionLabel: undefined,
    lastTrickText: undefined,
    playerWorldPos: [0, 45, 1200],
    playerHeading: 0,
    isTacticalMapOpen: false,
    activeEmote: undefined,
    setSpeed: (speed) => set({ speed }),
    addScore: (points) => set((s) => ({ score: s.score + points })),
    setBranch: (branch, pillar) => set({ currentBranchName: branch, currentPillarName: pillar }),
    setCameraMode: (mode) => set((state) => ({
        cameraMode: typeof mode === 'function' ? mode(state.cameraMode) : mode
    })),
    toggleCamera: () => set((state) => {
        const cycle: Record<CameraMode, CameraMode> = {
            NORMAL: 'WIDE',
            WIDE: 'REAR',
            REAR: 'SIDE_2D',
            SIDE_2D: 'TOP_DOWN',
            TOP_DOWN: 'NORMAL'
        };
        return { cameraMode: cycle[state.cameraMode] };
    }),
    setUpcomingJunction: (upcomingJunctionLabel) => set({ upcomingJunctionLabel }),
    setLastTrickText: (lastTrickText) => set({ lastTrickText }),
    setPlayerWorldPos: (playerWorldPos) => set({ playerWorldPos }),
    setPlayerHeading: (playerHeading) => set({ playerHeading }),
    setTacticalMapOpen: (isTacticalMapOpen) => set({ isTacticalMapOpen }),
    toggleTacticalMap: () => set((s) => ({ isTacticalMapOpen: !s.isTacticalMapOpen })),
    setActiveEmote: (activeEmote) => set({ activeEmote })
}));
