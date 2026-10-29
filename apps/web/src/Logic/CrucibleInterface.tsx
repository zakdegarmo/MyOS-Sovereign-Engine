/**
 * CrucibleInterface.tsx
 * 
 * A glassmorphic HUD component to visualize the 27-point Evaluation Prism.
 */

import React from 'react';
import { ValidationResult, PillarResults } from '../sys/Crucible';

interface CrucibleInterfaceProps {
    result: ValidationResult | null;
    isEvaluating: boolean;
}

const PillarView: React.FC<{ name: string; results: PillarResults }> = ({ name, results }) => {
    return (
        <div className="crucible-pillar">
            <h3>{name.toUpperCase()} ({(results.score * 100).toFixed(0)}%)</h3>
            <div className="crucible-facets">
                {Object.entries(results.facets).map(([facet, data]) => (
                    <div key={facet} className="crucible-facet" title={data.message}>
                        <div className="facet-label">{facet}</div>
                        <div className="facet-bar">
                            <div 
                                className="facet-fill" 
                                style={{ 
                                    width: `${data.score * 100}%`,
                                    backgroundColor: data.score > 0.8 ? '#00ffa3' : data.score > 0.5 ? '#ffce00' : '#ff3131'
                                }} 
                            />
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                .crucible-pillar {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .crucible-pillar h3 {
                    margin: 0;
                    font-size: 0.8rem;
                    letter-spacing: 2px;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                }
                .crucible-facets {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0.25rem;
                }
                .crucible-facet {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.7rem;
                }
                .facet-label {
                    width: 60px;
                    text-transform: capitalize;
                    opacity: 0.8;
                }
                .facet-bar {
                    flex: 1;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }
                .facet-fill {
                    height: 100%;
                    transition: width 0.5s ease-out, background-color 0.5s ease;
                }
            `}</style>
        </div>
    );
};

export const CrucibleInterface: React.FC<CrucibleInterfaceProps> = ({ result, isEvaluating }) => {
    if (!result && !isEvaluating) return null;

    return (
        <div className="crucible-hud">
            <div className="crucible-header">
                <h2>THE CRUCIBLE</h2>
                {isEvaluating ? (
                    <div className="eval-status pulse">EVALUATING DAEMON...</div>
                ) : (
                    <div className={`eval-status ${result?.passed ? 'pass' : 'fail'}`}>
                        {result?.passed ? 'DETERMINATION: PASS' : 'DETERMINATION: BURN'}
                    </div>
                )}
            </div>

            <div className="crucible-grid">
                {result && (
                    <>
                        <PillarView name="Friction" results={result.pillars.friction} />
                        <PillarView name="Elegance" results={result.pillars.elegance} />
                        <PillarView name="Potency" results={result.pillars.potency} />
                    </>
                )}
            </div>

            <style>{`
                .crucible-hud {
                    position: fixed;
                    right: 20px;
                    top: 20px;
                    width: 320px;
                    background: rgba(10, 10, 15, 0.8);
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    color: white;
                    font-family: 'Inter', sans-serif;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    animation: slideIn 0.3s ease-out;
                }
                .crucible-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }
                .crucible-header h2 {
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 900;
                    letter-spacing: 5px;
                    background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.3));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .eval-status {
                    font-size: 0.6rem;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
                .eval-status.pulse {
                    animation: blink 1s infinite;
                    color: #00eaff;
                }
                .eval-status.pass { color: #00ffa3; }
                .eval-status.fail { color: #ff3131; }

                .crucible-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};
