import React, { useState, useEffect } from 'react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    Flame,
    Layers,
    Play,
    Radio,
    RefreshCw,
    RotateCcw,
    Shield,
    Volume2,
    VolumeX,
    X,
    Zap
} from 'lucide-react';
import { usePrinterPanicStore } from '../../store/usePrinterPanicStore';
import { officeAudio } from '../../engine/OfficeAudioSynth';
import { PrinterPanicDialogue } from './PrinterPanicDialogue';

interface PrinterPanicHudProps {
    playerPos?: [number, number, number];
    onExit?: () => void;
}

export const PrinterPanicHud: React.FC<PrinterPanicHudProps> = ({
    playerPos,
    onExit
}) => {
    const [isMuted, setIsMuted] = useState(officeAudio.getMuted());
    const [activeDialogueNode, setActiveDialogueNode] = useState<string | null>('intro_patch_1');

    const panic = usePrinterPanicStore(s => s.panic);
    const throughput = usePrinterPanicStore(s => s.throughput);
    const targetQuota = usePrinterPanicStore(s => s.targetQuota);
    const printersFixed = usePrinterPanicStore(s => s.printersFixed);
    const totalPrinters = usePrinterPanicStore(s => s.totalPrinters);
    const serversRebooted = usePrinterPanicStore(s => s.serversRebooted);
    const totalServers = usePrinterPanicStore(s => s.totalServers);
    const guardsSlipped = usePrinterPanicStore(s => s.guardsSlipped);
    const elapsedSeconds = usePrinterPanicStore(s => s.elapsedSeconds);
    const gracePeriodRemaining = usePrinterPanicStore(s => s.gracePeriodRemaining);
    const setDialogueOpen = usePrinterPanicStore(s => s.setDialogueOpen);
    const gameStatus = usePrinterPanicStore(s => s.gameStatus);

    const thermalSlickCooldown = usePrinterPanicStore(s => s.thermalSlickCooldown);
    const memoCooldown = usePrinterPanicStore(s => s.memoCooldown);
    const caffeineRemaining = usePrinterPanicStore(s => s.caffeineRemaining);
    const activePrompt = usePrinterPanicStore(s => s.activePrompt);

    const isAutonomousMode = usePrinterPanicStore(s => s.isAutonomousMode);
    const autonomousStatus = usePrinterPanicStore(s => s.autonomousStatus);
    const autonomousThought = usePrinterPanicStore(s => s.autonomousThought);
    const toggleAutonomousMode = usePrinterPanicStore(s => s.toggleAutonomousMode);

    const transmissions = usePrinterPanicStore(s => s.transmissions);
    const victoryReport = usePrinterPanicStore(s => s.victoryReport);
    const restartShift = usePrinterPanicStore(s => s.restartShift);

    // Keep store synchronized with dialogue open status so panic timer pauses stress-free
    useEffect(() => {
        setDialogueOpen(activeDialogueNode !== null);
    }, [activeDialogueNode, setDialogueOpen]);

    const toggleAudio = () => {
        const next = !isMuted;
        setIsMuted(next);
        officeAudio.setMuted(next);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Keyboard shortcuts: 'T' for Comms Dialogue, 'Z' for Autonomous Mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
            if (e.code === 'KeyT') {
                e.preventDefault();
                setActiveDialogueNode(prev => prev ? null : 'intro_patch_1');
            } else if (e.code === 'KeyZ') {
                e.preventDefault();
                toggleAutonomousMode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleAutonomousMode]);

    const handleDialogueChoice = (nextNodeId: string, effect?: any) => {
        if (effect) {
            if (effect.panicDelta) {
                usePrinterPanicStore.setState(s => ({ panic: Math.max(0, Math.min(100, s.panic + effect.panicDelta)) }));
            }
            if (effect.throughputDelta) {
                usePrinterPanicStore.setState(s => ({ throughput: s.throughput + effect.throughputDelta }));
            }
            if (effect.caffeineBoost) {
                usePrinterPanicStore.getState().triggerCaffeine();
            }
        }
    };

    const latestTx = transmissions[transmissions.length - 1];

    // Panic colors
    const panicPercent = Math.min(100, Math.round(panic));
    const isPanicCritical = panicPercent >= 75;
    const panicColor = panicPercent > 70 ? '#ef4444' : panicPercent > 40 ? '#f59e0b' : '#10b981';

    // Throughput progress
    const throughputPercent = Math.min(100, Math.round((throughput / targetQuota) * 100));

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] font-sans select-none">
            {/* Top Bar: Panic vs Throughput Dual Balance Meters */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl pointer-events-auto flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4 bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
                    {/* Panic Meter */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle
                                    size={16}
                                    className={`${isPanicCritical ? 'animate-pulse text-red-500' : 'text-amber-400'}`}
                                />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                    District Panic
                                </span>
                            </div>
                            <span className="text-sm font-mono font-black" style={{ color: panicColor }}>
                                {panicPercent}% {isPanicCritical && '🚨 CRITICAL'}
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${panicPercent}%`,
                                    background: isPanicCritical
                                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                        : 'linear-gradient(90deg, #10b981, #f59e0b)',
                                    boxShadow: `0 0 12px ${panicColor}`
                                }}
                            />
                        </div>
                    </div>

                    {/* Throughput Meter */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                    Grid Throughput
                                </span>
                            </div>
                            <span className="text-sm font-mono font-black text-emerald-400">
                                {Math.round(throughput)} / {targetQuota} IOPS ({throughputPercent}%)
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div
                                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-teal-500 to-emerald-400"
                                style={{
                                    width: `${throughputPercent}%`,
                                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Orientation Grace Period Notice Banner */}
                {gracePeriodRemaining > 0 && (
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-blue-950/90 border border-cyan-400/60 rounded-xl text-cyan-200 font-mono text-xs shadow-[0_0_25px_rgba(6,182,212,0.3)] animate-pulse">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🛡️</span>
                            <span className="font-black uppercase tracking-wider text-cyan-300">
                                SHIFT ORIENTATION BRIEFING:
                            </span>
                            <span className="text-slate-300 font-medium hidden sm:inline">
                                District panic suspended — explore Sector-404 and get your bearings!
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-amber-300 bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-400/30">
                            <Clock size={13} className="text-amber-400 animate-spin" />
                            <span>{Math.ceil(gracePeriodRemaining)}s remaining</span>
                        </div>
                    </div>
                )}

                {/* Sub-header row: Objectives & Audio toggle */}
                <div className="flex items-center justify-between px-2 text-[11px] font-mono tracking-wide text-slate-300">
                    <div className="flex items-center gap-4 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className={printersFixed >= totalPrinters ? 'text-emerald-400' : 'text-slate-400'} />
                            Printers: <strong className="text-white">{printersFixed}/{totalPrinters}</strong>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="flex items-center gap-1.5">
                            <Layers size={13} className={serversRebooted >= totalServers ? 'text-emerald-400' : 'text-slate-400'} />
                            Racks: <strong className="text-white">{serversRebooted}/{totalServers}</strong>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="flex items-center gap-1.5">
                            <Shield size={13} className="text-cyan-400" />
                            Guards Slipped: <strong className="text-cyan-300">{guardsSlipped}</strong>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-amber-400" />
                            Shift Time: <strong className="text-amber-300">{formatTime(elapsedSeconds)}</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleAutonomousMode}
                            className={`px-3 py-1 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isAutonomousMode
                                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse'
                                    : 'bg-slate-950/70 hover:bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
                            }`}
                            title="Toggle Autonomous Local Model Idle Mode [Z]"
                        >
                            <span>🤖</span>
                            <span>{isAutonomousMode ? '[Z] AUTONOMOUS ON' : '[Z] AUTONOMOUS AGENT'}</span>
                        </button>

                        <button
                            onClick={toggleAudio}
                            className="bg-slate-950/70 hover:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                            title="Toggle SFX"
                        >
                            {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-emerald-400" />}
                            <span>{isMuted ? 'Muted' : 'SFX'}</span>
                        </button>

                        {onExit && (
                            <button
                                onClick={onExit}
                                className="bg-slate-950/70 hover:bg-red-950/60 px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 hover:text-red-300 transition-all flex items-center gap-1"
                            >
                                <X size={14} />
                                <span>Exit</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Autonomous Neural Stream Ticker */}
                {isAutonomousMode && (
                    <div className="flex flex-col gap-1 bg-cyan-950/90 border border-cyan-400/50 backdrop-blur-xl px-4 py-2 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider">
                            <span className="text-cyan-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                <span>AI NEURAL CORE:</span>
                                <span className="text-amber-300">{autonomousStatus}</span>
                            </span>
                            <span className="text-cyan-400/70 text-[9px]">[PRESS Z FOR MANUAL CONTROL]</span>
                        </div>
                        {autonomousThought && (
                            <div className="text-xs font-mono italic text-slate-200">
                                💭 "{autonomousThought}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Left: Procedural SysAdmin Comms Radio Feed (Only visible when story dialogue is closed to prevent overlap) */}
            {!activeDialogueNode && (
                <div className="absolute bottom-8 sm:bottom-10 left-6 w-80 sm:w-96 pointer-events-auto">
                    <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.7)] flex flex-col gap-2">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-cyan-500/20 rounded">
                                    <Radio size={14} className="text-cyan-400 animate-pulse" />
                                </div>
                                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-300">
                                    {latestTx?.callsign || 'SYSADMIN COMMS'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveDialogueNode(prev => prev ? null : 'intro_patch_1')}
                                    className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30 transition-colors"
                                >
                                    [T] COMMS
                                </button>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-[9px] font-mono text-slate-400">CH-404 LIVE</span>
                            </div>
                        </div>

                        <div className="text-xs font-mono text-slate-200 leading-relaxed min-h-[48px]">
                            {latestTx?.message || 'Awaiting transmission...'}
                        </div>

                        {latestTx?.subtext && (
                            <div className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-500/20">
                                {latestTx.subtext}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* JRPG Letterbox Dialogue Engine */}
            <PrinterPanicDialogue
                nodeId={activeDialogueNode}
                onClose={() => setActiveDialogueNode(null)}
                onSelectChoice={handleDialogueChoice}
            />

            {/* Bottom Center: Gadget Tray & Interaction Prompt (visible when dialogue is closed) */}
            {!activeDialogueNode && (
                <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-auto">
                {/* Active Proximity Interaction Prompt */}
                {activePrompt && (
                    <div className="animate-bounce bg-cyan-500/20 backdrop-blur-md border-2 border-cyan-400 px-5 py-2 rounded-xl text-cyan-200 font-mono text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2.5">
                        <span className="bg-cyan-400 text-slate-950 px-2 py-0.5 rounded font-black text-xs">
                            [{activePrompt.keyHint}]
                        </span>
                        <span>{activePrompt.label}</span>
                    </div>
                )}

                {/* Caffeine Boost Notice */}
                {caffeineRemaining > 0 && (
                    <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/40 px-3 py-1 rounded-lg text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                        <Zap size={13} className="text-amber-400" />
                        <span>CAFFEINE SURGE ACTIVE: +50% SPRINT ({Math.ceil(caffeineRemaining)}s)</span>
                    </div>
                )}

                {/* Gadgets Tray */}
                <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
                    {/* Thermal Slick Trap */}
                    <div className="relative flex flex-col items-center gap-1 group">
                        <button
                            disabled={thermalSlickCooldown > 0}
                            onClick={() => {
                                if (playerPos) usePrinterPanicStore.getState().deployThermalSlick(playerPos);
                            }}
                            className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                thermalSlickCooldown > 0
                                    ? 'bg-slate-900 border-white/10 opacity-50 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-slate-700 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer'
                            }`}
                        >
                            <Flame size={20} className={thermalSlickCooldown > 0 ? 'text-slate-500' : 'text-cyan-400'} />
                            <span className="text-[9px] font-mono font-bold text-slate-300">
                                {thermalSlickCooldown > 0 ? `${Math.ceil(thermalSlickCooldown)}s` : '[SPACE]'}
                            </span>
                        </button>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Paper Slick
                        </span>
                    </div>

                    {/* Leaked Memo Decoy */}
                    <div className="relative flex flex-col items-center gap-1 group">
                        <button
                            disabled={memoCooldown > 0}
                            onClick={() => {
                                if (playerPos) usePrinterPanicStore.getState().deployMemo(playerPos);
                            }}
                            className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                memoCooldown > 0
                                    ? 'bg-slate-900 border-white/10 opacity-50 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-slate-700 border-amber-500/40 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer'
                            }`}
                        >
                            <FileText size={20} className={memoCooldown > 0 ? 'text-slate-500' : 'text-amber-400'} />
                            <span className="text-[9px] font-mono font-bold text-slate-300">
                                {memoCooldown > 0 ? `${Math.ceil(memoCooldown)}s` : '[F]'}
                            </span>
                        </button>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Decoy Memo
                        </span>
                    </div>

                    {/* Autonomous Mode Toggle Slot */}
                    <div className="relative flex flex-col items-center gap-1 group">
                        <button
                            onClick={toggleAutonomousMode}
                            className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                isAutonomousMode
                                    ? 'bg-cyan-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] cursor-pointer text-cyan-300'
                                    : 'bg-slate-800 hover:bg-slate-700 border-white/10 hover:border-cyan-500/40 cursor-pointer text-slate-400'
                            }`}
                        >
                            <span className="text-xl">{isAutonomousMode ? '🤖' : '🎮'}</span>
                            <span className="text-[9px] font-mono font-bold">
                                [Z]
                            </span>
                        </button>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {isAutonomousMode ? 'AI Active' : 'Idle Mode'}
                        </span>
                    </div>
                </div>
            </div>
            )}

            {/* VICTORY DEBRIEF MODAL */}
            {gameStatus === 'VICTORY' && victoryReport && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-6 pointer-events-auto z-50 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-slate-900/95 border-2 border-emerald-500/50 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_80px_rgba(16,185,129,0.3)] flex flex-col gap-6">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-black text-3xl text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                    {victoryReport.grade}
                                </div>
                                <div>
                                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                                        SHIFT PERFORMANCE COMPLETED
                                    </span>
                                    <h2 className="text-xl font-black text-white uppercase tracking-wide">
                                        {victoryReport.title}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Debrief Text */}
                        <div className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 flex flex-col gap-3 font-mono text-xs text-slate-300">
                            <p className="leading-relaxed text-slate-200">
                                {victoryReport.debriefMessage}
                            </p>
                            <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-emerald-300">
                                {victoryReport.itCommNote}
                            </div>
                            <div className="p-3 bg-red-950/20 rounded-xl border border-red-500/20 text-red-300/90 text-[11px]">
                                {victoryReport.corporateNotice}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={restartShift}
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2"
                            >
                                <RotateCcw size={16} />
                                <span>Re-Roll Shift / Play Again</span>
                            </button>
                            {onExit && (
                                <button
                                    onClick={onExit}
                                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all border border-white/10"
                                >
                                    Return to Desktop
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DEFEAT / LOCKDOWN MODAL */}
            {gameStatus === 'DEFEAT' && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-6 pointer-events-auto z-50 animate-in fade-in duration-300">
                    <div className="bg-slate-900/95 border-2 border-red-500/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_80px_rgba(239,68,68,0.4)] flex flex-col items-center text-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 animate-pulse">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                                District Panic 100%
                            </h2>
                            <p className="text-xs font-mono text-red-400 mt-1">
                                CORPORATE ICE LOCKDOWN PROTOCOL INITIATED
                            </p>
                            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                                Unserviced printer jams created an irreversible cascade of administrative panic. Security enforcers have quarantined Sector-404.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full">
                            <button
                                onClick={restartShift}
                                className="flex-1 bg-red-500 hover:bg-red-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                <span>Retry Shift</span>
                            </button>
                            {onExit && (
                                <button
                                    onClick={onExit}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-white/10"
                                >
                                    Exit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
