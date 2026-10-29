import React, { useState, useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

interface PixelChatBubbleProps {
    text: string;
    sender?: 'orchestrator' | 'user' | string;
    onComplete?: () => void;
    decayTimeMs?: number; // How long before it fades out (default 1 min)
    genome?: Record<string, string>; // Passing genome for portrait
    position?: [number, number, number];
}

// Chunks a long string into substantial paragraphs without breaking words
const chunkText = (text: string, maxLength = 500): string[] => {
    if (!text) return [];
    if (text.length <= maxLength) return [text.trim()];
    const words = text.split(' ');
    const chunks: string[] = [];
    let currentChunk = '';

    words.forEach(word => {
        if ((currentChunk + word).length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = word + ' ';
        } else {
            currentChunk += word + ' ';
        }
    });
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
};

export const PixelChatBubble: React.FC<PixelChatBubbleProps> = ({
    text,
    sender = 'orchestrator',
    onComplete,
    decayTimeMs = 25000,
    genome,
    position = [0, 3.8, 0]
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [pages, setPages] = useState<string[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const textContainerRef = useRef<HTMLDivElement>(null);
    const lastTextRef = useRef('');

    // Formatted sender name
    const displaySender = sender.toLowerCase() === 'orchestrator' ? 'EINSTEIN' : sender.toUpperCase();

    useEffect(() => {
        if (!text) return;
        setIsVisible(true);
        lastTextRef.current = text;
        const newPages = chunkText(text, 500);
        setPages(newPages);
        
        // Live streaming: if on page 0 or page matches, show current content
        const targetPage = Math.min(currentPageIndex, newPages.length - 1);
        setDisplayedText(newPages[targetPage] || text);

        // Auto-decay timer resets whenever new text arrives
        const timer = setTimeout(() => {
            if (lastTextRef.current === text) {
                setIsVisible(false);
                if (onComplete) onComplete();
            }
        }, decayTimeMs);

        return () => clearTimeout(timer);
    }, [text, currentPageIndex, onComplete, decayTimeMs]);

    // Auto-scroll to bottom of bubble during streaming
    useEffect(() => {
        if (textContainerRef.current) {
            textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
        }
    }, [displayedText]);

    const handleNextPage = () => {
        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
        } else {
            setIsVisible(false);
            if (onComplete) onComplete();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleNextPage();
            }
        };

        if (isVisible) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, currentPageIndex, pages.length]);

    if (!text || !isVisible) return null;

    const renderPortrait = () => {
        if (sender.toLowerCase().includes('einstein') || genome?.body?.includes('einstein')) {
            return (
                <div className="w-[48px] h-[48px] bg-slate-950 border-2 border-amber-400 rounded-sm relative overflow-hidden flex-shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                    <img src="/actions/einstein_preview.png" alt="Einstein" className="w-full h-full object-cover" />
                </div>
            );
        }

        if (!genome || sender === 'user') {
            return (
                <div className="w-[48px] h-[48px] bg-indigo-950 border border-indigo-500 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                    <span className="text-xl">🤖</span>
                </div>
            );
        }

        const layers = ['body', 'eyes', 'facial', 'hair', 'hat'];

        return (
            <div
                className="w-[48px] h-[48px] bg-slate-900 border-2 border-white rounded-sm relative overflow-hidden flex-shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
            >
                {layers.map(layer => {
                    const rawAsset = genome[layer];
                    if (!rawAsset || rawAsset === 'none') return null;
                    const assetUrl = rawAsset.startsWith('/') ? rawAsset : (rawAsset.includes('textures/') ? rawAsset : `/textures/avatars/lpc/${rawAsset}`);
                    return (
                        <div
                            key={layer}
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url('${assetUrl}')`,
                                backgroundPosition: '-8px -8px',
                                backgroundSize: '832px 1344px',
                                imageRendering: 'pixelated',
                                transform: 'scale(1.5)',
                                transformOrigin: 'top left'
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <Html position={position} center zIndexRange={[100, 0]}>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.8 }}
                        className="pointer-events-auto cursor-pointer"
                        onClick={handleNextPage}
                    >
                        <div
                            className={`
                                relative w-[420px] p-4 rounded-xl flex gap-4
                                shadow-[6px_6px_0_rgba(0,0,0,0.5)]
                                border-[3px] border-white backdrop-blur-md
                                ${sender === 'user' ? 'bg-blue-900/90 text-white' : 'bg-black/90 text-white'}
                            `}
                            style={{ imageRendering: 'pixelated' }}
                        >
                            {/* Inner pixel border effect */}
                            <div className="absolute inset-0 border-2 border-white/20 rounded-lg pointer-events-none" />

                            {renderPortrait()}

                            <div className="flex-1 flex flex-col justify-between">
                                {/* Sender badge */}
                                <div className="text-[10px] font-black text-amber-400 mb-1 tracking-widest uppercase">
                                    {displaySender}
                                </div>

                                {/* Chat Text */}
                                <div ref={textContainerRef} className="font-mono text-[15px] leading-[1.4] break-words min-h-[50px] max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                    {displayedText}
                                </div>

                                {/* Pagination Controls (only if multi-page) */}
                                {pages.length > 1 && (
                                    <div className="flex justify-end mt-1 h-[12px] items-center">
                                        <div className="text-[10px] text-white/50 font-mono">
                                            {currentPageIndex + 1} / {pages.length}
                                        </div>
                                        <div className="ml-2 animate-bounce text-amber-400 text-[12px]">
                                            ▼
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tail pointer */}
                            <div
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-sm rotate-45 border-b-[3px] border-r-[3px] border-white shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
                                style={{ backgroundColor: sender === 'user' ? '#1e3a8a' : '#000' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Html>
    );
};
