import React from 'react';
import type { InteractionConfig } from '@Omni/lib/graph-processor';

interface GraphControlsProps {
    config: InteractionConfig;
    onConfigChange: (newConfig: InteractionConfig) => void;
    visualConfig: VisualConfig;
    onVisualConfigChange: (newConfig: VisualConfig) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export interface VisualConfig {
    tubeScale: number;
    pMultiplier: number; // For future fun with Torus knots
    qMultiplier: number;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
    config,
    onConfigChange,
    visualConfig,
    onVisualConfigChange,
    isOpen,
    onToggle
}) => {
    // Helper for safe updates
    const updateLayout = (key: keyof InteractionConfig, val: number) => {
        onConfigChange({ ...config, [key]: val });
    };

    const updateVisual = (key: keyof VisualConfig, val: number) => {
        onVisualConfigChange({ ...visualConfig, [key]: val });
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="absolute bottom-4 right-4 z-50 bg-black/80 border border-cyan-500/50 text-cyan-400 p-2 rounded-lg hover:bg-cyan-900/50 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] font-mono text-xs uppercase tracking-wider backdrop-blur-md"
            >
                [ MODULATE ]
            </button>
        );
    }

    return (
        <div className="absolute bottom-4 right-4 z-50 w-80 bg-black/90 border border-cyan-500/30 rounded-lg p-4 text-cyan-100 font-mono shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <div className="flex justify-between items-center mb-4 border-b border-cyan-900/50 pb-2">
                <h3 className="text-sm font-bold text-cyan-400 tracking-widest uppercase glow-text">
                    // GEOMETRY_MODULATOR
                </h3>
                <button
                    onClick={onToggle}
                    className="text-cyan-600 hover:text-cyan-200"
                >
                    [X]
                </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {/* MACRO SCALE */}
                <div className="space-y-1">
                    <label className="text-xs text-sky-500 uppercase tracking-wide">Prism Radius (Macro)</label>
                    <input
                        type="range"
                        min="100"
                        max="1000"
                        value={config.prismRadius}
                        onChange={(e) => updateLayout('prismRadius', Number(e.target.value))}
                        className="w-full accent-cyan-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500">
                        <span>100</span>
                        <span className="text-cyan-300">{config.prismRadius}</span>
                        <span>1000</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-sky-500 uppercase tracking-wide">Prism Height</label>
                    <input
                        type="range"
                        min="50"
                        max="500"
                        value={config.prismHeight}
                        onChange={(e) => updateLayout('prismHeight', Number(e.target.value))}
                        className="w-full accent-cyan-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-right text-[10px] text-cyan-300">{config.prismHeight}</div>
                </div>

                {/* ORBITAL SYSTEMS */}
                <div className="pt-2 border-t border-cyan-900/30">
                    <div className="space-y-1 mt-2">
                        <label className="text-xs text-purple-400 uppercase tracking-wide">Factor Orbit (L1)</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={config.factorRadius}
                            onChange={(e) => updateLayout('factorRadius', Number(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-right text-[10px] text-purple-300">{config.factorRadius}</div>
                    </div>

                    <div className="space-y-1 mt-2">
                        <label className="text-xs text-purple-400 uppercase tracking-wide">Satellite Orbit (L2)</label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            value={config.componentRadius}
                            onChange={(e) => updateLayout('componentRadius', Number(e.target.value))}
                            className="w-full accent-purple-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-right text-[10px] text-purple-300">{config.componentRadius}</div>
                    </div>
                </div>

                {/* TORUS GEOMETRY */}
                <div className="pt-2 border-t border-cyan-900/30">
                    <div className="space-y-1 mt-2">
                        <label className="text-xs text-emerald-400 uppercase tracking-wide">Tube Thickness</label>
                        <input
                            type="range"
                            min="0.01"
                            max="0.5"
                            step="0.01"
                            value={visualConfig.tubeScale}
                            onChange={(e) => updateVisual('tubeScale', Number(e.target.value))}
                            className="w-full accent-emerald-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-right text-[10px] text-emerald-300">{visualConfig.tubeScale}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
