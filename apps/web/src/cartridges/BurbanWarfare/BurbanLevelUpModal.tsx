/**
 * BurbanWarfare/BurbanLevelUpModal.tsx
 * 
 * Vampire Survivors style Level-Up Modal.
 * Offers 3 randomized weapon / stat upgrade cards with retro synth styling.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Droplets, Bomb, Disc, Snowflake, Zap, Heart, Flame, Compass } from 'lucide-react';
import type { UpgradeCard, WeaponDefinition, WeaponType } from './types';

interface BurbanLevelUpModalProps {
    level: number;
    weapons: Record<WeaponType, WeaponDefinition>;
    onSelectUpgrade: (card: UpgradeCard) => void;
}

const getUpgradeIcon = (icon: string) => {
    switch (icon) {
        case 'Droplets': return <Droplets size={28} className="text-cyan-400" />;
        case 'Bomb': return <Bomb size={28} className="text-rose-400" />;
        case 'Disc': return <Disc size={28} className="text-lime-400" />;
        case 'Snowflake': return <Snowflake size={28} className="text-sky-300" />;
        case 'Zap': return <Zap size={28} className="text-yellow-400" />;
        case 'Heart': return <Heart size={28} className="text-red-400" />;
        case 'Flame': return <Flame size={28} className="text-orange-400" />;
        default: return <Sparkles size={28} className="text-purple-400" />;
    }
};

export const BurbanLevelUpModal: React.FC<BurbanLevelUpModalProps> = ({
    level,
    weapons,
    onSelectUpgrade
}) => {
    // Generate 3 randomized candidate upgrade cards
    const upgradeCards = useMemo<UpgradeCard[]>(() => {
        const pool: UpgradeCard[] = [];

        // Weapon upgrades / unlocks
        Object.values(weapons).forEach(w => {
            if (w.level === 0) {
                pool.push({
                    id: `unlock_${w.id}`,
                    title: `NEW: ${w.name}`,
                    type: 'weapon_new',
                    weaponId: w.id,
                    description: w.description,
                    icon: w.icon,
                    levelAfter: 1
                });
            } else if (w.level < w.maxLevel) {
                pool.push({
                    id: `upgrade_${w.id}`,
                    title: `${w.name} (LV.${w.level + 1})`,
                    type: 'weapon_upgrade',
                    weaponId: w.id,
                    description: w.level + 1 === w.maxLevel 
                        ? `EVOLUTION: ${w.evolutionName}! Extreme damage & special bonuses!` 
                        : `Increases damage by 35% and adds extra projectiles.`,
                    icon: w.icon,
                    levelAfter: w.level + 1
                });
            }
        });

        // Stat perks
        pool.push({
            id: 'stat_speed',
            title: 'Sneaker Turbo Laces',
            type: 'stat_boost',
            description: '+20% Permanent Movement Speed.',
            icon: 'Zap'
        });
        pool.push({
            id: 'stat_damage',
            title: 'Sugar Rush Energy',
            type: 'stat_boost',
            description: '+25% All Weapon Damage.',
            icon: 'Flame'
        });
        pool.push({
            id: 'stat_magnet',
            title: 'Suburban Vacuum Nozzle',
            type: 'stat_boost',
            description: '+8m XP Gem Collection Magnet Radius.',
            icon: 'Compass'
        });
        pool.push({
            id: 'stat_health',
            title: 'Super Vitamin Gummy',
            type: 'stat_boost',
            description: '+40 Max HP & Full Immediate Heal.',
            icon: 'Heart'
        });

        // Shuffle and pick 3
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }, [weapons, level]);

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 font-mono select-none">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="w-full max-w-2xl bg-slate-900/90 border-4 border-yellow-400 rounded-3xl p-6 shadow-[0_0_50px_rgba(250,204,21,0.4)] flex flex-col items-center gap-6"
            >
                {/* Header Banner */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-yellow-400 font-black text-2xl uppercase tracking-widest animate-pulse">
                        <Sparkles size={24} />
                        <span>LEVEL UP! (LV.{level})</span>
                        <Sparkles size={24} />
                    </div>
                    <span className="text-xs text-white/50 uppercase tracking-widest mt-1">
                        Choose your suburban tactical upgrade
                    </span>
                </div>

                {/* 3 Upgrade Cards */}
                <div className="grid grid-cols-3 gap-4 w-full">
                    {upgradeCards.map((card, idx) => (
                        <motion.button
                            key={card.id}
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onSelectUpgrade(card)}
                            className="bg-black/60 hover:bg-yellow-500/10 border-2 border-white/10 hover:border-yellow-400 p-4 rounded-2xl flex flex-col items-center text-center justify-between gap-3 transition-all shadow-lg group cursor-pointer"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center group-hover:border-yellow-400 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-all">
                                {getUpgradeIcon(card.icon)}
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <h4 className="text-xs font-black text-yellow-200 group-hover:text-yellow-300 leading-tight">
                                    {card.title}
                                </h4>
                                <p className="text-[10px] text-white/70 leading-relaxed mt-1">
                                    {card.description}
                                </p>
                            </div>

                            <div className="w-full py-1 bg-yellow-500/20 group-hover:bg-yellow-400 text-yellow-300 group-hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-all">
                                Select [Key {idx + 1}]
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
