import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StandardLandingPageProps {
    icon: LucideIcon | string;
    title: string;
    mission: string;
    baseColor?: string; // Hex color for atmospheric glow
    telemetry?: {
        label: string;
        value: string | number;
        unit?: string;
        status?: 'nominal' | 'warning' | 'error';
    }[];
    children?: React.ReactNode;
}

export const StandardLandingPage: React.FC<StandardLandingPageProps> = ({ icon: Icon, title, mission, telemetry, baseColor = '#64748b', children }) => {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 overflow-hidden py-12">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-20 brightness-100 contrast-150 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml;utf8,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')" }}></div>

                {/* Dynamic Gradient Blobs */}
                <div
                    className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 transition-colors duration-1000"
                    style={{ backgroundColor: baseColor }}
                />
                <div
                    className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 transition-colors duration-1000"
                    style={{ backgroundColor: baseColor }}
                />

                {/* Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950/80" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center text-center space-y-8"
            >
                {/* Large Icon / Symbol */}
                <div className="relative group">
                    <div
                        className="absolute inset-0 opacity-20 blur-3xl rounded-full scale-150 animate-pulse transition-colors duration-1000"
                        style={{ backgroundColor: baseColor }}
                    />
                    {typeof Icon === 'string' ? (
                        <div className="text-[180px] font-serif text-slate-200/40 drop-shadow-2xl select-none leading-none">
                            {Icon}
                        </div>
                    ) : (
                        <>
                            <Icon strokeWidth={0.5} size={240} className="text-slate-200/80 drop-shadow-2xl" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icon strokeWidth={1} size={120} className="text-slate-500/50" />
                            </div>
                        </>
                    )}
                </div>

                {/* Title & Mission */}
                <div className="space-y-4 max-w-2xl px-4">
                    <h1 className="text-6xl font-display font-light tracking-tighter text-slate-200 uppercase drop-shadow-lg">
                        {title}
                    </h1>
                    <p className="text-sm font-mono text-slate-400 tracking-widest uppercase border-t border-b border-slate-700/50 py-2">
                        {mission}
                    </p>
                </div>

                {/* Telemetry Grid */}
                {telemetry && telemetry.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
                        {telemetry.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-display ${item.status === 'error' ? 'text-rose-400' :
                                            item.status === 'warning' ? 'text-amber-400' :
                                                'text-emerald-400'
                                        }`}>
                                        {item.value}
                                    </span>
                                    {item.unit && <span className="text-xs text-slate-500 font-mono">{item.unit}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Children / Custom Content (e.g. DynamicTOC) */}
                {children && (
                    <div 
                        onWheel={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="relative z-20 w-full flex flex-col items-center pointer-events-auto"
                    >
                        {children}
                    </div>
                )}
            </motion.div>
        </div>
    );
};
