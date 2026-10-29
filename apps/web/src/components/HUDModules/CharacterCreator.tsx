import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei';
import { ModularAvatar } from '../Avatars/ModularAvatar';
import { type ProceduralGenome } from '../../utils/ManifestationAlgorithm';
import { X, Save, RefreshCw, User, Shield, Zap, Wand2, Hammer } from 'lucide-react';

interface CharacterCreatorProps {
    initialGenome?: ProceduralGenome;
    onSave: (genome: ProceduralGenome) => void;
    onClose: () => void;
}

const DEFAULT_GENOME: ProceduralGenome = {
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
    traits: ['Brave', 'Agile'],
    animation: 'idle',
    meshes: {
        base: '',
        body: '',
        arms: '',
        legs: '',
        feet: '',
        head: null
    },
    lineage: {
        generation: 1,
        ancestors: [],
        inheritedTraits: ['Neural Persistence']
    }
};

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ 
    initialGenome = DEFAULT_GENOME, 
    onSave, 
    onClose 
}) => {
    const [genome, setGenome] = useState<ProceduralGenome>(initialGenome);
    const [activeTab, setActiveTab] = useState<'class' | 'body' | 'colors' | 'animations' | 'lineage'>('class');
    const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
    const [selectedAnimation, setSelectedAnimation] = useState<string>('');
    const [previewAction, setPreviewAction] = useState<'idle' | 'walk' | 'run'>('idle');

    const updateDimension = (key: keyof NonNullable<ProceduralGenome['dimensions']>, axis: 0 | 1 | 2, val: number) => {
        setGenome(prev => {
            const newDims = { ...prev.dimensions };
            const current = [...(newDims[key] || [1, 1, 1])] as [number, number, number];
            current[axis] = val;
            newDims[key] = current;
            return { ...prev, dimensions: newDims };
        });
    };

    const updateColor = (key: keyof ProceduralGenome['colors'], val: string) => {
        setGenome(prev => ({
            ...prev,
            colors: { ...prev.colors, [key]: val }
        }));
    };

    const setClass = (className: string) => {
        setGenome(prev => ({
            ...prev,
            id: `Player_Hero_${className}`,
            archetype: className
        }));
    };

    const SliderGroup = ({ label, dimKey }: { label: string, dimKey: keyof NonNullable<ProceduralGenome['dimensions']> }) => (
        <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-xl">
            <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{label}</label>
            <div className="grid grid-cols-3 gap-2">
                {['W', 'H', 'D'].map((axis, i) => (
                    <div key={axis} className="flex flex-col gap-1">
                        <span className="text-[8px] text-white/40 uppercase text-center">{axis}</span>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="2.0" 
                            step="0.01"
                            value={genome.dimensions?.[dimKey]?.[i as 0|1|2] || 1}
                            onChange={(e) => updateDimension(dimKey, i as 0|1|2, parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    const formatAnimLabel = (name: string) => {
        const isArtificer = genome.archetype?.toLowerCase() === 'artificer' || genome.id.toLowerCase().includes('artificer');
        if (isArtificer && name === 'Boxing_Practice') return 'IDLE';
        return name;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-[900px] h-[600px] bg-slate-950 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex"
        >
            {/* Sidebar Controls */}
            <div className="w-[350px] border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter italic">Character Modulator</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-white/10">
                    {(['class', 'body', 'colors', 'animations', 'lineage'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-500' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {activeTab === 'class' && (
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'fighter', label: 'Fighter', icon: <Shield size={18} /> },
                                { id: 'ranger', label: 'Ranger', icon: <Zap size={18} /> },
                                { id: 'wizard', label: 'Wizard', icon: <Wand2 size={18} /> },
                                { id: 'artificer', label: 'Artificer', icon: <Hammer size={18} /> },
                                { id: 'rogue', label: 'Rogue', icon: <User size={18} /> },
                                { id: 'paladin', label: 'Paladin', icon: <Shield size={18} /> }
                            ].map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => setClass(cls.id)}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${genome.id.toLowerCase().includes(cls.id) ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                >
                                    <div className={`${genome.id.toLowerCase().includes(cls.id) ? 'text-cyan-400' : 'text-white/40'}`}>
                                        {cls.icon}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{cls.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'body' && (
                        <div className="space-y-4">
                            <SliderGroup label="Head & Neck" dimKey="head" />
                            <SliderGroup label="Torso / Chest" dimKey="torso" />
                            <SliderGroup label="Arms (Upper)" dimKey="upperArm" />
                            <SliderGroup label="Arms (Lower)" dimKey="lowerArm" />
                            <SliderGroup label="Legs (Upper)" dimKey="upperLeg" />
                            <SliderGroup label="Legs (Lower)" dimKey="lowerLeg" />
                            <SliderGroup label="Hands" dimKey="hands" />
                            <SliderGroup label="Feet" dimKey="feet" />
                        </div>
                    )}

                    {activeTab === 'colors' && (
                        <div className="space-y-4">
                            {[
                                { key: 'skin', label: 'Skin Tone' },
                                { key: 'hair', label: 'Hair Color' },
                                { key: 'primary', label: 'Primary Gear' },
                                { key: 'secondary', label: 'Secondary Gear' },
                                { key: 'accent', label: 'Accent / Glow' }
                            ].map(c => (
                                <div key={c.key} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">{c.label}</span>
                                    <input 
                                        type="color" 
                                        value={genome.colors[c.key as keyof ProceduralGenome['colors']]} 
                                        onChange={(e) => updateColor(c.key as any, e.target.value)}
                                        className="w-10 h-10 rounded-lg overflow-hidden border-none bg-transparent cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'animations' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
                                <p className="text-[10px] text-amber-200/60 leading-relaxed italic">
                                    "Meshy AI clips are often mislabeled. Map the sequences below to restore the entity's kinetic truth."
                                </p>
                            </div>

                            {(['idle', 'walk', 'run'] as const).map(actionKey => (
                                <div key={actionKey} className="space-y-2 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">{actionKey} sequence</label>
                                    <select 
                                        value={genome.animationMapping?.[actionKey] || ''}
                                        onFocus={() => {
                                            setPreviewAction(actionKey);
                                            setSelectedAnimation(''); // Clear override to show mapped state
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setGenome(prev => ({
                                                ...prev,
                                                animationMapping: {
                                                    ...(prev.animationMapping || { idle: '', walk: '', run: '' }),
                                                    [actionKey]: val
                                                }
                                            }));
                                            setPreviewAction(actionKey);
                                            if (val) setSelectedAnimation(val);
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer"
                                    >
                                        <option value="">Auto-Detect</option>
                                        {availableAnimations.map((name) => (
                                            <option key={name} value={name}>{formatAnimLabel(name)}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'lineage' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Ancestral Generation</span>
                                <div className="text-2xl font-black text-cyan-400">GEN-{genome.lineage?.generation || 1}</div>
                            </div>
                            
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Inherited Genetic Memory</span>
                                <div className="flex flex-wrap gap-2">
                                    {(genome.lineage?.inheritedTraits || []).map(trait => (
                                        <span key={trait} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-[9px] text-cyan-300 uppercase font-bold">
                                            {trait}
                                        </span>
                                    ))}
                                    {(!genome.lineage?.inheritedTraits || genome.lineage.inheritedTraits.length === 0) && (
                                        <span className="text-[10px] text-white/20 italic">No ancestral traits detected.</span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                <p className="text-[10px] text-amber-200/60 leading-relaxed italic">
                                    "This entity carries the neural echoes of its predecessors. Every manifestation refines the collective genome."
                                </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Model Offset</h3>
                                {[
                                    { label: 'Offset X', axis: 0 },
                                    { label: 'Offset Y', axis: 1 },
                                    { label: 'Offset Z', axis: 2 }
                                ].map(({ label, axis }) => (
                                    <div key={label} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-mono">
                                            <span className="text-white/60">{label}</span>
                                            <span className="text-cyan-400">{(genome.dimensions?.position?.[axis] || 0).toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-2"
                                            max="2"
                                            step="0.01"
                                            value={genome.dimensions?.position?.[axis] || 0}
                                            onChange={(e) => updateDimension('position', axis, parseFloat(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-black/40 flex gap-3">
                    <button 
                        onClick={() => setGenome(DEFAULT_GENOME)}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 transition-all border border-white/10"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button 
                        onClick={() => onSave(genome)}
                        className="flex-1 p-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-white font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-3"
                    >
                        <Save size={20} />
                        Manifest Entity
                    </button>
                </div>
            </div>

            {/* 3D Preview */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-black">
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={40} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                    
                    <group position={[0, 0, 0]}>
                        <ModularAvatar 
                            genome={genome} 
                            action={previewAction} 
                            scale={1.5}
                            onAnimationsLoaded={setAvailableAnimations}
                            animationOverride={selectedAnimation}
                        />
                    </group>
                    
                    <OrbitControls 
                        enablePan={false} 
                        minDistance={2} 
                        maxDistance={6} 
                        target={[0, 1, 0]}
                    />
                    <ambientLight intensity={0.4} />
                    <pointLight position={[0, 5, 3]} intensity={1.5} color="#8844ff" />
                    <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                </Canvas>

                {/* Animation Pulldown */}
                <div className="absolute top-6 left-6 z-20">
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] px-2">Preview Animation</label>
                        <select 
                            value={selectedAnimation}
                            onChange={(e) => setSelectedAnimation(e.target.value)}
                            className="bg-black/80 border border-white/20 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/50 backdrop-blur-md cursor-pointer hover:bg-black/90 transition-colors"
                        >
                            <option value="">(Default Dynamic)</option>
                            {availableAnimations.map((name, index) => (
                                <option key={name} value={name}>[{index}] {formatAnimLabel(name)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Status HUD Overlay */}
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                    <div className="px-4 py-2 bg-black/80 border border-cyan-500/50 rounded-full backdrop-blur-md">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} />
                            Class: {genome.archetype}
                        </span>
                    </div>
                </div>

                {/* Floor Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle at center, transparent 0%, black 100%), linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
                    backgroundSize: '100% 100%, 40px 40px, 40px 40px'
                }} />
            </div>
        </motion.div>
    );
};
