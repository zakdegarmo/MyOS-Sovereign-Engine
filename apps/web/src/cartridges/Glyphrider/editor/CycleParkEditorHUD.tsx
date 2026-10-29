// apps/web/src/cartridges/Glyphrider/editor/CycleParkEditorHUD.tsx
import React, { useState } from 'react';
import {
    Move,
    RotateCw,
    Maximize2,
    Grid,
    Trash2,
    Copy,
    Download,
    Upload,
    Play,
    Edit3,
    Undo2,
    Redo2,
    Sparkles,
    Box,
    Layers,
    Palette
} from 'lucide-react';
import {
    useCycleParkStore,
    type ObstacleType,
    type MaterialKey
} from './CycleParkStore';

const OBSTACLE_PALETTE: Array<{ type: ObstacleType; label: string; icon: string; category: string }> = [
    { type: 'kicker', label: 'Wedge Kicker', icon: '📐', category: 'Ramps' },
    { type: 'quarterpipe', label: 'Quarter-Pipe (90°)', icon: '🛹', category: 'Ramps' },
    { type: 'halfpipe', label: 'Pro Half-Pipe', icon: '🌓', category: 'Ramps' },
    { type: 'spine', label: 'Spine Transfer', icon: '⚡', category: 'Ramps' },
    { type: 'rail_straight', label: 'Straight Flat Rail', icon: '➖', category: 'Rails' },
    { type: 'rail_kinked', label: 'Kinked Outlaw Rail', icon: '〽️', category: 'Rails' },
    { type: 'funbox', label: 'Street Funbox', icon: '🏛️', category: 'Street' },
    { type: 'tire_bowl', label: 'Earthmover Tire Bowl', icon: '🛞', category: 'Street' },
    { type: 'polyhedral_cube', label: '2.5D Sprite Cube', icon: '🎲', category: 'Holograms' },
    { type: 'polyhedral_tetra', label: '2.5D Sprite Tetra', icon: '🔺', category: 'Holograms' }
];

const MATERIAL_SWATCHES: Array<{ key: MaterialKey; label: string; bg: string; border: string }> = [
    { key: 'plywood', label: 'Birch Ply', bg: 'bg-[#d4a373]', border: 'border-[#b08968]' },
    { key: 'galvanized_steel', label: 'Galvanized', bg: 'bg-[#94a3b8]', border: 'border-[#64748b]' },
    { key: 'rusty_iron', label: 'Rusty Outlaw', bg: 'bg-[#7c3a21]', border: 'border-[#5c2411]' },
    { key: 'concrete', label: 'Concrete', bg: 'bg-[#cbd5e1]', border: 'border-[#94a3b8]' },
    { key: 'neon_cyan', label: 'Neon Cyan', bg: 'bg-[#06b6d4]', border: 'border-[#0891b2]' },
    { key: 'toxic_magenta', label: 'Toxic Pink', bg: 'bg-[#ec4899]', border: 'border-[#db2777]' }
];

export const CycleParkEditorHUD: React.FC = () => {
    const {
        mode,
        toggleMode,
        transformMode,
        setTransformMode,
        snapToGrid,
        setSnapToGrid,
        gridSize,
        setGridSize,
        obstacles,
        selectedId,
        selectObstacle,
        addObstacle,
        updateObstacle,
        removeObstacle,
        duplicateObstacle,
        clearPark,
        loadPreset,
        exportManifest,
        importManifest,
        undo,
        redo
    } = useCycleParkStore();

    const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(true);
    const [agentPrompt, setAgentPrompt] = useState<string>('');
    const [agentThinking, setAgentThinking] = useState<boolean>(false);

    const selectedObstacle = obstacles.find(o => o.id === selectedId);

    // Agent layout generator using rule-based heuristics and local layout AI
    const handleRunAgentPrompt = () => {
        if (!agentPrompt.trim()) return;
        setAgentThinking(true);

        setTimeout(() => {
            const promptLower = agentPrompt.toLowerCase();
            
            if (promptLower.includes('vert') || promptLower.includes('bowl')) {
                // Spawn a vert half-pipe setup
                addObstacle('halfpipe', [0, 0, 0]);
                addObstacle('tire_bowl', [-14, 0, 0]);
                addObstacle('tire_bowl', [14, 0, 0]);
            } else if (promptLower.includes('rail') || promptLower.includes('grind')) {
                // Spawn a consecutive rail line
                addObstacle('rail_straight', [0, 0, -10]);
                addObstacle('funbox', [0, 0, 0]);
                addObstacle('rail_kinked', [0, 0, 10]);
            } else if (promptLower.includes('kicker') || promptLower.includes('jump')) {
                // Kicker transfer setup
                addObstacle('kicker', [-6, 0, -8]);
                addObstacle('kicker', [6, 0, -8]);
                addObstacle('spine', [0, 0, 6]);
            } else {
                // Hybrid skate line
                addObstacle('funbox', [0, 0, 0]);
                addObstacle('kicker', [0, 0, -12]);
                addObstacle('quarterpipe', [0, 0, 14]);
                addObstacle('polyhedral_cube', [8, 2.5, 0]);
            }

            setAgentThinking(false);
            setAgentPrompt('');
        }, 600);
    };

    const handleExportJson = () => {
        const manifest = exportManifest();
        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cycle_park_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                importManifest(json);
            } catch (err) {
                console.error("Failed to parse manifest JSON:", err);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden font-sans select-none flex flex-col justify-between p-4">
            
            {/* ===================================================================== */}
            {/* TOP BAR: STUDIO HEADER & MASTER MODE TOGGLE                           */}
            {/* ===================================================================== */}
            <header className="flex items-center justify-between w-full pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/40 text-cyan-400">
                        <Layers size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black uppercase tracking-wider text-white">CYCLE-PARK STUDIO</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                SOVEREIGN LEVEL EDITOR v2.0
                            </span>
                        </div>
                        <p className="text-[11px] font-mono text-cyan-400/70">
                            {mode === 'edit'
                                ? 'TAB: Shred Mode | G/T: Move | R: Rotate | S: Scale | Del: Delete | Ctrl+D: Clone'
                                : 'TAB: Editor Mode | WASD: Throttle/Lean | Space: Launch Jump | Arrows: In-Air 6-DOF Stunts'}
                        </p>
                    </div>
                </div>

                {/* Master Mode Switcher Button */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleMode}
                        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg ${
                            mode === 'edit'
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25 hover:brightness-110'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/25 hover:brightness-110'
                        }`}
                    >
                        {mode === 'edit' ? (
                            <>
                                <Edit3 size={16} />
                                <span>🛠️ EDIT MODE (HOTKEY: TAB)</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                <span>🛹 RIDE MODE (HOTKEY: TAB)</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* ===================================================================== */}
            {/* MIDDLE REGION: PALETTES & INSPECTOR (VISIBLE IN EDIT MODE)             */}
            {/* ===================================================================== */}
            {mode === 'edit' && (
                <div className="flex justify-between items-start w-full pointer-events-none mt-4 flex-1">
                    
                    {/* LEFT DOCK: OBJECT PALETTE */}
                    <aside className="w-64 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 pointer-events-auto flex flex-col gap-3 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                                <Box size={16} />
                                <span>Obstacle Palette</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{obstacles.length} Placed</span>
                        </div>

                        {/* Obstacle Category List */}
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin">
                            {OBSTACLE_PALETTE.map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => addObstacle(item.type, [0, 0, 0])}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-lg">{item.icon}</span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">{item.label}</span>
                                            <span className="text-[9px] font-mono text-slate-500 uppercase">{item.category}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-cyan-400/60 group-hover:text-cyan-400 font-bold">+</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* RIGHT DOCK: INSPECTOR & MATERIAL PALETTE */}
                    {selectedObstacle && (
                        <aside className="w-72 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 pointer-events-auto flex flex-col gap-4 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                    <Palette size={16} />
                                    <span>Obstacle Inspector</span>
                                </div>
                                <button
                                    onClick={() => selectObstacle(null)}
                                    className="text-[10px] text-slate-400 hover:text-white uppercase font-mono"
                                >
                                    Deselect
                                </button>
                            </div>

                            {/* Object Info */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Obstacle Name</label>
                                <input
                                    type="text"
                                    value={selectedObstacle.name}
                                    onChange={(e) => updateObstacle(selectedObstacle.id, { name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                                />
                            </div>

                            {/* Coordinate Readout */}
                            <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                                <div>
                                    <div className="text-[9px] font-mono text-slate-500 uppercase">POS X</div>
                                    <div className="text-xs font-mono font-bold text-cyan-400">{selectedObstacle.position[0].toFixed(1)}m</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-mono text-slate-500 uppercase">POS Y</div>
                                    <div className="text-xs font-mono font-bold text-cyan-400">{selectedObstacle.position[1].toFixed(1)}m</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-mono text-slate-500 uppercase">POS Z</div>
                                    <div className="text-xs font-mono font-bold text-cyan-400">{selectedObstacle.position[2].toFixed(1)}m</div>
                                </div>
                            </div>

                            {/* Material & Texture Palette */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-slate-400">Surface Material</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {MATERIAL_SWATCHES.map((swatch) => (
                                        <button
                                            key={swatch.key}
                                            onClick={() => updateObstacle(selectedObstacle.id, { materialKey: swatch.key })}
                                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                                                selectedObstacle.materialKey === swatch.key
                                                    ? 'border-cyan-400 bg-cyan-950/30'
                                                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full ${swatch.bg} border ${swatch.border} shadow-sm`} />
                                            <span className="text-[9px] font-mono font-bold text-slate-300">{swatch.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions (Clone / Delete) */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                <button
                                    onClick={() => duplicateObstacle(selectedObstacle.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl py-2 text-xs font-bold text-slate-200 transition-all"
                                >
                                    <Copy size={14} />
                                    <span>Duplicate</span>
                                </button>
                                <button
                                    onClick={() => removeObstacle(selectedObstacle.id)}
                                    className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-500/40 text-red-400 transition-all"
                                    title="Delete Obstacle (Del)"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </aside>
                    )}
                </div>
            )}

            {/* ===================================================================== */}
            {/* BOTTOM BAR: TRANSFORM CONTROLS, AGENT CO-PILOT & MANIFEST I/O          */}
            {/* ===================================================================== */}
            <footer className="flex items-center justify-between w-full pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-6 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] mt-4">
                
                {/* Transform Gizmo Controls (Move / Rotate / Scale) */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTransformMode('translate')}
                        className={`p-2 rounded-xl border transition-all ${
                            transformMode === 'translate'
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Move Gizmo (G)"
                    >
                        <Move size={18} />
                    </button>
                    <button
                        onClick={() => setTransformMode('rotate')}
                        className={`p-2 rounded-xl border transition-all ${
                            transformMode === 'rotate'
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Rotate Gizmo (R)"
                    >
                        <RotateCw size={18} />
                    </button>
                    <button
                        onClick={() => setTransformMode('scale')}
                        className={`p-2 rounded-xl border transition-all ${
                            transformMode === 'scale'
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Scale Gizmo (S)"
                    >
                        <Maximize2 size={18} />
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-1" />

                    {/* Snap to Grid */}
                    <button
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                            snapToGrid
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                    >
                        <Grid size={15} />
                        <span>SNAP: {snapToGrid ? `${gridSize}m` : 'OFF'}</span>
                    </button>

                    {/* Undo / Redo */}
                    <button
                        onClick={undo}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={redo}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 size={16} />
                    </button>
                </div>

                {/* Center: Agent Layout Co-Pilot */}
                <div className="flex items-center gap-2 flex-1 max-w-lg mx-6">
                    <div className="relative flex-1">
                        <Sparkles size={16} className="absolute left-3 top-2.5 text-cyan-400 animate-pulse" />
                        <input
                            type="text"
                            placeholder="Instruct Agent Co-Pilot (e.g. 'Build an outlaw rail line into a kicker transfer')..."
                            value={agentPrompt}
                            onChange={(e) => setAgentPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRunAgentPrompt();
                            }}
                            className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono"
                        />
                    </div>
                    <button
                        onClick={handleRunAgentPrompt}
                        disabled={agentThinking || !agentPrompt.trim()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl transition-all"
                    >
                        {agentThinking ? 'GENERATING...' : 'BUILD'}
                    </button>
                </div>

                {/* Right: Presets & JSON Export/Import */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadPreset('default')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-300"
                    >
                        Reset Preset
                    </button>

                    <button
                        onClick={handleExportJson}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-300"
                        title="Export Level Manifest (.json)"
                    >
                        <Download size={14} />
                        <span>Export</span>
                    </button>

                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-300 cursor-pointer">
                        <Upload size={14} />
                        <span>Import</span>
                        <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                    </label>

                    <button
                        onClick={clearPark}
                        className="p-2 rounded-xl bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 text-red-400"
                        title="Clear All Obstacles"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default CycleParkEditorHUD;
