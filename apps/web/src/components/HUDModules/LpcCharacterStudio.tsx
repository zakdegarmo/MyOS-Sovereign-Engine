import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Shield, Sparkles, ChevronLeft, ChevronRight, Flag, 
    Download, RotateCw, Play, Pause, Check, Eye, Trash2, Sliders, Search, X, Copy
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { type AvatarGenome, type LpcAction } from '../../hooks/useAvatarCompositor';
import { useCouncil } from '../../council/CouncilContext';

export interface FlaggedAsset {
    id: string;
    layer: string;
    filename: string;
    notes: string;
    timestamp: string;
    genomeSnapshot: AvatarGenome;
}

interface LpcCharacterStudioProps {
    onClose?: () => void;
    onApplyToUser?: (genome: AvatarGenome) => void;
}

type StudioCategory = 'body' | 'head' | 'ears' | 'hair' | 'facial' | 'torso' | 'legs' | 'feet' | 'arms' | 'shoulders' | 'hat' | 'weapon' | 'offhand';

interface CategoryMeta {
    key: StudioCategory;
    label: string;
    icon: string;
    description: string;
}

const CATEGORIES: CategoryMeta[] = [
    { key: 'body', label: 'Anatomy & Skin', icon: '🧬', description: 'Body structure and skin tone variants' },
    { key: 'head', label: 'Species & Head', icon: '👤', description: 'Head shape, race, and facial contours' },
    { key: 'ears', label: 'Ears & Horns', icon: '🧝', description: 'Species ears (Elven, Dragon, Cat, Wolf, etc.)' },
    { key: 'hair', label: 'Hairstyle', icon: '💈', description: 'Hair cuts, braids, and extensions' },
    { key: 'facial', label: 'Facial Hair', icon: '🧔', description: 'Beards, mustaches, and face markings' },
    { key: 'torso', label: 'Chest Armor', icon: '🛡️', description: 'Shirts, tunics, chainmail, plate, robes' },
    { key: 'legs', label: 'Legs & Pants', icon: '👖', description: 'Pants, kilts, skirts, greaves' },
    { key: 'feet', label: 'Footwear', icon: '👢', description: 'Boots, shoes, sandals, plate boots' },
    { key: 'arms', label: 'Arm Guards', icon: '🥊', description: 'Sleeves, bracers, gauntlets' },
    { key: 'shoulders', label: 'Cloaks & Shoulders', icon: '🧥', description: 'Pauldrons, capes, cloaks' },
    { key: 'hat', label: 'Headwear & Helmets', icon: '🪖', description: 'Helmets, crowns, hoods, hats' },
    { key: 'weapon', label: 'Main Hand Weapon', icon: '⚔️', description: 'Swords, axes, bows, staves' },
    { key: 'offhand', label: 'Offhand & Shield', icon: '🛡️', description: 'Shields, torches, spell implements' },
];

const VELOCITY_MAP: Record<'D' | 'L' | 'R' | 'U', [number, number, number]> = {
    'D': [0, 0, 1],
    'U': [0, 0, -1],
    'R': [1, 0, 0],
    'L': [-1, 0, 0]
};

export const LpcCharacterStudio: React.FC<LpcCharacterStudioProps> = ({ onClose, onApplyToUser }) => {
    const { updateAgentGenome } = useCouncil();
    const [manifest, setManifest] = useState<Record<string, string[]>>({});
    const [isLoadingManifest, setIsLoadingManifest] = useState(true);

    // Active Selection State
    const [activeCategory, setActiveCategory] = useState<StudioCategory>('body');
    const [currentGenome, setCurrentGenome] = useState<AvatarGenome>({
        body: 'body_bodies_male.png',
        head: 'head_heads_human_male.png',
        ears: 'none',
        hair: 'adult_universal_hair_shortknot.png',
        facial: 'none',
        torso: 'lpcfemaleplatemail_0.png',
        legs: 'lpcfemaleplategreaves_0.png',
        feet: 'lpcfemalegoldenboots.png',
        arms: 'none',
        shoulders: 'none',
        hat: 'none',
        weapon: 'none',
        offhand: 'none'
    });

    // Preview Controls
    const [action, setAction] = useState<LpcAction>('idle');
    const [direction, setDirection] = useState<'U' | 'D' | 'L' | 'R'>('D');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedNotice, setCopiedNotice] = useState(false);

    // Flagged Assets State (Human-in-the-Loop)
    const [flaggedAssets, setFlaggedAssets] = useState<FlaggedAsset[]>(() => {
        try {
            const saved = localStorage.getItem('lpc_flagged_assets');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    return (
        <div className="relative flex flex-col h-full bg-slate-950 text-white overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/60">
                <div className="flex items-center gap-3">
                    <User className="text-cyan-400" size={20} />
                    <h2 className="text-sm font-bold tracking-wider uppercase">Character Studio</h2>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10">
                        <X size={18} />
                    </button>
                )}
            </div>
            <div className="p-4 text-xs text-white/60">
                Select equipment and character layers to customize archetypes for your world.
            </div>
        </div>
    );
};
