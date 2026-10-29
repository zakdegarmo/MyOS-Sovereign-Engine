
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Server, Database, Box } from 'lucide-react';

interface CodexNode {
    id: string;
    name: string;
    type: 'pillar' | 'factor';
    children?: CodexNode[];
}

// Static Registry of the 110 Nodes (Matches Backend Scaffold)
export const CODEX_REGISTRY: CodexNode[] = [
    {
        id: 'Self', name: 'Self', type: 'pillar', children: [
            { id: 'Self.Identity', name: 'Identity', type: 'factor' },
            { id: 'Self.SubjectOf', name: 'SubjectOf', type: 'factor' },
            { id: 'Self.Applies', name: 'Applies', type: 'factor' },
            { id: 'Self.Seeks', name: 'Seeks', type: 'factor' },
            { id: 'Self.Affirms', name: 'Affirms', type: 'factor' },
            { id: 'Self.Undergoes', name: 'Undergoes', type: 'factor' },
            { id: 'Self.Pursues', name: 'Pursues', type: 'factor' },
            { id: 'Self.Experiences', name: 'Experiences', type: 'factor' },
            { id: 'Self.AspiresTo', name: 'AspiresTo', type: 'factor' },
            { id: 'Self.IsRealizedBy', name: 'IsRealizedBy', type: 'factor' },
        ]
    },
    {
        id: 'Thought', name: 'Thought', type: 'pillar', children: [
            { id: 'Thought.Identity', name: 'Identity', type: 'factor' },
            { id: 'Thought.SubjectOf', name: 'SubjectOf', type: 'factor' },
            { id: 'Thought.Applies', name: 'Applies', type: 'factor' },
            { id: 'Thought.Seeks', name: 'Seeks', type: 'factor' },
            { id: 'Thought.Affirms', name: 'Affirms', type: 'factor' },
            { id: 'Thought.Undergoes', name: 'Undergoes', type: 'factor' },
            { id: 'Thought.Pursues', name: 'Pursues', type: 'factor' },
            { id: 'Thought.Experiences', name: 'Experiences', type: 'factor' },
            { id: 'Thought.AspiresTo', name: 'AspiresTo', type: 'factor' },
            { id: 'Thought.IsRealizedBy', name: 'IsRealizedBy', type: 'factor' },
        ]
    },
    {
        id: 'Logic', name: 'Logic', type: 'pillar', children: [
            { id: 'Logic.Structures', name: 'Structures', type: 'factor' },
            { id: 'Logic.Governs', name: 'Governs', type: 'factor' },
            { id: 'Logic.Foundation', name: 'Foundation', type: 'factor' },
            { id: 'Logic.Ensures', name: 'Ensures', type: 'factor' },
            { id: 'Logic.Describes', name: 'Describes', type: 'factor' },
            { id: 'Logic.Validates', name: 'Validates', type: 'factor' },
            { id: 'Logic.Underpins', name: 'Underpins', type: 'factor' },
            { id: 'Logic.Contradicts', name: 'Contradicts', type: 'factor' },
            { id: 'Logic.Grounds', name: 'Grounds', type: 'factor' },
            { id: 'Logic.IsFoundationOf', name: 'IsFoundationOf', type: 'factor' },
        ]
    },
    {
        id: 'Omni', name: 'Omni', type: 'pillar', children: [
            { id: 'Omni.MergesWith', name: 'MergesWith', type: 'factor' },
            { id: 'Omni.Contemplates', name: 'Contemplates', type: 'factor' },
            { id: 'Omni.IsSubsetOf', name: 'IsSubsetOf', type: 'factor' },
            { id: 'Omni.IsAspectOf', name: 'IsAspectOf', type: 'factor' },
            { id: 'Omni.EmergesFrom', name: 'EmergesFrom', type: 'factor' },
            { id: 'Omni.AspiresTo', name: 'AspiresTo', type: 'factor' },
            { id: 'Omni.SeeksToUnderstand', name: 'SeeksToUnderstand', type: 'factor' },
            { id: 'Omni.HarmonizesWith', name: 'HarmonizesWith', type: 'factor' },
            { id: 'Omni.Unifies', name: 'Unifies', type: 'factor' },
            { id: 'Omni.Is', name: 'Is', type: 'factor' },
        ]
    }
];

const TreeNode: React.FC<{ node: CodexNode; level: number; activeId: string | null; onSelect: (id: string, type: 'pillar' | 'factor') => void }> = ({ node, level, activeId, onSelect }) => {
    const [expanded, setExpanded] = useState(false);
    const isActive = activeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(node.id, node.type);
        if (hasChildren) setExpanded(!expanded);
    };

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors ${isActive ? 'bg-cyan-900/40 text-cyan-300' : 'hover:bg-white/5 text-slate-400'}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                {hasChildren ? (
                    expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : <span className="w-3.5" />} {/* Spacer */}

                {node.type === 'pillar' ? <Database size={14} className={isActive ? "text-cyan-400" : "text-slate-500"} /> : <Server size={14} className={isActive ? "text-cyan-400" : "text-slate-600"} />}

                <span className={`text-xs font-mono tracking-wide ${isActive ? 'font-bold' : ''}`}>{node.name}</span>
            </div>

            {expanded && hasChildren && (
                <div>
                    {node.children!.map(child => (
                        <TreeNode key={child.id} node={child} level={level + 1} activeId={activeId} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const CodexExplorer: React.FC<{ activeNode: string | null; onSelectNode: (id: string) => void }> = ({ activeNode, onSelectNode }) => {
    return (
        <div className="h-full flex flex-col bg-black/60 border-r border-white/10 backdrop-blur-md">
            <div className="p-3 border-b border-white/10 bg-black/40">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Box size={12} /> Registry
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                {CODEX_REGISTRY.map(node => (
                    <TreeNode key={node.id} node={node} level={0} activeId={activeNode} onSelect={onSelectNode} />
                ))}
            </div>
        </div>
    );
};
