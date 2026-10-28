import React from 'react';
import { Activity } from 'lucide-react';

export default function UnityInterface() {
    return (
        <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm rounded-lg border border-green-500/20">
            <div className="p-4 border-b border-green-500/20 bg-green-950/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <h2 className="text-green-400 font-bold tracking-wider">UNITY DASHBOARD</h2>
                </div>
            </div>
            <div className="flex-1 p-10 flex items-center justify-center text-green-500/50">
                Interface Active - Module Loading...
            </div>
        </div>
    );
}
