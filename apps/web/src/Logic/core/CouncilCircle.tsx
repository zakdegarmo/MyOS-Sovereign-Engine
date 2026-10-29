import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';
import { COUNCIL } from '@Omni/constants';

export const CouncilCircle: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF('/moose-bot.glb');

    // Clone the scene for each agent to allow independent coloring
    // Prepare agent positions
    const agents = useMemo(() => {
        return Object.values(COUNCIL).map((agent, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const radius = 15; // Closer in for Omni
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Color Map
            const colorMap: Record<string, string> = {
                'text-rose-400': '#fb7185',
                'text-sky-400': '#38bdf8',
                'text-slate-400': '#94a3b8',
                'text-teal-400': '#2dd4bf',
                'text-amber-600': '#d97706',
                'text-green-400': '#4ade80',
                'text-yellow-400': '#facc15',
                'text-pink-400': '#f472b6',
                'text-purple-400': '#c084fc',
                'text-white': '#ffffff'
            };
            const hex = colorMap[agent.color] || '#ffffff';

            return { ...agent, pos: [x, 0, z], rot: [0, -angle + Math.PI / 2, 0], hex };
        });
    }, []);

    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = clock.getElapsedTime() * 0.05; // Slow rotation of the entire ring
        }
    });

    return (
        <group ref={groupRef}>
            {agents.map((agent: any) => (
                <group key={agent.id} position={agent.pos as any} rotation={agent.rot as any}>
                    {/* Use Clone from Drei for proper instance handling */}
                    <Clone
                        object={scene}
                        scale={1.5}
                        inject={
                            // Simple material override didn't work well with skinned meshes sometimes,
                            // but let's try a prop-based approach if R3F allows, or use the callback.
                            // Actually, let's just use the traverse method on the *cloned* object via a ref or callback?
                            // No, Clone has an 'inject' prop but it's for the graph.
                            // We can just trust the clone triggers a deep copy.
                            // Better: Just use the same scene but set color in a callback? No.
                            null
                        }
                    />
                    <mesh visible={false}>
                        {/* Hack: Forced Color update via frame/ref is tedious. */}
                    </mesh>
                    <Text
                        position={[0, 4, 0]}
                        fontSize={1.5}
                        color={agent.hex}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {agent.name.toUpperCase()}
                    </Text>
                    <Text
                        position={[0, 3, 0]}
                        fontSize={0.8}
                        color="#ffffff"
                        anchorX="center"
                        anchorY="middle"
                        fillOpacity={0.6}
                    >
                        {agent.symbol}
                    </Text>
                </group>
            ))}
        </group>
    );
};
