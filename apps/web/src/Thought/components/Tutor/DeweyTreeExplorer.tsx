import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, FileText, Hash } from 'lucide-react';
import { DEWEY_DATA, type DeweyNode } from '../../data/DeweyData';

interface DeweyTreeExplorerProps {
    onSelectCode: (code: string) => void;
}

export const DeweyTreeExplorer: React.FC<DeweyTreeExplorerProps> = ({ onSelectCode }) => {
    return (
        <div className="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-hide h-full">
            {DEWEY_DATA.map((node) => (
                <TreeNode key={node.code} node={node} level={0} onSelectCode={onSelectCode} />
            ))}
        </div>
    );
};

const TreeNode: React.FC<{ node: DeweyNode, level: number, onSelectCode: (code: string) => void }> = ({ node, level, onSelectCode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    const COLORS = [
        "text-slate-400", "text-purple-400", "text-orange-400",
        "text-blue-400", "text-yellow-400", "text-emerald-400",
        "text-cyan-400", "text-pink-400", "text-red-400", "text-indigo-400"
    ];

    const mainClass = parseInt(node.code[0]);
    const colorClass = COLORS[mainClass] || "text-white/60";

    return (
        <div className="flex flex-col">
            <button
                onClick={() => {
                    if (hasChildren) setIsOpen(!isOpen);
                    onSelectCode(node.code);
                }}
                className={`
                    flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white/5 transition-colors group text-left
                    ${level === 0 ? 'mt-2' : ''}
                `}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    {hasChildren ? (
                        isOpen ? <ChevronDown size={14} className="text-white/20" /> : <ChevronRight size={14} className="text-white/20" />
                    ) : (
                        <div className="w-3.5" />
                    )}

                    {level === 0 ? (
                        <Folder size={16} className={colorClass} />
                    ) : level === 1 ? (
                        <Hash size={14} className="text-white/40" />
                    ) : (
                        <FileText size={14} className="text-white/20" />
                    )}

                    <span className={`text-[10px] font-mono opacity-40 group-hover:opacity-100 ${level === 0 ? 'font-bold' : ''}`}>
                        {node.code}
                    </span>

                    <span className={`text-xs truncate ${level === 0 ? 'font-bold tracking-tight uppercase' : 'text-white/70'}`}>
                        {node.name}
                    </span>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-l border-white/5 ml-4"
                    >
                        {node.children!.map((child) => (
                            <TreeNode key={child.code} node={child} level={level + 1} onSelectCode={onSelectCode} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
