import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { generateResponse } from './localLlmService';
import { useCouncil } from '../../council/CouncilContext';
import { useSocial } from '../../social/SocialContext';
import { EliteAvatar } from '../Avatars/EliteAvatar';
import { MooseBot } from '../Avatars/MooseBot';
import { EmeraldScout } from '../Avatars/EmeraldScout';

interface EliteMephitNPCProps {
    id: string;
    initialPosition: [number, number, number];
    bounds: number;
    onSpeak?: (id: string, text: string) => void;
    stationary?: boolean;
    onClick?: () => void;
}

/**
 * EliteMephitNPC.tsx
 * 
 * Manifest-OPTIONAL version. 
 * If no data is found in the manifest, it falls back to hardcoded elite defaults 
 * to prevent character erasure.
 */
export const EliteMephitNPC: React.FC<EliteMephitNPCProps> = ({
    id,
    initialPosition,
    bounds,
    onSpeak,
    stationary = false,
    onClick,
}) => {
    const { speak } = useCouncil();
    const { manifest, registerPosition, advanceDialogue, getInteractionState } = useSocial();
    
    // Get Manifest Data (Optional)
    const entityData = manifest?.entities[id];
    
    // SAFE FALLBACKS: Never return null
    const systemPrompt = entityData?.personality || (id === 'heman' ? "You are He-Man, Master of the Universe." : "You are an Elite Mephit.");
    const assetUrl = entityData?.assetUrl || (id === 'heman' ? "/assets/heman_walk_pro.gif" : undefined);
    const assetType = entityData?.assetType || (id === 'moosebot' ? 'glb' : 'gif');
    const scale = entityData?.scale || (id === 'heman' ? 1.2 : 0.3);

    const groupRef = useRef<THREE.Group>(null);
    const targetPos = useRef(new THREE.Vector3(...initialPosition));
    const posRef = useRef(new THREE.Vector3(...initialPosition));
    
    const [velocity, setVelocity] = useState<[number, number, number]>([0, 0, 0]);
    const [message, setMessage] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const lastSpeakTime = useRef(Date.now());
    const speed = 2.0;

    const interactionState = getInteractionState(id);

    // Movement AI
    useEffect(() => {
        if (stationary || interactionState?.active) return;
        const moveInterval = setInterval(() => {
            if (Math.random() > 0.4) {
                targetPos.current.set(
                    ((Math.random() - 0.5) * bounds * 0.8) + initialPosition[0],
                    initialPosition[1],
                    ((Math.random() - 0.5) * bounds * 0.8) + initialPosition[2]
                );
            }
        }, 3000 + Math.random() * 3000);
        return () => clearInterval(moveInterval);
    }, [bounds, stationary, initialPosition, interactionState?.active]);

    // Dialogue Logic
    const handleDialogue = async () => {
        if (isThinking || !interactionState?.active) return;
        setIsThinking(true);
        try {
            const partnerName = manifest?.entities[interactionState.partnerId!]?.name || "the other mephit";
            const topic = interactionState.topicPillar;
            const turn = interactionState.turn;
            const narrative = interactionState.relationshipNarrative;

            let prompt = "";
            switch (turn) {
                case 1: prompt = `Greeting phase. Greet ${partnerName}. Topic: ${topic}. Be brief and in character.`; break;
                case 2: prompt = `Small talk phase with ${partnerName}. Discuss ${topic}. 1 sentence.`; break;
                case 3: prompt = `Deep dive on ${topic} with ${partnerName}. 1 sentence.`; break;
                case 4: prompt = `The Debate! Argue with ${partnerName} about how ${narrative} is the core truth. Use your personality. 1-2 sentences.`; break;
                case 5: prompt = `Farewell phase. Say goodbye to ${partnerName}. 1 sentence.`; break;
            }

            const response = await generateResponse(prompt, undefined, systemPrompt);
            if (response.text) {
                const text = response.text.trim().replace(/^"|"$/g, '');
                setMessage(text);
                speak(id as any, text, 'neutral');
                onSpeak?.(id, text);
                setTimeout(() => advanceDialogue(id), 7000);
            }
        } catch (e) {
            console.error("Local Dialogue failed", e);
        } finally {
            setIsThinking(false);
            setTimeout(() => setMessage(null), 8500);
        }
    };

    useEffect(() => {
        if (interactionState?.active) handleDialogue();
    }, [interactionState?.turn, interactionState?.active]);

    const triggerBark = async () => {
        if (isThinking || interactionState?.active) return;
        setIsThinking(true);
        try {
            const prompt = "1 sentence bark.";
            const response = await generateResponse(prompt, undefined, systemPrompt);
            if (response.text) {
                const text = response.text.trim().replace(/^"|"$/g, '');
                setMessage(text);
                speak(id as any, text, 'neutral');
                lastSpeakTime.current = Date.now();
            }
        } catch (e) {} finally {
            setIsThinking(false);
            setTimeout(() => setMessage(null), 8000);
        }
    };

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        registerPosition(id, [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z]);

        const dist = posRef.current.distanceTo(targetPos.current);
        if (dist > 0.3 && !stationary && !interactionState?.active) {
            const dir = targetPos.current.clone().sub(posRef.current).normalize();
            posRef.current.add(dir.clone().multiplyScalar(speed * delta));
            groupRef.current.position.copy(posRef.current);
            setVelocity([dir.x, dir.y, dir.z]);
        } else {
            setVelocity([0, 0, 0]);
        }
    });

    const [isHovered, setIsHovered] = useState(false);

    return (
        <group 
            ref={groupRef}
            position={initialPosition}
            onClick={(e) => { e.stopPropagation(); triggerBark(); onClick?.(); }}
            onPointerOver={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'default'; }}
        >
            {assetType === 'glb' ? (
                id === 'orchestrator' || id === 'emerald_scout' ? (
                    <EmeraldScout scale={scale * 1.5} position={[0, 0, 0]} velocity={velocity} action={velocity[0] !== 0 || velocity[2] !== 0 ? 'walk' : 'idle'} />
                ) : (
                    <MooseBot scale={scale * 0.45} position={[0, 0, 0]} disableAI={true} />
                )
            ) : (
                <EliteAvatar 
                    id={id}
                    assetUrl={assetUrl}
                    assetPrefix={id === 'heman' ? 'heman' : 'mephit_standard'}
                    position={[0, 0, 0]}
                    velocity={velocity}
                    scale={scale}
                    chromaSimilarity={entityData?.chromaKey?.similarity || 0.7}
                />
            )}
            
            {(isHovered || isThinking) && !message && (
                <Html position={[0, 3.2, 0]} center>
                    <div className="bg-black/90 border border-white/40 rounded-full w-8 h-8 flex items-center justify-center text-lg animate-pulse">
                        {isThinking ? '🧠' : '💬'}
                    </div>
                </Html>
            )}

            {message && (
                <Html position={[0, 3.0, 0]} center>
                    <div className="bg-black/95 border-2 border-cyan-500/80 rounded-xl px-4 py-2 text-[12px] text-white font-mono backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.3)] max-w-[250px] leading-tight text-center">
                        <div className="text-[10px] text-cyan-400/50 mb-1 border-b border-cyan-500/20 pb-1 uppercase tracking-tighter">NODE_{id.toUpperCase()}</div>
                        {message}
                    </div>
                </Html>
            )}
        </group>
    );
};
