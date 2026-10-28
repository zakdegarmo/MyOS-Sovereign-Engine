import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { forceY } from 'd3-force';
import { NodeGeometry } from './types';
import type { GraphData, GraphNode, ViewMode, LayoutMode } from './types';
import { getNodeColor } from './constants';
// Removed calculateLayoutTargets import for now, relying on force default

interface GraphViewerProps {
    data: GraphData;
    viewMode: ViewMode;
    layoutMode: LayoutMode;
    spacing: number;
    rotation: { x: number; y: number; z: number };
    onNodeClick: (node: GraphNode) => void;
}

const GraphViewer: React.FC<GraphViewerProps> = ({ data, viewMode, layoutMode, spacing, rotation, onNodeClick }) => {
    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    // Handle Resize
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Initialize Scene with Bold Axes
    useEffect(() => {
        const fg = graphRef.current;
        if (!fg) return;

        const scene = fg.scene();
        const axesGroup = scene.getObjectByName('boldAxes');
        if (!axesGroup) {
            const group = new THREE.Group();
            group.name = 'boldAxes';

            const length = 2000;
            const thickness = 1.5;

            // X Axis (Red)
            const xGeo = new THREE.CylinderGeometry(thickness, thickness, length, 12);
            xGeo.rotateZ(Math.PI / 2);
            const xMat = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.6, transparent: true });
            group.add(new THREE.Mesh(xGeo, xMat));

            // Y Axis (Green)
            const yGeo = new THREE.CylinderGeometry(thickness, thickness, length, 12);
            const yMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.6, transparent: true });
            group.add(new THREE.Mesh(yGeo, yMat));

            // Z Axis (Blue)
            const zGeo = new THREE.CylinderGeometry(thickness, thickness, length, 12);
            zGeo.rotateX(Math.PI / 2);
            const zMat = new THREE.MeshBasicMaterial({ color: 0x0088ff, opacity: 0.6, transparent: true });
            group.add(new THREE.Mesh(zGeo, zMat));

            scene.add(group);
        }

        // Add Lights for Lambert Material visibility (if used)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(200, 200, 200);
        scene.add(pointLight);

    }, []);

    // Handle Rotation
    useEffect(() => {
        const fg = graphRef.current;
        if (!fg) return;
        const scene = fg.scene();
        if (scene) {
            scene.rotation.set(rotation.x, rotation.y, rotation.z);
        }
    }, [rotation]);

    // Apply Layout Forces & Spacing
    useEffect(() => {
        const fg = graphRef.current;
        if (!fg) return;

        // REAL PHYSICS SIMULATION
        // Charge (Gravity): Proportional to Mass
        fg.d3Force('charge').strength((node: GraphNode) => {
            // Negative strength = Repulsion. 
            // We want nodes to spaced out based on their mass.
            const massFactor = node.mass ? node.mass : 5;
            return -1 * (30 + massFactor * 2) * spacing;
        });

        // Link Tension: Lower spacing = tighter bonds
        fg.d3Force('link').strength(0.5 / spacing);

        // Center Gravity
        fg.d3Force('center').strength(0.5);

        // --- DEWEY SLOPE LAYOUT ---
        if (layoutMode === 'deweySlope') {
            // Organize vertically by Dewey Category (100 = Top, 900 = Bottom)
            const yForce = forceY((node: GraphNode) => {
                if (!node.deweyCategory) return 0;
                // Map 000-900 to Y axis
                const category = parseInt(node.deweyCategory);
                if (isNaN(category)) return 0;
                // 000 -> 500, 900 -> -500 (approx)
                const targetY = (450 - category) * spacing;
                return targetY;
            }).strength(1); // Strong pull to shelf

            fg.d3Force('y', yForce);
            fg.d3Force('center').strength(0.05); // Very weak center pull
        } else {
            fg.d3Force('y', null); // Reset Y force
        }

        fg.d3ReheatSimulation();

    }, [layoutMode, data, viewMode, spacing]);

    const handleClick = useCallback((node: any) => {
        const distance = 60 * spacing;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        if (graphRef.current) {
            graphRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                2000
            );
        }
        onNodeClick(node as GraphNode);
    }, [onNodeClick, spacing]);

    const nodeThreeObject = useCallback((node: any) => {
        const n = node as GraphNode;
        const color = getNodeColor(n, viewMode) || '#ffffff'; // Fallback white

        // VISUAL SIZE = Calculated Volume (Cube Root scaling)
        const size = n.val || 2;

        let geometry;
        switch (n.geometry) {
            case NodeGeometry.Box: geometry = new THREE.BoxGeometry(size, size, size); break;
            case NodeGeometry.Cone: geometry = new THREE.ConeGeometry(size / 2, size, 8); break;
            case NodeGeometry.Cylinder: geometry = new THREE.CylinderGeometry(size / 3, size / 3, size, 8); break;
            case NodeGeometry.Dodecahedron: geometry = new THREE.DodecahedronGeometry(size / 1.5); break;
            case NodeGeometry.Icosahedron: geometry = new THREE.IcosahedronGeometry(size / 1.5); break;
            case NodeGeometry.Torus: geometry = new THREE.TorusGeometry(size / 2, size / 6, 8, 12); break;
            case NodeGeometry.Sphere:
            default: geometry = new THREE.SphereGeometry(size / 1.5); break;
        }

        // USE BASIC MATERIAL FOR DEBUG VISIBILITY (Self-illuminating)
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });

        return new THREE.Mesh(geometry, material);
    }, [viewMode]);

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0 bg-transparent overflow-hidden">
            {dimensions.width > 0 && (
                <ForceGraph3D
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={data}
                    nodeLabel={(node: any) => `[${node.type}] ${node.name}\nPillar: ${node.pillar}\nMass: ${node.mass?.toFixed(1) || 0}`}
                    nodeThreeObject={nodeThreeObject}
                    linkWidth={(link: any) => link.strength || 1}
                    linkOpacity={0.2}
                    linkDirectionalParticles={4}
                    linkDirectionalParticleWidth={2}
                    linkDirectionalParticleSpeed={0.005}
                    linkColor={() => "#555555"}
                    onNodeClick={handleClick}
                    backgroundColor="rgba(0,0,0,0)" // Transparent
                    showNavInfo={false}
                />
            )}
        </div>
    );
};

export default GraphViewer;
