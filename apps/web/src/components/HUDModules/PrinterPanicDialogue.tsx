import React, { useState, useEffect, useRef } from 'react';
import { SECTOR_404_DIALOGUE, type DialogueNode } from '../../engine/Sector404Narrative';
import { LarryPortraitVisemes } from './LarryPortraitVisemes';
import { officeAudio } from '../../engine/OfficeAudioSynth';
import { Cpu, Terminal, ShieldAlert, Sparkles, X } from 'lucide-react';

interface PrinterPanicDialogueProps {
    nodeId: string | null;
    onClose: () => void;
    onSelectChoice?: (nextNodeId: string, effect?: any) => void;
}

export const PrinterPanicDialogue: React.FC<PrinterPanicDialogueProps> = ({
    nodeId,
    onClose,
    onSelectChoice
}) => {
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(nodeId);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const fullTextRef = useRef('');

    useEffect(() => {
        setCurrentNodeId(nodeId);
    }, [nodeId]);

    const node: DialogueNode | undefined = currentNodeId ? SECTOR_404_DIALOGUE[currentNodeId] : undefined;

    // Typewriter effect
    useEffect(() => {
        if (!node) {
            setDisplayedText('');
            setIsTyping(false);
            return;
        }

        fullTextRef.current = node.text;
        setDisplayedText('');
        setIsTyping(true);

        let charIdx = 0;
        const totalChars = node.text.length;

        const interval = setInterval(() => {
            charIdx += 1;
            setDisplayedText(node.text.slice(0, charIdx));

            // Sound chirp on every 2nd character
            if (charIdx % 2 === 0) {
                officeAudio.playSpeechChirp(node.speaker);
            }

            if (charIdx >= totalChars) {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 22);

        return () => clearInterval(interval);
    }, [node]);

    // Keyboard bindings: Space / Enter to speed up, Digit1 / Digit2 for choices
    useEffect(() => {
        if (!node) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

            if (e.code === 'Space' || e.code === 'Enter') {
                if (isTyping) {
                    e.preventDefault();
                    setDisplayedText(fullTextRef.current);
                    setIsTyping(false);
                }
            } else if (e.code === 'Digit1') {
                if (node.choices && node.choices[0] && !isTyping) {
                    e.preventDefault();
                    handleChoiceClick(node.choices[0]);
                }
            } else if (e.code === 'Digit2') {
                if (node.choices && node.choices[1] && !isTyping) {
                    e.preventDefault();
                    handleChoiceClick(node.choices[1]);
                }
            } else if (e.code === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [node, isTyping]);

    if (!node) return null;

    const handleChoiceClick = (choice: NonNullable<DialogueNode['choices']>[0]) => {
        officeAudio.playRepairSuccess();
        if (onSelectChoice) {
            onSelectChoice(choice.nextNodeId, choice.effect);
        }
        if (choice.nextNodeId === 'close_dialogue' || !SECTOR_404_DIALOGUE[choice.nextNodeId]) {
            onClose();
        } else {
            setCurrentNodeId(choice.nextNodeId);
        }
    };

    const isLarry = node.speaker === 'LARRY';
    const isPatch = node.speaker === 'PATCH';

    return (
        <>
            {/* Dimmed backdrop to isolate dialogue and ensure 100% legibility */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-[10004] pointer-events-auto transition-opacity"
                onClick={() => {
                    if (isTyping) {
                        setDisplayedText(fullTextRef.current);
                        setIsTyping(false);
                    }
                }}
            />

            {/* Elevated JRPG Letterbox Dialogue Frame */}
            <div className="fixed bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl z-[10005] pointer-events-auto select-none font-sans animate-in slide-in-from-bottom-8 duration-200">
                <div className="relative bg-slate-950/95 backdrop-blur-3xl border-2 border-cyan-400/80 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col sm:flex-row gap-5 items-stretch ring-1 ring-cyan-500/30">
                    {/* Close button with shortcut hint */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors font-mono text-[11px] flex items-center gap-1 border border-white/10"
                        title="Dismiss Dialogue [ESC]"
                    >
                        <span>ESC</span>
                        <X size={14} />
                    </button>

                    {/* Left Speaker Portrait Column */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-28 sm:w-36">
                        {isLarry ? (
                            <LarryPortraitVisemes
                                isSpeaking={isTyping}
                                mood={node.visemeMood}
                                className="w-28 h-28 sm:w-32 sm:h-32"
                            />
                        ) : isPatch ? (
                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-900 border-2 border-emerald-400 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.35)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
                                <Cpu size={44} className="text-emerald-400 z-10 animate-bounce" />
                                <span className="text-[10px] font-mono font-black text-emerald-300 uppercase tracking-widest mt-1.5 z-10">
                                    P.A.T.C.H. CORE
                                </span>
                                {/* Waveform indicator */}
                                <div className="flex gap-1 mt-1.5 z-10">
                                    <span className="w-1 bg-emerald-400 h-2 animate-ping" />
                                    <span className="w-1 bg-emerald-400 h-4 animate-pulse" />
                                    <span className="w-1 bg-emerald-400 h-3 animate-ping" />
                                </div>
                            </div>
                        ) : (
                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-900 border-2 border-amber-400/80 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                <ShieldAlert size={40} className="text-amber-400" />
                                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider mt-1 text-center px-1">
                                    {node.speaker}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Dialogue Content Column */}
                    <div className="flex-1 flex flex-col justify-between gap-3 min-h-[130px]">
                        {/* Speaker Header Banner */}
                        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                            <Terminal size={15} className={isPatch ? 'text-emerald-400' : 'text-cyan-400'} />
                            <span className={`text-xs sm:text-sm font-mono font-black uppercase tracking-wider ${isPatch ? 'text-emerald-300' : 'text-cyan-300'}`}>
                                {node.speakerTitle}
                            </span>
                        </div>

                        {/* Scrolling Typewriter Dialogue Text */}
                        <div
                            onClick={() => {
                                if (isTyping) {
                                    setDisplayedText(fullTextRef.current);
                                    setIsTyping(false);
                                }
                            }}
                            className="text-sm sm:text-base md:text-lg font-sans text-slate-50 font-medium leading-relaxed min-h-[56px] cursor-pointer"
                        >
                            {displayedText}
                            {isTyping && <span className="inline-block w-2.5 h-4 bg-cyan-400 ml-1 animate-pulse" />}
                        </div>

                        {/* Interactive Player Choices */}
                        {node.choices && node.choices.length > 0 && !isTyping && (
                            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 animate-in fade-in duration-200">
                                {node.choices.map((choice, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleChoiceClick(choice)}
                                        className="flex-1 text-left px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950 border-2 border-cyan-500/40 hover:border-cyan-400 text-xs sm:text-sm font-mono text-cyan-200 hover:text-white transition-all shadow-lg flex items-center gap-2.5 group"
                                    >
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black text-xs group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
                                            [{idx + 1}]
                                        </span>
                                        <span className="flex-1 font-semibold leading-snug">{choice.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
