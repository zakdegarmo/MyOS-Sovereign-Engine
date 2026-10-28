import React from 'react';

const SpaceBackground = () => {
    return (
        <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
            {/* Deep Space Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a1a] to-[#050510]" />

            {/* Stars Layer 1 (Small/Distant) */}
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />

            {/* Nebula Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />

            {/* Grid Overlay (Subtle) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
        </div>
    );
};

export default SpaceBackground;
