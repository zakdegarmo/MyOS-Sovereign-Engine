
import React, { useState, useEffect } from 'react';
import { FileExplorer, type FileNode } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { Code2, Save, Terminal, Shield, Zap } from 'lucide-react';
import { useSwarm } from '../../Omni/lib/useSwarm';

const CODEBASE_ROOT = 'c:/Users/zakde/Desktop/AntiGravity projects/MyOS';

interface IDEPanelProps {
    externalFilePath?: string | null;
}

export const IDEPanel: React.FC<IDEPanelProps> = ({ externalFilePath }) => {
    const [activeFile, setActiveFile] = useState<{ id: string; name: string; content: string; language: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [terminalOutput, setTerminalOutput] = useState<{ text: string, type: 'out' | 'error' | 'cmd' }[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const { callTool, isConnected } = useSwarm();

    const handleCommand = async (cmd: string) => {
        if (!cmd.trim() || !isConnected) return;
        setTerminalOutput(prev => [...prev, { text: cmd, type: 'cmd' }]);
        setIsExecuting(true);
        try {
            const result = await callTool('exec_cmd', { command: cmd });
            if (result.stdout) setTerminalOutput(prev => [...prev, { text: result.stdout, type: 'out' }]);
            if (result.stderr) setTerminalOutput(prev => [...prev, { text: result.stderr, type: 'error' }]);
            if (result.error) setTerminalOutput(prev => [...prev, { text: result.error, type: 'error' }]);
        } catch (err) {
            setTerminalOutput(prev => [...prev, { text: String(err), type: 'error' }]);
        } finally {
            setIsExecuting(false);
        }
    };

    // Deep Linking Effect
    useEffect(() => {
        if (externalFilePath && isConnected) {
            const loadExternalFile = async () => {
                try {
                    const result = await callTool("read_file", { path: externalFilePath });
                    const content = result.content[0].text;
                    const name = externalFilePath.split(/[/\\]/).pop() || 'unknown';
                    const language = name.endsWith('.ts') ? 'typescript' : name.endsWith('.tsx') ? 'typescript' : 'text';

                    setActiveFile({
                        id: externalFilePath,
                        name: name,
                        content: content,
                        language: language
                    });
                } catch (err) {
                    console.error("Failed to load external file:", err);
                }
            };
            loadExternalFile();
        }
    }, [externalFilePath, isConnected, callTool]);

    // Initial Load of Codebase Root
    useEffect(() => {
        if (!isConnected) return;

        const loadRoot = async () => {
            try {
                const result = await callTool('list_directory', { path: CODEBASE_ROOT });
                const fileListStr = result.content[0].text;
                const fileList: { name: string, type: string }[] = JSON.parse(fileListStr);

                const loadedFiles: FileNode[] = fileList.map(f => ({
                    id: `${CODEBASE_ROOT}/${f.name}`,
                    name: f.name,
                    type: f.type === 'directory' ? 'folder' : 'file',
                    children: [],
                    loaded: false
                }));

                setFiles(loadedFiles);
            } catch (err) {
                console.error("Failed to load codebase root:", err);
            }
        };

        loadRoot();
    }, [isConnected, callTool]);

    const handleExpand = async (node: FileNode) => {
        if (node.loaded) return;

        try {
            const result = await callTool('list_directory', { path: node.id });
            const fileListStr = result.content[0].text;
            const fileList: { name: string, type: string }[] = JSON.parse(fileListStr);

            const children: FileNode[] = fileList.map(f => ({
                id: `${node.id}/${f.name}`,
                name: f.name,
                type: f.type === 'directory' ? 'folder' : 'file',
                children: [],
                loaded: false,
                language: f.name.endsWith('.ts') ? 'typescript' : f.name.endsWith('.tsx') ? 'typescript' : 'text'
            }));

            setFiles(prev => updateTree(prev, node.id, children));
        } catch (err) {
            console.error("Failed to expand folder:", err);
        }
    };

    const updateTree = (nodes: FileNode[], targetId: string, children: FileNode[]): FileNode[] => {
        return nodes.map(node => {
            if (node.id === targetId) {
                return { ...node, children, loaded: true };
            }
            if (node.children) {
                return { ...node, children: updateTree(node.children, targetId, children) };
            }
            return node;
        });
    };

    const handleFileSelect = async (node: FileNode) => {
        if (node.type === 'file') {
            try {
                const result = await callTool("read_file", { path: node.id });
                const content = result.content[0].text;

                setActiveFile({
                    id: node.id,
                    name: node.name,
                    content: content,
                    language: node.language || 'typescript'
                });
            } catch (err) {
                console.error("Failed to read file:", err);
                setActiveFile({
                    id: node.id,
                    name: node.name,
                    content: `// Error loading file: ${err}`,
                    language: 'text'
                });
            }
        }
    };

    const handleSave = async (newContent: string) => {
        if (!activeFile) return;
        setIsSaving(true);
        try {
            await callTool("write_file", {
                path: activeFile.id,
                content: newContent
            });
            console.log("File saved successfully.");
            // Log this action to system history
            window.dispatchEvent(new CustomEvent('myos_system_log', {
                detail: {
                    event: `Committed changes to substrate: ${activeFile.name}`,
                    agent: 'SubstrateIDE',
                    type: 'milestone',
                    timestamp: new Date().toISOString()
                }
            }));
        } catch (err) {
            console.error("Failed to save file:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950/80 backdrop-blur-3xl overflow-hidden rounded-[32px] border border-white/10 shadow-3xl pointer-events-auto">
            {/* Tactical IDE Header */}
            <div className="px-8 py-4 bg-gradient-to-b from-cyan-500/10 to-transparent border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                        <Terminal className="text-cyan-400" size={18} />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-white uppercase tracking-[0.3em]">Overclocked IDE Terminal</h2>
                        <p className="text-[9px] text-cyan-500/40 font-mono italic">OPERATOR: ROOT_ADMIN // KNOWLEDGE_CODEX</p>
                    </div>
                </div>
                <div className="flex gap-4">
                     <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-400 opacity-60">
                        <Shield size={12} />
                        UPLINK_SECURE: {isConnected ? 'TRUE' : 'FALSE'}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-72 flex-shrink-0 border-r border-white/5 bg-black/40 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
                                <Code2 size={48} className="animate-spin-slow rotate-45" />
                                <span className="text-[10px] uppercase tracking-widest">Scanning Substrate...</span>
                            </div>
                        ) : (
                            <FileExplorer files={files} onFileSelect={handleFileSelect} onExpand={handleExpand} />
                        )}
                    </div>
                </div>

                {/* Editor & Terminal */}
                <div className="flex-1 flex flex-col p-4 bg-slate-900/40 relative">
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            file={activeFile}
                            onChange={(val) => {
                               if (activeFile) {
                                   setActiveFile({ ...activeFile, content: val });
                               }
                            }}
                        />
                    </div>
                    
                    {/* TERMINAL AREA */}
                    <div className="h-48 mt-4 bg-black/60 rounded-2xl border border-white/5 flex flex-col overflow-hidden font-mono text-[10px]">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-cyan-400/60">
                                <Terminal size={12} />
                                <span className="uppercase tracking-widest font-bold">Local Terminal // PowerShell</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setTerminalOutput([])} className="hover:text-white text-white/20 uppercase tracking-tighter">Clear</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                            {terminalOutput.map((line, i) => (
                                <div key={i} className={line.type === 'error' ? 'text-rose-400' : line.type === 'cmd' ? 'text-cyan-400' : 'text-slate-300'}>
                                    {line.type === 'cmd' && <span className="opacity-40 mr-2">&gt;</span>}
                                    {line.text}
                                </div>
                            ))}
                            {isExecuting && <div className="text-cyan-400 animate-pulse">_ EXECUTION_IN_PROGRESS...</div>}
                        </div>
                        <div className="p-2 bg-black/40 border-t border-white/5">
                            <input 
                                type="text"
                                placeholder="Enter command..."
                                className="w-full bg-transparent outline-none text-cyan-300 px-2"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCommand((e.target as HTMLInputElement).value);
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {activeFile && (
                        <div className="absolute top-8 right-8 flex gap-3">
                             <button
                                onClick={() => handleSave(activeFile.content)}
                                className={`flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-[0.2em] rounded-xl text-[10px] transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]
                                    ${isSaving ? 'animate-pulse opacity-70' : ''}
                                `}
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'COMMITTING...' : 'COMMIT CHANGES'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Status Bar */}
            <div className="h-8 flex items-center px-8 bg-black/40 border-t border-white/5 text-[9px] text-slate-500 font-mono tracking-widest">
                <div className="flex items-center gap-3">
                    <Zap size={10} className="text-yellow-500" />
                    <span>LPC_ENGINE: READY</span>
                    <span className="opacity-20">|</span>
                    <span>VOXEL_SPRITE: ACTIVE</span>
                </div>
                
                <span className="ml-auto flex items-center gap-2">
                    <span className="opacity-40 whitespace-nowrap overflow-hidden text-ellipsis max-w-[400px]">PATH: {activeFile ? activeFile.id : 'NONE'}</span>
                </span>
            </div>
        </div>
    );
}

export default IDEPanel;
