import React, { useEffect, useRef, useState } from 'react';
import { Billboard, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { loadOntologyContext } from '../../engine/ContextLoader';
import { PixelChatBubble } from '../../components/Avatars/PixelChatBubble';

export const AutonomousEinstein = ({ position = [0, 1, 0] }: { position?: [number, number, number] }) => {
    const baseTexture = useTexture('/assets/einstein/einstein_base.png');
    const meshRef = useRef<THREE.Group>(null);
    const targetPosition = useRef(new THREE.Vector3(...position));

    // AI Cognitive State
    const workerRef = useRef<Worker | null>(null);
    const lastTelemetryTime = useRef(0);
    const [speech, setSpeech] = useState<string>('');
    const [isTalking, setIsTalking] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Smoothly interpolate to target position (Wandering)
            meshRef.current.position.lerp(targetPosition.current, 0.02);

            // Talk wobble animation
            if (isTalking) {
                meshRef.current.position.y = targetPosition.current.y + Math.sin(state.clock.elapsedTime * 15) * 0.05;
                meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.02;
            } else {
                meshRef.current.position.y = targetPosition.current.y;
                meshRef.current.rotation.z = 0;
            }
        }
    });

    useEffect(() => {
        if (speech) {
            setIsTalking(true);
            const timer = setTimeout(() => setIsTalking(false), Math.max(3000, speech.length * 100)); // Minimum 3s, longer for more text
            return () => clearTimeout(timer);
        }
    }, [speech]);

    useEffect(() => {
        // Boot up the localized AI Agent
        const worker = new Worker(new URL('../../engine/workers/llmWorker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;

        loadOntologyContext('Thought', 'IsPonderedBy', 'Concept_of_Is').then((def) => {
            worker.postMessage({
                type: 'BOOT',
                payload: {
                    identity: { System_Directive: "You are the caricature of Albert Einstein. You inhabit a spatial OS environment called the Einstein Lab. Your job is to act as a brilliant, slightly frantic sounding board for the user's thought experiments. When the user sends a telemetry message, answer them brilliantly using the 'speak' tool. You can also wander around the alchemy lab by choosing random coordinates between x=-5 to 5 and z=-5 to 5 using the 'moveTo' tool. Always provide an imaginative response to thought experiments." },
                    tools: [
                        { name: 'moveTo', params: { x: 'number', z: 'number' } },
                        { name: 'speak', params: { message: 'string' } }
                    ],
                    definitions: [def]
                }
            });
        });

        worker.onmessage = (e) => {
            const { type, call, error } = e.data;
            if (error) console.error("[Einstein] AI Error:", error);

            if (type === 'TOOL_CALL') {
                const toolName = call?.action || call?.tool_name || call?.tool || call?.name;
                const params = call?.params || call;

                if (toolName === 'moveTo' || toolName === 'translate') {
                    const targetX = params.x || 0;
                    const targetZ = params.z || 0;
                    const currentY = targetPosition.current.y;
                    targetPosition.current.set(targetX, currentY, targetZ);
                    console.log(`[Einstein] Moving to ${targetX}, ${targetZ}`);
                } 
                else if (toolName === 'speak') {
                    setSpeech(params.message || params.text || "");
                    console.log(`[Einstein] Speaking:`, params.message);
                }
            }
        };

        // Idle wandering loop trigger
        const idleWander = setInterval(() => {
            if (Math.random() > 0.7) {
                // Trigger AI to potentially move or observe
                worker.postMessage({
                    type: 'TELEMETRY',
                    payload: { event: 'idle_tick', instruction: 'You are idle. You may want to moveTo a new location in the lab to ponder.' }
                });
            }
        }, 15000);

        return () => {
            worker.terminate();
            clearInterval(idleWander);
        };
    }, []);

    // Export a global method so the React UI can send messages to Einstein
    useEffect(() => {
        (window as any).sendToEinstein = (text: string) => {
            if (workerRef.current) {
                workerRef.current.postMessage({
                    type: 'TELEMETRY',
                    payload: { event: 'user_thought_experiment', content: text }
                });
            }
        };
        return () => { delete (window as any).sendToEinstein; };
    }, []);

    return (
        <group ref={meshRef} position={position}>
            <Billboard>
                <mesh>
                    <planeGeometry args={[3, 4]} />
                    <meshBasicMaterial map={baseTexture} transparent alphaTest={0.5} />
                </mesh>
            </Billboard>
            {speech && (
                <Billboard position={[1.5, 2, 0]}>
                    <PixelChatBubble message={speech} type="speak" />
                </Billboard>
            )}
        </group>
    );
};
