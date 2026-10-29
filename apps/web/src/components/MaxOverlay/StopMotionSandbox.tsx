import React, { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { PILLAR_CLASSES } from '../../utils/pillarClasses';

interface FrameState {
    id: string;
    position: [number, number, number];
    velocity: [number, number, number];
    action: string;
    timestamp: number;
}

export const StopMotionSandbox: React.FC = () => {
    const [frames, setFrames] = useState<FrameState[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [activePillar] = useState<string>('self');
    const [isStaccato, setIsStaccato] = useState(false);
    const [shadingStyle, setShadingStyle] = useState<'bold' | 'default' | 'none'>('bold');
    
    const [currentPos, setCurrentPos] = useState<[number, number, number]>([0, 0, 0]);
    
    const captureFrame = () => {
        const newFrame: FrameState = {
            id: `frame-${Date.now()}`,
            position: [...currentPos],
            velocity: [0, 0, 0],
            action: 'idle',
            timestamp: Date.now()
        };
        setFrames(prev => [...prev, newFrame]);
    };

    const clearFrames = () => {
        setFrames([]);
        setIsPlaying(false);
        setPlaybackTime(0);
    };

    // Interpolation Logic
    const getInterpolatedState = (time: number): { position: [number, number, number], velocity: [number, number, number] } => {
        if (frames.length === 0) return { position: currentPos, velocity: [0, 0, 0] };
        if (frames.length === 1) return { position: frames[0].position, velocity: [0, 0, 0] };

        const totalFrames = frames.length;
        const durationPerFrame = 0.5; 
        const totalDuration = (totalFrames - 1) * durationPerFrame;
        
        let pTime = time % (totalDuration || 1);
        
        // --- Harryhausen Staccato Effect ---
        if (isStaccato) {
            const fps = 8; 
            pTime = Math.floor(pTime * fps) / fps;
        }

        const frameIndex = Math.floor(pTime / durationPerFrame);
        const nextFrameIndex = (frameIndex + 1) % totalFrames;
        const alpha = (pTime % durationPerFrame) / durationPerFrame;

        const f1 = frames[frameIndex];
        const f2 = frames[nextFrameIndex];

        const lerpedPos: [number, number, number] = [
            f1.position[0] + (f2.position[0] - f1.position[0]) * alpha,
            f1.position[1] + (f2.position[1] - f1.position[1]) * alpha,
            f1.position[2] + (f2.position[2] - f1.position[2]) * alpha
        ];

        return { position: lerpedPos, velocity: [0, 0, 0] };
    };

    return (
        <div className="fixed inset-0 flex flex-col bg-black/60 backdrop-blur-md z-[20000] p-8 text-white">
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Stop Motion Studio 🎞️
                    </h1>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs opacity-60">Harryhausen / Bakshi Mode Engaged</span>
                        {isPlaying && <span className="text-[10px] text-blue-400 animate-pulse font-mono">REC: {playbackTime.toFixed(2)}s</span>}
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => setIsStaccato(!isStaccato)} 
                        className={`px-3 py-1 rounded text-xs transition-colors border ${isStaccato ? 'bg-orange-600 border-orange-400' : 'bg-transparent border-white/20'}`}
                    >
                        Staccato
                    </button>
                    <select 
                        value={shadingStyle} 
                        onChange={(e) => setShadingStyle(e.target.value as any)}
                        className="bg-gray-800 text-xs px-2 py-1 rounded border border-white/20"
                    >
                        <option value="bold">Bold Inking</option>
                        <option value="default">Thin Borders</option>
                        <option value="none">Raw Pixel</option>
                    </select>
                    <button onClick={captureFrame} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors">
                        Capture Frame ({frames.length})
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className={`px-4 py-2 rounded-lg transition-colors ${isPlaying ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {isPlaying ? 'Stop Playback' : 'Start Studio Record'}
                    </button>
                    <button onClick={clearFrames} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                        Clear
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('close-sandbox'))} className="text-2xl hover:text-red-400 transition-colors">&times;</button>
                </div>
            </div>

            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900/40">
                <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} intensity={1.5} castShadow />

                    
                    <SandboxScene 
                        isPlaying={isPlaying} 
                        frames={frames} 
                        currentPos={currentPos}
                        activePillar={activePillar}
                        onPlaybackUpdate={setPlaybackTime}
                        getInterpolatedState={getInterpolatedState}
                        shadingStyle={shadingStyle}
                    />

                    <OrbitControls />
                    <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                </Canvas>

                {!isPlaying && (
                    <div className="absolute bottom-4 left-4 p-4 bg-black/80 rounded-xl border border-white/20 flex flex-col gap-2 min-w-[200px]">
                        <div className="flex justify-between items-center text-xs opacity-60">
                            <span>TRANSFORM</span>
                            <span>{currentPos[0].toFixed(1)}, {currentPos[2].toFixed(1)}</span>
                        </div>
                        <label className="text-xs">Position X</label>
                        <input type="range" min="-10" max="10" step="0.1" value={currentPos[0]} onChange={e => setCurrentPos([parseFloat(e.target.value), currentPos[1], currentPos[2]])} />
                        <label className="text-xs">Position Z</label>
                        <input type="range" min="-10" max="10" step="0.1" value={currentPos[2]} onChange={e => setCurrentPos([currentPos[0], currentPos[1], parseFloat(e.target.value)])} />
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto p-2 bg-black/20 rounded-xl border border-white/5">
                {frames.map((f, i) => (
                    <div key={f.id} className="min-w-[120px] h-20 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="text-[10px] uppercase tracking-widest opacity-40">Keyframe {i+1}</span>
                        <span className="text-xs font-mono">X:{f.position[0].toFixed(1)} Z:{f.position[2].toFixed(1)}</span>
                    </div>
                ))}
                {frames.length === 0 && <div className="p-4 text-xs opacity-30 italic">No frames captured. Position the avatar and click 'Capture Frame'.</div>}
            </div>
        </div>
    );
};

interface SceneProps {
    isPlaying: boolean;
    frames: FrameState[];
    currentPos: [number, number, number];
    activePillar: string;
    onPlaybackUpdate: (t: number) => void;
    getInterpolatedState: (t: number) => { position: [number, number, number], velocity: [number, number, number] };
    shadingStyle: 'bold' | 'default' | 'none';
}

const SandboxScene: React.FC<SceneProps> = ({ isPlaying, frames, currentPos, activePillar, onPlaybackUpdate, getInterpolatedState, shadingStyle }) => {
    const [renderState, setRenderState] = useState<{ position: [number, number, number], velocity: [number, number, number] }>({
        position: currentPos,
        velocity: [0, 0, 0]
    });

    useFrame((_state) => {
        if (isPlaying) {
            const time = _state.clock.getElapsedTime();
            onPlaybackUpdate(time);
            setRenderState(getInterpolatedState(time));
        } else {
            setRenderState({ position: currentPos, velocity: [0, 0, 0] });
        }
    });

    return (
        <group>
            <SemanticAvatar 
                pillarName={activePillar} 
                pillarIndex={0} 
                position={renderState.position} 
                velocity={renderState.velocity}
                genome={PILLAR_CLASSES[activePillar as keyof typeof PILLAR_CLASSES]}
                inkStyle={shadingStyle} // Passing new prop
            />
            
            {!isPlaying && frames.map((f) => (
                <group key={f.id} position={f.position}>
                    <mesh position={[0, -0.05, 0]}>
                        <boxGeometry args={[0.8, 0.02, 0.8]} />
                        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};
