import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Shield, Swords, Wand2, RotateCw, X, Play, 
    Check, Flame, Compass, Palette, Scissors, Layers, Eye, RefreshCw
} from 'lucide-react';
import { 
    DnDEquipmentCompositor, 
    DND_SPECIES_LIST, 
    DND_CLASS_LIST, 
    DND_REGIONS,
    type DnDSpecies, 
    type DnDClass, 
    type DnDRegion, 
    type DnDArmorType, 
    type DnDWeapon, 
    type DnDShield,
    type DnDCharacterConcept 
} from '../../engine/DnDEquipmentCompositor';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { DiegeticHeroCyclotrope, type CyclotropeItem } from '../Avatars/DiegeticHeroCyclotrope';
import { type LpcAction, type AvatarGenome } from '../../hooks/useAvatarCompositor';
import { useCouncil } from '../../council/CouncilContext';
import { ArchiveVault, type MyOsSpriteEntry } from '../HeroStudio/ArchiveVault';
import { AstralScryingMirror } from '../HeroStudio/AstralScryingMirror';

interface DiegeticHeroStudioProps {
    onClose?: () => void;
    onApplyToUser?: (genome: AvatarGenome) => void;
    isNested?: boolean;
}

const ARMOR_OPTIONS: { id: DnDArmorType; label: string; icon: string }[] = [
    { id: 'None', label: 'Unarmored / Cloth', icon: '🥋' },
    { id: 'Leather', label: 'Leather Armor', icon: '🥾' },
    { id: 'StuddedLeather', label: 'Studded Leather', icon: '🛡️' },
    { id: 'ChainMail', label: 'Chainmail', icon: '⛓️' },
    { id: 'SplintMail', label: 'Splint Mail', icon: '🛡️' },
    { id: 'PlateMail', label: 'Full Plate', icon: '👑' },
    { id: 'WizardRobes', label: 'Arcane Robes', icon: '🧙' },
    { id: 'BarbarianHarness', label: 'Primal Harness', icon: '🪓' }
];

const WEAPON_OPTIONS: { id: DnDWeapon; label: string; icon: string }[] = [
    { id: 'Unarmed', label: 'Unarmed / Fists', icon: '👊' },
    { id: 'Longsword', label: 'Longsword', icon: '⚔️' },
    { id: 'Greatsword', label: 'Greatsword (2H)', icon: '🗡️' },
    { id: 'Dagger', label: 'Dagger', icon: '🔪' },
    { id: 'DualDaggers', label: 'Dual Daggers', icon: '⚔️' },
    { id: 'ArcaneStaff', label: 'Arcane Staff', icon: '🪄' },
    { id: 'Longbow', label: 'Elven Longbow', icon: '🏹' },
    { id: 'Battleaxe', label: 'Battleaxe', icon: '🪓' },
    { id: 'Warhammer', label: 'Warhammer', icon: '🔨' },
    { id: 'Rapier', label: 'Rapier', icon: '🤺' },
];

const SHIELD_OPTIONS: { id: DnDShield; label: string; icon: string }[] = [
    { id: 'None', label: 'Empty Hand', icon: '✋' },
    { id: 'KiteShield', label: 'Kite Shield', icon: '🛡️' },
    { id: 'RoundBuckler', label: 'Round Buckler', icon: '🛡️' },
    { id: 'TowerShield', label: 'Tower Shield', icon: '🏰' },
    { id: 'SpellTome', label: 'Spell Tome / Grimoire', icon: '📖' },
];

const HAIRSTYLES = [
    { id: 'adult_universal_hair_shortknot.png', label: 'Short Topknot' },
    { id: 'adult_universal_hair_longknot.png', label: 'Elven Long Braid' },
    { id: 'adult_universal_hair_messy.png', label: 'Messy Adventurer' },
    { id: 'adult_universal_side_swoop.png', label: 'Side Swoop' },
    { id: 'none', label: 'Bald / Horns Only' },
];

export const DiegeticHeroStudio: React.FC<DiegeticHeroStudioProps> = ({ onClose, onApplyToUser, isNested }) => {
    const { updateAgentGenome } = useCouncil();

    // Active Category Ring (0: Race, 1: Class Starter, 2: Armor, 3: Weapon, 4: Region)
    const [activeRing, setActiveRing] = useState<number>(0);

    // Selected Concept State
    const [characterName, setCharacterName] = useState('Valerius');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [speciesIdx, setSpeciesIdx] = useState(0);
    const [classIdx, setClassIdx] = useState(0);
    const [armorIdx, setArmorIdx] = useState(3); // Chainmail default
    const [weaponIdx, setWeaponIdx] = useState(1); // Longsword
    const [shieldIdx, setShieldIdx] = useState(1); // Kite shield
    const [regionIdx, setRegionIdx] = useState(0);
    const [hairIdx, setHairIdx] = useState(0);

    // Presentation Mode: 2.5D LPC Pixel Billboard vs 3D Mesh
    const [renderMode, setRenderMode] = useState<'2.5D_LPC' | '3D_MESH'>('2.5D_LPC');
    const [action, setAction] = useState<LpcAction>('idle');
    const [appliedNotice, setAppliedNotice] = useState(false);
    const [isArchiveVaultOpen, setIsArchiveVaultOpen] = useState(false);
    const [selectedArchiveSprite, setSelectedArchiveSprite] = useState<MyOsSpriteEntry | null>(null);

    const selectedSpecies = DND_SPECIES_LIST[speciesIdx] || DND_SPECIES_LIST[0];
    const selectedClass = DND_CLASS_LIST[classIdx] || DND_CLASS_LIST[0];
    const selectedArmor = ARMOR_OPTIONS[armorIdx] || ARMOR_OPTIONS[0];
    const selectedWeapon = WEAPON_OPTIONS[weaponIdx] || WEAPON_OPTIONS[0];
    const selectedShield = SHIELD_OPTIONS[shieldIdx] || SHIELD_OPTIONS[0];
    const selectedRegion = DND_REGIONS[regionIdx] || DND_REGIONS[0];
    const selectedHair = HAIRSTYLES[hairIdx] || HAIRSTYLES[0];

    // Apply Starter Gear Kit when Class changes
    const handleSelectClass = (newClassIdx: number) => {
        setClassIdx(newClassIdx);
        const cls = DND_CLASS_LIST[newClassIdx];
        if (cls) {
            const foundArmorIdx = ARMOR_OPTIONS.findIndex(a => a.id === cls.starterArmor);
            if (foundArmorIdx >= 0) setArmorIdx(foundArmorIdx);

            const foundWpnIdx = WEAPON_OPTIONS.findIndex(w => w.id === cls.starterWeapon);
            if (foundWpnIdx >= 0) setWeaponIdx(foundWpnIdx);

            const foundShieldIdx = SHIELD_OPTIONS.findIndex(s => s.id === cls.starterOffhand);
            if (foundShieldIdx >= 0) setShieldIdx(foundShieldIdx);
        }
    };

    const [leftPanelMode, setLeftPanelMode] = useState<'scrying' | 'modular'>('scrying');

    const handleApplyScriedConcept = (c: Partial<DnDCharacterConcept>) => {
        setSelectedArchiveSprite(null);
        if (c.gender) setGender(c.gender as 'male' | 'female');
        if (c.species) {
            const sIdx = DND_SPECIES_LIST.findIndex(s => s.id.toLowerCase() === c.species?.toLowerCase() || s.name.toLowerCase() === c.species?.toLowerCase());
            if (sIdx >= 0) setSpeciesIdx(sIdx);
        }
        if (c.characterClass) {
            const cIdx = DND_CLASS_LIST.findIndex(cl => cl.id.toLowerCase() === c.characterClass?.toLowerCase() || cl.name.toLowerCase() === c.characterClass?.toLowerCase());
            if (cIdx >= 0) handleSelectClass(cIdx);
        }
        if (c.armor) {
            const aIdx = ARMOR_OPTIONS.findIndex(a => a.id.toLowerCase() === c.armor?.toLowerCase() || a.label.toLowerCase().includes(c.armor?.toLowerCase() || ''));
            if (aIdx >= 0) setArmorIdx(aIdx);
        }
        if (c.primaryWeapon) {
            const wIdx = WEAPON_OPTIONS.findIndex(w => w.id.toLowerCase() === c.primaryWeapon?.toLowerCase() || w.label.toLowerCase().includes(c.primaryWeapon?.toLowerCase() || ''));
            if (wIdx >= 0) setWeaponIdx(wIdx);
        }
    };

    // Keyboard Cyclotrope Ring Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                setActiveRing(prev => (prev - 1 + 5) % 5);
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                setActiveRing(prev => (prev + 1) % 5);
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                if (activeRing === 0) setSpeciesIdx(p => (p - 1 + DND_SPECIES_LIST.length) % DND_SPECIES_LIST.length);
                if (activeRing === 1) handleSelectClass((classIdx - 1 + DND_CLASS_LIST.length) % DND_CLASS_LIST.length);
                if (activeRing === 2) setArmorIdx(p => (p - 1 + ARMOR_OPTIONS.length) % ARMOR_OPTIONS.length);
                if (activeRing === 3) setWeaponIdx(p => (p - 1 + WEAPON_OPTIONS.length) % WEAPON_OPTIONS.length);
                if (activeRing === 4) setRegionIdx(p => (p - 1 + DND_REGIONS.length) % DND_REGIONS.length);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                if (activeRing === 0) setSpeciesIdx(p => (p + 1) % DND_SPECIES_LIST.length);
                if (activeRing === 1) handleSelectClass((classIdx + 1) % DND_CLASS_LIST.length);
                if (activeRing === 2) setArmorIdx(p => (p + 1) % ARMOR_OPTIONS.length);
                if (activeRing === 3) setWeaponIdx(p => (p + 1) % WEAPON_OPTIONS.length);
                if (activeRing === 4) setRegionIdx(p => (p + 1) % DND_REGIONS.length);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                setRenderMode(prev => prev === '2.5D_LPC' ? '3D_MESH' : '2.5D_LPC');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeRing, classIdx]);

    // Compose LPC Genome
    const concept: DnDCharacterConcept = useMemo(() => ({
        name: characterName,
        species: selectedSpecies.id,
        characterClass: selectedClass.id,
        gender,
        region: selectedRegion.id,
        armor: selectedArmor.id,
        primaryWeapon: selectedWeapon.id,
        offhandWeapon: selectedShield.id,
        hairStyle: selectedHair.id,
        shoulders: selectedClass.starterShoulders,
        headwear: selectedClass.starterHead
    }), [characterName, selectedSpecies, selectedClass, gender, selectedRegion, selectedArmor, selectedWeapon, selectedShield, selectedHair]);

    const lpcGenome = useMemo(() => DnDEquipmentCompositor.composeGenome(concept), [concept]);

    const displayGenome = useMemo(() => {
        if (selectedArchiveSprite) {
            return {
                body: selectedArchiveSprite.id,
                hair: 'none',
                legs: 'none',
                torso: 'none'
            };
        }
        return lpcGenome;
    }, [selectedArchiveSprite, lpcGenome]);

    // Ring Item Catalogs
    const speciesItems: CyclotropeItem[] = useMemo(() => DND_SPECIES_LIST.map(s => ({
        id: s.id,
        label: s.name,
        icon: s.icon,
        sublabel: s.abilityBonus,
        color: s.color
    })), []);

    const classItems: CyclotropeItem[] = useMemo(() => DND_CLASS_LIST.map(c => ({
        id: c.id,
        label: c.name,
        icon: c.icon,
        sublabel: c.role,
        color: c.color
    })), []);

    const armorItems: CyclotropeItem[] = useMemo(() => ARMOR_OPTIONS.map(a => ({
        id: a.id,
        label: a.label,
        icon: a.icon,
        color: '#ffbb33'
    })), []);

    const weaponItems: CyclotropeItem[] = useMemo(() => WEAPON_OPTIONS.map(w => ({
        id: w.id,
        label: w.label,
        icon: w.icon,
        color: '#ff4466'
    })), []);

    const regionItems: CyclotropeItem[] = useMemo(() => DND_REGIONS.map(r => ({
        id: r.id,
        label: r.name,
        icon: r.icon,
        sublabel: r.tagline,
        color: r.accentColor
    })), []);

    const handleApply = (target: 'user' | 'companion') => {
        let genomePayload: AvatarGenome;
        if (selectedArchiveSprite) {
            genomePayload = {
                body: selectedArchiveSprite.id,
                name: selectedArchiveSprite.name,
                archetypeId: selectedArchiveSprite.id,
                manifestSprite: JSON.stringify(selectedArchiveSprite)
            };
        } else {
            genomePayload = {
                ...lpcGenome,
                species: selectedSpecies.id,
                characterClass: selectedClass.id,
                armorTier: selectedArmor.id,
                gender
            };
        }

        if (target === 'user') {
            if (onApplyToUser) onApplyToUser(genomePayload);
            updateAgentGenome('user', { genome: genomePayload });
        } else {
            updateAgentGenome('orchestrator', { genome: genomePayload });
        }

        setAppliedNotice(true);
        setTimeout(() => setAppliedNotice(false), 2500);
    };

    return (
        <div className={isNested ? "w-full h-full relative bg-[#06060c] flex flex-col select-none overflow-hidden" : "fixed inset-0 z-50 bg-[#06060c]/95 flex flex-col backdrop-blur-md select-none"}>
            {/* Top Bar Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-indigo-500/20 bg-black/40">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-wider text-white flex items-center gap-2">
                            DIEGETIC HERO STUDIO <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">ASTROLABE CYCLOTROPE</span>
                        </h2>
                        <p className="text-xs text-zinc-400 font-mono">
                            Use [W/S] to Switch Rings â€¢ [A/D] or Drag to Spin â€¢ [Tab] Toggle 2.5D / 3D
                        </p>
                    </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-3">
                    {/* Render Mode Toggle */}
                    <button
                        onClick={() => setRenderMode(prev => prev === '2.5D_LPC' ? '3D_MESH' : '2.5D_LPC')}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                            renderMode === '2.5D_LPC'
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                : 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        }`}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        MODE: {renderMode === '2.5D_LPC' ? '2.5D True HD Pixel' : '3D Stylized Mesh'}
                    </button>

                    <button
                        onClick={() => setIsArchiveVaultOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/60 text-amber-200 font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(212,175,55,0.3)] transition-all"
                    >
                        <span className="text-[#ffd700] text-sm">âœ </span>
                        <span>Archive Vault (21)</span>
                    </button>

                    <button
                        onClick={() => handleApply('user')}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                    >
                        <Check className="w-4 h-4" /> Equip as Player
                    </button>

                    <button
                        onClick={() => handleApply('companion')}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
                    >
                        <Check className="w-4 h-4" /> Equip as AI Companion
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Stage & Cyclotrope Viewport */}
            <div className="flex-1 relative flex">
                {/* Left Ring Control Selector */}
                <div className="w-80 border-r border-indigo-500/20 bg-black/60 backdrop-blur-md p-4 flex flex-col gap-3 z-10 overflow-y-auto custom-scrollbar">
                    {/* Mode Switcher */}
                    <div className="flex bg-black/80 p-1 rounded-xl border border-indigo-500/30 gap-1 shrink-0">
                        <button
                            onClick={() => setLeftPanelMode('scrying')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                leftPanelMode === 'scrying'
                                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <span>🪞 Scrying Mirror</span>
                        </button>
                        <button
                            onClick={() => setLeftPanelMode('modular')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                leftPanelMode === 'modular'
                                    ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <span>🛡️ Modular Craft</span>
                        </button>
                    </div>

                    {leftPanelMode === 'scrying' ? (
                        <AstralScryingMirror
                            onApplyConcept={handleApplyScriedConcept}
                            onSelectArchetypePreset={(presetId) => {
                                console.log('[HeroStudio] Selected preset:', presetId);
                            }}
                        />
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-1">
                                Active Orbital Ring
                            </div>
                            {[
                                { idx: 0, label: '1. Race & Anatomy', icon: '🧬', value: selectedSpecies.name },
                                { idx: 1, label: '2. Class Starter Kit', icon: '⚔️', value: selectedClass.name },
                                { idx: 2, label: '3. Modular Armor Slot', icon: '🛡️', value: selectedArmor.label },
                                { idx: 3, label: '4. Weapons & Shield', icon: '🗡️', value: `${selectedWeapon.label}` },
                                { idx: 4, label: '5. Regional Style', icon: '🗺️', value: selectedRegion.name },
                            ].map((ring) => (
                                <button
                                    key={ring.idx}
                                    onClick={() => setActiveRing(ring.idx)}
                                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-0.5 cursor-pointer ${
                                        activeRing === ring.idx
                                            ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                                            : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-xs font-bold font-mono">
                                        <span>{ring.label}</span>
                                        <span>{ring.icon}</span>
                                    </div>
                                    <div className="text-xs font-sans text-indigo-300 truncate">
                                        {ring.value}
                                    </div>
                                </button>
                            ))}

                            <hr className="border-zinc-800 my-2" />

                            {/* Gender & Hair Quick Controls */}
                            <div className="flex flex-col gap-2">
                                <div className="text-xs font-mono text-zinc-400">Gender Form</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['male', 'female'] as const).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setGender(g)}
                                            className={`py-1.5 rounded-lg border text-xs font-mono font-bold capitalize transition-all cursor-pointer ${
                                                gender === g
                                                    ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                                <div className="text-xs font-mono text-zinc-400">Hairstyle</div>
                                <select
                                    value={hairIdx}
                                    onChange={(e) => setHairIdx(Number(e.target.value))}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                                >
                                    {HAIRSTYLES.map((h, i) => (
                                        <option key={h.id} value={i}>{h.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                                <div className="text-xs font-mono text-zinc-400">Offhand Shield / Implement</div>
                                <select
                                    value={shieldIdx}
                                    onChange={(e) => setShieldIdx(Number(e.target.value))}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                                >
                                    {SHIELD_OPTIONS.map((s, i) => (
                                        <option key={s.id} value={i}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3D Canvas Center Stage */}
                <div className="flex-1 relative bg-gradient-to-b from-[#06060c] via-[#0d0d1a] to-[#040408]">
                    <Canvas camera={{ position: [0, 2.0, 7.2], fov: 40 }}>
                        <ambientLight intensity={1.4} />
                        <directionalLight position={[5, 10, 5]} intensity={2.0} castShadow />
                        <pointLight position={[-5, 5, -5]} color="#00ffff" intensity={0.8} />
                        <pointLight position={[5, -2, 5]} color="#ff00ff" intensity={0.6} />

                        {/* Manifestation Pedestal Floor (Flat on X-Z floor plane) */}
                        <mesh position={[0, -0.05, 0]}>
                            <cylinderGeometry args={[2.0, 2.2, 0.1, 64]} />
                            <meshStandardMaterial color="#101222" roughness={0.5} metalness={0.6} />
                        </mesh>

                        {/* Concentric Arcane Floor Runes */}
                        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.7, 0.75, 48]} />
                            <meshBasicMaterial color="#6366f1" transparent opacity={0.6} />
                        </mesh>
                        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[1.2, 1.25, 48]} />
                            <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
                        </mesh>

                        {/* Active Character Model on Pedestal */}
                        <group position={[0, 0, 0]}>
                            <SemanticAvatar
                                pillarName="hero_preview"
                                pillarIndex={0}
                                genome={displayGenome as any}
                                action={action}
                                scale={2.2}
                                cameraRotationY={0}
                                velocity={[0, 0, 0]}
                            />
                        </group>

                        {/* Diegetic Cyclotrope Orbital Halo comfortably above character head */}
                        <DiegeticHeroCyclotrope
                            items={activeRing === 0 ? speciesItems : (activeRing === 1 ? classItems : (activeRing === 2 ? armorItems : (activeRing === 3 ? weaponItems : regionItems)))}
                            selectedIndex={activeRing === 0 ? speciesIdx : (activeRing === 1 ? classIdx : (activeRing === 2 ? armorIdx : (activeRing === 3 ? weaponIdx : regionIdx)))}
                            onSelectIndex={(idx) => {
                                if (activeRing === 0) setSpeciesIdx(idx);
                                if (activeRing === 1) handleSelectClass(idx);
                                if (activeRing === 2) setArmorIdx(idx);
                                if (activeRing === 3) setWeaponIdx(idx);
                                if (activeRing === 4) setRegionIdx(idx);
                            }}
                            radius={2.0}
                            yOffset={3.8}
                            color={activeRing === 0 ? '#ffcc88' : (activeRing === 1 ? '#cc3333' : (activeRing === 2 ? '#ffbb33' : (activeRing === 3 ? '#ff4466' : '#3388ff')))}
                            ringLabel={activeRing === 0 ? 'D&D RACE BASE' : (activeRing === 1 ? 'CLASS STARTER' : (activeRing === 2 ? 'MODULAR ARMOR' : (activeRing === 3 ? 'WEAPONS' : 'REGIONAL ATTIRE')))}
                            isActiveRing={true}
                        />

                        <OrbitControls 
                            enablePan={false} 
                            minDistance={3.0} 
                            maxDistance={10.0} 
                            minPolarAngle={Math.PI / 6} 
                            maxPolarAngle={Math.PI / 2}
                            target={[0, 1.6, 0]} 
                        />
                    </Canvas>

                    {/* Bottom Animation & Testing Dock */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-lg border border-indigo-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                        {(['idle', 'walk', 'sprint', 'slash', 'spellcast', 'hurt'] as const).map(act => (
                            <button
                                key={act}
                                onClick={() => setAction(act)}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold capitalize transition-all ${
                                    action === act
                                        ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {act}
                            </button>
                        ))}
                    </div>

                    {/* Active Archive Model Notice */}
                    {selectedArchiveSprite && (
                        <div className="absolute top-4 left-4 z-20 px-4 py-2 rounded-xl bg-[#121024]/90 border border-[#d4af37]/60 backdrop-blur-md flex items-center gap-3 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                            <span className="text-[#ffd700] font-serif text-base">âœ </span>
                            <div>
                                <div className="text-xs font-bold font-serif text-amber-100">{selectedArchiveSprite.name}</div>
                                <div className="text-[10px] font-mono text-amber-300/70">{selectedArchiveSprite.badge}</div>
                            </div>
                            <button
                                onClick={() => setSelectedArchiveSprite(null)}
                                className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                            >
                                Reset to Modular
                            </button>
                        </div>
                    )}

                    {/* Applied Toast Notice */}
                    <AnimatePresence>
                        {appliedNotice && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-emerald-600/90 text-white font-mono text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Avatar Successfully Manifested & Equipped!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Archive Vault Slide-Out Drawer (100% Backward-Compatible Legacy Catalog) */}
            <ArchiveVault
                isOpen={isArchiveVaultOpen}
                onClose={() => setIsArchiveVaultOpen(false)}
                activeArchetypeId={selectedArchiveSprite?.id}
                onSelectArchetype={(id, sprite) => {
                    setSelectedArchiveSprite(sprite);
                    setIsArchiveVaultOpen(false);
                }}
            />
        </div>
    );
};
