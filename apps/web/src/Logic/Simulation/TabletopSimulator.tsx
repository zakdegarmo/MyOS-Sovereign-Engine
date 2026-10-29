import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Center, Text, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { SemanticAvatar } from '../../components/Avatars/SemanticAvatar';
import { useAgentGamePlay } from '../../hooks/useAgentGamePlay';

const TicTacToeBoard = ({ board }: { board: (string | null)[] }) => {
    return (
        <group position={[0, -0.04, 0]}>
            {/* Grid Lines */}
            <mesh position={[0, 0, 0.15]}>
                <boxGeometry args={[1.2, 0.01, 0.02]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0, -0.2]}>
                <boxGeometry args={[1.2, 0.01, 0.02]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0.15, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[1.2, 0.01, 0.02]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[-0.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[1.2, 0.01, 0.02]} />
                <meshStandardMaterial color="#334155" />
            </mesh>

            {board.map((cell, i) => {
                const x = (i % 3) - 1;
                const z = Math.floor(i / 3) - 1;
                const posX = x * 0.4 - 0.02;
                const posZ = z * 0.4 - 0.02;
                
                return (
                    <group key={i} position={[posX, 0.02, posZ]}>
                        {cell && (
                            <Text
                                position={[0, 0.01, 0]}
                                rotation={[-Math.PI / 2, 0, 0]}
                                fontSize={0.25}
                                color={cell === 'X' ? '#22d3ee' : '#f43f5e'}
                                anchorX="center"
                                anchorY="middle"
                            >
                                {cell}
                            </Text>
                        )}
                    </group>
                );
            })}
        </group>
    );
};

export const TicTacToeSimulation = () => {
    const { 
        board, currentMoveAgent, dialogue, winner, isThinking, resetGame, triggerAiTurn 
    } = useAgentGamePlay();

    useEffect(() => {
        let mounted = true;
        if (!winner && !isThinking) {
            const timer = setTimeout(() => {
                if (mounted) triggerAiTurn();
            }, 4000);
            return () => {
                mounted = false;
                clearTimeout(timer);
            };
        }
    }, [currentMoveAgent, winner, isThinking, triggerAiTurn]);

    return (
        <group>
            <ambientLight intensity={0.4} />
            <spotLight position={[5, 10, 5]} intensity={0.8} penumbra={1} castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.5} />
            
            <Grid 
                infiniteGrid 
                fadeDistance={10} 
                fadeStrength={5} 
                sectionSize={1} 
                sectionColor="#0ea5e9" 
                cellColor="#1e293b" 
            />
            
            <Center position={[0, 0, 0]}>
                <mesh position={[0, -0.1, 0]} receiveShadow>
                    <boxGeometry args={[2.5, 0.1, 2]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.5} />
                </mesh>
                
                <TicTacToeBoard board={board} />
                
                <SemanticAvatar 
                    pillarIndex={2} pillarName="logic" position={[-0.9, 0, 0]} 
                    cameraRotationY={0} scale={0.9}
                    action={currentMoveAgent === 'A' && isThinking ? 'spellcast' : 'idle'}
                />
                
                <SemanticAvatar 
                    pillarIndex={5} pillarName="existence" position={[0.9, 0, 0]} 
                    cameraRotationY={0} scale={0.9}
                    action={currentMoveAgent === 'B' && isThinking ? 'spellcast' : 'idle'}
                />
            </Center>

            <Html position={[0, -0.8, 0]} center transform scale={0.2}>
                <div className="flex flex-col items-center gap-12 w-[1200px]">
                     <div className="flex items-center gap-4 bg-black/80 px-8 py-4 rounded-full border border-white/20">
                        <div className={`w-4 h-4 rounded-full ${isThinking ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'}`} />
                        <span className="text-2xl font-mono text-white/70 uppercase tracking-[0.5em]">
                            {winner ? "SIMULATION CONCLUDED" : (isThinking ? "REASONING..." : "AGENTIC SANDBOX ACTIVE")}
                        </span>
                    </div>

                    <div className="flex justify-between w-full">
                        <AnimatePresence mode="wait">
                            <motion.div key={dialogue['A'] || 'idle-a'} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-slate-900/95 p-8 rounded-3xl border border-cyan-500/30 max-w-[400px]">
                                    <div className="text-xs font-mono text-cyan-400 uppercase mb-2">Logic Prime</div>
                                    <div className="text-xl text-white italic">"{dialogue['A']}"</div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            <motion.div key={dialogue['B'] || 'idle-b'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-slate-900/95 p-8 rounded-3xl border border-rose-500/30 max-w-[400px] text-right">
                                    <div className="text-xs font-mono text-rose-400 uppercase mb-2">System Arbiter</div>
                                    <div className="text-xl text-white italic">"{dialogue['B']}"</div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {winner && (
                         <button onClick={resetGame} className="bg-cyan-500 px-12 py-4 rounded-xl font-bold text-xl uppercase tracking-widest text-black shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all active:scale-95">
                             {winner === 'Draw' ? 'RESTART' : `${winner.toUpperCase()} WON / RESET`}
                         </button>
                    )}
                </div>
            </Html>
        </group>
    );
};

export const TabletopSimulator = () => {
    return (
        <div className="w-full h-full relative bg-slate-950 font-sans overflow-hidden">
            <Canvas camera={{ position: [0, 1.5, 2], fov: 50 }}>
                <TicTacToeSimulation />
                <OrbitControls makeDefault minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.8} enableZoom={true} minDistance={1.5} maxDistance={4} />
            </Canvas>
        </div>
    );
};
