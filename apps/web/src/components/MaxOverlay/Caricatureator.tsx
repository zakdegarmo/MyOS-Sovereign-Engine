import React, { useState, useRef } from 'react';
import { Camera, Upload, Wand2, Sparkles, RefreshCw, X, Check, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateGeminiResponse } from './maxGeminiService';
import { useCouncil } from '../../council/CouncilContext';

interface CaricatureatorProps {
    onGenomeGenerated?: (genome: any) => void;
    onClose?: () => void;
}

/**
 * CARICATURE-ATOR (Path 2): Visual Feature Translation
 * 
 * This module uses our Gemini VLM pipeline to 'see' an image and translate it 
 * into a structured LPC Genome that our engine can render.
 * 
 * TUTOR NOTE: This bridges the 'Real World' and our 'Pixel World' through AI-driven 
 * feature extraction and deterministic mapping.
 */
export const Caricatureator: React.FC<CaricatureatorProps> = ({ onGenomeGenerated, onClose }) => {
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedGenome, setGeneratedGenome] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const runCaricaturePipeline = async () => {
        if (!image) return;
        setIsAnalyzing(true);

        try {
            // PROMPT: Map visual features to the LPC asset library
            const prompt = `
                TASK: CARICATURE-ATOR V1.0
                Analyze this image and generate an LPC (Libre Pixel Cup) AvatarGenome.
                Identify:
                1. Gender (male/female/skeleton)
                2. Hair color/style
                3. Clothing (top/bottom) types and colors.

                Asset Mapping Rules (Reference):
                - Gender: body_bodies_male.png | body_bodies_female.png | body_bodies_skeleton.png
                - Hair: hair_bangs_male_ash.png | hair_pixie_male_blonde.png | hair_long_female_brown.png
                - Tops: torso_clothes_longsleeve_formal_white.png | torso_clothes_robe_purple.png | torso_clothes_shirt_blue.png
                - Bottoms: legs_pants_brown.png | legs_skirts_white.png | legs_pants_jeans.png

                Return JSON only:
                {
                  "name": "Extracted Persona",
                  "genome": {
                    "body": "lpc_id",
                    "hair": "lpc_id",
                    "tops": "lpc_id",
                    "bottoms": "lpc_id"
                  },
                  "analysis": "Brief rationale for choice"
                }
            `;

            const res = await generateGeminiResponse(prompt, image);
            const data = typeof res.text === 'string' ? JSON.parse(res.text.replace(/```json|```/g, '')) : res.text;

            setGeneratedGenome(data);
            if (onGenomeGenerated) onGenomeGenerated(data.genome);
        } catch (e) {
            console.error("[CARICATURE] Pipeline failed:", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-black/40 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-3xl shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        <Camera size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-display font-bold text-sm tracking-widest text-purple-400 uppercase">Input Capture</h2>
                        <p className="text-[10px] text-white/30 font-mono">CARICATURE-ATOR V1.0</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Source Input */}
                <div className="flex-1 flex flex-col p-6 items-center justify-center border-r border-white/10 space-y-6">
                    <div className={`w-[250px] aspect-[4/3] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden relative group
                        ${image ? 'border-purple-500/50 bg-purple-500/5 shadow-inner' : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/10'}`}
                    >
                        {image ? (
                            <>
                                <img src={image} className="w-full h-full object-cover" alt="Source" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-black rounded-full shadow-2xl">
                                        <RefreshCw size={24} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-3 px-6 pointer-events-none">
                                <ImageIcon size={48} className="mx-auto text-white/10" />
                                <p className="text-xs text-white/40 font-mono tracking-tight underline cursor-pointer pointer-events-auto" onClick={() => fileInputRef.current?.click()}>
                                    CLICK TO SCAN AGENT SUBJECT
                                </p>
                                <p className="text-[9px] text-white/20 uppercase tracking-widest">Supports PNG, JPG, WEBP</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>

                    <button
                        onClick={runCaricaturePipeline}
                        disabled={!image || isAnalyzing}
                        className={`w-[250px] py-4 rounded-3xl font-bold flex items-center justify-center gap-3 transition-all shadow-2xl text-[11px] tracking-widest uppercase
                            ${!image || isAnalyzing
                                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                : 'bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}
                    >
                        {isAnalyzing ? (
                            <>ANALYZING PIXELS <Sparkles size={16} className="animate-spin text-purple-600" /></>
                        ) : (
                            <>GENERATE MEPHIT <Wand2 size={16} /></>
                        )}
                    </button>
                </div>

                {/* Output Translation */}
                <div className="w-[320px] bg-white/5 flex flex-col p-6 overflow-y-auto scrollbar-hide">
                    <div className="flex items-center gap-2 mb-6">
                        <Wand2 size={14} className="text-purple-400" />
                        <h3 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Translated Genome</h3>
                    </div>

                    <AnimatePresence mode="wait">
                        {generatedGenome ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
                                    <h4 className="text-white font-bold text-sm mb-1">{generatedGenome.name}</h4>
                                    <p className="text-[10px] text-white/60 leading-relaxed italic">"{generatedGenome.analysis}"</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 font-mono">
                                    {Object.entries(generatedGenome.genome).map(([key, val]: any) => (
                                        <div key={key} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                                            <span className="text-[9px] uppercase tracking-tighter text-white/40">{key}</span>
                                            <span className="text-[10px] text-purple-400 font-bold truncate ml-4">{val}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => alert("Genome Dispatched to Universal Compositor!")}
                                    className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl hover:bg-white/20 transition-all text-white font-bold text-[10px] tracking-widest uppercase flex items-center justify-center gap-2"
                                >
                                    <Check size={14} /> AUTHORIZE DISPATCH
                                </button>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                <div className="p-4 rounded-full border border-white/20">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-[10px] font-mono tracking-tighter">Awaiting Matrix Manifestation...</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
