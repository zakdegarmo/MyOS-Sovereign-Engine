import React, { useState, useEffect } from 'react';
import { MapPin, Plane, Compass } from 'lucide-react';

interface GaiaTelemetryProps {
    className?: string;
}

/**
 * ⚹.☿ Gaia Telemetry Bridge
 * ----------------------------
 * Calculates real-time position on a 6,371,000m Earth-scale globe.
 * Provides the ontological address for world persistence.
 */
export const GaiaTelemetry: React.FC<GaiaTelemetryProps> = ({ className }) => {
    const [telemetry, setTelemetry] = useState({
        lat: 90.0000,
        lon: 0.0000,
        alt: 0,
        locus: 'Primary North Pole'
    });

    const EARTH_RADIUS = 6371000;

    useEffect(() => {
        const handleUpdate = (e: any) => {
            const { x, y, z } = e.detail;
            
            // Calculate Latitude and Longitude based on Distance Traveled across the 6.37M radius
            // Formula: Angle = Distance / Radius
            const latDelta = (z / EARTH_RADIUS) * (180 / Math.PI);
            const lonDelta = (x / EARTH_RADIUS) * (180 / Math.PI);

            setTelemetry({
                lat: parseFloat((90 - latDelta).toFixed(6)),
                lon: parseFloat(lonDelta.toFixed(6)),
                alt: parseFloat(y.toFixed(2)),
                locus: y > 10 ? 'Atmospheric Ascent' : (y > 2 ? 'High Ground' : 'Sea Level')
            });
        };

        window.addEventListener('USER_POS_UPDATE', handleUpdate);
        return () => window.removeEventListener('USER_POS_UPDATE', handleUpdate);
    }, []);

    return (
        <div className={`p-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl font-mono ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Compass className="text-rose-400 animate-pulse-slow" size={16} />
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/50">Telemetric Locus</h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                         <div className="flex items-center gap-1">
                            <MapPin size={8} className="text-rose-400" />
                            <span className="text-[8px] text-white/30 uppercase tracking-widest">Latitude</span>
                        </div>
                        <span className="text-white text-xs">{telemetry.lat}°</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <MapPin size={8} className="text-cyan-400" />
                            <span className="text-[8px] text-white/30 uppercase tracking-widest">Longitude</span>
                        </div>
                        <span className="text-white text-xs">{telemetry.lon}°</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <Plane size={12} className="text-slate-500" />
                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Altitude</span>
                    </div>
                    <span className="text-rose-400 text-xs font-bold">{telemetry.alt}m</span>
                </div>

                <div className="bg-white/5 p-2 rounded border border-white/5">
                    <span className="block text-[7px] text-white/20 uppercase mb-1">Ontological Zone</span>
                    <span className="text-[10px] text-rose-300/80 italic">{telemetry.locus}</span>
                </div>
            </div>
        </div>
    );
};
