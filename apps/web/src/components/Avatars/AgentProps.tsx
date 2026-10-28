import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface AgentPropsProps {
    type: 'pc' | 'screen' | 'none';
    active: boolean;
    agentPosition: [number, number, number];
}

export function AgentProps({ type, active, agentPosition }: AgentPropsProps) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current && active) {
            // Float slightly near the agent
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1.2;
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.2;
        }
    });

    if (!active || type === 'none') return null;

    return (
        <group ref={groupRef} position={[agentPosition[0] + 0.8, 1.2, agentPosition[2] + 0.2]}>
            {type === 'pc' && (
                <mesh>
                    <boxGeometry args={[0.4, 0.3, 0.05]} />
                    <meshStandardMaterial color="#333" />
                    {/* The "Screen" */}
                    <mesh position={[0, 0, 0.03]}>
                        <planeGeometry args={[0.35, 0.25]} />
                        <meshBasicMaterial color="#001100" />
                        <Html distanceFactor={1.5} transform position={[0, 0, 0.01]}>
                            <div style={{
                                width: '120px',
                                height: '80px',
                                background: '#000',
                                border: '1px solid #0f0',
                                padding: '4px',
                                fontFamily: 'monospace',
                                fontSize: '6px',
                                color: '#0f0',
                                overflow: 'hidden',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}>
                                <div style={{ animation: 'blink 1s infinite' }}>
                                    &gt; INITIALIZING AGENT SKILL...<br />
                                    &gt; ACCESSING WEB NEXUS...<br />
                                    &gt; SEARCHING SEMANTIC VOID...<br />
                                    &gt; [OK]
                                </div>
                                <style>{`
                                    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                                `}</style>
                            </div>
                        </Html>
                    </mesh>
                    {/* PC Base */}
                    <mesh position={[0, -0.2, 0]}>
                        <boxGeometry args={[0.3, 0.05, 0.2]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                </mesh>
            )}
        </group>
    );
}
