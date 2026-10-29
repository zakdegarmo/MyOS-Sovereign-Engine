// apps/web/src/cartridges/Glyphrider/editor/CycleParkWorld.tsx
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCycleParkStore, type PlacedObstacle } from './CycleParkStore';
import { SkateparkObstacleMesh } from './SkateparkObstacles';

export interface CycleParkWorldProps {
    isActive?: boolean;
    playerPosition?: [number, number, number] | THREE.Vector3;
}

export const CycleParkWorld: React.FC<CycleParkWorldProps> = ({ isActive = true }) => {
    const {
        mode,
        toggleMode,
        transformMode,
        setTransformMode,
        snapToGrid,
        gridSize,
        obstacles,
        selectedId,
        selectObstacle,
        updateObstacle,
        removeObstacle,
        duplicateObstacle,
        undo,
        redo
    } = useCycleParkStore();

    const transformRef = useRef<any>(null);
    const selectedGroupRef = useRef<THREE.Group>(null);

    // Global keyboard hotkeys for level editing
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = (document.activeElement?.tagName || '').toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea') return;

            if (e.code === 'Tab') {
                e.preventDefault();
                toggleMode();
                return;
            }

            // Shortcuts active only in Edit Mode
            if (mode === 'edit') {
                if (e.code === 'KeyG' || e.code === 'KeyT') {
                    setTransformMode('translate');
                } else if (e.code === 'KeyR') {
                    setTransformMode('rotate');
                } else if (e.code === 'KeyS' && !e.ctrlKey) {
                    setTransformMode('scale');
                } else if ((e.code === 'Delete' || e.code === 'Backspace') && selectedId) {
                    removeObstacle(selectedId);
                } else if (e.ctrlKey && e.code === 'KeyD' && selectedId) {
                    e.preventDefault();
                    duplicateObstacle(selectedId);
                } else if (e.ctrlKey && e.code === 'KeyZ') {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                } else if (e.code === 'Escape') {
                    selectObstacle(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, mode, selectedId, toggleMode, setTransformMode, removeObstacle, duplicateObstacle, undo, redo, selectObstacle]);

    // Handle gizmo change events
    const handleTransformChange = () => {
        if (!selectedId || !selectedGroupRef.current) return;
        const obj = selectedGroupRef.current;
        updateObstacle(selectedId, {
            position: [obj.position.x, obj.position.y, obj.position.z],
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z]
        });
    };

    const selectedObstacle = obstacles.find(o => o.id === selectedId);

    // Sync selectedGroupRef position when selectedObstacle changes externally
    useEffect(() => {
        if (selectedGroupRef.current && selectedObstacle) {
            selectedGroupRef.current.position.set(...selectedObstacle.position);
            selectedGroupRef.current.rotation.set(...selectedObstacle.rotation);
            selectedGroupRef.current.scale.set(...selectedObstacle.scale);
        }
    }, [selectedObstacle?.id, selectedObstacle?.position, selectedObstacle?.rotation, selectedObstacle?.scale]);

    if (!isActive) return null;

    return (
        <group>
            {/* ========================================================================= */}
            {/* 1. SKATEPARK FOUNDATION & ARENA FLOOR SLAB                                */}
            {/* ========================================================================= */}
            
            {/* Master Concrete Skatepark Slab (140m x 140m) */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
                <boxGeometry args={[140, 0.1, 140]} />
                <meshStandardMaterial
                    color="#1e293b"
                    roughness={0.78}
                    metalness={0.12}
                />
            </mesh>

            {/* Inner Painted Skate Zone (80m x 80m) */}
            <mesh position={[0, 0.002, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial
                    color="#334155"
                    roughness={0.65}
                    metalness={0.08}
                />
            </mesh>

            {/* Precision Soundstage Grid Lines */}
            <gridHelper
                args={[120, 60, '#38bdf8', '#475569']}
                position={[0, 0.006, 0]}
            />

            {/* Yellow / Black Hazard Border Tape */}
            {[-40, 40].map((coord, idx) => (
                <React.Fragment key={`border_x_${idx}`}>
                    <mesh position={[coord, 0.01, 0]}>
                        <boxGeometry args={[0.6, 0.01, 80]} />
                        <meshStandardMaterial color="#facc15" roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.01, coord]}>
                        <boxGeometry args={[80, 0.01, 0.6]} />
                        <meshStandardMaterial color="#facc15" roughness={0.4} />
                    </mesh>
                </React.Fragment>
            ))}

            {/* Perimeter Safety Barriers (Heavy Galvanized Railings) */}
            {[-40.5, 40.5].map((pos, idx) => (
                <group key={`barrier_${idx}`}>
                    <mesh position={[pos, 0.8, 0]}>
                        <boxGeometry args={[0.3, 1.6, 82]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.8, pos]}>
                        <boxGeometry args={[82, 1.6, 0.3]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
                    </mesh>
                </group>
            ))}

            {/* ========================================================================= */}
            {/* 2. PLACED OBSTACLES                                                      */}
            {/* ========================================================================= */}
            <group>
                {obstacles.map((obs) => {
                    const isSelected = obs.id === selectedId;

                    // If selected in edit mode, it will be controlled by the TransformControls wrapper
                    if (isSelected && mode === 'edit') {
                        return null;
                    }

                    return (
                        <SkateparkObstacleMesh
                            key={obs.id}
                            id={obs.id}
                            type={obs.type}
                            position={obs.position}
                            rotation={obs.rotation}
                            scale={obs.scale}
                            materialKey={obs.materialKey}
                            isSelected={false}
                            onClick={() => {
                                if (mode === 'edit') {
                                    selectObstacle(obs.id);
                                }
                            }}
                        />
                    );
                })}
            </group>

            {/* ========================================================================= */}
            {/* 3. ACTIVE TRANSFORM CONTROLS FOR SELECTED OBSTACLE                       */}
            {/* ========================================================================= */}
            {mode === 'edit' && selectedObstacle && (
                <group>
                    {/* Ghost/Proxy Group that TransformControls binds to */}
                    <group
                        ref={selectedGroupRef}
                        position={selectedObstacle.position}
                        rotation={selectedObstacle.rotation}
                        scale={selectedObstacle.scale}
                    >
                        <SkateparkObstacleMesh
                            id={selectedObstacle.id}
                            type={selectedObstacle.type}
                            position={[0, 0, 0]}
                            rotation={[0, 0, 0]}
                            scale={[1, 1, 1]}
                            materialKey={selectedObstacle.materialKey}
                            isSelected={true}
                        />
                    </group>

                    <TransformControls
                        ref={transformRef}
                        object={selectedGroupRef as any}
                        mode={transformMode}
                        translationSnap={snapToGrid ? gridSize : undefined}
                        rotationSnap={snapToGrid ? Math.PI / 12 : undefined}
                        scaleSnap={snapToGrid ? 0.25 : undefined}
                        onObjectChange={handleTransformChange}
                    />
                </group>
            )}

            {/* ========================================================================= */}
            {/* 4. SOUNDSTAGE LIGHTING RIG                                               */}
            {/* ========================================================================= */}
            {/* Crisp Ambient Studio Fill */}
            <ambientLight intensity={0.9} color="#cbd5e1" />

            {/* Overhead Sun / Stadium Flood Light */}
            <directionalLight
                position={[25, 45, 25]}
                intensity={2.2}
                color="#ffffff"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-60}
                shadow-camera-right={60}
                shadow-camera-top={60}
                shadow-camera-bottom={-60}
                shadow-camera-near={10}
                shadow-camera-far={120}
            />

            {/* Cool Fill Light */}
            <directionalLight position={[-30, 25, -30]} intensity={1.2} color="#38bdf8" />

            {/* Warm Stadium Accent Rim */}
            <directionalLight position={[0, 30, -45]} intensity={1.0} color="#f59e0b" />

            {/* 4 Corner Flood Towers */}
            {[
                [-38, -38],
                [38, -38],
                [-38, 38],
                [38, 38]
            ].map(([tx, tz], idx) => (
                <group key={`tower_${idx}`} position={[tx, 0, tz]}>
                    {/* Truss Pole */}
                    <mesh position={[0, 8, 0]}>
                        <cylinderGeometry args={[0.35, 0.45, 16, 8]} />
                        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.8} />
                    </mesh>
                    {/* Flood Fixture Box */}
                    <mesh position={[0, 16, 0]}>
                        <boxGeometry args={[1.6, 1.0, 1.2]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} />
                    </mesh>
                    {/* Flood Lamp */}
                    <pointLight position={[0, 15.5, 0]} color="#f8fafc" intensity={80.0} distance={45} decay={2} />
                </group>
            ))}
        </group>
    );
};

export default CycleParkWorld;
