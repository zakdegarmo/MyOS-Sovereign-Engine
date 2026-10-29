import React from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react'; // Assuming lucide-react is available, or use text

interface OSWindowProps {
    title: string;
    icon?: string;
    children: React.ReactNode;
    onClose: () => void;
    isActive?: boolean;
}

export const OSWindow: React.FC<OSWindowProps> = ({ title, icon, children, onClose, isActive = true }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            drag
            dragMomentum={false}
            className="absolute top-20 left-10 md:left-1/4 w-[90vw] md:w-[800px] h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/80 backdrop-blur-xl z-40"
            style={{ boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
        >
            {/* Window Header */}
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing shrink-0">
                <div className="flex items-center gap-3">
                    <div className="text-cyan-400 opacity-80 text-sm font-mono tracking-widest uppercase flex items-center gap-2">
                        {icon && <span>{icon}</span>}
                        {title}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                        <Minus size={14} />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                        <Maximize2 size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors text-white/50"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                {children}
            </div>

            {/* Window Framework Decor */}
            <div className="absolute bottom-0 right-0 p-1 opacity-20 pointer-events-none">
                <div className="w-3 h-3 border-r-2 border-b-2 border-white rounded-br" />
            </div>
        </motion.div>
    );
};
