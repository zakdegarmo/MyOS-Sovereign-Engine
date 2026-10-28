import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { X, Upload, Zap, Download, Box, Loader2, AlertCircle, Eraser } from 'lucide-react';
import { FactoryService, type GenerationProgress } from '../../services/FactoryService';
import { purgeVram } from '../MaxOverlay/localLlmService';

interface ManifestationChamberProps {
    onClose: () => void;
}

const Preview3D = ({ url }: { url: string }) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
};

export const ManifestationChamber: React.FC<ManifestationChamberProps> = ({ onClose }) => {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [glbUrl, setGlbUrl] = useState<string | null>(null);
    const [isManifesting, setIsManifesting] = useState(false);
    const [progress, setProgress] = useState<GenerationProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [manualUrl, setManualUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = () => {
        let finalUrl = glbUrl || manualUrl;
        if (!finalUrl) return;

        // 1% Easter Egg Roll
        const roll = Math.random();
        if (roll < 0.01) {
            console.log("EASTER EGG TRIGGERED! Oh no, not again...");
            finalUrl = 'whale.glb'; // Fallback path
        }

        const event = new CustomEvent('manifestation_drop', { detail: { url: finalUrl } });
        window.dispatchEvent(event);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setGlbUrl(null);
            setError(null);
        }
    };

    const handleManifest = async () => {
        if (!image) return;

        setIsManifesting(true);
        setError(null);
        setProgress({ stage: 'queued', percent: 0 });

        try {
            const resultUrl = await FactoryService.generateFromImage(image, (p) => {
                setProgress(p);
            });
            setGlbUrl(resultUrl);
        } catch (err: any) {
            setError(err.message || "Manifestation failed.");
        } finally {
            setIsManifesting(false);
            setProgress(null);
        }
    };

    const handleDownload = () => {
        if (!glbUrl) return;
        const link = document.createElement('a');
        link.href = glbUrl;
        link.download = `manifested_entity_${Date.now()}.glb`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-[1000px] h-[700px] bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col font-sans"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <Box size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Manifestation Chamber</h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Neural Synthesis Engine v2.0</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Input & Control */}
                <div className="w-[380px] border-r border-white/5 flex flex-col p-8 space-y-8 bg-black/20">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-1">Source Material</h3>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative aspect-square rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group ${previewUrl ? 'border-cyan-500/50' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Source" className="w-full h-full object-cover rounded-3xl opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <>
                                    <div className="p-4 bg-white/5 rounded-full mb-3 text-white/20 group-hover:text-white/40 transition-colors">
                                        <Upload size={32} />
                                    </div>
                                    <span className="text-xs font-bold text-white/20 uppercase tracking-widest group-hover:text-white/40">Inject Sprite</span>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept="image/*" />
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <input 
                                type="text"
                                placeholder="Manual GLB URL (Injection Mode)"
                                value={manualUrl}
                                onChange={(e) => {
                                    setManualUrl(e.target.value);
                                    if(e.target.value) setGlbUrl(e.target.value);
                                }}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-[10px] font-mono text-cyan-400 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1" />

                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Neural Phase</h3>
                            <button 
                                onClick={() => purgeVram()}
                                className="flex items-center gap-2 text-[9px] font-bold text-white/30 hover:text-amber-400 transition-colors uppercase tracking-widest"
                                title="Unload AI model from VRAM to speed up 3D synthesis. Telemetry and system logic will remain active in the background."
                            >
                                <Eraser size={12} />
                                Clear VRAM
                            </button>
                        </div>
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3"
                                >
                                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-red-200/80 leading-relaxed uppercase font-bold tracking-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            disabled={!image || isManifesting}
                            onClick={handleManifest}
                            className={`w-full p-6 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.3em] text-xs relative overflow-hidden ${isManifesting ? 'bg-white/5 text-white/20' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] active:scale-95'}`}
                        >
                            {isManifesting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin text-cyan-400" />
                                    <span>Synthesizing...</span>
                                    <motion.div 
                                        className="absolute bottom-0 left-0 h-1 bg-cyan-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress?.percent || 0}%` }}
                                    />
                                </>
                            ) : (
                                <>
                                    <Zap size={20} className="text-cyan-300" />
                                    <span>Manifest 3D</span>
                                </>
                            )}
                        </button>

                        <button 
                            disabled={!glbUrl && !manualUrl}
                            onClick={handleDownload}
                            className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.3em] text-[10px] border border-white/10 ${glbUrl || manualUrl ? 'bg-white/10 text-white hover:bg-white/20' : 'text-white/10'}`}
                        >
                            <Download size={16} />
                            <span>Extract GLB</span>
                        </button>
                        
                        <button 
                            disabled={!glbUrl && !manualUrl}
                            onClick={handleDrop}
                            className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.3em] text-[10px] border border-white/10 ${glbUrl || manualUrl ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border-indigo-500/50' : 'text-white/10'}`}
                        >
                            <Box size={16} />
                            <span>Drop to Sandbox</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: Manifestation Preview */}
                <div className="flex-1 relative bg-black">
                    {glbUrl && !glbUrl.includes('undefined') ? (
                        <Canvas shadows dpr={[1, 2]}>
                            <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={40} />
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} />
                            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                            
                            <Stage environment="night" intensity={1} contactShadow={false}>
                                <Preview3D url={glbUrl} />
                            </Stage>
                            
                            <OrbitControls 
                                enablePan={false} 
                                minDistance={2} 
                                maxDistance={6} 
                                target={[0, 1, 0]}
                            />
                            <ambientLight intensity={0.4} />
                            <pointLight position={[0, 5, 3]} intensity={1.5} color="#8844ff" />
                        </Canvas>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                            <div className="w-64 h-64 border border-white/5 rounded-full flex items-center justify-center animate-pulse">
                                <Box size={48} className="text-white/5" />
                            </div>
                            <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.5em]">Waiting for Transmutation</span>
                        </div>
                    )}

                    {/* Progress HUD */}
                    <AnimatePresence>
                        {isManifesting && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute top-8 right-8 p-6 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-3xl min-w-[200px]"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Neural Phase</span>
                                        <span className="text-[9px] font-mono text-cyan-300">{(progress?.percent || 0).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress?.percent || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-white/60 italic leading-tight">
                                        {progress?.message || "Aligning latent space kernels..."}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at center, transparent 0%, black 100%), linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
                        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
                    }} />
                </div>
            </div>
        </motion.div>
    );
};
