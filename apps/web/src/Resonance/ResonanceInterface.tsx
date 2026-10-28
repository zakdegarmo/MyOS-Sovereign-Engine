import React from 'react';
import { Wifi } from 'lucide-react';

export default function ResonanceInterface() {
    return (
        <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm rounded-lg border border-pink-500/20">
            <div className="p-4 border-b border-pink-500/20 bg-pink-950/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-pink-400" />
                    <h2 className="text-pink-400 font-bold tracking-wider">RESONANCE CHAMBER</h2>
                </div>
            </div>
            <div className="flex-1 p-10 flex items-center justify-center text-pink-500/50">
                Interface Active - Module Loading...
            </div>
        </div>
    );
}
