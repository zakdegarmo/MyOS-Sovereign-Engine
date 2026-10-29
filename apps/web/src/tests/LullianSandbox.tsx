import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Sword, Shield, Wand2, Cross } from 'lucide-react';
import { GENOME_LAYERS, useAvatarCompositor, type AvatarGenome } from '../hooks/useAvatarCompositor';

// -------------------------------------------------------------
// D&D ARCHETYPES
// -------------------------------------------------------------
const ARCHETYPES: Record<string, AvatarGenome> = {
    Wizard: {
        body: 'body/bodies/body_male.png',
        hair: 'hair/bangslong/hair_bangslong_male_gray.png',
        torso: 'torso/robes/torso_robes_male_blue.png',
        legs: 'legs/pants/legs_pants_male_blue.png',
        feet: 'feet/shoes/feet_shoes_male_brown.png',
        hat: 'hat/magichat/hat_magichat_male_blue.png',
        weapon: 'weapon/magic_wand_thrust_background.png',
        offhand: 'none',
        head: 'none', nose: 'none', ears: 'none', eyes: 'none', facial: 'none', shoulders: 'none', arms: 'none'
    },
    Fighter: {
        body: 'body/bodies/body_male.png',
        hair: 'hair/messy1/hair_messy1_male_black.png',
        torso: 'torso/armor/torso_armor_male_plate.png',
        shoulders: 'shoulders/armor/shoulders_armor_male_plate.png',
        arms: 'arms/armor/arms_armor_male_plate.png',
        legs: 'legs/armor/legs_armor_male_plate.png',
        feet: 'feet/armor/feet_armor_male_plate.png',
        hat: 'none',
        weapon: 'weapon/longsword_slash_male.png',
        offhand: 'weapon/shield_cutout_body.png',
        head: 'none', nose: 'none', ears: 'none', eyes: 'none', facial: 'none'
    },
    Rogue: {
        body: 'body/bodies/body_female.png',
        hair: 'hair/ponytail/hair_ponytail_female_blonde.png',
        torso: 'torso/leather/torso_leather_female_chest.png',
        shoulders: 'shoulders/leather/shoulders_leather_female.png',
        arms: 'arms/gloves/arms_gloves_female_black.png',
        legs: 'legs/pants/legs_pants_female_black.png',
        feet: 'feet/shoes/feet_shoes_female_black.png',
        hat: 'none',
        weapon: 'weapon/dagger_thrust_male.png', // Assuming dagger
        offhand: 'none',
        head: 'none', nose: 'none', ears: 'none', eyes: 'none', facial: 'none'
    },
    Cleric: {
        body: 'body/bodies/body_male_dark.png',
        hair: 'hair/plain/hair_plain_male_blonde.png',
        torso: 'torso/chainmail/torso_chainmail_male.png',
        shoulders: 'none',
        arms: 'arms/bracers/arms_bracers_male_gold.png',
        legs: 'legs/skirts/legs_skirts_male_white.png',
        feet: 'feet/slippers/feet_slippers_male_white.png',
        hat: 'none',
        weapon: 'weapon/mace_slash_male.png',
        offhand: 'weapon/shield_cutout_body.png',
        head: 'none', nose: 'none', ears: 'none', eyes: 'none', facial: 'none'
    }
};

const DndArchetypeCreator = ({ manifest }: { manifest: any }) => {
    const [genome, setGenome] = useState<AvatarGenome>(ARCHETYPES.Wizard);
    const [layerOptions, setLayerOptions] = useState<Record<string, string[]>>({});
    const [action, setAction] = useState<'idle' | 'walk' | 'slash' | 'thrust' | 'spellcast'>('idle');

    // Parse the new dnd_manifest.json
    useEffect(() => {
        if (!manifest || !manifest.sprites) return;
        const options: Record<string, string[]> = {};
        
        GENOME_LAYERS.forEach(layer => {
            const assets: string[] = ['none']; 
            if (manifest.sprites[layer]) {
                const keys = Object.keys(manifest.sprites[layer]);
                keys.forEach(k => {
                    const item = manifest.sprites[layer][k];
                    if (item && item.path) {
                        assets.push(item.path);
                    }
                });
            }
            options[layer] = assets; 
        });
        setLayerOptions(options);
    }, [manifest]);

    // Auto-load Wizard once manifest is parsed
    useEffect(() => {
        if (Object.keys(layerOptions).length > 0) {
            loadArchetype('Wizard');
        }
    }, [layerOptions]);

    // Ensure fallback if the hardcoded archetype paths don't exactly match the manifest
    const getValidAsset = (layer: string, desiredAsset: string) => {
        if (desiredAsset === 'none') return 'none';
        const options = layerOptions[layer] || ['none'];
        if (options.length <= 1) return 'none'; // Manifest not loaded yet

        if (options.includes(desiredAsset)) return desiredAsset;
        
        // Try fuzzy match by filename
        const filename = desiredAsset.split('/').pop()?.replace('.png', '') || desiredAsset;
        const fuzzy = options.find(o => o.includes(filename));
        if (fuzzy) return fuzzy;

        // Try fuzzy match by a key keyword
        const parts = filename.split('_');
        if (parts.length > 1) {
            const keyword = parts[1]; // e.g. 'robe' or 'plate'
            const looseFuzzy = options.find(o => o.includes(keyword) && o !== 'none');
            if (looseFuzzy) return looseFuzzy;
        }
        
        // Fallback to first actual asset (not 'none')
        return options.length > 1 ? options[1] : 'none';
    };

    const loadArchetype = (archetypeKey: string) => {
        if (Object.keys(layerOptions).length === 0) return; // Prevent loading before manifest

        const template = ARCHETYPES[archetypeKey];
        const newGenome: AvatarGenome = {};
        GENOME_LAYERS.forEach(layer => {
            newGenome[layer] = getValidAsset(layer, template[layer] || 'none');
        });
        setGenome(newGenome);
        
        // Auto-select a thematic action
        if (archetypeKey === 'Wizard' || archetypeKey === 'Cleric') setAction('spellcast');
        else if (archetypeKey === 'Fighter') setAction('slash');
        else setAction('idle');
    };

    const spinReel = (layer: string, direction: number) => {
        setGenome(prev => {
            const options = layerOptions[layer] || ['none'];
            const currentAsset = prev[layer] || 'none';
            let currentIndex = options.indexOf(currentAsset);
            if (currentIndex === -1) currentIndex = 0;
            
            let nextIndex = currentIndex + direction;
            if (nextIndex < 0) nextIndex = options.length - 1;
            if (nextIndex >= options.length) nextIndex = 0;
            
            return { ...prev, [layer]: options[nextIndex] };
        });
    };

    const [renderTick, setRenderTick] = useState(0);
    const forceUpdate = useCallback(() => setRenderTick(prev => prev + 1), []);
    
    // Animate progress to show the character moving!
    const [animProgress, setAnimProgress] = useState(0);
    useEffect(() => {
        let frame = 0;
        const tick = () => {
            frame++;
            setAnimProgress((frame % 60) / 60); // 1-second loop
            requestAnimationFrame(tick);
        };
        const handle = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(handle);
    }, []);

    const { canvas, isLoaded } = useAvatarCompositor(
        genome,
        action,
        'D',
        animProgress,
        { resolution: 256, onRender: forceUpdate, allowRunningActions: true }
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const displayCtx = canvasRef.current?.getContext('2d');
        if (!displayCtx) return;
        displayCtx.imageSmoothingEnabled = false;
        displayCtx.clearRect(0, 0, 256, 256);
        displayCtx.drawImage(canvas, 0, 0, 256, 256);
    }, [canvas, renderTick, animProgress]);

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none p-8">
            
            {/* Top Bar: D&D Class Selection */}
            <div className="w-full max-w-2xl bg-black/60 border border-fuchsia-500/30 rounded-2xl p-4 pointer-events-auto backdrop-blur-md">
                <h3 className="text-xs font-black uppercase text-fuchsia-400 tracking-widest text-center mb-4 flex items-center justify-center gap-2">
                    <Sparkles size={14} /> D&D Archetype Creator
                </h3>
                <div className="flex justify-center gap-4">
                    <button onClick={() => loadArchetype('Wizard')} className="flex items-center gap-2 px-4 py-2 bg-indigo-900/50 hover:bg-indigo-600/50 rounded-lg text-xs font-bold text-indigo-200 border border-indigo-500/30 transition-all"><Wand2 size={14}/> Wizard</button>
                    <button onClick={() => loadArchetype('Fighter')} className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-600/50 rounded-lg text-xs font-bold text-red-200 border border-red-500/30 transition-all"><Sword size={14}/> Fighter</button>
                    <button onClick={() => loadArchetype('Rogue')} className="flex items-center gap-2 px-4 py-2 bg-emerald-900/50 hover:bg-emerald-600/50 rounded-lg text-xs font-bold text-emerald-200 border border-emerald-500/30 transition-all"><Shield size={14}/> Rogue</button>
                    <button onClick={() => loadArchetype('Cleric')} className="flex items-center gap-2 px-4 py-2 bg-amber-900/50 hover:bg-amber-600/50 rounded-lg text-xs font-bold text-amber-200 border border-amber-500/30 transition-all"><Cross size={14}/> Cleric</button>
                </div>
            </div>

            {/* The Composited Avatar Canvas */}
            <div className="relative w-64 h-64 pointer-events-auto bg-black/40 border-2 border-white/10 rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center mt-8">
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={256} height={256}
                    className="image-pixelated w-full h-full scale-150 transform transition-transform"
                />
            </div>
            
            {/* Action Stance Toggles */}
            <div className="flex gap-2 mt-4 pointer-events-auto">
                {['idle', 'walk', 'slash', 'spellcast', 'thrust'].map(act => (
                    <button 
                        key={act} 
                        onClick={() => setAction(act as any)}
                        className={`px-3 py-1 text-[9px] font-bold uppercase rounded border ${action === act ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-black/50 text-slate-400 border-white/10 hover:bg-white/10'}`}
                    >
                        {act}
                    </button>
                ))}
            </div>

            {/* The Lullian Wheels (Layer Customization) */}
            <div className="mt-auto w-full max-w-4xl bg-black/80 p-4 rounded-2xl border border-white/10 pointer-events-auto backdrop-blur-xl">
                <div className="text-[10px] text-slate-400 text-center mb-3 uppercase tracking-widest">Character Sheet Customization Layers</div>
                <div className="flex flex-wrap gap-2 justify-center">
                    {GENOME_LAYERS.map(layer => {
                        const currentAsset = genome[layer];
                        const shortName = currentAsset && currentAsset !== 'none' 
                            ? currentAsset.split('/').pop()?.replace('.png', '').substring(0, 10) 
                            : 'none';

                        return (
                            <div key={layer} className="flex flex-col items-center bg-black/40 border border-white/5 rounded overflow-hidden hover:border-cyan-500/50 transition-colors w-[72px]">
                                <button onClick={() => spinReel(layer, -1)} className="w-full h-6 bg-white/5 hover:bg-white/20 text-[10px] font-bold text-cyan-400 transition-colors">▲</button>
                                <div className="flex flex-col items-center py-1">
                                    <span className="text-[9px] font-black text-white/70 uppercase tracking-wider">{layer}</span>
                                    <span className="text-[7px] font-mono text-cyan-500/70 truncate w-full text-center px-1" title={currentAsset}>{shortName}</span>
                                </div>
                                <button onClick={() => spinReel(layer, 1)} className="w-full h-6 bg-white/5 hover:bg-white/20 text-[10px] font-bold text-cyan-400 transition-colors">▼</button>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

import manifestData from '../textures/avatars/lpc/dnd_manifest.json';

export const LullianSandbox: React.FC = () => {
    return (
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white flex flex-col font-mono relative overflow-hidden">
            <DndArchetypeCreator manifest={manifestData} />
        </div>
    );
};
