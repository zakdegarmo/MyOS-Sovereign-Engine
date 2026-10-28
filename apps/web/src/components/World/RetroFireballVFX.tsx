import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

export const RetroFireballVFX = ({ position, onComplete }: { position: THREE.Vector3, onComplete: () => void }) => {
    const ageRef = useRef(0);
    const MAX_AGE = 0.8; // SNES explosions are FAST
    
    // Core explosion rings
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const sparksRef = useRef<THREE.InstancedMesh>(null);

    // Procedural pixel-art texture for the explosion rings
    const pixelTexture = useMemo(() => {
        const size = 32; // Low res for that crunchy SNES look
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        
        // Draw a chunky circle
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(8, 0, 16, 32);
        ctx.fillRect(0, 8, 32, 16);
        ctx.fillRect(4, 4, 24, 24);
        
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(12, 4, 8, 24);
        ctx.fillRect(4, 12, 24, 8);
        ctx.fillRect(8, 8, 16, 16);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 14, 4, 4);

        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter; // NO BLURRING - Pure pixel crunch
        tex.minFilter = THREE.NearestFilter;
        return tex;
    }, []);

    // Generate random spark vectors
    const sparkData = useMemo(() => {
        const sparks = [];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const tilt = (Math.random() - 0.5) * Math.PI;
            const speed = 10 + Math.random() * 20;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.sin(tilt) * speed + 10,
                Math.sin(angle) * speed
            );
            sparks.push({
                initialPos: new THREE.Vector3(0, 0, 0),
                velocity,
                scale: 0.5 + Math.random() * 1.5,
                color: Math.random() > 0.5 ? '#ffaa00' : '#ff2200'
            });
        }
        return sparks;
    }, []);

    useFrame((state, delta) => {
        ageRef.current += delta;
        const age = ageRef.current;
        const progress = age / MAX_AGE;

        if (age >= MAX_AGE) {
            onComplete();
            return;
        }

        // Animate Rings
        if (ring1Ref.current) {
            const scale1 = 2 + (progress * 20); // Expand rapidly
            ring1Ref.current.scale.set(scale1, scale1, scale1);
            (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - Math.pow(progress, 2);
        }

        if (ring2Ref.current) {
            const scale2 = (progress * 15); 
            ring2Ref.current.scale.set(scale2, scale2, scale2);
            // Flash between white and yellow
            const color = Math.floor(age * 30) % 2 === 0 ? '#ffffff' : '#ffaa00';
            (ring2Ref.current.material as THREE.MeshBasicMaterial).color.set(color);
            (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
        }

        // Animate chunky sparks
        if (sparksRef.current) {
            const dummy = new THREE.Object3D();
            sparkData.forEach((spark, i) => {
                const p = progress;
                // Move outward and apply fake gravity
                const x = spark.velocity.x * age;
                const y = (spark.velocity.y * age) - (20 * age * age); // Gravity arc
                const z = spark.velocity.z * age;
                
                dummy.position.set(x, y, z);
                
                // Spin the cubes randomly
                dummy.rotation.x = age * spark.velocity.x;
                dummy.rotation.y = age * spark.velocity.y;
                
                // Shrink as they die
                const currentScale = Math.max(0, spark.scale * (1 - p));
                dummy.scale.set(currentScale, currentScale, currentScale);
                
                dummy.updateMatrix();
                sparksRef.current!.setMatrixAt(i, dummy.matrix);
            });
            sparksRef.current.instanceMatrix.needsUpdate = true;
        }

        // Flash light
        if (lightRef.current) {
            lightRef.current.intensity = 100 * (1 - progress);
            lightRef.current.distance = 40 + (progress * 40);
        }
    });

    return (
        <group position={position}>
            <pointLight ref={lightRef} color="#ffaa00" intensity={100} distance={40} decay={1.5} />
            
            {/* The 2D Retro Billboard Core */}
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                {/* Outer Ring */}
                <mesh ref={ring1Ref}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial 
                        map={pixelTexture} 
                        transparent 
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
                {/* Inner Flash */}
                <mesh ref={ring2Ref} position={[0, 0, 0.1]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial 
                        map={pixelTexture} 
                        transparent 
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        color="#ffffff"
                    />
                </mesh>
            </Billboard>

            {/* The 3D Chunky Sparks (Voxels) */}
            <instancedMesh ref={sparksRef} args={[undefined, undefined, sparkData.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="#ff5500" transparent opacity={0.9} />
            </instancedMesh>
        </group>
    );
};
