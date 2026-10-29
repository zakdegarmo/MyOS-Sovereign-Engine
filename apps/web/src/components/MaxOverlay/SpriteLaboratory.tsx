import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Pause, Download, Send, Sparkles, User, Info, 
    Compass, Activity, Shield, Box, Wand2, Layers, Dna, Sliders,
    MessageSquare, Bot, RotateCw, ZoomIn, Grid, Image as ImageIcon,
    Search, X, Maximize2, Check
} from 'lucide-react';
import { useAvatarCompositor } from '../../hooks/useAvatarCompositor';
import { MyOsSpriteExplorer, type MyOsSpriteEntry } from './MyOsSpriteExplorer';
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';

export const ACTION_CATEGORIES = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'movement', label: 'Movement', icon: '🏃' },
    { id: 'combat', label: 'Combat', icon: '⚔️' },
    { id: 'spells', label: 'Spells', icon: '✨' },
    { id: 'social', label: 'Social', icon: '🎭' },
    { id: 'impact', label: 'Impact', icon: '🛡️' },
] as const;

export const matchesActionCategory = (actionKey: string, category: string): boolean => {
    if (category === 'all') return true;
    const k = actionKey.toLowerCase();
    switch (category) {
        case 'movement':
            return ['idle', 'walk', 'run', 'sprint', 'walk_formal', 'crouch_walk', 'crouch_idle', 'swim_fwd', 'swim_idle', 'drive', 'roll', 'roll_rm'].includes(k) || k.includes('walk') || k.includes('run') || k.includes('idle') || k.includes('crouch') || k.includes('swim') || k.includes('roll');
        case 'combat':
            return ['slash', 'melee_attack_rm', 'combat_idle', 'punch_cross', 'punch_jab', 'shoot', 'gun_idle', 'aim_neutral', 'aim_down', 'aim_up', 'reload'].includes(k) || k.includes('attack') || k.includes('punch') || k.includes('slash') || k.includes('shoot') || k.includes('aim') || k.includes('gun');
        case 'spells':
            return ['spellcast', 'spell_idle', 'spell_charge', 'spell_release'].includes(k) || k.includes('spell') || k.includes('cast') || k.includes('magic');
        case 'social':
            return ['talk', 'sitting_talk', 'sitting_idle', 'sit_down', 'stand_up', 'interact', 'acknowledging', 'agreeing', 'dismissing_gesture', 'dance', 'idle_torch'].includes(k) || k.includes('talk') || k.includes('sit') || k.includes('gesture') || k.includes('dance') || k.includes('interact') || k.includes('agree') || k.includes('dismiss');
        case 'impact':
            return ['damage', 'hit_head', 'death', 'jump', 'jump_start', 'jump_land', 'pickup', 'push', 'repair', 'tpose'].includes(k) || k.includes('hit') || k.includes('damage') || k.includes('death') || k.includes('jump') || k.includes('pickup') || k.includes('push') || k.includes('repair') || k.includes('tpose');
        default:
            return true;
    }
};

export const SpriteLaboratory: React.FC<{
    onClose?: () => void;
    availableClips?: string[];
    onSetAnimation?: (anim: string) => void;
    isNested?: boolean;
    targetAgentId?: string;
}> = ({ onClose, isNested, targetAgentId = 'user' }) => {
    const { updateAgentGenome, spawnNPC } = useCouncil();
    const [appliedStatus, setAppliedStatus] = useState<string | null>(null);
    const [celShading, setCelShading] = useState<boolean>(true);

    const [customSprites, setCustomSprites] = useState<MyOsSpriteEntry[]>(() => {
        try {
            const saved = localStorage.getItem('myos_custom_sprites');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // =========================================================================
    // Active 8-Way HD Sprite State (Canonical: Flesh Base Mannequin)
    // =========================================================================
    const [myosSprite, setMyosSprite] = useState<MyOsSpriteEntry | null>({
        id: 'flesh_base_mannequin',
        name: 'Flesh Base Mannequin',
        category: 'heroes',
        badge: 'CANONICAL FLESH',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        description: 'Canonical ungendered flesh biped base mesh, rig, and cel-shaded style from flesh_base_mannequin.blend with calibrated 8-way camera framing.',
        tileSize: 256,
        grid: { cols: 8, rows: 8 },
        scale: 1.0,
        defaultAction: 'idle',
        previewUrl: '/actions/flesh_base_mannequin_preview.png',
        actions: {
            idle: '/actions/flesh_base_mannequin_idle_loop.png',
            walk: '/actions/flesh_base_mannequin_walk_loop.png',
            run: '/actions/flesh_base_mannequin_run_loop.png',
            sprint: '/actions/flesh_base_mannequin_sprint_loop.png',
            walk_formal: '/actions/flesh_base_mannequin_walk_formal_loop.png',
            crouch_walk: '/actions/flesh_base_mannequin_crouch_walk_loop.png',
            crouch_idle: '/actions/flesh_base_mannequin_crouch_idle_loop.png',
            slash: '/actions/flesh_base_mannequin_slash_loop.png',
            melee_attack_rm: '/actions/flesh_base_mannequin_melee_attack_rm_loop.png',
            combat_idle: '/actions/flesh_base_mannequin_combat_idle_loop.png',
            punch_cross: '/actions/flesh_base_mannequin_punch_cross_loop.png',
            punch_jab: '/actions/flesh_base_mannequin_punch_jab_loop.png',
            shoot: '/actions/flesh_base_mannequin_shoot_loop.png',
            gun_idle: '/actions/flesh_base_mannequin_gun_idle_loop.png',
            aim_neutral: '/actions/flesh_base_mannequin_aim_neutral_loop.png',
            aim_down: '/actions/flesh_base_mannequin_aim_down_loop.png',
            aim_up: '/actions/flesh_base_mannequin_aim_up_loop.png',
            reload: '/actions/flesh_base_mannequin_reload_loop.png',
            spellcast: '/actions/flesh_base_mannequin_spellcast_loop.png',
            spell_idle: '/actions/flesh_base_mannequin_spell_idle_loop.png',
            spell_charge: '/actions/flesh_base_mannequin_spell_charge_loop.png',
            spell_release: '/actions/flesh_base_mannequin_spell_release_loop.png',
            damage: '/actions/flesh_base_mannequin_damage_loop.png',
            hit_head: '/actions/flesh_base_mannequin_hit_head_loop.png',
            death: '/actions/flesh_base_mannequin_death_loop.png',
            jump: '/actions/flesh_base_mannequin_jump_loop.png',
            jump_start: '/actions/flesh_base_mannequin_jump_start_loop.png',
            jump_land: '/actions/flesh_base_mannequin_jump_land_loop.png',
            roll: '/actions/flesh_base_mannequin_roll_loop.png',
            roll_rm: '/actions/flesh_base_mannequin_roll_rm_loop.png',
            talk: '/actions/flesh_base_mannequin_talk_loop.png',
            interact: '/actions/flesh_base_mannequin_interact_loop.png',
            acknowledging: '/actions/flesh_base_mannequin_interact_loop.png',
            agreeing: '/actions/flesh_base_mannequin_sitting_talk_loop.png',
            dismissing_gesture: '/actions/flesh_base_mannequin_combat_idle_loop.png',
            sitting_talk: '/actions/flesh_base_mannequin_sitting_talk_loop.png',
            sitting_idle: '/actions/flesh_base_mannequin_sitting_idle_loop.png',
            sit_down: '/actions/flesh_base_mannequin_sit_down_loop.png',
            stand_up: '/actions/flesh_base_mannequin_stand_up_loop.png',
            dance: '/actions/flesh_base_mannequin_dance_loop.png',
            idle_torch: '/actions/flesh_base_mannequin_idle_torch_loop.png',
            pickup: '/actions/flesh_base_mannequin_pickup_loop.png',
            push: '/actions/flesh_base_mannequin_push_loop.png',
            repair: '/actions/flesh_base_mannequin_repair_loop.png',
            swim_fwd: '/actions/flesh_base_mannequin_swim_fwd_loop.png',
            swim_idle: '/actions/flesh_base_mannequin_swim_idle_loop.png',
            drive: '/actions/flesh_base_mannequin_drive_loop.png',
            tpose: '/actions/flesh_base_mannequin_tpose_loop.png'
        },
        pillarAlignment: 'self'
    });

    const [myosAction, setMyosAction] = useState<string>('idle');
    const [myosDirection, setMyosDirection] = useState<'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR'>('D');
    const [myosFps, setMyosFps] = useState<number>(16);

    // UI & UX Enhancements
    const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 256px, 1.5 = 384px, 2 = 512px
    const [backdropStyle, setBackdropStyle] = useState<'vignette' | 'checker' | 'obsidian'>('vignette');
    const [turntableActive, setTurntableActive] = useState<boolean>(false);
    const [actionCategory, setActionCategory] = useState<string>('all');
    const [actionSearch, setActionSearch] = useState<string>('');
    const [inspectSheetOpen, setInspectSheetOpen] = useState<boolean>(false);
    const [showContactShadow, setShowContactShadow] = useState<boolean>(true);
    const [sheetGridOverlay, setSheetGridOverlay] = useState<boolean>(true);

    // 2D Modular Wardrobe Paperdoll Layer State
    const [selectedTorso, setSelectedTorso] = useState<string>('none');
    const [selectedLegs, setSelectedLegs] = useState<string>('none');
    const [selectedBoots, setSelectedBoots] = useState<string>('none');
    const [selectedHair, setSelectedHair] = useState<string>('none');

    // Turntable 360° Auto-Rotation
    useEffect(() => {
        if (!turntableActive) return;
        const directions: ('D' | 'DL' | 'L' | 'UL' | 'U' | 'UR' | 'R' | 'DR')[] = [
            'D', 'DL', 'L', 'UL', 'U', 'UR', 'R', 'DR'
        ];
        const timer = setInterval(() => {
            setMyosDirection(current => {
                const nextIdx = (directions.indexOf(current) + 1) % directions.length;
                return directions[nextIdx];
            });
        }, 1100);
        return () => clearInterval(timer);
    }, [turntableActive]);

    const [manifestSprites, setManifestSprites] = useState<MyOsSpriteEntry[]>([]);

    useEffect(() => {
        fetch('/textures/avatars/myos_sprites_manifest.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.sprites) {
                    const list = Object.values(data.sprites) as MyOsSpriteEntry[];
                    setManifestSprites(list);
                    const defaultMannequin = list.find(s => s.id === 'flesh_base_mannequin') || list.find(s => s.id === 'humanoid_mannequin');
                    if (defaultMannequin) {
                        setMyosSprite(defaultMannequin);
                    }
                }
            })
            .catch(console.error);
    }, []);

    // Memoized action categorization and search filtering
    const filteredActions = useMemo(() => {
        if (!myosSprite?.actions) return [];
        const all = Object.keys(myosSprite.actions);
        return all.filter(key => {
            const matchesCat = matchesActionCategory(key, actionCategory);
            const matchesQ = !actionSearch.trim() || key.toLowerCase().includes(actionSearch.toLowerCase().trim());
            return matchesCat && matchesQ;
        });
    }, [myosSprite?.actions, actionCategory, actionSearch]);

    const actionCategoryCounts = useMemo(() => {
        if (!myosSprite?.actions) return {} as Record<string, number>;
        const all = Object.keys(myosSprite.actions);
        const counts: Record<string, number> = { all: all.length };
        ACTION_CATEGORIES.forEach(cat => {
            if (cat.id !== 'all') {
                counts[cat.id] = all.filter(k => matchesActionCategory(k, cat.id)).length;
            }
        });
        return counts;
    }, [myosSprite?.actions]);

    // =========================================================================
    // Playback & Input Engine
    // =========================================================================
    const [isPlaying, setIsPlaying] = useState(true);
    const [poseFrame, setPoseFrame] = useState(0);
    const poseFrameRef = useRef(poseFrame);
    useEffect(() => {
        poseFrameRef.current = poseFrame;
    }, [poseFrame]);

    const activeMoveKeysRef = useRef<Set<string>>(new Set());
    const isSpellcastingRef = useRef<boolean>(false);
    const spellcastTimerRef = useRef<NodeJS.Timeout | null>(null);

    // AI Kinematic Dialogue State
    const [dialogueInput, setDialogueInput] = useState('');
    const [activeSpeech, setActiveSpeech] = useState<{ text: string; action: string } | null>(null);
    const speechResetTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resolveKinematicAction = (text: string): string => {
        const lower = text.toLowerCase();
        if (/\b(disagree|shrug|whatever|no way|doubt|nah|nope|don't care|ignore|indifferent)\b/.test(lower)) {
            return 'dismissing_gesture';
        }
        if (/\b(agree|yes|nod|correct|true|indeed|absolutely|makes sense|affirmative|concur)\b/.test(lower)) {
            return 'agreeing';
        }
        if (/\b(noted|understood|got it|okay|roger|right|copy|acknowledge|hearing|listen)\b/.test(lower)) {
            return 'acknowledging';
        }
        if (/\b(attack|strike|hit|slash|fight|blade|sword|kill|destroy)\b/.test(lower)) {
            return 'slash';
        }
        if (/\b(cast|spell|magic|arcane|fireball|heal|aura|enchant)\b/.test(lower)) {
            return 'spellcast';
        }
        if (/\b(run|sprint|flee|hurry|dash|escape)\b/.test(lower)) {
            return 'run';
        }
        if (/\b(walk|step|move|travel|approach|scout)\b/.test(lower)) {
            return 'walk';
        }
        return 'acknowledging';
    };

    const triggerKinematicDialogue = (speechText: string) => {
        if (!speechText.trim()) return;
        const matchedAction = resolveKinematicAction(speechText);
        const actionToPlay = myosSprite?.actions?.[matchedAction] ? matchedAction : 'acknowledging';
        
        setMyosAction(actionToPlay);
        setPoseFrame(0);
        poseFrameRef.current = 0;
        setActiveSpeech({ text: speechText, action: actionToPlay });

        if (speechResetTimerRef.current) clearTimeout(speechResetTimerRef.current);
        speechResetTimerRef.current = setTimeout(() => {
            setActiveSpeech(null);
            if (myosSprite?.actions?.idle) {
                setMyosAction('idle');
            }
        }, 2200);
    };

    const resolve8WayHeading = (keys: Set<string>): 'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR' | null => {
        const up = keys.has('w') || keys.has('arrowup');
        const down = keys.has('s') || keys.has('arrowdown');
        const left = keys.has('a') || keys.has('arrowleft');
        const right = keys.has('d') || keys.has('arrowright');

        if (up && right) return 'UR';
        if (up && left) return 'UL';
        if (down && right) return 'DR';
        if (down && left) return 'DL';
        if (up) return 'U';
        if (down) return 'D';
        if (left) return 'L';
        if (right) return 'R';
        return null;
    };

    // Keyboard controls for WASD movement, Shift run, and P spellcast
    useEffect(() => {
        const movementKeys = ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
                return;
            }

            const key = e.key.toLowerCase();

            if (e.code === 'Space') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
                return;
            }

            if (key === 'p') {
                e.preventDefault();
                if (myosSprite?.actions?.spellcast) {
                    isSpellcastingRef.current = true;
                    if (spellcastTimerRef.current) clearTimeout(spellcastTimerRef.current);
                    setMyosAction('spellcast');
                    setPoseFrame(0);
                    poseFrameRef.current = 0;

                    spellcastTimerRef.current = setTimeout(() => {
                        isSpellcastingRef.current = false;
                        const currentDir = resolve8WayHeading(activeMoveKeysRef.current);
                        if (currentDir) {
                            const wantsRun = activeMoveKeysRef.current.has('shift');
                            if (wantsRun && myosSprite?.actions?.run) {
                                setMyosAction('run');
                            } else if (myosSprite?.actions?.walk) {
                                setMyosAction('walk');
                            }
                        } else {
                            if (myosSprite?.actions?.idle) {
                                setMyosAction('idle');
                            }
                        }
                    }, 750);
                }
                return;
            }

            if (movementKeys.includes(key)) {
                e.preventDefault();
                activeMoveKeysRef.current.add(key);
                const dir = resolve8WayHeading(activeMoveKeysRef.current);
                if (dir) {
                    setMyosDirection(dir);
                    if (!isSpellcastingRef.current) {
                        const wantsRun = e.shiftKey || activeMoveKeysRef.current.has('shift');
                        if (wantsRun && myosSprite?.actions?.run) {
                            setMyosAction('run');
                        } else if (myosSprite?.actions?.walk) {
                            setMyosAction('walk');
                        }
                    }
                }
                return;
            }

            if (key === 'shift') {
                activeMoveKeysRef.current.add('shift');
                const dir = resolve8WayHeading(activeMoveKeysRef.current);
                if (dir && !isSpellcastingRef.current && myosSprite?.actions?.run) {
                    setMyosAction('run');
                }
                return;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
                return;
            }

            const key = e.key.toLowerCase();

            if (movementKeys.includes(key)) {
                activeMoveKeysRef.current.delete(key);
                const dir = resolve8WayHeading(activeMoveKeysRef.current);
                if (dir) {
                    setMyosDirection(dir);
                    if (!isSpellcastingRef.current) {
                        const wantsRun = e.shiftKey || activeMoveKeysRef.current.has('shift');
                        if (wantsRun && myosSprite?.actions?.run) {
                            setMyosAction('run');
                        } else if (myosSprite?.actions?.walk) {
                            setMyosAction('walk');
                        }
                    }
                } else {
                    if (!isSpellcastingRef.current && myosSprite?.actions?.idle) {
                        setMyosAction('idle');
                    }
                }
            } else if (key === 'shift') {
                activeMoveKeysRef.current.delete('shift');
                const dir = resolve8WayHeading(activeMoveKeysRef.current);
                if (dir && !isSpellcastingRef.current) {
                    if (myosSprite?.actions?.walk) {
                        setMyosAction('walk');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (spellcastTimerRef.current) clearTimeout(spellcastTimerRef.current);
            if (speechResetTimerRef.current) clearTimeout(speechResetTimerRef.current);
        };
    }, [myosSprite]);

    // =========================================================================
    // Compositor Viewport
    // =========================================================================
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const activeCompositorGenome = useMemo(() => {
        if (!myosSprite || !myosSprite.actions) return { body: 'none' };

        const isAdventurerOutfit = (
            myosSprite.id === 'flesh_adventurer' ||
            (myosSprite.id === 'flesh_base_mannequin' &&
             selectedTorso === 'tunic' &&
             (selectedLegs === 'cargo_pants' || selectedLegs === 'pants') &&
             (selectedBoots === 'hero_boots' || selectedBoots === 'boots'))
        );

        if (isAdventurerOutfit) {
            // Full 45-action 3D outfitted hero with zero layer drift and zero clothing detachment
            const actionPath = `/actions/flesh_adventurer_${myosAction}_loop.png`;
            const isWalking = myosAction === 'walk' || myosAction === 'run' || myosAction === 'sprint';
            const isIdle = myosAction === 'idle';
            const hairPath = selectedHair === 'locks' 
                ? (isWalking ? '/actions/flesh_base_mannequin_clothing_hair_walk.png' : (isIdle ? '/actions/flesh_base_mannequin_clothing_hair_idle.png' : 'none'))
                : 'none';
            return {
                body: actionPath,
                head: 'none',
                hair: hairPath,
                torso: 'none',
                legs: 'none',
                feet: 'none',
                weapon: 'none',
                offhand: 'none'
            };
        }

        const sheetPath = myosSprite.actions[myosAction] || myosSprite.actions[myosSprite.defaultAction];

        const isWalking = myosAction === 'walk' || myosAction === 'run' || myosAction === 'sprint';
        const isIdle = myosAction === 'idle';

        // Modular piece resolution: only render if action exists (idle/walk)
        // If an acrobatic/combat action (roll, jump, slash) has no baked modular sheet, suppress layer so it doesn't float
        let torsoPath = 'none';
        if (selectedTorso === 'tunic') {
            torsoPath = isWalking ? '/actions/flesh_clothing_torso_tunic_walk.png' : (isIdle ? '/actions/flesh_clothing_torso_tunic_idle.png' : 'none');
        } else if (selectedTorso === 'sweater') {
            torsoPath = isWalking ? '/actions/flesh_clothing_torso_sweater_walk.png' : (isIdle ? '/actions/flesh_clothing_torso_sweater_idle.png' : 'none');
        } else if (selectedTorso === 'kimono') {
            torsoPath = isWalking ? '/actions/flesh_clothing_torso_kimono_walk.png' : (isIdle ? '/actions/flesh_clothing_torso_kimono_idle.png' : 'none');
        } else if (selectedTorso === 'dinner_jacket') {
            torsoPath = isWalking ? '/actions/flesh_clothing_torso_dinner_jacket_walk.png' : (isIdle ? '/actions/flesh_clothing_torso_dinner_jacket_idle.png' : 'none');
        } else if (selectedTorso === 'bodice') {
            torsoPath = isWalking ? '/actions/flesh_clothing_torso_bodice_walk.png' : (isIdle ? '/actions/flesh_clothing_torso_bodice_idle.png' : 'none');
        } else if (selectedTorso === 'plate') {
            torsoPath = isWalking ? '/actions/flesh_clothing_torso_dinner_jacket_walk.png' : (isIdle ? '/actions/flesh_clothing_torso_dinner_jacket_idle.png' : 'none');
        } else if (selectedTorso === 'shadow') {
            torsoPath = isWalking ? '/actions/flesh_clothing_torso_bodice_walk.png' : (isIdle ? '/actions/flesh_clothing_torso_bodice_idle.png' : 'none');
        }

        let legsPath = 'none';
        if (selectedLegs === 'cargo_pants' || selectedLegs === 'pants') {
            legsPath = isWalking ? '/actions/flesh_clothing_legs_cargo_pants_walk.png' : (isIdle ? '/actions/flesh_clothing_legs_cargo_pants_idle.png' : 'none');
        } else if (selectedLegs === 'wool_pants') {
            legsPath = isWalking ? '/actions/flesh_clothing_legs_wool_pants_walk.png' : (isIdle ? '/actions/flesh_clothing_legs_wool_pants_idle.png' : 'none');
        } else if (selectedLegs === 'harem_pants') {
            legsPath = isWalking ? '/actions/flesh_clothing_legs_harem_pants_walk.png' : (isIdle ? '/actions/flesh_clothing_legs_harem_pants_idle.png' : 'none');
        } else if (selectedLegs === 'jeans_shorts') {
            legsPath = isWalking ? '/actions/flesh_clothing_legs_jeans_shorts_walk.png' : (isIdle ? '/actions/flesh_clothing_legs_jeans_shorts_idle.png' : 'none');
        }

        let bootsPath = 'none';
        if (selectedBoots === 'hero_boots' || selectedBoots === 'boots') {
            bootsPath = isWalking ? '/actions/flesh_clothing_feet_hero_boots_walk.png' : (isIdle ? '/actions/flesh_clothing_feet_hero_boots_idle.png' : 'none');
        } else if (selectedBoots === 'ankle_boots') {
            bootsPath = isWalking ? '/actions/flesh_clothing_feet_ankle_boots_walk.png' : (isIdle ? '/actions/flesh_clothing_feet_ankle_boots_idle.png' : 'none');
        } else if (selectedBoots === 'shoes') {
            bootsPath = isWalking ? '/actions/flesh_clothing_feet_shoes_walk.png' : (isIdle ? '/actions/flesh_clothing_feet_shoes_idle.png' : 'none');
        }

        let hairPath = 'none';
        if (selectedHair === 'locks') {
            hairPath = isWalking ? '/actions/flesh_base_mannequin_clothing_hair_walk.png' : (isIdle ? '/actions/flesh_base_mannequin_clothing_hair_idle.png' : 'none');
        }

        return {
            body: sheetPath,
            head: 'none',
            hair: hairPath,
            torso: torsoPath,
            legs: legsPath,
            feet: bootsPath,
            weapon: 'none',
            offhand: 'none'
        };
    }, [myosSprite, myosAction, selectedTorso, selectedLegs, selectedBoots, selectedHair]);


    const { canvas, isLoaded, draw } = useAvatarCompositor(
        activeCompositorGenome,
        'idle',
        myosDirection,
        poseFrameRef,
        {
            resolution: 256,
            inkStyle: celShading ? 'bold' : 'none',
            contrast: celShading ? 1.25 : 1.0,
            celLevels: celShading ? 5 : undefined,
            onRender: () => {
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 256, 256);
                        if (showContactShadow) {
                            ctx.save();
                            const shadowGrad = ctx.createRadialGradient(128, 196, 4, 128, 196, 42);
                            shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
                            shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
                            shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                            ctx.fillStyle = shadowGrad;
                            ctx.beginPath();
                            ctx.ellipse(128, 196, 42, 9, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                        ctx.drawImage(canvas, 0, 0, 256, 256);
                    }
                }
            }
        }
    );

    useEffect(() => {
        let lastTime = performance.now();
        let lastProgressUpdate = performance.now();
        let animationFrameId: number;

        const loop = (currentTime: number) => {
            if (isPlaying) {
                const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
                lastTime = currentTime;

                const speedMultiplier = myosFps / 8.0;
                poseFrameRef.current = (poseFrameRef.current + deltaTime * speedMultiplier) % 1.0;
                if (draw) draw();

                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 256, 256);
                        if (showContactShadow) {
                            ctx.save();
                            const shadowGrad = ctx.createRadialGradient(128, 196, 4, 128, 196, 42);
                            shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
                            shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
                            shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                            ctx.fillStyle = shadowGrad;
                            ctx.beginPath();
                            ctx.ellipse(128, 196, 42, 9, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                        ctx.drawImage(canvas, 0, 0, 256, 256);
                    }
                }

                if (currentTime - lastProgressUpdate > 60) {
                    setPoseFrame(poseFrameRef.current);
                    lastProgressUpdate = currentTime;
                }
            } else {
                lastTime = currentTime;
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying, myosFps, draw, canvas, showContactShadow]);

    // =========================================================================
    // Direct Embodiment Handlers
    // =========================================================================
    const handleEquipUser = () => {
        if (!myosSprite) return;
        const sheet = myosSprite.actions[myosAction] || myosSprite.actions[myosSprite.defaultAction];
        const isUniracer = myosSprite.id === 'uniracer' || (myosSprite as any).archetype === 'uniracer';
        const config = {
            genome: { 
                body: sheet, 
                archetype: isUniracer ? 'uniracer' : undefined,
                modelType: isUniracer ? 'uniracer' : undefined,
                head: 'none', hair: 'none', torso: 'none', legs: 'none' 
            },
            meta: { 
                id: myosSprite.id, 
                name: myosSprite.name, 
                category: myosSprite.category, 
                action: myosAction,
                archetype: isUniracer ? 'uniracer' : undefined
            }
        };
        updateAgentGenome('user' as AgentId, config);
        window.dispatchEvent(new CustomEvent('myos_update_gestalt', { detail: { genome: config } }));
        setAppliedStatus('user');
        setTimeout(() => setAppliedStatus(null), 2000);
    };

    const handleEquipCompanion = () => {
        if (!myosSprite) return;
        const sheet = myosSprite.actions[myosAction] || myosSprite.actions[myosSprite.defaultAction];
        const isUniracer = myosSprite.id === 'uniracer' || (myosSprite as any).archetype === 'uniracer';
        const config = {
            genome: { 
                body: sheet, 
                archetype: isUniracer ? 'uniracer' : undefined,
                modelType: isUniracer ? 'uniracer' : undefined,
                head: 'none', hair: 'none', torso: 'none', legs: 'none' 
            },
            meta: { 
                id: myosSprite.id, 
                name: myosSprite.name, 
                category: myosSprite.category, 
                action: myosAction,
                archetype: isUniracer ? 'uniracer' : undefined
            }
        };
        updateAgentGenome('orchestrator', config);
        updateAgentGenome('companion' as AgentId, config);
        window.dispatchEvent(new CustomEvent('myos_update_companion', { detail: { genome: config } }));
        setAppliedStatus('companion');
        setTimeout(() => setAppliedStatus(null), 2000);
    };

    const handleSpawnNpc = () => {
        if (!myosSprite || !spawnNPC) return;
        const sheet = myosSprite.actions[myosAction] || myosSprite.actions[myosSprite.defaultAction];
        const isUniracer = myosSprite.id === 'uniracer' || (myosSprite as any).archetype === 'uniracer';
        const config = {
            genome: { 
                body: sheet, 
                archetype: isUniracer ? 'uniracer' : undefined,
                modelType: isUniracer ? 'uniracer' : undefined,
                head: 'none', hair: 'none', torso: 'none', legs: 'none' 
            },
            meta: { 
                id: myosSprite.id, 
                name: myosSprite.name, 
                category: myosSprite.category, 
                action: myosAction,
                archetype: isUniracer ? 'uniracer' : undefined
            }
        };
        spawnNPC(myosSprite.name, config);
        setAppliedStatus('npc');
        setTimeout(() => setAppliedStatus(null), 2000);
    };

    const handleExportPNG = () => {
        if (!canvasRef.current || !myosSprite) return;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `${myosSprite.id}_${myosAction}_${myosDirection}.png`;
        link.href = dataUrl;
        link.click();
    };

    const handleExportJSON = () => {
        if (!myosSprite) return;
        const payload = JSON.stringify({ myosSprite, activeAction: myosAction }, null, 2);
        navigator.clipboard.writeText(payload);
        alert(`Avatar Configuration Copied to Clipboard!`);
    };

    return (
        <div className={isNested ? "w-full h-full relative overflow-hidden flex flex-col" : "fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"}>
            <motion.div
                initial={isNested ? {} : { scale: 0.95, opacity: 0, y: 20 }}
                animate={isNested ? {} : { scale: 1, opacity: 1, y: 0 }}
                className={`relative w-full overflow-hidden flex flex-col ${isNested ? "h-full bg-transparent border-none rounded-none shadow-none" : "max-w-7xl h-[92vh] bg-slate-950 border-[2px] border-slate-700/50 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.9)]"}`}
            >
                {/* Header: Clean Studio Nav Bar */}
                <div className="px-6 py-3 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 tracking-tight uppercase font-display">
                                    SPRITE LABORATORY
                                </h2>
                                <span className="px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-[9px] font-mono text-purple-300 uppercase tracking-widest font-bold">
                                    Self.Self
                                </span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                                Primary Manifestation Stage • 4-Type Roster
                            </span>
                        </div>
                    </div>

                    {/* Sub-Dock Navigation Indicator Pills (Left Dock Pointers) */}
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-[9px] font-mono text-slate-400">
                        <span className="text-slate-500 font-bold uppercase mr-1">Left Dock Sub-Modules:</span>
                        <span className="text-rose-400 font-bold">⚹ Gestalt</span>
                        <span className="text-white/20">•</span>
                        <span className="text-cyan-400 font-bold">☿ Telemetry</span>
                        <span className="text-white/20">•</span>
                        <span className="text-amber-400 font-bold">🜔 Rules</span>
                        <span className="text-white/20">•</span>
                        <span className="text-emerald-400 font-bold">🝧 Wardrobe</span>
                        <span className="text-white/20">•</span>
                        <span className="text-indigo-400 font-bold">🜄 Genome</span>
                        <span className="text-white/20">•</span>
                        <span className="text-fuchsia-400 font-bold">🜏 Powertrain</span>
                        <span className="text-white/20">•</span>
                        <span className="text-amber-400 font-bold">☉ 3D Synth</span>
                        <span className="text-white/20">•</span>
                        <span className="text-purple-400 font-bold">♀ Cyclotrope</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Cel-Shading Filter Toggle */}
                        <button
                            onClick={() => setCelShading(prev => !prev)}
                            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                celShading
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                            }`}
                        >
                            <Sparkles size={12} className={celShading ? 'text-amber-400 animate-pulse' : ''} />
                            <span>{celShading ? 'Cel Filter ON' : 'Cel Filter OFF'}</span>
                        </button>

                        {onClose && (
                            <button 
                                onClick={onClose} 
                                className="w-8 h-8 flex items-center justify-center bg-red-500/20 border border-red-500/40 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition cursor-pointer shadow-sm"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Primary Manifestation Stage Layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANE: 4-Category Roster Explorer */}
                    <div className="w-96 flex flex-col border-r border-white/10 h-full bg-black/20 shrink-0">
                        <MyOsSpriteExplorer
                            selectedSpriteId={myosSprite?.id || ''}
                            selectedAction={myosAction}
                            customSprites={customSprites}
                            onSelectSprite={(sprite, action) => {
                                setMyosSprite(sprite);
                                setMyosAction(action);
                                setPoseFrame(0);
                            }}
                            onSelectAction={(actionKey) => {
                                setMyosAction(actionKey);
                                setPoseFrame(0);
                            }}
                        />
                    </div>

                    {/* CENTER PANE: 8-WAY MASTERVIEW CANVAS */}
                    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden group">
                        {/* Header Info & Viewport Controls */}
                        <div className="px-6 py-2.5 border-b border-white/5 flex flex-col gap-2 z-10 bg-black/40 backdrop-blur-md">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                                    <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-bold">
                                        {myosSprite ? `${myosSprite.name} — ${myosAction.replace(/_/g, ' ').toUpperCase()}` : 'Select a Creature'}
                                    </span>
                                    <span className="text-[9px] font-mono text-cyan-400/80 uppercase">
                                        [{myosDirection}] • {myosSprite?.tileSize || 256}px HD
                                    </span>
                                </div>

                                {/* Viewport Toolbar */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Zoom Selector */}
                                    <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-0.5">
                                        <span className="text-[8px] font-mono text-slate-400 px-1.5 flex items-center gap-0.5">
                                            <ZoomIn size={10} />
                                        </span>
                                        {([1, 1.5, 2] as const).map(z => (
                                            <button
                                                key={z}
                                                onClick={() => setZoomLevel(z)}
                                                className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold transition cursor-pointer ${
                                                    zoomLevel === z
                                                        ? 'bg-purple-500 text-black shadow-sm font-black'
                                                        : 'text-white/50 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {z}x
                                            </button>
                                        ))}
                                    </div>

                                    {/* Backdrop Selector */}
                                    <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-0.5">
                                        {(['vignette', 'checker', 'obsidian'] as const).map(style => (
                                            <button
                                                key={style}
                                                onClick={() => setBackdropStyle(style)}
                                                className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold capitalize transition cursor-pointer ${
                                                    backdropStyle === style
                                                        ? 'bg-cyan-400 text-black shadow-sm font-black'
                                                        : 'text-white/50 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {style === 'vignette' ? '🟣 Vignette' : style === 'checker' ? '🏁 Checker' : '⬛ Void'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Contact Shadow Toggle */}
                                    <button
                                        onClick={() => setShowContactShadow(prev => !prev)}
                                        className={`px-2 py-0.5 rounded-lg border text-[8px] font-mono font-bold transition cursor-pointer ${
                                            showContactShadow
                                                ? 'bg-white/15 text-white border-white/25'
                                                : 'bg-white/5 text-white/30 border-white/10 hover:text-white'
                                        }`}
                                        title="Toggle contact ground shadow"
                                    >
                                        Shadow {showContactShadow ? 'ON' : 'OFF'}
                                    </button>

                                    {/* Turntable 360° Auto-Rotate Toggle */}
                                    <button
                                        onClick={() => setTurntableActive(prev => !prev)}
                                        className={`px-2.5 py-1 rounded-lg border text-[8px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                            turntableActive
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
                                        }`}
                                        title="Toggle 360° auto-rotation around all 8 headings"
                                    >
                                        <RotateCw size={10} className={turntableActive ? 'animate-spin' : ''} />
                                        <span>{turntableActive ? '360° ON' : '360° SPIN'}</span>
                                    </button>

                                    {/* Inspect Master Sheet Modal Button */}
                                    <button
                                        onClick={() => setInspectSheetOpen(true)}
                                        className="px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-[8px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                                        title="Inspect full 64-frame 8-way spritesheet grid"
                                    >
                                        <Grid size={10} />
                                        <span>INSPECT SHEET</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-1 border-t border-white/5">
                                <span><strong className="text-cyan-400">WASD / Arrows:</strong> Walk</span>
                                <span><strong className="text-amber-400">Hold Shift:</strong> Run</span>
                                <span><strong className="text-purple-400">P:</strong> Cast Spell</span>
                                <span><strong className="text-emerald-400">Release:</strong> Idle</span>
                                <span><strong className="text-cyan-400">Space:</strong> Play / Pause</span>
                                <span><strong className="text-cyan-400">Speed:</strong> {myosFps} FPS</span>
                            </div>
                        </div>

                        {/* Viewport: 2D Canvas */}
                        <div className={`flex-1 flex items-center justify-center p-4 relative overflow-auto ${
                            backdropStyle === 'checker'
                                ? 'bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:16px_16px] bg-[#0b1120]'
                                : backdropStyle === 'obsidian'
                                ? 'bg-black'
                                : 'bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.12)_0%,_transparent_70%)] bg-slate-950'
                        }`}>
                            <div className={`relative p-6 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center transition-all duration-300 ${
                                backdropStyle === 'obsidian'
                                    ? 'bg-black/80 border border-white/10'
                                    : 'bg-slate-900/90 border border-purple-500/20'
                            }`}>
                                <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAEAQMAAACTP79fAAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAAxJREFUCNdjYGJgYAAABgABAGyVBAAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none" />
                                {!isLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-2xl">
                                        <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                    </div>
                                )}
                                <canvas
                                    ref={canvasRef}
                                    width={256} height={256}
                                    className={`image-pixelated bg-black/90 rounded-2xl shadow-[0_0_60px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/30 transition-all duration-200 ${
                                        zoomLevel === 2
                                            ? 'w-[512px] h-[512px]'
                                            : zoomLevel === 1.5
                                            ? 'w-[384px] h-[384px]'
                                            : 'w-[256px] h-[256px]'
                                    }`}
                                />

                                {/* 8-Directional Compass Controls */}
                                <div className="flex gap-1.5 mt-3 z-10 bg-black/70 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                    {(['U', 'UR', 'R', 'DR', 'D', 'DL', 'L', 'UL'] as const).map(dir => (
                                        <button
                                            key={dir}
                                            onClick={() => setMyosDirection(dir)}
                                            className={`px-2.5 py-1 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition cursor-pointer ${
                                                myosDirection === dir
                                                    ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-black font-black shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                                                    : 'text-white/40 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {dir}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Controls & Timeline */}
                        <div className="px-6 py-3.5 bg-black/70 border-t border-white/10 backdrop-blur-md space-y-3">
                            {/* Action Filter System */}
                            {myosSprite && myosSprite.actions && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        {/* Category Filter Tabs */}
                                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
                                            {ACTION_CATEGORIES.map(cat => {
                                                const count = actionCategoryCounts[cat.id] ?? 0;
                                                const isActive = actionCategory === cat.id;
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setActionCategory(cat.id)}
                                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                                                            isActive
                                                                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-500/20'
                                                                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span>{cat.icon}</span>
                                                        <span>{cat.label}</span>
                                                        <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-sans font-semibold ${
                                                            isActive ? 'bg-black/40 text-cyan-200' : 'bg-white/10 text-white/40'
                                                        }`}>
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Quick Search */}
                                        <div className="relative w-44 shrink-0">
                                            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                                            <input
                                                type="text"
                                                value={actionSearch}
                                                onChange={e => setActionSearch(e.target.value)}
                                                placeholder="Filter actions..."
                                                className="w-full pl-7 pr-6 py-1 bg-black/50 border border-white/10 rounded-lg text-[9px] font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/60 transition"
                                            />
                                            {actionSearch && (
                                                <button
                                                    onClick={() => setActionSearch('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-[10px]"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Filtered Action Buttons */}
                                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                        {filteredActions.length > 0 ? (
                                            filteredActions.map(actionKey => {
                                                const isActive = myosAction === actionKey;
                                                return (
                                                    <button
                                                        key={actionKey}
                                                        onClick={() => {
                                                            setMyosAction(actionKey);
                                                            setPoseFrame(0);
                                                        }}
                                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase tracking-wider transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                                            isActive
                                                                ? 'bg-purple-500 text-black font-black shadow-md shadow-purple-500/30'
                                                                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                                                        }`}
                                                    >
                                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />}
                                                        <span>{actionKey.replace(/_/g, ' ')}</span>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="text-[9px] font-mono text-slate-500 py-1 italic">
                                                No actions found matching "{actionSearch}" in {actionCategory}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className={`p-2 rounded-lg flex items-center justify-center transition cursor-pointer ${
                                        isPlaying
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                            : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
                                </button>

                                {/* FPS Selector */}
                                <div className="flex bg-black/60 p-1 rounded-lg border border-white/5 gap-1">
                                    {[8, 12, 16, 24].map(fps => (
                                        <button
                                            key={fps}
                                            onClick={() => setMyosFps(fps)}
                                            className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer transition ${
                                                myosFps === fps ? 'bg-purple-500 text-black' : 'text-white/40 hover:text-white'
                                            }`}
                                        >
                                            {fps}FPS
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/50">
                                        <span>{isPlaying ? `8-FRAME ${myosFps} FPS LOOP` : 'PAUSED'}</span>
                                        <span className="text-purple-400 font-mono">{Math.round(poseFrame * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-900 rounded-full h-1.5 relative overflow-hidden border border-white/5">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                                            style={{ width: `${poseFrame * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE: CREATURE INSPECTOR & QUICK EMBODIMENT */}
                    <div className="w-80 flex flex-col bg-slate-950/90 border-l border-white/10 p-5 gap-4 overflow-y-auto shadow-2xl shrink-0">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                CREATURE INSPECTOR
                            </span>
                            {myosSprite && (
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${myosSprite.badgeColor}`}>
                                    {myosSprite.badge}
                                </span>
                            )}
                        </div>

                        {myosSprite ? (
                            <>
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-white uppercase tracking-wide">
                                        {myosSprite.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                                        {myosSprite.description}
                                    </p>
                                </div>

                                <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2 text-[9px] font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Pillar Alignment:</span>
                                        <span className="text-purple-300 font-bold uppercase">{myosSprite.pillarAlignment}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Tile Size:</span>
                                        <span className="text-white font-bold">{myosSprite.tileSize || 256}px HD</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Current Action:</span>
                                        <span className="text-cyan-400 font-bold uppercase">{myosAction}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Facing Direction:</span>
                                        <span className="text-cyan-400 font-bold">{myosDirection}</span>
                                    </div>
                                </div>


                                {/* 🝧 2D MODULAR WARDROBE PAPERDOLL STUDIO */}

                                <div className="space-y-2.5 pt-3 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                                            <span>🝧</span> 2D WARDROBE STACK
                                        </span>
                                        <span className="text-[8px] font-mono text-cyan-400 font-bold">ZERO-BLENDER 60FPS</span>
                                    </div>

                                    <div className="space-y-2 bg-black/40 border border-white/10 rounded-xl p-3 text-[9px] font-mono">
                                        {/* Hair */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Hair:</span>
                                            <select
                                                value={selectedHair}
                                                onChange={(e) => setSelectedHair(e.target.value)}
                                                className="bg-slate-900 border border-purple-500/30 text-purple-300 rounded px-2 py-1 text-[8px] font-bold outline-none cursor-pointer"
                                            >
                                                <option value="none">None (Bald Base)</option>
                                                <option value="locks">Adventurer Locks (Chestnut)</option>
                                            </select>
                                        </div>

                                        {/* Torso */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Torso:</span>
                                            <select
                                                value={selectedTorso}
                                                onChange={(e) => setSelectedTorso(e.target.value)}
                                                className="bg-slate-900 border border-emerald-500/30 text-emerald-300 rounded px-2 py-1 text-[8px] font-bold outline-none cursor-pointer"
                                            >
                                                <option value="none">None (Bare Chest)</option>
                                                <option value="tunic">Mycenaean Tunic (Forest Emerald)</option>
                                                <option value="sweater">Fisherman Cable Knit (Cream)</option>
                                                <option value="kimono">Martial Kimono (Crimson)</option>
                                                <option value="dinner_jacket">Formal Dinner Jacket (Charcoal)</option>
                                                <option value="bodice">Leather Bodice (Tanned Umber)</option>
                                            </select>
                                        </div>

                                        {/* Legs */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Legs:</span>
                                            <select
                                                value={selectedLegs}
                                                onChange={(e) => setSelectedLegs(e.target.value)}
                                                className="bg-slate-900 border border-blue-500/30 text-blue-300 rounded px-2 py-1 text-[8px] font-bold outline-none cursor-pointer"
                                            >
                                                <option value="none">None (Bare Legs)</option>
                                                <option value="cargo_pants">Tactical Cargo Pants (Indigo)</option>
                                                <option value="wool_pants">Tailored Wool Trousers (Slate)</option>
                                                <option value="harem_pants">Billowing Harem Pants (Purple)</option>
                                                <option value="jeans_shorts">Adventure Shorts (Denim)</option>
                                            </select>
                                        </div>

                                        {/* Boots */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Boots:</span>
                                            <select
                                                value={selectedBoots}
                                                onChange={(e) => setSelectedBoots(e.target.value)}
                                                className="bg-slate-900 border border-amber-500/30 text-amber-300 rounded px-2 py-1 text-[8px] font-bold outline-none cursor-pointer"
                                            >
                                                <option value="none">None (Bare Feet)</option>
                                                <option value="hero_boots">Hero Adventurer Boots (Leather)</option>
                                                <option value="ankle_boots">Traveler Ankle Boots (Umber)</option>
                                                <option value="shoes">Town Walking Shoes (Black)</option>
                                            </select>
                                        </div>

                                        {/* Quick Presets */}
                                        <div className="flex gap-2 pt-1 border-t border-white/5">
                                            <button
                                                onClick={() => {
                                                    setSelectedHair('locks');
                                                    setSelectedTorso('sweater');
                                                    setSelectedLegs('cargo_pants');
                                                    setSelectedBoots('hero_boots');
                                                }}
                                                className="flex-1 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[8px] font-bold uppercase transition cursor-pointer"
                                            >
                                                Equip Full Set
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedHair('none');
                                                    setSelectedTorso('none');
                                                    setSelectedLegs('none');
                                                    setSelectedBoots('none');
                                                }}
                                                className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 text-[8px] font-bold uppercase transition cursor-pointer"
                                            >
                                                Strip All
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Kinematic Dialogue Simulator */}
                                <div className="space-y-2.5 pt-3 border-t border-white/10">

                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                                            <MessageSquare size={12} className="text-purple-400" />
                                            AI Kinematic Dialogue
                                        </span>
                                        <span className="text-[8px] font-mono text-cyan-400 font-bold">Autonomous Body</span>
                                    </div>
                                    
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            value={dialogueInput}
                                            onChange={(e) => setDialogueInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    triggerKinematicDialogue(dialogueInput);
                                                    setDialogueInput('');
                                                }
                                            }}
                                            placeholder="Enter speech or intent e.g. 'I disagree'..."
                                            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                                        />
                                        <button
                                            onClick={() => {
                                                triggerKinematicDialogue(dialogueInput);
                                                setDialogueInput('');
                                            }}
                                            className="px-2.5 py-1.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-black font-bold text-[9px] font-mono uppercase rounded-lg hover:brightness-110 transition cursor-pointer shrink-0"
                                        >
                                            Embody
                                        </button>
                                    </div>

                                    {/* Quick Intent Emotes */}
                                    <div className="flex flex-wrap gap-1">
                                        {[
                                            { label: "Shrug", text: "I don't really care either way.", act: "dismissing_gesture" },
                                            { label: "Nod", text: "Understood, that makes sense.", act: "agreeing" },
                                            { label: "Roger", text: "Noted and recorded.", act: "acknowledging" },
                                            { label: "Slash", text: "Striking down the foe!", act: "slash" },
                                            { label: "Cast", text: "Channeling arcane weave!", act: "spellcast" }
                                        ].map(preset => (
                                            <button
                                                key={preset.label}
                                                onClick={() => triggerKinematicDialogue(preset.text)}
                                                className="px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 text-[8px] font-mono transition cursor-pointer"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active Speech Subtitle Banner */}
                                    {activeSpeech && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/40 text-[9px] font-mono text-purple-200 flex flex-col gap-0.5"
                                        >
                                            <div className="flex items-center justify-between text-[8px] text-slate-400">
                                                <span className="flex items-center gap-1 font-bold text-cyan-300">
                                                    <Bot size={10} /> Speaking
                                                </span>
                                                <span className="font-bold text-purple-400 uppercase">
                                                    {activeSpeech.action.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="text-white italic">
                                                "{activeSpeech.text}"
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="mt-auto pt-4 space-y-2">
                                    <button
                                        onClick={handleEquipUser}
                                        className={`w-full py-2.5 px-4 rounded-xl font-bold tracking-widest text-[10px] uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                                            appliedStatus === 'user'
                                                ? 'bg-purple-600 text-white shadow-purple-900/40'
                                                : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white'
                                        }`}
                                    >
                                        <Sparkles size={14} />
                                        <span>{appliedStatus === 'user' ? '✨ EQUIPPED TO ME!' : '✨ Equip to Active Avatar (Me)'}</span>
                                    </button>
                                    <button
                                        onClick={handleEquipCompanion}
                                        className={`w-full py-2.5 px-4 rounded-xl font-bold tracking-widest text-[10px] uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                                            appliedStatus === 'companion'
                                                ? 'bg-blue-600 text-white shadow-blue-900/40'
                                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/30'
                                        }`}
                                    >
                                        <span>🐾</span>
                                        <span>{appliedStatus === 'companion' ? 'EQUIPPED TO COMPANION!' : 'Equip to Local AI Companion'}</span>
                                    </button>
                                    <button
                                        onClick={handleSpawnNpc}
                                        className={`w-full py-2.5 px-4 rounded-xl font-bold tracking-widest text-[10px] uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                                            appliedStatus === 'npc'
                                                ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
                                        }`}
                                    >
                                        <span>🧙</span>
                                        <span>{appliedStatus === 'npc' ? 'NPC DROPPED INTO SCENE!' : 'Drop into Scene as Game NPC'}</span>
                                    </button>
                                    <button
                                        onClick={() => setInspectSheetOpen(true)}
                                        className="w-full py-2 px-3 rounded-xl font-bold tracking-widest text-[9px] uppercase transition border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                        <Grid size={12} />
                                        <span>Inspect Master Spritesheet</span>
                                    </button>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={handleExportPNG}
                                            className="flex-1 py-2 px-3 rounded-xl font-bold tracking-widest text-[9px] uppercase transition border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Download size={12} />
                                            <span>Export PNG</span>
                                        </button>
                                        <button
                                            onClick={handleExportJSON}
                                            className="flex-1 py-2 px-3 rounded-xl font-bold tracking-widest text-[9px] uppercase transition border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Send size={12} />
                                            <span>Copy JSON</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[10px] text-slate-500 text-center">
                                Select a creature from the roster to inspect stats and actions.
                            </div>
                        )}
                    </div>
                </div>

                {/* Master Spritesheet Inspector Modal */}
                <AnimatePresence>
                    {inspectSheetOpen && myosSprite && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
                            onClick={() => setInspectSheetOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 10 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-slate-950 border border-purple-500/40 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-purple-500/20"
                            >
                                {/* Modal Header */}
                                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                                            <Grid size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                                    Master Spritesheet Inspector
                                                </h3>
                                                <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                                                    {myosSprite.name} • {myosAction.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-md">
                                                {myosSprite.actions[myosAction] || myosSprite.actions[myosSprite.defaultAction]}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Grid Toggle */}
                                        <button
                                            onClick={() => setSheetGridOverlay(prev => !prev)}
                                            className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                                sheetGridOverlay
                                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                                    : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                                            }`}
                                        >
                                            <Grid size={12} />
                                            <span>{sheetGridOverlay ? '8×8 GRID ON' : '8×8 GRID OFF'}</span>
                                        </button>

                                        {/* Download Active Sheet */}
                                        <a
                                            href={myosSprite.actions[myosAction] || myosSprite.actions[myosSprite.defaultAction]}
                                            download={`${myosSprite.id}_${myosAction}_sheet.png`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-[9px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                                        >
                                            <Download size={12} />
                                            <span>DOWNLOAD PNG</span>
                                        </a>

                                        <button
                                            onClick={() => setInspectSheetOpen(false)}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white text-xs transition cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Telemetry Bar */}
                                <div className="px-6 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-400">
                                    <span>Layout: <strong className="text-cyan-400">8 Directions (Rows) × 8 Frames (Columns) = 64 Frames</strong></span>
                                    <span>Row Mapping: <strong className="text-purple-300">0:D, 1:DL, 2:L, 3:UL, 4:U, 5:UR, 6:R, 7:DR</strong></span>
                                    <span>Tile: <strong className="text-emerald-400">{myosSprite.tileSize || 256} × {myosSprite.tileSize || 256} px HD</strong></span>
                                </div>

                                {/* Sheet Display Area */}
                                <div className="flex-1 overflow-auto p-6 bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:20px_20px] bg-[#020617] flex items-center justify-center min-h-[400px]">
                                    <div className="relative border border-white/15 rounded-lg shadow-2xl overflow-hidden bg-black/70">
                                        <img
                                            src={myosSprite.actions[myosAction] || myosSprite.actions[myosSprite.defaultAction]}
                                            alt={`${myosSprite.name} ${myosAction} master spritesheet`}
                                            className="image-pixelated max-w-none w-[640px] h-[640px] object-contain block"
                                        />

                                        {/* 8x8 Grid Lines Overlay */}
                                        {sheetGridOverlay && (
                                            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none">
                                                {Array.from({ length: 64 }).map((_, i) => {
                                                    const row = Math.floor(i / 8);
                                                    const col = i % 8;
                                                    const dirLabels = ['D', 'DL', 'L', 'UL', 'U', 'UR', 'R', 'DR'];
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="border border-cyan-400/25 relative flex items-end justify-end p-0.5"
                                                        >
                                                            {col === 0 && (
                                                                <span className="absolute top-0.5 left-0.5 text-[7px] font-mono font-bold text-cyan-300 bg-black/70 px-1 rounded">
                                                                    {dirLabels[row]}
                                                                </span>
                                                            )}
                                                            <span className="text-[6px] font-mono text-white/30">
                                                                F{col + 1}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
