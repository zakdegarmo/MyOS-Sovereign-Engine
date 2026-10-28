import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Map as MapIcon, Shield, Zap, 
    Ghost, Target, Info,
    ChevronLeft, Play, Lock,
    AlertTriangle, Users
} from 'lucide-react';
import { useStoryteller } from '../../hooks/useStoryteller';

export const MissionMapView: React.FC<{ 
    missionId: string, 
    onClose: () => void,
    onDeploy?: (nodeId: string) => void
}> = ({ missionId, onClose, onDeploy }) => {
    const { missions, deployMission } = useStoryteller();
    const mission = missions.find(m => m.id === missionId);
    
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(mission?.nodes[0]?.id || null);
    const selectedNode = mission?.nodes.find(n => n.id === selectedNodeId);

    if (!mission) {
        return (
            <div className="w-[800px] h-[600px] bg-slate-950 border border-rose-500/20 rounded-[40px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-rose-500/50">
                    <AlertTriangle size={48} />
                    <p className="font-mono text-xs uppercase tracking-widest">Mission Data Corrupted or Missing</p>
                    <button onClick={onClose} className="px-4 py-2 border border-rose-500/30 rounded-full hover:bg-rose-500/10 transition-all text-[10px] font-bold">
                        RETURN TO BBS
                    </button>
                </div>
            </div>
        );
    }

    const handleDeployNode = () => {
        if (selectedNode) {
            deployMission(missionId, selectedNode.id);
            if (onDeploy) onDeploy(selectedNode.id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-[800px] h-[600px] bg-slate-950/95 border border-cyan-500/20 rounded-[40px] shadow-2xl overflow-hidden flex flex-col backdrop-blur-3xl pointer-events-auto"
        >
            {/* TACTICAL HEADER */}
            <div className="px-8 py-6 bg-gradient-to-b from-cyan-500/10 to-transparent border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
                        <MapIcon className="text-cyan-400" size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-[0.3em]">{mission.title}</h2>
                        <p className="text-[10px] text-cyan-500/40 font-mono">SECTOR_TAC_MAP // {mission.id}_SIG/0.9</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                    <ChevronLeft size={24} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* THE MAP CANVAS */}
                <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.05)_0%,_transparent_70%)] overflow-hidden p-10">
                    {/* SVG Connections Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                        {mission.nodes.map(node => node.connections.map(targetId => {
                            const target = mission.nodes.find(n => n.id === targetId);
                            if (!target) return null;
                            return (
                                <line
                                    key={`${node.id}-${targetId}`}
                                    x1={node.position.x}
                                    y1={node.position.y}
                                    x2={target.position.x}
                                    y2={target.position.y}
                                    stroke="#22d3ee"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                />
                            );
                        }))}
                    </svg>

                    {/* Nodes Layer */}
                    {mission.nodes.map(node => {
                        const isSelected = selectedNodeId === node.id;
                        return (
                            <button
                                key={node.id}
                                onClick={() => setSelectedNodeId(node.id)}
                                style={{ left: node.position.x, top: node.position.y }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border
                                    ${isSelected ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] border-white/50 scale-110' : 'bg-slate-900 border-white/10 hover:border-cyan-500/50 hover:bg-slate-800'}
                                `}>
                                    {node.type === 'TUNNEL' && <Zap size={20} className={isSelected ? 'text-black' : 'text-cyan-500'} />}
                                    {node.type === 'BOSS' && <Ghost size={24} className={isSelected ? 'text-black' : 'text-rose-500'} />}
                                    {node.type === 'REWARD' && <Target size={20} className={isSelected ? 'text-black' : 'text-amber-500'} />}
                                    {node.type === 'LOCKED' && <Lock size={20} className="text-slate-700" />}

                                    {/* Occupied Mini-Markers */}
                                    {node.occupiedBy && node.occupiedBy.length > 0 && (
                                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                                            {node.occupiedBy.map((p, i) => (
                                                <div key={i} className={`w-3 h-3 rounded-full border border-black shadow-lg
                                                    ${p === 'User' ? 'bg-emerald-500' : 'bg-blue-500'}
                                                `} title={p} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-widest transition-opacity
                                    ${isSelected ? 'text-cyan-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'}
                                `}>
                                    {node.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* NODE INFO PANEL */}
                <div className="w-[280px] bg-black/40 border-l border-white/5 p-8 flex flex-col gap-6">
                    {selectedNode ? (
                        <>
                            <div className="space-y-1">
                                <p className="text-[10px] text-cyan-500/40 font-mono tracking-widest uppercase">Node Selection</p>
                                <h3 className="text-xl font-bold text-white tracking-widest leading-tight">{selectedNode.label}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-tighter uppercase
                                        ${selectedNode.type === 'BOSS' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}
                                    `}>
                                        {selectedNode.type}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">Pillar: {selectedNode.pillar}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-slate-500">DIFFICULTY_INDEX</span>
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className={`w-2 h-2 rounded-sm ${i < selectedNode.difficulty / 2 ? 'bg-cyan-500' : 'bg-white/5'}`} />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-cyan-400">
                                        <Users size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Presence</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedNode.occupiedBy && selectedNode.occupiedBy.length > 0 ? (
                                            selectedNode.occupiedBy.map((p, i) => (
                                                <span key={i} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-[9px] font-mono text-cyan-200">
                                                    {p}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[9px] font-mono text-slate-500 italic">No signatures detected.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDeployNode}
                                className="mt-auto h-14 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                            >
                                <Play size={20} fill="black" />
                                Deploy Party
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-700 opacity-20">
                            <Target size={64} strokeWidth={1} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Select_Node</span>
                        </div>
                    )}
                </div>
            </div>

            {/* SCANLINE OVERLAY */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </motion.div>
    );
};
