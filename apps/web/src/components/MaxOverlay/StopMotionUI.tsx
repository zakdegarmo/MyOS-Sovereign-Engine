import React, { useState } from 'react';

export const StopMotionUI = ({ id, onActionSelect }: { id: string, onActionSelect: (id: string, action: string) => void }) => {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleAction = (action: string) => {
        onActionSelect(id, action);
        setContextMenu(null);
    };

    return (
        <div onContextMenu={handleContextMenu} className="relative">
            {contextMenu && (
                <div 
                    className="fixed bg-black/90 border border-white/20 rounded-lg p-2 z-[1000] flex flex-col gap-1 min-w-[120px] backdrop-blur-xl shadow-2xl"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button onClick={() => handleAction('slash')} className="text-left px-3 py-1.5 hover:bg-white/10 rounded text-sm flex items-center gap-2">
                        <span className="text-red-400">⚔️</span> Strike (Slash)
                    </button>
                    <button onClick={() => handleAction('thrust')} className="text-left px-3 py-1.5 hover:bg-white/10 rounded text-sm flex items-center gap-2">
                        <span className="text-orange-400">🏹</span> Thrust
                    </button>
                    <button onClick={() => handleAction('spellcast')} className="text-left px-3 py-1.5 hover:bg-white/10 rounded text-sm flex items-center gap-2">
                        <span className="text-blue-400">✨</span> Spellcast
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button onClick={() => setContextMenu(null)} className="text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400 rounded text-xs">
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};
