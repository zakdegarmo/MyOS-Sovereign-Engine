
import React, { useState } from 'react';
import { Folder, FileCode, ChevronRight, ChevronDown } from 'lucide-react';

export type FileNode = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: FileNode[];
    language?: string;
    content?: string;
    loaded?: boolean;
};

interface FileExplorerProps {
    files: FileNode[];
    onFileSelect: (file: FileNode) => void;
    onExpand?: (node: FileNode) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect, onExpand }) => {
    return (
        <div className="h-full flex flex-col p-2 bg-black/20 overflow-y-auto custom-scrollbar">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Project Substrate</h2>
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
                className={`flex items-center gap-1.5 p-1.5 hover:bg-white/5 rounded-xl cursor-pointer text-[11px] transition-all select-none
                    ${isOpen ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}
                `}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                {node.type === 'folder' && (
                    <span className="opacity-50">
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </span>
                )}
                {node.type === 'folder' ?
                    <Folder className={`w-3.5 h-3.5 ${isOpen ? 'text-cyan-400' : 'text-cyan-600/80'}`} /> :
                    <FileCode className="w-3.5 h-3.5 text-amber-500/80" />
                }
                <span className="truncate">{node.name}</span>
            </div>
            {node.type === 'folder' && isOpen && node.children && (
                <div className="border-l border-white/5 ml-3">
                    {node.children.map(child => (
                        <FileItem key={child.id} node={child} level={level + 1} onSelect={onSelect} onExpand={onExpand} />
                    ))}
                </div>
            )}
        </div>
    );
}
