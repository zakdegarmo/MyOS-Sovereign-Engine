
import React, { useMemo, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { generateSynergeticGraph, type SynergeticNode } from '@Omni/lib/graph-processor';
// Import overlay
import { FractalDiveOverlay } from '../FractalDiveOverlay';
import { GraphControls } from './GraphControls';


import SpriteText from 'three-spritetext';

const SynergeticGraph: React.FC = () => {
    // [MODULATOR STATE]
    const [layoutConfig, setLayoutConfig] = React.useState({
        prismRadius: 300,
        prismHeight: 150,
        factorRadius: 25,
        componentRadius: 8
    });

    const [visualConfig, setVisualConfig] = React.useState({
        tubeScale: 0.1,
        pMultiplier: 1,
        qMultiplier: 1
    });

    const [showControls, setShowControls] = React.useState(false);

    const graphData = useMemo(() => generateSynergeticGraph(layoutConfig), [layoutConfig]);
    const fgRef = useRef<any>(null);


    // [TOPOLOGY] Torus Knot Mapping
    const PILLAR_INDICES: Record<string, number> = {
        'Self': 1, 'Thought': 2, 'Logic': 3, 'Unity': 4, 'Existence': 5,
        'Improvement': 6, 'Mastery': 7, 'Resonance': 8, 'Transcendence': 9, 'Omni': 10
    };

    // Node Object Generator (The Geometry Dimension)
    const nodeThreeObject = useCallback((node: any) => {
        const n = node as SynergeticNode;

        // Derive P and Q from Ontology
        let p = 2; // Winding
        let q = 3; // Loops
        let radius = n.val;
        let tube = n.val * visualConfig.tubeScale; // Dynamic Tube Scale

        if (n.level === 0) {
            // Pillar Level: Q=1 (Ring-like), P based on Pillar ID
            // Map "Self Agent" -> "Self" for index lookup
            const coreName = n.name.replace(/ Agent$/, '');
            p = PILLAR_INDICES[coreName] || 1;
            q = 1;
            // tube is already computed with multiplier
        }
        else if (n.level === 1) {
            // Factor Level: Q=3 (Complex Knot), P based on Factor Index
            const hash = n.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            p = (hash % 8) + 2;
            q = 3;
        }
        else {
            // Component Level
            const hash = n.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            p = (hash % 5) + 2;
            q = 2;
        }

        // Optional: Apply P/Q Multipliers for fun
        // p = Math.max(1, Math.round(p * visualConfig.pMultiplier));
        // q = Math.max(1, Math.round(q * visualConfig.qMultiplier));

        // Geometry: TorusKnot(radius, tube, tubularSegments, radialSegments, p, q)
        const geometry = new THREE.TorusKnotGeometry(radius * 0.6, tube, 64, 8, p, q);

        const material = new THREE.MeshStandardMaterial({
            color: n.color,
            emissive: n.color,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9,
            wireframe: false
        });

        const mesh = new THREE.Mesh(geometry, material);

        // [TOOLTIP FIX] Use 3D Sprite Text for Labels
        const sprite = new SpriteText(n.name);
        sprite.color = n.color;
        sprite.textHeight = 4 + (n.level ? (2 - n.level) * 2 : 0); // Scale by importance
        sprite.position.set(0, radius + 10, 0); // Float well above the knot
        mesh.add(sprite);

        // X-Ray Effect
        mesh.onBeforeRender = (renderer, scene, camera) => {
            // Keep it simple for now, can re-add distance fading if needed
        };

        return mesh;
    }, [visualConfig]); // Re-create when visual config changes

    const [overlayState, setOverlayState] = React.useState<{
        isOpen: boolean;
        pillar: string;
        factor: string;
        content: string;
    }>({ isOpen: false, pillar: '', factor: '', content: '' });

    const handleNodeClick = useCallback(async (node: any) => {
        // Focus Camera (Existing Logic)
        const distance = 40;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        if (fgRef.current) {
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                3000
            );
        }

        // [FRACTAL DIVE IN]
        // [FRACTAL DIVE IN]
        if (node.level === 0 || node.level === 1 || node.level === 0.5) {
            let pillarName = '';
            let factorName = '';
            let url = '';

            if (node.level === 0) {
                // Pillar Level: Load {Pillar}.md
                // Normalize "Self Agent" -> "Self"
                pillarName = node.name.replace(/ Agent$/, '');
                factorName = 'Core Essence';
                url = `/library/${pillarName}.md`;
            } else {
                // Factor Level: Load {Pillar}/{Factor}.md
                const parentLink = graphData.links.find((l: any) => l.target.id === node.id && (l.source.level === 0 || l.source.type === 'Level 0'));
                const source = parentLink ? (parentLink as any).source : null;
                const rawPillar = source ? (source.name || source.id) : 'Unknown';
                pillarName = rawPillar.replace(/ Agent$/, '');
                factorName = node.name;
                url = `/library/${pillarName}/${factorName}.md`;
            }

            try {
                // Fetch Content from Static Server (Vite)
                const res = await fetch(url);
                if (res.ok) {
                    const text = await res.text();
                    setOverlayState({
                        isOpen: true,
                        pillar: pillarName as string,
                        factor: factorName as string,
                        content: text
                    });
                } else {
                    console.warn(`Fractal Drill Down: No content for ${pillarName}/${factorName}`);
                    setOverlayState({
                        isOpen: true,
                        pillar: pillarName as string,
                        factor: factorName as string,
                        content: `### Telemetry Signal Weak\n\nUnable to retrieve specific ontology data for **${factorName}** within **${pillarName}**.\n\n*Server responded with ${res.status}*`
                    });
                }
            } catch (err) {
                console.error("Fractal Fetch Error", err);
            }
        }
    }, [graphData]);

    return (
        <>
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                backgroundColor="#000000"
                nodeThreeObject={nodeThreeObject}

                // Tensegrity & Chronos Dimensions
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={d => (d as any).intensity * 0.01}
                linkWidth={link => (link as any).intensity}
                linkColor={() => "rgba(255,255,255,0.2)"}

                // Camera & Physics
                showNavInfo={false}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}

                onNodeClick={handleNodeClick}
            />

            {/* The Digital TechnoAlchemy Overlay */}
            <FractalDiveOverlay
                isOpen={overlayState.isOpen}
                onClose={() => setOverlayState(prev => ({ ...prev, isOpen: false }))}
                pillar={overlayState.pillar}
                factor={overlayState.factor}
                content={overlayState.content}
            />

            {/* [MODULATORS] Graph Control Panel */}
            <GraphControls
                config={layoutConfig}
                onConfigChange={setLayoutConfig}
                visualConfig={visualConfig}
                onVisualConfigChange={setVisualConfig}
                isOpen={showControls}
                onToggle={() => setShowControls(!showControls)}
            />
        </>
    );
};



export default SynergeticGraph;
