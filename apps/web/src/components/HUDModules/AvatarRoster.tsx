import React, { useState } from 'react';
import { useCouncil } from '../../council/CouncilContext';
import { generateCharacterSheet } from '../../engine/CharacterGenerator';
import { NPCSpritePortrait } from '../Avatars/NPCSpritePortrait';
import { INITIAL_WORLD_STATE } from '../../engine/WorldState';
import { Shield, Users } from 'lucide-react';

export const AvatarRoster: React.FC = () => {
    const { 
        partyMemberIds, 
        activePartyLeadId, 
        swapLead 
    } = useCouncil();

    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(activePartyLeadId || partyMemberIds[0] || null);

    // Filter NPCs by unlocked status (from WorldState)
    const unlockedNpcs = Object.values(INITIAL_WORLD_STATE.npcs).filter(npc => npc.unlocked);

    const selectedNpc = unlockedNpcs.find(n => n.id === selectedEntryId);
    const selectedSheet = selectedNpc ? generateCharacterSheet(selectedNpc.slug) : null;

    return (
        <div className="flex flex-col gap-2 w-full max-w-[480px] font-mono">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                <h3 className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold">Party Manifest</h3>
                <div className="flex gap-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Active Party: {partyMemberIds.length}/4</span>
                </div>
            </div>

            {/* Grid of Unlocked Characters (The Marketplace/Roster) */}
            <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar p-1 mb-2">
                {unlockedNpcs.map((npc) => {
                    const isInParty = partyMemberIds.includes(npc.id);
                    const isLead = activePartyLeadId === npc.id;
                    const isSelected = selectedEntryId === npc.id;
                    const sheet = generateCharacterSheet(npc.slug);

                    return (
                        <button
                            key={npc.id}
                            onClick={() => setSelectedEntryId(npc.id)}
                            className={`
                                aspect-square rounded-xl flex items-center justify-center transition-all duration-300 relative group border
                                ${isSelected
                                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-105 z-10'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/40 hover:text-white/80'}
                                ${isInParty ? 'opacity-100' : 'opacity-40 grayscale'}
                            `}
                        >
                            <NPCSpritePortrait slug={npc.slug} size={48} spriteTags={sheet.spriteTags} />
                            
                            {/* Indicators */}
                            {isLead && (
                                <div className="absolute -top-1 -right-1 bg-cyan-400 p-0.5 rounded-full shadow-[0_0_10px_#00ffff]">
                                    <Shield size={10} className="text-black" />
                                </div>
                            )}
                            {isInParty && !isLead && (
                                <div className="absolute -top-1 -right-1 bg-yellow-400 px-1 rounded-full text-[8px] font-bold text-black border border-black/50">
                                    AI
                                </div>
                            )}

                            {/* Tooltip */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/95 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 transition-all z-50">
                                {sheet.name}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Selection Detail Panel */}
            <div className="min-h-[280px] flex flex-col">
                {selectedSheet ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden relative">
                        {/* Status Bar */}
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="p-2 bg-black/40 rounded-xl border border-white/10">
                                    <NPCSpritePortrait slug={selectedSheet.id} size={64} spriteTags={selectedSheet.spriteTags} />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-sm font-bold text-white tracking-widest uppercase">{selectedSheet.name}</h4>
                                    <span className="text-[10px] text-cyan-400/80 uppercase tracking-[0.2em]">{selectedSheet.race} {selectedSheet.charClass}</span>
                                    <div className="flex gap-2 mt-1">
                                        {selectedSheet.abilities.map(abi => (
                                            <span key={abi} className="text-[8px] bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 px-1.5 rounded-full uppercase tracking-tighter">
                                                {abi}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest">{selectedSheet.alignment}</span>
                                <div className="text-[14px] font-bold text-white leading-none">LVL {selectedSheet.level}</div>
                            </div>
                        </div>

                        {/* Backstory & Relationships */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Origin Trace</span>
                                <p className="text-[11px] text-white/60 leading-relaxed italic">
                                    "{selectedSheet.persona}"
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Resonance Network</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSheet.relationships.map(rel => (
                                        <div key={rel} className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-white/50">
                                            {rel}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-auto pt-4 border-t border-white/5 flex gap-3">
                            <button
                                onClick={() => swapLead(selectedEntryId!)}
                                disabled={activePartyLeadId === selectedEntryId || !partyMemberIds.includes(selectedEntryId!)}
                                className={`
                                    flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2
                                    ${activePartyLeadId === selectedEntryId
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 cursor-default'
                                        : partyMemberIds.includes(selectedEntryId!)
                                            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                            : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}
                                `}
                            >
                                <Shield size={14} />
                                {activePartyLeadId === selectedEntryId ? 'Current Lead' : 'Set as Lead'}
                            </button>
                            
                            {!partyMemberIds.includes(selectedEntryId!) ? (
                                <button className="px-6 py-2 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                    Recruit Member
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-30">
                        <Users size={32} />
                        <span className="text-[9px] uppercase tracking-widest">Awaiting Entity Selection</span>
                    </div>
                )}
            </div>

            <p className="text-[9px] text-white/20 mt-2 text-center uppercase tracking-tighter">
                Click a portrait to inspect backstory • Recruited members follow and assist in combat
            </p>
        </div>
    );
};
