import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface JRPGBillboardProps {
    classType: string;
    action?: 'idle' | 'walk';
    position?: [number, number, number];
    scale?: number;
}

const CLASS_ROWS: Record<string, number> = {
    barbarian: 0, bard: 1, cleric: 2, druid: 3, fighter: 4, monk: 5,
    paladin: 6, ranger: 7, rogue: 8, sorcerer: 9, warlock: 10, wizard: 11
};

export const JRPGBillboard: React.FC<JRPGBillboardProps> = ({ 
    classType, 
    action = 'idle', 
    position = [0, 0, 0], 
    scale = 1.0 
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Path to the master sheet the user provided
    const SPRITE_SHEET = '/textures/dnd_sprite_sheet.png';
    
    const texture = useMemo(() => {
        const t = new THREE.TextureLoader().load(SPRITE_SHEET);
        t.magFilter = THREE.NearestFilter; // Sharp pixel art look
        t.minFilter = THREE.NearestFilter;
        return t;
    }, []);

    const uniforms = useMemo(() => ({
        map: { value: texture },
        uRepeat: { value: new THREE.Vector2(1, 1) },
        uOffset: { value: new THREE.Vector2(0, 0) }
    }), [texture]);

    useFrame((state) => {
        if (!texture) return;

        const row = CLASS_ROWS[classType.toLowerCase()] ?? 0;
        
        let frame = 1;
        if (action === 'walk') {
            // Loop through columns 2, 3, 4 for a forward walk cycle
            frame = 2 + (Math.floor(state.clock.elapsedTime * 6) % 3);
        } else {
            // Idle is column 1 (column 0 is the label)
            frame = 1;
        }
        
        // Calculate UV offsets with crop margin to prevent bleeding
        // 13 columns (1 label + 12 sprites), 12 rows
        const cellW = 1 / 13;
        const cellH = 1 / 12;
        const marginX = cellW * 0.15; // 15% crop from edges
        const marginY = cellH * 0.10;

        uniforms.uRepeat.value.set(cellW - marginX * 2, cellH - marginY * 2);
        uniforms.uOffset.value.set((frame * cellW) + marginX, 1 - ((row + 1) * cellH) + marginY);
        
        // Billboarding logic: Face the camera
        if (meshRef.current) {
            meshRef.current.quaternion.copy(state.camera.quaternion);
        }
    });

    return (
        <mesh ref={meshRef} position={position} scale={[scale, scale, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                transparent={true}
                side={THREE.DoubleSide}
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    uniform vec2 uRepeat;
                    uniform vec2 uOffset;
                    void main() {
                        vUv = (uv * uRepeat) + uOffset;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D map;
                    varying vec2 vUv;
                    void main() {
                        vec4 texColor = texture2D(map, vUv);
                        // Chroma key: discard near-white backgrounds
                        if (texColor.r > 0.85 && texColor.g > 0.85 && texColor.b > 0.85) {
                            discard;
                        }
                        gl_FragColor = texColor;
                    }
                `}
            />
        </mesh>
    );
};
