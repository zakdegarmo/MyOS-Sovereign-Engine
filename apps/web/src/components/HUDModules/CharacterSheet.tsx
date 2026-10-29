import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Shield, Zap, 
    Brain, Scroll,
    Activity,
    ChevronRight, X, Info, Target
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Stage, OrbitControls } from '@react-three/drei';
import { ModularAvatar } from '../Avatars/ModularAvatar';
import { CharacterCreator } from './CharacterCreator';
import { type UserGestalt } from '@Omni/types';

interface Stat {
    symbol: string;
    label: string;
    value: number;
    color: string;
}

const STATS: Stat[] = [
    { symbol: 'STR', label: 'Strength', value: 14, color: 'text-red-400' },
    { symbol: 'DEX', label: 'Dexterity', value: 16, color: 'text-emerald-400' },
    { symbol: 'CON', label: 'Constitution', value: 12, color: 'text-orange-400' },
    { symbol: 'INT', label: 'Intelligence', value: 18, color: 'text-blue-400' },
    { symbol: 'WIS', label: 'Wisdom', value: 14, color: 'text-purple-400' },
    { symbol: 'CHA', label: 'Charisma', value: 10, color: 'text-pink-400' },
];

const SKILLS = [
    { name: 'Semantic Scripting', level: 'Expert', icon: <Brain size={14} /> },
    { name: 'Vortex Navigation', level: 'Novice', icon: <Zap size={14} /> },
    { name: 'Mephit Diplomacy', level: 'Adept', icon: <Scroll size={14} /> },
    { name: 'Logic Shielding', level: 'Expert', icon: <Shield size={14} /> },
];

export const CharacterSheet: React.FC<{ 
    onClose: () => void,
    userGestalt?: UserGestalt,
    onUpdate?: (u: Partial<UserGestalt>) => void
}> = ({ onClose, userGestalt, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'STATS' | 'SKILLS' | 'BIO'>('STATS');
    const [isModulating, setIsModulating] = useState(false);

    const genome = userGestalt?.genome || {
        id: 'Player_Hero_Ranger',
        archetype: 'Ranger',
        dimensions: {
            head: [1, 1, 1],
            torso: [1, 1, 1],
            pelvis: [1, 1, 1],
            upperArm: [1, 1, 1],
            lowerArm: [1, 1, 1],
            hands: [1, 1, 1],
            upperLeg: [1, 1, 1],
            lowerLeg: [1, 1, 1],
            feet: [1, 1, 1]
        },
        colors: {
            primary: '#3b82f6',
            secondary: '#1e3a8a',
            accent: '#fbbf24',
            skin: '#ffdbac',
            hair: '#4b2c20'
        },
        traits: ['Brave', 'Agile']
    };

    const handleRoll = (tier: 10 | 100 | 1000, label: string) => {
        const targetDC = Math.floor(tier * 0.6); // Default DC 60% of tier
        window.dispatchEvent(new CustomEvent('myos_dice_roll', {
            detail: {
                tier,
                targetDC,
                label,
                onComplete: (res: number, success: boolean, diff: number) => {
                    console.log(`Roll complete: ${res} | Success: ${success} | Diff: ${diff}`);
                }
            }
        }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-[580px] h-[780px] jrpg-panel shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto"
        >
            {/* PROFILE HEADER */}
            <div className="px-10 py-8 bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center gap-4 text-center">
                <div className="relative group cursor-pointer" onClick={() => setIsModulating(true)}>
                    <div className="w-28 h-28 bg-white p-1 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-black relative">
                            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.2, 2.5], fov: 40 }}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} />
                                <Stage environment="city" intensity={0.5} contactShadow={false} center>
                                    <ModularAvatar 
                                        genome={genome} 
                                        action="idle" 
                                        scale={1.2}
                                    />
                                </Stage>
                                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} />
                            </Canvas>
                            <div className="absolute inset-0 bg-cyan-500/0 hover:bg-cyan-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/80 px-2 py-1 rounded">Modify</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-emerald-500 border-4 border-slate-950 flex items-center justify-center">
                        <Activity size={18} className="text-black" />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-[0.1em]">Mephit_091</h2>
                    <p className="text-[10px] font-mono text-cyan-400/60 tracking-widest uppercase">Ontological_Tier: II</p>
                </div>

                <div className="flex gap-3 mt-4">
                    {['STATS', 'SKILLS', 'BIO'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 border-2 text-[11px] font-bold tracking-widest transition-all
                                ${activeTab === tab ? 'bg-white text-black border-white' : 'text-white/40 border-white/10 hover:border-white/40 hover:text-white'}
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
                {/* GLOBAL ACTION BAR */}
                <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                    <h3 className="text-[10px] font-bold text-white/30 tracking-[0.4em] uppercase">Ontological Checks</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={() => handleRoll(10, "Delta Check")}
                            className="group flex flex-col items-center gap-2 p-4 bg-white/5 border-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all"
                        >
                            <Zap size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Delta</span>
                            <span className="text-[9px] text-white/20 font-mono">1-10</span>
                        </button>
                        <button 
                            onClick={() => handleRoll(100, "Sigma Check")}
                            className="group flex flex-col items-center gap-2 p-4 bg-white/5 border-2 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
                        >
                            <Target size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Sigma</span>
                            <span className="text-[9px] text-white/20 font-mono">1-100</span>
                        </button>
                        <button 
                            onClick={() => handleRoll(1000, "Omega Check")}
                            className="group flex flex-col items-center gap-2 p-4 bg-white/5 border-2 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all"
                        >
                            <Shield size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Omega</span>
                            <span className="text-[9px] text-white/20 font-mono">1-1000</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'STATS' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                {STATS.map((stat) => (
                                    <div key={stat.symbol} className="p-4 bg-white/5 border-2 border-white/5 flex flex-col gap-3 group hover:bg-white/10 transition-all">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-2xl ${stat.color}`}>{stat.symbol}</span>
                                            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(stat.value / 20) * 100}%` }}
                                                    className={`h-full bg-gradient-to-r from-transparent to-current ${stat.color}`}
                                                />
                                            </div>
                                            <span className="text-sm font-mono font-bold text-white">{stat.value}</span>
                                        </div>
                                        <div className="text-[9px] font-mono text-white/40 text-right uppercase tracking-tighter">
                                            MOD: {Math.floor((stat.value - 10) / 2) >= 0 ? `+${Math.floor((stat.value - 10) / 2)}` : Math.floor((stat.value - 10) / 2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'SKILLS' && (
                        <motion.div
                            key="skills"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {SKILLS.map((skill) => (
                                <div key={skill.name} className="p-4 bg-white/5 border-2 border-white/5 flex items-center justify-between group hover:border-cyan-500/30">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-900 rounded-xl text-cyan-400 border border-white/10 group-hover:scale-110 transition-transform">
                                            {skill.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{skill.name}</h3>
                                            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{skill.level}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-700" />
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'BIO' && (
                        <motion.div
                            key="bio"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="p-6 bg-white/5 border-2 border-white/5 rounded-3xl space-y-4">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                                    <Info size={14} />
                                    Agent_Dossier
                                </div>
                                <p className="text-[13px] leading-relaxed text-slate-300 font-mono italic">
                                    "A fragment of the Logic pillar that achieved self-awareness during the first alchemical leak. Specializes in navigating high-entropy VPN tunnels and decoding semantic ghosts."
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-red-500 hover:text-white border-2 border-white/10 text-white/40 transition-all">
                <X size={24} />
            </button>

            <AnimatePresence>
                {isModulating && (
                    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
                        <CharacterCreator 
                            initialGenome={genome}
                            onSave={(newGenome) => {
                                onUpdate?.({ genome: newGenome });
                                setIsModulating(false);
                            }}
                            onClose={() => setIsModulating(false)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* SCANLINE OVERLAY */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
        </motion.div>
    );
};
