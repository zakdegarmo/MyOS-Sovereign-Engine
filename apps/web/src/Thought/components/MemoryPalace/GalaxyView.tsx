
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Types
interface AtlasNode {
    id: string;
    label: string;
    type: 'genome' | 'archive';
    x: number;
    y: number;
    z: number;
    metadata?: any;
}

const PILLAR_COLORS: Record<string, string> = {
    "Self": "#f43f5e", // Rose
    "Thought": "#3b82f6", // Blue
    "Logic": "#8b5cf6", // Violet
    "Unity": "#10b981", // Emerald
    "Existence": "#f59e0b", // Amber
    "Improvement": "#14b8a6", // Teal
    "Mastery": "#eab308", // Yellow
    "Resonance": "#ec4899", // Pink
    "Transcendence": "#a855f7", // Purple
    "Omnipotence": "#ffffff", // White
    // Archive default
    "archive": "#94a3b8" // Slate
};

const NodeCloud = ({ nodes, onSelect }: { nodes: AtlasNode[], onSelect: (node: AtlasNode | null) => void }) => {
    const meshRef = useRef<THREE.Points>(null);

    // Prepare Geometry data
    const { positions, colors, sizes } = useMemo(() => {
        const p = new Float32Array(nodes.length * 3);
        const c = new Float32Array(nodes.length * 3);
        const s = new Float32Array(nodes.length);

        nodes.forEach((node, i) => {
            p[i * 3] = node.x;
            p[i * 3 + 1] = node.y;
            p[i * 3 + 2] = node.z;

            // Simple color mapping
            let color = new THREE.Color(PILLAR_COLORS['archive']);
            let size = 1.0;

            if (node.type === 'genome') {
                // Try to infer pillar from ID (e.g., ⚹ = Self, ☿ = Thought) or metadata
                color = new THREE.Color('#ffffb0');
                size = 4.0;
            } else {
                size = 1.5;
            }

            c[i * 3] = color.r;
            c[i * 3 + 1] = color.g;
            c[i * 3 + 2] = color.b;

            s[i] = size;
        });

        return { positions: p, colors: c, sizes: s };
    }, [nodes]);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.001; // Slow rotation
        }
    });

    return (
        <points ref={meshRef} onClick={(e) => {
            e.stopPropagation();
            const index = e.index;
            if (index !== undefined && nodes[index]) {
                onSelect(nodes[index]);
            }
        }}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={nodes.length}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={nodes.length}
                    array={colors}
                    itemSize={3}
                    args={[colors, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={nodes.length}
                    array={sizes}
                    itemSize={1}
                    args={[sizes, 1]}
                />
            </bufferGeometry>
            <pointsMaterial
                vertexColors
                size={2}
                sizeAttenuation
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
};

export const GalaxyView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [nodes, setNodes] = useState<AtlasNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load data from public/data/memory_atlas.json
        fetch('/data/memory_atlas.json')
            .then(res => res.json())
            .then(data => {
                setNodes(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load Memory Atlas:", err);
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="absolute inset-0 bg-black z-50 overflow-hidden">
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 z-50 text-white font-mono pointer-events-none">
                <h1 className="text-2xl font-bold tracking-widest text-indigo-400">THE MEMORY PALACE</h1>
                <p className="text-xs text-slate-500">{nodes.length} Semantic Nodes Loaded</p>
            </div>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 bg-slate-800 text-white rounded hover:bg-red-500 transition-colors"
            >
                CLOSE GALAXY
            </button>

            {/* Selected Node Inspector */}
            {selectedNode && (
                <div className="absolute bottom-8 left-8 z-50 w-80 bg-slate-900/90 border border-slate-700 p-4 rounded-xl backdrop-blur-md">
                    <div className="text-xs text-indigo-400 uppercase tracking-widest mb-1">{selectedNode.type}</div>
                    <h2 className="text-lg font-bold text-white mb-2">{selectedNode.label}</h2>
                    <div className="text-sm text-slate-400 font-mono mb-4">{selectedNode.id}</div>
                    {selectedNode.metadata?.rationale && (
                        <p className="text-sm text-slate-300 italic">"{selectedNode.metadata.rationale}"</p>
                    )}
                    {selectedNode.metadata?.dewey && (
                        <div className="mt-2 text-xs bg-slate-800 px-2 py-1 rounded inline-block text-slate-500">
                            Dewey: {selectedNode.metadata.dewey}
                        </div>
                    )}
                </div>
            )}

            {/* 3D Scene */}
            <Canvas camera={{ position: [0, 0, 800], fov: 60 }}>
                <color attach="background" args={['#050510']} />
                <fog attach="fog" args={['#050510', 500, 1500]} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                {!isLoading && <NodeCloud nodes={nodes} onSelect={setSelectedNode} />}

                <OrbitControls autoRotate autoRotateSpeed={0.5} maxDistance={1000} minDistance={10} />
            </Canvas>

            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-indigo-500 font-mono animate-pulse">Initializing Neural Link...</div>
                </div>
            )}
        </div>
    );
};
