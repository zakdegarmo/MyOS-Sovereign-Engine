import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Swords, Wand2, Sparkles, Check, RotateCw, X, Play, 
    ChevronRight, Zap, Heart, ShieldAlert, Footprints, Flame, Dices, User, Scissors
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { 
    DnDEquipmentCompositor, 
    DND_SPECIES_LIST, 
    DND_CLASS_LIST, 
    type DnDSpecies, 
    type DnDClass, 
    type DnDArmorType, 
    type DnDWeapon,
    type DnDCharacterConcept
} from '../../engine/DnDEquipmentCompositor';
import { type LpcAction, type AvatarGenome } from '../../hooks/useAvatarCompositor';
import { useCouncil } from '../../council/CouncilContext';

interface DnDHeroStudioProps {
    onClose?: () => void;
    onApplyToUser?: (genome: AvatarGenome) => void;
}

const VELOCITY_MAP: Record<'D' | 'L' | 'R' | 'U', [number, number, number]> = {
    'D': [0, 0, 1],
    'U': [0, 0, -1],
    'R': [1, 0, 0],
    'L': [-1, 0, 0]
};

interface PreMadeHero {
    name: string;
    species: DnDSpecies;
    characterClass: DnDClass;
    armor: DnDArmorType;
    primaryWeapon: DnDWeapon;
    offhand: DnDWeapon;
    gender: 'male' | 'female';
    hairStyle: string;
    icon: string;
}

const PREMADE_HEROES: PreMadeHero[] = [
    { name: 'Drizzt Shadowblade', species: 'Drow', characterClass: 'Rogue', armor: 'Leather', primaryWeapon: 'Dagger', offhand: 'Unarmed', gender: 'male', hairStyle: 'adult_universal_hair_longknot.png', icon: '🗡️' },
    { name: 'Gimli Ironbreaker', species: 'MountainDwarf', characterClass: 'Fighter', armor: 'PlateMail', primaryWeapon: 'Battleaxe', offhand: 'Shield', gender: 'male', hairStyle: 'adult_universal_hair_shortknot.png', icon: '🛡️' },
    { name: 'Elminster Arcane', species: 'HighElf', characterClass: 'Wizard', armor: 'WizardRobes', primaryWeapon: 'ArcaneStaff', offhand: 'Unarmed', gender: 'male', hairStyle: 'adult_universal_hair_longknot.png', icon: '🔮' },
    { name: 'Bahamut Champion', species: 'Dragonborn', characterClass: 'Paladin', armor: 'PlateMail', primaryWeapon: 'Greatsword', offhand: 'Shield', gender: 'male', hairStyle: 'none', icon: '🐲' },
    { name: 'Skulker Shadowstalker', species: 'Goblin', characterClass: 'Ranger', armor: 'Leather', primaryWeapon: 'Longbow', offhand: 'Unarmed', gender: 'male', hairStyle: 'none', icon: '👺' },
];

export const DnDHeroStudio: React.FC<DnDHeroStudioProps> = ({ onClose, onApplyToUser }) => {
    const { updateAgentGenome } = useCouncil();

    // D&D Concept State
    const [characterName, setCharacterName] = useState('Valerius the Bold');
    const [selectedSpecies, setSelectedSpecies] = useState<DnDSpecies>('Human');
    const [selectedClass, setSelectedClass] = useState<DnDClass>('Fighter');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [armorTier, setArmorTier] = useState<DnDArmorType>('PlateMail');
    const [weapon, setWeapon] = useState<DnDWeapon>('Greatsword');
    const [offhand, setOffhand] = useState<DnDWeapon>('Shield');
    const [hairStyle, setHairStyle] = useState<string>('adult_universal_hair_shortknot.png');
    const [facialHair, setFacialHair] = useState<string>('none');

    // Stage Viewport Controls
    const [action, setAction] = useState<LpcAction>('idle');
    const [direction, setDirection] = useState<'D' | 'L' | 'R' | 'U'>('D');
    const [appliedNotice, setAppliedNotice] = useState(false);

    // Selected Species & Class Metadata
    const speciesMeta = useMemo(() => DND_SPECIES_LIST.find(s => s.id === selectedSpecies)!, [selectedSpecies]);
    const classMeta = useMemo(() => DND_CLASS_LIST.find(c => c.id === selectedClass)!, [selectedClass]);

    // Automatically compose LPC Genome from D&D choices
    const concept: DnDCharacterConcept = useMemo(() => ({
        name: characterName,
        species: selectedSpecies,
        characterClass: selectedClass,
        armor: armorTier,
        primaryWeapon: weapon,
        offhandWeapon: offhand,
        gender,
        hairStyle,
        facialHairStyle: facialHair
    }), [characterName, selectedSpecies, selectedClass, armorTier, weapon, offhand, gender, hairStyle, facialHair]);

    const lpcGenome = useMemo(() => DnDEquipmentCompositor.composeGenome(concept), [concept]);

    // Load a Pre-Made Hero
    const handleLoadPremade = (hero: PreMadeHero) => {
        setCharacterName(hero.name);
        setSelectedSpecies(hero.species);
        setSelectedClass(hero.characterClass);
        setArmorTier(hero.armor);
        setWeapon(hero.primaryWeapon);
        setOffhand(hero.offhand);
        setGender(hero.gender);
        setHairStyle(hero.hairStyle);
    };

    // Calculated 5e Stats
    const calculatedStats = useMemo(() => {
        let baseAc = 10;
        if (armorTier === 'PlateMail') baseAc = 18;
        else if (armorTier === 'ChainMail') baseAc = 16;
        else if (armorTier === 'Leather') baseAc = 12;
        else if (armorTier === 'WizardRobes') baseAc = 11;
        if (offhand === 'Shield') baseAc += 2;

        let baseHp = 10;
        if (selectedClass === 'Barbarian') baseHp = 14;
        else if (selectedClass === 'Fighter' || selectedClass === 'Paladin' || selectedClass === 'Ranger') baseHp = 12;
        else if (selectedClass === 'Wizard' || selectedClass === 'Sorcerer') baseHp = 8;

        return { ac: baseAc, hp: baseHp, speed: selectedSpecies === 'Halfling' || selectedSpecies === 'MountainDwarf' ? 25 : 30 };
    }, [armorTier, offhand, selectedClass, selectedSpecies]);

    // Handle deploy to player
    const handleDeploy = () => {
        const fullGenome: AvatarGenome = {
            body: lpcGenome.body || 'body_bodies_male.png',
            head: lpcGenome.head || 'head_heads_human_male.png',
            ears: lpcGenome.ears || 'none',
            hair: lpcGenome.hair || 'adult_universal_hair_shortknot.png',
            facial: lpcGenome.facial || 'none',
            torso: lpcGenome.torso || 'none',
            legs: lpcGenome.legs || 'black_heropants_male.png',
            feet: lpcGenome.feet || 'lpcfemalegoldenboots.png',
            arms: 'none',
            shoulders: 'none',
            hat: 'none',
            weapon: lpcGenome.weapon || 'none',
            offhand: lpcGenome.offhand || 'none'
        };

        updateAgentGenome('user', {
            genome: fullGenome,
            pillarIdx: 0,
            hueShift: 0
        });

        if (onApplyToUser) onApplyToUser(fullGenome);
        setAppliedNotice(true);
        setTimeout(() => setAppliedNotice(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 bg-black/95 backdrop-blur-2xl font-serif text-white select-none overflow-hidden">
            {/* Studio Outer Window */}
            <div className="relative flex flex-col w-full max-w-7xl h-[94vh] bg-slate-950 border-2 border-amber-500/60 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.3)] overflow-hidden">

                {/* --- HEADER BAR --- */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-amber-500/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/20 border border-amber-400 rounded-2xl text-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            <Dices size={26} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-wide text-yellow-300 font-serif flex items-center gap-2">
                                D&D 5E HERO STUDIO
                                <span className="text-xs font-mono px-2.5 py-0.5 bg-amber-500/20 text-yellow-300 border border-amber-400 rounded-full font-bold uppercase tracking-wider">
                                    High Contrast Engine
                                </span>
                            </h2>
                            <p className="text-xs text-amber-200/80 font-sans">
                                Color-matched species heads, pre-made archetypes & real-time paperdoll customizer
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDeploy}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-yellow-400 text-slate-950 font-black text-xs font-mono uppercase rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all active:scale-95 cursor-pointer"
                        >
                            <Sparkles size={16} />
                            <span>{appliedNotice ? 'HERO DEPLOYED!' : 'DEPLOY TO MYOS WORLD'}</span>
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-400 text-white rounded-xl transition-all cursor-pointer"
                            >
                                <X size={22} />
                            </button>
                        )}
                    </div>
                </div>

                {/* --- PRE-MADE HEROES QUICK SELECTION BANNER --- */}
                <div className="px-6 py-2 bg-slate-900/90 border-b border-amber-500/20 flex items-center justify-between gap-2 overflow-x-auto">
                    <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                        <Zap size={14} /> Pre-Made Archetypes:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto py-0.5 custom-scrollbar">
                        {PREMADE_HEROES.map(hero => (
                            <button
                                key={hero.name}
                                onClick={() => handleLoadPremade(hero)}
                                className="px-3 py-1 bg-slate-950 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-xs font-serif font-bold text-yellow-200 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                                <span>{hero.icon}</span>
                                <span>{hero.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- STUDIO 3-COLUMN LAYOUT --- */}
                <div className="grid grid-cols-12 flex-1 overflow-hidden">

                    {/* --- COLUMN 1: SPECIES & CLASS SELECTION --- */}
                    <div className="col-span-4 flex flex-col bg-slate-950 border-r border-amber-500/30 overflow-hidden font-sans">
                        
                        {/* Name Input & Gender Toggle */}
                        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-yellow-400 uppercase font-mono tracking-widest">Character Name</label>
                                <input
                                    type="text"
                                    value={characterName}
                                    onChange={e => setCharacterName(e.target.value)}
                                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3.5 py-2 text-sm text-yellow-100 font-serif font-bold focus:outline-none focus:border-yellow-400"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-widest">Frame Gender</span>
                                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    {(['male', 'female'] as const).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setGender(g)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                                                gender === g
                                                    ? 'bg-amber-500 text-slate-950 font-mono font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                                    : 'text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Species & Class Picker Tabs */}
                        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
                            
                            {/* D&D Species Selector */}
                            <div className="space-y-2">
                                <div className="text-xs font-bold uppercase font-mono tracking-widest text-yellow-400 flex items-center justify-between">
                                    <span>1. Select Species / Race</span>
                                    <span className="text-slate-400">{DND_SPECIES_LIST.length} Races</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {DND_SPECIES_LIST.map(s => {
                                        const isSelected = selectedSpecies === s.id;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedSpecies(s.id)}
                                                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-amber-500/20 border-amber-400 text-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-bold'
                                                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white'
                                                }`}
                                            >
                                                <span className="text-xl">{s.icon}</span>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold font-serif truncate text-white">{s.name}</div>
                                                    <div className="text-[10px] text-yellow-400 font-mono font-bold truncate">{s.abilityBonus}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* D&D Class Selector */}
                            <div className="space-y-2 pt-3 border-t border-slate-800">
                                <div className="text-xs font-bold uppercase font-mono tracking-widest text-yellow-400 flex items-center justify-between">
                                    <span>2. Select Class / Kit</span>
                                    <span className="text-slate-400">{DND_CLASS_LIST.length} Classes</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {DND_CLASS_LIST.map(c => {
                                        const isSelected = selectedClass === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedClass(c.id);
                                                    setArmorTier(c.recommendedArmor);
                                                    setWeapon(c.recommendedWeapon);
                                                }}
                                                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-amber-500/20 border-amber-400 text-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-bold'
                                                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white'
                                                }`}
                                            >
                                                <span className="text-xl">{c.icon}</span>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold font-serif truncate text-white">{c.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono truncate">{c.role}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* --- COLUMN 2: STAGE & FRONT-LIT VIEWPORT (BALANCED LIGHTING) --- */}
                    <div className="col-span-5 flex flex-col bg-slate-950 relative border-r border-amber-500/30 overflow-hidden">
                        
                        {/* Viewport Top Bar: Animation & Facing Direction */}
                        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
                            {/* Action Animations */}
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono">
                                {(['idle', 'walk', 'slash', 'thrust', 'spellcast', 'bow', 'hurt'] as LpcAction[]).map(act => (
                                    <button
                                        key={act}
                                        onClick={() => setAction(act)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                                            action === act
                                                ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                                : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {act}
                                    </button>
                                ))}
                            </div>

                            {/* 4-Way Directions */}
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono">
                                {(['D', 'L', 'R', 'U'] as const).map(dir => (
                                    <button
                                        key={dir}
                                        onClick={() => setDirection(dir)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            direction === dir
                                                ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                                : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {dir}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Front-Lit 3D Stage (Balanced ambient=1.0 to prevent blowout) */}
                        <div className="flex-1 flex items-center justify-center relative p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-black">
                            
                            <div className="relative w-full h-full flex items-center justify-center p-2 bg-slate-900/40 border border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.15)] overflow-hidden">
                                <Canvas camera={{ position: [0, 0.35, 2.3], fov: 38 }}>
                                    {/* Balanced Soft Key Lighting (Ambient 1.0 prevents glowing blowout) */}
                                    <ambientLight intensity={1.0} />
                                    <directionalLight position={[0, 4, 6]} intensity={0.6} />
                                    
                                    <SemanticAvatar
                                        genome={lpcGenome as any}
                                        pillarIndex={0}
                                        pillarName="user"
                                        action={action}
                                        velocity={VELOCITY_MAP[direction]}
                                        isNeoRetro={true}
                                    />
                                    
                                    <OrbitControls enableZoom={true} enablePan={false} minDistance={1.0} maxDistance={4} target={[0, 0.35, 0]} />
                                </Canvas>
                            </div>
                        </div>

                        {/* Stage Footer Info */}
                        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
                            <span className="flex items-center gap-2 text-yellow-300 font-bold">
                                <span>{speciesMeta.icon}</span>
                                <span>{speciesMeta.name} {classMeta.name}</span>
                            </span>
                            <span>Action: <strong className="text-white uppercase">{action}</strong> | Facing: <strong className="text-white">{direction}</strong></span>
                        </div>
                    </div>

                    {/* --- COLUMN 3: GEAR, STATS & CUSTOMIZATION CARD --- */}
                    <div className="col-span-3 flex flex-col bg-slate-950 overflow-hidden font-sans">
                        
                        {/* 5e Stat Card Header */}
                        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
                            <div className="text-xs font-bold uppercase font-mono tracking-widest text-yellow-400">
                                3. 5e Combat Stat Block
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center font-mono">
                                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Armor Class</div>
                                    <div className="text-xl font-black text-yellow-300 flex items-center justify-center gap-1">
                                        <Shield size={16} /> {calculatedStats.ac}
                                    </div>
                                </div>
                                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Hit Points</div>
                                    <div className="text-xl font-black text-rose-400 flex items-center justify-center gap-1">
                                        <Heart size={16} /> {calculatedStats.hp}
                                    </div>
                                </div>
                                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Speed</div>
                                    <div className="text-xl font-black text-cyan-400 flex items-center justify-center gap-1">
                                        <Footprints size={16} /> {calculatedStats.speed}ft
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gear & Apparel Customizer */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            
                            {/* Hairstyle Customizer */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-yellow-400 uppercase font-mono tracking-widest flex items-center gap-1.5">
                                    <Scissors size={14} /> Hairstyle
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                                    {[
                                        { label: 'Long Knot', id: 'adult_universal_hair_longknot.png' },
                                        { label: 'Short Knot', id: 'adult_universal_hair_shortknot.png' },
                                        { label: 'Side Swoop', id: 'adult_universal_side_swoop.png' },
                                        { label: 'Messy Hair', id: 'adult_universal_hair_messy.png' },
                                        { label: 'Bald / None', id: 'none' }
                                    ].map(h => (
                                        <button
                                            key={h.id}
                                            onClick={() => setHairStyle(h.id)}
                                            className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                                                hairStyle === h.id
                                                    ? 'bg-amber-500/20 border-amber-400 text-yellow-300 font-bold'
                                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            {h.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Armor Tier Picker */}
                            <div className="space-y-2 pt-3 border-t border-slate-800">
                                <label className="text-xs font-bold text-yellow-400 uppercase font-mono tracking-widest">
                                    Armor Tier
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                                    {(['None', 'Leather', 'ChainMail', 'PlateMail', 'WizardRobes'] as DnDArmorType[]).map(arm => (
                                        <button
                                            key={arm}
                                            onClick={() => setArmorTier(arm)}
                                            className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                                                armorTier === arm
                                                    ? 'bg-amber-500/20 border-amber-400 text-yellow-300 font-bold'
                                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            {arm}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Primary Weapon Picker */}
                            <div className="space-y-2 pt-3 border-t border-slate-800">
                                <label className="text-xs font-bold text-yellow-400 uppercase font-mono tracking-widest">
                                    Primary Weapon
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                                    {(['Greatsword', 'Longsword', 'Dagger', 'ArcaneStaff', 'Longbow', 'Battleaxe', 'Unarmed'] as DnDWeapon[]).map(w => (
                                        <button
                                            key={w}
                                            onClick={() => setWeapon(w)}
                                            className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                                                weapon === w
                                                    ? 'bg-amber-500/20 border-amber-400 text-yellow-300 font-bold'
                                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Offhand Picker */}
                            <div className="space-y-2 pt-3 border-t border-slate-800">
                                <label className="text-xs font-bold text-yellow-400 uppercase font-mono tracking-widest">
                                    Offhand Equipment
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                                    {(['Unarmed', 'Shield'] as DnDWeapon[]).map(o => (
                                        <button
                                            key={o}
                                            onClick={() => setOffhand(o)}
                                            className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                                                offhand === o
                                                    ? 'bg-amber-500/20 border-amber-400 text-yellow-300 font-bold'
                                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            {o}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Deployment Footer */}
                        <div className="p-4 bg-slate-900 border-t border-slate-800">
                            <button
                                onClick={handleDeploy}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-yellow-400 text-slate-950 font-black text-xs font-mono uppercase rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all active:scale-95 cursor-pointer"
                            >
                                <Sparkles size={18} />
                                <span>{appliedNotice ? 'HERO DEPLOYED!' : 'DEPLOY HERO TO MYOS WORLD'}</span>
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};
