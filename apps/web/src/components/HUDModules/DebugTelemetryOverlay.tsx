import React from 'react';

interface DebugTelemetryOverlayProps {
    playerPosition: { x: number; y: number; z: number };
    worldOffset?: { x: number; y: number; z: number };
}

export const DebugTelemetryOverlay: React.FC<DebugTelemetryOverlayProps> = ({ playerPosition, worldOffset = { x: 0, y: 0, z: 0 } }) => {
    // Current World Scale configuration
    const RADIUS = 3185500; // REDUCED SCALE (Half of Earth)
    
    // Calculate "True" positions by summing local coordinates with the cumulative offset
    const trueX = playerPosition.x + worldOffset.x;
    const trueZ = playerPosition.z + worldOffset.z;

    // In the GaiaWorld, player trackPos defines the surface distance traveled.
    // X distance maps to Longitude, Z distance maps to Latitude
    const circumference = 2 * Math.PI * RADIUS;
    const degreesPerUnit = 360 / circumference;
    
    // Calculate logical Latitude and Longitude based on traveled distance
    const longitude = (trueX * degreesPerUnit) % 360;
    const latitude = (trueZ * -degreesPerUnit) % 360;
    
    const elevation = playerPosition.y;

    const locus = elevation > 10 ? 'Atmospheric Ascent' : (elevation > 2 ? 'High Ground' : 'Sea Level Substrate');

    return (
        <div className="fixed top-6 left-6 z-[10000] bg-black/80 text-green-400 font-mono text-xs p-4 rounded-xl border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] pointer-events-none min-w-[260px] backdrop-blur-sm">
            <h3 className="text-white font-bold mb-2 border-b border-white/20 pb-1 uppercase tracking-wider">Telemetry Link</h3>
            
            <div className="flex justify-between mt-2 hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                <span className="text-white/70">LOCUS:</span>
                <span className="text-rose-400 font-bold">{locus}</span>
            </div>

            <div className="flex justify-between hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                <span className="text-white/70">LATITUDE:</span>
                <span className="text-cyan-400">{latitude.toFixed(4)}°</span>
            </div>
            
            <div className="flex justify-between hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                <span className="text-white/70">LONGITUDE:</span>
                <span className="text-cyan-400">{longitude.toFixed(4)}°</span>
            </div>
            
            <div className="flex justify-between hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                <span className="text-white/70">ELEVATION:</span>
                <span className="text-amber-400">{elevation.toFixed(2)} m</span>
            </div>

            <div className="w-full h-px bg-white/20 my-2" />
            
            <div className="flex justify-between text-white/50 text-[10px]">
                <span>CARTESIAN (X,Y,Z):</span>
                <span>[{playerPosition.x.toFixed(1)}, {playerPosition.y.toFixed(1)}, {playerPosition.z.toFixed(1)}]</span>
            </div>
            
            {/* Visual Horizon Indicator placeholder */}
            <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden flex items-center relative">
               <div className="absolute left-1/2 w-0.5 h-full bg-white/50 -translate-x-1/2" />
               <div 
                 className="h-full bg-green-500 transition-all duration-75"
                 style={{ width: '4px', transform: `translateX(${50 + (longitude / 180) * 50}%)` }} 
               />
            </div>
        </div>
    );
};
