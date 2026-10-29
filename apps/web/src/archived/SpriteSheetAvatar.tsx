import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SpriteSheetAvatarProps {
    imageUrl: string;
    pillarIndex: number; // For fallback
    scale: number;
    state: 'Idle' | 'Walk' | 'Talk';
}

const PILLARS = ["self", "thought", "logic", "unity", "existence", "improvement", "mastery", "resonance", "transcendence", "omnipotence"];

export const SpriteSheetAvatar: React.FC<SpriteSheetAvatarProps> = ({ pillarIndex, scale, state }) => {
    const groupRef = useRef<THREE.Group>(null);
    const planeRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    const pillarName = PILLARS[pillarIndex] || "self";
    const texturePath = `/textures/avatars/${pillarName}.png`;

    const texture = useLoader(THREE.TextureLoader, texturePath);

    // CANONICAL DIMENSIONS (3x4 Grid usually for JRPG sprites)
    const framesPerAnim = 3;
    // Assuming standard format, adjust if the spritesheet is different
    const totalCols = 3;
    const totalRows = 4;

    const charTex = useMemo(() => {
        const tex = texture.clone();
        tex.magFilter = tex.minFilter = THREE.NearestFilter;
        return tex;
    }, [texture]);

    // Animation State
    const currentFrame = useRef(0);
    const frameTimer = useRef(0);
    const lastPos = useRef(new THREE.Vector3());
    const worldPos = useRef(new THREE.Vector3());

    useFrame((_, delta) => {
        if (!groupRef.current || !planeRef.current) return;

        // 1. Billboarding: Always face the camera horizontally
        groupRef.current.quaternion.copy(camera.quaternion);
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.z = 0;

        // Track self-movement to flip horizontally
        groupRef.current.getWorldPosition(worldPos.current);
        const deltaX = worldPos.current.x - lastPos.current.x;

        if (deltaX < -0.001) {
            planeRef.current.scale.x = -1;
        } else if (deltaX > 0.001) {
            planeRef.current.scale.x = 1;
        }
        lastPos.current.copy(worldPos.current);

        // 2. Animation Logic
        let fps = 6;
        let animRowOffset = 0;

        if (state === 'Walk') {
            fps = 10;
            animRowOffset = 1; // e.g. Side walk
        } else if (state === 'Talk') {
            fps = 8;
            animRowOffset = 2; // e.g. Up or cast
        } else {
            fps = 4;
            animRowOffset = 0; // Idle / Down
        }

        frameTimer.current += delta;
        if (frameTimer.current > 1 / fps) {
            frameTimer.current = 0;
            currentFrame.current = (currentFrame.current + 1) % framesPerAnim;

            // Calculate UVs based on frame and animation row
            const uvX = currentFrame.current / totalCols;
            const uvY = ((totalRows - 1) - animRowOffset) / totalRows;

            charTex.repeat.set(1 / totalCols, 1 / totalRows);
            charTex.offset.set(uvX, uvY);
        }
    });

    const matProps = {
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    };

    // 1 frame of a 3x4 grid from a 640x768 image = ~ 213 x 192 (almost square)
    return (
        <group ref={groupRef} position={[0, scale / 2, 0]}>
            <mesh ref={planeRef}>
                {/* Render a single plane scaled appropriately to the cell size (1:1 ratio typically) */}
                <planeGeometry args={[scale * 1.5, scale * 1.5]} />
                <meshStandardMaterial {...matProps} map={charTex} />
            </mesh>

            {/* Ground Shadow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -scale / 2 + 0.01, 0]}>
                <circleGeometry args={[scale * 0.4, 16]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.3} />
            </mesh>
        </group>
    );
};
