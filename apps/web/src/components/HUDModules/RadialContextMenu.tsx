import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '../../stores/useEditorStore';
import { Trash2, Move, Scaling, Sun } from 'lucide-react';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';

export const RadialContextMenu: React.FC = () => {
    const { contextMenu, setContextMenu, setEditorMode, setSelectedObject } = useEditorStore();
    const updateProp = usePersistentWorldStore(state => state.updateProp);
    const removeProp = usePersistentWorldStore(state => state.removeProp);

    if (!contextMenu) return null;

    const handleAction = (action: string) => {
        if (!contextMenu.objectId) return;

        if (action === 'delete') {
            removeProp(contextMenu.objectId);
        } else if (action === 'move') {
            setSelectedObject(contextMenu.objectId);
            // Trigger move mode (perhaps we add a transform tool state to the editor store later)
        } else if (action === 'scale') {
            setSelectedObject(contextMenu.objectId);
            // Trigger scale mode
        } else if (action === 'light') {
            // Add a light to the object
        }

        setContextMenu(null);
    };

    const radius = 60;
    const actions = [
        { id: 'move', icon: <Move size={20} />, label: 'Move', color: 'text-blue-400' },
        { id: 'scale', icon: <Scaling size={20} />, label: 'Scale', color: 'text-green-400' },
        { id: 'light', icon: <Sun size={20} />, label: 'Light', color: 'text-yellow-400' },
        { id: 'delete', icon: <Trash2 size={20} />, label: 'Delete', color: 'text-red-400' },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed z-[11000] pointer-events-auto"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onMouseLeave={() => setContextMenu(null)}
            >
                {/* Center dot */}
                <div className="absolute w-2 h-2 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                {actions.map((action, i) => {
                    const angle = (i * (360 / actions.length) - 90) * (Math.PI / 180);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <button
                            key={action.id}
                            onClick={() => handleAction(action.id)}
                            className={`absolute w-12 h-12 bg-black/80 border border-white/20 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 hover:scale-110 hover:bg-white/10 transition-all ${action.color} shadow-lg`}
                            style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                            title={action.label}
                        >
                            {action.icon}
                        </button>
                    );
                })}
            </motion.div>
        </AnimatePresence>
    );
};
