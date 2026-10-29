import React, { useState, Suspense } from 'react';
import { Box, Text, Html } from '@react-three/drei';
import { TicTacToeSimulation } from '../../Logic/Simulation/TabletopSimulator';
import TelemetryPanel from '../../Mastery/components/Telemetry/TelemetryPanel';
import { ChroniclesPanel } from '../HUDModules/ChroniclesPanel';
import { GlyphFactory } from '../HUDModules/GlyphFactory';
import { IDEPanel } from '../HUDModules/IDEPanel';
import { GitHubPanel } from '../HUDModules/GitHubPanel';

interface VirtualTVProps {
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: number;
    channelAddress?: string;
    onChannelChange?: (addr: string) => void;
}

/**
 * VirtualTV.tsx
 * 
 * A 3D Television screen in the hub that can render different "Channels" (Applets).
 * Address-based switching (e.g. 🜔.🜔 for Tic Tac Toe).
 */
export const VirtualTV: React.FC<VirtualTVProps> = ({ 
    position, rotation, scale = 1, 
    channelAddress = '0.0', 
    onChannelChange 
}) => {
    const [isInputting, setIsInputting] = useState(false);
    const [tempAddress, setTempAddress] = useState('');

    const renderChannel = () => {
        switch (channelAddress) {
            case '🜔.🜔':
            case 'salt.salt':
            case 'ttt':
                return (
                    <group scale={0.4} position={[0, -0.2, 0]}>
                         <TicTacToeSimulation />
                    </group>
                );
            case 'telemetry':
                return (
                    <Html transform distanceFactor={1.5} position={[0, 0, 0]}>
                        <div style={{ width: '800px', height: '500px', pointerEvents: 'auto' }}>
                            <TelemetryPanel />
                        </div>
                    </Html>
                );
            case 'history':
            case 'chronicles':
                return (
                    <Html transform distanceFactor={1.5} position={[0, 0, 0]}>
                        <div style={{ width: '800px', height: '500px', pointerEvents: 'auto' }}>
                            <ChroniclesPanel />
                        </div>
                    </Html>
                );
            case 'sigil':
            case 'glyph':
                return (
                    <Html transform distanceFactor={1.5} position={[0, 0, 0]}>
                        <div style={{ width: '800px', height: '500px', pointerEvents: 'auto' }}>
                            <GlyphFactory />
                        </div>
                    </Html>
                );
            case 'ide':
                return (
                    <Html transform distanceFactor={1.5} position={[0, 0, 0]}>
                        <div style={{ width: '1000px', height: '700px', pointerEvents: 'auto' }}>
                            <IDEPanel />
                        </div>
                    </Html>
                );
            case 'github':
                return (
                    <Html transform distanceFactor={1.5} position={[0, 0, 0]}>
                        <div style={{ width: '850px', height: '650px', pointerEvents: 'auto' }}>
                            <GitHubPanel onClose={() => {}} />
                        </div>
                    </Html>
                );
            case 'log':
                return (
                    <group>
                        <Text color="lime" fontSize={0.06} position={[0, 0.4, 0]}>SYSTEM_LOG_STREAM</Text>
                        <Text color="green" fontSize={0.03} position={[-1.2, 0.2, 0]} anchorX="left">
                            {`> Initializing Aetherial Sync...\n> Connection Stable @ 3000/sse\n> Harvesting Neural Gradients...\n> Log Level: VERBOSE\n> 10 Agents Online\n> Local LLM: Mistral-7B-Instruct-v0.2\n> READY.`}
                        </Text>
                    </group>
                );
            case 'self':
                return <Text color="cyan" fontSize={0.1}>SCANNING_SELF...</Text>;
            default:
                return (
                    <group>
                        <Text color="red" fontSize={0.05} position={[0, 0.1, 0]}>NO_SIGNAL</Text>
                        <Text color="white" fontSize={0.03} position={[0, -0.1, 0]}>ADDR: {channelAddress}</Text>
                    </group>
                );
        }
    };

    const handleSwitch = () => {
        onChannelChange?.(tempAddress);
        setIsInputting(false);
    };

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* TV Frame */}
            <Box args={[3, 2, 0.4]}>
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </Box>
            
            {/* The Screen */}
            <mesh position={[0, 0, 0.21]}>
                <planeGeometry args={[2.8, 1.8]} />
                <meshStandardMaterial 
                    color="#050505" 
                    emissive={channelAddress === '0.0' ? "#000" : "#001122"} 
                    emissiveIntensity={0.5} 
                />
            </mesh>

            {/* Render applet content on screen */}
            <group position={[0, 0, 0.25]}>
                <Suspense fallback={<Text fontSize={0.1}>LOADING...</Text>}>
                    {renderChannel()}
                </Suspense>
            </group>

            {/* Input Hook */}
            <Html position={[0, -1.2, 0]} center>
                <div className="flex flex-col items-center gap-2">
                    {isInputting ? (
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={tempAddress}
                                onChange={(e) => setTempAddress(e.target.value)}
                                placeholder="ENTER ADDR"
                                className="bg-black/80 border border-cyan-500/50 rounded px-2 py-1 text-[10px] text-cyan-400 font-mono outline-none w-32"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSwitch()}
                            />
                            <button 
                                onClick={handleSwitch}
                                className="bg-cyan-500/20 border border-cyan-500/50 px-2 rounded text-[10px] text-cyan-400 font-mono"
                            >
                                SET
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsInputting(true)}
                            className="bg-black/40 hover:bg-black/60 border border-white/10 rounded px-3 py-1 text-[8px] text-white/40 font-mono tracking-widest uppercase transition-all"
                        >
                            Change Channel
                        </button>
                    )}
                </div>
            </Html>
        </group>
    );
};
