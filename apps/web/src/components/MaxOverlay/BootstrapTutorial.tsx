import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, ChevronLeft, Terminal, Database, Map, Zap, X } from 'lucide-react';

interface TutorialStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    actionLabel: string;
}

const steps: TutorialStep[] = [
    {
        title: "The Terminal Pulse",
        description: "Your Orchestrator is now bridged to the local OS. Open the Orchestrator and type 'ls N:/' in the black terminal area. This confirms your removable drive is attunement-ready.",
        icon: <Terminal className="text-cyan-400" />,
        actionLabel: "Verify Substrate"
    },
    {
        title: "Lore Attunement",
        description: "You have 900+ PDFs being ingested. Use the 'Lore Architect' module to check the index status. This lore will eventually feed directly into Gemma's reasoning.",
        icon: <Database className="text-amber-400" />,
        actionLabel: "Access Knowledge"
    },
    {
        title: "Spatial Persistence",
        description: "Your coordinates are saved every 2 seconds to N:/world-state.json. You can walk anywhere in the 3D scene, close the browser, and you will respawn at the exact same spot on Monday.",
        icon: <Map className="text-emerald-400" />,
        actionLabel: "Anchor Reality"
    },
    {
        title: "On-Demand Vision",
        description: "To save GPU memory, auto-vision is disabled. Click the Camera icon in the Orchestrator ONLY when you want Gemma to see your screen. This keeps the Mystra Core fast.",
        icon: <Zap className="text-purple-400" />,
        actionLabel: "Transmit Sight"
    }
];

export const BootstrapTutorial: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="fixed right-6 bottom-32 w-80 jrpg-panel p-6 z-[100] shadow-[0_0_40px_rgba(0,0,0,0.8)] border-l-4 border-cyan-500 pointer-events-auto"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2">
                            <BookOpen size={20} className="text-cyan-400" />
                            <h3 className="text-sm font-display font-bold tracking-widest text-white uppercase">Bootstrap Protocol</h3>
                        </div>
                        <button onClick={onClose} className="text-white/30 hover:text-white"><X size={18} /></button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                            {steps[currentStep].icon}
                            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-tighter">{steps[currentStep].title}</h4>
                        </div>

                        <p className="text-[11px] leading-relaxed text-slate-300 font-mono italic">
                            "{steps[currentStep].description}"
                        </p>

                        <div className="pt-4 flex justify-between items-center border-t border-white/10 mt-4">
                            <div className="flex flex-col gap-1">
                                <div className="text-[9px] text-cyan-500/50 font-bold uppercase tracking-widest">
                                    Step {currentStep + 1} of {steps.length}
                                </div>
                                <div className="flex gap-1">
                                    {steps.map((_, i) => (
                                        <div key={i} className={`h-1 w-4 rounded-full transition-all ${i === currentStep ? 'bg-cyan-400' : 'bg-white/10'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    disabled={currentStep === 0}
                                    onClick={() => setCurrentStep(s => s - 1)}
                                    className="p-2 bg-white/5 rounded-lg disabled:opacity-20 hover:bg-white/10 transition-all text-white/40"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => currentStep === steps.length - 1 ? onClose() : setCurrentStep(s => s + 1)}
                                    className="px-6 py-2 bg-cyan-500 text-black text-[11px] font-black rounded-lg hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                >
                                    {currentStep === steps.length - 1 ? "FINALIZE PROTOCOL" : "NEXT STEP"}
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
