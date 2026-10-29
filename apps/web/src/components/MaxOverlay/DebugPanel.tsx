import React from 'react';
import { useSpelljammerStore } from '../../store/useSpelljammerStore';
import { useCouncil } from '../../council/CouncilContext';
import { SpelljammerHelm } from '../Council/SpelljammerHelm';

export const DebugPanel: React.FC<{
    isVisible: boolean;
    onClose: () => void;
}> = ({ isVisible, onClose }) => {
    const { isNavMode, setNavMode } = useSpelljammerStore();
    const { state: hrmState, awaken } = useCouncil();

    if (!isVisible) return null;

    return (
        <div className="fixed top-20 left-20 z-[9999] pointer-events-none">
            <div className="bg-black/95 border border-red-900/50 p-4 font-mono text-xs text-red-400 shadow-2xl rounded-lg pointer-events-auto w-[320px] max-h-[80vh] overflow-y-auto backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-red-900 mb-4 pb-2">
                    <h3 className="font-bold flex items-center gap-2 text-red-500">
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        DEBUG_OVERRIDE
                    </h3>
                    <button onClick={onClose} className="hover:text-white">✕</button>
                </div>

                {/* CAMERA / NAV */}
                <div className="mb-6 bg-red-950/20 p-2 rounded border border-red-900/30">
                    <h4 className="font-bold text-[10px] text-red-300 mb-2 uppercase tracking-wider">Camera Operator</h4>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={() => setNavMode(!isNavMode)}
                            className={`w-full py-2 border rounded font-bold transition-all text-center ${isNavMode
                                ? 'bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                                : 'bg-black border-red-900 text-red-500 hover:bg-red-900/20'}`}
                        >
                            {isNavMode ? 'DISABLE FREE CAM' : 'ENABLE FREE CAM (WASD)'}
                        </button>

                        <div className="text-[9px] text-red-600 mt-1 text-center font-mono">
                            {isNavMode ? 'Controls: W/A/S/D + Q/E (Turn) + R/F (Pitch)' : 'Camera locked to Director View'}
                        </div>
                    </div>
                </div>

                {/* HELM INTEGRATION */}
                <div className="mb-6">
                    <h4 className="font-bold text-[10px] text-red-300 mb-2 uppercase tracking-wider">Spelljammer Helm</h4>
                    <div className="bg-black/50 rounded border border-red-900/30 p-2 scale-90 origin-top-left w-[110%]">
                        <SpelljammerHelm />
                    </div>
                </div>

                {/* HRM STATUS */}
                <div className="mb-2 border-t border-red-900/50 pt-2">
                    <h4 className="font-bold text-[10px] text-red-300 mb-2 uppercase tracking-wider">HRM State</h4>
                    <div className="space-y-1 font-mono text-[9px] opacity-80 bg-red-900/10 p-2 rounded">
                        <div className="flex justify-between"><span>EMOTION:</span> <span>{hrmState.emotionalState}</span></div>
                        <div className="flex justify-between"><span>STEP:</span> <span>{hrmState.step}</span></div>
                        <div className="flex justify-between"><span>VEC:</span> <span className="text-red-200">[{hrmState.z_H.slice(0, 3).map(n => n.toFixed(1)).join(',')}]</span></div>
                    </div>
                </div>

            </div>
        </div>
    );
};
