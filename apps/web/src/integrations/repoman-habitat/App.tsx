import React, { useState } from 'react';
import { MOCK_REPO } from './constants';
import { FileNode } from './types';
import Graph3D from './components/Graph3D';
import FileExplorer from './components/FileExplorer';
import OntologyHUD from './components/OntologyHUD';
import BenchmarkModal from './components/BenchmarkModal';
import { parseLocalDirectory } from './utils/fileSystem';
import { Box, Layers, GitBranch, Settings, Database, Activity, HardDrive, Loader2 } from 'lucide-react';

export default function App() {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [repoData, setRepoData] = useState(MOCK_REPO);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'dual'>('dual');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenLocal = async () => {
    try {
      // Check for browser support
      if (!('showDirectoryPicker' in window)) {
        alert("Your browser does not support the File System Access API. Try Chrome or Edge.");
        return;
      }

      setIsLoading(true);
      // @ts-ignore - TS doesn't fully know this API yet in standard configs
      const dirHandle = await window.showDirectoryPicker();
      
      const newData = await parseLocalDirectory(dirHandle);
      setRepoData(newData);
    } catch (err) {
      console.error("Failed to open local directory", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-4 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Box className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white leading-none">RepoMan<span className="text-cyan-400">.genetic</span></h1>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest">ONTOLOGICAL_IDE_SYSTEM</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           {/* Ingest Local Button */}
           <button 
             onClick={handleOpenLocal}
             disabled={isLoading}
             className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-900/20 px-3 py-1.5 rounded border border-cyan-800 hover:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoading ? <Loader2 size={14} className="animate-spin"/> : <HardDrive size={14} />}
             <span>INGEST LOCAL REPO</span>
           </button>

           <div className="h-6 w-px bg-slate-700 mx-2"></div>

           <div className="relative group">
              <input 
                type="text" 
                placeholder="Dewey Subject Search..." 
                className="bg-slate-950 border border-slate-700 text-xs px-3 py-1.5 rounded w-48 focus:border-cyan-500 focus:outline-none transition-all font-mono text-slate-300"
              />
              <div className="absolute right-2 top-1.5 text-slate-600 text-[10px] border border-slate-700 px-1 rounded">CMD+K</div>
           </div>
           
           <div className="h-6 w-px bg-slate-700 mx-2"></div>

           <button 
             onClick={() => setShowBenchmark(true)}
             className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors bg-purple-900/20 px-3 py-1.5 rounded border border-purple-800 hover:border-purple-500"
           >
             <Activity size={14} />
             <span>BENCHMARK</span>
           </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: File Explorer */}
        <div className="w-64 flex-shrink-0 flex flex-col z-10 shadow-xl">
           <FileExplorer 
             nodes={repoData.nodes} 
             selectedId={selectedNode?.id}
             onSelect={setSelectedNode}
           />
           <div className="p-3 bg-slate-900 border-t border-slate-800 border-r text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-2 mb-1"><GitBranch size={12}/> LOCAL_FS_ACCESS</div>
              <div className="flex items-center gap-2"><Database size={12}/> {repoData.nodes.length} NODES MAPPED</div>
           </div>
        </div>

        {/* Center: Graph */}
        <div className="flex-1 relative bg-black">
           {/* Background Grid Pattern */}
           <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
           </div>
           
           <Graph3D 
             data={repoData} 
             onNodeClick={setSelectedNode} 
             width={window.innerWidth - 64 - 320} // approx calc
             height={window.innerHeight - 56}
           />
        </div>

        {/* Right Sidebar: Ontology & Details */}
        <div className="w-80 flex-shrink-0 bg-slate-900/80 border-l border-slate-800 z-10 backdrop-blur-sm">
            <OntologyHUD node={selectedNode} />
        </div>
      </div>
      
      {/* Footer / Status Bar */}
      <div className="h-6 bg-cyan-950 text-cyan-200/50 text-[10px] font-mono flex items-center px-4 justify-between border-t border-cyan-900/30">
         <div className="flex gap-4">
            <span>MODE: {viewMode.toUpperCase()}</span>
            <span>CONNECTION: SECURE</span>
            <span>GEMINI_LINK: ACTIVE</span>
         </div>
         <div>
            v0.9.5-beta // FILE_SYSTEM_ACCESS_ENABLED
         </div>
      </div>

      {/* Modals */}
      {showBenchmark && <BenchmarkModal onClose={() => setShowBenchmark(false)} />}
    </div>
  );
}
