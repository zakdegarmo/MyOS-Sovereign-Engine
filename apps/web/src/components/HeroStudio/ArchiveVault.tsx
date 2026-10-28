import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sparkles, X, Check, Eye } from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';

export interface MyOsSpriteEntry {
  id: string;
  name: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
  tileSize: number;
  grid: { cols: number; rows: number };
  scale: number;
  defaultAction: string;
  actions: Record<string, string>;
  pillarAlignment: string;
}

interface ArchiveVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArchetype?: (id: string, sprite: MyOsSpriteEntry) => void;
  activeArchetypeId?: string;
}

export const ArchiveVault: React.FC<ArchiveVaultProps> = ({
  isOpen,
  onClose,
  onSelectArchetype,
  activeArchetypeId
}) => {
  const { updateAgentGenome } = useCouncil();
  const [sprites, setSprites] = useState<Record<string, MyOsSpriteEntry>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [equipNotice, setEquipNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch('/textures/avatars/myos_sprites_manifest.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.sprites) {
          setSprites(data.sprites);
        }
      })
      .catch(err => console.error('Failed to load archive vault manifest:', err));
  }, []);

  const spriteList = useMemo(() => Object.values(sprites), [sprites]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    spriteList.forEach(s => {
      if (s.category) cats.add(s.category);
    });
    return ['all', ...Array.from(cats)];
  }, [spriteList]);

  const filteredSprites = useMemo(() => {
    return spriteList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [spriteList, searchQuery, selectedCategory]);

  const handleEquip = (sprite: MyOsSpriteEntry, target: 'user' | 'orchestrator') => {
    updateAgentGenome(target, {
      archetypeId: sprite.id,
      name: sprite.name,
      manifestSprite: sprite
    });
    setEquipNotice(`Equipped "${sprite.name}" to ${target}`);
    setTimeout(() => setEquipNotice(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl z-50 bg-[#070712]/95 backdrop-blur-xl border-l-2 border-[#d4af37]/40 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] flex flex-col select-none text-slate-100 animate-in slide-in-from-right duration-300">
      {/* Top Header - Brass Runic Magic Lab Aesthetic */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#d4af37]/30 bg-gradient-to-r from-[#121024] to-[#0a0a14]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/50 flex items-center justify-center text-[#ffd700] text-lg font-serif shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            ✠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wider uppercase text-amber-100 font-serif">
                Archive Vault
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                21 Legacy Models
              </span>
            </div>
            <p className="text-xs text-amber-200/60 font-mono">
              Complete Backward-Compatible Model Catalog
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-amber-950/60 border border-zinc-700 hover:border-amber-500/50 text-zinc-400 hover:text-amber-200 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 border-b border-zinc-800 bg-black/40 flex flex-col gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 21 legacy archetypes, monsters & heroes..."
            className="w-full bg-[#0e0e1e] border border-zinc-800 focus:border-[#d4af37]/70 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none transition shadow-inner"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg border uppercase whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredSprites.map(sprite => {
          const isSelected = activeArchetypeId === sprite.id;
          const idleSheet = sprite.actions.idle || Object.values(sprite.actions)[0];

          return (
            <div
              key={sprite.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                isSelected
                  ? 'bg-amber-950/30 border-[#d4af37]/60 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                  : 'bg-[#0b0b16]/80 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Sprite Preview Thumbnail Frame */}
                  <div className="w-16 h-16 rounded-xl bg-black/60 border border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {idleSheet ? (
                      <div
                        className="w-12 h-12 bg-no-repeat bg-contain"
                        style={{
                          backgroundImage: `url(${idleSheet})`,
                          backgroundPosition: '0 0',
                          imageRendering: 'pixelated'
                        }}
                      />
                    ) : (
                      <Sparkles className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white font-serif tracking-wide">
                        {sprite.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${sprite.badgeColor || 'border-zinc-700 text-zinc-300'}`}>
                        {sprite.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {sprite.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Sheet Pills */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500 uppercase">Actions:</span>
                  {Object.keys(sprite.actions).slice(0, 4).map(act => (
                    <span key={act} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
                      {act}
                    </span>
                  ))}
                  {Object.keys(sprite.actions).length > 4 && (
                    <span className="text-[10px] text-zinc-500">
                      +{Object.keys(sprite.actions).length - 4} more
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-amber-300 font-mono">
                  Pillar: {sprite.pillarAlignment}
                </div>
              </div>

              {/* Interactive Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {onSelectArchetype && (
                  <button
                    onClick={() => onSelectArchetype(sprite.id, sprite)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Inspect in Stage
                  </button>
                )}

                <button
                  onClick={() => handleEquip(sprite, 'user')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 border border-[#d4af37]/60 text-amber-100 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(212,175,55,0.2)] transition"
                >
                  <Check className="w-3.5 h-3.5" /> Equip to Player
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast Notification */}
      {equipNotice && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-amber-600/95 text-white font-mono text-xs font-bold border border-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.6)] flex items-center gap-2">
          <Check className="w-4 h-4" /> {equipNotice}
        </div>
      )}
    </div>
  );
};
