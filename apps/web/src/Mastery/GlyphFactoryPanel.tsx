import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Center, Text3D, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TTFLoader, GLTFExporter } from 'three-stdlib';
import { Download, Box, Upload, Search } from 'lucide-react';

// --- Font Loader Utility ---
const loadFont = (blob: Blob): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loader = new TTFLoader();
                const font = loader.parse(e.target?.result as ArrayBuffer);
                resolve(font);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
};

// --- NEW Assistant: Canvas Based Voxel Fallback ---
const createShapesFromSystemFont = (char: string): THREE.Shape[] => {
    const size = 256; // Reduced for performance
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.75}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, size / 2, size / 2);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const shapes: THREE.Shape[] = [];
    const threshold = 128;
    const resolution = 32; // Voxel resolution
    const step = size / resolution;

    for (let vy = 0; vy < resolution; vy++) {
        for (let vx = 0; vx < resolution; vx++) {
            const sx = Math.floor(vx * step + step / 2);
            const sy = Math.floor(vy * step + step / 2);
            if (data[(sy * size + sx) * 4] > threshold) {
                const px = (vx / resolution) * 50 - 25;
                const py = ((resolution - vy) / resolution) * 50 - 25;
                const s = 50 / resolution;
                const rect = new THREE.Shape();
                rect.moveTo(px, py);
                rect.lineTo(px + s, py);
                rect.lineTo(px + s, py + s);
                rect.lineTo(px, py + s);
                shapes.push(rect);
            }
        }
    }
    return shapes;
};

// --- Visualizer Scene ---
const VisualizerScene = ({ fontData, shape, spacing, p, q, charSet }: { fontData: any, shape: string, spacing: number, p: number, q: number, charSet: string[] }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { clock } = useThree();

    useFrame(() => {
        if (!groupRef.current || charSet.length === 0) return;

        const time = clock.getElapsedTime();
        const count = charSet.length;

        if (['circle', 'helix', 'sphere', 'grid'].includes(shape)) {
            groupRef.current.rotation.y += 0.005;
        } else {
            groupRef.current.rotation.set(0, 0, 0);
        }

        groupRef.current.children.forEach((child, i) => {
            const mesh = child as THREE.Mesh;

            if (shape === 'mobius') {
                const R = 150 * spacing;
                const u = (i / count) * Math.PI * 2 + time * 0.2;
                const v = 2 * u;
                mesh.position.set(
                    (R + 30 * Math.cos(v / 2)) * Math.cos(u),
                    (R + 30 * Math.cos(v / 2)) * Math.sin(u),
                    30 * Math.sin(v / 2)
                );
                mesh.lookAt(0, 0, 0);
            }
            else if (shape === 'torus-knot') {
                const radius = 100 * spacing;
                const tubeRadius = 40 * spacing;
                const animSpeed = 0.05;
                const u = ((i / count) + time * animSpeed) * Math.PI * 2;
                const getPos = (uVal: number) => {
                    const _p = p * uVal, _q = q * uVal;
                    return new THREE.Vector3(
                        (radius + tubeRadius * Math.cos(_q)) * Math.cos(_p),
                        (radius + tubeRadius * Math.cos(_q)) * Math.sin(_p),
                        tubeRadius * Math.sin(_q)
                    );
                };
                const P = getPos(u);
                mesh.position.copy(P);
                mesh.lookAt(getPos(u + 0.01));
            }
            else if (shape === 'grid') {
                const itemSize = 60 * spacing;
                const cols = Math.ceil(Math.sqrt(count));
                mesh.position.set(
                    (i % cols - (cols - 1) / 2) * itemSize,
                    (Math.floor(i / cols) - (Math.floor(count / cols) - 1) / 2) * -itemSize,
                    0
                );
                mesh.lookAt(0, 0, 1000);
            }
            else if (shape === 'circle') {
                const radius = Math.max(200, count * 5) * spacing;
                const angle = (i / count) * Math.PI * 2;
                mesh.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
                mesh.lookAt(0, 0, 0);
            }
        });
    });

    return (
        <group ref={groupRef}>
            <Center>
                {charSet.map((char, i) => (
                    <TextGroup key={i} char={char} fontData={fontData} />
                ))}
            </Center>
        </group>
    );
};

const TextGroup = ({ char, fontData }: { char: string, fontData: any }) => {
    // If no fontData, we use our fallback custom geometry
    if (!fontData) {
        const shapes = useMemo(() => createShapesFromSystemFont(char), [char]);
        return (
            <mesh>
                <extrudeGeometry args={[shapes, { depth: 5, bevelEnabled: false }]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
            </mesh>
        );
    }
    return (
        <Text3D font={fontData} size={20} height={4} curveSegments={4}>
            {char}
            <meshStandardMaterial color="#00ffdd" roughness={0.3} metalness={0.8} />
        </Text3D>
    );
}

// --- Glyph Picker Sidebar ---
const GlyphPicker = ({ fontData, onSelect }: { fontData: any, onSelect: (char: string) => void }) => {
    const [filter, setFilter] = useState("");
    const glyphs = useMemo(() => {
        if (!fontData || !fontData.glyphs) return [];
        return Object.keys(fontData.glyphs).filter(k => k.length === 1);
    }, [fontData]);

    const filteredGlyphs = glyphs.filter(g => g.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="w-64 bg-slate-950/80 border-l border-amber-900/30 flex flex-col h-full">
            <div className="p-3 border-b border-amber-900/30 bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <Search size={14} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Select Glyph</h3>
                </div>
                <input
                    placeholder="Search..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-900/50 px-2 py-1.5 rounded text-xs text-amber-100 outline-none focus:border-amber-500"
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 gap-2 content-start custom-scrollbar">
                {filteredGlyphs.map(char => (
                    <button
                        key={char}
                        onClick={() => onSelect(char)}
                        className="aspect-square bg-slate-900 hover:bg-amber-900/40 border border-amber-900/20 hover:border-amber-500/50 rounded flex items-center justify-center text-lg transition-all"
                    >
                        {char}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const GlyphFactoryPanel: React.FC = () => {
    const [fontData, setFontData] = useState<any>(null);
    const [status, setStatus] = useState("Idle");
    const [sampleText, setSampleText] = useState("NEXUS");
    const [isExporting, setIsExporting] = useState(false);

    // Viz Controls
    const [shape, setShape] = useState("grid");
    const [spacing, setSpacing] = useState(1.0);
    const [p, setP] = useState(2);
    const [q, setQ] = useState(3);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setStatus("Loading Font...");
        try {
            const font = await loadFont(file);
            setFontData(font);
            setStatus(`Loaded ${file.name}`);
        } catch (err) {
            setStatus("Error loading font");
        }
    };

    const handleExportGLB = async () => {
        if (isExporting || !sampleText) return;
        setIsExporting(true);
        setStatus("Exporting GLB...");

        try {
            const exporter = new GLTFExporter();
            // We'll create a single mesh for the first character for now
            // In a better version, we'd export the whole group
            const shapes = createShapesFromSystemFont(sampleText[0] || 'A');
            const geometry = new THREE.ExtrudeGeometry(shapes, { depth: 5, bevelEnabled: false });
            const material = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8, roughness: 0.3 });
            const mesh = new THREE.Mesh(geometry, material);

            exporter.parse(
                mesh,
                (result) => {
                    const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `glyph_${sampleText[0] || 'A'}.glb`;
                    link.click();
                    URL.revokeObjectURL(url);
                    setStatus("Export Success!");
                    setIsExporting(false);
                },
                (err) => {
                    console.error(err);
                    setStatus("Export Error");
                    setIsExporting(false);
                },
                { binary: true }
            );
        } catch (e) {
            setStatus("Export Failed");
            setIsExporting(false);
        }
    };

    const charSet = sampleText.split('');

    return (
        <div className="flex flex-col h-full bg-slate-900/90 text-amber-500 font-mono p-4 gap-4 overflow-hidden border-l border-amber-900/50">
            <header className="flex justify-between items-center border-b border-amber-900/30 pb-3">
                <h2 className="text-xl font-bold flex items-center gap-3">
                    <Box className="text-amber-500" />
                    <span>UNIGLYPH FACTORY // V1.5</span>
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportGLB}
                        disabled={isExporting}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/50 rounded flex items-center gap-2 text-xs uppercase tracking-widest transition-all"
                    >
                        <Download size={14} /> {isExporting ? "Processing..." : "Export GLB"}
                    </button>
                    <label className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/50 rounded flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer transition-all">
                        <Upload size={14} /> Upload TTF
                        <input type="file" accept=".ttf" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </header>

            {/* Controls Bar */}
            <div className="flex gap-6 bg-black/40 p-3 rounded border border-amber-900/20">
                <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[10px] uppercase opacity-50">Active Glyph(s)</span>
                    <input
                        value={sampleText}
                        onChange={e => setSampleText(e.target.value)}
                        className="bg-slate-900 border border-amber-900/50 px-3 py-1.5 rounded text-sm text-amber-100 outline-none focus:border-amber-500"
                        placeholder="Enter text..."
                    />
                </div>
                <div className="flex flex-col gap-1 w-40">
                    <span className="text-[10px] uppercase opacity-50">Arrangement</span>
                    <select value={shape} onChange={e => setShape(e.target.value)} className="bg-slate-900 border border-amber-900/50 px-3 py-1.5 rounded text-xs text-amber-500 outline-none">
                        <option value="grid">Grid</option>
                        <option value="circle">Circle</option>
                        <option value="mobius">Möbius</option>
                        <option value="torus-knot">Torus Knot</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1 w-32">
                    <span className="text-[10px] uppercase opacity-50 flex justify-between">Spacing <span>{spacing}x</span></span>
                    <input type="range" min="0.5" max="3" step="0.1" value={spacing} onChange={e => setSpacing(parseFloat(e.target.value))} className="accent-amber-500" />
                </div>

                {/* Knot Controls */}
                {shape === 'torus-knot' && (
                    <div className="flex gap-4 animate-in fade-in slide-in-from-left-4">
                        <div className="flex flex-col gap-1 w-20">
                            <span className="text-[10px] uppercase opacity-50 flex justify-between">P <span>{p}</span></span>
                            <input type="range" min="1" max="10" step="1" value={p} onChange={e => setP(parseInt(e.target.value))} className="accent-amber-500" />
                        </div>
                        <div className="flex flex-col gap-1 w-20">
                            <span className="text-[10px] uppercase opacity-50 flex justify-between">Q <span>{q}</span></span>
                            <input type="range" min="1" max="10" step="1" value={q} onChange={e => setQ(parseInt(e.target.value))} className="accent-amber-500" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                <div className="flex-1 bg-black/80 rounded border border-amber-900/30 relative overflow-hidden group">
                    <Canvas camera={{ position: [0, 50, 400], fov: 50 }}>
                        <ambientLight intensity={0.7} />
                        <pointLight position={[10, 10, 10]} intensity={2} />
                        <OrbitControls makeDefault />
                        <VisualizerScene fontData={fontData} shape={shape} spacing={spacing} p={p} q={q} charSet={charSet} />
                        <gridHelper args={[1000, 20]} position={[0, -50, 0]} />
                    </Canvas>

                    <div className="absolute bottom-4 left-4 p-2 bg-slate-900/80 border border-amber-500/20 rounded-lg text-[10px] font-mono pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity">
                        <div className="text-amber-400">STATUS: {status}</div>
                        <div className="text-amber-600">GLYPHS: {charSet.length}</div>
                        <div className="text-amber-600">MODE: {fontData ? "VECTOR" : "VOXEL FALLBACK"}</div>
                    </div>
                </div>

                {fontData && <GlyphPicker fontData={fontData} onSelect={c => setSampleText(prev => prev + c)} />}
            </div>
        </div>
    );
};
