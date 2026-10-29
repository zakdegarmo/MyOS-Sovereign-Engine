
import React, { useState, useEffect } from 'react';
import { Save, X, RefreshCw, FileText } from 'lucide-react';
import type { FileNode } from './types';

interface CodeEditorProps {
    node: FileNode;
    onClose: () => void;
    onSave?: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ node, onClose, onSave }) => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Content
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        const fetchContent = async () => {
            try {
                // Ensure we strip any leading slash if it exists, as the server expects a relative path
                const safePath = node.id.startsWith('/') ? node.id.slice(1) : node.id;

                const response = await fetch(`http://localhost:3002/api/read-file?filepath=${encodeURIComponent(safePath)}`);
                if (!response.ok) {
                    throw new Error(`Failed to load file: ${response.statusText}`);
                }
                const data = await response.json();
                setContent(data.content);
            } catch (err: any) {
                console.error("Editor Load Failed:", err);
                setContent(`// Failed to load content for ${node.name}\n// ${err.message}`);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (node.type === 'file') {
            fetchContent();
        } else {
            setContent(`// Directory: ${node.name}\n// Children: ${node.children?.join(', ') || 'None'}`);
            setIsLoading(false);
        }
    }, [node.id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const safePath = node.id.startsWith('/') ? node.id.slice(1) : node.id;

            const response = await fetch('http://localhost:3002/api/write-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filepath: safePath, content })
            });

            if (!response.ok) throw new Error("Save failed");

            if (onSave) onSave(content);

            // Visual feedback could go here
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-full z-30 overflow-hidden transform transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className={`text-${node.chem?.color || 'slate-400'}`} style={{ color: node.chem?.color }} />
                    <span className="text-sm font-mono text-slate-200 truncate" title={node.id}>
                        {node.name}
                    </span>
                    {node.chem && (
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                            {node.chem.symbol} • {node.chem.mass}u
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleSave}
                        disabled={isLoading || isSaving || node.type === 'directory'}
                        className="p-1.5 hover:bg-slate-800 rounded text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Save Changes"
                    >
                        {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        title="Close Editor"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-rose-900/50 text-rose-200 text-xs p-2 border-b border-rose-800/50 px-4">
                    Error: {error}
                </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 relative bg-[#1e1e1e]">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-2">
                        <RefreshCw className="animate-spin" size={24} />
                        <span className="text-sm">Loading Matter...</span>
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full bg-transparent text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-0 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700"
                        spellCheck={false}
                        disabled={node.type === 'directory'}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="bg-slate-950 px-3 py-1 border-t border-slate-800 flex justify-between text-[10px] text-slate-600 font-mono">
                <span>{node.type === 'directory' ? 'READ ONLY' : 'EDITABLE'}</span>
                <span>{content.length} bytes</span>
            </div>
        </div>
    );
};
