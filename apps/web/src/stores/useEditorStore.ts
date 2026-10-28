import { create } from 'zustand';

interface EditorState {
    isEditorMode: boolean;
    cameraMode: 'rts' | 'drone';
    selectedObjectId: string | null;
    contextMenu: { x: number, y: number, objectId: string } | null;
    cursorState: 'default' | 'pointer' | 'grab' | 'grabbing';
    setEditorMode: (mode: boolean) => void;
    setCameraMode: (mode: 'rts' | 'drone') => void;
    setSelectedObject: (id: string | null) => void;
    setContextMenu: (menu: { x: number, y: number, objectId: string } | null) => void;
    setCursorState: (state: 'default' | 'pointer' | 'grab' | 'grabbing') => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    isEditorMode: false,
    cameraMode: 'rts',
    selectedObjectId: null,
    contextMenu: null,
    cursorState: 'default',
    setEditorMode: (mode) => set({ isEditorMode: mode }),
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setSelectedObject: (id) => set({ selectedObjectId: id }),
    setCursorState: (state) => set({ cursorState: state }),
}));
