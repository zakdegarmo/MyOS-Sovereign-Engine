
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { CodexTerminal } from './CodexTerminal';
import { CODEX_REGISTRY } from './CodexExplorer';

// Flatten Registry for Graph Data
const NODES = CODEX_REGISTRY.flatMap(pillar => {
    const pNode = { id: pillar.id, type: 'pillar', group: pillar.id };
    const children = pillar.children?.map(c => ({ id: c.id, type: 'factor', group: pillar.id })) || [];
    return [pNode, ...children];
});

// Calculate Positions (Spherical Layout)
const POSITIONS = (() => {
    const map = new Map<string, THREE.Vector3>();
    const radius = 20;

    CODEX_REGISTRY.forEach((pillar, i) => {
        const phi = Math.acos(-1 + (2 * i) / 10);
        const theta = Math.sqrt(10 * Math.PI) * phi;
        const pVec = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
        map.set(pillar.id, pVec);

        pillar.children?.forEach((child, j) => {
            // Factors orbit their Pillar
            const childRadius = 5;
            const cPhi = Math.acos(-1 + (2 * j) / 10);
            const cTheta = Math.sqrt(10 * Math.PI) * cPhi;
            const offset = new THREE.Vector3().setFromSphericalCoords(childRadius, cPhi, cTheta);
            const cVec = pVec.clone().add(offset);
            map.set(child.id, cVec);
        });
    });
    return map;
})();


interface NodeMeshProps {
    id: string;
    type: 'pillar' | 'factor';
    position: THREE.Vector3;
    activeNode: string | null;
    onSelect: (id: string) => void;
}

const NodeMesh: React.FC<NodeMeshProps> = ({ id, type, position, activeNode, onSelect }) => {
    const isActive = activeNode === id;
    const isPillar = type === 'pillar';
    const groupRef = useRef<THREE.Group>(null);

    // Orient node to face outward from center (0,0,0)
    useEffect(() => {
        if (groupRef.current) {
            // Calculate outward direction
            const target = position.clone().multiplyScalar(2);
            groupRef.current.lookAt(target);
        }
    }, [position]);

    return (
        <group position={position} ref={groupRef}>
            <mesh onClick={(e) => { e.stopPropagation(); onSelect(id); }}>
                <sphereGeometry args={[isPillar ? 1 : 0.4, 16, 16]} />
                <meshStandardMaterial
                    color={isActive ? '#22d3ee' : isPillar ? '#ffffff' : '#64748b'}
                    emissive={isActive ? '#0e7490' : '#000000'}
                    emissiveIntensity={isActive ? 2 : 0}
                    wireframe={!isActive && !isPillar}
                />
            </mesh>

            {/* Label - Billboarded (No Transform), High Contrast */}
            {(isActive || isPillar) && (
                <Html position={[0, isPillar ? 1.5 : 0.8, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
                    <div className={`
                        px-2 py-1 rounded border font-bold text-xs whitespace-nowrap select-none
                        ${isActive
                            ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                            : 'bg-black text-white border-white/50 shadow-[0_0_10px_rgba(0,0,0,0.8)]'
                        }
                    `}>
                        {id}
                    </div>
                </Html>
            )}

            {/* Terminal Screen (Only on Active Node) */}
            {isActive && (
                <Html position={[2, 0, 0]} transform distanceFactor={5} occlude>
                    <CodexTerminal
                        nodeId={id}
                        isActive={isActive}
                    />
                </Html>
            )}
        </group>
    );
};

const CameraController: React.FC<{ targetNode: string | null }> = ({ targetNode }) => {
    const { camera, controls } = useThree();
    const [isFlying, setIsFlying] = useState(false);

    // Trigger flight when target changes
    useEffect(() => {
        if (targetNode) {
            setIsFlying(true);
        }
    }, [targetNode]);

    useFrame((_state, delta) => {
        if (!isFlying || !targetNode) return;

        const pos = POSITIONS.get(targetNode);
        if (pos) {
            // Fly to a position offset from the node
            // Since nodes look OUTWARD, we want to place camera OUTWARD from the node to see its face.
            const offset = pos.clone().normalize().multiplyScalar(15);
            const camPos = pos.clone().add(offset);

            // Move Camera
            camera.position.lerp(camPos, delta * 3);

            // Move Orbit Target to the Node
            // @ts-ignore
            controls?.target?.lerp(pos, delta * 3);
            // @ts-ignore
            controls?.update();

            // Check arrival to release control
            if (camera.position.distanceTo(camPos) < 0.5) {
                setIsFlying(false);
            }
        }
    });

    return null;
};

interface IconoclastGraphProps {
    activeNode: string | null;
    onSelectNode: (id: string) => void;
}

export const IconoclastGraph: React.FC<IconoclastGraphProps> = ({ activeNode, onSelectNode }) => {
    return (
        <Canvas camera={{ position: [0, 0, 40], fov: 50 }}>
            <color attach="background" args={['#020617']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group>
                {Array.from(POSITIONS.entries()).map(([id, pos]) => {
                    const node = NODES.find(n => n.id === id);
                    if (!node) return null;
                    return (
                        <NodeMesh
                            key={id}
                            id={id}
                            type={node.type as 'pillar' | 'factor'}
                            position={pos}
                            activeNode={activeNode}
                            onSelect={onSelectNode}
                        />
                    );
                })}
            </group>

            <CameraController targetNode={activeNode} />
            <OrbitControls makeDefault />
        </Canvas>
    );
};
