import React from 'react';
import { useCouncil } from '../../council/CouncilContext';
import { motion } from 'framer-motion';

const PILLAR_IDENTS = [
    { id: 'self', coin: 'SelCoin', label: 'Self', color: '#ff00ff' },
    { id: 'thought', coin: 'ThoCoin', label: 'Thought', color: '#00ffff' },
    { id: 'logic', coin: 'LogCoin', label: 'Logic', color: '#ffffff' },
    { id: 'unity', coin: 'UniCoin', label: 'Unity', color: '#ffff00' },
    { id: 'existence', coin: 'ExiCoin', label: 'Existence', color: '#00ff00' },
    { id: 'improvement', coin: 'ImpCoin', label: 'Improvement', color: '#ff8800' },
    { id: 'mastery', coin: 'MasCoin', label: 'Mastery', color: '#ff0000' },
    { id: 'resonance', coin: 'ResCoin', label: 'Resonance', color: '#8800ff' },
    { id: 'transcendence', coin: 'TraCoin', label: 'Transcendence', color: '#0088ff' },
    { id: 'omniscience', coin: 'OmniCoin', label: 'Omniscience', color: '#888888' },
];

export const OntologicalLedger: React.FC = () => {
    const { getAllBalances } = useCouncil();
    const balances = getAllBalances('user');

    return (
        <div style={{
            padding: '1.5rem',
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#e0e0e0',
            fontFamily: "'Inter', sans-serif",
            width: '320px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            userSelect: 'none'
        }}>
            <h2 style={{ 
                margin: '0 0 0.25rem 0', 
                fontSize: '0.9rem', 
                letterSpacing: '0.15em', 
                color: '#fff', 
                textTransform: 'uppercase',
                opacity: 0.9
            }}>The Ontological Ledger</h2>
            <p style={{ 
                margin: '0 0 1.5rem 0', 
                fontSize: '0.65rem', 
                opacity: 0.5, 
                fontStyle: 'italic' 
            }}>Axiom Gains & Pillar Resonance</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {PILLAR_IDENTS.map((p) => {
                    const balance = balances[p.coin] || 0;
                    const displayBalance = balance.toLocaleString(undefined, { maximumFractionDigits: 1 });
                    
                    return (
                        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: p.color, opacity: 0.9 }}>
                                    {p.label}
                                </span>
                                <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#fff' }}>
                                    {displayBalance} <span style={{ fontSize: '0.6rem', opacity: 0.4 }}>{p.coin}</span>
                                </span>
                            </div>
                            <div style={{ 
                                height: '2px', 
                                background: 'rgba(255,255,255,0.05)', 
                                borderRadius: '1px',
                                overflow: 'hidden',
                                width: '100%'
                            }}>
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (balance / 1000) * 100)}%` }}
                                    style={{ 
                                        height: '100%', 
                                        background: p.color,
                                        boxShadow: `0 0 8px ${p.color}`
                                    }} 
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <button style={{
                   background: 'rgba(255,255,255,0.05)',
                   border: '1px solid rgba(255,255,255,0.1)',
                   color: '#fff',
                   fontSize: '0.65rem',
                   padding: '4px 12px',
                   borderRadius: '4px',
                   cursor: 'pointer',
                   textTransform: 'uppercase',
                   letterSpacing: '0.05em'
                }}>
                    Open Exchange
                </button>
            </div>
        </div>
    );
};
