
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Flame, Droplets, Mountain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface FractalDiveOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    pillar: string;
    factor: string;
    content: string; // Markdown content
}

export const FractalDiveOverlay: React.FC<FractalDiveOverlayProps> = ({ isOpen, onClose, pillar, factor, content }) => {
    const [isMinimizing, setIsMinimizing] = useState(false);

    // Dynamic elemental theme based on Pillar/Vibe (Pseudo-random or mapped)
    const getElementalTheme = (p: string) => {
        const themeMap: Record<string, any> = {
            'Self': { icon: Mountain, color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-950/80', shadow: 'shadow-emerald-900/50' },
            'Thought': { icon: Wind, color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-950/80', shadow: 'shadow-cyan-900/50' },
            'Logic': { icon: Mountain, color: 'text-slate-400', border: 'border-slate-500/50', bg: 'bg-slate-950/80', shadow: 'shadow-slate-900/50' },
            'Resonance': { icon: Droplets, color: 'text-pink-400', border: 'border-pink-500/50', bg: 'bg-pink-950/80', shadow: 'shadow-pink-900/50' },
            'Mastery': { icon: Flame, color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-950/80', shadow: 'shadow-amber-900/50' },
            'Unity': { icon: Droplets, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-950/80', shadow: 'shadow-blue-900/50' },
        };
        return themeMap[p] || themeMap['Thought'];
    };

    const theme = getElementalTheme(pillar);
    const Icon = theme.icon;

    // "Wonky" Entrances
    const variants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            x: 100,
            rotate: -10,
            filter: 'blur(10px)',
            clipPath: 'circle(0% at 50% 50%)'
        },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            rotate: 0,
            filter: 'blur(0px)',
            clipPath: 'circle(150% at 50% 50%)',
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
                mass: 0.8
            }
        },
        burning: {
            opacity: 0,
            scale: 1.1,
            filter: 'brightness(2) contrast(1.5) blur(5px)',
            backgroundImage: 'radial-gradient(circle, rgba(255,100,0,0.8), rgba(0,0,0,0))',
            color: '#000',
            y: -50,
            transition: { duration: 0.4 }
        },
        minimized: {
            opacity: 0.5,
            scale: 0.2,
            rotateX: 90, // Lay flat
            y: 500,
            transition: { duration: 0.5 }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed right-10 top-10 bottom-10 w-[500px] z-50 pointer-events-auto flex flex-col perspective-[1000px]`}
                    initial="hidden"
                    animate={isMinimizing ? "minimized" : "visible"}
                    exit="burning"
                    variants={variants}
                >
                    {/* Cloud/Smoke Backdrop Effect */}
                    <div className={`absolute inset-0 ${theme.bg} backdrop-blur-xl rounded-2xl border-2 ${theme.border} ${theme.shadow} shadow-2xl overflow-hidden`}>
                        {/* Fluid Background Animation */}
                        <div className="absolute inset-0 opacity-20 animate-pulse">
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-[spin_20s_linear_infinite]" />
                        </div>

                        {/* Semantic "Window Dressing" */}
                        <div className="absolute top-2 left-2 text-[10px] font-mono opacity-30 select-none">
                            FRACTAL :: {pillar.toUpperCase()} :: GENOME
                        </div>

                        {/* Header */}
                        <div className="relative p-6 border-b border-white/10 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full bg-black/30 ${theme.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold font-mono ${theme.color} tracking-tighter`}>
                                        {pillar}
                                    </h2>
                                    <div className="text-xs text-white/50 tracking-[0.3em] uppercase">
                                        {factor}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsMinimizing(!isMinimizing)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                                >
                                    <div className="w-4 h-1 bg-current rounded-full" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-white/50 hover:text-red-400 group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="relative p-6 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 pb-40">
                            <div className="prose prose-invert prose-sm max-w-none font-sans leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className={`text-xl font-bold ${theme.color} mb-4 border-b border-white/10 pb-2`} {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-white/90 mt-6 mb-3 flex items-center gap-2" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-white/70 mb-4" {...props} />,
                                        strong: ({ node, ...props }) => <strong className={`${theme.color} font-bold`} {...props} />,
                                        li: ({ node, ...props }) => <li className="text-white/70 ml-4 list-disc marker:text-white/30" {...props} />
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Footer / Symbology */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none flex items-end justify-center pb-2">
                            <div className="text-[10px] text-white/20 font-mono tracking-[0.5em]">
                                CHYMISTRY OF THOUGHT
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
