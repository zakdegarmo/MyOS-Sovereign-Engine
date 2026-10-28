import React, { useMemo, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData, GraphNode, ViewMode } from './types';
import { getNodeColor } from './constants';
import { Map, Minimize2 } from 'lucide-react';

interface MinimapProps {
    data: GraphData;
    viewMode: ViewMode;
    selectedNode: GraphNode | null;
}

const Minimap: React.FC<MinimapProps> = ({ data, viewMode, selectedNode }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const minimapData = useMemo(() => {
        return {
            nodes: data.nodes.map(n => ({ ...n })),
            links: data.links.map(l => ({ ...l }))
        };
    }, [data]);

    const paintNode = (node: any) => {
        if (selectedNode && node.id === selectedNode.id) {
            return '#ffffff'; // White for selected
        }
        return getNodeColor(node as GraphNode, viewMode);
    };

    const getNodeVal = (node: any) => {
        if (selectedNode && node.id === selectedNode.id) {
            return 20; // Big highlight
        }
        return 2; // Small dots
    };

    return (
        <div className={`absolute bottom-6 right-6 z-20 transition-all duration-300 ease-in-out bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col ${isExpanded ? 'w-64 h-64' : 'w-12 h-12 rounded-full'}`}>

            <div
                className={`flex items-center justify-between p-2 ${isExpanded ? 'bg-slate-800/50 border-b border-slate-700' : 'h-full justify-center bg-slate-800 hover:bg-slate-700 cursor-pointer'}`}
                onClick={() => !isExpanded && setIsExpanded(true)}
            >
                {isExpanded ? (
                    <>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                            <Map size={14} className="text-cyan-400" />
                            MINIMAP
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <Minimize2 size={14} />
                        </button>
                    </>
                ) : (
                    <Map size={18} className="text-cyan-400" />
                )}
            </div>

            {isExpanded && (
                <div className="flex-1 relative bg-black/50">
                    <ForceGraph3D
                        width={254}
                        height={215}
                        graphData={minimapData}
                        nodeColor={paintNode}
                        nodeVal={getNodeVal}
                        nodeOpacity={0.8}
                        nodeResolution={8}
                        linkWidth={0.5}
                        linkColor={() => "#333333"}
                        linkOpacity={0.2}
                        backgroundColor="rgba(0,0,0,0)"
                        showNavInfo={false}
                        enableNodeDrag={false}
                        enableNavigationControls={false}
                        cooldownTicks={100}
                    />

                    <div className="absolute inset-0 pointer-events-none border-2 border-slate-800/50 rounded-b-xl" />

                    {selectedNode && (
                        <div className="absolute bottom-2 left-2 text-[10px] text-cyan-400 font-mono animate-pulse">
                            TARGET LOCKED
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Minimap;
