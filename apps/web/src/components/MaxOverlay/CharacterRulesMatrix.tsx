import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Dice5, Shield, Zap, Heart, Footprints, Eye, Sparkles, Brain, 
    Swords, Crosshair, CheckCircle2, XCircle, ChevronRight, Sliders, RefreshCw
} from 'lucide-react';

interface CharacterRulesMatrixProps {
    onClose?: () => void;
}

export type AiBehaviorRoutine = 'COMPANION' | 'SENTRY' | 'WANDERER' | 'COMBATANT';

export const CharacterRulesMatrix: React.FC<CharacterRulesMatrixProps> = ({ onClose }) => {
    // 1. Ability Scores & D&D Matrix
    const [characterClass, setCharacterClass] = useState('Sunlit Paladin • Level 5');
    const [stats, setStats] = useState({
        str: 18,
        dex: 12,
        con: 16,
        int: 10,
        wis: 14,
        cha: 18
    });

    // 2. Behavior & AI Routine
    const [behaviorRoutine, setBehaviorRoutine] = useState<AiBehaviorRoutine>('COMPANION');
    const [aggressionThreshold, setAggressionThreshold] = useState<number>(30); // 0-100
    const [followDistance, setFollowDistance] = useState<number>(64); // px

    // 3. Interactive D20 Ability Check State
    const [diceResult, setDiceResult] = useState<{
        skillName: string;
        stat: string;
        d20: number;
        mod: number;
        total: number;
        dc: number;
        isCrit: boolean;
        success: boolean;
    } | null>(null);

    const skills = [
        { name: 'Physically Move UI Window', stat: 'STR', dc: 12, desc: 'Gripping and dragging desktop workspace panels.' },
        { name: 'Deploy Sovereign Ward', stat: 'CHA', dc: 14, desc: 'Shielding local runtime from rogue child processes.' },
        { name: 'Sense Corrupt Memory', stat: 'WIS', dc: 13, desc: 'Perceiving memory leaks or stale context cache.' },
        { name: 'Analyze Codebase Grammar', stat: 'INT', dc: 15, desc: 'Parsing AST grammar and syntax tree structure.' },
        { name: 'Evasive Window Dodge', stat: 'DEX', dc: 11, desc: 'Nimble collision evasion around active window modals.' },
        { name: 'Sustain Intensive Loop', stat: 'CON', dc: 14, desc: 'Enduring long-running render cycles without frame drop.' }
    ];

    const getMod = (val: number) => Math.floor((val - 10) / 2);
    const formatMod = (mod: number) => mod >= 0 ? `+${mod}` : `${mod}`;

    const handleRoll = (skillName: string, statKey: string, dc: number) => {
        const score = stats[statKey.toLowerCase() as keyof typeof stats] ?? 10;
        const mod = getMod(score);
        const d20 = Math.floor(Math.random() * 20) + 1;
        const total = d20 + mod;
        const isCrit = d20 === 20;
        const success = isCrit || total >= dc;

        setDiceResult({
            skillName,
            stat: statKey,
            d20,
            mod,
            total,
            dc,
            isCrit,
            success
        });
    };

    // Calculate Derived Vitals
    const derivedAc = 10 + getMod(stats.dex) + (characterClass.includes('Paladin') ? 7 : 2);
    const derivedHp = 24 + getMod(stats.con) * 5;
    const derivedSpeed = 30 + Math.max(0, getMod(stats.dex) * 5);
    const derivedPerception = 10 + getMod(stats.wis);

    // Mechanical Engine Kinematics Mapping
    const mechanicalRunSpeed = 160 + getMod(stats.dex) * 20; // px/s
    const mechanicalJumpImpulse = 11 + Math.max(0, getMod(stats.str) * 1.5); // m/s
    const mechanicalHpPool = derivedHp * 2;

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-lg shadow-inner">
                        🜔
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                                FSG://Self.Self.Logic
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold uppercase">
                                Character Rules & Behavior Resolver
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Ability Matrix • D20 DC Checks • Engine Kinematics Scaling • Behavior Routine
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            title="Close & Return to Self.Self"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Content Body: 3-Column Layout */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1 (4 cols): Ability Matrix & Engine Scaling */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* Character Identity & Archetype */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest block">
                            Active Ruleset & Class
                        </span>
                        <input
                            type="text"
                            value={characterClass}
                            onChange={(e) => setCharacterClass(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 font-mono focus:outline-none focus:border-amber-500 transition"
                        />
                    </div>

                    {/* Core Ability Matrix (STR, DEX, CON, INT, WIS, CHA) */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                                Core Ability Matrix
                            </span>
                            <span className="text-[9px] font-mono text-amber-400 font-bold">D&D 5E Standard</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(stats) as Array<keyof typeof stats>).map((statKey) => {
                                const val = stats[statKey];
                                const mod = getMod(val);
                                return (
                                    <div key={statKey} className="bg-black/60 border border-white/10 rounded-xl p-2.5 flex flex-col items-center gap-1 group hover:border-amber-500/40 transition">
                                        <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                                            {statKey.toUpperCase()}
                                        </span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={val}
                                            onChange={(e) => {
                                                const parsed = parseInt(e.target.value) || 10;
                                                setStats(prev => ({ ...prev, [statKey]: parsed }));
                                            }}
                                            className="w-12 text-center bg-transparent text-sm font-black text-white font-mono focus:outline-none border-b border-transparent focus:border-amber-400"
                                        />
                                        <span className={`text-[10px] font-mono font-bold ${mod >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {formatMod(mod)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Derived Combat Vitals */}
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                            <Shield size={12} className="mx-auto text-cyan-400 mb-0.5" />
                            <span className="text-[7px] font-mono text-slate-500 block uppercase">AC</span>
                            <span className="text-xs font-black font-mono text-white">{derivedAc}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                            <Heart size={12} className="mx-auto text-rose-400 mb-0.5" />
                            <span className="text-[7px] font-mono text-slate-500 block uppercase">HP</span>
                            <span className="text-xs font-black font-mono text-white">{derivedHp}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                            <Footprints size={12} className="mx-auto text-amber-400 mb-0.5" />
                            <span className="text-[7px] font-mono text-slate-500 block uppercase">Speed</span>
                            <span className="text-xs font-black font-mono text-white">{derivedSpeed}ft</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                            <Eye size={12} className="mx-auto text-purple-400 mb-0.5" />
                            <span className="text-[7px] font-mono text-slate-500 block uppercase">Percept</span>
                            <span className="text-xs font-black font-mono text-white">{derivedPerception}</span>
                        </div>
                    </div>

                    {/* Dynamic Mechanics Scaling (Stats -> Engine) */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                        <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest block">
                            ⚡ Stat &rarr; Engine Kinematics Scaling
                        </span>
                        <div className="space-y-1.5 text-[9px] font-mono">
                            <div className="flex justify-between items-center text-slate-400">
                                <span>DEX &rarr; Max Run Velocity:</span>
                                <span className="text-cyan-300 font-bold">{mechanicalRunSpeed} px/s</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                                <span>STR &rarr; Jump Impulse:</span>
                                <span className="text-amber-300 font-bold">{mechanicalJumpImpulse.toFixed(1)} m/s</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                                <span>CON &rarr; Damage Absorption:</span>
                                <span className="text-rose-300 font-bold">{mechanicalHpPool} Hit Points</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2 (4 cols): D20 Ability Checks & DC Resolver */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Dice5 size={14} className="text-purple-400" />
                                <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest">
                                    D20 Skill & Action Checks
                                </span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">Click to Roll</span>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                            {skills.map(sk => (
                                <div
                                    key={sk.name}
                                    className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/30 transition flex flex-col gap-1.5 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-amber-400 font-mono text-[8px] font-bold">
                                                {sk.stat}
                                            </span>
                                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                                                {sk.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRoll(sk.name, sk.stat, sk.dc)}
                                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-[9px] uppercase transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm"
                                        >
                                            <Dice5 size={11} />
                                            <span>Roll DC {sk.dc}</span>
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-tight">
                                        {sk.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Roll Result Toast / Banner */}
                        {diceResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-3.5 rounded-xl border font-mono ${
                                    diceResult.success
                                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                                }`}
                            >
                                <div className="flex items-center justify-between font-bold text-xs">
                                    <div className="flex items-center gap-1.5">
                                        {diceResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        <span>{diceResult.skillName}</span>
                                    </div>
                                    <span className="uppercase tracking-wider font-black">
                                        {diceResult.isCrit ? '🔥 CRITICAL SUCCESS!' : diceResult.success ? '✓ SUCCESS' : '✗ FAILED'}
                                    </span>
                                </div>
                                <div className="text-[10px] mt-1 opacity-90">
                                    Roll: d20(<strong>{diceResult.d20}</strong>) + {diceResult.stat} Mod(<strong>{formatMod(diceResult.mod)}</strong>) = <strong className="text-white text-xs">{diceResult.total}</strong> vs DC {diceResult.dc}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Column 3 (4 cols): AI Behavior Routine & Decision Rules */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <Brain size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest">
                                Actor Behavior Routine
                            </span>
                        </div>

                        {/* Routine Presets */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'COMPANION', label: 'Companion', icon: Sparkles, desc: 'Follows avatar & assists with interaction' },
                                { id: 'SENTRY', label: 'Sentry / Guard', icon: Shield, desc: 'Anchors to post & shields designated perimeter' },
                                { id: 'WANDERER', label: 'Townfolk', icon: Footprints, desc: 'Autonomous wandering & social idling' },
                                { id: 'COMBATANT', label: 'Combatant', icon: Swords, desc: 'Aggressive target acquisition & engagement' }
                            ].map(item => {
                                const Icon = item.icon;
                                const isSelected = behaviorRoutine === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setBehaviorRoutine(item.id as AiBehaviorRoutine)}
                                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                                            isSelected
                                                ? 'bg-cyan-500/10 border-cyan-500/60 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                                : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Icon size={12} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                                            <span className="text-[10px] font-bold font-mono uppercase">{item.label}</span>
                                        </div>
                                        <span className="text-[8px] opacity-70 leading-tight">{item.desc}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Behavior Fine Tuning Sliders */}
                        <div className="space-y-3 pt-2">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>Follow Tether Distance:</span>
                                    <span className="text-cyan-400 font-bold">{followDistance} px</span>
                                </div>
                                <input
                                    type="range"
                                    min={32}
                                    max={256}
                                    value={followDistance}
                                    onChange={(e) => setFollowDistance(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400 h-1"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>Aggression / Engagement Threshold:</span>
                                    <span className="text-amber-400 font-bold">{aggressionThreshold}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={aggressionThreshold}
                                    onChange={(e) => setAggressionThreshold(parseInt(e.target.value))}
                                    className="w-full accent-amber-400 h-1"
                                />
                            </div>
                        </div>

                        {/* Decision Arbitration Matrix */}
                        <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1.5 text-[9px] font-mono">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                                Decision Arbitration Priority:
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <span className="text-amber-400">1.</span>
                                <span>Health &lt; 20% &rarr; Retreat / Defensive Ward</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <span className="text-amber-400">2.</span>
                                <span>Distance &gt; {followDistance}px &rarr; Kinematic Sprint Catchup</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <span className="text-amber-400">3.</span>
                                <span>Hostile Target In Range &rarr; Roll DC Check & Strike</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
