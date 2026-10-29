
import { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import { useSwarm } from '@Omni/lib/useSwarm';

type Item = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: Item[];
    isOpen?: boolean;
    content?: string;
};

// Hardcoded root for now, ideally dynamic or env var
const LIBRARY_ROOT = 'C:/Users/zakde/.gemini/antigravity/scratch/antigravity-swarm/packages/library';

export default function CardCatalog() {
    const { callTool, isConnected } = useSwarm();
    const [items, setItems] = useState<Item[]>([]);
    const [activeItem, setActiveItem] = useState<Item | null>(null);

    // Initial Load of Pillars
    useEffect(() => {
        if (!isConnected) return;

        let isMounted = true;

        const loadLibraryRoot = async () => {
            console.log("[CardCatalog] Requesting Library Root:", LIBRARY_ROOT);
            try {
                // List Library Root (Pillars) - wrapped in a timeout promise race
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timed out')), 5000)
                );

                const listPromise = callTool('list_directory', { path: LIBRARY_ROOT });

                const result: any = await Promise.race([listPromise, timeoutPromise]);

                if (!isMounted) return;

                console.log("[CardCatalog] Received Result:", result);

                if (!result || !result.content || !result.content[0]) {
                    throw new Error("Invalid response format from Swarm");
                }

                // result.content[0].text is now JSON string of { name: string, type: string }[]
                // @ts-ignore
                const fileListStr = result.content[0].text;
                let fileList: { name: string, type: string }[] = [];

                try {
                    fileList = JSON.parse(fileListStr);
                } catch (e) {
                    console.error("[CardCatalog] JSON Parse Error:", e, "Raw:", fileListStr);
                    // If it's not JSON, maybe it's the old plaintext format? Handle gracefully-ish
                    if (typeof fileListStr === 'string' && fileListStr.includes('name')) {
                        // regex parse fallback? No, let's just fail for now to see the error.
                        throw new Error("Failed to parse file list JSON");
                    }
                }

                // Transform to Items
                const loadedItems: Item[] = fileList
                    .filter(f => f.type === 'directory') // Root only show pillars (directories)
                    .map(f => ({
                        id: `${LIBRARY_ROOT}/${f.name}`,
                        name: f.name,
                        type: 'folder',
                        children: [],
                        isOpen: false
                    }));

                console.log("[CardCatalog] Items Loaded:", loadedItems.length);
                setItems(loadedItems);
            } catch (err: any) {
                console.error("[CardCatalog] Failed to load library root:", err);
                // We might want to show an error state in the UI
                if (isMounted && items.length === 0) {
                    // Add a dummy error item so the user sees something
                    setItems([{ id: 'error', name: `Error: ${err.message}`, type: 'file', content: '' }]);
                }
            }
        };

        loadLibraryRoot();

        return () => { isMounted = false; };
    }, [isConnected, callTool]);

    const toggleFolder = async (folder: Item) => {
        // Toggle Open State
        setItems(prev => prev.map(i => {
            if (i.id === folder.id) {
                return { ...i, isOpen: !i.isOpen };
            }
            return i;
        }));

        // Fetch Children if opening and empty
        if (!folder.isOpen && (!folder.children || folder.children.length === 0)) {
            try {
                console.log("Loading Children for:", folder.id);
                const result = await callTool('list_directory', { path: folder.id });
                // @ts-ignore
                const fileListStr = result.content[0].text;
                const fileList: { name: string, type: string }[] = JSON.parse(fileListStr);

                const children: Item[] = fileList.map(f => ({
                    id: `${folder.id}/${f.name}`,
                    name: f.name,
                    type: f.type === 'directory' ? 'folder' : 'file'
                }));

                setItems(prev => prev.map(i => {
                    if (i.id === folder.id) {
                        return { ...i, children: children, isOpen: true };
                    }
                    return i;
                }));
            } catch (err) {
                console.error("Failed to load folder contents:", err);
            }
        }
    };

    const selectFile = async (file: Item) => {
        if (file.type !== 'file') return;

        setActiveItem(file);

        try {
            const result = await callTool('read_file', { path: file.id });
            // @ts-ignore
            const content = result.content[0].text;
            setActiveItem({ ...file, content });
        } catch (err) {
            console.error("Failed to read file:", err);
            setActiveItem({ ...file, content: `Error reading file: ${err}` });
        }
    };

    const renderTree = (nodes: Item[], level = 0) => {
        return nodes.map(node => (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer text-sm transition-colors ${activeItem?.id === node.id ? 'bg-amber-500/10 text-amber-200' : 'text-gray-400 hover:text-gray-200'}`}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={() => node.type === 'folder' ? toggleFolder(node) : selectFile(node)}
                >
                    {node.type === 'folder' && (
                        <span className="opacity-50">
                            {node.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </span>
                    )}
                    {node.type === 'folder' ? <Folder className="w-4 h-4 text-amber-500/80" /> : <BookOpen className="w-4 h-4 text-cyan-400/80" />}
                    <span className="truncate">{node.name}</span>
                </div>
                {node.type === 'folder' && node.isOpen && node.children && (
                    <div>{renderTree(node.children, level + 1)}</div>
                )}
            </div>
        ));
    };

    return (
        <div className="h-full flex flex-row overflow-hidden">
            {/* Sidebar: File Tree */}
            <div className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 overflow-y-auto p-2 flex flex-col">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Knowledge Index</h2>
                <div className="flex-1">
                    {items.length === 0 ? (
                        <div className="text-xs text-gray-600 p-2 italic">Loading Library...</div>
                    ) : (
                        renderTree(items)
                    )}
                </div>
            </div>

            {/* Main Content: Viewer */}
            <div className="flex-1 overflow-y-auto p-8 bg-black/40">
                {activeItem ? (
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-light text-amber-500 mb-6 border-b border-amber-500/30 pb-2">{activeItem.name.replace('.md', '')}</h1>
                        <div className="prose prose-invert prose-amber max-w-none">
                            {/* Simple Markdown Rendering */}
                            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 leading-relaxed">
                                {activeItem.content}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm">Select a document from the Knowledge Index to read.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
