import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';
import { Heart, Zap, Scroll, Map as MapIcon, Hammer } from 'lucide-react';
import { useWorld } from '../../engine/WorldContext';

export const JrpgHud: React.FC = () => {
    const { agentMessages, partyMemberIds } = useCouncil();
    const { whistle, mountState } = useWorld();
    const [narration, setNarration] = useState<string | null>(null);
    const [coords, setCoords] = useState<string>("GRID :: --");

    // Watch for new messages from the digital GM (Orchestrator)
    useEffect(() => {
        const msg = agentMessages['orchestrator'];
        if (msg && msg.text !== narration) {
            setNarration(msg.text);
        }
    }, [agentMessages, narration]);

    // Live Coord Tracking
    useEffect(() => {
        const handlePos = (e: any) => {
            const { x, z } = e.detail;
            const RADIUS = 0.762;
            const row = Math.round(z / (RADIUS * 1.5));
            const col = Math.round(x / (RADIUS * Math.sqrt(3)));
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const colLetter = letters[Math.abs(col) % letters.length];
            setCoords(`GRID :: ${colLetter}${Math.abs(row)}`);
        };
        window.addEventListener('USER_POS_UPDATE', handlePos);
        return () => window.removeEventListener('USER_POS_UPDATE', handlePos);
    }, []);

    const openArchitect = useCallback(() => {
        window.dispatchEvent(new CustomEvent('MYSTRA_JUMP', {
            detail: { root: 'Existence' }
        }));
    }, []);

    // Global Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'p') {
                openArchitect();
            }
            if (e.key.toLowerCase() === 'c') {
                window.dispatchEvent(new CustomEvent('MYSTRA_JUMP', {
                    detail: { id: 'character-creator' }
                }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openArchitect]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[50] font-sans">
            {/* ... rest of the HUD ... */}
            <div className="absolute bottom-40 right-12 flex flex-col items-end gap-2 pointer-events-auto">
                 <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.dispatchEvent(new CustomEvent('MYSTRA_JUMP', { detail: { id: 'character-creator' } }))}
                    className="flex items-center gap-3 bg-cyan-500/20 border border-cyan-500/40 px-4 py-2 rounded-full backdrop-blur-md cursor-pointer group shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                    <div className="w-6 h-6 rounded-md border border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black transition-colors">C</div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">MODULATE</span>
                </motion.div>
                {/* ... other buttons ... */}
            </div>
        </div>
    );
};
