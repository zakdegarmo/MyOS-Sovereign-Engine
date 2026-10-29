/**
 * BurbanWarfare/BurbanHUD.tsx
 * 
 * 90s CRT / VHS styled gameplay overlay HUD.
 * Renders XP level bar, health, weapon slots, secondary inventory,
 * radar alerts for neighbors in distress, and rescue toasts.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, Skull, Clock, Droplets, Bomb, Disc, Snowflake, 
    Zap, Flame, Compass, HelpCircle, ShieldAlert, Sparkles 
} from 'lucide-react';
import type { PlayerStats, WeaponDefinition, SecondaryItemDefinition, NeighborNPC, RelicInstance } from './types';

interface BurbanHUDProps {
    stats: PlayerStats;
    activeWeapon: WeaponDefinition;
    allWeapons: WeaponDefinition[];
    activeSecondary: SecondaryItemDefinition;
    allSecondaries: SecondaryItemDefinition[];
    neighbors: NeighborNPC[];
    activeRelics: RelicInstance[];
    elapsedSeconds: number;
    savedNeighborToast: NeighborNPC | null;
    onDismissToast: () => void;
}

const getWeaponIcon = (iconName: string, size = 18) => {
    switch (iconName) {
        case 'Droplets': return <Droplets size={size} className="text-cyan-400" />;
        case 'Bomb': return <Bomb size={size} className="text-rose-400" />;
        case 'Disc': return <Disc size={size} className="text-lime-400" />;
        case 'Snowflake': return <Snowflake size={size} className="text-sky-300" />;
        default: return <Sparkles size={size} className="text-yellow-400" />;
    }
};

const getSecondaryIcon = (iconName: string, size = 18) => {
    switch (iconName) {
        case 'Flame': return <Flame size={size} className="text-orange-500" />;
        case 'Heart': return <Heart size={size} className="text-red-400 fill-red-400" />;
        case 'Zap': return <Zap size={size} className="text-yellow-400 fill-yellow-400" />;
        default: return <Sparkles size={size} className="text-purple-400" />;
    }
};

export const BurbanHUD: React.FC<BurbanHUDProps> = ({
    stats,
    activeWeapon,
    allWeapons,
    activeSecondary,
    allSecondaries,
    neighbors,
    activeRelics,
    elapsedSeconds,
    savedNeighborToast,
    onDismissToast
}) => {
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const xpPercent = Math.min(100, (stats.xp / stats.xpToNextLevel) * 100);
    const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono select-none z-30">
            {/* --- TOP BAR: XP, LEVEL & SURVIVAL STATS --- */}
            <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto">
                {/* XP Gauge */}
                <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-yellow-500/30 shadow-lg">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400 font-black text-xs">
                        <span>LV</span>
                        <span className="text-sm text-yellow-300">{stats.level}</span>
                    </div>

                    <div className="flex-1 h-3.5 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.6)]"
                            style={{ width: `${xpPercent}%` }}
                            animate={{ width: `${xpPercent}%` }}
                            transition={{ ease: 'easeOut', duration: 0.2 }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white/70 font-bold uppercase tracking-wider">
                            {Math.floor(stats.xp)} / {stats.xpToNextLevel} XP
                        </span>
                    </div>

                    {/* Timer & Kills */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-sky-400 font-bold">
                            <Clock size={14} />
                            <span>{formatTime(elapsedSeconds)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-rose-400 font-bold">
                            <Skull size={14} />
                            <span>{stats.kills}</span>
                        </div>
                    </div>
                </div>

                {/* Sub-Bar: Health & Active Relics */}
                <div className="flex items-center justify-between px-2">
                    {/* Health Bar */}
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-red-500/30">
                        <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" />
                        <div className="w-36 h-3 bg-slate-950 rounded-full overflow-hidden border border-red-500/20 relative">
                            <div
                                className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full"
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-red-200 font-bold">
                            {Math.ceil(stats.hp)} / {stats.maxHp}
                        </span>
                    </div>

                    {/* Neighbor Rescue Tracker */}
                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-purple-500/30">
                        <span className="text-[10px] uppercase font-bold text-purple-300">Neighbors:</span>
                        <div className="flex items-center gap-1.5">
                            {neighbors.map(n => (
                                <div
                                    key={n.id}
                                    title={`${n.title}: ${n.isSaved ? 'SAVED' : n.isLost ? 'LOST' : 'IN DANGER'}`}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border transition-all ${
                                        n.isSaved
                                            ? 'bg-green-500 border-green-300 text-black'
                                            : n.isLost
                                            ? 'bg-red-950 border-red-700 text-red-500 line-through'
                                            : n.distressTimer > 0
                                            ? 'bg-yellow-500 border-red-500 text-black animate-ping'
                                            : 'bg-slate-800 border-slate-600 text-white/50'
                                    }`}
                                >
                                    {n.name[0]}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RESCUE TOAST DIALOGUE POPUP --- */}
            <AnimatePresence>
                {savedNeighborToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="pointer-events-auto self-center max-w-lg bg-gradient-to-r from-purple-950/95 via-slate-900/95 to-indigo-950/95 border-2 border-yellow-400 p-4 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] flex items-start gap-4"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-black border-2 border-yellow-300 shadow-md flex-shrink-0"
                            style={{ backgroundColor: savedNeighborToast.avatarColor }}
                        >
                            {savedNeighborToast.name[0]}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-yellow-400 font-black text-xs uppercase tracking-wider">
                                    {savedNeighborToast.title} ({savedNeighborToast.name}) SAVED!
                                </h4>
                                <span className="text-[9px] px-2 py-0.5 bg-yellow-400/20 text-yellow-300 rounded font-bold">
                                    +RELIC UNLOCKED
                                </span>
                            </div>
                            <p className="text-xs text-white/90 italic mt-1 leading-relaxed">
                                "{savedNeighborToast.dialogue}"
                            </p>
                            <div className="mt-2 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                                <Sparkles size={12} />
                                <span>Relic: {savedNeighborToast.relicName} — {savedNeighborToast.relicDescription}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- BOTTOM BAR: WEAPON LOADOUT & CONTROLS --- */}
            <div className="flex items-end justify-between w-full max-w-4xl mx-auto">
                {/* Primary Weapons Arsenal */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest px-1">
                        Primary Arsenal <span className="text-cyan-400">[Hold LMB | Cycle: Ctrl/Q]</span>
                    </span>
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10">
                        {allWeapons.filter(w => w.level > 0).map(w => {
                            const isActive = w.id === activeWeapon.id;
                            return (
                                <div
                                    key={w.id}
                                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                                        isActive
                                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                            : 'bg-white/5 border-transparent text-white/50'
                                    }`}
                                >
                                    {getWeaponIcon(w.icon)}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold tracking-tight">{w.name}</span>
                                        <span className="text-[8px] text-cyan-300">
                                            {w.isEvolved ? '★ EVOLVED' : `LV.${w.level}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Secondary Utilities */}
                <div className="flex flex-col gap-1 items-end">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest px-1">
                        Secondary Item <span className="text-rose-400">[RMB: Use | Space: Cycle]</span>
                    </span>
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10">
                        {allSecondaries.map(item => {
                            const isActive = item.id === activeSecondary.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                                        isActive
                                            ? 'bg-rose-500/20 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                                            : 'bg-white/5 border-transparent text-white/40'
                                    }`}
                                >
                                    {getSecondaryIcon(item.icon)}
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] font-bold">{item.name}</span>
                                        <span className="text-[8px] text-rose-300 font-mono">x{item.count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
