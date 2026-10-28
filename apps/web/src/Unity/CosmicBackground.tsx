
import React from 'react';

export const CosmicBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 bg-black overflow-hidden pointer-events-none">
            {/* Deep Space Gradients */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-violet-600 opacity-20 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600 opacity-20 blur-[150px] animate-pulse" />
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-cyan-600 opacity-10 blur-[100px] animate-spin" style={{ animationDuration: '60s' }} />

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />

            {/* Dust Particles (Simple CSS) */}
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-50" style={{ top: '20%', left: '30%' }} />
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-30" style={{ top: '70%', left: '60%' }} />
            <div className="absolute w-1 h-1 bg-white rounded-full opacity-40" style={{ top: '40%', left: '80%' }} />
        </div>
    );
};
