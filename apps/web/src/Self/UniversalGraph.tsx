
import React, { useEffect, useRef, useMemo, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { GLTFLoader } from 'three-stdlib';
import type { UserGestalt, IdeaCube } from '@Omni/types';
import { ONTOLOGY_NODES, OntologyCategory } from './ontologyConstants';
import { NLBL_Physics } from '@Omni/utils/NLBL_Physics';
import type { NLBL_Relationship } from '@Omni/types/NLBL_Schema';

// --- CONFIG ---
const MODEL_BASE_URL = "https://raw.githubusercontent.com/zakdegarmo/MyOS/main/%F0%9F%9C%8BMyWebsite/models/";
const MODEL_FILES: Record<OntologyCategory, string> = {
    [OntologyCategory.Self]: "glyph_self.glb",
    [OntologyCategory.Thought]: "glyph_thought.glb",
    [OntologyCategory.Logic]: "glyph_logic.glb",
    [OntologyCategory.Unity]: "glyph_unity.glb",
    [OntologyCategory.Existence]: "glyph_existence.glb",
    [OntologyCategory.Improvement]: "glyph_improvement.glb",
    [OntologyCategory.Mastery]: "glyph_mastery.glb",
    [OntologyCategory.Resonance]: "glyph_resonance.glb",
    [OntologyCategory.Transcendence]: "glyph_transcendence.glb",
    [OntologyCategory.TheNothingAndEverything]: ""
};

// Map Tailwind colors to Hex for Three.js
const COLOR_MAP: Record<OntologyCategory, string> = {
    [OntologyCategory.Self]: '#fb7185',        // rose-400
    [OntologyCategory.Thought]: '#fb923c',     // orange-400
    [OntologyCategory.Logic]: '#facc15',       // yellow-400
    [OntologyCategory.Unity]: '#34d399',       // emerald-400
    [OntologyCategory.Existence]: '#22d3ee',   // cyan-400
    [OntologyCategory.Improvement]: '#60a5fa', // blue-400
    [OntologyCategory.Mastery]: '#a78bfa',     // violet-400
    [OntologyCategory.Resonance]: '#e879f9',   // fuchsia-400
    [OntologyCategory.Transcendence]: '#f472b6', // pink-400
    [OntologyCategory.TheNothingAndEverything]: '#ffffff'
};


// --- DDC TO ONTOLOGY MAPPING ---
// Maps Ontology to a DDC index (0-9) to determine prism position.
const DDC_MAP: Record<OntologyCategory, number> = {
    [OntologyCategory.TheNothingAndEverything]: 0, // 000 General
    [OntologyCategory.Existence]: 1,              // 100 Philosophy
    [OntologyCategory.Transcendence]: 2,          // 200 Religion
    [OntologyCategory.Unity]: 3,                  // 300 Social
    [OntologyCategory.Resonance]: 4,              // 400 Language
    [OntologyCategory.Logic]: 5,                  // 500 Science
    [OntologyCategory.Mastery]: 6,                // 600 Technology
    [OntologyCategory.Thought]: 7,                // 700 Arts
    [OntologyCategory.Self]: 8,                   // 800 Literature (Narrative)
    [OntologyCategory.Improvement]: 9             // 900 History (Evolution)
};

const DDC_LABELS: Record<number, string> = {
    0: "000 General",
    1: "100 Philosophy",
    2: "200 Religion",
    3: "300 Social",
    4: "400 Language",
    5: "500 Science",
    6: "600 Technology",
    7: "700 Arts",
    8: "800 Literature",
    9: "900 History"
};

export type GraphMode = 'ontology' | 'chronos' | 'dewey' | 'void';

interface GraphNode {
    id: string;
    label: string,
    type: 'memory' | 'ontology' | 'tag' | 'asset' | 'image' | 'idea';
    val: number;
    color: string;
    category?: OntologyCategory; // For Ontology Nodes
    timestamp?: number;
    group?: string;
    fx?: number; // Fixed X
    fy?: number; // Fixed Y
    fz?: number; // Fixed Z
    assetUrl?: string; // For Images
}

interface Props {
    mode: GraphMode;
    gestalt: UserGestalt;
    memories?: any[];
    ideas?: IdeaCube[];
    onNodeClick?: (node: any) => void;
    onCrystalize?: (idea: IdeaCube) => void;
}

export const UniversalGraph: React.FC<Props> = ({ mode, gestalt, memories = [], ideas = [], onNodeClick, onCrystalize }) => {
    const fgRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate Prism Coordinates (Pre-calc)
    // NOW ENHANCED WITH NLBL PHYSICS (Implicitly, via logic shifts in positioning below)
    const PRISM_COORDINATES = useMemo(() => {
        const coords: Record<number, { x: number, y: number, z: number }> = {};
        const R = 150; // Radius
        const H = 100; // Half-Height separation

        for (let i = 0; i < 10; i++) {
            const isTop = i >= 5;
            const indexInLayer = i % 5;
            const theta = (indexInLayer * 2 * Math.PI) / 5 - Math.PI / 2; // Start at 12 o'clock

            // Standard Prism
            coords[i] = {
                x: R * Math.cos(theta),
                y: R * Math.sin(theta),
                z: isTop ? H : -H
            };
        }
        return coords;
    }, []);


    // --- DATA TRANSFORMATION ---
    const graphData = useMemo(() => {
        const nodes: GraphNode[] = [];
        const links: any[] = [];
        const addedNodeIds = new Set<string>();

        // 0. CHRONOS TIME SCALING
        const timeSorted = [...memories, ...ideas].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const minTime = timeSorted[0]?.timestamp || Date.now();
        const maxTime = timeSorted[timeSorted.length - 1]?.timestamp || Date.now();
        const timeRange = Math.max(maxTime - minTime, 1000); // Avoid divide by zero

        const getTimeZ = (ts: number = Date.now()) => {
            // Map time to Z axis (0 to -2000 deep)
            // Recent = Close (0), Old = Far (-2000)
            const norm = (ts - minTime) / timeRange;
            return (norm - 1) * 1000; // 0 (new) to -1000 (old)
        };

        // 1. ONTOLOGY NODES (The 10 glyphs) FIXED POSITIONS
        if (mode === 'ontology' || mode === 'dewey') {
            ONTOLOGY_NODES.forEach(onode => {
                const ddcIndex = DDC_MAP[onode.category];
                const pos = PRISM_COORDINATES[ddcIndex];

                let label: string = onode.category;
                if (mode === 'dewey') label = DDC_LABELS[ddcIndex];

                const content = gestalt.ontology?.[onode.id] || "";
                const contentDensity = Math.min(content.length / 50, 10);

                nodes.push({
                    id: onode.id,
                    label: label as string,
                    type: 'ontology',
                    val: 30 + contentDensity,
                    color: COLOR_MAP[onode.category],
                    category: onode.category as OntologyCategory,
                    fx: pos.x,
                    fy: pos.y,
                    fz: pos.z
                });
                addedNodeIds.add(onode.id);
            });
        }
        else if (mode === 'chronos') {
            // In Chronos mode, Ontology Nodes act as the "Rails" of the time tunnel
            ONTOLOGY_NODES.forEach(onode => {
                const ddcIndex = DDC_MAP[onode.category];
                // Use a larger radius for the tunnel walls
                const theta = (ddcIndex * 2 * Math.PI) / 10 - Math.PI / 2;
                const R = 200;

                // Create a "Rail" node at the start and end? 
                // Alternatively, just let them float at the 'Present' (Z=0)
                nodes.push({
                    id: onode.id,
                    label: onode.category,
                    type: 'ontology',
                    val: 30,
                    color: COLOR_MAP[onode.category],
                    category: onode.category as OntologyCategory,
                    fx: R * Math.cos(theta),
                    fy: R * Math.sin(theta),
                    fz: 0 // Present
                });
                addedNodeIds.add(onode.id);
            });
        }

        // 2. MEMCUBES (Journal Entries / Assets)
        memories.forEach((mem, i) => {
            const id = (mem.id || `mem-${i}`).toString();
            const ts = mem.timestamp || mem.meta?.timestamp || Date.now();

            // Determine position
            let pos = { x: 0, y: 0, z: 0 };

            if (mode === 'chronos') {
                const z = getTimeZ(ts);
                // Radial position based on category/context match if possible, otherwise spiral
                // Heuristic: Hash text to get "Category Angle"
                // Ideally we use the Dewey/Pillar classification from the mem
                const ddcString = mem.meta?.context?.find((c: string) => c.startsWith('DDC:')) || '';
                const ddcNum = parseInt(ddcString.replace('DDC:', '')[0]) || (i % 10); // Fallback to index
                const theta = (ddcNum * 2 * Math.PI) / 10 - Math.PI / 2;
                const R = 150; // Inside the rails

                // Add some jitter
                const jitterExp = Math.random() * 20;

                pos = {
                    x: (R - jitterExp) * Math.cos(theta),
                    y: (R - jitterExp) * Math.sin(theta),
                    z: z
                };
            }

            const node: GraphNode = {
                id: id,
                label: mem.content?.text?.substring(0, 50) + '...' || 'Memory',
                type: mem.type === 'asset' || mem.type === 'image' ? 'asset' : 'memory',
                val: 10,
                color: '#fcd34d',
                timestamp: ts,
                assetUrl: mem.content?.assetUrl
            };

            if (mode === 'chronos') {
                node.fx = pos.x;
                node.fy = pos.y;
                node.fz = pos.z;
            }

            nodes.push(node);

            // Link to Best Ontology Match (Visualization Only)
            if (addedNodeIds.size > 0 && mode !== 'chronos') {
                const targetCat = ONTOLOGY_NODES[i % ONTOLOGY_NODES.length].id;
                links.push(NLBL_Physics.manifestLink(id, { target_node: targetCat, vector_type: 'recursive', visual_manifest: {} as any }));
            }
        });


        // 3. IDEAS (Transient)
        ideas.forEach((idea, i) => {
            const id = idea.id;
            const ts = idea.timestamp || Date.now();
            let pos = { x: 0, y: 0, z: 0 };

            if (mode === 'chronos') {
                const z = getTimeZ(ts);
                // Ideas usually come from a specific Pillar (sparkedBy)
                // Normalize sparkedBy to Ontology Category
                const helperMap: Record<string, number> = {
                    'Self': 8, 'Thought': 7, 'Logic': 5, 'Unity': 3, 'Existence': 1,
                    'Improvement': 9, 'Mastery': 6, 'Resonance': 4, 'Transcendence': 2, 'Omni': 0
                };
                const ddcNum = helperMap[idea.sparkedBy] ?? 7;
                const theta = (ddcNum * 2 * Math.PI) / 10 - Math.PI / 2;
                const R = 150;

                pos = { x: R * Math.cos(theta), y: R * Math.sin(theta), z: z };
            }

            const node: GraphNode = {
                id: id,
                label: `💡 ${idea.content.substring(0, 30)}...`,
                type: 'idea',
                val: 8,
                color: '#22d3ee',
                timestamp: ts
            };

            if (mode === 'chronos') {
                node.fx = pos.x;
                node.fy = pos.y;
                node.fz = pos.z;
            }

            nodes.push(node);
        });

        return { nodes, links };
    }, [mode, gestalt, memories, ideas, PRISM_COORDINATES]);


    // --- LAYOUT ENFORCEMENT ---
    useEffect(() => {
        if (!fgRef.current) return;
        // Standard Force Physics
        // NLBL Note: We might want to use d3Force('charge') differently based on resonance address
        fgRef.current.d3Force('charge').strength(-100);
        fgRef.current.d3Force('link').distance(70);
    }, [mode]);

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (const e of entries) setIsResizing(e.contentRect);
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const setIsResizing = (rect: DOMRectReadOnly) => {
        setDimensions({ w: rect.width, h: rect.height });
    };

    return (
        <div ref={containerRef} className="w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-slate-950/20 backdrop-blur-sm border border-slate-800/50 relative">

            {/* GRAPH UI */}
            <ForceGraph3D
                ref={fgRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={graphData}
                backgroundColor="rgba(0,0,0,0)"
                showNavInfo={false}
                onNodeClick={onNodeClick}

                // LINK PARTICLES (NLBL Schema Implementation)
                linkDirectionalParticles={(link: any) => link.particles || 0}
                linkDirectionalParticleSpeed={(link: any) => link.type === 'recursive' ? 0.005 : 0.01}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={(link: any) => link.color || '#fff'}
                linkColor={(link: any) => link.color || "#334155"}
                linkWidth={(link: any) => link.width || 1}
                linkOpacity={0.3}

                // NODE OBJECTS
                nodeThreeObject={(node: any) => {
                    const group = new THREE.Group();

                    if (node.type === 'ontology') {
                        // --- 3D GLYPH LOADING ---
                        const filename = MODEL_FILES[node.category as OntologyCategory];

                        if (!filename) {
                            // Fallback
                            const geo = new THREE.SphereGeometry(node.val * 0.5, 32, 32);
                            const mat = new THREE.MeshStandardMaterial({
                                color: node.color,
                                emissive: node.color,
                                emissiveIntensity: 0.5,
                                wireframe: true
                            });
                            group.add(new THREE.Mesh(geo, mat));
                        } else {
                            // GLTF Loader
                            const url = `${MODEL_BASE_URL}${filename}`;
                            const loader = new GLTFLoader();

                            loader.load(url, (gltf) => {
                                const model = gltf.scene;

                                // --- METADATA HYDRATION (THE CONCEPT) ---
                                // "The GLB carries its own soul."
                                // We check if the GLB has embedded JSON-LD in its userData/extras.
                                const embeddedData = gltf.userData || (model as any).userData;

                                if (embeddedData && embeddedData.nlbl_resonance_address) {
                                    console.log(`[NLBL] Hydrating Link from embedded GLB metadata for ${node.id}`);

                                    // 1. If the model defines its own position shift (Warp), apply it visually
                                    // Note: We can't easily change the ForceGraph physics node position *after* init without re-heating,
                                    // but we can rotate/scale the model itself to reflect the specific "Spin" of the thought.
                                    const shift = embeddedData.nlbl_resonance_address.nlbl_logic_shift;
                                    if (shift && typeof shift === 'string') {
                                        // e.g. spin based on complexity
                                        model.rotation.y += shift.length * 0.1;
                                    }
                                }

                                model.scale.set(1, 1, 1);
                                model.updateMatrixWorld(true);

                                // Material
                                model.traverse((child: any) => {
                                    if (child.isMesh) {
                                        child.material = new THREE.MeshStandardMaterial({
                                            color: node.color,
                                            metalness: 0.7,
                                            roughness: 0.2,
                                            emissive: node.color,
                                            emissiveIntensity: 0.4
                                        });
                                    }
                                });
                                group.add(model);

                                // --- IDENTITY BEACON (PULSE) ---
                                // If this node has content in our Identity Factors, give it a halo
                                const content = gestalt.ontology?.[node.id];
                                if (content && content.length > 20) {
                                    const ringGeo = new THREE.TorusGeometry(12, 0.2, 8, 32);
                                    const ringMat = new THREE.MeshBasicMaterial({
                                        color: node.color,
                                        transparent: true,
                                        opacity: 0.5
                                    });
                                    const ring = new THREE.Mesh(ringGeo, ringMat);

                                    // Animate ring (manual simple rotation for now, or just static glory)
                                    // Since we can't easily useFrame here without wrapping in a React component,
                                    // We'll rely on the visual presence itself.
                                    ring.rotation.x = Math.PI / 2;
                                    group.add(ring);
                                }
                            });
                        }

                    } else if (node.type === 'idea') {
                        // --- IDEA SPHERE (Pulsing) ---
                        const geometry = new THREE.OctahedronGeometry(4, 0);
                        const material = new THREE.MeshStandardMaterial({
                            color: node.color,
                            emissive: node.color,
                            emissiveIntensity: 0.8,
                            wireframe: true
                        });
                        const mesh = new THREE.Mesh(geometry, material);

                        // TODO: Add actual pulse animation in a useFrame if possible, 
                        // but for now, the emissive intensity helps distinguish it.
                        group.add(mesh);

                    } else if (node.type === 'asset' || node.type === 'image') {
                        // --- ASSET (IMAGE) NODE ---
                        const imgUrl = (node as any).assetUrl || 'https://placehold.co/100x100?text=IMG';
                        const texture = new THREE.TextureLoader().load(imgUrl);

                        const width = 12;
                        const height = width / 1.5; // Aspect Ratio

                        const geometry = new THREE.PlaneGeometry(width, height);
                        const material = new THREE.MeshBasicMaterial({
                            map: texture,
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.9
                        });

                        const plane = new THREE.Mesh(geometry, material);

                        // Border
                        const borderGeo = new THREE.EdgesGeometry(geometry);
                        const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff });
                        const border = new THREE.LineSegments(borderGeo, borderMat);

                        plane.add(border);
                        group.add(plane);

                    } else {
                        // MEMORY CUBE
                        const geometry = new THREE.BoxGeometry(6, 6, 6);
                        const material = new THREE.MeshStandardMaterial({
                            color: node.color,
                            roughness: 0.2,
                            metalness: 0.8,
                            emissive: node.color,
                            emissiveIntensity: 0.2
                        });
                        const cube = new THREE.Mesh(geometry, material);
                        group.add(cube);
                    }

                    // Text Label (Always use node.label, which we manipulated in useMemo)
                    const label = new SpriteText(node.label);
                    // Check if label matches any category
                    const catMatch = Object.values(OntologyCategory).find(c => label.text.includes(c as string)) as OntologyCategory | undefined;
                    if (catMatch) {
                        (node as any).category = catMatch;
                    }
                    label.color = '#fff';
                    label.textHeight = node.type === 'ontology' ? 6 : 4;
                    label.position.set(0, -node.val - 5, 0);
                    label.fontFace = 'Inter';
                    group.add(label);

                    return group;
                }}
            />
        </div>
    );
};
