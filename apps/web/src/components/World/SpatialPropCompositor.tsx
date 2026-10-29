import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

export interface SpatialPropItem {
    id: string;
    name: string;
    textureUrl: string;
    position: [number, number, number]; // [x, y, z] on 3D grid
    scale?: [number, number, number];
}

interface SpatialPropCompositorProps {
    props: SpatialPropItem[];
}

/**
 * SinglePropBillboard: Renders a camera-facing 2.5D pixel-art billboard prop with transparent alpha.
 */
const SinglePropBillboard: React.FC<{ item: SpatialPropItem }> = ({ item }) => {
    const texture = useTexture(item.textureUrl);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const scale = item.scale || [2.4, 2.4, 1];
    const yPos = (scale[1] / 2); // Sit cleanly on ground plane

    return (
        <group position={[item.position[0], item.position[1] + yPos, item.position[2]]}>
            <sprite scale={scale}>
                <spriteMaterial map={texture} transparent={true} depthWrite={false} />
            </sprite>
        </group>
    );
};

/**
 * SpatialPropCompositor: Renders 2.5D billboard props across the 3D scene.
 */
export const SpatialPropCompositor: React.FC<SpatialPropCompositorProps> = ({ props }) => {
    return (
        <group name="SpatialPropSubstrate">
            {props.map((item) => (
                <SinglePropBillboard key={item.id} item={item} />
            ))}
        </group>
    );
};
