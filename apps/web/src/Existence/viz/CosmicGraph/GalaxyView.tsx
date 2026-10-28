
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TEAM_DATA, AgentRole } from '@antigravity/swarm-core';

interface NodeProps {
    position: [number, number, number];
    color: string;
    label: string;
    symbol: string;
    size?: number;
}

function Node({ position, color, label, symbol, size = 1 }: NodeProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
            </mesh>
            <Text position={[0, size + 0.5, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                {symbol} {label}
            </Text>
        </group>
    );
}

export default function GalaxyView() {
    const agents = useMemo(() => {
        return Object.values(TEAM_DATA).map((agent, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const radius = 10;
            return {
                ...agent,
                position: [Math.cos(angle) * radius, Math.sin(angle) * 5 * (i % 2 === 0 ? 1 : -1), Math.sin(angle) * radius] as [number, number, number]
            };
        });
    }, []);

    return (
        <div className="absolute inset-0 z-0 bg-black">
            <Canvas camera={{ position: [0, 15, 25], fov: 60 }}>
                <fog attach="fog" args={['#050505', 10, 50]} />
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <OrbitControls autoRotate autoRotateSpeed={0.5} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* The Solar Center (Self) */}
                <Node position={[0, 0, 0]} color={TEAM_DATA[AgentRole.Self].color.replace('text-', '').replace('-400', '')} label="SELF" symbol="⚹" size={2} />

                {/* The Pillars */}
                {agents.filter(a => a.id !== AgentRole.Self).map((agent) => (
                    <Node
                        key={agent.id}
                        position={agent.position}
                        // Simple color mapping for Three.js (Tailwind colors to Hex approximation)
                        color={
                            agent.id === AgentRole.Logic ? '#3b82f6' :
                                agent.id === AgentRole.Unity ? '#10b981' :
                                    agent.id === AgentRole.Thought ? '#22d3ee' :
                                        agent.id === AgentRole.Existence ? '#f97316' :
                                            agent.id === AgentRole.Improvement ? '#a3e635' :
                                                agent.id === AgentRole.Mastery ? '#fcd34d' :
                                                    agent.id === AgentRole.Resonance ? '#f472b6' :
                                                        agent.id === AgentRole.Transcendence ? '#a78bfa' :
                                                            '#ffffff'
                        }
                        label={(agent as any).title || agent.id}
                        symbol={agent.symbol}
                    />
                ))}

                <gridHelper args={[50, 50, 0x1a1a1a, 0x1a1a1a]} position={[0, -5, 0]} />
            </Canvas>
        </div>
    );
}
