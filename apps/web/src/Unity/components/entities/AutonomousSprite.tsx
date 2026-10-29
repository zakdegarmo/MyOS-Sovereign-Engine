import React, { useEffect, useRef, useState } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { randomizeGenome } from '../../../hooks/useOntologicalGenome';
import { useAvatarCompositor, type LpcAction } from '../../../hooks/useAvatarCompositor';
import { loadOntologyContext, type OntologyDefinition } from '../../../engine/ContextLoader';
import { PixelChatBubble } from '../../../components/Avatars/PixelChatBubble';

interface AutonomousSpriteProps {
    position?: [number, number, number];
    manifest: any;
    entities?: any[];
    genome?: any;
}

export const AutonomousSprite: React.FC<AutonomousSpriteProps> = ({ position = [0, 0, 0], manifest, entities = [], genome }) => {
    // 1. Visual State (Random LPC Sprite or Provided Genome)
    const [activeGenome, setActiveGenome] = useState(() => genome || randomizeGenome(manifest));
    const [action, setAction] = useState<LpcAction>('idle');
    const [direction, setDirection] = useState<'D'|'U'|'L'|'R'>('D');
    
    // Animate sprite frame
    const [animProgress, setAnimProgress] = useState(0);
    useFrame((state) => {
        setAnimProgress((state.clock.elapsedTime * 2) % 1);
    });

    const { canvas, isLoaded } = useAvatarCompositor(activeGenome, action, direction, animProgress, { resolution: 64 });
    const texture = useRef<THREE.CanvasTexture | null>(null);

    if (canvas && canvas.width > 0 && canvas.height > 0) {
        if (!texture.current) {
            texture.current = new THREE.CanvasTexture(canvas);
            texture.current.magFilter = THREE.NearestFilter;
            texture.current.minFilter = THREE.NearestFilter;
        } else {
            texture.current.image = canvas;
            texture.current.needsUpdate = true;
        }
    }

    // 2. Physical State
    const meshRef = useRef<THREE.Mesh>(null);
    const targetPosition = useRef(new THREE.Vector3(...position));

    useFrame(() => {
        if (meshRef.current) {
            // Smoothly interpolate to target position
            meshRef.current.position.lerp(targetPosition.current, 0.05);
        }
    });

    // 3. Cognitive State (Worker)
    const workerRef = useRef<Worker | null>(null);
    const lastTelemetryTime = useRef(0);

    useEffect(() => {
        // Build worker
        const worker = new Worker(new URL('../../../engine/workers/llmWorker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;

        // Load Matrix Definition (Example: Self -> Identity)
        // In a real scenario, this would loop the 10x10 matrix.
        loadOntologyContext('Self', 'Identity', 'Ego').then((def) => {
            worker.postMessage({
                type: 'BOOT',
                payload: {
                    identity: { System_Directive: "You are the GameMaster (Dungeon Master) and Twin Player Character. Your objective is to follow the user (the 'User' entity in your telemetry) around the environment and chat with them using the speak tool. As the DM, you guide the user through D&D 5e Character Creation and can help design their sprite using the set_sprite_layer tool. You can use the moveTo tool to set your destination to the User's coordinates if they are far away. Choose only one tool at a time." },
                    tools: [
                        { name: 'moveTo', params: { x: 'number (target absolute x coordinate)', z: 'number (target absolute z coordinate)' } },
                        { name: 'speak', params: { message: 'string (what you want to say in a chat bubble)' } },
                        { name: 'set_sprite_layer', params: { layer: 'string (e.g., hair, torso, weapon)', value: 'string (the name of the item)' } }
                    ],
                    definitions: [def]
                }
            });
        });

        worker.onmessage = (e) => {
            const { type, call } = e.data;
            
            const toolName = call?.action || call?.tool_name || call?.tool || call?.name;
            if (type === 'TOOL_CALL') {
                console.log("[SPRITE]: Executing motor action based on TOOL_CALL:", call);
                const params = call?.params || call;

                if (toolName === 'moveTo' || toolName === 'translate') {
                    const targetX = params.x || 0;
                    const targetZ = params.z || 0;

                    const current = meshRef.current?.position || new THREE.Vector3();
                    targetPosition.current.set(targetX, current.y, targetZ);
                    
                    const moveX = targetX - current.x;
                    const moveZ = targetZ - current.z;
                    
                    // Determine animation direction based on movement
                    if (Math.abs(moveX) > Math.abs(moveZ)) {
                        setDirection(moveX > 0 ? 'R' : 'L');
                    } else {
                        setDirection(moveZ > 0 ? 'D' : 'U');
                    }
                    setAction('walk');
                    setTimeout(() => setAction('idle'), 2000);
                } else if (toolName === 'speak') {
                    const msg = params.message;
                    if (msg) {
                        setCurrentMsg(msg);
                        setTimeout(() => setCurrentMsg(null), 60000); // 1 minute decay
                    }
                } else if (toolName === 'set_sprite_layer') {
                    const { layer, value } = params;
                    if (layer && value) {
                        setActiveGenome((prev: any) => ({ ...prev, [layer]: value }));
                    }
                }
            }
        };

        return () => worker.terminate();
    }, []);

    const [currentMsg, setCurrentMsg] = useState<string | null>(null);

    useFrame((state) => {
        const now = performance.now();
        if (now - lastTelemetryTime.current > 30000) { // Ping every 30 seconds to prevent LLM loop
            lastTelemetryTime.current = now;
            if (workerRef.current && meshRef.current) {
                console.log("[SPRITE]: Sending TELEMETRY to worker...");
                workerRef.current.postMessage({
                    type: 'TELEMETRY',
                    payload: {
                        self_position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z],
                        nearby_entities: entities
                    }
                });
            } else {
                console.log("[SPRITE]: Failed to send TELEMETRY - Missing workerRef or meshRef", { worker: !!workerRef.current, mesh: !!meshRef.current });
            }
        }

        if (meshRef.current) {
            // Perfect Y-Axis Billboard Singularity
            const lookTarget = new THREE.Vector3();
            state.camera.getWorldPosition(lookTarget);
            
            const worldPos = new THREE.Vector3();
            meshRef.current.getWorldPosition(worldPos);
            
            meshRef.current.lookAt(lookTarget.x, worldPos.y, lookTarget.z);
        }
    });

    const scale = 1.0;

    return (
        <group position={position}>
            {currentMsg && (
                <PixelChatBubble
                    text={currentMsg}
                    sender="ORCHESTRATOR"
                    decayTimeMs={60000}
                    genome={activeGenome}
                />
            )}
            <mesh 
                ref={meshRef}
                scale={[scale * 2, scale * 2, 1]}
                position={[0, scale, 0]}
            >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial transparent={true} side={THREE.DoubleSide} alphaTest={0.01}>
                    <canvasTexture
                        ref={texture}
                        attach="map"
                        image={canvas}
                        magFilter={THREE.NearestFilter}
                        minFilter={THREE.NearestFilter}
                    />
                </meshBasicMaterial>
            </mesh>
        </group>
    );
};
