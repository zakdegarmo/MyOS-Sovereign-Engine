import React, { useState } from 'react';
import { Eye, EyeOff, Image as ImageIcon, Box, Hammer, Link, Trash2, Sliders } from 'lucide-react';
import { useWorld } from '../../engine/WorldContext';
import { ObjectPalette } from './ObjectPalette';

interface EnvironmentControlsProps {
    floorTextureUrl: string;
    setFloorTextureUrl: (url: string) => void;
    isUiVisible: boolean;
    setIsUiVisible: (val: boolean) => void;
}

export const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
    floorTextureUrl,
    setFloorTextureUrl,
    isUiVisible,
    setIsUiVisible
}) => {
    const { buildingPieces, saveBuildingPiece, updateBuildingPiece, symbolicLinks, saveSymbolicLink, terrainConfig, updateTerrainConfig, population } = useWorld();
    const [activeTab, setActiveTab] = useState<'matrix' | 'architect' | 'symbolic' | 'assets'>('matrix');

    const addWall = () => {
        saveBuildingPiece({
            id: `wall_${Date.now()}`,
            type: 'wall',
            position: [0, 0.5, 0],
            rotation: [0, 0, 0],
            scale: [5, 3, 0.2],
            health: 100,
            isDestroyed: false,
            textureUrl: '/assets/lpc/Exterior Tiles.png'
        });
    };

    const addLink = (sourceId: string, targetId: string) => {
        saveSymbolicLink({
            id: `link_${Date.now()}`,
            sourceId,
            targetId,
            condition: 'on_destroyed',
            reaction: 'flee'
        });
    };

    return (
        <div className="flex flex-col gap-4 w-full bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex gap-2 border-b border-white/10 pb-2 mb-2">
                <button onClick={() => setActiveTab('matrix')} className={`px-2 py-1 text-[10px] font-mono tracking-tighter uppercase transition-colors ${activeTab === 'matrix' ? 'text-emerald-400 border-b border-emerald-400' : 'text-white/40 hover:text-white/60'}`}>Matrix</button>
                <button onClick={() => setActiveTab('architect')} className={`px-2 py-1 text-[10px] font-mono tracking-tighter uppercase transition-colors ${activeTab === 'architect' ? 'text-cyan-400 border-b border-cyan-400' : 'text-white/40 hover:text-white/60'}`}>Architect</button>
                <button onClick={() => setActiveTab('symbolic')} className={`px-2 py-1 text-[10px] font-mono tracking-tighter uppercase transition-colors ${activeTab === 'symbolic' ? 'text-magenta-400 border-b border-magenta-400' : 'text-white/40 hover:text-white/60'}`}>Symbolic</button>
                <button onClick={() => setActiveTab('assets')} className={`px-2 py-1 text-[10px] font-mono tracking-tighter uppercase transition-colors ${activeTab === 'assets' ? 'text-amber-400 border-b border-amber-400' : 'text-white/40 hover:text-white/60'}`}>Assets</button>
            </div>

            {activeTab === 'matrix' && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1">
                    <h3 className="text-[10px] uppercase tracking-widest text-emerald-500 font-mono">Environment Matrix</h3>
                    
                    {/* UI TOGGLE */}
                    <button
                        onClick={() => setIsUiVisible(!isUiVisible)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all w-full text-left
                            ${isUiVisible
                                ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-100'
                                : 'bg-white/5 border-white/10 text-white/60'}
                        `}
                    >
                        {isUiVisible ? <Eye size={18} className="text-emerald-400" /> : <EyeOff size={18} />}
                        <span className="text-xs font-mono">{isUiVisible ? 'UI Overlays Active' : 'UI Overlays Hidden'}</span>
                    </button>

                    {/* HEIGHTMAP / TERRAIN CONTROL */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-white/40 font-mono uppercase">Terrain Engine (Direct Control)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Heightmap URL..."
                                className="bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-[10px] font-mono text-white/90 outline-none flex-1"
                                onBlur={(e) => updateTerrainConfig({ heightmapUrl: e.target.value })}
                            />
                            <div className="flex items-center gap-2 bg-black/50 border border-white/20 rounded-lg px-2">
                                <Sliders size={12} className="text-white/40" />
                                <input 
                                    type="range" min="0.1" max="5" step="0.1"
                                    defaultValue={terrainConfig?.displacementScale || 1.0}
                                    onChange={(e) => updateTerrainConfig({ displacementScale: parseFloat(e.target.value) })}
                                    className="w-16 h-1 bg-white/10 appearance-none rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'architect' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
                    <h3 className="text-[10px] uppercase tracking-widest text-cyan-500 font-mono">Assembly Pipeline (Rust Style)</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={addWall} className="flex items-center justify-center gap-2 bg-cyan-900/20 border border-cyan-500/30 text-cyan-100 py-2 rounded-lg hover:bg-cyan-900/40 transition-colors">
                            <Box size={14} /> <span className="text-[10px] font-mono">ADD WALL</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 py-2 rounded-lg cursor-not-allowed">
                            <Hammer size={14} /> <span className="text-[10px] font-mono">ADD FLOOR</span>
                        </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-1 border-t border-white/5 pt-2">
                        {buildingPieces.map(piece => (
                            <div key={piece.id} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-[9px] font-mono text-white/70">{piece.id}</span>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => updateBuildingPiece(piece.id, { health: piece.health > 0 ? 0 : 100 })}
                                        className={`px-1 rounded ${piece.health > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} text-[8px] font-bold`}
                                    >
                                        {piece.health > 0 ? 'DESTROY' : 'FIX'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'symbolic' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
                    <h3 className="text-[10px] uppercase tracking-widest text-magenta-500 font-mono">Resonance Linking (Glueing)</h3>
                    
                    <p className="text-[9px] text-white/40 italic">Linking Object State to Actor Behavior</p>

                    <div className="flex flex-col gap-2">
                        {buildingPieces.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                <label className="text-[8px] text-white/30 uppercase">Active Links</label>
                                {symbolicLinks.map(link => (
                                    <div key={link.id} className="bg-magenta-900/10 border border-magenta-500/20 p-2 rounded flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-magenta-400 font-mono">{link.sourceId} ➟ {link.targetId}</span>
                                            <span className="text-[7px] text-white/30 uppercase font-mono">{link.condition}: {link.reaction}</span>
                                        </div>
                                        <Link size={10} className="text-magenta-500" />
                                    </div>
                                ))}
                                <button 
                                    onClick={() => addLink(buildingPieces[0].id, 'orchestrator')}
                                    className="mt-2 flex items-center justify-center gap-2 bg-magenta-900/20 border border-magenta-500/30 text-magenta-100 py-1 rounded text-[9px] font-mono"
                                >
                                    AUTO-LINK NEAREST
                                </button>
                            </div>
                        ) : (
                            <div className="text-[10px] text-white/20 py-4 text-center border border-dashed border-white/10 rounded-xl">
                                No objects found to link.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'assets' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
                    <h3 className="text-[10px] uppercase tracking-widest text-amber-500 font-mono">Object Palette</h3>
                    <ObjectPalette />
                </div>
            )}
        </div>
    );
};
