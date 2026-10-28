// apps/web/src/components/Soundstage/CinemaRemoteControl.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, RotateCcw, Volume2, VolumeX,
    Film, Clapperboard, FolderOpen, RefreshCw, X, Check,
    Clock, HardDrive, Video
} from 'lucide-react';

export interface CinemaRemoteControlProps {
    currentReel: string;
    isPlaying: boolean;
    isMuted: boolean;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onReelSelect: (reelName: string) => void;
    onSwitchToSoundstage: () => void;
}

export interface ScreeningItem {
    id: string;
    filename: string;
    title: string;
    url: string;
    sizeBytes: number;
    mtime: string;
}

export const CinemaRemoteControl: React.FC<CinemaRemoteControlProps> = ({
    currentReel,
    isPlaying,
    isMuted,
    onTogglePlay,
    onToggleMute,
    onReelSelect,
    onSwitchToSoundstage
}) => {
    const [progress, setProgress] = useState(0);
    const [screenings, setScreenings] = useState<ScreeningItem[]>([]);
    const [isLoadingScreenings, setIsLoadingScreenings] = useState(false);
    const [customFileName, setCustomFileName] = useState<string | null>(null);
    const [isVaultOpen, setIsVaultOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch dynamic screenings from the server folder (public/screenings)
    const fetchScreenings = async () => {
        setIsLoadingScreenings(true);
        try {
            const res = await fetch('/api/screenings');
            if (res.ok) {
                const data = await res.json();
                if (data.screenings && Array.isArray(data.screenings)) {
                    setScreenings(data.screenings);
                }
            }
        } catch (err) {
            console.warn('[CinemaRemoteControl] Failed to fetch screenings:', err);
        } finally {
            setIsLoadingScreenings(false);
        }
    };

    useEffect(() => {
        fetchScreenings();
    }, []);

    // Listen for in-world triggers (e.g. clicking the 3D Projection Booth Console)
    useEffect(() => {
        const handleOpenVault = () => setIsVaultOpen(true);
        const handleNewScreening = (e: any) => {
            fetchScreenings();
            if (e.detail?.filename) {
                onReelSelect(e.detail.filename);
            }
        };

        window.addEventListener('myos:open-cinema-vault', handleOpenVault);
        window.addEventListener('myos:new-screening-ready', handleNewScreening);
        return () => {
            window.removeEventListener('myos:open-cinema-vault', handleOpenVault);
            window.removeEventListener('myos:new-screening-ready', handleNewScreening);
        };
    }, [onReelSelect]);

    // Simulated progress tick when playing
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setProgress(prev => (prev >= 100 ? 0 : prev + 0.5));
        }, 200);
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Handle Native File Chooser selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const blobUrl = URL.createObjectURL(file);
            setCustomFileName(file.name);
            onReelSelect(blobUrl);
            setProgress(0);
        }
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '';
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const getActiveTitle = () => {
        if (customFileName) return customFileName;
        const found = screenings.find(s => s.id === currentReel || s.url === currentReel || currentReel.endsWith(s.filename));
        if (found) return found.title;
        const clean = currentReel.split('/').pop()?.replace(/\.[^/.]+$/, '') || currentReel;
        return clean.replace(/_/g, ' ').toUpperCase();
    };

    return (
        <>
            {/* Hidden native OS file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* EXPANDABLE FILM VAULT DRAWER */}
            <AnimatePresence>
                {isVaultOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.96 }}
                        className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[10000] pointer-events-auto bg-slate-950/95 backdrop-blur-2xl border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.3)] rounded-2xl p-6 text-white w-[94%] max-w-4xl max-h-[65vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
                                    <Film size={22} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black tracking-wide text-white flex items-center gap-2">
                                        CINEMA SCREENINGS VAULT
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-500/50 text-rose-300 font-mono">
                                            {screenings.length} REELS ON DISK
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Directory: <span className="font-mono text-slate-300">apps/web/public/screenings/</span> or pick any video from your PC
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchScreenings}
                                    disabled={isLoadingScreenings}
                                    className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                                    title="Rescan folder"
                                >
                                    <RefreshCw size={14} className={isLoadingScreenings ? 'animate-spin' : ''} />
                                    <span>Sync</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-2 bg-rose-500 hover:bg-rose-400 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                >
                                    <FolderOpen size={14} />
                                    <span>Browse PC Files...</span>
                                </button>
                                <button
                                    onClick={() => setIsVaultOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Screening List Table */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                            {screenings.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 border border-dashed border-white/10 rounded-xl">
                                    <Video size={36} className="mx-auto mb-2 text-slate-500" />
                                    <p className="text-sm font-bold">No generated screenings found in folder.</p>
                                    <p className="text-xs text-slate-500 mt-1">Use the Soundstage Studio or "Browse PC Files" to screen a video.</p>
                                </div>
                            ) : (
                                screenings.map((item) => {
                                    const isCurrent = currentReel === item.id || currentReel === item.url || currentReel.endsWith(item.filename);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setCustomFileName(null);
                                                onReelSelect(item.id);
                                                setProgress(0);
                                                setIsVaultOpen(false);
                                            }}
                                            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                                isCurrent
                                                    ? 'bg-rose-500/20 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                                                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isCurrent ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                                                    <Film size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xs font-black text-white">{item.title}</h3>
                                                        {isCurrent && (
                                                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white font-black tracking-wider flex items-center gap-1">
                                                                <Check size={10} /> Active Screen
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mt-0.5">
                                                        <span className="truncate max-w-[260px]">{item.filename}</span>
                                                        {item.sizeBytes > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <HardDrive size={11} /> {formatSize(item.sizeBytes)}
                                                            </span>
                                                        )}
                                                        {item.mtime && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={11} /> {formatDate(item.mtime)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                                    isCurrent
                                                        ? 'bg-rose-500 text-white'
                                                        : 'bg-white/10 hover:bg-rose-500 hover:text-white text-slate-300'
                                                }`}
                                            >
                                                <Play size={12} />
                                                <span>{isCurrent ? 'Now Playing' : 'Screen Reel'}</span>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CINEMA REMOTE DOCK */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto bg-black/85 backdrop-blur-xl border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)] rounded-2xl px-6 py-3 flex items-center gap-4 text-white max-w-5xl w-[94%]"
            >
                {/* Reel Icon & Current Title */}
                <div className="flex items-center gap-3 min-w-[200px] max-w-[240px]">
                    <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 flex-shrink-0">
                        <Film size={20} className={isPlaying ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80">Now Screening</span>
                        <span className="text-xs font-black truncate text-white" title={getActiveTitle()}>
                            {getActiveTitle()}
                        </span>
                    </div>
                </div>

                {/* Scrubber Bar */}
                <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
                    <div
                        className="w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const pct = (clickX / rect.width) * 100;
                            setProgress(Math.max(0, Math.min(100, pct)));
                        }}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                        <span>{Math.floor((progress / 100) * 120)}s</span>
                        <span>120s</span>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={() => setProgress(0)}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                        title="Restart Reel"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        onClick={onTogglePlay}
                        className="w-10 h-10 bg-rose-500 hover:bg-rose-400 rounded-xl flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                    </button>
                    <button
                        onClick={onToggleMute}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} />}
                    </button>
                </div>

                {/* Dynamic Screenings Quick Dropdown */}
                <div className="relative flex-shrink-0">
                    <select
                        value={currentReel}
                        onChange={(e) => {
                            setCustomFileName(null);
                            onReelSelect(e.target.value);
                            setProgress(0);
                        }}
                        className="bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-rose-400 cursor-pointer max-w-[170px] truncate"
                    >
                        {customFileName && (
                            <option value={currentReel} className="bg-slate-950 text-rose-300">
                                📁 {customFileName}
                            </option>
                        )}
                        {screenings.map(r => (
                            <option key={r.id} value={r.id} className="bg-slate-950 text-white">
                                {r.title} ({formatSize(r.sizeBytes)})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Film Vault Button */}
                <button
                    onClick={() => setIsVaultOpen(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                        isVaultOpen
                            ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                            : 'bg-white/10 hover:bg-white/20 border-white/20 text-rose-300'
                    }`}
                    title="Open Screenings Vault"
                >
                    <Film size={14} />
                    <span>Vault ({screenings.length})</span>
                </button>

                {/* Open Local Video File from OS File System */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-amber-300 transition-colors whitespace-nowrap flex-shrink-0"
                    title="Open video file from your file system"
                >
                    <FolderOpen size={14} />
                    <span>Open File...</span>
                </button>

                {/* Quick Switch to Production Soundstage */}
                <button
                    onClick={onSwitchToSoundstage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold tracking-wider uppercase text-cyan-300 transition-colors whitespace-nowrap flex-shrink-0"
                    title="Go to Soundstage Set"
                >
                    <Clapperboard size={14} />
                    <span>Stage</span>
                </button>
            </motion.div>
        </>
    );
};

export default CinemaRemoteControl;
