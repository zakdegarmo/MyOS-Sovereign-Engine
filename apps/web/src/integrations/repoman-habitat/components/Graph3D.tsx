import React, { useCallback, useRef, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { FileNode, GraphLink } from '../types';

interface Graph3DProps {
  data: { nodes: FileNode[]; links: GraphLink[] };
  onNodeClick: (node: FileNode) => void;
  width: number;
  height: number;
}

const Graph3D: React.FC<Graph3DProps> = ({ data, onNodeClick, width, height }) => {
  const fgRef = useRef<any>();

  // Determine geometry based on complexity (data points)
  const getNodeGeometry = (complexity: number, color: string) => {
    let geometry;
    const material = new THREE.MeshLambertMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.8,
      wireframe: false 
    });

    if (complexity >= 20) geometry = new THREE.DodecahedronGeometry(8);
    else if (complexity >= 12) geometry = new THREE.IcosahedronGeometry(7);
    else if (complexity >= 8) geometry = new THREE.BoxGeometry(10, 10, 10);
    else if (complexity >= 6) geometry = new THREE.OctahedronGeometry(6);
    else if (complexity >= 4) geometry = new THREE.TetrahedronGeometry(6);
    else if (complexity >= 3) geometry = new THREE.ConeGeometry(4, 8, 3);
    else if (complexity >= 2) geometry = new THREE.CylinderGeometry(2, 2, 8, 8);
    else geometry = new THREE.SphereGeometry(4);

    return new THREE.Mesh(geometry, material);
  };

  const nodeThreeObject = useCallback((node: any) => {
    const n = node as FileNode;
    const color = n.type === 'dir' ? '#06b6d4' : '#a855f7'; // Cyan for dir, Purple for file
    const mesh = getNodeGeometry(n.complexity, color);
    return mesh;
  }, []);

  useEffect(() => {
    // Initial camera positioning
    if (fgRef.current) {
      fgRef.current.d3Force('link').distance(50);
      fgRef.current.cameraPosition({ x: 150, y: 150, z: 150 });
    }
  }, []);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden relative shadow-[0_0_20px_rgba(6,182,212,0.15)]">
       <div className="absolute top-4 left-4 z-10 text-xs font-mono text-cyan-400 bg-slate-900/80 p-2 rounded pointer-events-none">
          VIZ: ORBITAL_MECHANICS<br/>
          RENDER: WEBGL2
       </div>
      <ForceGraph3D
        ref={fgRef}
        width={width}
        height={height}
        graphData={data}
        nodeLabel="name"
        nodeThreeObject={nodeThreeObject}
        onNodeClick={(node) => {
            // Aim at node
            const distance = 40;
            const distRatio = 1 + distance/Math.hypot(node.x!, node.y!, node.z!);
            fgRef.current.cameraPosition(
                { x: node.x! * distRatio, y: node.y! * distRatio, z: node.z! * distRatio }, // new position
                { x: node.x!, y: node.y!, z: node.z! }, // lookAt ({ x, y, z })
                3000  // ms transition duration
            );
            onNodeClick(node as FileNode);
        }}
        linkColor={() => '#334155'}
        linkOpacity={0.5}
        backgroundColor="#020617"
      />
    </div>
  );
};

export default Graph3D;
