import React, { useState, useMemo } from 'react';
import type { LibraryItem, DeweyCategory } from '@Omni/types';
import { DEWEY_SYSTEM, PILLARS } from '@Omni/constants';
import type { PillarId } from '@Omni/types';
import { Folder, FileText, Search, Tag, ChevronRight, ChevronDown } from 'lucide-react';

interface LibraryExplorerProps {
  items: LibraryItem[];
  onSelectItem: (item: LibraryItem) => void;
  onClose: () => void;
}

const LibraryExplorer: React.FC<LibraryExplorerProps> = ({ items, onSelectItem, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (code: string) => {
    const next = new Set(expandedCategories);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setExpandedCategories(next);
  };

  // Filter items based on search
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Group items by Dewey Main Class (first digit)
  const groupedItems = useMemo(() => {
    const groups: Record<string, LibraryItem[]> = {};
    DEWEY_SYSTEM.forEach(cat => groups[cat.code] = []);

    filteredItems.forEach(item => {
      // Simple logic: get the hundreds place. e.g. "530" -> "500"
      const mainClass = item.deweyCategory.charAt(0) + "00";
      if (groups[mainClass]) {
        groups[mainClass].push(item);
      } else {
        // Fallback for weird codes
        if (!groups['000']) groups['000'] = [];
        groups['000'].push(item);
      }
    });
    return groups;
  }, [filteredItems]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700 w-full md:w-96 shadow-2xl animate-slide-in-left">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <h2 className="text-xl font-bold text-aether-300 mb-2 flex items-center gap-2">
          <Folder className="w-5 h-5" /> The Great Library
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search the archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-aether-500 text-aether-100 placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {DEWEY_SYSTEM.map((category) => {
          const catItems = groupedItems[category.code] || [];
          if (catItems.length === 0 && searchQuery) return null; // Hide empty cats during search

          const isExpanded = expandedCategories.has(category.code) || searchQuery.length > 0;

          return (
            <div key={category.code} className="mb-1">
              <button
                onClick={() => toggleCategory(category.code)}
                className={`w-full flex items-center gap-2 p-2 hover:bg-slate-800 rounded text-left transition-colors ${catItems.length > 0 ? 'text-aether-200' : 'text-slate-500'}`}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-mono text-xs opacity-70">{category.code}</span>
                <span className="text-sm font-medium truncate">{category.name}</span>
                <span className="ml-auto text-xs bg-slate-800 px-1.5 rounded-full">{catItems.length}</span>
              </button>

              {isExpanded && (
                <div className="ml-6 border-l border-slate-700 pl-2 mt-1 space-y-1">
                  {catItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="w-full text-left p-2 rounded hover:bg-aether-900/30 group transition-all"
                    >
                      <div className="flex items-center gap-2 text-aether-100 font-medium text-sm">
                        <FileText className="w-3 h-3 text-aether-400" />
                        {item.title}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.pillarConnections.slice(0, 3).map(pid => {
                          const pillar = PILLARS[pid as PillarId];
                          if (!pillar) return null;
                          return (
                            <span key={pid} className={`text-[10px] px-1 rounded border border-slate-700 ${pillar.color}`}>
                              {pillar.symbol}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  ))}
                  {catItems.length === 0 && (
                    <div className="text-xs text-slate-600 italic p-2">No scrolls found here...</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryExplorer;
