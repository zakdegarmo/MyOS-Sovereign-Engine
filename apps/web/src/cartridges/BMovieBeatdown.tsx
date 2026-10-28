/**
 * BMovieBeatdown.tsx
 * 
 * 16-Bit Machinima Cartridge: B-Movie Beatdown
 * Retro side-scrolling B-Horror / Sci-Fi Beat 'Em Up Machinima episode.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Swords, Zap, Skull, ShieldAlert, Clapperboard, Sparkles, Volume2 } from 'lucide-react';
import type { CartridgeProps } from './Cartridge';

interface ScriptScene {
    id: number;
    title: string;
    setting: string;
    backgroundGradient: string;
    cameraZoom: number;
    heroPos: { x: number; y: number };
    heroAnim: 'idle' | 'walk' | 'punch' | 'kick' | 'special';
    bossPos: { x: number; y: number };
    bossAnim: 'idle' | 'approach' | 'attack' | 'hit' | 'defeated';
    speaker: 'hero' | 'boss' | 'director';
    dialogue: string;
    sfx?: string;
}

export const BMovieBeatdown: React.FC<CartridgeProps> = () => {
    const [sceneIndex, setSceneIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [heroHp, setHeroHp] = useState(100);
    const [bossHp, setBossHp] = useState(100);

    const scriptScenes: ScriptScene[] = [
        {
            id: 1,
            title: "ACT I: THE NEON SWAMP SET",
            setting: "FILM SET #4 - MUTANT SWAMP",
            backgroundGradient: "from-green-950 via-slate-950 to-emerald-950",
            cameraZoom: 1.0,
            heroPos: { x: 15, y: 55 },
            heroAnim: 'idle',
            bossPos: { x: 75, y: 55 },
            bossAnim: 'idle',
            speaker: 'director',
            dialogue: "SCENE 12: ATTACK OF THE MUTANT MEPHIT! ACTION!",
            sfx: "CLAP!"
        },
        {
            id: 2,
            title: "ACT I: CONFRONTATION",
            setting: "FILM SET #4 - MUTANT SWAMP",
            backgroundGradient: "from-green-900 via-slate-950 to-emerald-950",
            cameraZoom: 1.15,
            heroPos: { x: 35, y: 55 },
            heroAnim: 'walk',
            bossPos: { x: 65, y: 55 },
            bossAnim: 'approach',
            speaker: 'hero',
            dialogue: "Hold it right there, slimeball! This set is closed to unlicensed mutants!",
            sfx: "FOOTSTEPS"
        },
        {
            id: 3,
            title: "ACT II: BOSS TAUNT",
            setting: "MUTANT NEST",
            backgroundGradient: "from-purple-950 via-slate-950 to-green-950",
            cameraZoom: 1.25,
            heroPos: { x: 38, y: 55 },
            heroAnim: 'idle',
            bossPos: { x: 60, y: 55 },
            bossAnim: 'attack',
            speaker: 'boss',
            dialogue: "SKREEEE! You dare disturb the B-Movie Swamp Mephit?! Taste toxic slime!",
            sfx: "SLIME_BLAST"
        },
        {
            id: 4,
            title: "ACT II: HERO STRIKES",
            setting: "NEON BRAWL ZONE",
            backgroundGradient: "from-cyan-950 via-slate-950 to-green-900",
            cameraZoom: 1.35,
            heroPos: { x: 52, y: 55 },
            heroAnim: 'kick',
            bossPos: { x: 58, y: 55 },
            bossAnim: 'hit',
            speaker: 'hero',
            dialogue: "DIRECTOR'S CUT, BABY! HYAH!",
            sfx: "CRITICAL_HIT"
        },
        {
            id: 5,
            title: "ACT III: SPECIAL MOVE - NEON CYCLONE",
            setting: "CLIMAX ARENA",
            backgroundGradient: "from-pink-950 via-indigo-950 to-green-950",
            cameraZoom: 1.5,
            heroPos: { x: 55, y: 55 },
            heroAnim: 'special',
            bossPos: { x: 56, y: 55 },
            bossAnim: 'defeated',
            speaker: 'hero',
            dialogue: "SPECIAL TECHNIQUE: 16-BIT RETRO CYCLONE KICK!",
            sfx: "ULTIMATE_FINISHER"
        },
        {
            id: 6,
            title: "ACT III: THAT'S A WRAP!",
            setting: "VICTORY STAGE",
            backgroundGradient: "from-amber-950 via-slate-950 to-emerald-950",
            cameraZoom: 1.0,
            heroPos: { x: 50, y: 55 },
            heroAnim: 'idle',
            bossPos: { x: 80, y: 70 },
            bossAnim: 'defeated',
            speaker: 'director',
            dialogue: "CUT! PRINT IT! THAT'S A WRAP ON B-MOVIE BEATDOWN LEVEL 1!",
            sfx: "APPLAUSE"
        }
    ];

    const currentScene = scriptScenes[sceneIndex];

    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            setSceneIndex(prev => (prev + 1) % scriptScenes.length);
        }, 5500);
        return () => clearInterval(timer);
    }, [isPlaying, scriptScenes.length]);

    // Update HP meters dynamically based on scene
    useEffect(() => {
        if (sceneIndex <= 2) {
            setHeroHp(100);
            setBossHp(100);
        } else if (sceneIndex === 3) {
            setHeroHp(85);
            setBossHp(90);
        } else if (sceneIndex === 4) {
            setHeroHp(85);
            setBossHp(40);
        } else if (sceneIndex >= 5) {
            setHeroHp(100);
            setBossHp(0);
        }
    }, [sceneIndex]);

    return (
        <div className={`w-full h-full flex flex-col relative overflow-hidden bg-gradient-to-b ${currentScene.backgroundGradient} font-mono transition-all duration-1000`}>
            
            {/* --- 16-BIT HUD / SCOREBOARD --- */}
            <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs">
                {/* Hero HP */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 font-bold">
                        P1
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider">HERO (PLAYER 1)</span>
                        <div className="w-32 h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/20 p-0.5">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                                animate={{ width: `${heroHp}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Film Title */}
                <div className="flex flex-col items-center">
                    <span className="text-yellow-400 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <Film size={14} /> B-MOVIE BEATDOWN
                    </span>
                    <span className="text-[8px] text-white/50 tracking-widest">{currentScene.title}</span>
                </div>

                {/* Boss HP */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">MUTANT MEPHIT (BOSS)</span>
                        <div className="w-32 h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/20 p-0.5">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                animate={{ width: `${bossHp}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-400 font-bold">
                        B1
                    </div>
                </div>
            </div>

            {/* --- 2.5D STAGE / STAGE GRID --- */}
            <motion.div 
                className="flex-1 relative overflow-hidden flex items-center justify-center"
                animate={{ scale: currentScene.cameraZoom }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {/* 2.5D Perspective Floor Grid */}
                <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-emerald-950/80 to-transparent opacity-40 border-t border-emerald-500/20">
                    <div className="w-full h-full bg-[linear-gradient(to_right,#059669_1px,transparent_1px),linear-gradient(to_bottom,#059669_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
                </div>

                {/* --- HERO SPRITE (P1) --- */}
                <motion.div
                    className="absolute z-20 flex flex-col items-center"
                    animate={{ 
                        left: `${currentScene.heroPos.x}%`, 
                        top: `${currentScene.heroPos.y}%`
                    }}
                    transition={{ duration: 0.8, ease: "anticipate" }}
                >
                    {/* Hero Sprite Avatar Graphic */}
                    <div className="relative">
                        {currentScene.heroAnim === 'kick' && (
                            <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: [1, 1.5, 0] }}
                                className="absolute -right-12 top-0 text-cyan-400"
                            >
                                <Zap size={48} className="animate-spin" />
                            </motion.div>
                        )}
                        {currentScene.heroAnim === 'special' && (
                            <motion.div 
                                animate={{ rotate: 360, scale: [1, 1.4, 1] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                                className="absolute -inset-4 rounded-full bg-cyan-400/30 blur-md border border-cyan-400"
                            />
                        )}
                        <div className="w-16 h-24 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-2xl border-2 border-white shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center relative">
                            <Swords size={28} className="text-white" />
                            <div className="absolute top-2 w-10 h-3 bg-black/40 rounded-full" />
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-cyan-300 bg-black/70 px-2 py-0.5 rounded mt-1 border border-cyan-500/30">HERO</span>
                </motion.div>

                {/* --- BOSS MEPHIT SPRITE (B1) --- */}
                <motion.div
                    className="absolute z-20 flex flex-col items-center"
                    animate={{ 
                        left: `${currentScene.bossPos.x}%`, 
                        top: `${currentScene.bossPos.y}%`,
                        opacity: currentScene.bossAnim === 'defeated' ? 0.3 : 1,
                        rotate: currentScene.bossAnim === 'defeated' ? 90 : 0
                    }}
                    transition={{ duration: 0.8, ease: "anticipate" }}
                >
                    <div className="relative">
                        {currentScene.bossAnim === 'attack' && (
                            <motion.div 
                                initial={{ scale: 0, x: 0 }} 
                                animate={{ scale: 1.2, x: -40 }}
                                className="absolute left-0 top-4 text-purple-400"
                            >
                                <ShieldAlert size={36} className="animate-ping" />
                            </motion.div>
                        )}
                        <div className="w-20 h-28 bg-gradient-to-b from-purple-600 to-green-700 rounded-3xl border-2 border-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.7)] flex items-center justify-center relative">
                            <Skull size={34} className="text-green-300" />
                            {/* Toxic Spikes */}
                            <div className="absolute -top-3 w-4 h-4 bg-green-400 rotate-45 rounded-sm" />
                            <div className="absolute -top-3 left-2 w-4 h-4 bg-green-400 rotate-45 rounded-sm" />
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-purple-300 bg-black/70 px-2 py-0.5 rounded mt-1 border border-purple-500/30">SWAMP MEPHIT</span>
                </motion.div>

                {/* SFX Popups */}
                {currentScene.sfx && (
                    <motion.div
                        key={currentScene.sfx + sceneIndex}
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        animate={{ opacity: 1, scale: 1.4, y: -40 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-1/3 z-30 font-black text-2xl text-yellow-300 drop-shadow-[0_0_10px_rgba(234,179,8,1)] uppercase italic tracking-widest pointer-events-none"
                    >
                        💥 {currentScene.sfx} 💥
                    </motion.div>
                )}
            </motion.div>

            {/* --- CINEMATIC DIALOGUE BUBBLE --- */}
            <div className="relative z-40 bg-black/80 border-t-2 border-white/20 p-4 backdrop-blur-xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Clapperboard size={16} className="text-yellow-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                            {currentScene.speaker === 'hero' ? 'SPEAKER: HERO (PLAYER 1)' : (currentScene.speaker === 'boss' ? 'SPEAKER: MUTANT MEPHIT' : 'DIRECTOR VOICE')}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[9px] uppercase tracking-wider text-white transition-all"
                        >
                            {isPlaying ? 'PAUSE FILM' : 'RESUME FILM'}
                        </button>
                        <button 
                            onClick={() => setSceneIndex((sceneIndex + 1) % scriptScenes.length)}
                            className="px-2.5 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-[9px] uppercase tracking-wider text-yellow-400 border border-yellow-500/30 transition-all"
                        >
                            NEXT SCENE ➔
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentScene.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="text-sm md:text-base font-bold text-white tracking-wide leading-relaxed pl-2 border-l-4 border-yellow-400"
                    >
                        "{currentScene.dialogue}"
                    </motion.p>
                </AnimatePresence>

                {/* Timeline Progress bar */}
                <div className="flex gap-1.5 mt-2">
                    {scriptScenes.map((sc, idx) => (
                        <button
                            key={sc.id}
                            onClick={() => setSceneIndex(idx)}
                            className={`flex-1 h-1.5 rounded-full transition-all ${idx === sceneIndex ? 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,1)]' : 'bg-white/10 hover:bg-white/30'}`}
                            title={sc.title}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BMovieBeatdown;
