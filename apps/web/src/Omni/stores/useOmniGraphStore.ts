import { create } from 'zustand';

interface OmniGraphState {
    targetNodeId: string | null;
    setTargetNode: (id: string | null) => void;
}

export const useOmniGraphStore = create<OmniGraphState>((set) => ({
    targetNodeId: null,
    setTargetNode: (id) => set({ targetNodeId: id }),
}));
