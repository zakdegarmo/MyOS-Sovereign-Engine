import React, { useState, useEffect } from 'react';
import { Sliders, Activity, Anchor, Globe } from 'lucide-react';

import { useSpelljammerStore, type Formation } from '../../store/useSpelljammerStore';

// --- Types for Spelljammer Control ---
type HelmMode = 'navigation' | 'tactical' | 'comms';

export const SpelljammerHelm: React.FC = () => {
    // Connect to Global Store
    const { speed, formation, logs, setFormation, setSpeed, addLog } = useSpelljammerStore();
    // Map state to local var for UI compat if needed, or just use directly
    const state = { speed, formation, logs };

    const [commandInput, setCommandInput] = useState('');
    const [mode, setMode] = useState<HelmMode>('navigation');


    const handleCommand = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commandInput.trim()) return;
        addLog(`EXEC: ${commandInput.toUpperCase()}`);
        setCommandInput('');
        // Parser logic would go here
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 border-t-2 border-amber-600/50 shadow-[0_-4px_20px_rgba(217,119,6,0.3)] font-mono text-amber-500 overflow-hidden relative">
            {/* Background Texture - Wood Grain & Brass effect via CSS gradients? */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 100%, #d97706 0%, transparent 50%), repeating-linear-gradient(45deg, #000 0, #000 2px, #1a1a1a 2px, #1a1a1a 4px)' }}>
            </div>

            {/* Top Bar: Status */}
            <div className="flex items-center justify-between px-4 py-1 bg-slate-900 border-b border-amber-700/30 text-xs tracking-widest uppercase">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2"><Anchor size={12} /> HELM ONLINE</span>
                    <span className="text-amber-700">|</span>
                    <span className="flex items-center gap-2"><Activity size={12} /> MANA STABLE</span>
                </div>
                <div>
                    SPEED: {Math.round(state.speed * 100)}%
                </div>
            </div>

            {/* Main Deck */}
            <div className="flex-1 flex overflow-hidden p-2 gap-2 relative z-10">

                {/* Left: Terminal Output */}
                <div className="w-1/3 flex flex-col border border-amber-900/40 bg-black/60 rounded p-2">
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 mb-2 text-amber-500/80">
                        {state.logs.map((log, i) => (
                            <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">{log}</div>
                        ))}
                    </div>
                    <form onSubmit={handleCommand} className="flex gap-2 border-t border-amber-900/30 pt-2">
                        <span className="text-amber-600">{">"}</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent focus:outline-none text-amber-400 placeholder-amber-900 text-sm"
                            placeholder="Enter Command..."
                            value={commandInput}
                            onChange={e => setCommandInput(e.target.value)}
                        />
                    </form>
                </div>

                {/* Center: Formation & Action Knobs */}
                <div className="flex-1 flex flex-col items-center justify-center border border-amber-900/40 bg-slate-900/40 rounded p-4 relative">
                    <div className="absolute top-2 left-2 text-[10px] text-amber-700">FORMATION CONTROL</div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        {(['line', 'wedge', 'scatter', 'orbit'] as Formation[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFormation(f)}
                                className={`
                                    h-12 border rounded flex items-center justify-center text-sm font-bold transition-all
                                    ${state.formation === f
                                        ? 'border-amber-500 bg-amber-500/20 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                        : 'border-amber-900/50 bg-slate-950/50 text-amber-700 hover:border-amber-600 hover:text-amber-500'
                                    }
                                `}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Throttle Slider */}
                    <div className="w-full max-w-sm mt-6 flex items-center gap-4">
                        <span className="text-xs text-amber-700">HALT</span>
                        <input
                            type="range"
                            min="0" max="2" step="0.1"
                            value={state.speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                        <span className="text-xs text-amber-500 font-bold">WARP</span>
                    </div>
                </div>

                {/* Right: Modes / Toggles */}
                <div className="w-1/6 flex flex-col gap-2">
                    <button className="flex-1 border border-amber-900/40 bg-slate-950 hover:bg-amber-900/10 flex flex-col items-center justify-center gap-1 text-amber-600 hover:text-amber-400 transition-colors rounded">
                        <Globe size={18} />
                        <span className="text-[10px]">NAV</span>
                    </button>
                    <button className="flex-1 border border-amber-900/40 bg-slate-950 hover:bg-amber-900/10 flex flex-col items-center justify-center gap-1 text-amber-600 hover:text-amber-400 transition-colors rounded">
                        <Sliders size={18} />
                        <span className="text-[10px]">CONF</span>
                    </button>
                    <button
                        onClick={() => addLog("INITIATING DANCE SEQUENCE...")}
                        className="flex-1 border border-amber-600/40 bg-amber-500/10 hover:bg-amber-500/20 flex flex-col items-center justify-center gap-1 text-amber-400 hover:text-amber-200 transition-colors rounded animate-pulse"
                    >
                        <Activity size={18} />
                        <span className="text-[10px]">ENGAGE</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
