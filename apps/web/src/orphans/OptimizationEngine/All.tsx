import React, { useState, useEffect, useMemo } from 'react';
import { Cpu, Code, Layers, FolderPlus, Play, FileText, Loader2, Sparkles, HardDrive, Trash2, Folder, ChevronDown, MonitorPlay, X, Wand2, GitBranch } from 'lucide-react';
import ResizableSplitter from '@Existence/ResizableSplitter';
import { DependencyGraph } from '@Logic/Factors/Structures/DependencyGraph';
import { RepoExplorer } from '@Logic/Factors/Foundation/RepoExplorer';
import { GitHubPanel } from '@Logic/Factors/Underpins/GitHubPanel';
import { analyzeCode, analyzeSystemArchitecture, fixCode } from '@Thought/services/geminiService';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { useFileSystem } from '@Improvement/Factors/Enhances/useFileSystem';
import { SavrasForesight } from '@Improvement/Factors/Process/SavrasForesight';
import { AgentOrchestrator } from '@Omni/lib/modules/AgentOrchestrator';
import type { UserGestalt } from '@Omni/types';
import { SemanticHeader } from '@Omni/components/shared/SemanticHeader';

interface EvolvesGridProps {
    workflowEngine?: any;
    userGestalt?: UserGestalt;
    agentOrchestrator?: AgentOrchestrator;
}

export const OptimizationEngine: React.FC<EvolvesGridProps> = ({ workflowEngine, userGestalt, agentOrchestrator }) => {
    // FS Hook
    const { repos, allFiles, mount, unmount, readFile, writeFile, createFile, scanImports, resetFS, connectServer } = useFileSystem();

    // UI State
    const [activeRepoName, setActiveRepoName] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [isGitOpen, setIsGitOpen] = useState(false);
    const [isGitConnected, setIsGitConnected] = useState(false);

    // AGENT STATE
    const [isAgentRunning, setIsAgentRunning] = useState(false);
    const [agentLog, setAgentLog] = useState<string[]>([]);

    // Track previous selection
    const prevSelectedIdRef = React.useRef<string | null>(null);

    // Set initial active repo
    useEffect(() => {
        if (repos.length > 0 && !activeRepoName) setActiveRepoName(repos[0].name);
    }, [repos, activeRepoName]);

    // Derived State
    const activeFiles = useMemo(() => activeRepoName ? allFiles.filter(f => f.repo === activeRepoName) : [], [activeRepoName, allFiles]);
    const visibleFiles = useMemo(() => activeFiles.length > 2000 ? activeFiles.slice(0, 2000) : activeFiles, [activeFiles]);
    const isLargeRepo = activeFiles.length > 2000;

    // --- AGENT ORCHESTRATION ---
    useEffect(() => {
        if (agentOrchestrator && activeFiles.length > 0) {
            agentOrchestrator.setFiles(activeFiles.map(f => ({ ...f })));
        }
    }, [agentOrchestrator, activeFiles]);

    useEffect(() => {
        let interval: any;
        if (isAgentRunning && agentOrchestrator) {
            interval = setInterval(async () => {
                const mockLibrary = { id: 'root', name: 'ImprovementScope', children: {}, books: [] };
                const result = await agentOrchestrator.forceRun('Improvement' as any, mockLibrary, []);
                if (result.result?.insights?.length > 0) {
                    setAgentLog(prev => [...result.result.insights, ...prev].slice(0, 50));
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isAgentRunning, agentOrchestrator]);

    // Read Content on Select
    useEffect(() => {
        const loadContent = async () => {
            if (selectedId !== prevSelectedIdRef.current) {
                if (selectedId) setAnalysis(null);
                prevSelectedIdRef.current = selectedId;
            }
            if (!selectedId) { setFileContent(null); return; }

            const fileNode = allFiles.find(f => f.id === selectedId);
            if (!fileNode) return;

            if (fileNode.type === 'directory') {
                setFileContent("// Selected Directory: " + fileNode.name + "\n// Click 'Analyze Folder' to scan contents.");
                return;
            }
            try { setFileContent(await readFile(selectedId)); }
            catch { setFileContent("// Unable to read file."); }
        };
        loadContent();
    }, [selectedId, readFile, allFiles]);

    const handleScanDependencies = async () => {
        if (!activeRepoName || isScanning) return;
        setIsScanning(true);
        try { await scanImports(activeRepoName); }
        finally { setIsScanning(false); }
    };

    const handleAutoFix = async () => {
        if (!selectedId || !fileContent || isFixing) return;
        const apiKey = getApiKey();
        if (!apiKey || !confirm("Run Auto-Fixer?")) return;
        setIsFixing(true);
        try {
            const fixed = await fixCode(fileContent, "Fix lint errors, improve types.", apiKey);
            if (fixed && fixed !== fileContent) {
                await writeFile(selectedId, fixed); setFileContent(fixed); setAnalysis("Auto-Fix Complete.");
            } else setAnalysis("No changes needed.");
        } catch (e: any) { setAnalysis("Failed: " + e.message); }
        finally { setIsFixing(false); }
    };

    const handleAnalyze = async () => {
        const apiKey = getApiKey();
        if (!apiKey) return alert("API Key Missing");
        setIsAnalyzing(true);
        try {
            if (selectedId) {
                const fileNode = allFiles.find(f => f.id === selectedId);
                if (!fileNode) return;
                if (fileNode.type === 'directory') {
                    setAnalysis("Folder analysis scheduled...");
                } else {
                    if (fileContent) setAnalysis(await analyzeCode(fileContent, selectedId, apiKey));
                }
            }
        } catch { setAnalysis("Analysis failed."); }
        finally { setIsAnalyzing(false); }
    };

    const handleSystemAnalyze = async () => {
        if (!activeRepoName) return;
        const apiKey = getApiKey();
        if (!apiKey) return alert("API Key Missing");
        setIsAnalyzing(true);
        setAnalysis("Scanning Architecture...");
        try {
            const fileTree = activeFiles.map(f => f.id.replace(activeRepoName + '://', ''));
            const result = await analyzeSystemArchitecture(fileTree, [], apiKey);
            setAnalysis(result);
        } catch (e: any) { setAnalysis("Error: " + e.message); }
        finally { setIsAnalyzing(false); }
    };

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col relative overflow-hidden text-slate-200 font-mono">
            <SemanticHeader vector="improvement" relation="evolves" target="codebase" description="Mechanicus IDE (Orphaned)" />

            {/* AGENT LOG OVERLAY */}
            {agentLog.length > 0 && (
                <div className="absolute top-12 right-8 z-[100] w-[400px] max-h-[60vh] bg-black/95 backdrop-blur-md border border-emerald-500 text-emerald-300 p-4 rounded-lg text-xs font-mono shadow-2xl overflow-y-auto pointer-events-auto ring-1 ring-emerald-500/50">
                    <div className="flex justify-between items-center border-b border-emerald-500/20 pb-1 mb-1">
                        <span className="font-bold">AGENT STREAM</span>
                        <button onClick={() => setAgentLog([])} className="hover:text-white"><X size={10} /></button>
                    </div>
                    {agentLog.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</div>
                    ))}
                </div>
            )}

            <div className="flex-1 relative overflow-hidden flex">
                <ResizableSplitter direction="horizontal" initialSize={25} minSize={15} maxSize={40}>
                    {/* LEFT PANE: REPO TREE */}
                    <div className="h-full flex flex-col bg-slate-900/50 border-r border-slate-800">
                        <div className="flex flex-col border-b border-slate-800 bg-slate-950/50">
                            <div className="h-10 flex items-center justify-between px-3">
                                <span className="font-bold text-[10px] tracking-tight text-slate-500 hidden md:block">REPOSITORY EXPLORER</span>
                                <div className="flex items-center gap-1">
                                    {activeRepoName && (
                                        <>
                                            <button onClick={() => setIsGitOpen(!isGitOpen)} className={`p-1.5 rounded flex items-center gap-1 ${isGitOpen ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white'}`}><GitBranch size={14} /></button>
                                            <button onClick={handleScanDependencies} disabled={isScanning} className={`p-1.5 rounded flex items-center gap-1 ${isScanning ? 'text-blue-400 bg-blue-500/10 animate-pulse' : 'text-slate-400 hover:text-blue-400'}`}><Layers size={14} /></button>
                                        </>
                                    )}
                                    <button onClick={mount} className="px-2 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-md border border-cyan-500/20" title="Mount"><FolderPlus size={14} /></button>
                                    <button onClick={connectServer} className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20" title="Server"><HardDrive size={14} /></button>
                                    <button onClick={resetFS} className="p-1.5 rounded hover:bg-red-900/50 text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="px-3 pb-2 pt-1">
                                <div className="relative group">
                                    <select className="w-full bg-slate-900 border border-slate-700 text-xs rounded p-1.5 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer" value={activeRepoName || ''} onChange={(e) => setActiveRepoName(e.target.value)} disabled={repos.length === 0}>
                                        {repos.length === 0 && <option>No Repositories</option>}
                                        {repos.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2 text-slate-500 pointer-events-none" size={12} />
                                </div>
                                {activeRepoName && (
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <span className="text-[10px] text-slate-500">{activeFiles.length} Files</span>
                                        <button onClick={() => { if (confirm(`Unmount ${activeRepoName}?`)) { unmount(activeRepoName); setActiveRepoName(repos.filter(r => r.name !== activeRepoName)[0]?.name || null); } }} className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1"><Trash2 size={10} /> Unmount</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            {repos.length > 0 && activeRepoName ? (<RepoExplorer files={visibleFiles} onSelect={setSelectedId} highlightedId={selectedId || undefined} />) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50 p-4 text-center"><FolderPlus size={32} className="mb-2" /><span className="text-xs">Mount Local Repo</span></div>)}
                        </div>
                    </div>

                    {/* RIGHT PANE: GRAPH + EDITOR */}
                    <div className="h-full flex flex-col relative bg-slate-950">
                        <div className="h-12 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur z-10 absolute top-0 w-full pointer-events-none">
                            <div className="pointer-events-auto flex items-center gap-2 max-w-[50%]">
                                <Code className="text-emerald-500" size={18} />
                                <h1 className="font-bold text-lg tracking-tight text-slate-200 truncate">{selectedId ? selectedId.split('://')[1] : activeRepoName || 'IMPROVEMENT ENGINE'}</h1>
                                {selectedId && (<button onClick={() => setSelectedId(null)} className="ml-2 p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white"><X size={14} /></button>)}
                            </div>
                            <div className="pointer-events-auto flex items-center gap-4">
                                <button
                                    onClick={() => setIsAgentRunning(!isAgentRunning)}
                                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${isAgentRunning ? 'bg-emerald-900/50 text-emerald-400 animate-pulse border border-emerald-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                    title="Run Agents"
                                >
                                    <Play size={14} className={isAgentRunning ? "fill-current" : ""} />
                                    {isAgentRunning ? "AGENTS ON" : "RUN AGENTS"}
                                </button>

                                {activeRepoName && !selectedId && (<button onClick={handleSystemAnalyze} disabled={isAnalyzing} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${isAnalyzing ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/30'}`}><MonitorPlay size={14} /> SYSTEM ANALYST</button>)}
                                {selectedId && (<button onClick={handleAutoFix} disabled={isFixing} className={`p-1.5 rounded transition-all flex items-center gap-1 ${isFixing ? 'text-amber-300 bg-amber-500/20 animate-spin' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-900/30'}`} title="Auto-Fix Code"><Wand2 size={16} /></button>)}
                                {selectedId && (<button onClick={handleAnalyze} disabled={isAnalyzing} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${isAnalyzing ? 'bg-amber-500/20 text-amber-500 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}>{isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : (allFiles.find(f => f.id === selectedId)?.type === 'directory' ? <Folder size={14} /> : <Sparkles size={14} />)}{isAnalyzing ? 'ANALYZING...' : (allFiles.find(f => f.id === selectedId)?.type === 'directory' ? 'ANALYZE FOLDER' : 'ANALYZE CODE')}</button>)}
                            </div>
                        </div>

                        <div className="flex-1 flex pt-12 relative h-full">
                            <div className="absolute bottom-8 right-8 w-64 h-auto z-10 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity"><SavrasForesight /></div>
                            <div className={`absolute inset-0 transition-opacity duration-300 ${selectedId || isGitOpen ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                {isLargeRepo ? (<div className="h-full w-full flex items-center justify-center text-slate-800 font-bold text-4xl select-none">LARGE REPO</div>) : (activeFiles.length > 0 && (<DependencyGraph data={activeFiles.map(f => ({ ...f, parent: f.parent?.replace(activeRepoName + '://', '') })) as any[]} onSelectNode={setSelectedId} highlightNodes={selectedId ? new Set([selectedId]) : undefined} />))}
                            </div>
                            {(selectedId || analysis) && !isGitOpen && (
                                <div className="flex-1 z-0 flex flex-col md:flex-row h-full overflow-hidden animate-in fade-in duration-300">
                                    {selectedId && (<div className="flex-1 bg-slate-900/80 backdrop-blur border-r border-slate-800 p-4 overflow-auto custom-scrollbar"><div className="text-xs text-slate-500 font-mono mb-2 flex items-center gap-2"><FileText size={14} /> {selectedId}</div><pre className="text-xs md:text-sm font-mono text-slate-300 whitespace-pre-wrap">{fileContent || "Loading..."}</pre></div>)}
                                    {analysis && (
                                        <div className={`${selectedId ? 'w-full md:w-1/3 border-l' : 'w-full'} bg-slate-950 border-slate-800 p-4 overflow-y-auto custom-scrollbar shadow-2xl relative`}>
                                            <div className="sticky top-0 bg-slate-950/90 py-2 border-b border-slate-800 mb-4 flex items-center justify-between z-10"><div className="text-xs font-bold text-amber-500 uppercase flex items-center gap-2"><Sparkles size={14} /> Neural Analysis</div><button onClick={() => setAnalysis(null)} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white"><X size={14} /></button></div>
                                            <div className="prose prose-invert prose-sm text-slate-300 max-w-none"><div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{analysis}</div></div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {isGitOpen && (<div className={`absolute inset-0 z-20 flex ${isGitConnected ? 'justify-end items-stretch' : 'items-center justify-center bg-black/60 backdrop-blur-sm'} transition-colors duration-300`}><div className={`${isGitConnected ? 'w-full md:w-1/2 lg:w-1/3 h-full border-l border-slate-700 shadow-2xl' : 'w-[400px] h-auto min-h-[400px] rounded-xl border border-slate-700 overflow-hidden shadow-2xl'} bg-slate-950 pointer-events-auto animate-in ${isGitConnected ? 'slide-in-from-right' : 'zoom-in-95 fade-in'}`}><GitHubPanel repoName={activeRepoName || ''} activeRepoName={activeRepoName || undefined} onClose={() => setIsGitOpen(false)} onConnectionStatus={setIsGitConnected} onCreateFile={createFile} /></div></div>)}
                        </div>
                    </div>

                </ResizableSplitter>
            </div>
        </div>
    );
};
