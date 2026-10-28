import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface FacetHighlighterProps {
    target: THREE.Object3D | undefined | null;
}

/**
 * FacetHighlighter: Visualizes mesh face indices in real-time.
 * Used for "Talk-to-Modify" debugging and visual segmentation.
 */
export const FacetHighlighter: React.FC<FacetHighlighterProps> = ({ target }) => {
    const labels = useMemo(() => {
        if (!target) return [];

        let mesh: THREE.Mesh | null = null;
        target.traverse((obj) => {
            if (obj instanceof THREE.Mesh && !mesh) {
                mesh = obj;
            }
        });

        if (!mesh) return [];

        const geometry = (mesh as THREE.Mesh).geometry;
        if (!geometry || !geometry.attributes.position) return [];

        const positionAttribute = geometry.attributes.position;
        const index = geometry.index;
        const facetData: Array<{ id: number, position: THREE.Vector3 }> = [];

        if (index) {
            // Indexed geometry
            for (let i = 0; i < index.count; i += 3) {
                const a = index.getX(i);
                const b = index.getX(i + 1);
                const c = index.getX(i + 2);

                const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, a);
                const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, b);
                const v3 = new THREE.Vector3().fromBufferAttribute(positionAttribute, c);

                const center = new THREE.Vector3()
                    .add(v1)
                    .add(v2)
                    .add(v3)
                    .divideScalar(3);

                facetData.push({ id: i / 3, position: center });
            }
        } else {
            // Non-indexed geometry
            for (let i = 0; i < positionAttribute.count; i += 3) {
                const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
                const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 1);
                const v3 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 2);

                const center = new THREE.Vector3()
                    .add(v1)
                    .add(v2)
                    .add(v3)
                    .divideScalar(3);

                facetData.push({ id: i / 3, position: center });
            }
        }

        // Limit to prevent performance issues on very complex meshes
        return facetData.slice(0, 100); 
    }, [target]);

    if (!target || labels.length === 0) return null;

    return (
        <group position={target.position} rotation={target.rotation} scale={target.scale}>
            {labels.map((facet) => (
                <Html
                    key={facet.id}
                    position={facet.position}
                    center
                    distanceFactor={10}
                    className="pointer-events-none select-none"
                >
                    <div className="bg-purple-600/80 text-white font-mono text-[10px] px-1 rounded border border-purple-400/50 backdrop-blur-sm shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                        {facet.id}
                    </div>
                </Html>
            ))}
            
            {/* Wireframe Overlay */}
            <mesh>
                <primitive object={target instanceof THREE.Mesh ? target.geometry : new THREE.BoxGeometry(1, 1, 1)} attach="geometry" />
                <meshBasicMaterial wireframe color="#00ffff" transparent opacity={0.3} />
            </mesh>
        </group>
    );
};
