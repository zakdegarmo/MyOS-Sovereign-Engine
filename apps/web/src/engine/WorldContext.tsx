import React, { createContext, useContext, useState, useMemo } from 'react';
import { INITIAL_WORLD_STATE } from './WorldState';
import { DaemonOrchestrator } from '../sys/DaemonOrchestrator';
import type { ValidationResult } from '../sys/Crucible';
import type { StickyNote } from '../sys/Daemon';
import type { WorldState } from './WorldState';

interface WorldContextType extends WorldState {
    setEnvironment: (env: 'hub' | 'vpn') => void;
    swapDimension: (dimId: string) => void;
    startMission: (missionId: string, startNodeId: string) => void;
    advanceNode: (nodeId: string) => void;
    endMission: () => void;
    saveProp: (prop: any) => void;
    saveBuildingPiece: (piece: any) => void;
    updateBuildingPiece: (id: string, piece: any) => void;
    saveSymbolicLink: (link: any) => void;
    updateTerrainConfig: (config: Partial<Exclude<WorldState["terrainConfig"], undefined>>) => void;
    stashPosition: (pos: [number, number, number], dim: string) => void;
    depositWorth: (result: any) => void;
    addConcept: (title: string, description: string) => void;
    runTestEvaluation: () => Promise<void>;
    whistle: () => void;
    toggleMount: () => void;
    setHorsePosition: (pos: [number, number, number]) => void;
}

const WorldContext = createContext<WorldContextType | null>(null);

export const WorldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<WorldState>(() => {
        const saved = localStorage.getItem('MYOS_WORLD_SAVE');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with INITIAL_WORLD_STATE to ensure new fields like sessionData exist
                return { ...INITIAL_WORLD_STATE, ...parsed, 
                    sessionData: { ...INITIAL_WORLD_STATE.sessionData, ...(parsed.sessionData || {}) },
                    mountState: { ...INITIAL_WORLD_STATE.mountState, ...(parsed.mountState || {}) }
                };
            } catch (e) {
                console.error("Failed to parse world save:", e);
                return INITIAL_WORLD_STATE;
            }
        }
        return INITIAL_WORLD_STATE;
    });

    React.useEffect(() => {
        localStorage.setItem('MYOS_WORLD_SAVE', JSON.stringify(state));
    }, [state]);

    React.useEffect(() => {
        const handleSwapEvent = (e: any) => {
            if (e.detail) swapDimension(e.detail);
        };
        window.addEventListener('myos_swap_dimension', handleSwapEvent);
        return () => window.removeEventListener('myos_swap_dimension', handleSwapEvent);
    }, []);

    const setEnvironment = (currentEnvironment: 'hub' | 'vpn') => {
        setState(prev => ({ ...prev, currentEnvironment }));
    };

    const swapDimension = (currentDimension: string) => {
        setState(prev => ({ 
            ...prev, 
            currentDimension,
            // If we are entering the Hub, we might want to ensure some defaults
            currentEnvironment: (currentDimension === 'glitching_window' || currentDimension === 'hub') ? 'hub' : 'vpn'
        }));
    };

    const startMission = (activeMissionId: string, activeNodeId: string) => {
        setState(prev => ({
            ...prev,
            currentEnvironment: 'vpn',
            activeMissionId,
            activeNodeId
        }));
    };

    const advanceNode = (activeNodeId: string) => {
        setState(prev => ({ ...prev, activeNodeId }));
    };

    const endMission = () => {
        setState(prev => ({
            ...prev,
            currentEnvironment: 'hub',
            activeMissionId: undefined,
            activeNodeId: undefined
        }));
    };

    const updateTerrainConfig = (config: Partial<Exclude<WorldState["terrainConfig"], undefined>>) => {
        setState(prev => ({
            ...prev,
            terrainConfig: {
                seed: 42,
                complexity: 0.012,
                heightScale: 12.0,
                octaves: 3,
                ...(prev.terrainConfig || {}),
                ...config
            }
        }));
    };

    const saveProp = (prop: any) => {
        setState(prev => ({
            ...prev,
            population: { ...prev.population, mephits: [...(prev.population?.mephits || []), prop] }
        }));
    };

    const saveBuildingPiece = (piece: any) => {
        setState(prev => ({
            ...prev,
            buildingPieces: [...(prev.buildingPieces || []), piece]
        }));
    };

    const updateBuildingPiece = (id: string, piece: any) => {
        setState(prev => ({
            ...prev,
            buildingPieces: (prev.buildingPieces || []).map(p => p.id === id ? { ...p, ...piece } : p)
        }));
    };

    const saveSymbolicLink = (link: any) => {
        setState(prev => ({
            ...prev,
            symbolicLinks: [...(prev.symbolicLinks || []), link]
        }));
    };

    const stashPosition = (stashedPosition: [number, number, number], stashedDimension: string) => {
        setState(prev => ({ ...prev, stashedPosition, stashedDimension }));
    };

    const depositWorth = (result: any) => {
        if (!result.minted) return;
        
        setState(prev => {
            const newCoins = { ...prev.ontoWallet.coins };
            Object.entries(result.minted.coins).forEach(([symbol, value]) => {
                newCoins[symbol] = (newCoins[symbol] || 0) + (value as number);
            });

            return {
                ...prev,
                ontoWallet: {
                    total: prev.ontoWallet.total + result.minted.omni,
                    coins: newCoins
                }
            };
        });
    };

    const addConcept = (title: string, description: string) => {
        setState(prev => ({
            ...prev,
            sessionData: {
                ...prev.sessionData,
                concepts: [...prev.sessionData.concepts, { title, description }]
            }
        }));
    };

    /**
     * Simulation trigger: Runs a mock Crucible evaluation and deposits worth.
     */
    const runTestEvaluation = async () => {
        const testNote: StickyNote = {
            id: `manual-${Date.now()}`,
            name: "Manual Albedo Cycle",
            content: "Purifying sector 7G",
            proposedChanges: "Optimize ram",
            metadata: {
                daemonType: 'Optimization',
                complexity: 42,
                duration: 120
            }
        };
        await DaemonOrchestrator.getInstance().processProposal(testNote);
    };

    const whistle = () => {
        setState(prev => ({
            ...prev,
            mountState: {
                ...prev.mountState,
                isHorseSummoned: true,
                horseType: Math.floor(Math.random() * 5) + 1 // 1-5
            }
        }));
    };
    
    const toggleMount = () => {
        setState(prev => ({
            ...prev,
            mountState: {
                ...prev.mountState,
                isMounted: !prev.mountState.isMounted
            }
        }));
    };

    const setHorsePosition = (horsePosition: [number, number, number]) => {
        setState(prev => ({
            ...prev,
            mountState: {
                ...prev.mountState,
                horsePosition
            }
        }));
    };

    React.useEffect(() => {
        DaemonOrchestrator.getInstance().initialize(depositWorth, addConcept);
    }, []);

    const value = useMemo(() => ({
        ...state,
        setEnvironment,
        swapDimension,
        startMission,
        advanceNode,
        endMission,
        saveProp,
        saveBuildingPiece,
        updateBuildingPiece,
        saveSymbolicLink,
        updateTerrainConfig,
        stashPosition,
        depositWorth,
        addConcept,
        runTestEvaluation,
        whistle,
        toggleMount,
        setHorsePosition
    }), [state]);

    return (
        <WorldContext.Provider value={value}>
            {children}
        </WorldContext.Provider>
    );
};

export const useWorld = () => {
    const context = useContext(WorldContext);
    if (!context) {
        throw new Error("useWorld must be used within a WorldProvider");
    }
    return context;
};
