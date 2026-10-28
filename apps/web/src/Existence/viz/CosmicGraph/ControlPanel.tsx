import React, { useState } from 'react';
import type { ViewMode, LayoutMode, GraphNode } from './types';
import {
    Box, Layers, Code, FileText, RefreshCw, Search,
    Zap, Shield, Clock, Users, Share2, AlignJustify,
    Hexagon, TrendingUp, Infinity, Move, Weight, Rotate3D, Undo2,
    HelpCircle, Orbit, GitBranch, Globe
} from 'lucide-react';
import { TYPE_COLORS, DIRECTORY_COLORS, AUTHOR_COLORS } from './constants';

interface ControlPanelProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    layoutMode: LayoutMode;
    setLayoutMode: (mode: LayoutMode) => void;
    spacing: number;
    setSpacing: (val: number) => void;
    rotation: { x: number; y: number; z: number };
    setRotation: (val: { x: number; y: number; z: number }) => void;
    maxDepth: number;
    setMaxDepth: (val: number) => void;
    onGenerate: () => void;
    selectedNode: GraphNode | null;
    nodeCount: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    viewMode,
    setViewMode,
    layoutMode,
    setLayoutMode,
    spacing,
    setSpacing,
    rotation,
    setRotation,
    maxDepth,
    setMaxDepth,
    onGenerate,
    selectedNode,
    nodeCount
}) => {
    const [showTutorial, setShowTutorial] = useState<string | null>(null);

    const handleHelpClick = (e: React.MouseEvent, topic: string) => {
        if (e.ctrlKey) {
            e.preventDefault();
            setShowTutorial(topic);
        }
    };

    const renderModeBtn = (mode: ViewMode, label: string, Icon: React.ElementType, colorClass: string, desc: string) => {
        const isActive = viewMode === mode;
        return (
            <button
                onClick={() => setViewMode(mode)}
                title={`${desc} (Ctrl+Click header for help)`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${isActive
                    ? `bg-opacity-20 border-opacity-50 ${colorClass.replace('text-', 'bg-').replace('text-', 'border-')}`
                    : 'bg-slate-800/50 hover:bg-slate-800 border-transparent text-slate-400 hover:text-slate-200'
                    } ${isActive ? colorClass : ''}`}
            >
                <Icon size={12} /> {label}
            </button>
        );
    };

    const renderLayoutBtn = (mode: LayoutMode, label: string, Icon: React.ElementType) => {
        const isActive = layoutMode === mode;
        return (
            <button
                onClick={() => setLayoutMode(mode)}
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all min-w-[80px] ${isActive
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
            >
                <Icon size={20} className="mb-2" />
                <span className="text-[10px] font-bold uppercase text-center">{label}</span>
            </button>
        )
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const updateRotation = (axis: 'x' | 'y' | 'z', value: number) => {
        const rad = (value * Math.PI) / 180;
        setRotation({ ...rotation, [axis]: rad });
    };

    const toDeg = (rad: number) => Math.round((rad * 180) / Math.PI);

    const renderLegend = () => {
        // Basic Legend Placeholder
        return null;
    };

    return (
        <>
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-4 w-96 max-h-[calc(100vh-2rem)] pointer-events-none">
                <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl overflow-y-auto custom-scrollbar flex flex-col">

                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4 shrink-0">
                        <Box className="w-6 h-6 text-cyan-400" />
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                                BioLogic Graph
                            </h1>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter">
                                RELATION ENGINE V1.0
                            </p>
                        </div>
                    </div>

                    <div className="mb-4 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                <Hexagon size={14} className="text-indigo-400" />
                                SPATIAL ARRANGEMENT
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4 flex-wrap">
                            {renderLayoutBtn('force', 'Gravity', Share2)}
                            {renderLayoutBtn('timeTunnel', 'Tunnel', Infinity)}
                            {renderLayoutBtn('deweySlope', 'Dewey', TrendingUp)}
                        </div>

                        <div className="space-y-2">
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <Move size={10} /> Metric Expansion
                                    </span>
                                    <span className="text-[10px] font-mono text-cyan-400">{spacing.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="3.0" step="0.1"
                                    value={spacing}
                                    onChange={(e) => setSpacing(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 shrink-0">
                        <div>
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1 border-l-2 border-cyan-500">
                                Structural Analysis
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {renderModeBtn('fileType', 'Types', FileText, 'text-cyan-400', 'File Types')}
                                {renderModeBtn('pillar', 'Pillars', Globe, 'text-teal-400', 'Ontological Pillars')}
                                {renderModeBtn('directory', 'Hierarchy', Layers, 'text-emerald-400', 'Folder Structure')}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 pl-1 border-l-2 border-purple-500">
                                Esoteric Metrics
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {renderModeBtn('complexity', 'Mass (Cplx)', Weight, 'text-purple-400', 'Complexity')}
                                {renderModeBtn('size', 'Volume (Size)', AlignJustify, 'text-blue-400', 'File Size')}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700 shrink-0">
                        <button
                            onClick={onGenerate}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border border-slate-600 shadow-lg"
                        >
                            <RefreshCw size={14} /> Refresh Matrix
                        </button>
                    </div>
                </div>
            </div>

            {selectedNode && (
                <div className="absolute top-4 right-4 z-20 w-80 pointer-events-auto animate-fade-in-up">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-600 shadow-2xl overflow-hidden">
                        <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex justify-between items-center">
                            <span className="text-xs font-mono text-cyan-400">{selectedNode.type?.toUpperCase()}</span>
                            <Code size={16} className="text-slate-400" />
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-white break-all mb-1">{selectedNode.name}</h3>
                            <p className="text-xs text-slate-400 font-mono mb-4">{selectedNode.path}</p>
                            <p className="text-xs text-emerald-400 font-bold mb-4">{selectedNode.pillar}</p>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-500 uppercase">Volume (Size)</div>
                                    <div className="text-lg font-mono text-white">{formatBytes(selectedNode.fileSize)}</div>
                                </div>
                                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-500 uppercase">Mass (Cplx)</div>
                                    <div className={`text-lg font-mono ${selectedNode.complexity > 5 ? 'text-red-400' : 'text-green-400'}`}>
                                        {selectedNode.complexity}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ControlPanel;
