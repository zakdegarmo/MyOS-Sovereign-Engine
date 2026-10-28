import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import * as THREE from 'three';
import { Download, Terminal, Cpu } from 'lucide-react';

// --- AETHER GLYPH GENERATOR (Adapted for MyOS) ---
// Procedural glyph generation using voxel boxes.

const createVoxelGlyph = (seed: string): THREE.Vector3[] => {
    const voxels: THREE.Vector3[] = [];
    const size = 6;
    const threshold = 0.5;
    
    // Deterministic random based on seed
    const hash = seed.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const rnd = (i: number) => {
        const x = Math.sin(hash + i) * 10000;
        return x - Math.floor(x);
    };

    for (let x = -size; x <= size; x++) {
        for (let y = -size; y <= size; y++) {
            for (let z = -size; z <= size; z++) {
                // Symmetrical patterns
                const sx = Math.abs(x);
                const val = rnd(sx * 13 + y * 7 + z * 3);
                if (val > threshold && (sx + Math.abs(y) + Math.abs(z)) < size * 1.5) {
                    voxels.push(new THREE.Vector3(x, y, z));
                }
            }
        }
    }
    return voxels;
};

const GlyphVoxelMesh = ({ seed, color = "#00f3ff" }: { seed: string, color?: string }) => {
    const voxels = useMemo(() => createVoxelGlyph(seed), [seed]);
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
            meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime()) * 0.2;
        }
    });

    return (
        <group ref={meshRef}>
            {voxels.map((v, i) => (
                <Box key={i} position={v} args={[0.8, 0.8, 0.8]}>
                    <meshStandardMaterial 
                        color={color} 
                        emissive={color} 
                        emissiveIntensity={0.5} 
                        transparent 
                        opacity={0.8}
                    />
                </Box>
            ))}
        </group>
    );
};

export const GlyphFactory: React.FC = () => {
    const [seed, setSeed] = useState("MASTER_SIGIL");
    const [color, setColor] = useState("#00f3ff");
    const [status, setStatus] = useState("Idle");

    const handleGenerate = () => {
        setStatus("REGENERATING_SIGIL...");
        setTimeout(() => setStatus("SIGIL_STABLE"), 500);
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-cyan-500 font-mono select-none overflow-hidden border-l border-cyan-500/20">
            {/* Header */}
            <div className="h-12 border-b border-cyan-500/30 bg-cyan-950/10 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <Cpu size={16} className="text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Asset_Lab // Glyph_Factory_v2</span>
                </div>
                <div className="text-[10px] text-cyan-500/50">NODE: 0xDEADBEEF</div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex gap-4 p-4 min-h-0">
                {/* 3D Canvas */}
                <div className="flex-1 bg-black/60 rounded-lg border border-cyan-500/10 relative overflow-hidden group">
                    <Canvas camera={{ position: [0, 15, 30], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 20, 10]} intensity={1.5} color={color} />
                        <GlyphVoxelMesh seed={seed} color={color} />
                        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
                        <gridHelper args={[100, 20, 0x004444, 0x002222]} position={[0, -10, 0]} />
                    </Canvas>
                    
                    <div className="absolute top-4 left-4 p-2 bg-slate-900/80 border border-cyan-500/20 rounded font-mono text-[9px] pointer-events-none opacity-50">
                        RENDER_ENGINE: VOXEL_V3<br/>
                        VOXELS: {seed.length * 42} (Estimated)<br/>
                        STABILITY: 98.4%
                    </div>
                    
                    <div className="absolute bottom-4 right-4 flex gap-2">
                         <button className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/50 text-[10px] uppercase hover:bg-cyan-500/40 transition-all">
                             <Download size={10} className="inline mr-1" /> Manifest_GLB
                         </button>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="w-64 flex flex-col gap-4 shrink-0">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase text-cyan-500/50">Semantic Seed</label>
                            <input 
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                className="w-full bg-black/40 border border-cyan-500/30 rounded px-2 py-1.5 text-xs text-cyan-100 outline-none focus:border-cyan-400"
                                placeholder="Enter keyword..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase text-cyan-500/50">Resonance Hue</label>
                            <input 
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-8 bg-black/40 border border-cyan-500/30 rounded cursor-pointer"
                            />
                        </div>

                        <button 
                            onClick={handleGenerate}
                            className="w-full py-2 bg-cyan-500 text-black font-bold text-[10px] uppercase hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        >
                            Execute Manifest
                        </button>
                    </div>

                    <div className="flex-1 bg-black/20 rounded-lg border border-white/5 p-4 overflow-y-auto custom-scrollbar">
                        <div className="text-[9px] text-cyan-500/40 mb-3 flex items-center gap-2 uppercase tracking-widest font-bold">
                            <Terminal size={12} /> Creation_Log
                        </div>
                        <div className="space-y-2 text-[9px] font-mono leading-relaxed">
                            <div className="text-cyan-400 opacity-60">Initializing voxel buffer...</div>
                            <div className="text-cyan-400 opacity-60">Applying seed: {seed}</div>
                            <div className="text-cyan-400 opacity-60">Symmetry check: COMPLETED</div>
                            <div className="text-cyan-400 opacity-60 animate-pulse">Status: {status}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="h-8 bg-black/40 border-t border-cyan-500/10 px-4 flex items-center justify-between text-[9px] text-cyan-500/30 pointer-events-none uppercase font-bold">
                <span>Memory_Usage: 14.2MB</span>
                <span>MyOS // Sigil_Forge_v0.2</span>
            </div>
        </div>
    );
};
