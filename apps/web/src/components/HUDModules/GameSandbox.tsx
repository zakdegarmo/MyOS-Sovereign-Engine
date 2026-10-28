import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Code, Cpu, Sparkles, Terminal, Save, MonitorPlay, FileCode2 } from 'lucide-react';

interface GameSandboxProps {
    address: string;
    conceptName: string;
}

const INTEGRATED_APPS = [
    // Web Applications (The Open Internet as OS Modules)
    { id: 'excalidraw', name: 'Excalidraw Whiteboard', desc: 'Infinite Canvas & Architecture Planning', url: 'https://excalidraw.com/' },
    { id: 'photopea', name: 'Photopea (Photoshop)', desc: 'Advanced Image Editing Suite', url: 'https://www.photopea.com/' },
    { id: 'desmos', name: 'Desmos Graphing Engine', desc: 'Mathematical & Parametric Graphing', url: 'https://www.desmos.com/calculator' },
    
    // Legacy Local HTML Engines
    { id: 'zamn_bot_engine.html', name: 'ZAMN Bot HD-2D Engine', desc: 'Survival Sandbox & Bot Logic' },
    { id: 'mystra_living_brain.html', name: 'Mystra Living Brain', desc: '3D Neural Network Visualization' },
    { id: 'mystra_molecular_v24.html', name: 'Molecular Core V24', desc: 'Fractal Genome Physics' },
    { id: 'mystra_v15_remastered.html', name: 'Mystra V15 Remastered', desc: 'Legacy Ontology Engine' },
    { id: 'mystra_fractal_genome_v1.html', name: 'Fractal Genome V1', desc: 'Data Slicing Experiment' },
    { id: 'mystra_local_brain.html', name: 'Local Brain Topology', desc: 'Offline Neural Navigator' },
    { id: "'self-affirms-existence' App/index.html", name: 'Self Affirms Existence', desc: 'Ontology Node Applet' },
    { id: "'self-experiences-resonance' App/index.html", name: 'Self Experiences Resonance', desc: 'Ontology Node Applet' },
    { id: "'self-pursues-mastery' App/index.html", name: 'Self Pursues Mastery', desc: 'Ontology Node Applet' },
    { id: "'self-seeks-unity' App/index.html", name: 'Self Seeks Unity', desc: 'Ontology Node Applet' },
    { id: "'self-undergoes-improvement' App/index.html", name: 'Self Undergoes Improvement', desc: 'Ontology Node Applet' },
    { id: '3d_ttf/index.html', name: '3D TTF Engine', desc: '3D Font Rendering Engine' },
    { id: 'davinci-appsmasher (1)/index.html', name: 'DaVinci AppSmasher V1', desc: 'Agentic Tool Fusion' },
    { id: 'davinci-appsmasher (7)/index.html', name: 'DaVinci AppSmasher V7', desc: 'Advanced Tool Fusion' },
    { id: 'Glyph/index.html', name: 'Glyph Interface', desc: 'Experimental Control Interface' },
    { id: 'max-o-vision-companion/index.html', name: 'Max-O-Vision Companion', desc: 'Visual Analytics Tool' },
    { id: 'morphos/index.html', name: 'Morphos', desc: 'Shape/Form Transformation Engine' },
    { id: 'myontology-stimulus-ide/index.html', name: 'MyOntology Stimulus IDE', desc: 'Reactive Editing Environment' },
    { id: 'myos---ontology-profile/index.html', name: 'MyOS Ontology Profile', desc: 'System Core Data Viewer' },
    { id: 'myos-aetherial-tutor/index.html', name: 'Aetherial Tutor', desc: 'Guided Knowledge Flow' },
    { id: 'myos_-the-ontological-engine (3)/index.html', name: 'The Ontological Engine', desc: 'Core Processing Applet' },
    { id: 'uniglyph-3d/index.html', name: 'UniGlyph 3D', desc: 'Geometric Symbol Interface' },
    { id: 'voxeltype---the-physics-font (1)/index.html', name: 'VoxelType Physics Font', desc: 'Voxel Physical Typography' },
];

export const GameSandbox: React.FC<GameSandboxProps> = ({ address, conceptName }) => {
    const [activeTab, setActiveTab] = useState<'APPS' | 'RAW'>('APPS');
    const [isRunning, setIsRunning] = useState(false);
    const [activeApp, setActiveApp] = useState<string | null>(null);
    const [code, setCode] = useState(`// Welcome to the MyOS Game Sandbox
// Address: ${address}
// Concept: ${conceptName}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(10, 10, 20, 50);
  
  // Fractal Expression of ${conceptName}
  noStroke();
  let t = frameCount * 0.05;
  for(let i=0; i<10; i++) {
    fill(100, 200, 255, 100);
    let x = width/2 + cos(t + i) * 100;
    let y = height/2 + sin(t + i) * 100;
    ellipse(x, y, 20, 20);
  }
}`);

    const iframeRef = useRef<HTMLIFrameElement>(null);

    // If active App changes, auto run it
    useEffect(() => {
        if (activeTab === 'APPS' && activeApp) {
            setIsRunning(true);
            if (iframeRef.current) {
                const appDef = INTEGRATED_APPS.find(a => a.id === activeApp);
                iframeRef.current.src = appDef?.url ? appDef.url : `/integrations/integrations/${activeApp}`;
                iframeRef.current.removeAttribute('srcdoc');
            }
        }
    }, [activeApp, activeTab]);

    const runCode = () => {
        setIsRunning(true);
        if (activeTab === 'RAW') {
            const script = `
                <html>
                    <head>
                        <script src="/lib/p5.js"></script>
                        <style>
                            body { margin: 0; overflow: hidden; background: transparent; }
                            canvas { display: block; }
                        </style>
                    </head>
                    <body>
                        <script>
                            ${code}
                        </script>
                    </body>
                </html>
            `;
            if (iframeRef.current) {
                iframeRef.current.srcdoc = script;
                iframeRef.current.removeAttribute('src');
            }
        } else if (activeTab === 'APPS' && activeApp) {
            if (iframeRef.current) {
                const appDef = INTEGRATED_APPS.find(a => a.id === activeApp);
                iframeRef.current.src = appDef?.url ? appDef.url : `/integrations/integrations/${activeApp}`;
                iframeRef.current.removeAttribute('srcdoc');
            }
        }
    };

    const stopCode = () => {
        setIsRunning(false);
        if (iframeRef.current) {
            iframeRef.current.srcdoc = '';
            iframeRef.current.removeAttribute('src');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                        <MonitorPlay size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase">MyOS App Loader</h3>
                        <p className="text-[9px] font-mono text-white/40">{address} // ENV_SECURED</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-black/60 p-1 rounded-lg border border-white/5">
                    <button 
                        onClick={() => { setActiveTab('APPS'); stopCode(); }}
                        className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'APPS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <MonitorPlay size={12} /> Integrations
                    </button>
                    <button 
                        onClick={() => { setActiveTab('RAW'); stopCode(); }}
                        className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'RAW' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <FileCode2 size={12} /> Raw P5.JS
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {!isRunning ? (
                        <button 
                            onClick={runCode}
                            disabled={activeTab === 'APPS' && !activeApp}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
                                (activeTab === 'APPS' && !activeApp) 
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                            }`}
                        >
                            <Play size={14} /> BOOT
                        </button>
                    ) : (
                        <button 
                            onClick={stopCode}
                            className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-900/40"
                        >
                            <Square size={14} /> HALT
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (App List or Editor) */}
                <div className="w-1/3 min-w-[300px] border-r border-white/5 flex flex-col bg-black/20">
                    {activeTab === 'RAW' ? (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border-b border-white/5">
                                <Code size={12} className="text-blue-500" />
                                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-tighter">Genomic Script</span>
                            </div>
                            <textarea 
                                className="flex-1 w-full bg-transparent p-4 font-mono text-xs text-blue-300 resize-none outline-none selection:bg-blue-500/30"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                spellCheck={false}
                            />
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border-b border-white/5">
                                <MonitorPlay size={12} className="text-indigo-400" />
                                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-tighter">Legacy Integrations</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
                                {INTEGRATED_APPS.map(app => (
                                    <button
                                        key={app.id}
                                        onClick={() => {
                                            setActiveApp(app.id);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                                            activeApp === app.id
                                                ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                : 'bg-black/40 border-white/5 hover:border-indigo-500/50 hover:bg-slate-900'
                                        }`}
                                    >
                                        <div className="text-xs font-bold text-slate-200 mb-1">{app.name}</div>
                                        <div className="text-[10px] font-mono text-slate-500">{app.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-black relative">
                    {!isRunning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600 bg-black/50 z-10 backdrop-blur-sm">
                            <Terminal size={48} strokeWidth={1} className="opacity-20 translate-y-2" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">OS Environment Ready For Boot</p>
                        </div>
                    )}
                    <iframe 
                        ref={iframeRef}
                        className="w-full h-full border-none bg-black"
                        title="Sandbox Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
                    />
                </div>
            </div>

            {/* Legend / Status Bar */}
            <div className="h-6 bg-black/60 border-t border-white/5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{isRunning ? 'SYSTEM ONLINE' : 'SYSTEM IDLE'}</span>
                    </div>
                </div>
                <div className="text-[9px] font-mono text-slate-700">
                    NEXUS_LOADER_V2.0.0
                </div>
            </div>
        </div>
    );
};
