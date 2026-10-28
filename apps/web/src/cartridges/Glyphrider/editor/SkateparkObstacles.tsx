// apps/web/src/cartridges/Glyphrider/editor/SkateparkObstacles.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { MaterialKey, ObstacleType } from './CycleParkStore';
import { PolyhedralSpriteBillboard } from './PolyhedralSpriteBillboard';

export interface ObstacleMeshProps {
    id: string;
    type: ObstacleType;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    materialKey: MaterialKey;
    isSelected?: boolean;
    onClick?: () => void;
}

/**
 * Procedural PBR Material Generator for Skatepark Surfaces
 */
export function getSkateparkMaterial(key: MaterialKey): THREE.Material {
    switch (key) {
        case 'plywood':
            return new THREE.MeshStandardMaterial({
                color: '#d4a373',
                roughness: 0.65,
                metalness: 0.05
            });
        case 'galvanized_steel':
            return new THREE.MeshStandardMaterial({
                color: '#94a3b8',
                roughness: 0.28,
                metalness: 0.85
            });
        case 'rusty_iron':
            return new THREE.MeshStandardMaterial({
                color: '#7c3a21',
                roughness: 0.88,
                metalness: 0.35
            });
        case 'concrete':
            return new THREE.MeshStandardMaterial({
                color: '#cbd5e1',
                roughness: 0.82,
                metalness: 0.1
            });
        case 'neon_cyan':
            return new THREE.MeshStandardMaterial({
                color: '#06b6d4',
                roughness: 0.2,
                metalness: 0.5,
                emissive: new THREE.Color('#06b6d4'),
                emissiveIntensity: 0.8
            });
        case 'toxic_magenta':
            return new THREE.MeshStandardMaterial({
                color: '#ec4899',
                roughness: 0.2,
                metalness: 0.5,
                emissive: new THREE.Color('#ec4899'),
                emissiveIntensity: 0.8
            });
        default:
            return new THREE.MeshStandardMaterial({ color: '#cccccc' });
    }
}

const COPING_MAT = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.18,
    metalness: 0.95
});

/**
 * Kicker Ramp: Scaled for 3m unicycle (Width 8m, Length 14m, Height 4.5m)
 * Slope rises from Z = -7 (Y = 0) to Z = +7 (Y = 4.5)
 */
export const KickerRamp: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ material, isSelected }) => {
    const W = 8.0;
    const L = 14.0;
    const H = 4.5;
    const halfW = W / 2;
    const halfL = L / 2;

    const geometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        // 6 Vertices defining the wedge
        // 0: front bottom-left, 1: front bottom-right, 2: back takeoff-right, 3: back takeoff-left
        // 4: back bottom-left,  5: back bottom-right
        const positions = new Float32Array([
            // Slope Quad (0, 1, 2, 3)
            -halfW, 0, -halfL,
             halfW, 0, -halfL,
             halfW, H,  halfL,
            -halfW, H,  halfL,

            // Back Quad (3, 2, 5, 4)
            -halfW, H,  halfL,
             halfW, H,  halfL,
             halfW, 0,  halfL,
            -halfW, 0,  halfL,

            // Left Triangle (0, 3, 4)
            -halfW, 0, -halfL,
            -halfW, H,  halfL,
            -halfW, 0,  halfL,

            // Right Triangle (1, 5, 2)
             halfW, 0, -halfL,
             halfW, 0,  halfL,
             halfW, H,  halfL,

            // Bottom Quad (0, 4, 5, 1)
            -halfW, 0, -halfL,
            -halfW, 0,  halfL,
             halfW, 0,  halfL,
             halfW, 0, -halfL
        ]);

        const indices = [
            0, 1, 2,  0, 2, 3,       // Slope
            4, 5, 6,  4, 6, 7,       // Back
            8, 9, 10,                // Left
            11, 12, 13,              // Right
            14, 15, 16,  14, 16, 17  // Bottom
        ];

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        return geom;
    }, [halfW, halfL, H]);

    return (
        <group>
            <mesh geometry={geometry} material={material} castShadow receiveShadow />
            {/* Takeoff Steel Coping Bar */}
            <mesh position={[0, H, halfL]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, W, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            {isSelected && (
                <lineSegments position={[0, H / 2, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(W + 0.2, H + 0.2, L + 0.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Quarter-Pipe: Scaled for 3m unicycle (Width 16m, Run 10m, Deck 3m, Height 6.5m)
 * Curve from Z = -5 (Y = 0) to Z = +5 (Y = 6.5), Deck to Z = +8
 */
export const QuarterPipe: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ material, isSelected }) => {
    const W = 16.0;
    const runL = 10.0;
    const deckL = 3.0;
    const H = 6.5;
    const halfW = W / 2;
    const halfRun = runL / 2;

    const geometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const segments = 24;
        const positions: number[] = [];
        const indices: number[] = [];

        // Grid of vertices across X (-halfW to halfW) and Z (-halfRun to halfRun + deckL)
        const xSteps = 8;
        const zSteps = segments + 4;

        for (let j = 0; j <= zSteps; j++) {
            let lz = -halfRun;
            let ly = 0;

            if (j <= segments) {
                const t = j / segments;
                lz = -halfRun + runL * t;
                ly = H * (1.0 - Math.cos(t * Math.PI * 0.5));
            } else {
                const dt = (j - segments) / 4.0;
                lz = halfRun + deckL * dt;
                ly = H;
            }

            for (let i = 0; i <= xSteps; i++) {
                const lx = -halfW + W * (i / xSteps);
                positions.push(lx, ly, lz);
            }
        }

        const cols = xSteps + 1;
        for (let j = 0; j < zSteps; j++) {
            for (let i = 0; i < xSteps; i++) {
                const a = j * cols + i;
                const b = a + 1;
                const c = (j + 1) * cols + i;
                const d = c + 1;
                indices.push(a, b, d, a, d, c);
            }
        }

        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        return geom;
    }, [W, halfW, runL, halfRun, deckL, H]);

    return (
        <group>
            <mesh geometry={geometry} material={material} castShadow receiveShadow />
            {/* Top Coping Rail */}
            <mesh position={[0, H, halfRun]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, W, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            {/* Back Deck Support Wall */}
            <mesh position={[0, H / 2, halfRun + deckL]}>
                <boxGeometry args={[W, H, 0.2]} />
                <primitive object={material} attach="material" />
            </mesh>
            {isSelected && (
                <lineSegments position={[0, H / 2, (runL + deckL) / 2 - halfRun]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(W + 0.2, H + 0.2, runL + deckL + 0.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Pro Half-Pipe: Scaled for 3m unicycle (Width 18m, Channel 6m, Run 10m each side, Deck 3m, Height 7.0m)
 * Total Length = 32m
 */
export const HalfPipe: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ material, isSelected }) => {
    const W = 18.0;
    const C = 6.0;
    const runL = 10.0;
    const deckL = 3.0;
    const H = 7.0;
    const halfW = W / 2;
    const halfC = C / 2;

    const geometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const segments = 20;
        const positions: number[] = [];
        const indices: number[] = [];

        // Build continuous profile from South Deck to North Deck
        const zProfile: Array<{ z: number; y: number }> = [];

        // 1. South Deck
        zProfile.push({ z: -halfC - runL - deckL, y: H });
        zProfile.push({ z: -halfC - runL, y: H });

        // 2. South Transition (curving down to channel)
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            zProfile.push({
                z: -halfC - runL * t,
                y: H * (1.0 - Math.cos(t * Math.PI * 0.5))
            });
        }

        // 3. Flat Center Channel
        zProfile.push({ z: halfC, y: 0 });

        // 4. North Transition (curving up from channel)
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            zProfile.push({
                z: halfC + runL * t,
                y: H * (1.0 - Math.cos(t * Math.PI * 0.5))
            });
        }

        // 5. North Deck
        zProfile.push({ z: halfC + runL + deckL, y: H });

        const xSteps = 8;
        const totalZ = zProfile.length;

        for (let j = 0; j < totalZ; j++) {
            const { z, y } = zProfile[j];
            for (let i = 0; i <= xSteps; i++) {
                const lx = -halfW + W * (i / xSteps);
                positions.push(lx, y, z);
            }
        }

        const cols = xSteps + 1;
        for (let j = 0; j < totalZ - 1; j++) {
            for (let i = 0; i < xSteps; i++) {
                const a = j * cols + i;
                const b = a + 1;
                const c = (j + 1) * cols + i;
                const d = c + 1;
                indices.push(a, b, d, a, d, c);
            }
        }

        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        return geom;
    }, [W, halfW, C, halfC, runL, deckL, H]);

    return (
        <group>
            <mesh geometry={geometry} material={material} castShadow receiveShadow />
            {/* North Coping Tube */}
            <mesh position={[0, H, halfC + runL]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, W, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            {/* South Coping Tube */}
            <mesh position={[0, H, -halfC - runL]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.1, W, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            {/* Safety Backwalls */}
            <mesh position={[0, H / 2, halfC + runL + deckL]}>
                <boxGeometry args={[W, H, 0.2]} />
                <primitive object={material} attach="material" />
            </mesh>
            <mesh position={[0, H / 2, -halfC - runL - deckL]}>
                <boxGeometry args={[W, H, 0.2]} />
                <primitive object={material} attach="material" />
            </mesh>
            {isSelected && (
                <lineSegments position={[0, H / 2, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(W + 0.2, H + 0.2, (halfC + runL + deckL) * 2 + 0.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Spine Transfer: Back-to-back quarter-pipes joined at the crest (Width 16m, Run 8m each side, Height 6.0m)
 */
export const SpineTransfer: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ material, isSelected }) => {
    const W = 16.0;
    const runL = 8.0;
    const H = 6.0;
    const halfW = W / 2;

    const geometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const segments = 24;
        const positions: number[] = [];
        const indices: number[] = [];

        const xSteps = 8;
        const zSteps = segments * 2;

        for (let j = 0; j <= zSteps; j++) {
            const t = j / zSteps; // 0 to 1
            const lz = -runL + runL * 2 * t;
            const curveFactor = 1.0 - Math.abs(lz) / runL;
            const ly = H * Math.sin(Math.max(0, curveFactor) * Math.PI * 0.5);

            for (let i = 0; i <= xSteps; i++) {
                const lx = -halfW + W * (i / xSteps);
                positions.push(lx, ly, lz);
            }
        }

        const cols = xSteps + 1;
        for (let j = 0; j < zSteps; j++) {
            for (let i = 0; i < xSteps; i++) {
                const a = j * cols + i;
                const b = a + 1;
                const c = (j + 1) * cols + i;
                const d = c + 1;
                indices.push(a, b, d, a, d, c);
            }
        }

        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();
        return geom;
    }, [W, halfW, runL, H]);

    return (
        <group>
            <mesh geometry={geometry} material={material} castShadow receiveShadow />
            {/* Crest Shared Coping Bar */}
            <mesh position={[0, H, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, W, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            {isSelected && (
                <lineSegments position={[0, H / 2, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(W + 0.2, H + 0.2, runL * 2 + 0.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Straight Grind Rail: Scaled for 3m unicycle (Height 1.4m, Length 20m, Heavy 0.16m diameter tube)
 */
export const GrindRailStraight: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ material, isSelected }) => {
    const L = 20.0;
    const H = 1.4;

    return (
        <group>
            {/* Main Rail Pipe */}
            <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, L, 16]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* End Caps */}
            <mesh position={[0, H, -L / 2]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <primitive object={material} attach="material" />
            </mesh>
            <mesh position={[0, H, L / 2]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* Stanchion legs */}
            {[-8, -4, 0, 4, 8].map((z, idx) => (
                <group key={`stanchion_${idx}`} position={[0, 0, z]}>
                    <mesh position={[0, H / 2, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, H, 12]} />
                        <primitive object={material} attach="material" />
                    </mesh>
                    <mesh position={[0, 0.02, 0]}>
                        <boxGeometry args={[0.6, 0.04, 0.4]} />
                        <primitive object={material} attach="material" />
                    </mesh>
                </group>
            ))}
            {isSelected && (
                <lineSegments position={[0, H / 2, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(0.8, H + 0.2, L + 0.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Kinked Grind Rail: Scaled for 3m unicycle (Length 24m, High 2.4m, Low 1.3m)
 */
export const GrindRailKinked: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ material, isSelected }) => {
    return (
        <group>
            {/* High Flat: Z in [-12, -5], Length 7m, H = 2.4m */}
            <mesh position={[0, 2.4, -8.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 7.0, 16]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* Sloped Down-Rail: Z in [-5, 3], Drops from 2.4 to 1.3 */}
            <mesh position={[0, 1.85, -1.0]} rotation={[Math.PI / 2 - Math.atan2(1.1, 8.0), 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, Math.hypot(8.0, 1.1), 16]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* Low Flat: Z in [3, 12], Length 9m, H = 1.3m */}
            <mesh position={[0, 1.3, 7.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 9.0, 16]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* Legs */}
            {[
                { z: -11.0, y: 2.4 },
                { z: -6.0, y: 2.4 },
                { z: -1.0, y: 1.85 },
                { z: 4.0, y: 1.3 },
                { z: 9.0, y: 1.3 }
            ].map((s, idx) => (
                <group key={`kink_stanchion_${idx}`} position={[0, 0, s.z]}>
                    <mesh position={[0, s.y / 2, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, s.y, 12]} />
                        <primitive object={material} attach="material" />
                    </mesh>
                    <mesh position={[0, 0.02, 0]}>
                        <boxGeometry args={[0.6, 0.04, 0.4]} />
                        <primitive object={material} attach="material" />
                    </mesh>
                </group>
            ))}
            {isSelected && (
                <lineSegments position={[0, 1.2, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(0.8, 2.6, 24.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Street Funbox: Scaled for 3m unicycle (Total 18m x 18m, Deck 8m x 8m at H = 2.2m)
 */
export const Funbox: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ material, isSelected }) => {
    const W = 18.0;
    const L = 18.0;
    const innerW = 8.0;
    const innerL = 8.0;
    const H = 2.2;
    const bankRun = (W - innerW) / 2; // 5.0m

    return (
        <group>
            {/* Center Flat Manual Pad */}
            <mesh position={[0, H / 2, 0]}>
                <boxGeometry args={[innerW, H, innerL]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* 4 Steel Coping Ledges along North/South/East/West */}
            <mesh position={[0, H, innerL / 2]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.06, 0.06, innerW, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            <mesh position={[0, H, -innerL / 2]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.06, 0.06, innerW, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            <mesh position={[innerW / 2, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, innerL, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            <mesh position={[-innerW / 2, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, innerL, 16]} />
                <primitive object={COPING_MAT} attach="material" />
            </mesh>
            {/* North Entry Bank Ramp */}
            <mesh position={[0, H / 2, -(innerL / 2 + bankRun / 2)]} rotation={[Math.atan2(H, bankRun), 0, 0]}>
                <boxGeometry args={[innerW, 0.1, Math.hypot(bankRun, H)]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* South Entry Bank Ramp */}
            <mesh position={[0, H / 2, innerL / 2 + bankRun / 2]} rotation={[-Math.atan2(H, bankRun), 0, 0]}>
                <boxGeometry args={[innerW, 0.1, Math.hypot(bankRun, H)]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* East Entry Bank Ramp */}
            <mesh position={[innerW / 2 + bankRun / 2, H / 2, 0]} rotation={[0, 0, -Math.atan2(H, bankRun)]}>
                <boxGeometry args={[Math.hypot(bankRun, H), 0.1, innerL]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* West Entry Bank Ramp */}
            <mesh position={[-(innerW / 2 + bankRun / 2), H / 2, 0]} rotation={[0, 0, Math.atan2(H, bankRun)]}>
                <boxGeometry args={[Math.hypot(bankRun, H), 0.1, innerL]} />
                <primitive object={material} attach="material" />
            </mesh>
            {isSelected && (
                <lineSegments position={[0, H / 2, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(W + 0.2, H + 0.2, L + 0.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Giant Earthmover Tire Vert Bowl: Scaled for 3m unicycle (Radius 14m, Thickness 4m, Wall Height 3.5m)
 */
export const TireVertBowl: React.FC<{ material: THREE.Material; isSelected?: boolean }> = ({ isSelected }) => {
    return (
        <group>
            {/* Main Tire Ring */}
            <mesh position={[0, 1.75, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[14.0, 3.5, 24, 64]} />
                <meshStandardMaterial color="#1a1c20" roughness={0.92} metalness={0.1} />
            </mesh>
            {/* Heavy Tread Cleats */}
            {Array.from({ length: 24 }).map((_, idx) => {
                const angle = (idx / 24) * Math.PI * 2;
                return (
                    <mesh
                        key={`cleat_${idx}`}
                        position={[Math.cos(angle) * 14.0, 1.75, Math.sin(angle) * 14.0]}
                        rotation={[0, -angle, 0]}
                    >
                        <boxGeometry args={[0.4, 3.2, 1.4]} />
                        <meshStandardMaterial color="#0f1114" roughness={0.95} />
                    </mesh>
                );
            })}
            {isSelected && (
                <lineSegments position={[0, 1.75, 0]}>
                    <edgesGeometry args={[new THREE.BoxGeometry(35.2, 7.2, 35.2)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

/**
 * Master Obstacle Dispatcher Component
 */
export const SkateparkObstacleMesh: React.FC<ObstacleMeshProps> = ({
    id: _id,
    type,
    position,
    rotation,
    scale,
    materialKey,
    isSelected = false,
    onClick
}) => {
    const mat = useMemo(() => getSkateparkMaterial(materialKey), [materialKey]);

    const renderMesh = () => {
        switch (type) {
            case 'kicker':
                return <KickerRamp material={mat} isSelected={isSelected} />;
            case 'quarterpipe':
                return <QuarterPipe material={mat} isSelected={isSelected} />;
            case 'halfpipe':
                return <HalfPipe material={mat} isSelected={isSelected} />;
            case 'spine':
                return <SpineTransfer material={mat} isSelected={isSelected} />;
            case 'rail_straight':
                return <GrindRailStraight material={mat} isSelected={isSelected} />;
            case 'rail_kinked':
                return <GrindRailKinked material={mat} isSelected={isSelected} />;
            case 'funbox':
                return <Funbox material={mat} isSelected={isSelected} />;
            case 'tire_bowl':
                return <TireVertBowl material={mat} isSelected={isSelected} />;
            case 'polyhedral_cube':
                return (
                    <PolyhedralSpriteBillboard
                        type="cube"
                        accentColor={materialKey === 'neon_cyan' ? '#06b6d4' : '#ec4899'}
                        isSelected={isSelected}
                    />
                );
            case 'polyhedral_tetra':
                return (
                    <PolyhedralSpriteBillboard
                        type="tetra"
                        accentColor={materialKey === 'neon_cyan' ? '#06b6d4' : '#ec4899'}
                        isSelected={isSelected}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <group
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            {renderMesh()}
        </group>
    );
};

export default SkateparkObstacleMesh;
