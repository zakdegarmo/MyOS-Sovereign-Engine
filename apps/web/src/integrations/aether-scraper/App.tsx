import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- IMPORT REAL MYOS INFRASTRUCTURE ---
import { useAvatarCompositor } from '../../hooks/useAvatarCompositor';

const Player = ({ position }: { position: [number, number, number] }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [pos, setPos] = useState(position);
    const [dir, setDir] = useState<'U' | 'D' | 'L' | 'R'>('D');
    const [isMoving, setIsMoving] = useState(false);
    const [animTime, setAnimTime] = useState(0);
    const lastAnimUpdate = useRef(0);

    // 1. USE THE REAL COMPOSITOR (No more UV math from me)
    const genome = useMemo(() => ({
        body: 'body/bodies/body_bodies_male.png',
        legs: 'legs/pants/legs_pants_male_brown.png',
        head: 'head/heads/head_heads_human_male.png'
    }), []);

    const textureRef = useRef<THREE.CanvasTexture>(null);
    const flagTextureUpdate = () => {
        if (textureRef.current) textureRef.current.needsUpdate = true;
    };

    const { canvas } = useAvatarCompositor(
        genome,
        isMoving ? 'walk' : 'idle',
        dir,
        animTime,
        { 
            resolution: 128, 
            inkStyle: 'bold',
            onRender: flagTextureUpdate 
        }
    );

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const step = 0.2;
            setIsMoving(true);
            if (e.code === 'KeyW') { setPos(p => [p[0], p[1], p[2] - step]); setDir('U'); }
            if (e.code === 'KeyS') { setPos(p => [p[0], p[1], p[2] + step]); setDir('D'); }
            if (e.code === 'KeyA') { setPos(p => [p[0] - step, p[1], p[2]]); setDir('L'); }
            if (e.code === 'KeyD') { setPos(p => [p[0] + step, p[1], p[2]]); setDir('R'); }
        };
        const stopKeys = () => setIsMoving(false);
        window.addEventListener('keydown', handleKeys);
        window.addEventListener('keyup', stopKeys);
        return () => {
            window.removeEventListener('keydown', handleKeys);
            window.removeEventListener('keyup', stopKeys);
        };
    }, []);

    useFrame((state, delta) => {
        // 2. REAL MYOS 24FPS QUANTIZATION
        lastAnimUpdate.current += delta;
        if (lastAnimUpdate.current >= 0.0416) {
            if (isMoving) {
                setAnimTime(prev => (prev + lastAnimUpdate.current * 1.5) % 1);
            } else {
                setAnimTime(0);
            }
            lastAnimUpdate.current = 0;
        }

        // 3. REAL MYOS BILLBOARDING
        if (meshRef.current) {
            meshRef.current.lookAt(state.camera.position.x, meshRef.current.position.y, state.camera.position.z);
        }
    });

    return (
        <group position={pos}>
            <mesh ref={meshRef} position={[0, 1, 0]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial transparent alphaTest={0.01} side={THREE.DoubleSide}>
                    <canvasTexture 
                        ref={textureRef}
                        attach="map" 
                        args={[canvas]} 
                        magFilter={THREE.NearestFilter} 
                        minFilter={THREE.NearestFilter} 
                    />
                </meshBasicMaterial>
            </mesh>
        </group>
    );
};

const Fragment = ({ position, onCollect }: { position: [number, number, number], onCollect: () => void }) => {
    return (
        <Float speed={3} rotationIntensity={2} floatIntensity={2}>
            <mesh position={position} onClick={onCollect}>
                <octahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={2} wireframe />
            </mesh>
        </Float>
    );
};

export const App: React.FC = () => {
    const [score, setScore] = useState(0);
    const [fragments, setFragments] = useState([
        { id: 1, pos: [3, 0.5, 3] as [number, number, number] },
        { id: 2, pos: [-4, 0.5, -2] as [number, number, number] },
        { id: 3, pos: [2, 0.5, -5] as [number, number, number] },
    ]);

    const collect = (id: number) => {
        setFragments(prev => prev.filter(f => f.id !== id));
        setScore(s => s + 1);
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#000', position: 'fixed', top: 0, left: 0 }}>
            {/* OFFICIAL HUD STYLE */}
            <div style={{ 
                position: 'fixed', top: '25px', left: '25px', zIndex: 10000,
                color: '#00ffcc', fontFamily: 'monospace', fontSize: '20px',
                background: 'rgba(0,0,0,0.8)', padding: '20px', border: '2px solid #00ffcc',
                boxShadow: '0 0 15px #00ffcc', pointerEvents: 'none'
            }}>
                ⚹.🜄.🜋: AETHER SCRAPER ENGINE <br/>
                STABILIZED: {score} / 3
            </div>

            <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
                <Suspense fallback={null}>
                    <OrbitControls makeDefault />

                    <ambientLight intensity={0.4} />
                    <Grid infiniteGrid fadeDistance={25} cellSize={1} sectionSize={5} cellColor="#002222" sectionColor="#00ffcc" />
                    
                    <Player position={[0, 0, 0]} />

                    {fragments.map(f => (
                        <Fragment key={f.id} position={f.pos} onCollect={() => collect(f.id)} />
                    ))}
                </Suspense>
            </Canvas>
        </div>
    );
};

export default App;
