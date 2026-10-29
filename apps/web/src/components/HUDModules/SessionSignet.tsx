import React from 'react';
import { useWorld } from '../../engine/WorldContext';
import { motion } from 'framer-motion';

/**
 * SessionSignet.tsx
 * 
 * A floating, glassmorphic 'Seal' that represents the current session.
 * Displays the 2-glyph UCDA identifier distilled from the session UUID.
 */

interface SessionSignetProps {
    onOpenExplorer: () => void;
}

export const SessionSignet: React.FC<SessionSignetProps> = ({ onOpenExplorer }) => {
    const { sessionData } = useWorld();

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            onClick={onOpenExplorer}
            className="session-signet"
            title={`Session ID: ${sessionData?.id || 'unknown'}`}
        >
            <div className="signet-inner">
                <span className="glyph">{sessionData?.glyphs || '??'}</span>
            </div>

            <style>{`
                .session-signet {
                    position: fixed;
                    left: 20px;
                    top: 20px;
                    width: 60px;
                    height: 60px;
                    cursor: pointer;
                    z-index: 2000;
                    filter: drop-shadow(0 0 15px rgba(0, 234, 255, 0.3));
                }
                .signet-inner {
                    width: 100%;
                    height: 100%;
                    background: rgba(10, 20, 30, 0.6);
                    backdrop-filter: blur(15px);
                    border: 2px solid rgba(0, 234, 255, 0.4);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: border-color 0.3s ease;
                }
                .session-signet:hover .signet-inner {
                    border-color: rgba(0, 234, 255, 1);
                    background: rgba(10, 20, 30, 0.8);
                }
                .glyph {
                    font-size: 1.8rem;
                    color: #00eaff;
                    text-shadow: 0 0 10px rgba(0, 234, 255, 0.8);
                    font-family: 'Segoe UI Symbol', sans-serif;
                }
            `}</style>
        </motion.div>
    );
};
