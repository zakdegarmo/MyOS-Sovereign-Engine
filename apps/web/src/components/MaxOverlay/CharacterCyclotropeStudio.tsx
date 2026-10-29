import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DiegeticHeroCyclotrope } from '../Avatars/DiegeticHeroCyclotrope';
import { type MyOsSpriteEntry } from './MyOsSpriteExplorer';
import { Sparkles, Compass, Eye, Shield } from 'lucide-react';
import * as THREE from 'three';

interface CharacterCyclotropeStudioProps {
    onClose?: () => void;
}

export const CharacterCyclotropeStudio: React.FC<CharacterCyclotropeStudioProps> = ({ onClose }) => {
    const [sprites, setSprites] = useState<MyOsSpriteEntry[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        fetch('/textures/avatars/myos_sprites_manifest.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.sprites) {
                    setSprites(Object.values(data.sprites) as MyOsSpriteEntry[]);
                }
            })
            .catch(console.error);
    }, []);

    const cyclotropeItems = useMemo(() => {
        return sprites.map(s => ({
            id: s.id,
            label: s.name.split(' (')[0],
            sublabel: s.badge,
            icon: s.category === 'monsters' ? '💀' : s.category === 'golems' || s.id.includes('flesh') || s.id.includes('einstein') ? '🗿' : '🛡️',
            color: s.category === 'monsters' ? '#e879f9' : s.category === 'golems' || s.id.includes('flesh') || s.id.includes('einstein') ? '#fbbf24' : '#22d3ee'
        }));
    }, [sprites]);

    const activeSprite = sprites[selectedIndex];

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-serif text-lg shadow-inner">
                        ♀
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                                FSG://Self.Self.Resonance
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold uppercase">
                                3D Cyclotrope & Arcane Stage
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Orbital Ring Selector • 3D Pedestal Manifestation • Diegetic Spatial Carousel
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {activeSprite && (
                        <span className="text-xs font-mono font-bold text-cyan-300 bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                            {activeSprite.name}
                        </span>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            title="Close & Return to Self.Self"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* 3D Canvas Viewport */}
            <div className="flex-1 relative bg-gradient-to-b from-[#06060c] via-[#0d0d1a] to-[#040408]">
                <Canvas camera={{ position: [0, 2.0, 7.2], fov: 40 }}>
                    <ambientLight intensity={1.4} />
                    <directionalLight position={[5, 10, 5]} intensity={2.0} castShadow />
                    <pointLight position={[-5, 5, -5]} color="#00ffff" intensity={0.8} />
                    <pointLight position={[5, -2, 5]} color="#ff00ff" intensity={0.6} />

                    {/* Pedestal Floor */}
                    <mesh position={[0, -0.05, 0]}>
                        <cylinderGeometry args={[2.0, 2.2, 0.1, 64]} />
                        <meshStandardMaterial color="#101222" roughness={0.5} metalness={0.6} />
                    </mesh>

                    {/* Arcane Floor Rings */}
                    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.7, 0.75, 48]} />
                        <meshBasicMaterial color="#a855f7" transparent opacity={0.6} />
                    </mesh>
                    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[1.2, 1.25, 48]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
                    </mesh>

                    {/* Elevated Diegetic Hero Cyclotrope */}
                    <DiegeticHeroCyclotrope
                        items={cyclotropeItems}
                        selectedIndex={selectedIndex}
                        onSelectIndex={setSelectedIndex}
                        radius={2.0}
                        yOffset={2.5}
                        color="#c084fc"
                        ringLabel="8-WAY DIEGETIC CYCLOTROPE"
                        isActiveRing={true}
                    />

                    <OrbitControls
                        enablePan={false}
                        minDistance={3.0}
                        maxDistance={10.0}
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2}
                        target={[0, 1.6, 0]}
                    />
                </Canvas>
            </div>
        </div>
    );
};
