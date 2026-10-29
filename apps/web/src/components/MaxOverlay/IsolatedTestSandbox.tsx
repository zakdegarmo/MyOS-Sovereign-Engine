import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Grid, Html, Sphere } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { Vector3, Box3 } from 'three';
import { Download, Trash2, Crosshair, Bot } from 'lucide-react';
import { RiggedAIBuddy } from '../Avatars/RiggedAIBuddy';

interface DroppedEntity {
    id: string;
    url: string;
}

interface BoneMarker {
    id: string;
    position: [number, number, number];
    name: string;
}

const ManifestedObject = ({ 
    url, 
    onMeshClick 
}: { 
    url: string;
    onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
}) => {
    const { scene } = useGLTF(url);
    const clonedScene = React.useMemo(() => scene.clone(), [scene]);
    
    // Auto-scale to fit roughly a 2x2x2 box
    useEffect(() => {
        const box = new window.THREE.Box3().setFromObject(clonedScene);
        const size = box.getSize(new window.THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 2 / maxDim;
            clonedScene.scale.set(scale, scale, scale);
        }
    }, [clonedScene]);

    return (
        <RigidBody colliders="hull" position={[0, 10, 0]} restitution={0.2} friction={1}>
            <primitive 
                object={clonedScene} 
                onClick={(e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation();
                    onMeshClick(e);
                }}
            />
        </RigidBody>
    );
};

export const IsolatedTestSandbox: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [entities, setEntities] = useState<DroppedEntity[]>([]);
    const [bones, setBones] = useState<BoneMarker[]>([]);
    const [isRiggingMode, setIsRiggingMode] = useState(false);
    const [boneNameInput, setBoneNameInput] = useState("Bone");
    const [showTestBuddy, setShowTestBuddy] = useState(false);
    
    useEffect(() => {
        const handleDrop = (e: CustomEvent) => {
            console.log("Sandbox received drop event:", e.detail);
            if (e.detail && e.detail.url) {
                setEntities(prev => [...prev, { id: `drop-${Date.now()}`, url: e.detail.url }]);
            }
        };
        window.addEventListener('manifestation_drop' as any, handleDrop);
        return () => window.removeEventListener('manifestation_drop' as any, handleDrop);
    }, []);

    const handleMeshClick = (e: ThreeEvent<MouseEvent>) => {
        if (!isRiggingMode) return;
        const pt = e.point;
        setBones(prev => [...prev, {
            id: `bone-${Date.now()}`,
            position: [pt.x, pt.y, pt.z],
            name: `${boneNameInput}_${prev.length}`
        }]);
    };

    const exportRig = () => {
        if (bones.length === 0) return;
        const data = JSON.stringify({ version: "1.0", bones }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `custom_rig_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full h-full relative bg-slate-950">
            {/* Status Panel */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 p-4 border border-cyan-500/30 backdrop-blur-md rounded-lg pointer-events-none">
                <h2 className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-1">Isolated Test Sandbox</h2>
                <p className="text-slate-400 font-mono text-[10px] uppercase">Physics Env: Active | Gravity: 9.81m/s²</p>
                <p className="text-slate-500 font-mono text-[9px] uppercase mt-2">Entities present: {entities.length}</p>
            </div>

            {/* Rigging Panel */}
            <div className="absolute top-4 right-4 z-10 w-64 bg-black/80 p-4 border border-indigo-500/30 backdrop-blur-xl rounded-xl flex flex-col gap-4 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="text-indigo-400 font-mono text-[10px] tracking-widest uppercase font-bold flex items-center gap-2">
                        <Crosshair size={12} />
                        Bone Mapper
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowTestBuddy(!showTestBuddy)}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors border flex items-center gap-1 ${showTestBuddy ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-transparent text-slate-400 border-white/10 hover:border-cyan-500/50'}`}
                        >
                            <Bot size={12} />
                            {showTestBuddy ? 'Test Buddy Active' : 'Spawn Test Buddy'}
                        </button>
                        <button 
                            onClick={() => setIsRiggingMode(!isRiggingMode)}
                            className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors border ${isRiggingMode ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-transparent text-slate-400 border-white/10 hover:border-indigo-500/50'}`}
                        >
                            {isRiggingMode ? 'Rigging Active' : 'Enable Rigging'}
                        </button>
                    </div>
                </div>

                {isRiggingMode && (
                    <>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-white/40 uppercase font-mono">Next Bone Prefix</label>
                            <input 
                                type="text" 
                                value={boneNameInput}
                                onChange={e => setBoneNameInput(e.target.value)}
                                className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="max-h-32 overflow-y-auto no-scrollbar border border-white/5 rounded p-1 bg-black/30">
                            {bones.length === 0 ? (
                                <p className="text-[9px] text-white/20 italic p-2 text-center font-mono">Click mesh to place bones.</p>
                            ) : (
                                bones.map(b => (
                                    <div key={b.id} className="flex justify-between items-center p-1 hover:bg-white/5 rounded group">
                                        <span className="text-[10px] text-indigo-300 font-mono">{b.name}</span>
                                        <button onClick={() => setBones(prev => prev.filter(x => x.id !== b.id))} className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setBones([])} className="flex-1 py-1.5 border border-red-500/20 text-red-400/80 hover:bg-red-500/10 rounded text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1">
                                <Trash2 size={10} /> Clear
                            </button>
                            <button onClick={exportRig} disabled={bones.length === 0} className="flex-[2] py-1.5 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded text-[9px] font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-indigo-300 flex items-center justify-center gap-1">
                                <Download size={10} /> Export Rig
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            <Canvas camera={{ position: [10, 5, 10], fov: 50 }}>
                <color attach="background" args={['#050510']} />
                <fog attach="fog" args={['#050510', 20, 100]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />


                <Physics debug={false}>
                    {/* Floor */}
                    <RigidBody type="fixed" position={[0, -0.5, 0]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[100, 1, 100]} />
                            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
                        </mesh>
                    </RigidBody>

                    {/* Dropped Entities */}
                    {entities.map(ent => (
                        <ManifestedObject 
                            key={ent.id} 
                            url={ent.url} 
                            onMeshClick={handleMeshClick} 
                        />
                    ))}
                </Physics>

                {/* AI Buddy Test Sandbox */}
                {showTestBuddy && (
                    <RiggedAIBuddy position={[0, 0, 0]} testScript={true} />
                )}

                {/* Render Bone Markers visually on top of everything */}
                {bones.map(b => (
                    <Sphere key={b.id} args={[0.1, 16, 16]} position={b.position}>
                        <meshBasicMaterial color="#a855f7" />
                        <Html position={[0, 0.2, 0]} center>
                            <div className="bg-black/80 px-2 py-0.5 rounded border border-purple-500/50 pointer-events-none">
                                <span className="text-[8px] font-mono text-purple-300 uppercase whitespace-nowrap">{b.name}</span>
                            </div>
                        </Html>
                    </Sphere>
                ))}

                <Grid 
                    infiniteGrid 
                    fadeDistance={50} 
                    sectionColor="#00ffff" 
                    cellColor="#00ffff" 
                    sectionThickness={1} 
                    cellThickness={0.5} 
                    position={[0, 0.01, 0]} 
                />
                
                <OrbitControls makeDefault />
            </Canvas>
        </div>
    );
};
