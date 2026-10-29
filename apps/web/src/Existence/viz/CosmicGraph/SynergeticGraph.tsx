import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { generateSynergeticGraph, type SynergeticNode } from '@Omni/lib/graph-processor';
import { FractalDiveOverlay } from '../../../Omni/components/FractalDiveOverlay';
import { GraphControls } from './GraphControls';
import { useOmniGraphStore } from '../../../Omni/stores/useOmniGraphStore';
import { createUniglyphGeometry } from '@Omni/lib/UniglyphLoader';
import { CodexTerminal } from '../../../Omni/components/Codex/CodexTerminal';

// [MODULATOR] - Renamed per user language
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface SynergeticGraphProps {
    onNodeClick?: (node: any) => void;
}

// --- SEMANTIC NODE PANEL: Floating Info & Context ---
const SemanticNodePanel: React.FC<{ node: any; graphRef: any }> = ({ node, graphRef }) => {
    const [pos, setPos] = useState({ x: -9999, y: -9999 });

    useEffect(() => {
        let frameId: number;
        const updatePos = () => {
            if (node && graphRef.current) {
                // Get Screen Coords
                const coords = graphRef.current.graph2ScreenCoords(node.x, node.y, node.z);
                if (coords.x === 0 && coords.y === 0) {
                    setPos({ x: -9999, y: -9999 });
                } else {
                    setPos(coords);
                }
            }
            frameId = requestAnimationFrame(updatePos);
        };
        updatePos();
        return () => cancelAnimationFrame(frameId);
    }, [node, graphRef]);

    if (!node) return null;

    return (
        <div
            className="absolute pointer-events-none z-50 flex flex-col items-center origin-bottom transition-all duration-300 ease-out effect-fire-burn"
            style={{
                left: pos.x,
                top: pos.y - 60,
                transform: 'translate(-50%, -100%) scale(1)',
                opacity: pos.x < 0 ? 0 : 1
            }}
        >
            <div className="bg-slate-950/95 border border-cyan-400/30 rounded-lg p-5 shadow-[0_0_40px_rgba(6,182,212,0.4)] backdrop-blur-md min-w-[320px] max-w-[400px] text-left flex flex-col items-start jrpg-panel">

                {/* Header: [Symbol] [Title] */}
                <div className="flex items-center gap-3 w-full border-b border-cyan-800/50 pb-2 mb-3">
                    <span className="text-4xl text-cyan-50 filter drop-shadow-[0_0_8px_cyan] font-serif leading-none">
                        {node.symbol ? node.symbol.slice(-1) : "?"}
                    </span>
                    <h3 className="text-xl font-bold text-cyan-100 uppercase tracking-[0.1em] leading-tight">
                        {node.name || node.label}
                    </h3>
                </div>

                {/* Definition / Rationale */}
                {(node.rationale) && (
                    <div className="bg-slate-900/50 rounded p-3 border border-cyan-900/30 w-full mb-2">
                        <p className="text-sm text-cyan-200/90 font-mono leading-relaxed text-justify">
                            {node.rationale}
                        </p>
                    </div>
                )}

                {/* Footer: Fractal Address (Bottom Left) */}
                <div className="w-full flex justify-between items-end mt-1 mb-4">
                    <div className="text-[10px] text-cyan-500 font-mono tracking-widest opacity-80">
                        ADDRESS: {node.symbol || node.id}
                    </div>
                </div>

                {/* MCP Server Terminal */}
                <div className="w-full h-48 border border-cyan-500/30 rounded overflow-hidden">
                    <CodexTerminal nodeId={node.id} isActive={true} />
                </div>

                {/* Connector Line */}
                <div className="absolute -bottom-10 left-1/2 w-0.5 h-10 bg-gradient-to-b from-cyan-400/50 to-transparent -translate-x-1/2" />
                <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-cyan-400 rounded-full -translate-x-1/2 shadow-[0_0_10px_cyan]" />
            </div>
        </div>
    );
};

const SynergeticGraph: React.FC<SynergeticGraphProps> = ({ onNodeClick }) => {

    // --- GLOBAL STATE ---
    const { targetNodeId, setTargetNode } = useOmniGraphStore();

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

    const graphData = useMemo(() => generateSynergeticGraph(), []);
    const fgRef = useRef<any>(null);

    // --------------------------------------------
    // PHYSICS & POST-PROCESSING
    // --------------------------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            if (fgRef.current) {
                try {
                    // Bloom
                    const bloomPass = new UnrealBloomPass(
                        new THREE.Vector2(window.innerWidth, window.innerHeight),
                        1.5, 0.4, 0.85
                    );
                    fgRef.current.postProcessingComposer().addPass(bloomPass);

                    // Forces
                    fgRef.current.d3Force('charge').strength(-1000); // Spread out
                    fgRef.current.d3Force('link').distance(100);

                } catch (err) {
                    console.warn('SynergeticGraph config error:', err);
                }
            }
        }, 500); // Delay for init
        return () => clearTimeout(timer);
    }, []);

    // --------------------------------------------
    // CAMERA ZOOM (Global Sync)
    // --------------------------------------------
    useEffect(() => {
        if (targetNodeId && fgRef.current) {
            // Fetch directly from live simulation for immediate coords
            const node = graphData.nodes.find((n: any) => n.id === targetNodeId || n.name === targetNodeId);
            if (node && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
                const distance = 80;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

                fgRef.current.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio + 20, z: node.z * distRatio + 20 },
                    node,
                    4000
                );
            }
        }
    }, [targetNodeId, graphData]);

    // --------------------------------------------
    // NODE RENDERER (Uniglyph Extrusion)
    // --------------------------------------------
    // --------------------------------------------
    // NODE RENDERER (Uniglyph Extrusion & Sprites)
    // --------------------------------------------
    const nodeThreeObject = useCallback((node: any) => {
        const n = node as SynergeticNode;
        const isActive = targetNodeId === n.id || targetNodeId === n.label;
        const group = new THREE.Group();

        // Use Symbol -&gt; Label -> ID fallback
        const text = n.symbol || n.label || "?";

        // L2 Optimization: Use Sprites for the 1000 terminals
        if (n.level === 2 && !isActive) {
            // Create a simple canvas texture for the sprite
            // We can reuse the logic from UniglyphLoader or just make a simple one here
            // distinct from the 3D geometry.
            // For now, let's just use a high-performance simple Sprite.
            // Actually, let's use the Uniglyph geometry for now but simpler? 
            // no, user specifically asked for "2d symbols". 
            // Let's use a Text Sprite.

            const canvas = document.createElement('canvas');
            canvas.width = 512; // Widen for complex labels
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = n.color; // Use node color
                ctx.font = 'bold 80px sans-serif'; // System font
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 256, 64);
            }
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(16, 4, 1); // Scale sprint aspect ratio 4:1
            return sprite;
        }

        // L0 & L1 (Pillars & Matrices) - Keep 3D Extrusion
        // Voxel/Extrusion Geometry (Using UniglyphLoader with System Fonts)
        // Depth = 0.5 (Shallow, as requested)
        const geometry = createUniglyphGeometry(text, 1.5);

        // Scale adjustment for the canvas-based geometry
        // The loader returns normalized approx 10 units high. 
        // We scale it down to fit the graph scale.
        const s = n.level === 0 ? 0.3 : (n.level === 1 ? 0.2 : 0.1);
        geometry.scale(s, s, s);

        const material = new THREE.MeshPhysicalMaterial({
            color: isActive ? '#ffffff' : n.color,
            emissive: isActive ? '#00ffff' : n.color,
            emissiveIntensity: isActive ? 0.8 : 0.3,
            roughness: 0.2,
            metalness: 0.8,
            clearcoat: 1.0,
            transparent: true,
            opacity: isActive ? 1.0 : 0.9,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);

        // Optional Backdrop for readability
        if (isActive) {
            const planeGeo = new THREE.PlaneGeometry(8, 4);
            const planeMat = new THREE.MeshBasicMaterial({ color: 'black', opacity: 0.6, transparent: true, side: THREE.DoubleSide });
            const plane = new THREE.Mesh(planeGeo, planeMat);
            plane.position.set(0, 0, -0.5);
            group.add(plane);
        }

        return group;
    }, [targetNodeId]);

    const activeNode = useMemo(() => {
        return graphData.nodes.find((n: any) => n.id === targetNodeId || n.name === targetNodeId);
    }, [graphData, targetNodeId]);

    const [overlayState, setOverlayState] = React.useState<{
        isOpen: boolean; pillar: string; factor: string; content: string;
    }>({ isOpen: false, pillar: '', factor: '', content: '' });

    const handleNodeClick = useCallback((node: any) => {
        // Update Global Store
        setTargetNode(node.id);

        onNodeClick?.(node);
    }, [onNodeClick, setTargetNode]);

    return (
        <div className="relative w-full h-full">
            {/* FORCE GRAPH */}
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                backgroundColor="rgba(0,0,0,0)" // Transparent
                nodeThreeObject={nodeThreeObject}

                // Links
                linkWidth={link => (link as any).intensity || 1}
                linkColor={() => "rgba(71, 85, 105, 0.4)"} // Slate-500 optimized
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.01}

                showNavInfo={false}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}

                onNodeClick={handleNodeClick}
                enableNodeDrag={false}
            />

            {/* PANEL 97 (FLOATING UI) */}
            {activeNode && (
                <SemanticNodePanel node={activeNode} graphRef={fgRef} />
            )}

            {/* CONTROLS & OVERLAYS */}
            <FractalDiveOverlay
                isOpen={overlayState.isOpen}
                onClose={() => setOverlayState(prev => ({ ...prev, isOpen: false }))}
                pillar={overlayState.pillar}
                factor={overlayState.factor}
                content={overlayState.content}
            />
            <GraphControls
                config={layoutConfig}
                onConfigChange={setLayoutConfig}
                visualConfig={visualConfig}
                onVisualConfigChange={setVisualConfig}
                isOpen={showControls}
                onToggle={() => setShowControls(!showControls)}
            />
        </div>
    );
};

export default SynergeticGraph;
