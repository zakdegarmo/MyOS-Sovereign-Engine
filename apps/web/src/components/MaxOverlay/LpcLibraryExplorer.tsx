import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, Image, Search } from 'lucide-react';
import { GENOME_LAYERS } from '../../hooks/useAvatarCompositor';

import { Lpc3DSynthesizerStudio } from '../HUDModules/Lpc3DSynthesizerStudio';

interface AssetEntry {
    path: string;
    context?: any;
}

interface LpcLibraryExplorerProps {
    manifest: {
        sprites: Record<string, (string | AssetEntry)[]>;
        environments: Record<string, (string | AssetEntry)[]>;
        uncategorized: (string | AssetEntry)[];
    };
    onSelectAsset: (layer: string, entry: string | AssetEntry) => void;
    onSelectPreset?: (preset: Record<string, string>, meta?: any) => void;
    currentGenome: Record<string, string>;
}

export const LpcLibraryExplorer: React.FC<LpcLibraryExplorerProps> = ({ manifest, onSelectAsset, onSelectPreset, currentGenome }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeRoot, setActiveRoot] = useState<'presets' | 'sprites' | 'environments' | 'uncategorized' | 'synthesizer'>('presets');
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ body: true });

    // Flatten all sprite assets for searching
    const allSpriteAssets = React.useMemo(() => {
        if (!manifest.sprites) return [];
        return Object.values(manifest.sprites).flat();
    }, [manifest.sprites]);

    const GENOME_KEYWORD_MAP: Record<string, string[]> = {
        body: ['body/', 'lpc_character_bases/', 'universal'],
        legs: ['legs/'],
        torso: ['torso/'],
        hair: ['hair/'],
        feet: ['feet/'],
        hat: ['hat/'],
        head: ['head/heads/'],
        nose: ['head/nose/'],
        ears: ['head/ears/'],
        eyes: ['eyes/'],
        facial: ['facial/'],
        shoulders: ['shoulders/'],
        arms: ['arms/'],
        weapon: ['weapon/'],
        offhand: ['offhand/'],
        sequences: [] 
    };

    const PRESETS = [
        {
            name: 'Lunaria (Lunar Archmage)',
            dndClass: 'Circle of the Stars • Level 12',
            badge: 'SELÛNITE HIGH ARCHMAGE',
            badgeColor: 'bg-gradient-to-r from-amber-500/30 to-purple-500/30 text-amber-300 border-amber-500/50',
            description: 'High Elven celestial sorceress in crimson liturgical vestments and royal violet mantle, channeling radiant lunar resonance and dual orbital spell rings.',
            portraitUrl: '/assets/portraits/lunaria_moon_sorceress.png',
            stats: { str: 10, dex: 16, con: 16, int: 22, wis: 20, cha: 18, ac: 18, hp: 86, speed: 35, perception: 22 },
            skills: [
                { name: 'Celestial Star Map', stat: 'WIS', dc: 15, desc: 'Divining optimal architectural code paths via cosmic alignment.' },
                { name: 'Dual Runic Sigil Weave', stat: 'INT', dc: 16, desc: 'Channeling twin orbital solar-lunar spell rings for simultaneous multi-tasking.' },
                { name: 'Twilight Sanctuary Ward', stat: 'CHA', dc: 15, desc: 'Projecting a calming aura that dispels runtime system errors.' }
            ],
            genome: {
                body: '/actions/lunaria_sorceress_walk.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'FLESH Heroine (JRPG)',
            dndClass: 'Ranger / Outrider • Level 5',
            badge: '16-BIT CONFORMAL HEROINE',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            description: 'Authentic 16-bit JRPG heroine with mint flowing locks, authentic LPC facial features, conformal forest green tunic, traveling breeches, and leather boots synthesized via the FLESH 10 Pillars pipeline.',
            stats: { str: 14, dex: 18, con: 15, int: 14, wis: 16, cha: 16, ac: 17, hp: 48, speed: 35, perception: 18 },
            skills: [
                { name: '8-Way Conformal Traversal', stat: 'DEX', dc: 12, desc: 'Omnidirectional movement across complex isometric landscapes.' },
                { name: 'Conformal Armor Weave', stat: 'CON', dc: 13, desc: 'Layering zero-batwing cloth and leather shells over anatomical mesh.' },
                { name: 'Facial Emotion Projection', stat: 'CHA', dc: 12, desc: 'Hot-swapping expressive pixel decals for dynamic dialogue JUICE.' }
            ],
            genome: {
                body: '/actions/flesh_female_adventurer_walk.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'Sunlit Paladin',
            dndClass: 'Oath of Devotion • Level 5',
            badge: 'HOLY CRUSADER',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            description: 'Heavy plate armor champion bearing blessed radiance, capable of physical workspace warding and robust system defense.',
            stats: { str: 18, dex: 12, con: 16, int: 10, wis: 14, cha: 18, ac: 19, hp: 52, speed: 30, perception: 14 },
            skills: [
                { name: 'Physically Move UI Window', stat: 'STR', dc: 12, desc: 'Gripping and dragging desktop workspace panels.' },
                { name: 'Deploy Sovereign Ward', stat: 'CHA', dc: 14, desc: 'Shielding local runtime from rogue child processes.' },
                { name: 'Sense Corrupt Memory', stat: 'WIS', dc: 13, desc: 'Perceiving memory leaks or stale context cache.' }
            ],
            genome: {
                body: 'body/bodies/sunlit_paladin.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'Moonlit Mage',
            dndClass: 'School of Evocation • Level 6',
            badge: 'ARCANE SCHOLAR',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            description: 'Astral sorcerer attuned to local neural weights, channeling high-entropy LLM thoughts into structured execution.',
            stats: { str: 9, dex: 14, con: 14, int: 20, wis: 16, cha: 14, ac: 15, hp: 38, speed: 30, perception: 16 },
            skills: [
                { name: 'Deep Codebase AST Parse', stat: 'INT', dc: 14, desc: 'Parsing entire monorepos via tree-sitter grammars.' },
                { name: 'Channel Swarm Mana', stat: 'WIS', dc: 15, desc: 'Orchestrating concurrent Ollama subagents.' },
                { name: 'Transmute File Format', stat: 'INT', dc: 13, desc: 'Refactoring JSON to JSON-LD ontology vectors.' }
            ],
            genome: {
                body: 'body/bodies/moonlit_mage.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'Elven Shadow Rogue',
            dndClass: 'Arcane Trickster • Level 5',
            badge: 'SHADOW INFILTRATOR',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            description: 'Agile stealth specialist executing silent background scripts, hunting memory bottlenecks, and bypassing UI latency.',
            stats: { str: 12, dex: 20, con: 14, int: 16, wis: 14, cha: 12, ac: 17, hp: 44, speed: 35, perception: 18 },
            skills: [
                { name: 'Silent Subagent Spawn', stat: 'DEX', dc: 13, desc: 'Running daemon tasks without locking the UI.' },
                { name: 'Disarm Lockfiles & Port Clashes', stat: 'DEX', dc: 14, desc: 'Killing stuck processes on port 5173/8080.' },
                { name: 'Scour Filesystem Ledger', stat: 'INT', dc: 12, desc: 'Rapid indexing of vector database chunks.' }
            ],
            genome: {
                body: 'body/bodies/elven_shadow_assassin.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'KayKit Barbarian',
            dndClass: 'Path of the Berserker • Level 5',
            badge: 'HEAVY JUGGERNAUT',
            badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
            description: 'Unstoppable physical powerhouse capable of moving heavyweight UI windows, breaking CPU throttle limits, and crushing lag.',
            stats: { str: 20, dex: 14, con: 18, int: 8, wis: 11, cha: 10, ac: 16, hp: 65, speed: 40, perception: 12 },
            skills: [
                { name: 'Force Drag Heavy 3D Viewport', stat: 'STR', dc: 15, desc: 'Repositioning multi-viewport canvas layouts.' },
                { name: 'Rage Against OOM Crash', stat: 'CON', dc: 14, desc: 'Surviving memory spikes during model loading.' },
                { name: 'Break Process Deadlock', stat: 'STR', dc: 13, desc: 'Forcibly unfreezing frozen terminal threads.' }
            ],
            genome: {
                body: 'body/bodies/kaykit_barbarian.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'Sir Valor',
            dndClass: 'Knight Champion • Level 5',
            badge: '3D BLENDER HERO',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            description: 'Valiant chibi knight rendered with cel-shaded ink outlines, holding the line as a dependable local companion.',
            stats: { str: 17, dex: 13, con: 16, int: 12, wis: 13, cha: 16, ac: 18, hp: 48, speed: 30, perception: 13 },
            skills: [
                { name: 'Companion Shield Wall', stat: 'STR', dc: 12, desc: 'Holding stable state during desktop resize.' },
                { name: 'Inspire Autonomous Swarm', stat: 'CHA', dc: 13, desc: 'Boosting subagent completion velocity.' }
            ],
            genome: {
                body: 'body/bodies/sir_valor.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'MicroVoxel Chibi',
            dndClass: 'Voxel Scout • Level 4',
            badge: 'VOXEL RECON',
            badgeColor: 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-pink-300 border-pink-500/50',
            description: 'High-density microvoxel agent specialized in rapid token generation, UI micro-interactions, and spatial orientation.',
            stats: { str: 10, dex: 18, con: 12, int: 17, wis: 15, cha: 14, ac: 15, hp: 32, speed: 35, perception: 17 },
            skills: [
                { name: 'Micro-Step Frame Scrub', stat: 'DEX', dc: 11, desc: 'Precise 60 FPS animation playback sync.' },
                { name: 'Voxel Grid Alignment', stat: 'INT', dc: 12, desc: 'Snapping spatial canvas objects to grid.' }
            ],
            genome: {
                body: 'body/bodies/microvoxel_chibi.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'Outfitted Hero',
            dndClass: 'Adventurer Gestalt • Level 5',
            badge: 'BALANCED COMPANION',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
            description: 'Versatile JRPG hero with well-rounded stats, ready to assist across code generation, world simulation, and desktop navigation.',
            stats: { str: 15, dex: 16, con: 15, int: 15, wis: 14, cha: 15, ac: 16, hp: 45, speed: 30, perception: 15 },
            skills: [
                { name: 'Versatile Skill Check', stat: 'INT', dc: 12, desc: 'Adapting to any coding or scripting task.' },
                { name: 'Companion Guidance', stat: 'WIS', dc: 12, desc: 'Offering strategic recommendations to user.' }
            ],
            genome: {
                body: 'body/bodies/outfitted_hero.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none',
                hair: 'none',
                facial: 'none',
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none'
            }
        },
        {
            name: 'Human Male Base',
            dndClass: 'Modular Base • Level 1',
            badge: 'MODULAR 2D',
            badgeColor: 'bg-white/10 text-white/60 border-white/20',
            description: 'Standard 2D LPC paperdoll base ready for full layer customization across hair, armor, boots, and weapons.',
            stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ac: 10, hp: 10, speed: 30, perception: 10 },
            skills: [
                { name: 'Layer Compositing', stat: 'INT', dc: 10, desc: 'Rendering multi-part modular spritesheets.' }
            ],
            genome: {
                body: 'body/bodies/body_bodies_male.png',
                head: 'head/heads/head_heads_human_male.png',
                nose: 'head/nose/head_nose_straight_adult_light.png',
                ears: 'head/ears/head_ears_big_adult_light.png',
                eyes: 'eyes/human/eyes_human_adult_blue.png'
            }
        },
        {
            name: 'Human Female Base',
            dndClass: 'Modular Base • Level 1',
            badge: 'MODULAR 2D',
            badgeColor: 'bg-white/10 text-white/60 border-white/20',
            description: 'Standard 2D LPC paperdoll base ready for full layer customization across hair, armor, boots, and weapons.',
            stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10, ac: 10, hp: 10, speed: 30, perception: 10 },
            skills: [
                { name: 'Layer Compositing', stat: 'INT', dc: 10, desc: 'Rendering multi-part modular spritesheets.' }
            ],
            genome: {
                body: 'body/bodies/body_bodies_female.png',
                head: 'head/heads/head_heads_human_male.png',
                nose: 'head/nose/head_nose_button_adult_light.png',
                ears: 'head/ears/head_ears_big_adult_light.png',
                eyes: 'eyes/human/eyes_human_adult_blue.png'
            }
        },
        {
            name: 'Orc Champion',
            dndClass: 'Barbarian Warrior • Level 4',
            badge: 'MODULAR ORC',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            description: 'Muscular orc modular base with high resilience and striking features.',
            stats: { str: 18, dex: 12, con: 17, int: 9, wis: 11, cha: 11, ac: 14, hp: 46, speed: 30, perception: 12 },
            skills: [
                { name: 'Heavy Impact Punch', stat: 'STR', dc: 13, desc: 'Triggering physics impact impulse.' }
            ],
            genome: {
                body: 'body/bodies/body_bodies_muscular_pale_green.png',
                head: 'head/heads/head_heads_orc_male_pale_green.png',
                nose: 'head/nose/head_nose_big_adult.png',
                ears: 'head/ears/head_ears_elven_adult_brown.png',
                eyes: 'eyes/human/eyes_human_adult_red.png'
            }
        },
        {
            name: 'Undead Skeleton',
            dndClass: 'Skeleton Guard • CR 1/4',
            badge: 'UNDEAD MINION',
            badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
            description: 'Reanimated skeleton base with clattering bones and unwavering obedience.',
            stats: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5, ac: 13, hp: 13, speed: 30, perception: 9 },
            skills: [
                { name: 'Bone Rattle Sentry', stat: 'DEX', dc: 10, desc: 'Standing silent guard in background.' }
            ],
            genome: {
                body: '/assets/lpc/lpc_character_bases-v2/LPC Character Bases/Undead/Skeleton/Male/Universal.png',
                head: 'none',
                nose: 'none',
                ears: 'none',
                eyes: 'none'
            }
        }
    ];

    const FULL_CHARACTER_PRESETS = [
        'lunaria', 'flesh_female', 'clothing_layer', 'sunlit_paladin', 'moonlit_mage', 'azure_adventurer', 'sir_valor', 'wilderness_scout', 'midnight_huntsman',
        'meshy_knight', 'armored_adventurer', 'kaykit_', 'outfitted_hero', 'custom_blonde_hero', 'elven_shadow'
    ];

    const getAssetsForLayer = (layer: string) => {
        const keywords = GENOME_KEYWORD_MAP[layer];
        if (!keywords && layer !== 'sequences') return [];

        const ANIMATION_KEYWORDS = [
            'walk', 'run', 'idle', 'jump', 'sitting', 'emotes', 'slash', 'spellcast', 'thrust', 'bow', 'hurt', 'climb',
            'shoot', 'falling', 'kneel', 'cheer', 'wave', 'laugh', 'cry'
        ];

        return allSpriteAssets.filter(a => {
            const path = typeof a === 'string' ? a : a.path;
            const lowerPath = path.toLowerCase();

            if (layer === 'sequences') {
                return ANIMATION_KEYWORDS.some(akw => lowerPath.includes(akw));
            }

            // Exclude full pre-baked character presets from modular body/clothing part dropdowns
            if (layer === 'body') {
                if (FULL_CHARACTER_PRESETS.some(p => lowerPath.includes(p))) {
                    return false;
                }
            }

            const matchesCategory = keywords.some(kw => lowerPath.includes(kw));
            if (!matchesCategory) return false;

            const isAnimation = ANIMATION_KEYWORDS.some(akw => lowerPath.includes(akw));
            return !isAnimation;
        });
    };

    const toggleFolder = (folder: string) => {
        setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
    };

    const renderDropdown = (layer: string, assets: (string | AssetEntry)[]) => {
        const filtered = assets.filter(a => {
            const path = typeof a === 'string' ? a : a.path;
            return path.toLowerCase().includes(searchQuery.toLowerCase());
        }).sort((a, b) => {
            const pathA = (typeof a === 'string' ? a : a.path).toLowerCase();
            const pathB = (typeof b === 'string' ? b : b.path).toLowerCase();
            return pathA.localeCompare(pathB);
        });

        if (filtered.length === 0 && searchQuery) return null;

        const currentValue = currentGenome[layer] || 'none';

        return (
            <div key={layer} className="flex flex-col mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1 flex justify-between">
                    <span>{layer}</span>
                    <span className="text-[8px] text-white/20">{filtered.length} options</span>
                </label>
                <div className="flex gap-2">
                    <select
                        value={currentValue}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'none') {
                                onSelectAsset(layer, 'none');
                            } else {
                                const selectedAsset = assets.find(a => {
                                    const p = typeof a === 'string' ? a : a.path;
                                    return p === val;
                                });
                                if (selectedAsset) {
                                    onSelectAsset(layer, selectedAsset);
                                }
                            }
                        }}
                        className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-2 text-[10px] text-white/80 font-bold uppercase tracking-wider outline-none focus:border-cyan-500/50 hover:bg-white/5 transition-all cursor-pointer"
                    >
                        <option value="none" className="bg-slate-900 text-slate-500">NONE</option>
                        {filtered.map(asset => {
                            const path = typeof asset === 'string' ? asset : asset.path;
                            const parts = path.split('/');
                            const filename = parts[parts.length - 1];
                            const semanticName = filename.replace('.png', '').replace(/_/g, ' ').toUpperCase();
                            return (
                                <option key={path} value={path} className="bg-slate-900 text-white">
                                    {semanticName}
                                </option>
                            );
                        })}
                    </select>
                    {currentValue !== 'none' && (
                        <button
                            onClick={() => onSelectAsset(layer, 'none')}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg border border-red-500/40 transition-colors"
                            title="Clear Layer"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderFolder = (name: string, assets: (string | AssetEntry)[], layer: string) => {
        const filtered = assets.filter(a => {
            const path = typeof a === 'string' ? a : a.path;
            return path.toLowerCase().includes(searchQuery.toLowerCase());
        }).sort((a, b) => {
            const pathA = (typeof a === 'string' ? a : a.path).toLowerCase();
            const pathB = (typeof b === 'string' ? b : b.path).toLowerCase();
            return pathA.localeCompare(pathB);
        });
        
        if (filtered.length === 0 && searchQuery) return null;

        const isOpen = openFolders[name];
        const isSelectedInLayer = currentGenome[layer] !== 'none' && currentGenome[layer] !== undefined;
        const displayAssets = filtered.slice(0, 1000);

        return (
            <div key={name} className="flex flex-col">
                <button
                    onClick={() => toggleFolder(name)}
                    className={`
                        flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors group w-full text-left
                        ${isOpen ? 'bg-white/5' : ''}
                    `}
                >
                    {isOpen ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
                    <Folder size={14} className={isSelectedInLayer ? "text-cyan-400" : "text-white/20"} />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 group-hover:text-white transition-colors">
                        {name}
                    </span>
                    <span className="ml-auto text-[10px] text-white/20 px-1.5 py-0.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        {filtered.length}
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-l border-white/5 ml-4 mt-1 space-y-0.5"
                        >
                            {(!searchQuery || 'none'.includes(searchQuery.toLowerCase())) && (
                                <button
                                    onClick={() => onSelectAsset(layer, 'none')}
                                    className={`
                                        flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/10 transition-all group w-full text-left
                                        ${currentGenome[layer] === 'none' || !currentGenome[layer] ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40'}
                                    `}
                                >
                                    <div className="relative">
                                        <Image size={12} className={currentGenome[layer] === 'none' || !currentGenome[layer] ? "text-cyan-400" : "text-white/20"} />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[9px] font-bold truncate">NONE</span>
                                        <span className="text-[8px] text-white/20 truncate">Clear Layer</span>
                                    </div>
                                </button>
                            )}
                            {displayAssets.map(asset => {
                                const path = typeof asset === 'string' ? asset : asset.path;
                                const hasContext = typeof asset !== 'string' && !!asset.context;
                                const isActive = currentGenome[layer] === path;
                                const parts = path.split('/');
                                const filename = parts[parts.length - 1];
                                const semanticName = filename.replace('.png', '').replace(/_/g, ' ').toUpperCase();

                                return (
                                    <button
                                        key={path}
                                        onClick={() => onSelectAsset(layer, asset)}
                                        className={`
                                            flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/10 transition-all group w-full text-left
                                            ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/40'}
                                        `}
                                    >
                                        <div className="relative">
                                            <Image size={12} className={isActive ? "text-cyan-400" : "text-white/20"} />
                                            {hasContext && (
                                                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-500 rounded-full border border-black" title="Context Embedded" />
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-[9px] font-bold truncate">
                                                {semanticName}
                                            </span>
                                            <span className="text-[8px] text-white/20 truncate">
                                                {path.split('/').slice(-2).join('/')}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                            {filtered.length > 100 && (
                                <div className="p-2 text-[8px] text-white/20 text-center italic">
                                    + {filtered.length - 100} more assets...
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-black/40 border-r border-white/10 overflow-hidden">
            {/* Clean Segmented Tab Bar */}
            <div className="flex p-2 gap-1 border-b border-white/10 bg-black/50">
                {[
                    { id: 'presets', label: '🏛️ Archetypes' },
                    { id: 'sprites', label: '🧬 Layers' },
                    { id: 'environments', label: '🌲 Props' },
                    { id: 'uncategorized', label: '📁 Misc' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveRoot(tab.id as any)}
                        className={`flex-1 py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center
                            ${activeRoot === tab.id ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-2.5 border-b border-white/10 bg-black/30">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
                    <Search size={14} className="text-cyan-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search all LPC assets & bodies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-white/30 font-mono"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-1.5">
                {activeRoot === 'presets' && (
                    <div className="space-y-2 p-1">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                            <span>Manifested Characters</span>
                            <span className="text-cyan-400 font-mono">{PRESETS.length} Total</span>
                        </div>
                        {PRESETS.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => onSelectPreset?.(preset.genome, preset)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10 hover:bg-cyan-500/15 hover:border-cyan-500/50 transition-all group shadow-sm text-left"
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    {((preset as any).portraitUrl || preset.genome.body) && (
                                        <img 
                                            src={(preset as any).portraitUrl || preset.genome.body} 
                                            alt={preset.name} 
                                            className="w-8 h-8 rounded-lg object-cover border border-white/20 bg-black/40 shrink-0" 
                                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                            {preset.name}
                                        </span>
                                        <span className="text-[8px] font-mono text-white/30 truncate max-w-[170px]">
                                            {preset.genome.body}
                                        </span>
                                    </div>
                                </div>
                                {(preset as any).badge && (
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${(preset as any).badgeColor || 'bg-white/10 text-white/60 border-white/20'}`}>
                                        {(preset as any).badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
                {activeRoot === 'sprites' && manifest.sprites && GENOME_LAYERS.map(layer =>
                    layer !== 'sequences' ? renderDropdown(layer, getAssetsForLayer(layer)) : renderFolder(layer, getAssetsForLayer(layer), layer)
                )}
                {activeRoot === 'environments' && manifest.environments && Object.keys(manifest.environments).sort().map(cat =>
                    renderFolder(cat, manifest.environments[cat], 'prop')
                )}
                {activeRoot === 'uncategorized' && manifest.uncategorized && (
                    renderFolder('Uncategorized', manifest.uncategorized, 'misc')
                )}
            </div>
        </div>
    );
};
