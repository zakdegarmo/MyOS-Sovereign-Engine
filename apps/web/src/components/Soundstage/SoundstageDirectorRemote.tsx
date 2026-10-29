// apps/web/src/components/Soundstage/SoundstageDirectorRemote.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
    Clapperboard, Play, Square, Circle, RotateCcw,
    User, UserX, Bot, Film, Sparkles, Check
} from 'lucide-react';
import { FILM_CHARACTER_ARCHETYPES } from '../World/filmArchetypes';

export interface SoundstageDirectorRemoteProps {
    selectedArchetype: string;
    onSelectArchetype: (archetypeId: string) => void;
    isActionRunning: boolean;
    onCallAction: () => void;
    onResetStage: () => void;
    isRecording: boolean;
    recordingDuration: string;
    onRecordTake: () => void;
    onStopRecording: () => void;
    filmUserSprite: boolean;
    onToggleFilmUser: () => void;
    filmCompanionSprite: boolean;
    onToggleFilmCompanion: () => void;
    onSwitchToCinema: () => void;
}

export const SoundstageDirectorRemote: React.FC<SoundstageDirectorRemoteProps> = ({
    selectedArchetype,
    onSelectArchetype,
    isActionRunning,
    onCallAction,
    onResetStage,
    isRecording,
    recordingDuration,
    onRecordTake,
    onStopRecording,
    filmUserSprite,
    onToggleFilmUser,
    filmCompanionSprite,
    onToggleFilmCompanion,
    onSwitchToCinema
}) => {
    const currentArchetype = FILM_CHARACTER_ARCHETYPES[selectedArchetype] || FILM_CHARACTER_ARCHETYPES.larry_technician;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto bg-black/85 backdrop-blur-xl border border-rose-500/40 shadow-[0_0_35px_rgba(244,63,94,0.25)] rounded-2xl px-5 py-3 flex items-center gap-3 text-white max-w-5xl w-[95%]"
        >
            {/* STAGE HEADER & ARCHETYPE BADGE */}
            <div className="flex items-center gap-3 min-w-[210px] max-w-[250px] border-r border-white/10 pr-3">
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 flex-shrink-0">
                    <Clapperboard size={20} className={isActionRunning ? 'animate-pulse' : ''} />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">STAGE DIRECTOR</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isRecording 
                                ? 'bg-rose-500 text-white animate-pulse' 
                                : isActionRunning 
                                    ? 'bg-amber-500/30 text-amber-300' 
                                    : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                            {isRecording ? `REC ${recordingDuration}` : isActionRunning ? 'ROLLING' : 'READY'}
                        </span>
                    </div>
                    <span className="text-xs font-black truncate text-white" title={`${currentArchetype.name} - ${currentArchetype.title}`}>
                        {currentArchetype.name} • {currentArchetype.title}
                    </span>
                </div>
            </div>

            {/* ARCHETYPE SELECTOR */}
            <div className="flex-shrink-0">
                <select
                    value={selectedArchetype}
                    onChange={(e) => onSelectArchetype(e.target.value)}
                    className="bg-slate-900 border border-white/20 rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none focus:border-rose-400 cursor-pointer max-w-[170px] truncate"
                    title="Select Lead Character Archetype"
                >
                    {Object.values(FILM_CHARACTER_ARCHETYPES).map(a => (
                        <option key={a.id} value={a.id} className="bg-slate-950 text-white">
                            {a.name} ({a.genre})
                        </option>
                    ))}
                </select>
            </div>

            {/* CHOREOGRAPHY CONTROLS */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                    onClick={onCallAction}
                    disabled={isActionRunning}
                    className={`px-3 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                        isActionRunning
                            ? 'bg-amber-500 text-black animate-pulse cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                    }`}
                    title="Call Action (Move from Mark A to Mark Center and execute hero action)"
                >
                    <Play size={13} className="fill-black" />
                    <span>{isActionRunning ? 'Action...' : 'Action'}</span>
                </button>

                <button
                    onClick={onResetStage}
                    className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 hover:text-white transition-colors"
                    title="Reset Actor to Mark A"
                >
                    <RotateCcw size={15} />
                </button>
            </div>

            {/* RECORD TAKE BUTTON */}
            <div className="flex-shrink-0">
                {isRecording ? (
                    <button
                        onClick={onStopRecording}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse"
                        title="Stop recording and save take to Cinema Vault"
                    >
                        <Square size={13} className="fill-white" />
                        <span>Stop ({recordingDuration})</span>
                    </button>
                ) : (
                    <button
                        onClick={onRecordTake}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 border border-rose-500/60 text-rose-300 hover:text-white font-black text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                        title="Record 60fps take directly to MP4"
                    >
                        <Circle size={12} className="fill-rose-500 text-rose-500 animate-pulse" />
                        <span>Record Take</span>
                    </button>
                )}
            </div>

            <div className="w-px h-7 bg-white/10 mx-1 flex-shrink-0" />

            {/* SPRITE FILMING TOGGLES (USER & COMPANION) */}
            <div className="flex items-center gap-2 flex-1 justify-center">
                {/* Film User Sprite Toggle */}
                <button
                    onClick={onToggleFilmUser}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        filmUserSprite
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-400 hover:text-slate-300'
                    }`}
                    title={filmUserSprite ? 'User sprite is in shot (Click to hide from film)' : 'User sprite hidden from film (Click to include in shot)'}
                >
                    {filmUserSprite ? <User size={13} className="text-cyan-400" /> : <UserX size={13} className="text-slate-500" />}
                    <span>Film User: {filmUserSprite ? 'ON' : 'OFF'}</span>
                </button>

                {/* Film Companion Sprite Toggle */}
                <button
                    onClick={onToggleFilmCompanion}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        filmCompanionSprite
                            ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-400 hover:text-slate-300'
                    }`}
                    title={filmCompanionSprite ? 'Companion sprite is in shot (Click to hide from film)' : 'Companion sprite hidden from film (Click to include in shot)'}
                >
                    <Bot size={13} className={filmCompanionSprite ? 'text-purple-400' : 'text-slate-500'} />
                    <span>Companion: {filmCompanionSprite ? 'ON' : 'OFF'}</span>
                </button>
            </div>

            {/* SCREENING THEATER SHORTCUT */}
            <button
                onClick={onSwitchToCinema}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 hover:bg-rose-400 border border-rose-400 rounded-xl text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] whitespace-nowrap flex-shrink-0"
                title="Enter The Grand Cinema to screen takes"
            >
                <Film size={14} />
                <span>➔ Cinema Theater</span>
            </button>
        </motion.div>
    );
};

export default SoundstageDirectorRemote;
