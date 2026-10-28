import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { useAILocomotion } from '../../hooks/useAILocomotion';
import { type AgentId } from '../../council/agentRegistry';
import { useCouncil } from '../../council/CouncilContext';
import { AnimatePresence, motion } from 'framer-motion';
import { topographyRegistry } from '../../engine/TopographyRegistry';

export type LocomotionState = 'Idle' | 'Walking' | 'Talking';

interface RiggedAIBuddyProps {
    agentId?: AgentId;
    position?: [number, number, number];
    scale?: number;
    testScript?: boolean; // If true, ignore AI and just run a test animation sequence
}

export const RiggedAIBuddy: React.FC<RiggedAIBuddyProps> = ({
    agentId = 'orchestrator', // Default to the main AI personality
    position = [0, 0, 0],
    scale = 0.65,
    testScript = false
}) => {
    const { scene, animations } = useGLTF('/models/max/moose-bot.glb');
    const { actions, names } = useAnimations(animations, scene);
    const groupRef = useRef<THREE.Group>(null);

    // AI Locomotion Engine
    const ai = useAILocomotion({
        agentId,
        basePosition: position,
        enabled: !testScript, // Disable cognitive AI if we are just testing rigging
        speed: 2.0
    });

    const [testState, setTestState] = useState<LocomotionState>('Idle');
    const currentState = testScript ? testState : ai.locomotionState;
    
    const { agentMessages } = useCouncil();
    const currentMsg = agentMessages?.[agentId];
    // Show bubble if there is a message and it's less than 10 seconds old
    const showBubble = currentMsg && (Date.now() - currentMsg.timestamp < 10000);
    
    const [debugText, setDebugText] = useState('Booting...');

    // Handle Animation State Changes with Crossfading
    useEffect(() => {
        if (!actions || names.length === 0) return;

        // Find the best match for the requested state
        let animNameToPlay = names[0]; // Fallback to first
        
        if (currentState === 'Idle') {
            animNameToPlay = names.includes('Boom_Dance') ? 'Boom_Dance' : names[0];
        } else if (currentState === 'Walking') {
            animNameToPlay = names.includes('Walking') ? 'Walking' : names.find(n => n.toLowerCase().includes('walk')) || names[0];
        } else if (currentState === 'Talking') {
            animNameToPlay = names.includes('Boxing_Practice') ? 'Boxing_Practice' : names[0];
        }

        const action = actions[animNameToPlay];
        if (action) {
            Object.values(actions).forEach(a => {
                if (a && a !== action) a.fadeOut(0.5);
            });
            action.reset().fadeIn(0.5).play();
            setDebugText(`[${agentId.toUpperCase()}] State: ${currentState} | Anim: ${animNameToPlay}`);
        }
    }, [currentState, actions, names, agentId]);

    // Test Script Logic (Fallback)
    useEffect(() => {
        if (!testScript) return;
        
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step === 1) setTestState('Walking');
            else if (step === 2) setTestState('Talking');
            else if (step === 3) {
                setTestState('Idle');
                step = 0;
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [testScript]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        
        // Float slightly just like old Moose-Bot
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        
        if (testScript && currentState === 'Walking') {
            groupRef.current.position.z += delta * 1.5;
            groupRef.current.rotation.y += delta * 0.5;
        } else if (!testScript) {
            // Apply AI Locomotion Output
            groupRef.current.position.x = ai.position[0];
            groupRef.current.position.z = ai.position[2];

            // Ensure the inner group's global Y matches the actual ground at its current global X/Z
            groupRef.current.updateMatrixWorld(true);
            const worldPos = new THREE.Vector3();
            groupRef.current.getWorldPosition(worldPos);
            const groundY = topographyRegistry.getElevation(worldPos.x, worldPos.z);
            const outerY = worldPos.y - groupRef.current.position.y;
            groupRef.current.position.y = groundY - outerY;
            
            groupRef.current.rotation.x = ai.rotation[0];
            groupRef.current.rotation.y = ai.rotation[1];
            groupRef.current.rotation.z = ai.rotation[2];
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Chat Bubble & Debug Label */}
            <Html position={[0, 2.5, 0]} center zIndexRange={[100, 0]}>
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <AnimatePresence>
                        {showBubble && currentMsg?.text && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                className="bg-black/80 text-white p-3 rounded-2xl rounded-bl-sm border border-cyan-500/50 max-w-[200px] text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md"
                            >
                                {currentMsg.text}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="bg-black/80 px-2 py-1 rounded border border-cyan-500/30 font-mono text-[9px] text-cyan-400 whitespace-nowrap">
                        {debugText}
                    </div>
                </div>
            </Html>
            <primitive 
                object={scene} 
                scale={[scale, scale, scale]}
                position={[0, -0.15, 0]}
            />
        </group>
    );
};

useGLTF.preload('/models/max/moose-bot.glb');
