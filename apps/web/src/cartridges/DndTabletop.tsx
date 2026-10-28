/**
 * DndTabletop.tsx
 * 
 * An AI-orchestrated tactical D&D Virtual Tabletop (VTT) cartridge.
 * Features a terraced 3D hexagonal grid, player and goblin tokens,
 * interactive movement, sound synthesis via Tone.js, and local Ollama gemma4 integration
 * with a robust client-side fallback system.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as Tone from 'tone';
import { Heart, MapPin, Swords, RotateCcw, AlertTriangle, Send, Volume2, User, Sparkles } from 'lucide-react';
import type { CartridgeProps } from './Cartridge';
import { ProceduralRig } from '../components/Avatars/ProceduralRig';
import { AvatarCreator } from '../components/Avatars/AvatarCreator';

// --- Sub-components for R3F Canvas ---

// Floating indicator for tokens (diamond shape)
const FloatingIndicator: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
    const meshRef = useRef<any>(null);
    
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 2.5;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 3) * 0.08;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <coneGeometry args={[0.12, 0.28, 4]} />
            <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.8} 
                metalness={0.9} 
                roughness={0.1} 
            />
        </mesh>
    );
};

// --- Genomes for tokens ---
const DEFAULT_PLAYER_GENOME = {
    id: 'user_vtt_token',
    archetype: 'Warrior',
    animation: 'idle',
    colors: {
        skin: '#f1c27d',
        hair: '#4b2c20',
        primary: '#00e5ff',
        secondary: '#008888',
        accent: '#222222'
    },
    dimensions: {
        head: [1, 1, 1],
        torso: [1, 1, 1],
        pelvis: [1, 1, 1],
        upperArm: [1, 1, 1],
        lowerArm: [1, 1, 1],
        hands: [1, 1, 1],
        upperLeg: [1, 1, 1],
        lowerLeg: [1, 1, 1],
        feet: [1, 1, 1]
    }
};

const GOBLIN_GENOME = {
    id: 'goblin_vtt_token',
    archetype: 'Rogue',
    animation: 'idle',
    colors: {
        skin: '#76ff03',
        hair: '#616161',
        primary: '#3e2723',
        secondary: '#212121',
        accent: '#000000'
    },
    dimensions: {
        head: [1.1, 0.9, 1.1],
        torso: [0.8, 0.8, 0.75],
        pelvis: [0.85, 0.75, 0.8],
        upperArm: [0.75, 0.85, 0.75],
        lowerArm: [0.7, 0.8, 0.7],
        upperLeg: [0.8, 0.8, 0.8],
        lowerLeg: [0.75, 0.8, 0.75],
        hands: [1, 1, 1],
        feet: [1, 1, 1]
    }
};

// --- Main Cartridge Component ---
const DndTabletop: React.FC<CartridgeProps> = () => {
    // Game States
    const [playerPos, setPlayerPos] = useState({ col: 2, row: 2 });
    const [goblinPos, setGoblinPos] = useState({ col: 5, row: 5 });
    
    const [playerGenome, setPlayerGenome] = useState<any>(() => {
        try {
            const saved = localStorage.getItem('myos_user_gestalt');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.genome) return parsed.genome;
            }
        } catch (e) {}
        return DEFAULT_PLAYER_GENOME;
    });
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    useEffect(() => {
        const handleGestaltUpdate = (e: any) => {
            if (e.detail?.genome) {
                setPlayerGenome(e.detail.genome);
            }
        };
        window.addEventListener('myos_update_gestalt', handleGestaltUpdate);
        return () => window.removeEventListener('myos_update_gestalt', handleGestaltUpdate);
    }, []);
    
    const [playerHp, setPlayerHp] = useState(50);
    const [maxPlayerHp] = useState(50);
    const [goblinHp, setGoblinHp] = useState(30);
    const [maxGoblinHp] = useState(30);
    
    const [playerClass, setPlayerClass] = useState('Warrior');
    const [actionText, setActionText] = useState('');
    const [isPending, setIsPending] = useState(false);
    
    const [turnLog, setTurnLog] = useState<Array<{ sender: 'System' | 'Player' | 'DM', text: string, timestamp: string }>>([
        { sender: 'System', text: 'Encounter initialized. The dungeon room hums with static charge. Command the battlefield.', timestamp: new Date().toLocaleTimeString() }
    ]);
    
    const [isOfflineMode, setIsOfflineMode] = useState(true);
    const [audioInitialized, setAudioInitialized] = useState(false);
    const [hoveredCell, setHoveredCell] = useState<{ col: number, row: number } | null>(null);
    
    const logEndRef = useRef<HTMLDivElement>(null);

    // Dynamic Tone.js Sound Player
    const safePlaySound = async (type: 'move' | 'attack' | 'heal' | 'dice' | 'victory' | 'defeat') => {
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
                setAudioInitialized(true);
            }
            
            const synth = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
            }).toDestination();
            
            if (type === 'move') {
                synth.triggerAttackRelease('E5', '16n');
            } else if (type === 'attack') {
                synth.triggerAttackRelease('F4', '12n');
                setTimeout(() => {
                    const lowSynth = new Tone.Synth({
                        oscillator: { type: 'sawtooth' },
                        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
                    }).toDestination();
                    lowSynth.triggerAttackRelease('C3', '8n');
                }, 80);
            } else if (type === 'heal') {
                synth.triggerAttackRelease('C5', '16n');
                setTimeout(() => synth.triggerAttackRelease('G5', '16n'), 60);
                setTimeout(() => synth.triggerAttackRelease('C6', '8n'), 120);
            } else if (type === 'dice') {
                const drum = new Tone.MembraneSynth().toDestination();
                drum.triggerAttackRelease('E2', '16n');
                setTimeout(() => drum.triggerAttackRelease('A2', '16n'), 50);
                setTimeout(() => drum.triggerAttackRelease('C3', '8n'), 100);
            } else if (type === 'victory') {
                const poly = new Tone.PolySynth(Tone.Synth).toDestination();
                poly.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '4n');
                setTimeout(() => poly.triggerAttackRelease(['E4', 'G4', 'B4', 'E5'], '4n'), 200);
                setTimeout(() => poly.triggerAttackRelease(['G4', 'B4', 'D5', 'G5'], '2n'), 400);
            } else if (type === 'defeat') {
                const poly = new Tone.PolySynth(Tone.Synth).toDestination();
                poly.triggerAttackRelease(['B3', 'D4', 'Gb4'], '4n');
                setTimeout(() => poly.triggerAttackRelease(['A3', 'C4', 'E4'], '4n'), 250);
                setTimeout(() => poly.triggerAttackRelease(['G3', 'Bb3', 'D4'], '2n'), 500);
            }
        } catch (e) {
            console.warn('Tone.js audio blocked or failed', e);
        }
    };

    // Auto check Ollama on load
    useEffect(() => {
        const checkOllama = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch('/ollama-api/tags', { signal: controller.signal });
                clearTimeout(timeoutId);
                if (response.ok) {
                    setIsOfflineMode(false);
                } else {
                    setIsOfflineMode(true);
                }
            } catch (err) {
                setIsOfflineMode(true);
            }
        };
        checkOllama();
    }, []);

    // Auto scroll Turn Log to bottom
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [turnLog]);

    // 3D Grid dimensions & properties memoization
    const gridData = useMemo(() => {
        const list = [];
        const size = 0.88; 
        const width = Math.sqrt(3) * size;
        const ySpacing = 2 * size * 0.75;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = c * width + (r % 2 === 0 ? 0 : width / 2);
                const z = r * ySpacing;
                
                // Terraced terrain generator formula
                const val = (Math.sin(c * 0.6) + Math.cos(r * 0.4) + 2) / 4;
                let terrainType = 'grass';
                let color = '#1b5e20'; // grass
                let height = 0.9;
                
                if (val < 0.22) {
                    terrainType = 'water';
                    color = '#00e5ff'; // glowing cyan water
                    height = 0.25;
                } else if (val < 0.38) {
                    terrainType = 'sand';
                    color = '#ff9100'; // vibrant amber
                    height = 0.55;
                } else if (val < 0.72) {
                    terrainType = 'grass';
                    color = '#00c853'; // emerald neon grass
                    height = 0.85;
                } else {
                    terrainType = 'rock';
                    color = '#455a64'; // slick basalt
                    height = 1.45;
                }
                
                list.push({
                    col: c,
                    row: r,
                    x,
                    z,
                    terrainType,
                    color,
                    height
                });
            }
        }
        return list;
    }, []);

    // Fetch cell coordinates
    const playerCell = useMemo(() => {
        return gridData.find(c => c.col === playerPos.col && c.row === playerPos.row) || gridData[0];
    }, [gridData, playerPos]);

    const goblinCell = useMemo(() => {
        return gridData.find(c => c.col === goblinPos.col && c.row === goblinPos.row) || gridData[0];
    }, [gridData, goblinPos]);

    // Handle hex pillar click
    const handleHexClick = (col: number, row: number) => {
        if (isPending) return;
        setPlayerPos({ col, row });
        safePlaySound('move');
        setTurnLog(prev => [...prev, {
            sender: 'System',
            text: `Player moved to (${col}, ${row}).`,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    // Keyboard/Panel movement handler
    const movePlayer = (direction: 'N' | 'S' | 'W' | 'E') => {
        if (isPending) return;
        let newCol = playerPos.col;
        let newRow = playerPos.row;
        if (direction === 'N') newRow = Math.max(0, playerPos.row - 1);
        if (direction === 'S') newRow = Math.min(7, playerPos.row + 1);
        if (direction === 'W') newCol = Math.max(0, playerPos.col - 1);
        if (direction === 'E') newCol = Math.min(7, playerPos.col + 1);
        
        if (newCol !== playerPos.col || newRow !== playerPos.row) {
            setPlayerPos({ col: newCol, row: newRow });
            safePlaySound('move');
            setTurnLog(prev => [...prev, {
                sender: 'System',
                text: `Player moved to (${newCol}, ${newRow}).`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        }
    };

    // Local DM Simulator Engine
    const runLocalSimulation = (action: string, curPlayHp: number, curGobHp: number) => {
        const actionLower = action.toLowerCase();
        const isAttack = actionLower.includes('attack') || actionLower.includes('hit') || actionLower.includes('strike') || actionLower.includes('slash') || actionLower.includes('shoot') || actionLower.includes('cast') || actionLower.includes('fireball') || actionLower.includes('fire');
        const isHeal = actionLower.includes('heal') || actionLower.includes('potion') || actionLower.includes('cure');

        let narrative = "";
        let damageDealt = 0;
        let damageReceived = 0;

        const d20 = Math.floor(Math.random() * 20) + 1;
        const goblinD20 = Math.floor(Math.random() * 20) + 1;

        if (isAttack) {
            if (d20 >= 8) {
                damageDealt = Math.floor(Math.random() * 8) + 4; // 4-11 damage
                narrative = `You launch an attack! (Roll: d20=${d20} + 4 vs AC 12). Direct Hit! You deal ${damageDealt} physical damage to the Goblin figurine.`;
            } else {
                narrative = `You attempt to strike, but the Goblin swiftly maneuvers behind a basalt pillar. (Roll: d20=${d20} + 4 vs AC 12). Miss!`;
            }
        } else if (isHeal) {
            const healAmount = Math.floor(Math.random() * 8) + 6; // 6-13 heal
            narrative = `You channel restorative energies. (Roll: d8=${healAmount - 6} + 6). Healing nodes activate. Restored ${healAmount} HP.`;
            damageDealt = -healAmount; // treated as negative damage
        } else {
            if (d20 >= 10) {
                narrative = `You execute a tactical maneuver: "${action}". The grid shifts in your favor. (Roll: d20=${d20} vs DC 10).`;
            } else {
                narrative = `You try to "${action}", but the hexagonal terrain is too slippery. (Roll: d20=${d20} vs DC 10). Action failed.`;
            }
        }

        const nextGoblinHp = Math.max(0, curGobHp - (damageDealt > 0 ? damageDealt : 0));
        const nextPlayerHpAfterHeal = Math.min(maxPlayerHp, curPlayHp + (damageDealt < 0 ? -damageDealt : 0));

        // Goblin retaliation if alive
        if (nextGoblinHp > 0) {
            if (goblinD20 >= 11) {
                damageReceived = Math.floor(Math.random() * 6) + 2; 
                narrative += ` The Goblin retaliates instantly, slashing with a jagged energy dagger! (Roll: d20=${goblinD20} vs AC 14). Hit! You receive ${damageReceived} damage.`;
            } else {
                narrative += ` The Goblin lunges back, but you duck beneath the swing. (Roll: d20=${goblinD20} vs AC 14). Miss!`;
            }
        }

        const nextPlayerHp = Math.max(0, nextPlayerHpAfterHeal - damageReceived);

        return {
            narrative,
            damageDealt: damageDealt > 0 ? damageDealt : 0,
            damageReceived,
            goblinHp: nextGoblinHp,
            playerHp: nextPlayerHp
        };
    };

    // Regex / structural parser for Ollama outputs
    const parseOllamaResponse = (text: string) => {
        let cleanText = text.trim();
        // Remove markdown tags if any
        if (cleanText.startsWith('```')) {
            const matches = cleanText.match(/^(?:```[a-zA-Z]*\n)?([\s\S]*?)(?:\n```)?$/);
            if (matches && matches[1]) {
                cleanText = matches[1].trim();
            }
        }
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            cleanText = cleanText.substring(start, end + 1);
        }
        return JSON.parse(cleanText);
    };

    // Prompt compilation and API execution
    const handleSendAction = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!actionText.trim() || isPending) return;

        const currentAction = actionText;
        setActionText('');
        setIsPending(true);

        // Sound cues
        await safePlaySound('dice');
        
        // Log player action
        const timestamp = new Date().toLocaleTimeString();
        setTurnLog(prev => [...prev, { sender: 'Player', text: currentAction, timestamp }]);

        // System system prompt to guide LLM response structure
        const systemPrompt = `You are the Dungeon Master (DM) for a 3D tactical D&D tabletop game.
Your task is to adjudicate the player's action based on the current game state, roll virtual dice, describe the result in a rich, descriptive tone (1-2 sentences), and output the updated state.
You MUST output your response in JSON format matching this schema:
{
  "narrative": "A description of what happened, starting with the action outcome.",
  "damageDealt": number, // Amount of damage dealt to the goblin (0 if missed or non-offensive)
  "damageReceived": number, // Amount of damage dealt to the player by the goblin's counterattack (if applicable)
  "goblinHp": number, // The new HP of the goblin after applying damage (cannot be less than 0)
  "playerHp": number // The new HP of the player after applying damage (cannot be less than 0)
}
IMPORTANT: Output ONLY the raw JSON object. Do not include markdown formatting or backticks around the JSON.`;

        const userPrompt = JSON.stringify({
            gameState: {
                player: {
                    class: playerClass,
                    hp: playerHp,
                    position: { col: playerPos.col, row: playerPos.row }
                },
                goblin: {
                    hp: goblinHp,
                    position: { col: goblinPos.col, row: goblinPos.row }
                }
            },
            playerAction: currentAction
        });

        try {
            let narrative = "";
            let newGoblinHp = goblinHp;
            let newPlayerHp = playerHp;

            if (isOfflineMode) {
                // Fallback simulation
                const sim = runLocalSimulation(currentAction, playerHp, goblinHp);
                narrative = sim.narrative;
                newGoblinHp = sim.goblinHp;
                newPlayerHp = sim.playerHp;
                
                if (sim.damageDealt > 0) {
                    await safePlaySound('attack');
                } else if (currentAction.toLowerCase().includes('heal') || currentAction.toLowerCase().includes('potion')) {
                    await safePlaySound('heal');
                }
            } else {
                // Call local Ollama
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout (26B models take time)

                const response = await fetch('/ollama-api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gemma4:latest',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        stream: false
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP Error Status: ${response.status}`);
                }

                const resJson = await response.json();
                const content = resJson.message.content;

                try {
                    const parsed = parseOllamaResponse(content);
                    narrative = parsed.narrative || "The holographic DM flickers and approves the action.";
                    
                    if (typeof parsed.goblinHp === 'number') {
                        newGoblinHp = Math.max(0, parsed.goblinHp);
                    } else if (typeof parsed.damageDealt === 'number') {
                        newGoblinHp = Math.max(0, goblinHp - parsed.damageDealt);
                    }
                    
                    if (typeof parsed.playerHp === 'number') {
                        newPlayerHp = Math.max(0, parsed.playerHp);
                    } else if (typeof parsed.damageReceived === 'number') {
                        newPlayerHp = Math.max(0, playerHp - parsed.damageReceived);
                    }

                    if ((parsed.damageDealt || 0) > 0) {
                        await safePlaySound('attack');
                    } else if (currentAction.toLowerCase().includes('heal') || currentAction.toLowerCase().includes('potion')) {
                        await safePlaySound('heal');
                    }
                } catch (jsonErr) {
                    console.warn("JSON Parse fail, using local roll fallback:", jsonErr);
                    const sim = runLocalSimulation(currentAction, playerHp, goblinHp);
                    narrative = `[DM Parser Fail]: ${sim.narrative}`;
                    newGoblinHp = sim.goblinHp;
                    newPlayerHp = sim.playerHp;
                }
            }

            // Apply updates
            setGoblinHp(newGoblinHp);
            setPlayerHp(newPlayerHp);

            // Add DM response to logs
            setTurnLog(prev => [...prev, { sender: 'DM', text: narrative, timestamp: new Date().toLocaleTimeString() }]);

            // Victory/Defeat checks
            if (newGoblinHp <= 0) {
                await safePlaySound('victory');
                setTurnLog(prev => [...prev, { sender: 'System', text: 'VICTORY! The goblin avatar dissolves into pixels.', timestamp: new Date().toLocaleTimeString() }]);
            } else if (newPlayerHp <= 0) {
                await safePlaySound('defeat');
                setTurnLog(prev => [...prev, { sender: 'System', text: 'DEFEAT! Your character vitals flatline. Restore terminal state.', timestamp: new Date().toLocaleTimeString() }]);
            }

        } catch (err) {
            console.warn("Ollama unavailable, running offline simulation:", err);
            setIsOfflineMode(true);
            
            const sim = runLocalSimulation(currentAction, playerHp, goblinHp);
            setGoblinHp(sim.goblinHp);
            setPlayerHp(sim.playerHp);
            
            setTurnLog(prev => [
                ...prev,
                { sender: 'System', text: '[OFFLINE DM MODE]: Local Ollama offline. Dice rolls simulated locally.', timestamp: new Date().toLocaleTimeString() },
                { sender: 'DM', text: sim.narrative, timestamp: new Date().toLocaleTimeString() }
            ]);

            if (sim.goblinHp <= 0) {
                await safePlaySound('victory');
            } else if (sim.playerHp <= 0) {
                await safePlaySound('defeat');
            }
        } finally {
            setIsPending(false);
        }
    };

    // Reset game board
    const handleReset = () => {
        setPlayerPos({ col: 2, row: 2 });
        setGoblinPos({ col: 5, row: 5 });
        setPlayerHp(50);
        setGoblinHp(30);
        setActionText('');
        safePlaySound('move');
        setTurnLog([
            { sender: 'System', text: 'Grid re-centered. Figurines locked to home bases. Roll for initiative.', timestamp: new Date().toLocaleTimeString() }
        ]);
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-[#040409] text-[#00e5ff] font-sans select-none overflow-hidden border border-[#00e5ff]/20 relative shadow-[inset_0_0_100px_rgba(0,229,255,0.03)]">
            {/* CRT Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4yNSkiLz48L3N2Zz4=')] opacity-40 z-50"></div>

            {/* Viewport side (Left/Center) */}
            <div className="flex-1 h-3/5 md:h-full relative flex flex-col z-10">
                
                {/* Connection Status & Warning Banners */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-black/60 border border-[#00e5ff]/40 backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.15)] text-sm tracking-[0.2em] font-bold text-[#00e5ff] uppercase">
                        <span className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-amber-400 animate-pulse shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)]'}`} />
                        {isOfflineMode ? 'OFFLINE DM SIMULATOR' : 'ONLINE: OLLAMA (GEMMA4)'}
                    </div>
                    {isOfflineMode && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-black/60 border border-amber-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)] text-xs text-amber-400 font-bold uppercase max-w-[350px] leading-relaxed">
                            <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                            <span>[OFFLINE DM MODE] Local Ollama offline. Dice rolls simulated locally.</span>
                        </div>
                    )}
                </div>

                {/* 3D Canvas */}
                <div className="flex-1 w-full h-full bg-[#05050b] cursor-grab active:cursor-grabbing">
                    <Canvas shadows camera={{ position: [0, 8, 8], fov: 50 }}>
                        <color attach="background" args={['#030308']} />
                        <fog attach="fog" args={['#030308', 8, 25]} />
                        
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 15, 8]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
                        <pointLight position={[-10, 8, -10]} intensity={1.2} color="#9900ff" />
                        <pointLight position={[0, -2, 5]} intensity={0.8} color="#00ffcc" />
                        
                        {/* Terrain Hex Grid */}
                        <group position={[-5, 0, -4.5]}>
                            {gridData.map((cell) => {
                                const isPlayerHere = playerPos.col === cell.col && playerPos.row === cell.row;
                                const isGoblinHere = goblinPos.col === cell.col && goblinPos.row === cell.row;
                                const isHovered = hoveredCell?.col === cell.col && hoveredCell?.row === cell.row;
                                
                                let emissiveColor = '#000000';
                                let emissiveIntensity = 0;
                                
                                if (isPlayerHere) {
                                    emissiveColor = '#00ffff';
                                    emissiveIntensity = 0.7;
                                } else if (isGoblinHere) {
                                    emissiveColor = '#ff0055';
                                    emissiveIntensity = 0.7;
                                } else if (isHovered) {
                                    emissiveColor = '#00ffcc';
                                    emissiveIntensity = 0.3;
                                }
                                
                                return (
                                    <mesh 
                                        key={`${cell.col}-${cell.row}`}
                                        position={[cell.x, cell.height / 2, cell.z]}
                                        castShadow
                                        receiveShadow
                                        onPointerOver={(e) => {
                                            e.stopPropagation();
                                            setHoveredCell({ col: cell.col, row: cell.row });
                                        }}
                                        onPointerOut={() => {
                                            setHoveredCell(null);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHexClick(cell.col, cell.row);
                                        }}
                                    >
                                        <cylinderGeometry args={[0.762, 0.82, cell.height, 6]} />
                                        <meshStandardMaterial 
                                            color={cell.color} 
                                            emissive={emissiveColor}
                                            emissiveIntensity={emissiveIntensity}
                                            roughness={0.3}
                                            metalness={0.4}
                                            envMapIntensity={1}
                                        />
                                    </mesh>
                                );
                            })}

                            {/* Player Token */}
                            <group position={[playerCell.x, playerCell.height, playerCell.z]} scale={[0.3, 0.3, 0.3]} rotation={[0, Math.PI / 4, 0]}>
                                <ProceduralRig genome={playerGenome} />
                            </group>
                            <FloatingIndicator 
                                position={[playerCell.x, playerCell.height + 1.1, playerCell.z]} 
                                color="#00ffff" 
                            />

                            {/* Goblin Token */}
                            {goblinHp > 0 && (
                                <group position={[goblinCell.x, goblinCell.height, goblinCell.z]} scale={[0.3, 0.3, 0.3]} rotation={[0, -Math.PI / 4, 0]}>
                                    <ProceduralRig genome={GOBLIN_GENOME} />
                                </group>
                            )}
                            {goblinHp > 0 && (
                                <FloatingIndicator 
                                    position={[goblinCell.x, goblinCell.height + 1.1, goblinCell.z]} 
                                    color="#ff0055" 
                                />
                            )}
                        </group>
                        
                        <OrbitControls 
                            enableDamping 
                            minDistance={4} 
                            maxDistance={18} 
                            maxPolarAngle={Math.PI / 2.1} 
                        />
                    </Canvas>
                </div>
            </div>

            {/* Cyberpunk Control Panel Side (Right) */}
            <div className="w-full md:w-[420px] border-t md:border-t-0 md:border-l border-[#00e5ff]/20 bg-black/80 backdrop-blur-xl flex flex-col overflow-hidden shrink-0 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] pb-24 md:pb-24">
                
                {/* Cartridge Title Banner */}
                <div className="p-4 border-b border-[#00e5ff]/20 bg-gradient-to-r from-[#00e5ff]/10 to-transparent flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#00e5ff]/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-3">
                        <Swords size={20} className="text-[#00e5ff]" />
                        <span className="text-sm font-black tracking-[0.25em] uppercase text-white shadow-[#00e5ff]">NEXUS // TABLETOP</span>
                    </div>
                    <div className="flex items-center gap-2 z-10">
                        <button 
                            onClick={() => setIsCustomizerOpen(true)}
                            className="p-1.5 rounded-sm border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:shadow-[0_0_10px_rgba(0,229,255,0.4)] transition-all flex items-center gap-1 text-[10px] font-bold"
                            title="Open Avatar Forge"
                        >
                            <Sparkles size={14} />
                            <span>FORGE</span>
                        </button>
                        <button 
                            onClick={() => safePlaySound('move')}
                            className={`p-1.5 rounded-sm border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:shadow-[0_0_10px_rgba(0,229,255,0.4)] transition-all ${audioInitialized ? 'opacity-100' : 'opacity-50 animate-pulse'}`}
                            title="Initialize Audio Engine"
                        >
                            <Volume2 size={14} />
                        </button>
                        <button 
                            onClick={handleReset}
                            className="p-1.5 rounded-sm border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:shadow-[0_0_10px_rgba(0,229,255,0.4)] transition-all"
                            title="Reset State"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Vitals & Game Info Dashboard */}
                <div className="grid grid-cols-2 gap-2 p-3 border-b border-[#00e5ff]/10 bg-[#07070d]">
                    {/* Player Info */}
                    <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-500/20">
                        <div className="flex justify-between items-center mb-1 text-xs font-bold text-cyan-400">
                            <span className="flex items-center gap-1"><User size={13} /> HERO ({playerClass})</span>
                            <span className="flex items-center gap-0.5"><Heart size={13} className="fill-cyan-400/20" /> {playerHp}/{maxPlayerHp}</span>
                        </div>
                        {/* HP Bar */}
                        <div className="w-full h-2 bg-black/40 rounded overflow-hidden">
                            <div 
                                className="h-full bg-cyan-400 transition-all duration-300"
                                style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-cyan-400/70 font-mono">
                            <MapPin size={11} /> COORD: ({playerPos.col}, {playerPos.row})
                        </div>
                    </div>

                    {/* Goblin Info */}
                    <div className="p-2.5 rounded bg-red-950/20 border border-red-500/20">
                        <div className="flex justify-between items-center mb-1 text-xs font-bold text-red-400">
                            <span className="tracking-widest">GOBLIN</span>
                            <span className="flex items-center gap-0.5"><Heart size={13} className="fill-red-400/20" /> {goblinHp}/{maxGoblinHp}</span>
                        </div>
                        {/* HP Bar */}
                        <div className="w-full h-2 bg-black/40 rounded overflow-hidden">
                            <div 
                                className="h-full bg-red-500 transition-all duration-300"
                                style={{ width: `${(goblinHp / maxGoblinHp) * 100}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-red-400/70 font-mono">
                            <MapPin size={11} /> COORD: ({goblinPos.col}, {goblinPos.row})
                        </div>
                    </div>
                </div>

                {/* Class selector */}
                <div className="px-3 py-2 border-b border-[#00e5ff]/10 flex items-center justify-between text-xs bg-[#07070d]">
                    <span className="text-[#00e5ff]/60 font-bold">HERO_CLASS:</span>
                    <select 
                        value={playerClass}
                        onChange={(e) => setPlayerClass(e.target.value)}
                        className="bg-black/50 border border-[#00e5ff]/20 rounded text-[#00e5ff] text-xs px-2 py-1 focus:outline-none focus:border-[#00e5ff]/50 font-mono"
                    >
                        <option value="Warrior">Warrior (Melee)</option>
                        <option value="Rogue">Rogue (Stealth)</option>
                        <option value="Mage">Mage (Spells)</option>
                        <option value="Cleric">Cleric (Healing)</option>
                    </select>
                </div>

                {/* Tactical D-Pad Panel */}
                <div className="p-3 border-b border-[#00e5ff]/10 flex justify-between items-center bg-[#07070d]">
                    <span className="text-xs text-[#00e5ff]/60 uppercase tracking-widest font-bold">Movement D-Pad</span>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => movePlayer('W')} className="w-9 h-8 flex items-center justify-center rounded bg-[#101026] border border-[#00e5ff]/30 hover:border-[#00e5ff]/60 hover:bg-[#00e5ff]/10 text-sm text-[#00e5ff] font-bold">W</button>
                        <div className="flex flex-col gap-1">
                            <button onClick={() => movePlayer('N')} className="w-9 h-8 flex items-center justify-center rounded bg-[#101026] border border-[#00e5ff]/30 hover:border-[#00e5ff]/60 hover:bg-[#00e5ff]/10 text-sm text-[#00e5ff] font-bold">N</button>
                            <button onClick={() => movePlayer('S')} className="w-9 h-8 flex items-center justify-center rounded bg-[#101026] border border-[#00e5ff]/30 hover:border-[#00e5ff]/60 hover:bg-[#00e5ff]/10 text-sm text-[#00e5ff] font-bold">S</button>
                        </div>
                        <button onClick={() => movePlayer('E')} className="w-9 h-8 flex items-center justify-center rounded bg-[#101026] border border-[#00e5ff]/30 hover:border-[#00e5ff]/60 hover:bg-[#00e5ff]/10 text-sm text-[#00e5ff] font-bold">E</button>
                    </div>
                </div>

                {/* Turn log (Middle scroll area) */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-transparent scrollbar-thin select-text font-mono relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#00e5ff]/5 via-transparent to-transparent pointer-events-none" />
                    {turnLog.map((log, index) => {
                        let senderColor = 'text-[#00e5ff]/50';
                        let boxBg = 'bg-white/[0.02] border-l border-[#00e5ff]/20';
                        let prefix = 'SYS';

                        if (log.sender === 'Player') {
                            senderColor = 'text-[#00e5ff] font-bold shadow-[#00e5ff] drop-shadow-[0_0_2px_rgba(0,229,255,0.8)]';
                            boxBg = 'bg-[#00e5ff]/[0.03] border-l-2 border-[#00e5ff]/60 shadow-[0_2px_10px_rgba(0,229,255,0.05)]';
                            prefix = 'HERO';
                        } else if (log.sender === 'DM') {
                            senderColor = 'text-[#ff00ff] font-bold shadow-[#ff00ff] drop-shadow-[0_0_2px_rgba(255,0,255,0.8)]';
                            boxBg = 'bg-[#ff00ff]/[0.03] border-l-2 border-[#ff00ff]/60 shadow-[0_2px_10px_rgba(255,0,255,0.05)]';
                            prefix = 'DM';
                        }

                        return (
                            <div key={index} className={`px-4 py-3 rounded-r-sm text-sm md:text-base leading-relaxed relative ${boxBg}`}>
                                <div className="flex justify-between items-center mb-1.5 text-xs tracking-wider uppercase font-bold">
                                    <span className={senderColor}>[{prefix}]</span>
                                    <span className="text-white/40">{log.timestamp}</span>
                                </div>
                                <p className="text-white/90">{log.text}</p>
                            </div>
                        );
                    })}
                    <div ref={logEndRef} />
                </div>

                {/* Action input panel (Bottom) */}
                <form 
                    onSubmit={handleSendAction} 
                    className="p-4 border-t border-[#00e5ff]/20 bg-black/90 backdrop-blur-xl flex flex-col gap-3 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]"
                >
                    <div className="flex items-center justify-between text-xs text-[#00e5ff]/60 tracking-wider uppercase font-bold">
                        <span>&gt; System_Prompt_Override</span>
                    </div>
                    <div className="flex gap-3">
                        <textarea
                            value={actionText}
                            onChange={(e) => setActionText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendAction();
                                }
                            }}
                            disabled={isPending || playerHp <= 0 || goblinHp <= 0}
                            placeholder={playerHp <= 0 ? "CRITICAL FAILURE. RESET ENCOUNTER." : goblinHp <= 0 ? "TARGET ELIMINATED. RESET ENCOUNTER." : "Enter command narrative (e.g. 'Slash with sword')..."}
                            className="flex-1 h-14 bg-[#00e5ff]/[0.02] border border-[#00e5ff]/30 rounded-sm p-3 text-sm md:text-base text-[#00e5ff] placeholder-[#00e5ff]/30 focus:outline-none focus:border-[#00e5ff]/80 focus:bg-[#00e5ff]/[0.05] focus:shadow-[0_0_10px_rgba(0,229,255,0.2)] resize-none font-mono transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isPending || !actionText.trim() || playerHp <= 0 || goblinHp <= 0}
                            className="w-16 rounded-sm bg-gradient-to-br from-[#00e5ff]/20 to-[#00e5ff]/5 border border-[#00e5ff]/50 hover:bg-[#00e5ff]/30 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-30 disabled:hover:shadow-none flex items-center justify-center transition-all text-[#00e5ff]"
                        >
                            <Send size={20} className={isPending ? 'animate-bounce' : ''} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Universal Avatar Forge Customizer Modal overlay */}
            {isCustomizerOpen && (
                <div className="absolute inset-0 z-50 bg-[#05050c]/98 flex items-center justify-center p-4">
                    <div className="w-full h-full border border-[#00e5ff]/40 shadow-[0_0_50px_rgba(0,229,255,0.25)] rounded overflow-hidden">
                        <AvatarCreator 
                            initialGenome={playerGenome}
                            onSave={(newGenome) => {
                                setPlayerGenome(newGenome);
                                setIsCustomizerOpen(false);
                            }}
                            onClose={() => setIsCustomizerOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DndTabletop;
