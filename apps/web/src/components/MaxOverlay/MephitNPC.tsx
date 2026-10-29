import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { useLpcManifest } from '../../hooks/useLpcManifest';
import { randomizeGenome, defaultGenome } from '../../hooks/useOntologicalGenome';
import { Html } from '@react-three/drei';
import { sendMessageToGemini, parseGeminiResponse } from '../../Thought/services/tutorGeminiService';
import { useCouncil } from '../../council/CouncilContext';
import { useSocial } from '../../social/SocialContext';
import { EmeraldScout } from '../Avatars/EmeraldScout';
import { MooseBot } from '../Avatars/MooseBot';

interface MephitNPCProps {
    id: string;
    initialPosition: [number, number, number];
    bounds: number;
    onSpeak?: (id: string, text: string) => void;
    stationary?: boolean;
    onClick?: () => void;
    onContextMenu?: (e: any) => void;
    llmMode?: boolean;
}

/**
 * MephitNPC.tsx
 * 
 * Logic: Random background population with specific 'Elite' overrides.
 * RESTORED & REFINED: The Tutor (orchestrator) now has the Einstein visual identity.
 */
export const MephitNPC: React.FC<MephitNPCProps> = ({ id, initialPosition, bounds, onSpeak, stationary, onClick, onContextMenu, llmMode = true }) => {
    const manifest = useLpcManifest();
    const { speak } = useCouncil();
    const { manifest: socialManifest, registerPosition, unregisterPosition, getInteractionState, advanceDialogue } = useSocial();

    // Get Manifest Data (Optional)
    const entityData = socialManifest?.entities[id];

    // --- CLEANUP (Zombie Purge) ---
    useEffect(() => {
        return () => {
            unregisterPosition(id);
        };
    }, [id, unregisterPosition]);
    
    const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(...initialPosition));
    const [target, setTarget] = useState<THREE.Vector3>(new THREE.Vector3(...initialPosition));
    const [message, setMessage] = useState<string | null>(null);
    const [action, setAction] = useState<'idle' | 'walk'>('idle');
    const [isThinking, setIsThinking] = useState(false);
    const systemPrompt = entityData?.personality || (id === 'heman' ? "You are He-Man, Master of the Universe." : "You are an Elite Mephit.");
    const assetUrl = entityData?.assetUrl || (id === 'heman' ? "/assets/heman_walk_pro.gif" : undefined);
    const assetType = entityData?.assetType || (id === 'moosebot' ? 'glb' : 'gif');
    const scale = entityData?.scale || (id === 'heman' ? 1.2 : 0.3);
    
    const lastSpeakTime = useRef(Date.now());
    const speed = 2.5;

    const interactionState = getInteractionState(id);

    // --- EINSTEIN MANIFESTATION (Logic Correction) ---
    const genome = useMemo(() => {
        if (!manifest || Object.keys(manifest).length === 0) return defaultGenome;

        if (id === 'orchestrator') {
            return {
                ...defaultGenome,
                body: 'body/bodies/body_bodies_male.png',
                hair: 'hair/jewfro/hair_jewfro_adult_gray.png', // Corrected Einstein Look
                legs: 'legs/pants/legs_pants_male_brown.png', // Scholarly Brown
                torso: 'torso/clothes/torso_clothes_longsleeve_formal_male_white.png', // Lab Shirt
                facial: 'none', // Can add big moustache if available in manifest
                head: 'head/nose/head_nose_straight_adult.png',
                eyes: 'eyes/human/eyes_human_adult_blue.png'
            };
        }
        return randomizeGenome(manifest);
    }, [manifest, id]);

    // Movement AI
    useEffect(() => {
        if (stationary || interactionState?.active) return;
        const moveInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                const nextTarget = new THREE.Vector3(
                    ((Math.random() - 0.5) * bounds * 0.8) + initialPosition[0],
                    0.1,
                    ((Math.random() - 0.5) * bounds * 0.8) + initialPosition[2]
                );
                setTarget(nextTarget);
                setAction('walk');
            } else {
                setAction('idle');
            }
        }, 5000 + Math.random() * 5000);
        return () => clearInterval(moveInterval);
    }, [bounds, stationary, initialPosition, interactionState?.active]);

    // Social Interaction Registry
    useFrame((state, delta) => {
        registerPosition(id, [position.x, position.y, position.z]);

        if (action === 'walk' && !stationary && !interactionState?.active) {
            const dist = position.distanceTo(target);
            if (dist > 0.1) {
                const dir = target.clone().sub(position).normalize();
                const nextPos = position.clone().add(dir.multiplyScalar(speed * delta));
                setPosition(nextPos);
            } else {
                setAction('idle');
            }
        }
    });

    // Dialogue Logic
    const handleDialogue = async () => {
        if (isThinking || !interactionState?.active) return;
        setIsThinking(true);
        try {
            const turn = interactionState.turn;
            const prompt = `Turn ${turn}: Socratic orientation on ${interactionState.topicPillar}. Narrative: ${interactionState.relationshipNarrative}. 1 sentence.`;
            const response = await sendMessageToGemini([], prompt);
            if (response.text) {
                const parsed = parseGeminiResponse(response.text);
                setMessage(parsed.cleanText);
                speak(id as any, parsed.cleanText, 'neutral');
                onSpeak?.(id, parsed.cleanText);
                setTimeout(() => advanceDialogue(id), 8000);
            }
        } catch (e) {} finally {
            setIsThinking(false);
            setTimeout(() => setMessage(null), 10000);
        }
    };

    useEffect(() => {
        if (interactionState?.active) handleDialogue();
    }, [interactionState?.turn, interactionState?.active]);

    // --- RESONANCE LINK REACTIVITY ---
    useEffect(() => {
        const handleBehaviorShift = (e: any) => {
            const { npcId, behavior, reason } = e.detail;
            if (npcId === id) {
                console.log(`[NPC_${id}] Exogenous behavior shift: ${behavior} - ${reason}`);
                setMessage(reason);
                if (behavior === 'flee') {
                    setAction('walk');
                    // Pick a random target far away
                    setTarget(new THREE.Vector3(
                        (Math.random() - 0.5) * bounds * 2,
                        0.1,
                        (Math.random() - 0.5) * bounds * 2
                    ));
                    speak(id as any, reason, 'alarmed');
                }
            }
        };

        window.addEventListener('NPC_BEHAVIOR_SHIFT', handleBehaviorShift);
        return () => window.removeEventListener('NPC_BEHAVIOR_SHIFT', handleBehaviorShift);
    }, [id, bounds, speak]);

    const triggerBark = async () => {
        if (isThinking || interactionState?.active) return;
        setIsThinking(true);
        setMessage("...");
        try {
            const prompt = id === 'orchestrator' 
                ? "Brief tutorial/Socratic orientation on MyOS. 1 sentence."
                : "Brief atmospheric NPC thought. 1 sentence.";
            const response = await sendMessageToGemini([], prompt);
            if (response.text) {
                const parsed = parseGeminiResponse(response.text);
                setMessage(parsed.cleanText);
                speak(id as any, parsed.cleanText, 'neutral');
                onSpeak?.(id, parsed.cleanText);
            }
        } catch (e) {
            setMessage("Aether link glitched.");
        } finally {
            setIsThinking(false);
            setTimeout(() => setMessage(null), 10000);
        }
    };

    const [isHovered, setIsHovered] = useState(false);

    return (
        <group 
            position={position.toArray() as [number, number, number]}
            onClick={(e) => { e.stopPropagation(); triggerBark(); onClick?.(); }}
            onPointerOver={() => { setIsHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'default'; }}
        >
            {id === 'orchestrator' || id === 'emerald_scout' ? (
                <EmeraldScout 
                    scale={scale * 1.5} 
                    position={[0, 0, 0]} 
                    velocity={action === 'walk' ? [target.x - position.x, 0, target.z - position.z] : [0, 0, 0]}
                    action={action === 'walk' ? 'walk' : 'idle'} 
                />
            ) : (
                <SemanticAvatar
                    pillarName="Mephit"
                    pillarIndex={10}
                    position={[0, 0, 0]}
                    velocity={[0, 0, 0]}
                    cameraRotationY={0}
                    action={action}
                    scale={scale}
                    genome={genome}
                />
            )}
            {(isHovered || isThinking) && !message && (
                <Html position={[0, 3.0, 0]} center>
                    <div className="bg-black/90 border border-white/40 rounded-full w-8 h-8 flex items-center justify-center text-lg animate-pulse">
                        {isThinking ? '🧠' : '💬'}
                    </div>
                </Html>
            )}
            {message && (
                <Html position={[0, 2.8, 0]} center>
                    <div className="bg-black/95 border-2 border-cyan-500/80 rounded-xl px-4 py-2 text-[12px] text-cyan-300 font-mono backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.3)] max-w-[250px] leading-tight text-center">
                        <div className="text-[10px] text-cyan-500/50 mb-1 border-b border-cyan-500/20 pb-1 uppercase tracking-tighter">NODE_{id.toUpperCase()}</div>
                        {message}
                    </div>
                </Html>
            )}
        </group>
    );
};
