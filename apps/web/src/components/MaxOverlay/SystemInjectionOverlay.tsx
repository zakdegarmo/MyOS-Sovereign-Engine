import React from 'react';
import { Cpu } from 'lucide-react';

interface Props {
    isActive: boolean;
}

export const SystemInjectionOverlay: React.FC<Props> = ({ isActive }) => {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden mix-blend-overlay opacity-40">
            {/* 16-bit Theatre Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            
            {/* CRT Flicker & Vignette */}
            <div className="absolute inset-0 pointer-events-none animate-crt-flicker bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            {/* Subtle Genome Status Indicator in the corner */}
            <div className="absolute bottom-10 right-10 flex items-center gap-3 text-cyan-400/60 font-mono text-xs tracking-widest uppercase">
                <Cpu size={14} className="animate-spin-slow" />
                <span>Genome Resonance: Active</span>
                <div className="w-12 h-1 bg-cyan-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 animate-pulse-width" style={{ width: '60%' }} />
                </div>
            </div>

            <style>{`
                @keyframes crt-flicker {
                    0% { opacity: 0.95; }
                    5% { opacity: 0.9; }
                    10% { opacity: 1; }
                    15% { opacity: 0.92; }
                    25% { opacity: 0.98; }
                    30% { opacity: 0.9; }
                    100% { opacity: 1; }
                }
                @keyframes pulse-width {
                    0%, 100% { width: 40%; opacity: 0.4; }
                    50% { width: 80%; opacity: 1; }
                }
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-crt-flicker {
                    animation: crt-flicker 0.1s infinite;
                }
                .animate-pulse-width {
                    animation: pulse-width 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
