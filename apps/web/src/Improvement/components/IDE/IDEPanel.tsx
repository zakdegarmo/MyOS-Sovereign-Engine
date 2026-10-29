import React, { useState, useEffect } from 'react';
import FileExplorer, { type FileNode } from './FileExplorer';
import CodeEditor from './CodeEditor';
import { Code2, Save } from 'lucide-react';
import { useSwarm } from '@Omni/lib/useSwarm';

// Hardcoded root for now, ideally dynamic or env var
const CODEBASE_ROOT = 'C:/Users/zakde/.gemini/antigravity/scratch/antigravity-swarm/packages';

interface IDEPanelProps {
    externalFilePath?: string | null;
}

export default function IDEPanel({ externalFilePath }: IDEPanelProps) {
    const [activeFile, setActiveFile] = useState<{ id: string; name: string; content: string; language: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [files, setFiles] = useState<FileNode[]>([]);
    const { client, callTool, isConnected } = useSwarm();

    // Deep Linking Effect
    useEffect(() => {
        if (externalFilePath && client) {
            const loadExternalFile = async () => {
                try {
                    const result = await callTool("read_file", { path: externalFilePath });
                    // @ts-ignore
                    const content = result.content[0].text;
                    // Determine name from path
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
    }, [externalFilePath, client, callTool]);

    // Initial Load of Codebase Root
    useEffect(() => {
        if (!isConnected) return;

        const loadRoot = async () => {
            try {
                const result = await callTool('list_directory', { path: CODEBASE_ROOT });
                // @ts-ignore
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
            console.log("Expanding:", node.id);
            const result = await callTool('list_directory', { path: node.id });
            // @ts-ignore
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
        if (node.type === 'file' && client) {
            try {
                const result = await callTool("read_file", { path: node.id });
                // @ts-ignore
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
        if (!activeFile || !client) return;
        setIsSaving(true);
        try {
            await callTool("write_file", {
                path: activeFile.id,
                content: newContent
            });
            console.log("File saved successfully.");
        } catch (err) {
            console.error("Failed to save file:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col glass-panel border-t border-white/5">
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 overflow-y-auto">
                    {files.length === 0 ? (
                        <div className="text-xs text-gray-500 p-4">Loading Codebase...</div>
                    ) : (
                        <FileExplorer files={files} onFileSelect={handleFileSelect} onExpand={handleExpand} />
                    )}
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col">
                    {activeFile ? (
                        <CodeEditor
                            file={activeFile}
                            onChange={(val) => {
                                activeFile.content = val;
                            }}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-xs italic">
                            Select a file from the Knowledge Codex to view/edit.
                        </div>
                    )}
                </div>
            </div>

            {/* IDE Footer / Status Bar */}
            <div className="h-8 flex items-center px-4 bg-neon-blue/5 border-t border-white/10 text-[10px] text-neon-blue/60 gap-4">
                <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    MYSTRA.OS::KNOWLEDGE_CODEX
                </span>

                {activeFile && (
                    <button
                        onClick={() => handleSave(activeFile.content)}
                        className={`flex items-center gap-1 hover:text-white transition-colors ${isSaving ? 'animate-pulse text-yellow-400' : ''}`}
                    >
                        <Save className="w-3 h-3" />
                        {isSaving ? 'SAVING...' : 'SAVE (CTRL+S)'}
                    </button>
                )}

                <span className="ml-auto opacity-50 flex items-center gap-2">
                    {activeFile ? activeFile.id : 'NO_FILE_SELECTED'}
                </span>
            </div>
        </div>
    );
}
