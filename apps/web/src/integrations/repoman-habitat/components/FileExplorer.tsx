import React, { useState } from 'react';
import { FileNode } from '../types';
import { Folder, FileCode, ChevronRight, ChevronDown, Box } from 'lucide-react';

interface FileExplorerProps {
  nodes: FileNode[];
  selectedId: string | undefined;
  onSelect: (node: FileNode) => void;
}

const FileTreeItem: React.FC<{ 
  node: FileNode; 
  level: number;
  allNodes: FileNode[];
  selectedId: string | undefined;
  onSelect: (node: FileNode) => void;
}> = ({ node, level, allNodes, selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(true); // Default open for demo
  
  // Find children in the flat list based on simple path logic for this mock
  const children = allNodes.filter(n => 
    n.path.startsWith(node.path + '/') && 
    n.path.split('/').length === node.path.split('/').length + 1
  );

  const hasChildren = children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer transition-colors font-mono text-xs select-none
          ${isSelected ? 'bg-cyan-900/40 text-cyan-300 border-r-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
            if (hasChildren) setIsOpen(!isOpen);
            onSelect(node);
        }}
      >
        <span className="mr-1.5 opacity-70">
          {hasChildren ? (
            isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
             <span className="w-3 block"></span>
          )}
        </span>
        
        {node.type === 'dir' ? (
          <Folder size={14} className="mr-2 text-cyan-600" />
        ) : (
          <FileCode size={14} className="mr-2 text-purple-500" />
        )}
        
        <span className="truncate">{node.name}</span>
        
        {/* Geometric indicator */}
        <span className="ml-auto text-[10px] opacity-30 flex items-center gap-1" title={`Points: ${node.complexity}`}>
             {node.complexity} <Box size={8} />
        </span>
      </div>

      {isOpen && children.map(child => (
        <FileTreeItem 
            key={child.id} 
            node={child} 
            level={level + 1} 
            allNodes={allNodes}
            selectedId={selectedId}
            onSelect={onSelect}
        />
      ))}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, selectedId, onSelect }) => {
  // Only render root items initially
  const rootNodes = nodes.filter(n => n.path.split('/').length === 2 || n.path === '/');

  return (
    <div className="h-full overflow-y-auto bg-slate-900/50 border-r border-slate-800">
      <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-500 tracking-wider flex justify-between items-center">
        <span>SOURCE_TREE</span>
        <span className="bg-slate-800 px-1.5 rounded text-[10px]">{nodes.length} NODES</span>
      </div>
      <div className="py-2">
        {rootNodes.map(node => (
          <FileTreeItem 
            key={node.id} 
            node={node} 
            level={0} 
            allNodes={nodes}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
