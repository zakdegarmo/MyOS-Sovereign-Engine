import React, { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';


interface HyperObjectProps {
    id: string;
    position: [number, number, number];
    scale?: number;
    textureUrl?: string;
    linkedPillar?: string;
    linkedResonance?: number;
    onTrigger?: (data: any) => void;
    onAnimationComplete?: (id: string, state: 'opened' | 'closed') => void;
    label?: string;
    playerPosition?: [number, number, number];
    isLocked?: boolean;
    isClosing?: boolean;
    isSelected?: boolean;
    transformMode?: 'translate' | 'scale';
    onUpdate?: (changes: any) => void;
}

/**
 * HyperObject: Minimalist Dimension Door manifestation.
 * Directly utilizes the ZAMN spritesheet with precise aspect ratio and manifestation animation.
 */
export const HyperObject: React.FC<HyperObjectProps> = ({
    id,
    position,
    scale = 1.8,
    textureUrl = '/assets/ZAMN_Assets/32191.png',
    linkedPillar,
    linkedResonance,
    onTrigger,
    onAnimationComplete,
    label,
    playerPosition,
    isLocked = false,
    isClosing = false,
    isSelected,
    transformMode,
    onUpdate
}) => {
    const { controls } = useThree();
    const [isDragging, setIsDragging] = useState(false);
    const groupRef = useRef<THREE.Group>(null);
    const spriteRef = useRef<THREE.Sprite>(null);
    const [isNear, setIsNear] = useState(false);
    const frameRef = useRef(0);

    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.load(textureUrl, (tex) => {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            
            // 314x92 image. Door frames are roughly 44px wide and 64px tall.
            tex.repeat.set(44 / 314, 64 / 92);
            tex.offset.y = 28 / 92; // Skip attribution text
            setTexture(tex);
        });
    }, [textureUrl]);

    useFrame((_state, delta) => {
        if (groupRef.current && !isDragging) {
            groupRef.current.position.set(position[0], position[1], position[2]);
        }

        if (texture) {
            let currentFrame = frameRef.current;
            
            if (isClosing) {
                if (currentFrame > 0) {
                    currentFrame = Math.max(currentFrame - delta * 15, 0);
                    if (currentFrame === 0 && frameRef.current > 0) {
                        onAnimationComplete?.(id, 'closed');
                    }
                }
            } else if (currentFrame < 6) {
                const prev = currentFrame;
                currentFrame = Math.min(currentFrame + delta * 15, 6);
                if (currentFrame === 6 && prev < 6) {
                    onAnimationComplete?.(id, 'opened');
                }
            }
            
            frameRef.current = currentFrame;
            texture.offset.x = (Math.floor(currentFrame) * 44) / 314;

            // Auto-trigger collision (ZAMN style)
            if (playerPosition && currentFrame >= 5 && !isLocked && !isClosing && !isDragging) {
                const distSq = Math.pow(groupRef.current!.position.x - playerPosition[0], 2) + 
                             Math.pow(groupRef.current!.position.z - playerPosition[2], 2);
                const colliding = distSq < 1.5; // ~1.2 units radius, tight enough to "walk into" it
                
                if (colliding !== isNear) {
                    setIsNear(colliding);
                    if (colliding) {
                        const triggerData = { id, linkedPillar, linkedResonance };
                        onTrigger?.(triggerData);
                        window.dispatchEvent(new CustomEvent('myos_portal_trigger', { detail: triggerData }));
                    }
                }
            }
        }
    });

    // We can keep click as a fallback, but the main ZAMN mechanic is walking into it!

    const handleClick = () => {
        if (isNear && !isLocked && frameRef.current >= 5) {
            onTrigger?.({ id, linkedPillar, linkedResonance });
        }
    };

    if (!texture) return null;

    return (
        <>
            {isSelected && (
                <TransformControls
                    object={groupRef.current || undefined}
                    mode={transformMode || 'translate'}
                    onMouseDown={() => {
                        setIsDragging(true);
                        if (controls) (controls as any).enabled = false;
                    }}
                    onMouseUp={() => {
                        setIsDragging(false);
                        if (controls) (controls as any).enabled = true;

                        if (groupRef.current && playerPosition) {
                            onUpdate?.({
                                position: [
                                    groupRef.current.position.x + playerPosition[0],
                                    groupRef.current.position.y,
                                    groupRef.current.position.z + playerPosition[2]
                                ],
                                scale: groupRef.current.scale.y // Primary scale axis for sprites
                            });
                        }
                    }}
                />
            )}
            <group ref={groupRef} position={position}>
                <sprite 
                    ref={spriteRef} 
                    scale={[scale * (44/64), scale, 1]} 
                    position={[0, scale/2, 0]}
                    onClick={handleClick}
                >
                    <spriteMaterial 
                        map={texture} 
                        transparent 
                        toneMapped={false}
                        color="#ffffff"
                    />
                </sprite>
            </group>
        </>
    );
};
