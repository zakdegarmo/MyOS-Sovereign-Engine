import React, { useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { NLBLMapper, type NLBLCoordinate } from '@Omni/utils/nlblUtils';
import * as THREE from 'three';

interface AkashicWeaveProps {
    entries: { hash: string; coordinate: NLBLCoordinate; content: any }[];
    onSelect?: (hash: string) => void;
}

export const AkashicWeave: React.FC<AkashicWeaveProps> = ({ entries, onSelect }) => {
    const graphData = useMemo(() => {
        const nodes = entries.map(entry => ({
            id: entry.hash,
            hash: entry.hash,
            // Project 10D NLBL to 3D
            // Using Self (X), Thought (Y), Logic (Z) for projection
            x: (entry.coordinate['Self'] || 0) * 400 - 200,
            y: (entry.coordinate['Thought'] || 0) * 400 - 200,
            z: (entry.coordinate['Logic'] || 0) * 400 - 200,
            color: `hsl(${(entry.coordinate['Resonance'] || 0) * 360}, 70%, 60%)`,
            val: (entry.coordinate['Omni'] || 0) * 5 + 2
        }));

        const links: any[] = [];
        // Connect nearby nodes in NLBL space
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = NLBLMapper.getDistance(entries[i].coordinate, entries[j].coordinate);
                if (dist < 0.5) {
                    links.push({
                        source: nodes[i].id,
                        target: nodes[j].id,
                        distance: dist
                    });
                }
            }
        }

        return { nodes, links };
    }, [entries]);

    return (
        <div className="w-full h-full bg-black">
            <ForceGraph3D
                graphData={graphData}
                backgroundColor="#000000"
                nodeColor={node => (node as any).color}
                nodeLabel={node => `Hash: ${(node as any).hash}`}
                linkWidth={0.5}
                linkColor={() => "#444333"}
                onNodeClick={node => onSelect?.((node as any).hash)}
                nodeThreeObject={node => {
                    const geometry = new THREE.SphereGeometry((node as any).val);
                    const material = new THREE.MeshPhongMaterial({
                        color: (node as any).color,
                        transparent: true,
                        opacity: 0.8,
                        emissive: (node as any).color,
                        emissiveIntensity: 0.5
                    });
                    return new THREE.Mesh(geometry, material);
                }}
            />
        </div>
    );
};
