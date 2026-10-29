import React, { useState } from 'react';
import { X, Upload, Scissors, Sparkles, PlusCircle, Box } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssetManifestPanelProps {
    onClose: () => void;
    onManifest: (config: { path: string, removeBackground: boolean, scale: number, animation: 'bob' | 'none', backgroundUrl?: string, geometryType?: any, color?: string, wireframe?: boolean }) => void;
}

export const AssetManifestPanel: React.FC<AssetManifestPanelProps> = ({ onClose, onManifest }) => {
    const [path, setPath] = useState('');
    const [removeBackground, setRemoveBackground] = useState(true);
    const [geometryType, setGeometryType] = useState<string>('sprite');
    const [scale, setScale] = useState(1);
    const [animation, setAnimation] = useState<'bob' | 'none'>('none');
    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [color, setColor] = useState('#ffffff');
    const [wireframe, setWireframe] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6 z-[11000] text-slate-100 font-mono"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                        <Sparkles size={20} />
                    </div>
                    <h2 className="text-xl font-bold tracking-tighter uppercase italic">Asset Manifest</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                {/* File Path */}
                <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-1">Source Path (Local File)</label>
                    <div className="relative group">
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                        <input
                            type="text"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            placeholder="C:\Users\...\image.png"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {/* Geometry Type & Color */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-1">Geometry Primitive</label>
                        <select
                            value={geometryType}
                            onChange={(e) => setGeometryType(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none text-cyan-400 uppercase tracking-widest font-black"
                        >
                            <option value="sprite">2.5D Sprite (Billboard)</option>
                            <option value="box">Cube / Box</option>
                            <option value="sphere">Sphere / Point</option>
                            <option value="tetrahedron">Pyramid (Tetrahedron)</option>
                            <option value="cylinder">Cylinder / Column</option>
                            <option value="cone">Cone / Spike</option>
                            <option value="torus">Torus (Donut)</option>
                            <option value="torusKnot">Torus Knot (Complexity)</option>
                            <option value="icosahedron">Icosahedron (D20)</option>
                            <option value="octahedron">Octahedron</option>
                            <option value="dodecahedron">Dodecahedron</option>
                            <option value="ring">Flat Ring</option>
                            <option value="plane">Flat Plane</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-1">Base Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-11 w-16 bg-black/40 border border-white/10 rounded-xl p-1 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono uppercase focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Animation & Wireframe */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-1">Animation</label>
                        <select
                            value={animation}
                            onChange={(e) => setAnimation(e.target.value as any)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none text-cyan-400"
                        >
                            <option value="none" className="bg-slate-900 text-slate-100">None</option>
                            <option value="bob" className="bg-slate-900 text-slate-100">Bobbing</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-1">Render Mode</label>
                        <button
                            onClick={() => setWireframe(!wireframe)}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${wireframe
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                : 'bg-black/40 border-white/10 text-slate-500'
                                }`}
                        >
                            <Box size={16} className={wireframe ? 'animate-pulse' : ''} />
                            <span className="text-xs uppercase font-bold tracking-tighter">{wireframe ? 'Wireframe ACTIVE' : 'Solid Mesh'}</span>
                        </button>
                    </div>
                </div>

                {/* Processing & Stage Background */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-1">Processing</label>
                        <button
                            onClick={() => setRemoveBackground(!removeBackground)}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${removeBackground
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-black/40 border-white/10 text-slate-500'
                                }`}
                        >
                            <Scissors size={16} />
                            <span className="text-xs">{removeBackground ? 'Chroma-Key Active' : 'Preserve BG'}</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-1">Initial Scale</label>
                        <input
                            type="number"
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                </div>

                {/* Footer Action */}
                <button
                    onClick={() => onManifest({ path, removeBackground, scale, animation, backgroundUrl, geometryType: geometryType as any, color, wireframe })}
                    disabled={!path && !backgroundUrl && geometryType === 'sprite'}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:grayscale"
                >
                    <PlusCircle size={20} />
                    INITIALIZE MANIFESTATION
                </button>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] text-slate-500 leading-relaxed italic">
                Manifested assets are processed server-side to resolve alpha channels and localized for the R3F scene. Right-click assets in-scene to spatially refine.
            </div>
        </motion.div>
    );
};
