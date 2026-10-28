import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Network, Shield, Zap, Skull, Box, Code, LogOut 
} from 'lucide-react';
import { generateDomainMap, type DomainMap, type NodeType } from '../../engine/DomainGenerator';
import { generateCharacterSheet } from '../../engine/CharacterGenerator';
import { NPCSpritePortrait } from '../Avatars/NPCSpritePortrait';

const ICON_MAP: Record<NodeType, React.ReactNode> = {
    entrance: <LogOut size={16} className="text-cyan-400" />,
    combat: <Shield size={16} className="text-red-400" />,
    loot: <Box size={16} className="text-amber-400" />,
    event: <Code size={16} className="text-fuchsia-400" />,
    boss: <Skull size={20} className="text-purple-500" />,
    exit: <Zap size={16} className="text-green-400" />
};

export const DomainNavigator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [domainMap, setDomainMap] = useState<DomainMap | null>(null);
    const [currentNode, setCurrentNode] = useState<string | null>(null);
    const [clearedNodes, setClearedNodes] = useState<Set<string>>(new Set());
    
    // Panning state for the SVG map
    const [pan, setPan] = useState({ x: 50, y: 300 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Generate a random domain map for this run
        const map = generateDomainMap(`vpn_tunnel_${Date.now()}`, 1);
        setDomainMap(map);
        setCurrentNode(map.startNodeId);
        setClearedNodes(new Set([map.startNodeId]));
    }, []);

    if (!domainMap) return null;

    const handleNodeClick = (id: string, isAccessible: boolean) => {
        if (!isAccessible) return;
        setCurrentNode(id);
        
        // Mocking completion immediately for now, in a real game this awaits victory/resolution
        setClearedNodes(prev => new Set(prev).add(id));
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        setPan(p => ({
            x: p.x + (e.clientX - lastMouse.current.x),
            y: p.y + (e.clientY - lastMouse.current.y)
        }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
        isDragging.current = false;
    };

    const nodes = Object.values(domainMap.nodes);
    
    // Render lines for edges
    const edges: React.ReactNode[] = [];
    const drawnEdges = new Set<string>();
    
    nodes.forEach(n => {
        n.connections.forEach(connId => {
            const edgeId = [n.id, connId].sort().join('-');
            if (drawnEdges.has(edgeId)) return;
            drawnEdges.add(edgeId);

            const target = domainMap.nodes[connId];
            if (!target) return;

            const isRouteActive = clearedNodes.has(n.id) || clearedNodes.has(connId) || currentNode === n.id || currentNode === connId;

            edges.push(
                <line 
                    key={edgeId} 
                    x1={n.x} y1={n.y} 
                    x2={target.x} y2={target.y}
                    stroke={isRouteActive ? 'rgba(34, 211, 238, 0.5)' : 'rgba(255, 255, 255, 0.1)'} 
                    strokeWidth={isRouteActive ? 3 : 1}
                    strokeDasharray={isRouteActive ? "none" : "5,5"}
                />
            );
        });
    });

    const activeNodeData = currentNode ? domainMap.nodes[currentNode] : null;

    return (
        <div className="flex w-[800px] h-[600px] bg-black/90 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.2)]">
            
            {/* Map Area */}
            <div 
                className="flex-[2] relative overflow-hidden bg-[url('/textures/bg_grid.png')] bg-repeat cursor-grab active:cursor-grabbing border-r border-white/10"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Header */}
                <div className="absolute top-4 left-4 z-10 bg-black/60 border border-white/10 rounded-xl px-4 py-2 backdrop-blur pointer-events-none">
                    <h3 className="text-cyan-400 font-black tracking-widest text-sm uppercase flex items-center gap-2">
                        <Network size={16} />
                        VPN TUNNEL ACTIVE
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">THEME: {domainMap.theme}</p>
                </div>

                {/* SVG Graph rendering */}
                <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <svg className="absolute inset-0 overflow-visible" style={{ pointerEvents: 'none' }}>
                        {edges}
                    </svg>

                    {nodes.map(n => {
                        const isCleared = clearedNodes.has(n.id);
                        const isCurrent = currentNode === n.id;
                        // Accessible if it's connected to ANY cleared node
                        const isAccessible = n.connections.some(c => clearedNodes.has(c)) || isCleared;
                        
                        // FOG OF WAR: Obscure distant nodes
                        const isVisible = isAccessible || isCleared || n.type === 'boss'; // Boss is always visible as a goal

                        if (!isVisible) {
                            return (
                                <div
                                    key={n.id}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/10 border border-white/20 z-0"
                                    style={{ left: n.x, top: n.y }}
                                />
                            );
                        }

                        return (
                            <button
                                key={n.id}
                                onClick={() => handleNodeClick(n.id, isAccessible)}
                                className={`
                                    absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center p-2 transition-all 
                                    pointer-events-auto shadow-xl
                                    ${isCurrent ? 'bg-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.5)] scale-125 border-2 border-cyan-400 z-20' : ''}
                                    ${isCleared && !isCurrent ? 'bg-green-500/10 border border-green-500/50 scale-100 z-10' : ''}
                                    ${isAccessible && !isCleared && !isCurrent ? 'bg-white/10 border border-white/40 hover:scale-110 hover:bg-white/20 z-10 animate-pulse' : ''}
                                `}
                                style={{ left: n.x, top: n.y }}
                            >
                                {ICON_MAP[n.type]}
                                <div className={`absolute top-[120%] text-[8px] font-black uppercase tracking-widest whitespace-nowrap px-1 py-0.5 rounded bg-black/80
                                    ${isCurrent ? 'text-cyan-400 border border-cyan-500/50' : 'text-slate-400 border border-transparent'}
                                `}>
                                    {n.type}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Context / Encounter Nested Panel */}
            <div className="flex-1 bg-slate-900/80 flex flex-col relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20">
                    <X size={20} />
                </button>
                
                <AnimatePresence mode="wait">
                    {activeNodeData ? (
                        <motion.div 
                            key={activeNodeData.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col p-6 overflow-y-auto"
                        >
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <div className="p-3 bg-black/40 rounded-xl border border-white/10 shadow-inner">
                                    {ICON_MAP[activeNodeData.type]}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{activeNodeData.name}</h4>
                                    <span className="text-[10px] text-cyan-500 font-mono tracking-wider">NODE STATUS: {clearedNodes.has(activeNodeData.id) ? 'SECURED' : 'UNRESOLVED'}</span>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-300 leading-relaxed font-mono bg-black/30 p-4 rounded-xl border border-white/5 mb-6">
                                {activeNodeData.description}
                            </p>

                            {/* Dynamic Content area based on Node Type (Nested UI Panels) */}
                            <div className="flex-1 flex flex-col gap-4">
                                {(() => {
                                    const sheet = activeNodeData.assignedNpcId 
                                        ? generateCharacterSheet(activeNodeData.assignedNpcId) 
                                        : null;
                                    
                                    return (
                                        <>
                                {activeNodeData.type === 'entrance' && (
                                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center mt-auto">
                                        <LogOut size={32} className="mx-auto text-cyan-400 mb-2" />
                                        <h5 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-1">Insertion Point</h5>
                                        <p className="text-[9px] text-slate-400 font-mono mb-4">You have entered the data stream. Proceed forward.</p>
                                    </div>
                                )}

                                {activeNodeData.type === 'combat' && !clearedNodes.has(activeNodeData.id) && sheet && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center flex flex-col gap-4">
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 text-left">
                                            <NPCSpritePortrait slug={sheet.id} size={96} spriteTags={sheet.spriteTags} />
                                            <div>
                                                <h5 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-1">{sheet.name} <span className="text-white/30 text-[10px] ml-2 font-mono">Lvl {sheet.level} {sheet.charClass}</span></h5>
                                                <p className="text-[10px] text-slate-300 font-mono italic mb-2">"{sheet.motivation}"</p>
                                                <div className="flex gap-4 text-[10px] text-white/50 mb-1">
                                                    <span>HP: <strong className="text-green-400">{sheet.hp}</strong></span>
                                                    <span>AC: <strong className="text-blue-400">{sheet.ac}</strong></span>
                                                    <span>Race: <strong>{sheet.race}</strong></span>
                                                </div>
                                                <p className="text-[9px] text-red-300/60 leading-tight">KNOWN INTEL: {sheet.appearance}. Suspected occupation: {sheet.occupation}.</p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setClearedNodes(p => new Set(p).add(activeNodeData.id))}
                                            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg w-full transition-colors mt-auto"
                                        >
                                            Engage Hostile Entity
                                        </button>
                                    </div>
                                )}

                                {activeNodeData.type === 'loot' && !clearedNodes.has(activeNodeData.id) && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center mt-auto">
                                        <Box size={32} className="mx-auto text-amber-400 mb-2 animate-bounce flex-shrink-0" />
                                        <h5 className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">Encrypted Cache</h5>
                                        <p className="text-[9px] text-slate-400 font-mono mb-4">Valuable data artifacts detected within.</p>
                                        <button 
                                            onClick={() => setClearedNodes(p => new Set(p).add(activeNodeData.id))}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg w-full transition-colors"
                                        >
                                            Decrypt Artifact
                                        </button>
                                    </div>
                                )}

                                {activeNodeData.type === 'event' && !clearedNodes.has(activeNodeData.id) && (
                                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl p-4 text-center mt-auto">
                                        <Code size={32} className="mx-auto text-fuchsia-400 mb-2 flex-shrink-0 animate-spin-slow" />
                                        <h5 className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest mb-1">Anomalous Signal</h5>
                                        <p className="text-[9px] text-slate-400 font-mono mb-4">Unknown variable encountered. Interaction requires decision.</p>
                                        <button 
                                            onClick={() => setClearedNodes(p => new Set(p).add(activeNodeData.id))}
                                            className="px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg w-full transition-colors shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                                        >
                                            Process Anomalous Signal
                                        </button>
                                    </div>
                                )}

                                {activeNodeData.type === 'boss' && !clearedNodes.has(activeNodeData.id) && sheet && (
                                    <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-xl p-4 text-center mt-auto shadow-[inset_0_0_20px_rgba(168,85,247,0.2)] flex flex-col gap-4">
                                        <div className="flex items-center gap-4 bg-black/60 p-4 rounded-xl border border-purple-500/30 text-left">
                                            <NPCSpritePortrait slug={sheet.id} size={120} spriteTags={sheet.spriteTags} />
                                            <div>
                                                <h5 className="text-white font-black uppercase tracking-widest text-lg mb-1">{sheet.name} <span className="text-purple-400 text-[10px] ml-2 font-mono">APEX {sheet.charClass}</span></h5>
                                                <p className="text-[10px] text-purple-200 font-mono italic mb-2 tracking-wide">"{sheet.secret}"</p>
                                                <div className="flex gap-4 text-[10px] text-white/50 mb-2 p-2 bg-purple-900/30 rounded border border-purple-500/20">
                                                    <span>HP: <strong className="text-green-400">{sheet.hp * 5}</strong></span>
                                                    <span>AC: <strong className="text-blue-400">{sheet.ac + 3}</strong></span>
                                                    <span>STR: <strong className="text-red-400">{sheet.stats.str}</strong></span>
                                                </div>
                                                <p className="text-[9px] text-purple-300/60 leading-tight">THREAT PROFILE: {sheet.appearance}. Driven to {sheet.motivation}.</p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setClearedNodes(p => new Set(p).add(activeNodeData.id))}
                                            className="px-4 py-3 bg-purple-600 hover:bg-purple-500 border border-purple-400 text-white font-black text-[12px] uppercase tracking-widest rounded-lg w-full transition-all shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                                        >
                                            Terminate Apex Node
                                        </button>
                                    </div>
                                )}
                                
                                {activeNodeData.type === 'exit' && (
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center mt-auto">
                                        <LogOut size={32} className="mx-auto text-green-400 mb-2 flex-shrink-0" />
                                        <h5 className="text-[10px] font-black uppercase text-green-400 tracking-widest mb-1">Extraction Protocol</h5>
                                        <p className="text-[9px] text-slate-400 font-mono mb-4">Payload secured. Ready to return to the Hub.</p>
                                        <button 
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent('myos_domain_extraction', { detail: { domainId: domainMap.id, theme: domainMap.theme } }));
                                                onClose();
                                            }}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg w-full transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                        >
                                            Initiate Jack Out
                                        </button>
                                    </div>
                                )}
                                
                                {clearedNodes.has(activeNodeData.id) && activeNodeData.type !== 'exit' && activeNodeData.type !== 'entrance' && (
                                    <div className="flex items-center justify-center p-8 text-[10px] font-mono text-cyan-500 border-2 border-dashed border-cyan-500/20 rounded-xl mt-4 bg-cyan-900/10 backdrop-blur">
                                        NODE SECURED.
                                        <br/>UPLINK STABLE. PROCEED.
                                    </div>
                                )}
                                        </>
                                    );
                                })()}
                            </div>

                        </motion.div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-[10px] font-mono text-slate-500 p-8 text-center uppercase tracking-widest">
                            Select a node from the Matrix topology to interface.
                        </div>
                    )}
                </AnimatePresence>
            </div>
            
        </div>
    );
};
