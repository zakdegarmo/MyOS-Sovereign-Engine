import React, { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import type { OntologyData, ConceptKey } from '@Unity/types';

interface Props {
    data: OntologyData;
    onNodeClick: (nodeId: ConceptKey) => void;
    activeNode?: ConceptKey | null;
    contextDepth?: number;
    contextPath?: ConceptKey[];
    width?: number;
    height?: number;
    backgroundColor?: string;
}

export const OntologyGraph: React.FC<Props> = ({
    data,
    onNodeClick,
    activeNode,
    contextDepth = 0,
    contextPath = [],
    width,
    height,
    backgroundColor
}) => {
    const fgRef = useRef<ForceGraphMethods>(null!);


    // Use passed dimensions or fallback to window
    const [dimensions, setDimensions] = useState({
        w: width || window.innerWidth,
        h: height || window.innerHeight
    });

    useEffect(() => {
        if (!width && !height) {
            const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        } else {
            setDimensions({ w: width || window.innerWidth, h: height || window.innerHeight });
        }
    }, [width, height]);


    // Clone data to avoid mutation issues
    const graphData = useMemo(() => {
        return {
            nodes: data.nodes.map(n => ({ ...n })),
            links: data.links.map(l => ({ ...l }))
        };
    }, [data]);

    // --------------------------------------------
    // PHYSICS & CAMERA ENGINE
    // --------------------------------------------
    useEffect(() => {
        // Add delay to ensure D3 engine is initialized before modifying forces
        const timer = setTimeout(() => {
            if (fgRef.current) {
                try {
                    // Massive expansion for "Gallery" feel
                    const chargeForce = fgRef.current.d3Force('charge');
                    if (chargeForce) {
                        chargeForce.strength(-1500); // Very strong repulsion to isolate nodes
                    }

                    const linkForce = fgRef.current.d3Force('link');
                    if (linkForce) {
                        linkForce.distance(300); // Long, elegant connections
                    }

                    // Gentle reheat
                    if (fgRef.current.d3ReheatSimulation) {
                        fgRef.current.d3ReheatSimulation();
                    }
                } catch (err) {
                    console.warn('Error configuring physics engine:', err);
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []); // Run once on mount

    // Focus camera logic
    useEffect(() => {
        if (activeNode && fgRef.current) {
            const node = graphData.nodes.find(n => n.id === activeNode);
            if (node) {
                const distance = 250;
                // @ts-ignore
                const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);

                fgRef.current.cameraPosition(
                    // @ts-ignore
                    { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
                    node as any,
                    3000
                );
            }
        }
    }, [activeNode, graphData.nodes]);

    return (
        <ForceGraph3D
            ref={fgRef}
            width={dimensions.w}
            height={dimensions.h}
            graphData={graphData}
            backgroundColor={backgroundColor || "rgba(0,0,0,0)"}
            showNavInfo={false}

            // --------------------------------------------
            // NODES: MATTE CLAY AESTHETIC 
            // --------------------------------------------
            nodeThreeObject={(node: any) => {
                const group = new THREE.Group();
                const isActive = node.id === activeNode;

                // 1. The Clay Sphere
                // High polygon count for smoothness
                const geometry = new THREE.SphereGeometry(10, 64, 64);

                // Clay Material: High Roughness, Low Metalness, Soft lighting response
                const material = new THREE.MeshPhysicalMaterial({
                    color: node.color,
                    roughness: 0.85,       // Matte, chalky texture
                    metalness: 0.0,        // No metallic shine
                    clearcoat: 0.0,        // No gloss
                    reflectivity: 0.0,     // Absorb light
                    flatShading: false,    // Smooth shading
                    emissive: node.color,
                    emissiveIntensity: isActive ? 0.4 : 0.05 // Subtle inner glow
                });

                const sphere = new THREE.Mesh(geometry, material);
                group.add(sphere);

                // 2. The Symbol (Hologram floating off surface)
                const symbolSprite = new SpriteText(node.symbol);
                symbolSprite.color = '#ffffff';
                symbolSprite.textHeight = 12;
                symbolSprite.position.set(0, 0, 12);
                group.add(symbolSprite);

                // 3. The Label (Context Aware)
                const labelText = contextDepth > 0
                    ? `${contextPath[contextPath.length - 1]} > ${node.id} `
                    : node.id;

                const labelSprite = new SpriteText(labelText);
                labelSprite.color = isActive ? '#ffffff' : node.color;
                labelSprite.textHeight = 6;
                labelSprite.position.set(0, -18, 0);
                labelSprite.fontFace = 'Rajdhani';
                group.add(labelSprite);

                // 4. Active State: "Electron" Shell
                if (isActive) {
                    const ringGeo = new THREE.TorusGeometry(16, 0.1, 8, 100);
                    const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.2 });
                    const ring = new THREE.Mesh(ringGeo, ringMat);
                    ring.lookAt(new THREE.Vector3(0, 0, 0));
                    group.add(ring);
                }

                return group;
            }}

            // Interaction
            onNodeClick={(node: any) => onNodeClick(node.id)}

            // --------------------------------------------
            // LINKS: SPLIT VECTORS / FEEDBACK LOOPS 
            // --------------------------------------------
            linkColor={(link: any) => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;

                // Active path highlight
                if (activeNode && sourceId === activeNode) {
                    return '#a5f3fc'; // Output from active (Cyan)
                }
                if (activeNode && targetId === activeNode) {
                    return '#818cf8'; // Input to active (Indigo)
                }
                // Passive links are faint, allowing nodes to stand out
                return 'rgba(71, 85, 105, 0.2)';
            }}

            // Thickness
            linkWidth={(link: any) => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                return (activeNode && (sourceId === activeNode || targetId === activeNode)) ? 1.5 : 0.5;
            }}

            // SPLIT VECTORS: High curvature creates distinct 'Eye' shapes between nodes
            linkCurvature={0.4}
            linkCurveRotation={0} // Keep them aligned to create clean loops

            // Directionality
            linkDirectionalArrowLength={5}
            linkDirectionalArrowRelPos={1}

            // ALIVE DATA: Particles show the constant feedback loop
            linkDirectionalParticles={(link: any) => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;

                if (activeNode && sourceId === activeNode) return 6; // Active output
                if (activeNode && targetId === activeNode) return 2; // Active input
                return 1; // Background system hum
            }}
            linkDirectionalParticleWidth={(link: any) => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                return (activeNode && sourceId === activeNode) ? 3 : 1.5;
            }}
            linkDirectionalParticleSpeed={0.003} // Slow, graceful flow

            // --------------------------------------------
            // GLOBAL SETTINGS 
            // --------------------------------------------
            d3VelocityDecay={0.1} // Very low friction for "floating in void" feel
            d3AlphaDecay={0.001}  // Extremely slow stabilization for perpetual gentle motion
        />
    );
};
