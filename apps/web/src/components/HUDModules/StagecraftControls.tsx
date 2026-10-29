import React from 'react';
import { Globe, Monitor, X } from 'lucide-react';
import { ENVIRONMENTS } from '../MaxOverlay/environmentRegistry';

interface EnvironmentSelectionProps {
    onClose?: () => void;
    currentDimension?: string;
    onDimensionSwap?: (dim: string) => void;
}

/**
 * EnvironmentSelection Component
 * 
 * Clean, lightweight HUD modal for selecting active dimensional environments in MyOS.
 */
export const StagecraftControls: React.FC<EnvironmentSelectionProps> = ({
    onClose,
    currentDimension,
    onDimensionSwap
}) => {
    return (
        <div className="flex flex-col gap-6 w-full text-white/90">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Globe size={20} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white">Environment Selection</h3>
                        <p className="text-[10px] text-cyan-400/60 font-mono tracking-wider">SELECT ACTIVE DIMENSIONAL REALM</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} className="text-white/40 hover:text-white" />
                    </button>
                )}
            </div>

            {/* DIMENSIONAL REALM SELECTOR */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Available Biomes & Dimensions</label>
                    {currentDimension && ENVIRONMENTS[currentDimension] && (
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                            ENVIRONMENTS[currentDimension].tier === 'production'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                            {ENVIRONMENTS[currentDimension].tier === 'production' ? '🌟 PRODUCTION READY' : '🧪 DEV / TEST SANDBOX'}
                        </span>
                    )}
                </div>
                <div className="relative">
                    <Globe size={18} className="absolute left-4 top-3.5 text-cyan-400" />
                    <select
                        value={currentDimension || ''}
                        onChange={(e) => onDimensionSwap?.(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-500/30 rounded-xl pl-12 pr-4 py-3 text-xs font-bold uppercase tracking-widest text-cyan-300 outline-none focus:border-cyan-400 appearance-none cursor-pointer hover:bg-cyan-950/20 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                    >
                        <option value="" disabled>-- Select Realm --</option>
                        
                        <optgroup label="🌟 PRODUCTION WORLDS (Demo & Gameplay Ready)" className="bg-slate-950 text-emerald-400 font-bold">
                            {Object.values(ENVIRONMENTS).filter(e => e.tier === 'production').map((env) => (
                                <option key={env.id} value={env.id} className="bg-slate-900 text-emerald-200">
                                    {env.name}
                                </option>
                            ))}
                        </optgroup>

                        <optgroup label="🧪 TEST & DEVELOPMENT SANDBOXES (Prototypes & Labs)" className="bg-slate-950 text-amber-400 font-bold">
                            {Object.values(ENVIRONMENTS).filter(e => e.tier === 'development').map((env) => (
                                <option key={env.id} value={env.id} className="bg-slate-900 text-amber-200">
                                    {env.name}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>
                {currentDimension && ENVIRONMENTS[currentDimension]?.description && (
                    <p className="text-[10px] text-cyan-400/70 font-mono italic px-1">
                        {ENVIRONMENTS[currentDimension].description}
                    </p>
                )}
            </div>
        </div>
    );
};
