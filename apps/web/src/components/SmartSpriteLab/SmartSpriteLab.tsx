import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { AutonomousSprite } from '../../Unity/components/entities/AutonomousSprite';



export const SmartSpriteLab: React.FC = () => {
    const [manifest, setManifest] = useState<any>(null);
    const crystalPos: [number, number, number] = [3, 0.5, -2]; // Target for the AI

    useEffect(() => {
        fetch('/textures/avatars/lpc/mephit_manifest.json')
            .then(res => res.json())
            .then(data => setManifest(data))
            .catch(err => console.error("Failed to load manifest:", err));
    }, []);

    return (
        <div className="w-full h-full bg-black/90 flex flex-col items-center justify-center relative font-mono text-cyan-400">
            
            <div className="absolute top-4 left-4 z-10 border border-cyan-400/30 p-4 bg-black/50 backdrop-blur-md rounded">
                <h1 className="text-xl font-bold mb-2">SmartSprite Test Lab</h1>
                <p className="text-sm text-cyan-400/70 max-w-sm">
                    Isolated sandbox for the Instanced Cognitive Chassis. 
                    The entity below is running a Web Worker brain, fed with a randomized LPC genome and the Fractal Ontology.
                </p>
                <p className="text-sm text-amber-400 mt-2 font-bold">
                    Objective: Navigate to the Energy Crystal.
                </p>
                {!manifest && <p className="text-amber-400 mt-2">Loading Manifest...</p>}
            </div>

            <div className="w-full h-full relative">
                <Canvas shadows gl={{ antialias: true, alpha: true }}>
                    <PerspectiveCamera makeDefault position={[0, 3, 10]} fov={40} />
                    <OrbitControls makeDefault enablePan={true} />
                    
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                    
                    <Grid infiniteGrid fadeDistance={50} sectionColor="#22d3ee" cellColor="#10b981" />
                    
                    {manifest && (
                        <AutonomousSprite 
                            position={[0, 1, 0]} 
                            manifest={manifest} 
                            entities={[]}
                        />
                    )}
                </Canvas>
            </div>
        </div>
    );
};
