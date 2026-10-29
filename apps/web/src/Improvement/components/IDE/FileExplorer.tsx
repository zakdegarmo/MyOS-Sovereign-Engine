
import React, { useState, useEffect } from 'react';
import { Folder, FileCode, ChevronRight, ChevronDown } from 'lucide-react';

export type FileNode = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileNode[];
    language?: string;
    content?: string;
    // Helper state for lazy loading tracking
    loaded?: boolean;
};

interface FileExplorerProps {
    files: FileNode[];
    onFileSelect: (file: FileNode) => void;
    onExpand?: (node: FileNode) => void;
}

export default function FileExplorer({ files, onFileSelect, onExpand }: FileExplorerProps) {
    return (
        <div className="h-full flex flex-col p-2 bg-black/20 border-r border-white/10 overflow-y-auto">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">Project Root</h2>
            <div className="space-y-1">
                {files.map(file => (
                    <FileItem key={file.id} node={file} level={0} onSelect={onFileSelect} onExpand={onExpand} />
                ))}
            </div>
        </div>
    );
}

const FileItem = ({ node, level, onSelect, onExpand }: { node: FileNode, level: number, onSelect: (f: FileNode) => void, onExpand?: (n: FileNode) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        if (node.type === 'folder') {
            const newOpenState = !isOpen;
            setIsOpen(newOpenState);
            if (newOpenState && onExpand) {
                onExpand(node);
            }
        } else {
            onSelect(node);
        }
    };

    return (
        <div>
            <div
                className="flex items-center gap-1.5 p-1 hover:bg-white/5 rounded cursor-pointer text-xs text-gray-400 hover:text-gray-200 transition-colors select-none"
                style={{ paddingLeft: `${level * 10 + 4}px` }}
                onClick={handleClick}
            >
                {node.type === 'folder' && (
                    <span className="opacity-50">
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                )}
                {node.type === 'folder' ?
                    <Folder className="w-3.5 h-3.5 text-blue-400/80" /> :
                    <FileCode className="w-3.5 h-3.5 text-yellow-400/80" />
                }
                <span>{node.name}</span>
            </div>
            {node.type === 'folder' && isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileItem key={child.id} node={child} level={level + 1} onSelect={onSelect} onExpand={onExpand} />
                    ))}
                </div>
            )}
        </div>
    );
}
