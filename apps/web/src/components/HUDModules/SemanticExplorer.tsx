import React, { useState } from 'react';
import { useWorld } from '../../engine/WorldContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, FileText, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * SemanticExplorer.tsx
 * 
 * A collapsible library of contextual concepts and session-tagged files.
 * Provides nested descriptions harvested from JSON-LD Mint Reports.
 */

interface SemanticExplorerProps {
    onClose: () => void;
}

const ConceptNode: React.FC<{ concept: { title: string, description: string } }> = ({ concept }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="concept-node">
            <div className="node-header" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Book size={14} className="node-icon" />
                <span className="node-title">{concept.title}</span>
            </div>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="node-description"
                    >
                        {concept.description}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .concept-node {
                    border-left: 1px solid rgba(0, 234, 255, 0.2);
                    margin-left: 0.5rem;
                }
                .node-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    cursor: pointer;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.8rem;
                    transition: color 0.2s;
                }
                .node-header:hover {
                    color: #00eaff;
                }
                .node-icon {
                    color: rgba(0, 234, 255, 0.5);
                }
                .node-title {
                    font-family: 'Inter', sans-serif;
                    font-weight: 500;
                }
                .node-description {
                    padding: 0.5rem 1rem;
                    font-size: 0.75rem;
                    line-height: 1.4;
                    color: rgba(255, 255, 255, 0.6);
                    overflow: hidden;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export const SemanticExplorer: React.FC<SemanticExplorerProps> = ({ onClose }) => {
    const { sessionData } = useWorld();

    return (
        <motion.div 
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="semantic-explorer"
        >
            <div className="explorer-header">
                <div className="header-left">
                    <span className="signet-tag">{sessionData.glyphs}</span>
                    <h3>AETHER LIBRARY</h3>
                </div>
                <button onClick={onClose} className="close-btn"><X size={18} /></button>
            </div>

            <div className="explorer-content custom-scrollbar">
                <div className="section">
                    <h4>CONTEXTUAL CONCEPTS</h4>
                    {sessionData.concepts.length === 0 ? (
                        <p className="empty-msg">No concepts harvested yet...</p>
                    ) : (
                        sessionData.concepts.map((c, i) => <ConceptNode key={i} concept={c} />)
                    )}
                </div>

                <div className="section">
                    <h4>SESSION FILES</h4>
                    <div className="file-node">
                        <FileText size={14} className="node-icon" />
                        <span>AlchemyEncoder.ts</span>
                    </div>
                     <div className="file-node">
                        <FileText size={14} className="node-icon" />
                        <span>femto_bytecode_engine.js</span>
                    </div>
                </div>
            </div>

            <style>{`
                .semantic-explorer {
                    position: fixed;
                    left: 90px;
                    top: 20px;
                    width: 320px;
                    height: calc(100vh - 40px);
                    background: rgba(10, 15, 25, 0.9);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    z-index: 1000;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                }
                .explorer-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .signet-tag {
                    color: #00eaff;
                    font-size: 1.2rem;
                    opacity: 0.8;
                }
                .explorer-header h3 {
                    margin: 0;
                    font-size: 0.9rem;
                    letter-spacing: 3px;
                    font-weight: 700;
                    color: white;
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .close-btn:hover { color: white; }

                .explorer-content {
                    flex: 1;
                    padding: 1rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .section h4 {
                    font-size: 0.6rem;
                    letter-spacing: 2px;
                    color: rgba(255, 255, 255, 0.4);
                    margin-bottom: 0.75rem;
                }
                .empty-msg {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.2);
                    font-style: italic;
                    padding-left: 0.5rem;
                }
                .file-node {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.6);
                    font-family: 'JetBrains Mono', monospace;
                }
                .node-icon {
                   color: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </motion.div>
    );
};
