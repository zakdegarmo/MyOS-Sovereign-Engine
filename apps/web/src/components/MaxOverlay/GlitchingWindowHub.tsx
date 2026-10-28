import React, { useMemo, useState } from 'react';
import { Box, Html } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';
import { NexusTerminal3D } from '../HUDModules/NexusTerminal3D';
import { MephitNPC } from './MephitNPC';
import { useCouncil } from '../../council/CouncilContext';
import { SocialProvider } from '../../social/SocialContext';
import { useWorld } from '../../engine/WorldContext';
import { VirtualTV } from './VirtualTV';
import { MicroChat } from './MicroChat';
import { MooseBot } from '../Avatars/MooseBot';
import { MaxAvatar } from '../Avatars/MaxAvatar';
import { EliteMephitNPC } from './EliteMephitNPC';
import { Beer, Tv, LogOut, AlertTriangle } from 'lucide-react';

// Defensive Substrate: Error Boundary for fragile 3D/UI components
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("[GLITCH] Component Failure:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-2xl flex items-center gap-3 backdrop-blur-xl">
                    <AlertTriangle size={16} className="text-red-400" />
                    <span className="text-[10px] text-red-200 uppercase font-bold tracking-tighter">Module Critical Failure - Check Logs</span>
                </div>
            );
        }
        return this.props.children;
    }
}

interface GlitchingWindowHubProps {
    onTerminalActivate: () => void;
}

/**
 * HubContent.tsx 
 * 
 * RESTORED: All original population entities are back. 
 * Integrated with SocialProvider as a background layer.
 */
const HubContent: React.FC<GlitchingWindowHubProps> = ({ onTerminalActivate }) => {
    const FLOOR_SIZE = 40;
    const { speak, setActiveAgent } = useCouncil();
    const [channelAddress] = useState('🜔.🜔');
    const [showBartenderChat, setShowBartenderChat] = useState(false);

    // RESTORED: Random population array
    const mephits = useMemo(() => {
        const count = 5;
        return Array.from({ length: count }).map((_, i) => ({
            id: `mephit-${i}`,
            pos: [(Math.random() - 0.5) * FLOOR_SIZE * 0.7, 0, (Math.random() - 0.5) * FLOOR_SIZE * 0.7] as [number, number, number]
        }));
    }, [FLOOR_SIZE]);

    const bartenderMenu = [
        { label: "What's on the tube?", icon: <Tv size={12} />, action: () => alert(`Bartender: "That's ${channelAddress}."`) },
        { label: "Order a Binary Ale", icon: <Beer size={12} />, action: () => alert("Bartender: *Slides a mug across.*") },
        { label: "Leave", icon: <LogOut size={12} />, action: () => handleReturn() },
        { label: "Nevermind", icon: <LogOut size={12} />, action: () => setShowBartenderChat(false) }
    ];

    const { stashedDimension, swapDimension } = useWorld();
    const handleReturn = () => {
        if (stashedDimension) {
            swapDimension(stashedDimension);
        } else {
            swapDimension('faerun'); // Fallback
        }
    };

    return (
        <group name="GlitchingWindowHub">
            {/* FLOORS & WALLS */}
            <mesh name="tactical-floor" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
                <meshStandardMaterial color="#020202" roughness={0.95} metalness={0.05} />
            </mesh>

            {/* Tactical Grid Overlay Removed per User Request */}
            
            {/* CENTRAL ANCHOR */}
            <group position={[0, 0, 0]}>
                <NexusTerminal3D position={[0, 0.5, 0]} scale={1.8} isActive={true} onActivate={onTerminalActivate} />
                <Box args={[1.5, 0.8, 1.5]} position={[0, -0.1, 0]}>
                    <meshStandardMaterial color="#111" metalness={1} roughness={0} emissive="#00ffff" emissiveIntensity={0.1} />
                </Box>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                    <ringGeometry args={[1.8, 2.0, 32]} />
                    <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={4} transparent opacity={0.6} />
                </mesh>
            </group>

            {/* CYBERPUNK BAR */}
            <group position={[-14, 0, -12]}>
                <Box args={[18, 1.3, 1.8]} position={[4, 0.65, 0]} onClick={(e) => { e.stopPropagation(); setShowBartenderChat(true); }}>
                    <meshStandardMaterial color="#050505" />
                </Box>
                
                {/* RESTORED: Original Bartender instance */}
                <MephitNPC 
                    id="bartender"
                    initialPosition={[4, 0, -1.8]}
                    bounds={0} 
                    stationary={true}
                    onSpeak={(id, text) => speak(id as any, text, 'neutral')}
                    onClick={() => setShowBartenderChat(true)}
                />
            </group>

            {/* NPC POPULATION: RESTORED ORIGINAL ENSEMBLE */}
            <EliteMephitNPC 
                id="heman"
                initialPosition={[0, 0, 8]}
                bounds={10}
                onSpeak={(id, text) => speak(id as any, text, 'neutral')}
            />

            <MephitNPC 
                id="orchestrator" 
                initialPosition={[8, 0, -4]} 
                bounds={0}
                stationary={true}
                onSpeak={(id, text) => speak(id as any, text, 'neutral')} 
                onClick={() => setActiveAgent('orchestrator')}
            />

            {/* RESTORED: Max Avatar */}
            <MaxAvatar position={[-8, 0, 2]} scale={0.8} />

            {/* RESTORED: MooseBot */}
            <MooseBot scale={0.65} position={[-6, 0.4, -2]} />

            {/* RESTORED: Random Background Mephits */}
            {mephits.map((m) => (
                <MephitNPC 
                    key={m.id} 
                    id={m.id} 
                    initialPosition={m.pos} 
                    bounds={FLOOR_SIZE} 
                    onSpeak={(id, text) => speak(id as any, text, 'neutral')} 
                    onClick={() => setActiveAgent(m.id as any)}
                />
            ))}

            <VirtualTV position={[-12.5, 5, -14.5]} rotation={[0, 0.2, 0]} scale={1.8} channelAddress={channelAddress} />

            {/* UI Overlays */}
            <Html>
                <AnimatePresence>
                    {showBartenderChat && (
                        <ErrorBoundary>
                            <MicroChat 
                                id="bartender"
                                name="The Bartender"
                                title="Keeper of the Local Graph"
                                initialGreeting="Welcome back."
                                lore={["Experienced mixologist of data streams", "Has seen every glitch in the sector", "Knows the way to the real world"]}
                                menuOptions={bartenderMenu}
                                onClose={() => setShowBartenderChat(false)}
                            />
                        </ErrorBoundary>
                    )}
                </AnimatePresence>
            </Html>

            <pointLight position={[0, 8, 0]} intensity={1.5} color="#00ffff" />
            <pointLight position={[-10, 5, -10]} intensity={2} color="#ff00ff" />
            
            {/* RETURN PORTAL */}
            <group position={[0, 0, 15]} onClick={handleReturn}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.5, 1.8, 32]} />
                    <meshStandardMaterial color="#f4d03f" emissive="#f4d03f" emissiveIntensity={5} transparent opacity={0.8} />
                </mesh>
                <Html position={[0, 1, 0]} center>
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1 border border-yellow-500/50 rounded-lg">
                        <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">[ LEAVE JUNCTION ]</span>
                    </div>
                </Html>
            </group>

            <ambientLight intensity={0.2} />
        </group>
    );
};

export const GlitchingWindowHub: React.FC<GlitchingWindowHubProps> = (props) => (
    <HubContent {...props} />
);
