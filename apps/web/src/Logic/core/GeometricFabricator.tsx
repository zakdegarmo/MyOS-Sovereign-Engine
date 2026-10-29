
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three-stdlib';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';

// PRESET RECIPES (The Alchemical Formulas)
type RecipeType = 'CRYSTAL_SPIRE' | 'CYBER_FRAME' | 'NEBULA_ORG' | 'VOID_CUBE';

const RECIPES: Record<RecipeType, { name: string, description: string }> = {
    CRYSTAL_SPIRE: { name: 'Crystal Spire', description: 'A jagged, ascending structure representing focused thought.' },
    CYBER_FRAME: { name: 'Cyber Frame', description: 'A wireframe structural component for UI scaffolding.' },
    NEBULA_ORG: { name: 'Nebula Organism', description: 'A random, organic blob of noisy geometry.' },
    VOID_CUBE: { name: 'Void Cube', description: 'A hyper-dense cube with inverted normals.' }
};

interface FabricatorProps {
    className?: string;
}

export const GeometricFabricator: React.FC<FabricatorProps> = ({ className }) => {
    const [activeRecipe, setActiveRecipe] = useState<RecipeType>('CRYSTAL_SPIRE');
    const [seed, setSeed] = useState(Date.now());
    const sceneRef = useRef<THREE.Group>(null);

    const handleExport = () => {
        if (!sceneRef.current) return;

        const exporter = new GLTFExporter();
        const options = {
            binary: true,
            embedImages: true,
            // Inject Metadata as per USER REQUEST (Step 310)
            customData: {
                nlbl_resonance_address: {
                    nlbl_logic_shift: activeRecipe === 'NEBULA_ORG' ? "[...0.n.n...]" : "[...0...]",
                    generated_by: "Gemini_Geometric_Fabricator_v1"
                }
            }
        };

        exporter.parse(
            sceneRef.current,
            (result) => {
                if (result instanceof ArrayBuffer) {
                    const blob = new Blob([result], { type: 'application/octet-stream' });
                    saveAs(blob, `${activeRecipe.toLowerCase()}_${seed}.glb`);
                } else {
                    const output = JSON.stringify(result, null, 2);
                    const blob = new Blob([output], { type: 'text/plain' });
                    saveAs(blob, `${activeRecipe.toLowerCase()}_${seed}.gltf`);
                }
            },
            (err) => console.error('Export Failed', err),
            options
        );
    };

    return (
        <div className={`w-full h-[600px] flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden ${className}`}>
            {/* HEADER */}
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono text-xl">⚡ GEMINI FABRICATOR</span>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 transition-all font-mono text-sm"
                >
                    <Download size={16} />
                    EXPORT .GLB
                </button>
            </div>

            <div className="flex-1 flex">
                {/* CONTROLS */}
                <div className="w-64 border-r border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-4">
                    <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">Select Recipe</div>

                    {Object.entries(RECIPES).map(([key, info]) => (
                        <button
                            key={key}
                            onClick={() => setActiveRecipe(key as RecipeType)}
                            className={`p-3 rounded text-left border transition-all ${activeRecipe === key
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-400'
                                }`}
                        >
                            <div className="font-bold text-sm mb-1">{info.name}</div>
                            <div className="text-[10px] opacity-70 leading-tight">{info.description}</div>
                        </button>
                    ))}

                    <div className="mt-8">
                        <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">Parameters</div>
                        <button
                            onClick={() => setSeed(Date.now())}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 font-mono"
                        >
                            REROLL SEED
                        </button>
                    </div>
                </div>

                {/* VIEWPORT */}
                <div className="flex-1 relative bg-black">
                    <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
                        <color attach="background" args={['#0f172a']} />
                        <Stage environment="city" intensity={0.5}>
                            <group ref={sceneRef}>
                                <ProceduralMesh recipe={activeRecipe} seed={seed} />
                            </group>
                        </Stage>
                        <Grid args={[10, 10]} />
                        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                    </Canvas>

                    <div className="absolute bottom-4 right-4 text-slate-500 text-xs font-mono pointer-events-none">
                        PREVIEW MODE // {activeRecipe} // SEED: {seed}
                    </div>
                </div>
            </div>
        </div>
    );
};

// PROCEDURAL GEOMETRY GENERATOR
const ProceduralMesh: React.FC<{ recipe: RecipeType, seed: number }> = ({ recipe, seed }) => {
    // Determine Geometry based on Recipe
    const mesh = useMemo(() => {
        const random = (offset = 0) => Math.sin(seed + offset) * 10000 - Math.floor(Math.sin(seed + offset) * 10000); // Pseudo-random from seed

        switch (recipe) {
            case 'CRYSTAL_SPIRE': {
                // Stack of Cone Geometries
                return (
                    <group>
                        {[0, 1, 2].map(i => (
                            <mesh key={i} position={[0, i * 1.5, 0]} scale={[1 - i * 0.2, 1, 1 - i * 0.2]}>
                                <coneGeometry args={[1, 2, 4]} /> {/* Low Poly 4-sided */}
                                <meshStandardMaterial
                                    color="#22d3ee"
                                    roughness={0.1}
                                    metalness={0.9}
                                    emissive="#06b6d4"
                                    emissiveIntensity={0.2}
                                />
                            </mesh>
                        ))}
                    </group>
                );
            }
            case 'CYBER_FRAME': {
                // Icosahedron Wireframe
                return (
                    <mesh>
                        <icosahedronGeometry args={[2, 0]} />
                        <meshStandardMaterial color="#6366f1" wireframe />
                    </mesh>
                );
            }
            case 'NEBULA_ORG': {
                // A blob of spheres
                return (
                    <group>
                        {[...Array(8)].map((_, i) => (
                            <mesh key={i} position={[random(i) * 2 - 1, random(i + 1) * 2 - 1, random(i + 2) * 2 - 1]} scale={random(i + 3) + 0.5}>
                                <sphereGeometry args={[0.5, 16, 16]} />
                                <meshStandardMaterial color="#c084fc" roughness={0.4} />
                            </mesh>
                        ))}
                    </group>
                );
            }
            case 'VOID_CUBE': {
                return (
                    <mesh>
                        <boxGeometry args={[2, 2, 2]} />
                        <meshStandardMaterial color="black" roughness={0} metalness={1} />
                        {/* Inner Light */}
                        <pointLight position={[0, 0, 0]} color="white" intensity={2} distance={3} />
                    </mesh>
                );
            }
            default: return null;
        }
    }, [recipe, seed]);

    return <>{mesh}</>;
};
