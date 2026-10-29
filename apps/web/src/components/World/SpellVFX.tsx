import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

// --- PIXEL TEXTURE GENERATOR UTILS ---
const createPixelTexture = (drawFn: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    drawFn(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
};

// --- UNIVERSAL JRPG CONDITION MARKER ---
export const ConditionMarker = ({ type, position }: { type: 'acid' | 'bless' | 'fear' | 'aid', position: THREE.Vector3 }) => {
    const markerRef = useRef<THREE.Group>(null);
    const ageRef = useRef(0);

    const iconTex = useMemo(() => createPixelTexture((ctx) => {
        if (type === 'acid') {
            ctx.fillStyle = '#000000';
            ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#33ff00';
            ctx.beginPath(); ctx.arc(16, 18, 8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(16, 4); ctx.lineTo(10, 16); ctx.lineTo(22, 16); ctx.fill();
        } else if (type === 'bless') {
            ctx.fillStyle = '#000000';
            ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(14, 8, 4, 16);
            ctx.fillRect(10, 14, 12, 4);
        } else if (type === 'fear') {
            ctx.fillStyle = '#000000';
            ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#cc55ff';
            ctx.fillRect(10, 8, 12, 10);
            ctx.fillRect(12, 18, 8, 4);
            ctx.fillStyle = '#000000';
            ctx.fillRect(12, 12, 3, 3);
            ctx.fillRect(17, 12, 3, 3);
        } else if (type === 'aid') {
            // Glowing blue HP Up cross
            ctx.fillStyle = '#000000';
            ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(13, 8, 6, 16);
            ctx.fillRect(8, 13, 16, 6);
        }
    }), [type]);

    useFrame((state, delta) => {
        ageRef.current += delta;
        if (markerRef.current) {
            markerRef.current.position.y = position.y + 2 + Math.sin(ageRef.current * 3) * 0.2;
            markerRef.current.position.x = position.x;
            markerRef.current.position.z = position.z;
        }
    });

    return (
        <group ref={markerRef}>
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <mesh>
                    <planeGeometry args={[1.5, 1.5]} />
                    <meshBasicMaterial map={iconTex} transparent depthWrite={false} />
                </mesh>
            </Billboard>
        </group>
    );
};

// --- MISTY STEP (TELEPORT) VFX ---
export const MistyStepVFX = ({ position, onComplete }: { position: THREE.Vector3, onComplete: () => void }) => {
    const ageRef = useRef(0);
    const MAX_AGE = 0.6;
    const cloudRef = useRef<THREE.Group>(null);
    const sparksRef = useRef<THREE.InstancedMesh>(null);

    // Procedural pixel cloud texture
    const cloudTex = useMemo(() => createPixelTexture((ctx) => {
        ctx.fillStyle = '#aa88ff';
        ctx.fillRect(8, 12, 16, 12);
        ctx.fillRect(4, 16, 24, 8);
        ctx.fillRect(12, 8, 8, 16);
        ctx.fillStyle = '#ddccff';
        ctx.fillRect(10, 14, 4, 4);
        ctx.fillRect(18, 18, 4, 4);
    }), []);

    const sparkData = useMemo(() => Array.from({ length: 15 }).map(() => ({
        velocity: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random()) * 8, (Math.random() - 0.5) * 5),
        scale: 0.3 + Math.random() * 0.5
    })), []);

    useFrame((state, delta) => {
        ageRef.current += delta;
        const progress = ageRef.current / MAX_AGE;

        if (ageRef.current >= MAX_AGE) {
            onComplete();
            return;
        }

        if (cloudRef.current) {
            // Expand slightly then shrink rapidly
            const scale = progress < 0.3 ? 1 + progress * 2 : 1.6 - (progress * 1.5);
            cloudRef.current.scale.set(scale, Math.max(0, scale), scale);
            cloudRef.current.position.y = progress * 2; // Drift up
        }

        if (sparksRef.current) {
            const dummy = new THREE.Object3D();
            sparkData.forEach((spark, i) => {
                const p = progress;
                dummy.position.set(spark.velocity.x * p, spark.velocity.y * p, spark.velocity.z * p);
                dummy.rotation.x = p * 10;
                const s = spark.scale * (1 - p);
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                sparksRef.current!.setMatrixAt(i, dummy.matrix);
            });
            sparksRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group position={position}>
            <pointLight color="#aa88ff" intensity={50} distance={15} decay={2} />
            <group ref={cloudRef}>
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <mesh position={[0, 1, 0]}>
                        <planeGeometry args={[2, 2]} />
                        <meshBasicMaterial map={cloudTex} transparent blending={THREE.AdditiveBlending} opacity={0.8} depthWrite={false} />
                    </mesh>
                </Billboard>
            </group>
            <instancedMesh ref={sparksRef} args={[undefined, undefined, sparkData.length]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </instancedMesh>
        </group>
    );
};

// --- INVISIBILITY SHIMMER VFX ---
export const InvisibilityVFX = ({ position, onComplete }: { position: THREE.Vector3, onComplete: () => void }) => {
    const ageRef = useRef(0);
    const MAX_AGE = 1.0;
    const ringRef = useRef<THREE.Mesh>(null);

    const shimmerTex = useMemo(() => createPixelTexture((ctx) => {
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.stroke();
    }), []);

    useFrame((state, delta) => {
        ageRef.current += delta;
        const progress = ageRef.current / MAX_AGE;

        if (ageRef.current >= MAX_AGE) {
            onComplete();
            return;
        }

        if (ringRef.current) {
            // Implode inwards (shrinking ring)
            const scale = 3 - (progress * 3);
            ringRef.current.scale.set(scale, scale, scale);
            (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
            ringRef.current.rotation.z += delta * 5;
        }
    });

    return (
        <group position={position}>
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <mesh ref={ringRef} position={[0, 1, 0]}>
                    <planeGeometry args={[2, 2]} />
                    <meshBasicMaterial map={shimmerTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            </Billboard>
        </group>
    );
};

// --- ACID SPLASH VFX ---
export const AcidSplashVFX = ({ startPos, endPos, onComplete }: { startPos: THREE.Vector3, endPos: THREE.Vector3, onComplete: () => void }) => {
    const ageRef = useRef(0);
    const FLIGHT_TIME = 0.5;
    const SPLASH_TIME = 0.8;
    const TOTAL_TIME = FLIGHT_TIME + SPLASH_TIME;
    
    const globRef = useRef<THREE.Group>(null);
    const puddleRef = useRef<THREE.Mesh>(null);
    const dropletsRef = useRef<THREE.InstancedMesh>(null);

    // Glob texture
    const globTex = useMemo(() => createPixelTexture((ctx) => {
        ctx.fillStyle = '#33ff00';
        ctx.fillRect(8, 8, 16, 16);
        ctx.fillRect(12, 4, 8, 24);
        ctx.fillRect(4, 12, 24, 8);
        ctx.fillStyle = '#ccffaa';
        ctx.fillRect(10, 10, 4, 4);
    }), []);

    // Puddle texture
    const puddleTex = useMemo(() => createPixelTexture((ctx) => {
        ctx.fillStyle = '#11aa00';
        ctx.beginPath();
        ctx.ellipse(16, 16, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#33ff00';
        ctx.beginPath();
        ctx.ellipse(16, 16, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }), []);

    const dropData = useMemo(() => Array.from({ length: 12 }).map(() => ({
        velocity: new THREE.Vector3((Math.random() - 0.5) * 8, 5 + Math.random() * 5, (Math.random() - 0.5) * 8),
        scale: 0.2 + Math.random() * 0.4
    })), []);

    useFrame((state, delta) => {
        ageRef.current += delta;
        const age = ageRef.current;

        if (age >= TOTAL_TIME) {
            onComplete();
            return;
        }

        // FLIGHT PHASE
        if (age < FLIGHT_TIME) {
            const p = age / FLIGHT_TIME;
            if (globRef.current) {
                const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, p);
                currentPos.y += Math.sin(p * Math.PI) * 5;
                globRef.current.position.copy(currentPos);
                globRef.current.rotation.z = p * 10;
            }
        } 
        // SPLASH PHASE
        else {
            const p = (age - FLIGHT_TIME) / SPLASH_TIME;
            
            if (globRef.current) globRef.current.visible = false;

            if (puddleRef.current) {
                puddleRef.current.visible = true;
                puddleRef.current.position.copy(endPos);
                puddleRef.current.position.y += 0.05;
                const s = 1 + (p * 2);
                puddleRef.current.scale.set(s, s, s);
                (puddleRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - p;
            }

            if (dropletsRef.current) {
                const dummy = new THREE.Object3D();
                dropData.forEach((drop, i) => {
                    const dropAge = age - FLIGHT_TIME;
                    const x = drop.velocity.x * dropAge;
                    const y = (drop.velocity.y * dropAge) - (15 * dropAge * dropAge);
                    const z = drop.velocity.z * dropAge;
                    
                    dummy.position.set(endPos.x + x, endPos.y + y, endPos.z + z);
                    const s = drop.scale * (1 - p);
                    dummy.scale.set(s, s, s);
                    dummy.updateMatrix();
                    dropletsRef.current!.setMatrixAt(i, dummy.matrix);
                });
                dropletsRef.current.instanceMatrix.needsUpdate = true;
            }
        }
    });

    return (
        <group>
            <group ref={globRef}>
                <pointLight color="#33ff00" intensity={20} distance={10} />
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <mesh>
                        <planeGeometry args={[1.5, 1.5]} />
                        <meshBasicMaterial map={globTex} transparent depthWrite={false} />
                    </mesh>
                </Billboard>
            </group>
            <mesh ref={puddleRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3, 3]} />
                <meshBasicMaterial map={puddleTex} transparent depthWrite={false} />
            </mesh>
            <instancedMesh ref={dropletsRef} args={[undefined, undefined, dropData.length]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshBasicMaterial color="#55ff00" transparent opacity={0.9} />
            </instancedMesh>
        </group>
    );
};

// --- AID VFX ---
export const AidVFX = ({ position, onComplete }: { position: THREE.Vector3, onComplete: () => void }) => {
    const ageRef = useRef(0);
    const MAX_AGE = 1.5;
    
    const columnRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.InstancedMesh>(null);

    const particleData = useMemo(() => Array.from({ length: 20 }).map(() => ({
        x: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 4,
        y: Math.random() * -5, // Start low
        speed: 2 + Math.random() * 4,
        scale: 0.1 + Math.random() * 0.3
    })), []);

    useFrame((state, delta) => {
        ageRef.current += delta;
        const progress = ageRef.current / MAX_AGE;

        if (ageRef.current >= MAX_AGE) {
            onComplete();
            return;
        }

        if (columnRef.current) {
            // Fade in then fade out
            const opacity = progress < 0.2 ? progress * 5 : (progress > 0.8 ? (1 - progress) * 5 : 1);
            (columnRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.3; // Max 30% opacity
            
            // Expand slightly
            const scale = 1 + (progress * 0.5);
            columnRef.current.scale.set(scale, 1, scale);
        }

        if (particlesRef.current) {
            const dummy = new THREE.Object3D();
            particleData.forEach((p, i) => {
                // Float up
                const currentY = p.y + (ageRef.current * p.speed);
                dummy.position.set(position.x + p.x, position.y + currentY, position.z + p.z);
                
                // Fade out at top
                const s = p.scale * (1 - progress);
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                particlesRef.current!.setMatrixAt(i, dummy.matrix);
            });
            particlesRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group position={position}>
            <pointLight color="#00ffff" intensity={30} distance={15} decay={2} />
            <mesh ref={columnRef} position={[0, 10, 0]}>
                <cylinderGeometry args={[2, 2, 20, 16, 1, true]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
            </mesh>
            <instancedMesh ref={particlesRef} args={[undefined, undefined, particleData.length]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
            </instancedMesh>
        </group>
    );
};

// --- ALARM VFX ---
export const AlarmVFX = ({ position, playerPosition, onComplete }: { position: THREE.Vector3, playerPosition?: THREE.Vector3, onComplete: () => void }) => {
    const ageRef = useRef(0);
    const MAX_AGE = 20.0; // Lasts 20 seconds
    const RADIUS = 4.0;
    
    const ringRef = useRef<THREE.Mesh>(null);
    const bellRef = useRef<THREE.Group>(null);
    const [isTriggered, setIsTriggered] = useState(false);

    // Pixel art bell
    const bellTex = useMemo(() => createPixelTexture((ctx) => {
        // Bell shape
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(16, 16, 8, Math.PI, 0); // top dome
        ctx.lineTo(26, 24); // bottom right flare
        ctx.lineTo(6, 24); // bottom left flare
        ctx.fill();
        
        // Bell clapper
        ctx.fillStyle = '#ccaa00';
        ctx.beginPath();
        ctx.arc(16, 26, 3, 0, Math.PI*2);
        ctx.fill();
        
        // Highlights & outlines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }), []);

    const ringTex = useMemo(() => createPixelTexture((ctx) => {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner warding runes
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(16, 16, 10, 0, Math.PI * 2);
        ctx.stroke();
    }), []);

    useFrame((state, delta) => {
        ageRef.current += delta;
        const progress = ageRef.current / MAX_AGE;

        if (ageRef.current >= MAX_AGE) {
            onComplete();
            return;
        }

        // Distance check for trigger
        let triggered = false;
        if (playerPosition) {
            const dx = playerPosition.x - position.x;
            const dz = playerPosition.z - position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < RADIUS) triggered = true;
        }
        setIsTriggered(triggered);

        // Animation
        if (ringRef.current) {
            ringRef.current.rotation.z += delta * 0.5;
            // Opacity pulses slightly, flashes violently if triggered
            const baseOpacity = progress < 0.1 ? (progress*10) : (progress > 0.9 ? (1-progress)*10 : 1);
            const pulse = triggered 
                ? (Math.sin(ageRef.current * 30) * 0.5 + 0.5) // Rapid strobe
                : (Math.sin(ageRef.current * 2) * 0.2 + 0.3); // Slow breathe
            
            (ringRef.current.material as THREE.MeshBasicMaterial).opacity = baseOpacity * pulse;
            (ringRef.current.material as THREE.MeshBasicMaterial).color.setHex(triggered ? 0xff0000 : 0xaa0000);
        }

        if (bellRef.current) {
            bellRef.current.position.y = position.y + 3.0 + Math.sin(ageRef.current * 3) * 0.2;
            
            if (triggered) {
                // Ringing swing
                bellRef.current.rotation.z = Math.sin(ageRef.current * 40) * 0.4;
            } else {
                bellRef.current.rotation.z = 0;
            }
        }
    });

    return (
        <group position={[position.x, position.y + 0.05, position.z]}>
            {isTriggered && <pointLight color="#ff0000" intensity={40} distance={15} decay={2} position={[0, 2, 0]} />}
            
            {/* Ground Ring */}
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} scale={[RADIUS, RADIUS, 1]}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial map={ringTex} color="#aa0000" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            
            {/* Hovering Bell */}
            <group ref={bellRef}>
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <mesh>
                        <planeGeometry args={[1.5, 1.5]} />
                        <meshBasicMaterial map={bellTex} transparent depthWrite={false} />
                    </mesh>
                </Billboard>
            </group>
        </group>
    );
};

// --- ALTER SELF VFX ---
export const AlterSelfVFX = ({ position, onComplete }: { position: THREE.Vector3, onComplete: () => void }) => {
    const ageRef = useRef(0);
    const MAX_AGE = 1.2;
    const cloudRef = useRef<THREE.Group>(null);
    const voxelMeshRef = useRef<THREE.InstancedMesh>(null);

    // Pixel glitch texture
    const glitchTex = useMemo(() => createPixelTexture((ctx) => {
        ctx.fillStyle = '#ff00aa';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(8, 8, 16, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, 12, 8, 8);
    }), []);

    const voxelData = useMemo(() => Array.from({ length: 24 }).map(() => ({
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6 + 2,
            (Math.random() - 0.5) * 6
        ),
        rotSpeed: (Math.random() - 0.5) * 10,
        scale: 0.2 + Math.random() * 0.4
    })), []);

    useFrame((state, delta) => {
        ageRef.current += delta;
        const progress = ageRef.current / MAX_AGE;

        if (ageRef.current >= MAX_AGE) {
            onComplete();
            return;
        }

        if (cloudRef.current) {
            // Expand rapidly then implode/dissipate
            const scale = progress < 0.4 ? progress * 5 : 2 - (progress * 1.5);
            cloudRef.current.scale.set(scale, scale * 1.5, scale);
            cloudRef.current.rotation.y += delta * 8;
        }

        if (voxelMeshRef.current) {
            const dummy = new THREE.Object3D();
            voxelData.forEach((v, i) => {
                const p = progress;
                dummy.position.set(v.velocity.x * p, v.velocity.y * p, v.velocity.z * p);
                dummy.rotation.set(p * v.rotSpeed, p * v.rotSpeed, p * v.rotSpeed);
                const s = v.scale * (1 - Math.pow(p, 2));
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                voxelMeshRef.current!.setMatrixAt(i, dummy.matrix);
            });
            voxelMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group position={position}>
            <pointLight color="#ff00aa" intensity={40} distance={12} decay={2} position={[0, 1.5, 0]} />
            <group ref={cloudRef} position={[0, 1.5, 0]}>
                <Billboard follow lockX={false} lockY={false} lockZ={false}>
                    <mesh>
                        <planeGeometry args={[1.5, 1.5]} />
                        <meshBasicMaterial map={glitchTex} transparent blending={THREE.AdditiveBlending} opacity={0.8} depthWrite={false} />
                    </mesh>
                </Billboard>
            </group>
            <instancedMesh ref={voxelMeshRef} args={[undefined, undefined, voxelData.length]} position={[0, 1, 0]}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="#00ffff" emissive="#ff00aa" emissiveIntensity={2} wireframe />
            </instancedMesh>
        </group>
    );
};
