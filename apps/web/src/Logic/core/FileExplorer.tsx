import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Database, Code, Box } from 'lucide-react';
import type { FileNode } from './types';

interface FileExplorerProps {
    nodes: Record<string, FileNode>;
    activeNodeId: string | null;
    onNodeClick: (id: string) => void;
}

interface TreeNode {
    id: string; // Full path or unique ID
    name: string;
    type: 'file' | 'directory';
    children: Record<string, TreeNode>;
    nodeData?: FileNode; // Link back to original data if it exists
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, activeNodeId, onNodeClick }) => {
    // 1. Build Tree from Flat Nodes (Memoized)
    const tree = useMemo(() => {
        const root: TreeNode = { id: 'root', name: 'ROOT', type: 'directory', children: {} };

        Object.values(nodes).forEach(node => {
            // Assume node.id is the file path (e.g., "src/components/App.tsx")
            // If it matches "root" or specific mock IDs, handle carefully. 
            // The scanner produces relative paths like "src/utils.ts" or "components/App.tsx" depending on CWD.
            // Let's normalize.

            const parts = node.id.split('/').filter(p => p && p !== '.');
            let current = root;

            parts.forEach((part, index) => {
                const isLast = index === parts.length - 1;

                if (!current.children[part]) {
                    current.children[part] = {
                        id: parts.slice(0, index + 1).join('/'),
                        name: part,
                        type: isLast && node.type === 'file' ? 'file' : 'directory',
                        children: {},
                        nodeData: isLast ? node : undefined
                    };
                }
                current = current.children[part];
            });
        });

        return root;
    }, [nodes]);

    return (
        <div className="flex flex-col h-full bg-[#111] border-r border-[#333] w-64 select-none">
            <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-[#222]">
                Explorer
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#333]">
                <RecursiveTree
                    node={tree}
                    depth={0}
                    activeNodeId={activeNodeId}
                    onNodeClick={onNodeClick}
                />
            </div>
        </div>
    );
};

const RecursiveTree: React.FC<{
    node: TreeNode;
    depth: number;
    activeNodeId: string | null;
    onNodeClick: (id: string) => void;
}> = ({ node, depth, activeNodeId, onNodeClick }) => {
    const [isOpen, setIsOpen] = useState(depth < 2); // Auto-expand top levels

    // Sort: Folders first, then files
    const sortedChildren = useMemo(() => {
        return Object.values(node.children).sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });
    }, [node.children]);

    if (node.id === 'root') {
        // Don't render root itself, just children
        return (
            <div className="flex flex-col gap-0.5">
                {sortedChildren.map(child => (
                    <RecursiveTree
                        key={child.id}
                        node={child}
                        depth={depth} // Keep depth 0 for first level visual
                        activeNodeId={activeNodeId}
                        onNodeClick={onNodeClick}
                    />
                ))}
            </div>
        );
    }

    const isActive = activeNodeId === node.nodeData?.id;
    const hasChildren = sortedChildren.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'directory') {
            setIsOpen(!isOpen);
        } else {
            // Only clickable if it maps to a real file node
            if (node.nodeData) {
                onNodeClick(node.nodeData.id);
            }
        }
    };

    const getIcon = () => {
        if (node.type === 'directory') return isOpen ? <FolderOpen size={14} className="text-amber-500" /> : <Folder size={14} className="text-amber-500" />;
        if (node.name.endsWith('.tsx')) return <Code size={14} className="text-blue-400" />;
        if (node.name.endsWith('.ts')) return <Code size={14} className="text-blue-500" />;
        if (node.name.endsWith('.json')) return <Database size={14} className="text-yellow-400" />;
        return <File size={14} className="text-slate-400" />;
    };

    return (
        <div className="flex flex-col">
            <div
                className={`
                    flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors
                    ${isActive ? 'bg-blue-900/40 text-blue-200' : 'text-slate-400 hover:bg-[#222] hover:text-slate-200'}
                `}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleClick}
            >
                {/* Arrow */}
                {node.type === 'directory' && (
                    <div className="opacity-70">
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                )}
                {/* Spacer if no arrow */}
                {node.type !== 'directory' && <div className="w-3" />}

                {/* Icon */}
                {getIcon()}

                <span className="truncate text-xs font-mono">{node.name}</span>
            </div>

            {/* Children */}
            {isOpen && hasChildren && (
                <div className="flex flex-col gap-0.5">
                    {sortedChildren.map(child => (
                        <RecursiveTree
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            activeNodeId={activeNodeId}
                            onNodeClick={onNodeClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
