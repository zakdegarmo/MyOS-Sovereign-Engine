import { useState, useEffect } from 'react';
import { X, BookOpen, Loader } from 'lucide-react';
import { useSwarm } from '@Omni/lib/useSwarm';

interface W5HOverlayProps {
    filePath: string | null;
    onClose: () => void;
}

export default function W5HOverlay({ filePath, onClose }: W5HOverlayProps) {
    const { callTool, isConnected } = useSwarm();
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!filePath || !isConnected) return;

        const loadContent = async () => {
            setLoading(true);
            setError(null);
            setContent(null);
            try {
                console.log("[W5HOverlay] reading:", filePath);
                const result = await callTool('read_file', { path: filePath });
                // @ts-ignore
                if (result.isError) {
                    // @ts-ignore
                    throw new Error(result.content[0].text);
                }
                // @ts-ignore
                setContent(result.content[0].text);
            } catch (err: any) {
                console.error("Failed to load W5H data:", err);
                setError(err.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [filePath, isConnected, callTool]);

    if (!filePath) return null;

    // Extract Title from filename
    const title = filePath.split('/').pop()?.replace('.md', '') || 'Unknown Node';

    return (
        <div className="absolute top-4 right-4 w-96 max-h-[80vh] flex flex-col glass-panel border border-amber-500/30 shadow-2xl shadow-black/80 rounded-lg overflow-hidden transition-all duration-300 pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-amber-500/20 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-2 text-amber-500">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-bold text-sm uppercase tracking-wider truncate">{title}</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-black/80 font-mono text-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-amber-500/50">
                        <Loader className="w-6 h-6 animate-spin mb-2" />
                        <span className="text-xs">Accessing Neural Lattice...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-400 p-2 border border-red-500/20 rounded bg-red-900/10">
                        <p className="font-bold text-xs mb-1">DATA FRAGMENTATION DETECTED</p>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-xs prose-amber max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
                            {content}
                        </pre>
                    </div>
                )}
            </div>

            {/* Footer / Meta */}
            <div className="p-2 border-t border-white/5 bg-black/60 text-[10px] text-gray-600 font-mono flex justify-between">
                <span>PATH: {filePath}</span>
                <span>W5H PROTOCOL</span>
            </div>
        </div>
    );
}
