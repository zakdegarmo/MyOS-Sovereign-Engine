import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Float, ContactShadows } from '@react-three/drei';
import { Settings2, Play, MousePointer2 } from 'lucide-react';

interface ChassisPartProps {
    type: 'box' | 'cylinder' | 'sphere';
    position: [number, number, number];
    scale: [number, number, number];
    color: string;
    opacity?: number;
}

const Part: React.FC<ChassisPartProps> = ({ type, position, scale, color, opacity = 1 }) => {
    return (
        <mesh position={position} scale={scale}>
            {type === 'box' && <boxGeometry />}
            {type === 'cylinder' && <cylinderGeometry args={[1, 1, 1, 32]} />}
            {type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
            <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.2} 
                transparent={opacity < 1} 
                opacity={opacity}
                roughness={0.1}
                metalness={0.8}
            />
        </mesh>
    );
};

interface PrimitiveChassisProps {
    genome?: any;
    onClose?: () => void;
}

/**
 * PRIMITIVE CHASSIS (Path 1): Structural Avatars
 * 
 * Instead of 2D pixel layers, we're building a 3D skeletal rig using low-poly primitives.
 * This is efficient for mobile/web and provides a 'volumetric' grounding for our AI.
 * 
 * TUTOR NOTE: Notice how we translate the 10-Pillar Genome into specific 3D slots (Head, Torso, Limbs).
 */
export const PrimitiveChassis: React.FC<PrimitiveChassisProps> = ({ genome, onClose }) => {
    // Current Active Genome (can be overridden by prop or randomized internally)
    const [activeGenome, setActiveGenome] = React.useState<any>(null);

    // Initial and Randomize Logic: Translating 10 Pillars to 3D slots
    const defaultGenome = useMemo(() => ({
        head: { type: 'box', color: '#ffcc00', scale: [1.2, 1.2, 1.2] },
        torso: { type: 'box', color: '#333333', scale: [2, 3, 1] },
        armL: { type: 'cylinder', color: '#555555', scale: [0.3, 2, 0.3], pos: [-1.2, 0.5, 0] },
        armR: { type: 'cylinder', color: '#555555', scale: [0.3, 2, 0.3], pos: [1.2, 0.5, 0] },
        legL: { type: 'cylinder', color: '#222222', scale: [0.4, 2, 0.4], pos: [-0.6, -2.5, 0] },
        legR: { type: 'cylinder', color: '#222222', scale: [0.4, 2, 0.4], pos: [0.6, -2.5, 0] },
        ...genome
    }), [genome]);

    const currentGenome = activeGenome || defaultGenome;

    const handleRandomize = React.useCallback(() => {
        const types = ['box', 'cylinder', 'sphere'];
        const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        const randomScale = (min: number, max: number): [number, number, number] => [
            min + Math.random() * (max - min),
            min + Math.random() * (max - min),
            min + Math.random() * (max - min)
        ];

        setActiveGenome({
            head: { type: types[Math.floor(Math.random() * types.length)], color: randomColor(), scale: randomScale(0.8, 1.5) },
            torso: { type: types[Math.floor(Math.random() * types.length)], color: randomColor(), scale: randomScale(1.5, 3.5) },
            armL: { type: types[Math.floor(Math.random() * types.length)], color: randomColor(), scale: [0.3, 2, 0.3], pos: [-1.2, 0.5, 0] },
            armR: { type: types[Math.floor(Math.random() * types.length)], color: randomColor(), scale: [0.3, 2, 0.3], pos: [1.2, 0.5, 0] },
            legL: { type: types[Math.floor(Math.random() * types.length)], color: randomColor(), scale: [0.4, 2, 0.4], pos: [-0.6, -2.5, 0] },
            legR: { type: types[Math.floor(Math.random() * types.length)], color: randomColor(), scale: [0.4, 2, 0.4], pos: [0.6, -2.5, 0] }
        });
    }, []);

    React.useEffect(() => {
        const handler = () => handleRandomize();
        window.addEventListener('myos_spritelab_randomize', handler);
        return () => window.removeEventListener('myos_spritelab_randomize', handler);
    }, [handleRandomize]);

    return (
        <div className="w-full h-full flex flex-col bg-black/40 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-3xl shadow-2xl relative group">
            {/* 3D Viewport */}
            <div className="flex-1 relative cursor-crosshair">
                <Canvas shadows gl={{ antialias: true, alpha: true }}>
                    <PerspectiveCamera makeDefault position={[5, 5, 10]} fov={40} />
                    <OrbitControls makeDefault enablePan={false} maxPolarAngle={Math.PI / 1.8} />
                    
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                    <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                        <group position={[0, 1.5, 0]}>
                            {/* Head */}
                                <Part type={currentGenome.head.type as any} position={[0, 2.2, 0]} scale={currentGenome.head.scale as any} color={currentGenome.head.color} />
                            
                            {/* Torso */}
                            <Part type={currentGenome.torso.type as any} position={[0, 0, 0]} scale={currentGenome.torso.scale as any} color={currentGenome.torso.color} />
                            
                            {/* Arms */}
                            <Part type={currentGenome.armL.type as any} position={currentGenome.armL.pos as any} scale={currentGenome.armL.scale as any} color={currentGenome.armL.color} />
                            <Part type={currentGenome.armR.type as any} position={currentGenome.armR.pos as any} scale={currentGenome.armR.scale as any} color={currentGenome.armR.color} />
                            
                            {/* Legs */}
                            <Part type={currentGenome.legL.type as any} position={currentGenome.legL.pos as any} scale={currentGenome.legL.scale as any} color={currentGenome.legL.color} />
                            <Part type={currentGenome.legR.type as any} position={currentGenome.legR.pos as any} scale={currentGenome.legR.scale as any} color={currentGenome.legR.color} />
                        </group>
                    </Float>

                    <Grid 
                        infiniteGrid 
                        fadeDistance={50} 
                        fadeStrength={5} 
                        cellSize={1} 
                        sectionSize={5} 
                        sectionColor="#ffffff11" 
                        cellColor="#ffffff05" 
                    />
                    <ContactShadows opacity={0.4} scale={10} blur={2.4} far={4.5} />
                </Canvas>

                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                    <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] text-white/60 font-mono tracking-widest flex items-center gap-2 backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        PRIMITIVE CHASSIS v1.0
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95">
                        <MousePointer2 size={18} />
                    </button>
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95">
                         <Play size={18} />
                    </button>
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="h-[240px] border-t border-white/10 flex flex-col p-4 bg-white/5 shrink-0">
                 <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xs font-bold font-display tracking-widest text-white/60 uppercase">Chassis Geometry</h3>
                     <Settings2 size={14} className="text-white/20" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 flex-1">
                     <div className="space-y-3">
                         <div className="space-y-1">
                             <div className="flex justify-between text-[9px] font-mono text-white/30 truncate">
                                 <span>CORE_SKELETON</span>
                                 <span>BOX_PRIM</span>
                             </div>
                             <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-cyan-500 w-[80%] shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                             </div>
                         </div>
                         <div className="space-y-1">
                             <div className="flex justify-between text-[9px] font-mono text-white/30">
                                 <span>JOINT_RIGIDITY</span>
                                 <span>HYBRID</span>
                             </div>
                             <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-amber-500 w-[60%] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2 h-fit">
                         {['head', 'torso', 'arm', 'leg'].map(part => (
                             <button key={part} className="px-2 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-center group/btn">
                                 <div className="text-[10px] font-bold text-white/40 group-hover/btn:text-white transition-colors capitalize">{part}</div>
                                 <div className="text-[8px] font-mono text-white/20 mt-1 uppercase tracking-tighter">config.json</div>
                             </button>
                         ))}
                     </div>
                 </div>
            </div>
        </div>
    );
};
