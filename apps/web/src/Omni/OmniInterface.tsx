import React from 'react';
import { Globe } from 'lucide-react';

export default function OmniInterface() {
    return (
        <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="p-4 border-b border-white/20 bg-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-white" />
                    <h2 className="text-white font-bold tracking-wider">OMNI OBSERVER</h2>
                </div>
            </div>
            <div className="flex-1 p-10 flex items-center justify-center text-white/50">
                Interface Active - Module Loading...
            </div>
        </div>
    );
}
