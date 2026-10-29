import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import * as Tone from 'tone';
import { 
    User, 
    Heart, 
    Sparkles, 
    Sliders, 
    Palette, 
    Shirt, 
    ShieldAlert, 
    Sword, 
    Eye, 
    Sun, 
    Check, 
    RotateCcw, 
    X,
    UserCheck,
    Accessibility
} from 'lucide-react';
import type { ProceduralGenome } from '../../utils/ManifestationAlgorithm';

// Preset Species defaults
interface SpeciesPreset {
    name: string;
    skin: string;
    hair: string;
    primary: string;
    secondary: string;
    accent: string;
    head: [number, number, number];
    torso: [number, number, number];
    pelvis: [number, number, number];
    upperArm: [number, number, number];
    lowerArm: [number, number, number];
    upperLeg: [number, number, number];
    lowerLeg: [number, number, number];
}

const SPECIES_PRESETS: Record<string, SpeciesPreset> = {
    Human: {
        name: 'Human',
        skin: '#f1c27d',
        hair: '#4b2c20',
        primary: '#00e5ff',
        secondary: '#008888',
        accent: '#222222',
        head: [1, 1, 1],
        torso: [1, 1, 1],
        pelvis: [1, 1, 1],
        upperArm: [1, 1, 1],
        lowerArm: [1, 1, 1],
        upperLeg: [1, 1, 1],
        lowerLeg: [1, 1, 1]
    },
    Elf: {
        name: 'Elf',
        skin: '#ffdbac',
        hair: '#fff8e7',
        primary: '#00c853',
        secondary: '#1b5e20',
        accent: '#5d4037',
        head: [0.95, 1.05, 0.95],
        torso: [0.85, 1.1, 0.8],
        pelvis: [0.9, 1.0, 0.9],
        upperArm: [0.8, 1.05, 0.8],
        lowerArm: [0.75, 1.05, 0.75],
        upperLeg: [0.8, 1.1, 0.8],
        lowerLeg: [0.75, 1.1, 0.75]
    },
    Dwarf: {
        name: 'Dwarf',
        skin: '#e0ac69',
        hair: '#d84315',
        primary: '#b71c1c',
        secondary: '#37474f',
        accent: '#4e342e',
        head: [1.2, 0.95, 1.1],
        torso: [1.3, 0.8, 1.2],
        pelvis: [1.3, 0.75, 1.2],
        upperArm: [1.2, 0.8, 1.2],
        lowerArm: [1.15, 0.75, 1.15],
        upperLeg: [1.2, 0.7, 1.2],
        lowerLeg: [1.1, 0.7, 1.1]
    },
    Orc: {
        name: 'Orc',
        skin: '#2e7d32',
        hair: '#1a1a1a',
        primary: '#4e342e',
        secondary: '#263238',
        accent: '#37474f',
        head: [1.15, 1.1, 1.15],
        torso: [1.4, 1.2, 1.3],
        pelvis: [1.2, 1.1, 1.2],
        upperArm: [1.3, 1.2, 1.3],
        lowerArm: [1.25, 1.1, 1.25],
        upperLeg: [1.3, 1.15, 1.3],
        lowerLeg: [1.2, 1.15, 1.2]
    },
    Goblin: {
        name: 'Goblin',
        skin: '#76ff03',
        hair: '#616161',
        primary: '#f57c00',
        secondary: '#3e2723',
        accent: '#212121',
        head: [1.1, 0.9, 1.1],
        torso: [0.8, 0.8, 0.75],
        pelvis: [0.85, 0.75, 0.8],
        upperArm: [0.75, 0.85, 0.75],
        lowerArm: [0.7, 0.8, 0.7],
        upperLeg: [0.8, 0.8, 0.8],
        lowerLeg: [0.75, 0.8, 0.75]
    }
};

const DEFAULT_GENOME: ProceduralGenome = {
    id: 'custom_avatar',
    archetype: 'Ranger',
    traits: [],
    animation: 'idle',
    colors: {
        skin: '#f1c27d',
        hair: '#4b2c20',
        primary: '#00e5ff',
        secondary: '#008888',
        accent: '#222222'
    },
    meshes: {
        base: '',
        body: '',
        arms: '',
        legs: '',
        feet: '',
        head: null
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

// 3D Rig rendering equipped Gear/Weapons
interface CustomCreatorRigProps {
    genome: ProceduralGenome;
    weapon: string;
}

const CustomCreatorRig: React.FC<CustomCreatorRigProps> = ({ genome, weapon }) => {
    const rootRef = useRef<THREE.Group>(null);
    const upperArmLRef = useRef<THREE.Group>(null);
    const upperArmRRef = useRef<THREE.Group>(null);
    const upperLegLRef = useRef<THREE.Group>(null);
    const upperLegRRef = useRef<THREE.Group>(null);
    const spineRef = useRef<THREE.Group>(null);

    const dims = genome.dimensions || DEFAULT_GENOME.dimensions!;
    const colors = genome.colors;

    const getCapsuleLength = (totalHeight: number, width: number) => Math.max(0.1, totalHeight - width);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const speed = genome.animation === 'walk' ? 6 : genome.animation === 'run' ? 12 : 2;
        const amplitude = genome.animation === 'idle' ? 0.05 : 0.6;

        if (genome.animation === 'walk' || genome.animation === 'run') {
            if (upperArmLRef.current) upperArmLRef.current.rotation.x = Math.sin(t * speed) * amplitude;
            if (upperArmRRef.current) upperArmRRef.current.rotation.x = Math.sin(t * speed + Math.PI) * amplitude;
            if (upperLegLRef.current) upperLegLRef.current.rotation.x = Math.sin(t * speed + Math.PI) * amplitude;
            if (upperLegRRef.current) upperLegRRef.current.rotation.x = Math.sin(t * speed) * amplitude;
            if (rootRef.current) rootRef.current.position.y = Math.abs(Math.sin(t * speed * 2)) * 0.1;
        } else {
            if (spineRef.current) {
                spineRef.current.scale.y = 1 + Math.sin(t * speed) * 0.02;
                spineRef.current.rotation.x = Math.sin(t * speed) * 0.015;
            }
            if (upperArmLRef.current) upperArmLRef.current.rotation.x = THREE.MathUtils.lerp(upperArmLRef.current.rotation.x, 0.1, 0.1);
            if (upperArmRRef.current) upperArmRRef.current.rotation.x = THREE.MathUtils.lerp(upperArmRRef.current.rotation.x, 0.1, 0.1);
            if (upperLegLRef.current) upperLegLRef.current.rotation.x = THREE.MathUtils.lerp(upperLegLRef.current.rotation.x, 0, 0.1);
            if (upperLegRRef.current) upperLegRRef.current.rotation.x = THREE.MathUtils.lerp(upperLegRRef.current.rotation.x, 0, 0.1);
            if (rootRef.current) rootRef.current.position.y = 0;
        }
    });

    return (
        <group ref={rootRef} position={[0, 0, 0]}>
            {/* PELVIS */}
            <group position={[0, dims.lowerLeg[1] + dims.upperLeg[1] + (dims.pelvis[1] / 2), 0]}>
                <mesh castShadow receiveShadow scale={[1, 0.8, 1]}>
                    <sphereGeometry args={[dims.pelvis[0] / 2, 32, 32]} />
                    <meshStandardMaterial color={colors.secondary} roughness={0.3} metalness={0.1} />
                </mesh>

                {/* SPINE / TORSO */}
                <group ref={spineRef} position={[0, dims.pelvis[1] / 2, 0]}>
                    {/* Torso */}
                    <group position={[0, dims.torso[1] / 2, 0]}>
                        <mesh castShadow receiveShadow scale={[1, 1.4, 0.8]}>
                            <sphereGeometry args={[dims.torso[0] / 2, 32, 32]} />
                            <meshStandardMaterial color={colors.primary} roughness={0.4} metalness={0.1} />
                        </mesh>
                    </group>

                    {/* NECK & HEAD */}
                    <group position={[0, dims.torso[1], 0]}>
                        {/* Neck */}
                        <mesh position={[0, 0.1, 0]} castShadow>
                            <cylinderGeometry args={[0.15, 0.2, 0.2, 16]} />
                            <meshStandardMaterial color={colors.skin} roughness={0.5} />
                        </mesh>

                        {/* Head */}
                        <group position={[0, 0.2 + dims.head[1] / 2, 0]}>
                            <mesh castShadow receiveShadow scale={[1, 1.1, 1]}>
                                <sphereGeometry args={[dims.head[0] / 2, 32, 32]} />
                                <meshStandardMaterial color={colors.skin} roughness={0.4} />
                            </mesh>
                            
                            {/* Hair */}
                            <mesh position={[0, dims.head[1] * 0.1, 0]} castShadow scale={[1.05, 1.05, 1.05]}>
                                <sphereGeometry args={[dims.head[0] / 2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                                <meshStandardMaterial color={colors.hair} roughness={0.7} />
                            </mesh>
                        </group>
                    </group>

                    {/* SHOULDERS & ARMS */}
                    {/* Left Arm */}
                    <group ref={upperArmLRef} position={[(dims.torso[0] / 2) + 0.1, dims.torso[1] - 0.2, 0]}>
                        <mesh position={[0, -dims.upperArm[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.upperArm[0] / 2, getCapsuleLength(dims.upperArm[1], dims.upperArm[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.primary} roughness={0.4} />
                        </mesh>
                        {/* Lower Arm */}
                        <group position={[0, -dims.upperArm[1], 0]}>
                            <mesh position={[0, -dims.lowerArm[1] / 2, 0]} castShadow>
                                <capsuleGeometry args={[dims.lowerArm[0] / 2, getCapsuleLength(dims.lowerArm[1], dims.lowerArm[0]), 16, 16]} />
                                <meshStandardMaterial color={colors.skin} roughness={0.4} />
                            </mesh>

                            {/* Left Hand Props (Shield, Dagger) */}
                            {weapon === 'sword_shield' && (
                                <group position={[0, -dims.lowerArm[1], 0]} rotation={[0, 0, Math.PI / 2]}>
                                    {/* Buckler Shield */}
                                    <mesh castShadow position={[0.15, 0, 0]}>
                                        <cylinderGeometry args={[0.5, 0.5, 0.05, 8]} />
                                        <meshStandardMaterial color="#b0bec5" metalness={0.8} roughness={0.2} />
                                    </mesh>
                                    <mesh castShadow position={[0.15, 0, 0.03]}>
                                        <sphereGeometry args={[0.15, 16, 16]} />
                                        <meshStandardMaterial color="#ffd54f" metalness={0.9} roughness={0.1} />
                                    </mesh>
                                </group>
                            )}
                            {weapon === 'daggers' && (
                                <group position={[0, -dims.lowerArm[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
                                    {/* Left Dagger */}
                                    <mesh castShadow position={[0, 0.1, 0]}>
                                        <boxGeometry args={[0.04, 0.3, 0.01]} />
                                        <meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.1} />
                                    </mesh>
                                    <mesh castShadow position={[0, -0.05, 0]}>
                                        <cylinderGeometry args={[0.02, 0.02, 0.1]} />
                                        <meshStandardMaterial color="#5d4037" roughness={0.6} />
                                    </mesh>
                                </group>
                            )}
                        </group>
                    </group>

                    {/* Right Arm */}
                    <group ref={upperArmRRef} position={[-(dims.torso[0] / 2) - 0.1, dims.torso[1] - 0.2, 0]}>
                        <mesh position={[0, -dims.upperArm[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.upperArm[0] / 2, getCapsuleLength(dims.upperArm[1], dims.upperArm[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.primary} roughness={0.4} />
                        </mesh>
                        <group position={[0, -dims.upperArm[1], 0]}>
                            <mesh position={[0, -dims.lowerArm[1] / 2, 0]} castShadow>
                                <capsuleGeometry args={[dims.lowerArm[0] / 2, getCapsuleLength(dims.lowerArm[1], dims.lowerArm[0]), 16, 16]} />
                                <meshStandardMaterial color={colors.skin} roughness={0.4} />
                            </mesh>

                            {/* Right Hand Props (Sword, Staff, Dagger) */}
                            {weapon === 'sword_shield' && (
                                <group position={[0, -dims.lowerArm[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
                                    {/* Longsword Blade */}
                                    <mesh castShadow position={[0, 0.4, 0]}>
                                        <boxGeometry args={[0.06, 0.7, 0.02]} />
                                        <meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.1} />
                                    </mesh>
                                    {/* Crossguard */}
                                    <mesh castShadow position={[0, 0.08, 0]}>
                                        <boxGeometry args={[0.22, 0.03, 0.04]} />
                                        <meshStandardMaterial color="#ffd54f" metalness={0.9} roughness={0.2} />
                                    </mesh>
                                    {/* Handle */}
                                    <mesh castShadow position={[0, -0.07, 0]}>
                                        <cylinderGeometry args={[0.025, 0.025, 0.15]} />
                                        <meshStandardMaterial color="#3e2723" roughness={0.8} />
                                    </mesh>
                                </group>
                            )}
                            {weapon === 'staff' && (
                                <group position={[0, -dims.lowerArm[1] / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                    {/* Wooden Staff */}
                                    <mesh castShadow position={[0, 0, 0]}>
                                        <cylinderGeometry args={[0.03, 0.03, 1.8]} />
                                        <meshStandardMaterial color="#5d4037" roughness={0.9} />
                                    </mesh>
                                    {/* Glowing Crystal Gem */}
                                    <mesh position={[0, 0.95, 0]} castShadow>
                                        <octahedronGeometry args={[0.12]} />
                                        <meshStandardMaterial color="#00e5ff" roughness={0.6} />
                                    </mesh>
                                </group>
                            )}
                            {weapon === 'daggers' && (
                                <group position={[0, -dims.lowerArm[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
                                    {/* Right Dagger */}
                                    <mesh castShadow position={[0, 0.1, 0]}>
                                        <boxGeometry args={[0.04, 0.3, 0.01]} />
                                        <meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.1} />
                                    </mesh>
                                    <mesh castShadow position={[0, -0.05, 0]}>
                                        <cylinderGeometry args={[0.02, 0.02, 0.1]} />
                                        <meshStandardMaterial color="#5d4037" roughness={0.6} />
                                    </mesh>
                                </group>
                            )}
                        </group>
                    </group>
                </group>

                {/* LEGS */}
                {/* Left Leg */}
                <group ref={upperLegLRef} position={[dims.pelvis[0] / 3, -dims.pelvis[1] / 2, 0]}>
                    <mesh position={[0, -dims.upperLeg[1] / 2, 0]} castShadow>
                        <capsuleGeometry args={[dims.upperLeg[0] / 2, getCapsuleLength(dims.upperLeg[1], dims.upperLeg[0]), 16, 16]} />
                        <meshStandardMaterial color={colors.secondary} roughness={0.4} />
                    </mesh>
                    <group position={[0, -dims.upperLeg[1], 0]}>
                        <mesh position={[0, -dims.lowerLeg[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.lowerLeg[0] / 2, getCapsuleLength(dims.lowerLeg[1], dims.lowerLeg[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.accent} roughness={0.4} />
                        </mesh>
                    </group>
                </group>

                {/* Right Leg */}
                <group ref={upperLegRRef} position={[-dims.pelvis[0] / 3, -dims.pelvis[1] / 2, 0]}>
                    <mesh position={[0, -dims.upperLeg[1] / 2, 0]} castShadow>
                        <capsuleGeometry args={[dims.upperLeg[0] / 2, getCapsuleLength(dims.upperLeg[1], dims.upperLeg[0]), 16, 16]} />
                        <meshStandardMaterial color={colors.secondary} roughness={0.4} />
                    </mesh>
                    <group position={[0, -dims.upperLeg[1], 0]}>
                        <mesh position={[0, -dims.lowerLeg[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.lowerLeg[0] / 2, getCapsuleLength(dims.lowerLeg[1], dims.lowerLeg[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.accent} roughness={0.4} />
                        </mesh>
                    </group>
                </group>
            </group>
        </group>
    );
};

// Main Universal Character Creator Component
interface AvatarCreatorProps {
    initialGenome?: ProceduralGenome;
    onSave?: (genome: ProceduralGenome) => void;
    onClose?: () => void;
}

export const AvatarCreator: React.FC<AvatarCreatorProps> = ({ initialGenome, onSave, onClose }) => {
    // Load genome with fallback
    const [genome, setGenome] = useState<ProceduralGenome>(() => {
        if (initialGenome) return initialGenome;
        try {
            const saved = localStorage.getItem('myos_user_gestalt');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.genome) return parsed.genome;
            }
        } catch (e) {}
        return DEFAULT_GENOME;
    });

    const [activeTab, setActiveTab] = useState<'species' | 'head' | 'body' | 'clothing' | 'gear' | 'pose' | 'stage' | 'color'>('species');
    const [selectedWeapon, setSelectedWeapon] = useState<string>('none');
    const [selectedPreset, setSelectedPreset] = useState<string>('Human');
    
    // Stage Environment Styles
    const [stageStyle, setStageStyle] = useState<'synthwave' | 'dungeon' | 'studio'>('synthwave');
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const [fogDensity, setFogDensity] = useState<number>(0.02);

    // Audio effects setup
    const playTone = (note: string, type: 'synth' | 'pluck' = 'synth') => {
        try {
            if (Tone.context.state !== 'running') {
                Tone.start();
            }
            if (type === 'pluck') {
                const synth = new Tone.PluckSynth().toDestination();
                synth.volume.value = -12;
                synth.triggerAttack(note);
            } else {
                const synth = new Tone.Synth().toDestination();
                synth.volume.value = -15;
                synth.triggerAttackRelease(note, '8n');
            }
        } catch (e) {}
    };

    // Auto load properties of the preset when selected
    const handleSelectPreset = (presetName: string) => {
        setSelectedPreset(presetName);
        const preset = SPECIES_PRESETS[presetName];
        if (preset) {
            setGenome(prev => ({
                ...prev,
                colors: {
                    skin: preset.skin,
                    hair: preset.hair,
                    primary: preset.primary,
                    secondary: preset.secondary,
                    accent: preset.accent
                },
                dimensions: {
                    head: preset.head,
                    torso: preset.torso,
                    pelvis: preset.pelvis,
                    upperArm: preset.upperArm,
                    lowerArm: preset.lowerArm,
                    hands: [1, 1, 1],
                    upperLeg: preset.upperLeg,
                    lowerLeg: preset.lowerLeg,
                    feet: [1, 1, 1]
                }
            }));
            playTone('C4', 'pluck');
        }
    };

    // Color updater helper
    const handleUpdateColor = (key: keyof ProceduralGenome['colors'], value: string) => {
        setGenome(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: value
            }
        }));
    };

    // Dimension slider updater helper
    const handleUpdateDimension = (part: keyof Exclude<ProceduralGenome['dimensions'], undefined>, axisIdx: number, value: number) => {
        setGenome(prev => {
            const dims = { ...prev.dimensions } as Exclude<ProceduralGenome['dimensions'], undefined>;
            const val = [...dims[part]] as [number, number, number];
            val[axisIdx] = value;
            dims[part] = val;
            return {
                ...prev,
                dimensions: dims
            };
        });
    };

    const handleSave = () => {
        // Play success chord
        try {
            const now = Tone.now();
            const poly = new Tone.PolySynth().toDestination();
            poly.volume.value = -10;
            poly.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '4n', now);
        } catch (e) {}

        // Save locally
        if (onSave) {
            onSave(genome);
        } else {
            // Update MyOS global userGestalt
            try {
                const saved = localStorage.getItem('myos_user_gestalt');
                let gestalt = saved ? JSON.parse(saved) : {};
                gestalt.genome = genome;
                localStorage.setItem('myos_user_gestalt', JSON.stringify(gestalt));
                
                // Dispatch event to notify layout
                const event = new CustomEvent('myos_update_gestalt', { detail: { genome } });
                window.dispatchEvent(event);
            } catch (err) {
                console.error("Failed to update global gestalt genome", err);
            }
        }

        // Close if available
        if (onClose) onClose();
    };

    const handleReset = () => {
        setGenome(DEFAULT_GENOME);
        setSelectedWeapon('none');
        setSelectedPreset('Human');
        playTone('G3');
    };

    // Lighting colors based on stage
    const stageLightProps = useMemo(() => {
        switch (stageStyle) {
            case 'dungeon':
                return {
                    ambientColor: '#2b1a0a',
                    ambientIntensity: 0.6,
                    dirColor: '#ff7700',
                    dirIntensity: 1.5,
                    pointColor1: '#ff3300',
                    pointColor2: '#5500aa',
                    bgColor: '#0a0502'
                };
            case 'studio':
                return {
                    ambientColor: '#ffffff',
                    ambientIntensity: 0.8,
                    dirColor: '#ffffff',
                    dirIntensity: 1.2,
                    pointColor1: '#cfd8dc',
                    pointColor2: '#eceff1',
                    bgColor: '#1c2025'
                };
            case 'synthwave':
            default:
                return {
                    ambientColor: '#050515',
                    ambientIntensity: 0.4,
                    dirColor: '#ff00ff',
                    dirIntensity: 2.0,
                    pointColor1: '#00ffff',
                    pointColor2: '#8e24aa',
                    bgColor: '#040409'
                };
        }
    }, [stageStyle]);

    return (
        <div className="flex flex-col md:flex-row w-full h-full bg-[#05050c] text-[#00e5ff] font-mono select-none overflow-hidden relative border border-[#00e5ff]/20">
            {/* CRT overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4yNSkiLz48L3N2Zz4=')] opacity-30 z-30 pointer-events-none" />

            {/* Sidebar customization panel */}
            <div className="w-full md:w-[440px] h-2/5 md:h-full border-b md:border-b-0 md:border-r border-[#00e5ff]/20 bg-black/75 backdrop-blur-xl flex flex-col z-10 shrink-0">
                {/* Header title */}
                <div className="p-4 border-b border-[#00e5ff]/20 bg-gradient-to-r from-[#00e5ff]/10 to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-[#00e5ff] animate-pulse" />
                        <span className="text-xs font-black tracking-[0.2em] uppercase">AVATAR FORGE // 3D GENOME</span>
                    </div>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-1 rounded-sm border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-white transition-all"
                            title="Close Customizer"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                {/* Hero Forge Sidebar Navigation Tabs */}
                <div className="flex border-b border-[#00e5ff]/10 overflow-x-auto scrollbar-none bg-[#07070f] divide-x divide-[#00e5ff]/10 shrink-0">
                    {[
                        { id: 'species', icon: User, label: 'SPECIES' },
                        { id: 'head', icon: Sliders, label: 'HEAD' },
                        { id: 'body', icon: Accessibility, label: 'BODY' },
                        { id: 'clothing', icon: Shirt, label: 'OUTIFT' },
                        { id: 'gear', icon: Sword, label: 'GEAR' },
                        { id: 'color', icon: Palette, label: 'COLOR' },
                        { id: 'pose', icon: Eye, label: 'POSE' },
                        { id: 'stage', icon: Sun, label: 'STAGE' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                playTone('D4', 'pluck');
                                setActiveTab(tab.id as any);
                            }}
                            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all text-[9px] font-bold tracking-wider ${
                                activeTab === tab.id 
                                    ? 'bg-[#00e5ff]/15 text-[#00e5ff] border-b-2 border-b-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.1)]' 
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
                            }`}
                        >
                            <tab.icon size={15} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Customizer Option controls */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
                    
                    {/* Tab: Species */}
                    {activeTab === 'species' && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Base Species Presets</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(SPECIES_PRESETS).map((pName) => (
                                    <button
                                        key={pName}
                                        onClick={() => handleSelectPreset(pName)}
                                        className={`p-3 rounded border text-left flex flex-col justify-between h-20 transition-all ${
                                            selectedPreset === pName
                                                ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                                                : 'border-white/10 bg-white/[0.02] text-[#00e5ff]/60 hover:border-white/30 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <span className="text-sm font-bold capitalize text-white">{pName}</span>
                                        <span className="text-[9px] tracking-wider opacity-60">SELECT GENOME</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Head */}
                    {activeTab === 'head' && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Cranial Structuring</h2>
                            
                            {/* Width Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>HEAD WIDTH</span>
                                    <span className="text-white/60">{genome.dimensions?.head[0].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.5" step="0.05"
                                    value={genome.dimensions?.head[0] || 1}
                                    onChange={(e) => {
                                        handleUpdateDimension('head', 0, parseFloat(e.target.value));
                                        if (Math.random() < 0.15) playTone('E4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Height Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>HEAD HEIGHT</span>
                                    <span className="text-white/60">{genome.dimensions?.head[1].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.5" step="0.05"
                                    value={genome.dimensions?.head[1] || 1}
                                    onChange={(e) => {
                                        handleUpdateDimension('head', 1, parseFloat(e.target.value));
                                        if (Math.random() < 0.15) playTone('E4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Depth Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>HEAD DEPTH</span>
                                    <span className="text-white/60">{genome.dimensions?.head[2].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.5" step="0.05"
                                    value={genome.dimensions?.head[2] || 1}
                                    onChange={(e) => {
                                        handleUpdateDimension('head', 2, parseFloat(e.target.value));
                                        if (Math.random() < 0.15) playTone('E4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab: Body */}
                    {activeTab === 'body' && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Skeletal Proportions</h2>
                            
                            {/* Torso Width */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>TORSO WIDTH</span>
                                    <span className="text-white/60">{genome.dimensions?.torso[0].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.6" step="0.05"
                                    value={genome.dimensions?.torso[0] || 1}
                                    onChange={(e) => {
                                        handleUpdateDimension('torso', 0, parseFloat(e.target.value));
                                        if (Math.random() < 0.15) playTone('D4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Torso Height */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>TORSO HEIGHT</span>
                                    <span className="text-white/60">{genome.dimensions?.torso[1].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.6" step="0.05"
                                    value={genome.dimensions?.torso[1] || 1}
                                    onChange={(e) => {
                                        handleUpdateDimension('torso', 1, parseFloat(e.target.value));
                                        if (Math.random() < 0.15) playTone('D4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Pelvis Width */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>PELVIS WIDTH</span>
                                    <span className="text-white/60">{genome.dimensions?.pelvis[0].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.5" step="0.05"
                                    value={genome.dimensions?.pelvis[0] || 1}
                                    onChange={(e) => {
                                        handleUpdateDimension('pelvis', 0, parseFloat(e.target.value));
                                        if (Math.random() < 0.15) playTone('D4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Arm Length */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>ARM LENGTH</span>
                                    <span className="text-white/60">{genome.dimensions?.upperArm[1].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.6" step="0.05"
                                    value={genome.dimensions?.upperArm[1] || 1}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        handleUpdateDimension('upperArm', 1, val);
                                        handleUpdateDimension('lowerArm', 1, val);
                                        if (Math.random() < 0.15) playTone('D4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Leg Length */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>LEG LENGTH</span>
                                    <span className="text-white/60">{genome.dimensions?.upperLeg[1].toFixed(2)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.6" max="1.6" step="0.05"
                                    value={genome.dimensions?.upperLeg[1] || 1}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        handleUpdateDimension('upperLeg', 1, val);
                                        handleUpdateDimension('lowerLeg', 1, val);
                                        if (Math.random() < 0.15) playTone('D4', 'pluck');
                                    }}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab: Clothing */}
                    {activeTab === 'clothing' && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Outfit Archetype</h2>
                            <div className="flex flex-col gap-2">
                                {['Ranger', 'Warrior', 'Mage', 'Rogue', 'Cleric'].map((arch) => (
                                    <button
                                        key={arch}
                                        onClick={() => {
                                            setGenome(prev => ({ ...prev, archetype: arch }));
                                            playTone('E4', 'pluck');
                                        }}
                                        className={`p-3 rounded border text-left flex justify-between items-center transition-all ${
                                            genome.archetype === arch
                                                ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                                                : 'border-white/10 bg-white/[0.02] text-[#00e5ff]/60 hover:border-white/30 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-wider">{arch} Class</span>
                                        {genome.archetype === arch && <Check size={16} className="text-[#00e5ff]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Gear */}
                    {activeTab === 'gear' && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Hand Equipment</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'none', label: 'UNARMED' },
                                    { id: 'sword_shield', label: 'SWORD & SHIELD' },
                                    { id: 'staff', label: 'MAGE STAFF' },
                                    { id: 'daggers', label: 'DUAL DAGGERS' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedWeapon(item.id);
                                            playTone('G4', 'pluck');
                                        }}
                                        className={`p-3 rounded border text-center flex flex-col justify-center gap-1 h-20 transition-all ${
                                            selectedWeapon === item.id
                                                ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                                                : 'border-white/10 bg-white/[0.02] text-[#00e5ff]/60 hover:border-white/30 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-wider block text-white">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Colors */}
                    {activeTab === 'color' && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Genome Color Palette</h2>
                            
                            {/* Color Selector Rows */}
                            {[
                                { key: 'skin', label: 'Skin Complexion' },
                                { key: 'hair', label: 'Hair Color' },
                                { key: 'primary', label: 'Outfit Primary' },
                                { key: 'secondary', label: 'Outfit Secondary' },
                                { key: 'accent', label: 'Shoes / Accent' }
                            ].map((colRow) => (
                                <div key={colRow.key} className="flex justify-between items-center p-2 rounded bg-white/[0.01] border border-white/5">
                                    <span className="text-xs font-bold">{colRow.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-white/50 uppercase font-mono">{genome.colors[colRow.key as keyof ProceduralGenome['colors']]}</span>
                                        <div className="relative w-8 h-8 rounded border border-white/20 overflow-hidden cursor-pointer">
                                            <input 
                                                type="color"
                                                value={genome.colors[colRow.key as keyof ProceduralGenome['colors']]}
                                                onChange={(e) => handleUpdateColor(colRow.key as keyof ProceduralGenome['colors'], e.target.value)}
                                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: Pose */}
                    {activeTab === 'pose' && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Active Rig Animation</h2>
                            <div className="flex flex-col gap-2">
                                {['idle', 'walk', 'run'].map((pose) => (
                                    <button
                                        key={pose}
                                        onClick={() => {
                                            setGenome(prev => ({ ...prev, animation: pose as any }));
                                            playTone('A4', 'pluck');
                                        }}
                                        className={`p-3 rounded border text-left flex justify-between items-center transition-all ${
                                            genome.animation === pose
                                                ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                                                : 'border-white/10 bg-white/[0.02] text-[#00e5ff]/60 hover:border-white/30 hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-widest">{pose} Animation</span>
                                        {genome.animation === pose && <Check size={16} className="text-[#00e5ff]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Stage */}
                    {activeTab === 'stage' && (
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold text-white/50 border-b border-white/10 pb-1.5 uppercase tracking-widest">Stage Environments</h2>
                            
                            {/* Preset Environment styles */}
                            <div className="flex gap-2">
                                {[
                                    { id: 'synthwave', label: 'SYNTHWAVE' },
                                    { id: 'dungeon', label: 'DUNGEON' },
                                    { id: 'studio', label: 'STUDIO' }
                                ].map((env) => (
                                    <button
                                        key={env.id}
                                        onClick={() => {
                                            setStageStyle(env.id as any);
                                            playTone('B4', 'pluck');
                                        }}
                                        className={`flex-1 py-2 text-center text-[10px] font-bold rounded border ${
                                            stageStyle === env.id
                                                ? 'border-[#00e5ff] bg-[#00e5ff]/10 text-white shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                                                : 'border-white/10 bg-white/[0.01] text-white/40 hover:border-white/20'
                                        }`}
                                    >
                                        {env.label}
                                    </button>
                                ))}
                            </div>

                            {/* Grid Visibility Toggle */}
                            <div className="flex justify-between items-center p-2 rounded bg-white/[0.01] border border-white/5">
                                <span className="text-xs font-bold">GRID PLATFORM</span>
                                <input 
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={(e) => setShowGrid(e.target.checked)}
                                    className="w-4 h-4 accent-[#00e5ff] cursor-pointer"
                                />
                            </div>

                            {/* Fog Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span>FOG DENSITY</span>
                                    <span className="text-white/60">{(fogDensity * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="0.1" step="0.01"
                                    value={fogDensity}
                                    onChange={(e) => setFogDensity(parseFloat(e.target.value))}
                                    className="w-full accent-[#00e5ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar footer control actions */}
                <div className="p-4 border-t border-[#00e5ff]/20 bg-[#07070f] flex gap-2 shrink-0">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3 px-2 border border-white/20 rounded-sm text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 text-white/70"
                    >
                        <RotateCcw size={14} />
                        <span>RESET</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] py-3 px-2 bg-[#00e5ff]/15 border border-[#00e5ff]/50 rounded-sm text-xs font-black tracking-widest text-[#00e5ff] hover:bg-[#00e5ff]/30 hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        <UserCheck size={15} />
                        <span>SAVE & SYNC</span>
                    </button>
                </div>
            </div>

            {/* 3D Canvas Preview (Right/Center) */}
            <div className="flex-1 h-3/5 md:h-full relative bg-[#040409]">
                <Canvas shadows camera={{ position: [0, 2.5, 4.5], fov: 45 }}>
                    <color attach="background" args={[stageLightProps.bgColor]} />
                    <fog attach="fog" args={[stageLightProps.bgColor, 1.0, 1.0 / (fogDensity + 0.001)]} />

                    <ambientLight color={stageLightProps.ambientColor} intensity={stageLightProps.ambientIntensity} />
                    <directionalLight 
                        position={[5, 10, 5]} 
                        color={stageLightProps.dirColor} 
                        intensity={stageLightProps.dirIntensity} 
                        castShadow 
                        shadow-mapSize={[1024, 1024]}
                    />
                    <pointLight position={[-4, 3, -4]} color={stageLightProps.pointColor1} intensity={1.5} />
                    <pointLight position={[0, -1, 3]} color={stageLightProps.pointColor2} intensity={0.8} />

                    {/* Voxel Character Rig */}
                    <group position={[0, -0.6, 0]}>
                        <CustomCreatorRig genome={genome} weapon={selectedWeapon} />
                        
                        {/* Floor platform Grid */}
                        {showGrid && (
                            <group position={[0, 0, 0]}>
                                <Grid 
                                    infiniteGrid 
                                    sectionSize={0.5} 
                                    sectionColor={stageLightProps.pointColor1} 
                                    sectionThickness={1.0}
                                    fadeDistance={6.0} 
                                    cellColor={stageLightProps.pointColor2}
                                />
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                                    <planeGeometry args={[10, 10]} />
                                    <shadowMaterial opacity={0.4} />
                                </mesh>
                            </group>
                        )}
                    </group>

                    <OrbitControls 
                        enableDamping 
                        dampingFactor={0.05} 
                        minDistance={2.0} 
                        maxDistance={10.0} 
                        maxPolarAngle={Math.PI / 2 + 0.05} 
                        target={[0, 0.5, 0]}
                    />
                </Canvas>
            </div>
        </div>
    );
};
