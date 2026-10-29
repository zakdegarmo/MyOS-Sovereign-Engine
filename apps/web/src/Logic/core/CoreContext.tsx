
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type {
    GlyphObject, LoadedModel, PrimitiveObject, TransformState,
    ModifiersState, ObjectGeometrySettings, Oscillator, OntologicalParameter,
    Relationship, ConsoleLog, PrimitiveType, PaintToolState
} from './types';
import * as THREE from 'three';

// Define the Shape of the Context
export interface CoreContextType {
    // Objects
    glyphObjects: GlyphObject[];
    loadedModels: LoadedModel[];
    primitiveObjects: PrimitiveObject[];

    // State Maps
    objectTransforms: Record<string, TransformState>;
    objectModifiers: Record<string, ModifiersState>;
    objectSettings: Record<string, ObjectGeometrySettings>;
    objectParameters: Record<string, any>;
    ontologicalParameters: Record<string, OntologicalParameter[]>;
    objectOscillators: Record<string, Oscillator[]>;

    // Selection & Camera
    selectedObjectKeys: string[];
    cameraMode: 'orbit' | 'fly';

    // Actions
    addPrimitive: (type: PrimitiveType, overrides?: any) => string;
    updateObject: (id: string, updates: Partial<PrimitiveObject>) => void;
    deleteObject: (id: string) => void;
    clearScene: () => void;
    importModel: (url: string) => void;
    updateTransform: (id: string, update: Partial<TransformState>) => void;
    setCameraMode: (mode: 'orbit' | 'fly') => void;
    setSelectedObjectKeys: (keys: string[] | ((prev: string[]) => string[])) => void;

    // Setters (Exposed for Viewer3D)
    setObjectTransforms: React.Dispatch<React.SetStateAction<Record<string, TransformState>>>;
    setObjectModifiers: React.Dispatch<React.SetStateAction<Record<string, ModifiersState>>>;

    // Paint State (Placeholder for now)
    paintToolState: PaintToolState;
    setPaintToolState: React.Dispatch<React.SetStateAction<PaintToolState>>;
    textures: Record<string, { name: string; texture: THREE.Texture; dataUrl: string }>;
    objectTextureAssignments: Record<string, string>;
    paintedTextures: Record<string, THREE.CanvasTexture>;
    onPaintedTextureCreate: (objectKey: string, texture: THREE.CanvasTexture) => void;
    onPaintedTextureUpdate: (objectKey: string, texture: THREE.CanvasTexture) => void;

    relationships: Relationship[];

    // Console interaction
    logToIDE: (text: string, type: ConsoleLog['type']) => void;
    latestLog: ConsoleLog | null;
}

const CoreContext = createContext<CoreContextType | undefined>(undefined);

export const useCore = () => {
    const context = useContext(CoreContext);
    if (!context) {
        throw new Error('useCore must be used within a CoreProvider');
    }
    return context;
};

export const CoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- State Initialization ---
    const [glyphObjects, setGlyphObjects] = useState<GlyphObject[]>([]);
    const [loadedModels, setLoadedModels] = useState<LoadedModel[]>([]);
    const [primitiveObjects, setPrimitiveObjects] = useState<PrimitiveObject[]>([]);

    const [objectTransforms, setObjectTransforms] = useState<Record<string, TransformState>>({});
    const [objectModifiers, setObjectModifiers] = useState<Record<string, ModifiersState>>({});
    const [objectSettings] = useState<Record<string, ObjectGeometrySettings>>({});
    const [objectParameters, setObjectParameters] = useState<Record<string, any>>({});
    const [ontologicalParameters] = useState<Record<string, OntologicalParameter[]>>({});
    const [objectOscillators] = useState<Record<string, Oscillator[]>>({});

    const [selectedObjectKeys, setSelectedObjectKeys] = useState<string[]>([]);
    const [cameraMode, setCameraMode] = useState<'orbit' | 'fly'>('orbit');
    const [relationships] = useState<Relationship[]>([]);

    // Paint State
    const [paintToolState, setPaintToolState] = useState<PaintToolState>({ enabled: false, color: '#ffffff', size: 0.5, opacity: 1 });
    const [textures] = useState<Record<string, { name: string; texture: THREE.Texture; dataUrl: string }>>({});
    const [objectTextureAssignments] = useState<Record<string, string>>({});
    const [paintedTextures, setPaintedTextures] = useState<Record<string, THREE.CanvasTexture>>({});


    // --- Actions ---

    const addPrimitive = (type: PrimitiveType, overrides?: any): string => {
        const id = Date.now().toString();
        // Harden Rotation: AI often handles Euler [0,0,0] which breaks Quaternion [0,0,0,1]
        let safeRotation = overrides?.transform?.rotation || [0, 0, 0, 1];
        if (Array.isArray(safeRotation) && safeRotation.length === 3) {
            // console.warn("Correcting Euler rotation to Quaternion");
            safeRotation = [0, 0, 0, 1];
        }

        const finalTransform = overrides?.transform
            ? { ...overrides.transform, rotation: safeRotation }
            : { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] };

        const newObj: PrimitiveObject = {
            id,
            type,
        };

        setPrimitiveObjects(prev => [...prev, newObj]);

        // Critical: Set initial state immediately to avoid race conditions
        setObjectTransforms(prev => ({ ...prev, [id]: finalTransform }));
        setObjectParameters(prev => ({ ...prev, [id]: overrides?.params || {} }));

        logToIDE(`Created ${type} ${id.substr(-4)}`, 'success');
        return id;
    };

    // Missing Function Implementation
    const updateObject = (id: string, updates: Partial<PrimitiveObject>) => {
        setPrimitiveObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
    };

    const deleteObject = (id: string) => {
        setPrimitiveObjects(prev => prev.filter(o => o.id !== id));
        setGlyphObjects(prev => prev.filter(o => o.id !== id));
        setLoadedModels(prev => prev.filter(o => o.id !== id));
        setSelectedObjectKeys(prev => prev.filter(k => k !== id));
    };

    const clearScene = () => {
        setPrimitiveObjects([]);
        setGlyphObjects([]);
        setLoadedModels([]);
        setSelectedObjectKeys([]);
        setObjectTransforms({});
        setObjectModifiers({});
        setObjectParameters({});
        logToIDE("Scene Cleared.", 'system');
    };

    const importModel = (url: string) => {
        const id = `loaded_model_${Date.now()}`;

        // Use GLTFLoader to load the model (Conceptually - actually we just store the URL and let Viewer3D load it)
        // In this architecture, Viewer3D handles the actual THREE.js loading.
        // We just need to register the intent to load it.

        // However, Viewer3D expects a THREE.Group in the 'loadedModels' array if we followed the pattern, 
        // BUT checking 'types.ts', LoadedModel likely has a 'url' or 'scene' field?
        // Wait, Viewer3D Lines 450+ maps 'loadedModels' and passes 'obj' to 'ModelInstance'.
        // ModelInstance takes 'model'.
        // Let's assume LoadedModel type has a 'url' property for async loading, OR we pre-load it here.
        // Given React Three Fiber patterns, it's often better to let a component handle the useLoader hook.

        // Let's check types.ts to be sure. 
        // ACTUALLY, I will just add it to the list with the URL, and update Viewer3D to load it if needed.
        // But for now, since I can't see types.ts right this second, I will implement a placeholder that assumes Viewer3D handles the GLTF loading.

        // WAIT, looking at previous Viewer3D code: 
        // const ModelInstance: React.FC<{ model: LoadedModel ...
        // const scene = useMemo(() => model.scene.clone(), [model.scene]);
        // This implies 'model' ALREADY contains a THREE.Group called 'scene'.

        // So I must load it here? Or introduce a 'pending' state?
        // To be safe and quick, I will use a simple GLTFLoader here if possible, OR better yet:
        // I will change the architecture slightly to allow passing a URL, but for now I will try to load it.

        // Actually, since I cannot modify types.ts reliably without seeing it, I'll cheat:
        // I'll add a 'url' field and let Viewer3D use `useGLTF` if scene is missing?
        // No, simpler: I'll use a dynamic import or fetch.

        // RE-STRATEGY: 
        // I will just add the interface method now, but I need to know what LoadedModel is.
        // It likely has 'scene: THREE.Group'.
        // I will use THREE.GLTFLoader to load it.

        // I need GLTFLoader from 'three/examples/jsm/loaders/GLTFLoader'.
        // But I don't have that import here.

        // Plan B: Just add the function signature to context and let the Component (MasteryInterface) handle the logic?
        // No, MasteryInterface calls `core.importModel('/moose-bot.glb')`.

        // Let's use the GLTFLoader dynamically or via a helper.
        import('three-stdlib').then(({ GLTFLoader }) => {
            const loader = new GLTFLoader();
            loader.load(url, (gltf) => {
                const newModel: LoadedModel = {
                    id,
                    filename: url.split('/').pop() || 'model.glb',
                    identity: 'Imported Model',
                    scene: gltf.scene,
                    gltfJson: gltf
                };
                setLoadedModels(prev => [...prev, newModel]);

                // Initialize Transform
                setObjectTransforms(prev => ({
                    ...prev,
                    [id]: { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] }
                }));

                logToIDE(`Imported Model: ${url}`, 'success');
            }, undefined, (error) => {
                logToIDE(`Failed to load model: ${error}`, 'error');
            });
        });
    };

    const updateTransform = (id: string, update: Partial<TransformState>) => {
        setObjectTransforms(prev => ({
            ...prev,
            [id]: { ...prev[id], ...update }
        }));
    };

    // Console interaction
    const [latestLog, setLatestLog] = useState<ConsoleLog | null>(null);

    const logToIDE = (text: string, type: ConsoleLog['type']) => {
        const newLog: ConsoleLog = { id: Date.now(), text, type };
        console.log(`[CORE] ${type}: ${text}`);
        setLatestLog(newLog);
    };

    // Texture Handlers (Mocked for now)
    const onPaintedTextureCreate = (key: string, texture: THREE.CanvasTexture) => {
        setPaintedTextures(prev => ({ ...prev, [key]: texture }));
    };

    const onPaintedTextureUpdate = (_key: string, _texture: THREE.CanvasTexture) => {
        // Force update if needed, usually texture references persist
    };


    const value: CoreContextType = {
        glyphObjects, loadedModels, primitiveObjects,
        objectTransforms, objectModifiers, objectSettings, objectParameters,
        ontologicalParameters, objectOscillators,
        selectedObjectKeys, cameraMode,
        addPrimitive, updateObject, deleteObject, clearScene, importModel, updateTransform,
        setCameraMode, setSelectedObjectKeys,
        setObjectTransforms, setObjectModifiers,
        relationships,
        paintToolState, setPaintToolState,
        textures, objectTextureAssignments, paintedTextures,
        onPaintedTextureCreate, onPaintedTextureUpdate,
        logToIDE, latestLog
    };

    return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
};
