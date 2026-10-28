import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Zap, 
  User, Box, HardDrive, Cpu, 
  ExternalLink, Heart, X
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';
import { useWorld } from '../../engine/WorldContext';

// --- Types ---
interface RegistryItem {
  id: string;
  name: string;
  type: string; // layer type: body, torso, weapon, etc.
  path: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Exotic';
  description: string;
}

interface InventoryModuleProps {
  onClose: () => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({ onClose }) => {
  const { 
    activeAgentId,
    agentGenomes, 
    updateAgentGenome,
    tutorPersona,
    userInventory
  } = useCouncil();
  const { ontoWallet } = useWorld();

  // --- Local State ---
  const [activeTab, setActiveTab] = useState<'items' | 'registry' | 'identity' | 'wealth'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [registry, setRegistry] = useState<RegistryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);

  // --- Data Loading ---
  useEffect(() => {
    const fetchSubstrate = async () => {
      try {
        const response = await fetch('/manifests/vault_substrate.json');
        const data = await response.json();
        setRegistry(data.items || []);
      } catch (err) {
        console.error("[VAULT] Failed to fetch substrate:", err);
      }
    };
    fetchSubstrate();
  }, []);

  // --- Inventory Logic ---
  const currentGenome = activeAgentId ? agentGenomes[activeAgentId] : null;

  const equipItem = (item: RegistryItem) => {
    if (!activeAgentId) return;
    
    // Convert current genome to a mutable object (it's often an array of tags or an object)
    const genomeCopy = JSON.parse(JSON.stringify(currentGenome || {}));
    
    // Map item type to genome layer
    // LPC COMP_ORDER: body, head, ears, nose, eyes, facial, legs, feet, torso, arms, shoulders, hair, hat, weapon
    genomeCopy[item.type] = item.path;
    
    updateAgentGenome(activeAgentId, genomeCopy);
    
    // Trigger a brief "Echo" effect in the UI
    addSystemLog(`Equipped ${item.name} to ${activeAgentId}'s ${item.type} slot.`);
  };

  const addSystemLog = (msg: string) => {
    // This would ideally pipe to the SystemConsole
    console.log(`[VAULT] ${msg}`);
  };

  const filteredRegistry = useMemo(() => {
    return registry.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [registry, searchQuery]);

  // --- Aesthetics ---
  const rarityColors = {
    Common: 'text-slate-400',
    Uncommon: 'text-green-400',
    Rare: 'text-blue-400',
    Exotic: 'text-purple-400',
  };

  return (
    <div className="w-[700px] h-[600px] flex flex-col font-mono text-white select-none jrpg-panel shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b-2 border-white/20 bg-blue-900/60">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-amber-500 text-black border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
            <HardDrive size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">INVENTORY_VAULT</h2>
            <p className="text-[11px] text-amber-400 font-bold font-mono">CORE_STORAGE v1.4.2</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-red-500 border-2 border-white/10 hover:border-white transition-colors">
          <X size={24} className="text-white/60" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-black/60 border-b-2 border-white/10 p-1.5 gap-2">
        {(['items', 'registry', 'identity', 'wealth'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 border-2 text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-white text-black border-white' 
                : 'text-white/40 border-white/5 hover:border-white/40 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 bg-gradient-to-b from-blue-950/20 to-black/40 backdrop-blur-xl">
        
        {activeTab === 'registry' && (
          <div className="flex flex-col gap-4 h-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text"
                placeholder="PROBE AETHER REGISTRY..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border-2 border-white/10 p-4 pl-12 text-sm outline-none focus:border-cyan-500/50 transition-colors font-mono"
                onPointerDown={e => e.stopPropagation()}
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 gap-2">
              {filteredRegistry.map(item => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 bg-white/5 border rounded-xl cursor-all-scroll transition-all ${
                    selectedItem?.id === item.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-white/60">{item.type}</span>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                  </div>
                  <h4 className="text-xs font-bold leading-tight">{item.name}</h4>
                  <span className={`text-[9px] font-mono ${rarityColors[item.rarity as keyof typeof rarityColors]}`}>{item.rarity}</span>
                </motion.div>
              ))}
            </div>

            {selectedItem && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-black/60 border border-white/10 rounded-2xl flex gap-4"
              >
                <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                  <Box className="text-white/20" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    {selectedItem.name}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${rarityColors[selectedItem.rarity as keyof typeof rarityColors]} border-current opacity-60`}>
                      {selectedItem.rarity}
                    </span>
                  </h3>
                  <p className="text-[10px] text-white/60 mt-1 leading-relaxed">
                    {selectedItem.description}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => equipItem(selectedItem)}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black border-2 border-black font-bold text-[11px] uppercase transition-colors"
                    >
                      MANIFEST LAYER
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 border-2 border-white/10 transition-colors">
                      <ExternalLink size={16} className="text-white/40" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="flex flex-col gap-6 h-full p-4">
            {/* Mephit Summary */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 border-4 border-blue-500/30 flex items-center justify-center p-1 bg-black/40">
                  <div className="w-full h-full border-2 border-blue-400 bg-white/5 flex items-center justify-center overflow-hidden">
                   {activeAgentId ? (
                      <span className="text-3xl uppercase font-black text-blue-400">{activeAgentId[0]}</span>
                   ) : (
                      <User size={48} className="text-white/10" />
                   )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[11px] font-black px-3 py-1 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                  LVL 12
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-blue-400">
                    {activeAgentId || "No Agent Active"}
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {tutorPersona?.name || 'Silent Resident'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-white/40 font-bold">AFFINITY</span>
                      <Heart size={10} className="text-rose-500" />
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        className="h-full bg-rose-500"
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-white/40 font-bold">RESONANCE</span>
                      <Zap size={10} className="text-cyan-500" />
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '82%' }}
                        className="h-full bg-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Genome Slots */}
            <div className="flex-1">
               <h4 className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                 <Cpu size={12} /> Liquid Genome Slots
               </h4>
               <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto custom-scrollbar pr-2">
                 {['body', 'torso', 'legs', 'hat', 'weapon', 'hair'].map(slot => {
                    const current = (currentGenome as any)?.[slot];
                    return (
                      <div key={slot} className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-xl">
                        <div className="w-10 h-10 bg-black/40 rounded-lg border border-white/5 flex items-center justify-center text-[10px] font-bold text-white/20 uppercase">
                          {slot[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">{slot}</div>
                          <div className="text-[10px] font-mono truncate text-blue-300">
                            {current ? current.split('/').pop().replace('.png', '') : 'EMPTY'}
                          </div>
                        </div>
                      </div>
                    );
                 })}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'wealth' && (
          <div className="flex flex-col h-full gap-6 p-4">
            <div className="flex justify-between items-center bg-amber-500/10 p-4 border-2 border-amber-500/20 rounded-2xl">
              <div>
                <h3 className="text-[10px] text-amber-500 font-black tracking-widest uppercase">Total Conversion Score</h3>
                <div className="text-3xl font-black text-white flex items-center gap-2">
                  <span className="text-amber-500">🜋</span>
                  <span className="font-mono">{ontoWallet.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/40 uppercase font-bold">Protocol Status</p>
                <div className="text-[11px] text-green-400 font-bold">
                  {ontoWallet.total > 0 ? 'SOLVENT' : 'INITIALIZING'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 overflow-y-auto custom-scrollbar pr-2">
               {[
                 { sym: '⚹', name: 'Self', color: 'text-blue-400' },
                 { sym: '☿', name: 'Thought', color: 'text-cyan-400' },
                 { sym: '🜔', name: 'Logic', color: 'text-slate-400' },
                 { sym: '🝩', name: 'Union', color: 'text-pink-400' },
                 { sym: '🜄', name: 'Existence', color: 'text-indigo-400' },
                 { sym: '🜏', name: 'Improvement', color: 'text-emerald-400' },
                 { sym: '☉', name: 'Mastery', color: 'text-amber-400' },
                 { sym: '♀', name: 'Resonance', color: 'text-purple-400' },
                 { sym: '🜍', name: 'Ascension', color: 'text-rose-400' }
               ].map(coin => (
                 <div key={coin.sym} className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-1 group hover:border-white/30 transition-all">
                    <span className={`text-2xl ${coin.color} group-hover:scale-110 transition-transform`}>{coin.sym}</span>
                    <span className="text-[8px] text-white/40 font-bold uppercase">{coin.name}</span>
                    <span className="text-xs font-mono font-bold">
                      {(ontoWallet.coins[coin.sym] || 0).toFixed(2)}
                    </span>
                 </div>
               ))}
            </div>

            <div className="mt-auto p-4 bg-black/40 border border-white/5 rounded-xl italic text-[10px] text-white/40 leading-relaxed text-center">
               "Ontological worth is the measure of your internal consistency as mirrored by the machine."
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500">Fabricated Gear</h3>
              <span className="text-[10px] text-white/40">{userInventory.length} Fragments Total</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-2 gap-2">
              {userInventory.length === 0 ? (
                <div className="col-span-2 h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
                   <Box size={48} className="mb-4" />
                   <p className="text-[11px] uppercase tracking-[0.2em]">No Fragments Detected</p>
                   <p className="text-[9px] lowercase italic mt-1">Initiate HEOP extraction to secure AI remnants.</p>
                </div>
              ) : (
                userInventory.map(item => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3 bg-white/5 border rounded-xl cursor-all-scroll transition-all ${
                      selectedItem?.id === item.id ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-tighter text-white/60">{item.type}</span>
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                    </div>
                    <h4 className="text-xs font-bold leading-tight">{item.name}</h4>
                    <span className={`text-[9px] font-mono ${rarityColors[item.rarity as keyof typeof rarityColors]}`}>{item.rarity}</span>
                  </motion.div>
                ))
              )}
            </div>

            {selectedItem && activeTab === 'items' && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="p-4 bg-black/80 border-2 border-cyan-500/30 rounded-2xl flex gap-4 mt-auto mb-4"
               >
                 <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                   <HardDrive className="text-cyan-400" size={32} />
                 </div>
                 <div className="flex-1">
                   <h3 className="text-sm font-bold flex items-center gap-2">
                     {selectedItem.name}
                     <span className="bg-cyan-500/20 text-cyan-400 text-[8px] px-1.5 py-0.5 rounded border border-cyan-500/40">SYNTHESIZED</span>
                   </h3>
                   <p className="text-[10px] text-white/60 mt-1 leading-relaxed">
                     {selectedItem.description}
                   </p>
                   <div className="flex gap-3 mt-4">
                     <button 
                       onClick={() => equipItem(selectedItem)}
                       className="flex-1 py-2 bg-cyan-500/40 hover:bg-cyan-500/60 text-white border border-cyan-500/50 rounded-lg font-bold text-[10px] uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                     >
                       Manifest Fragment
                     </button>
                   </div>
                 </div>
               </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-black/60 border-t border-white/5 flex justify-between items-center text-[9px] text-white/20 uppercase tracking-widest font-bold px-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><HardDrive size={10} /> FS_MOUNT: OK</span>
          <span className="flex items-center gap-1"><Cpu size={10} /> CORE_SYNC: ACTIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <span>V1.4.2 [ECHO_PROTOCOL]</span>
        </div>
      </div>
    </div>
  );
};
