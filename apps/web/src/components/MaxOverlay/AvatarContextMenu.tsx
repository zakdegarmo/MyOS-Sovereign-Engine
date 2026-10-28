import React from 'react';
import type { AgentId } from '../../council/agentRegistry';
import { X, Target, Zap, Footprints, Repeat, DollarSign, MessageSquare, ExternalLink, User, Layers } from 'lucide-react';

interface AvatarContextMenuProps {
    agentId: AgentId;
    x: number;
    y: number;
    isFollowing?: boolean;
    onClose: () => void;
    onAction: (action: string, payload?: any) => void;
}

export const AvatarContextMenu: React.FC<AvatarContextMenuProps> = ({ agentId, x, y, isFollowing = false, onClose, onAction }) => {
    // Prevent clipping off-screen (simple clamp)
    const style = {
        top: Math.min(y, window.innerHeight - 420),
        left: Math.min(x, window.innerWidth - 300),
    };

    return (
        <div
            className="fixed z-[3000000] w-80 bg-slate-950/95 border-2 border-cyan-500/80 rounded-2xl text-white overflow-hidden font-mono text-sm pointer-events-auto shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border-b border-cyan-500/30">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-bold text-cyan-300 uppercase tracking-widest text-xs">{agentId} Protocol</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                    <X size={16} />
                </button>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col p-2 space-y-1 max-h-[460px] overflow-y-auto custom-scrollbar">

                {/* AI & Communication Group */}
                <div className="px-2 py-1 text-[10px] text-cyan-500/70 font-black uppercase tracking-widest">Neural Link & AI</div>

                <button
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-all text-xs font-bold"
                    onClick={() => onAction('open_ai_chat')}
                >
                    <div className="flex items-center gap-2.5">
                        <MessageSquare size={15} className="text-cyan-400" />
                        <span>AI Assistant Terminal</span>
                    </div>
                    <span className="text-[9px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 border border-cyan-500/40">LOCAL LLM</span>
                </button>

                <button
                    className="flex items-center px-3 py-2 rounded-xl hover:bg-white/5 transition-colors gap-2.5 text-xs font-bold text-amber-300"
                    onClick={() => onAction('trigger_bark')}
                >
                    <Zap size={15} className="text-amber-400" />
                    <span>Speak (Environmental Thought)</span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                {/* Physical Locomotion Group */}
                <div className="px-2 py-1 text-[10px] text-purple-400/70 font-black uppercase tracking-widest">3D Physical Locomotion</div>

                <button
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-bold border ${
                        isFollowing
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : 'hover:bg-white/5 text-slate-200 border-transparent'
                    }`}
                    onClick={() => onAction('toggle_follow')}
                >
                    <div className="flex items-center gap-2.5">
                        <User size={15} className="text-purple-400" />
                        <span>Follow Companion</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                        isFollowing ? 'bg-purple-500 text-black font-black' : 'bg-white/10 text-white/50'
                    }`}>
                        {isFollowing ? 'FOLLOWING' : 'STATIONARY'}
                    </span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                {/* Physical Emotes Group */}
                <div className="px-2 py-1 text-[10px] text-emerald-400/70 font-black uppercase tracking-widest">Physical Gestures</div>

                <div className="grid grid-cols-2 gap-1 px-1">
                    <button
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-colors text-left flex items-center gap-1.5"
                        onClick={() => onAction('emote_spellcast')}
                    >
                        <span>✨</span> Spellcast
                    </button>
                    <button
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-colors text-left flex items-center gap-1.5"
                        onClick={() => onAction('emote_slash')}
                    >
                        <span>⚔️</span> Slash Attack
                    </button>
                    <button
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-colors text-left flex items-center gap-1.5"
                        onClick={() => onAction('emote_bow')}
                    >
                        <span>🏹</span> Bow Action
                    </button>
                    <button
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-colors text-left flex items-center gap-1.5"
                        onClick={() => onAction('emote_hurt')}
                    >
                        <span>🛡️</span> Defensive Stance
                    </button>
                </div>

                <div className="h-px bg-white/10 my-1 mx-2" />

                {/* System & Inventory Group */}
                <div className="px-2 py-1 text-[10px] text-slate-500 font-black uppercase tracking-widest">Vault & System</div>

                <button
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 transition-colors text-xs font-bold text-red-300"
                    onClick={() => onAction('equip_uniracer')}
                >
                    <div className="flex items-center gap-2.5">
                        <Zap size={15} className="text-red-400 animate-pulse" />
                        <span>Ride Sovereign Uniracer</span>
                    </div>
                    <span className="text-[9px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-300 border border-red-500/40 font-mono">WASDQERF</span>
                </button>


                <button
                    className="flex items-center px-3 py-2 rounded-xl hover:bg-white/5 transition-colors gap-2.5 text-xs font-bold text-amber-400"
                    onClick={() => onAction('open_character_sheet')}
                >
                    <User size={15} />
                    <span>Hero Archetype Vault</span>
                </button>

                <button
                    className="flex items-center px-3 py-2 rounded-xl hover:bg-white/5 transition-colors gap-2.5 text-xs font-bold text-cyan-400"
                    onClick={() => onAction('open_inventory')}
                >
                    <Layers size={15} />
                    <span>Companion Inventory</span>
                </button>

                <button
                    className="flex items-center px-3 py-2 rounded-xl hover:bg-indigo-900/40 transition-colors gap-2.5 text-xs font-bold text-indigo-300"
                    onClick={() => onAction('manifest_3d')}
                >
                    <Layers size={15} />
                    <span>NEO-Retro: Manifest 3D</span>
                </button>
            </div>
        </div>
    );
};
