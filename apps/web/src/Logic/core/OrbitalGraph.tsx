
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { FileNode } from './types';

// --- SENSIBLE GEOMETRY ---
const getGeometryForNode = (node: FileNode) => {
    if (node.type === 'directory') return <icosahedronGeometry args={[1.2, 0]} />; // Cluster Hub
    return <sphereGeometry args={[0.6, 16, 16]} />; // Standard File
};

const getColorForNode = (node: FileNode) => {
    if (node.type === 'directory') return '#fbbf24'; // Amber Folders
    if (node.name.endsWith('.tsx')) return '#22d3ee'; // React Cyan
    if (node.name.endsWith('.ts')) return '#3b82f6'; // TS Blue
    if (node.name.endsWith('.json')) return '#facc15'; // JSON Yellow
    if (node.name.endsWith('.css')) return '#ec4899'; // CSS Pink
    return '#64748b'; // Generic Grey
};

// --- SIMULATION HELPERS ---
const calculateTreeLayout = (nodes: Record<string, FileNode>, spread: number) => {
    const layout: Record<string, THREE.Vector3> = {};
    const root = new THREE.Vector3(0, 0, 0);
    layout['root'] = root;

    // We need a proper tree structure to calculate positions recursively
    const tree: Record<string, string[]> = {}; // parent -&gt; children IDs
    Object.values(nodes).forEach(n => {
        // Prevent root from being its own parent
        if (n.id === 'root') return;

        const p = n.parent || 'root';

        // Safety: Prevent self-referential loops generally
        if (p === n.id) return;

        if (!tree[p]) tree[p] = [];
        tree[p].push(n.id);
    });

    const assignPositions = (parentId: string, parentPos: THREE.Vector3, level: number = 1) => {
        const children = tree[parentId] || [];
        if (children.length === 0) return;

        // Spherical Distribution Scaled by Spread
        const safeSpread = typeof spread === 'number' && !isNaN(spread) ? spread : 2;
        const radius = (level * 10) * safeSpread;
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden Angle

        children.forEach((childId, i) => {
            // Fibonacci Sphere Point for even distribution
            const y = 1 - (i / (children.length - 1 + 1e-9)) * 2; // y goes from 1 to -1
            const r = Math.sqrt(1 - y * y); // radius at y
            const theta = phi * i; // Golden angle increment

            const x = Math.cos(theta) * r;
            const z = Math.sin(theta) * r;

            // Offset from parent
            const offset = new THREE.Vector3(x, y, z).multiplyScalar(radius / (Math.max(1, children.length * 0.1))); // Scale radius by density
            const pos = parentPos.clone().add(offset); // Relative to parent

            // Apply slight noise to prevent perfect lines
            pos.add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)));

            layout[childId] = pos;
            assignPositions(childId, pos, level + 0.8);
        });
    };

    // If 'root' isn't explicitly in nodes list but is parent, we start from 'root' children
    // Or if 'src' exists, we treat it as main anchor
    const startNode = nodes['root'] ? 'root' : (nodes['src'] ? 'root' : Object.keys(nodes)[0]); // heuristics
    if (nodes[startNode]) layout[startNode] = root; // Anchor start

    // Find top level orphans
    Object.values(nodes).filter(n => !n.parent || n.parent === 'root').forEach((n, i) => {
        // If scanning didn't assign 'root' parent correctly, fix orphans
        if (!layout[n.id]) {
            // Assign orbital positions around 0,0,0
            const theta = (i / 5) * Math.PI * 2;
            layout[n.id] = new THREE.Vector3(Math.cos(theta) * 10 * spread, Math.sin(theta) * 10 * spread, 0);
            assignPositions(n.id, layout[n.id]);
        } else {
            assignPositions(n.id, layout[n.id]);
        }
    });

    return layout;
};


interface OrbitalGraphProps {
    nodes: Record<string, FileNode>;
    onNodeClick: (id: string) => void;
    activeNodeId: string | null;
    spread?: number; // Optional prop for density control
    nodeSize?: number;
}

const NodeMesh = ({ node, pos, onClick, isActive, parentPos, size = 0.6 }: { node: FileNode, pos: THREE.Vector3, onClick: () => void, isActive: boolean, parentPos?: THREE.Vector3, size?: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Dynamic Geometry based on size
    const geometry = useMemo(() => {
        if (node.type === 'directory') return <icosahedronGeometry args={[size * 2, 0]} />;
        return <sphereGeometry args={[size, 16, 16]} />;
    }, [node, size]);

    const color = useMemo(() => (isActive || hovered) ? '#ffffff' : getColorForNode(node), [node, isActive, hovered]);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            if (isActive) meshRef.current.rotation.y += 0.05;
        }
    });

    return (
        <group position={pos}>
            {/* Connection Line */}
            {parentPos && (
                <Line
                    points={[0, 0, 0, parentPos.x - pos.x, parentPos.y - pos.y, parentPos.z - pos.z]}
                    color={node.type === 'directory' ? '#fbbf24' : '#334155'}
                    transparent
                    opacity={node.type === 'directory' ? 0.4 : 0.2}
                    lineWidth={1}
                />
            )}

            <mesh
                ref={meshRef}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true); }}
                onPointerOut={(e) => { document.body.style.cursor = 'auto'; setHovered(false); }}
            >
                {geometry}
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={(isActive || hovered) ? 0.8 : 0.2}
                    roughness={0.4}
                    metalness={0.6}
                />
            </mesh>

            {/* LABEL */}
            {(hovered || isActive || node.type === 'directory') && (
                <Html distanceFactor={12} style={{ pointerEvents: 'none' }}>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border transition-all duration-200
                        ${isActive
                            ? 'bg-white text-black border-white scale-110 z-50 font-bold'
                            : 'bg-black/60 text-white border-white/20 backdrop-blur-sm'
                        }
                        ${!hovered && !isActive && node.type === 'directory' ? 'opacity-50' : 'opacity-100'}
                    `}>
                        {node.name}
                    </div>
                </Html>
            )}
        </group>
    );
};

export const OrbitalGraph: React.FC<OrbitalGraphProps> = ({ nodes, onNodeClick, activeNodeId, spread = 2, nodeSize = 0.6 }) => {

    // Calculate Layout Once when nodes change
    const layout = useMemo(() => calculateTreeLayout(nodes, spread), [nodes, spread]);

    return (
        <group>
            <ambientLight intensity={0.5} />
            <pointLight position={[30, 30, 30]} intensity={1} color="#ffffff" />

            {Object.values(nodes).map(node => {
                const pos = layout[node.id] || new THREE.Vector3(0, 0, 0);
                // Find parent position for line
                const parentId = node.parent;
                const parentPos = parentId && layout[parentId] ? layout[parentId] : undefined;

                return (
                    <NodeMesh
                        key={node.id}
                        node={node}
                        pos={pos}
                        onClick={() => onNodeClick(node.id)}
                        isActive={activeNodeId === node.id}
                        parentPos={parentPos}
                        size={nodeSize}
                    />
                );
            })}
        </group>
    );
};
