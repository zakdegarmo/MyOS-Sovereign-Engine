import { create } from 'zustand';

interface AssetPreviewState {
    pendingAssetUrl: string | null;
    pendingCommand: any | null;
    setPendingAsset: (url: string | null, cmd: any | null) => void;
}

export const useAssetPreviewStore = create<AssetPreviewState>((set) => ({
    pendingAssetUrl: null,
    pendingCommand: null,
    setPendingAsset: (url, cmd) => set({ pendingAssetUrl: url, pendingCommand: cmd })
}));
