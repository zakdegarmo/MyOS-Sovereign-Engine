import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, BookOpen, Brain } from 'lucide-react';
import type { LibraryNode } from '@Omni/types';

interface TreeItemProps {
    node: LibraryNode;
    level: number;
    onSelect: (item: any) => void;
    activeId?: string;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, onSelect, activeId }) => {
    const [isOpen, setIsOpen] = useState(level < 1);
    const hasChildren = Object.keys(node.children || {}).length > 0;
    const hasBooks = (node.books || []).length > 0;
    const hasMemories = (node.memories || []).length > 0;

    const isActive = activeId === node.id;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(node);
    };

    return (
        <div className="flex flex-col">
            <div
                className={`
                    flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer text-sm transition-colors
                    ${isActive ? 'bg-amber-500/10 text-amber-200' : 'text-slate-400 hover:text-slate-200'}
                `}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleSelect}
            >
                {(hasChildren || hasBooks || hasMemories) && (
                    <button onClick={handleToggle} className="p-0.5 hover:bg-white/10 rounded transition-colors opacity-50">
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                )}
                {!hasChildren && !hasBooks && !hasMemories && <div className="w-4" />}

                <Folder size={14} className="text-amber-500/80" />
                <span className="truncate font-mono text-[11px]">{node.name}</span>

                <div className="ml-auto flex gap-1 opacity-40">
                    {hasBooks && <BookOpen size={10} />}
                    {hasMemories && <Brain size={10} />}
                </div>
            </div>

            {isOpen && (
                <div className="flex flex-col">
                    {/* Render Folders (Children) */}
                    {Object.values(node.children || {}).map(child => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            activeId={activeId}
                        />
                    ))}

                    {/* Render Books */}
                    {(node.books || []).map(book => (
                        <div
                            key={book.id}
                            className={`
                                flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer text-[11px] transition-colors
                                ${activeId === book.id ? 'bg-cyan-500/10 text-cyan-200' : 'text-slate-500 hover:text-slate-300'}
                            `}
                            style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
                            onClick={(e) => { e.stopPropagation(); onSelect(book); }}
                        >
                            <BookOpen size={12} className="text-cyan-500/60" />
                            <span className="truncate">{book.title}</span>
                        </div>
                    ))}

                    {/* Render Memories */}
                    {(node.memories || []).map(mem => (
                        <div
                            key={mem.id}
                            className={`
                                flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer text-[11px] transition-colors
                                ${activeId === mem.id ? 'bg-indigo-500/10 text-indigo-200' : 'text-slate-500 hover:text-slate-300'}
                            `}
                            style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
                            onClick={(e) => { e.stopPropagation(); onSelect(mem); }}
                        >
                            <Brain size={12} className="text-indigo-500/60" />
                            <span className="truncate">{mem.content.text?.substring(0, 30)}...</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TreeItem;
