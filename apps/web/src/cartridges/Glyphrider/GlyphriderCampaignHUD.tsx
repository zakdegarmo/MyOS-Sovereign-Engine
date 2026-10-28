/**
 * Glyphrider/GlyphriderCampaignHUD.tsx
 * 
 * 90s Esports Broadcast Overlay HUD for Glyphrider: Uniracer League Reboot.
 * Features speed gauge, nitro bar, trick combo tickers, mock-MMO live chat,
 * leaderboard standings, and chapter dialogue modals.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, Trophy, Flame, Play, FastForward, Award, Radio, 
    RotateCcw, Sparkles, MessageSquare, ChevronRight 
} from 'lucide-react';
import type { CampaignChapter } from './campaign/UniracerCampaign';
import { type LeaderboardEntry, MOCK_CHAT_MESSAGES } from './campaign/mockLeaderboard';

interface GlyphriderCampaignHUDProps {
    currentChapter: CampaignChapter;
    score: number;
    speed: number;
    boost: number;
    lastTrick: { name: string; points: number } | null;
    leaderboard: LeaderboardEntry[];
    isBriefingOpen: boolean;
    isVictoryOpen: boolean;
    onStartChapter: () => void;
    onNextChapter: () => void;
    onRestartChapter: () => void;
}

export const GlyphriderCampaignHUD: React.FC<GlyphriderCampaignHUDProps> = ({
    currentChapter,
    score,
    speed,
    boost,
    lastTrick,
    leaderboard,
    isBriefingOpen,
    isVictoryOpen,
    onStartChapter,
    onNextChapter,
    onRestartChapter
}) => {
    const [chatMessages, setChatMessages] = useState<string[]>([
        "Connecting to Global Uniracer Network...",
        "Lobby: 1,420 Spectators live.",
        "Red Mike joined the track!"
    ]);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

    // Simulated live Twitch chat feed
    useEffect(() => {
        const interval = setInterval(() => {
            const randomMsg = MOCK_CHAT_MESSAGES[Math.floor(Math.random() * MOCK_CHAT_MESSAGES.length)];
            setChatMessages(prev => [...prev.slice(-6), randomMsg]);
        }, 4500);
        return () => clearInterval(interval);
    }, []);

    const targetScore = currentChapter.winCondition.targetScore || 2000;
    const progressPercent = Math.min(100, (score / targetScore) * 100);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono select-none z-30">
            {/* --- TOP BAR: CHAPTER & BROADCAST HEADER --- */}
            <header className="flex items-center justify-between w-full max-w-5xl mx-auto bg-black/75 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-cyan-500/30 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/40 text-cyan-400">
                        <Radio size={18} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-black text-xs uppercase tracking-wider">
                                {currentChapter.title}
                            </span>
                            <span className="text-[8px] bg-red-600 px-1.5 py-0.5 rounded text-white font-bold animate-pulse">
                                LIVE ON AIR
                            </span>
                        </div>
                        <span className="text-[10px] text-white/50">{currentChapter.subtitle}</span>
                    </div>
                </div>

                {/* Score & Progress */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest">Stunt Score</span>
                        <div className="text-xl font-black text-yellow-300 font-mono tracking-tight">
                            {score.toLocaleString()} <span className="text-xs text-yellow-500">PTS</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
                        className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-400/30 border border-yellow-400/40 rounded-xl text-yellow-300 text-xs font-bold transition-all"
                    >
                        <Trophy size={14} />
                        <span>Rankings</span>
                    </button>
                </div>
            </header>

            {/* --- TRICK NOTIFICATION BANNER (Center Screen) --- */}
            <AnimatePresence>
                {lastTrick && (
                    <motion.div
                        key={`${lastTrick.name}-${score}`}
                        initial={{ scale: 0.7, y: -20, opacity: 0 }}
                        animate={{ scale: 1.1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', damping: 12 }}
                        className="self-center bg-gradient-to-r from-pink-600/90 via-purple-600/90 to-cyan-600/90 border-2 border-yellow-300 px-6 py-2.5 rounded-2xl shadow-[0_0_35px_rgba(236,72,153,0.8)] flex items-center gap-3"
                    >
                        <Sparkles size={20} className="text-yellow-300 animate-spin" />
                        <div className="flex flex-col items-center">
                            <span className="text-white font-black text-sm uppercase tracking-widest drop-shadow-md">
                                {lastTrick.name}
                            </span>
                            <span className="text-yellow-200 font-extrabold text-xs">
                                +{lastTrick.points} POINTS!
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- BOTTOM SECTION: CHAT, SPEEDOMETER & LEADERBOARD --- */}
            <div className="flex items-end justify-between w-full max-w-5xl mx-auto">
                {/* Mock-MMO Twitch/Esports Chat Stream */}
                <div className="w-72 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col gap-1 shadow-lg">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 text-white/50 text-[9px] uppercase font-bold tracking-wider">
                        <MessageSquare size={12} className="text-cyan-400" />
                        <span>Live Broadcast Chat</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1 text-[10px] text-white/80 h-24 overflow-hidden justify-end">
                        {chatMessages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="truncate"
                            >
                                <span className="text-cyan-400 font-bold">UnicycleFan_{i + 1}: </span>
                                <span>{msg}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Speedometer Gauge & Nitro Boost */}
                <div className="flex flex-col items-center gap-1 bg-black/75 backdrop-blur-md px-6 py-3 rounded-2xl border border-cyan-400/40 shadow-2xl">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-cyan-300 font-mono">
                            {Math.floor(speed)}
                        </span>
                        <span className="text-xs text-cyan-400 font-bold">MPH</span>
                    </div>

                    {/* Nitro Gauge */}
                    <div className="flex items-center gap-2 w-44">
                        <Flame size={14} className="text-orange-400 fill-orange-400 animate-pulse" />
                        <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-orange-400/30">
                            <motion.div
                                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                                style={{ width: `${Math.min(100, boost)}%` }}
                            />
                        </div>
                    </div>

                    {/* Controls Reminder */}
                    <span className="text-[8px] text-white/40 uppercase tracking-widest mt-1">
                        [W/Up] Gas | [Space] Jump | [A/D] Flips | [Q/E] Twists
                    </span>
                </div>
            </div>

            {/* --- LEADERBOARD MODAL SLIDEOUT --- */}
            <AnimatePresence>
                {isLeaderboardOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="pointer-events-auto absolute right-6 top-20 w-80 bg-slate-900/95 border-2 border-yellow-400/50 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                            <div className="flex items-center gap-2 text-yellow-300 font-black text-xs uppercase tracking-wider">
                                <Trophy size={16} />
                                <span>Global Uniracer Standings</span>
                            </div>
                            <button
                                onClick={() => setIsLeaderboardOpen(false)}
                                className="text-white/40 hover:text-white text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {leaderboard.map(entry => (
                                <div
                                    key={entry.rank}
                                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                                        entry.isPlayer
                                            ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200'
                                            : 'bg-white/5 border-transparent text-white/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="font-bold text-[10px] w-4 text-white/40">#{entry.rank}</span>
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: entry.avatarColor }}
                                        />
                                        <span className="font-bold truncate">{entry.name}</span>
                                    </div>
                                    <span className="font-mono font-black text-yellow-300 text-right">
                                        {entry.score.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- STORY BRIEFING MODAL (Chapter Start) --- */}
            <AnimatePresence>
                {isBriefingOpen && (
                    <div className="pointer-events-auto absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="max-w-xl w-full bg-slate-900 border-4 border-cyan-400 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.5)] flex flex-col gap-5"
                        >
                            <div className="border-b border-white/10 pb-3">
                                <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest">
                                    {currentChapter.subtitle}
                                </span>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase mt-0.5">
                                    {currentChapter.title}
                                </h3>
                            </div>

                            {/* Dialogue Lines */}
                            <div className="flex flex-col gap-3">
                                {currentChapter.dialogue.map((d, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-black/40 p-3 rounded-2xl border border-white/5">
                                        <span className="text-2xl">{d.avatar}</span>
                                        <div>
                                            <h5 className="text-[11px] font-bold text-yellow-300">{d.speaker}</h5>
                                            <p className="text-xs text-white/90 italic mt-1 leading-relaxed">
                                                "{d.text}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Objective Box */}
                            <div className="bg-cyan-500/10 border border-cyan-400/40 p-3 rounded-xl flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-cyan-400">Chapter Objective</span>
                                    <span className="text-xs font-bold text-white mt-0.5">
                                        {currentChapter.winCondition.description}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] uppercase font-bold text-yellow-400">Reward</span>
                                    <div className="text-xs font-bold text-yellow-200 mt-0.5 truncate max-w-[160px]">
                                        {currentChapter.reward}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onStartChapter}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Play size={18} />
                                <span>Hit the Track! [Start]</span>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- VICTORY CHAPTER MODAL --- */}
            <AnimatePresence>
                {isVictoryOpen && (
                    <div className="pointer-events-auto absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="max-w-md w-full bg-slate-900 border-4 border-yellow-400 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(250,204,21,0.6)] flex flex-col items-center gap-4"
                        >
                            <Trophy size={48} className="text-yellow-400 animate-bounce" />
                            <h3 className="text-2xl font-black text-yellow-300 uppercase tracking-widest">
                                CHAPTER CLEARED!
                            </h3>
                            <p className="text-xs text-white/80 leading-relaxed">
                                Spectacular stunt runs! You cleared the challenge with <span className="text-yellow-300 font-bold">{score.toLocaleString()} Points</span>!
                            </p>
                            <div className="bg-yellow-500/10 border border-yellow-400/40 p-3 rounded-xl w-full text-center">
                                <span className="text-[9px] uppercase font-black text-yellow-400">UNLOCKED REWARD:</span>
                                <div className="text-xs font-bold text-white mt-1">{currentChapter.reward}</div>
                            </div>
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={onRestartChapter}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                    <RotateCcw size={14} />
                                    <span>Retry</span>
                                </button>
                                <button
                                    onClick={onNextChapter}
                                    className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span>Next Act</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
