/**
 * IntegrationSandbox.tsx
 * 
 * The specialized "Stage" for legacy prototypes.
 * Ingests external apps and sandboxes them within the NexusContainer.
 */

import React, { Suspense, lazy, useMemo } from 'react';
import type { IntegrationDefinition } from '../../engine/IntegrationRegistry';
import { AlertTriangle } from 'lucide-react';

// Defensive Substrate: Error Boundary for integrations
class IntegrationErrorBoundary extends React.Component<{ name: string; children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: any) {
        console.error(`[SYSTEM] Integration failure [${this.props.name}]:`, error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center gap-4">
                    <AlertTriangle size={24} className="text-red-500" />
                    <p className="font-mono text-xs text-red-500 uppercase tracking-[0.3em]">Integration Failure: {this.props.name}</p>
                    <p className="font-mono text-[9px] text-slate-400 max-w-sm mt-2 uppercase">The integration environment encountered a critical breach and was isolated. Check local logs for detailed telemetry.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

// Cache for lazy components to prevent re-creation on every render
const componentCache: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {};

const getLazyComponent = (id: string) => {
    if (componentCache[id]) return componentCache[id];

    componentCache[id] = lazy(() => {
        console.log(`[IntegrationSandbox] Lazy-loading module for ID: ${id}`);
        if (id === 'glyphrider') return import('../../cartridges/Glyphrider/GlyphriderCartridge').then(m => ({ default: m.GlyphriderCartridge }));
        if (id === 'skeleton-builder') return import('../../integrations/skeleton-builder/index');
        if (id === 'maestro-studio') return import('../../integrations/maestro-studio/index');
        if (id === 'max-companion') return import('../../integrations/max-companion/App');
        if (id === 'repoman-habitat') return import('../../integrations/repoman-habitat/App');
        if (id === 'omni-lab') return import('../../integrations/omni-lab/OmniLab');
        if (id === 'sixteen-bit-theater') return import('../HUDModules/SixteenBitTheater');
        if (id === 'aether-scraper') return import('../../integrations/aether-scraper/App');
        if (id === 'test-sandbox') return import('../MaxOverlay/IsolatedTestSandbox').then(m => ({ default: m.IsolatedTestSandbox }));
        
        // Native HUD Modules (Pillars 1-10)
        if (id === 'gestalt-mirror') return import('../HUDModules/GestaltMirror').then(m => ({ default: m.GestaltMirror }));
        if (id === 'thought-orchestrator') return import('../HUDModules/ThoughtOrchestrator').then(m => ({ default: m.ThoughtOrchestrator }));
        if (id === 'logic-gate') return import('../HUDModules/LogicGate').then(m => ({ default: m.LogicGate }));
        if (id === 'unity-interlink') return import('../HUDModules/UnityInterlink').then(m => ({ default: m.UnityInterlink }));
        if (id === 'existence-sensor') return import('../HUDModules/EnvironmentControls').then(m => ({ default: m.EnvironmentControls }));
        if (id === 'improvement-vault') return import('../HUDModules/InventoryModule').then(m => ({ default: m.InventoryModule }));
        if (id === 'mastery-consolidator') return import('../HUDModules/MasteryConsolidator').then(m => ({ default: m.MasteryConsolidator }));
        if (id === 'vibe-scanner') return import('../HUDModules/VibeScanner').then(m => ({ default: m.VibeScanner }));
        if (id === 'paradigm-shifter') return import('../HUDModules/ParadigmShifter').then(m => ({ default: m.ParadigmShifter }));
        if (id === 'aether-archive') return import('../HUDModules/AetherArchive').then(m => ({ default: m.AetherArchive }));
        if (id === 'aether-nexus') return import('../HUDModules/AetherNexus').then(m => ({ default: m.AetherNexus }));
        if (id === 'manifestation-chamber') return import('../HUDModules/ManifestationChamber').then(m => ({ default: m.ManifestationChamber }));
        if (id === 'software-installer') return import('../HUDModules/SoftwareInstaller').then(m => ({ default: m.SoftwareInstaller }));
        if (id === 'dnd-lore-app') return import('../HUDModules/DnDLoreApp').then(m => ({ default: m.DnDLoreApp }));
        
        throw new Error(`Integration Component not found: ${id}`);
    });


    return componentCache[id];
};

interface IntegrationSandboxProps {
    integration: IntegrationDefinition;
    onClose?: () => void;
}

export const IntegrationSandbox: React.FC<IntegrationSandboxProps> = ({
    integration,
    onClose
}) => {
    const [vitePort, setVitePort] = React.useState<number | null>(null);
    const [isBooting, setIsBooting] = React.useState(false);

    React.useEffect(() => {
        if (integration.type === 'vite-project') {
            setIsBooting(true);
            fetch(`/__boot?app=${encodeURIComponent(integration.entryPoint)}`)
                .then(r => r.json())
                .then(data => {
                    setVitePort(data.port);
                    setIsBooting(false);
                })
                .catch(err => {
                    console.error('Failed to boot vite project:', err);
                    setIsBooting(false);
                });
        }
    }, [integration]);

    if (integration.type.startsWith('iframe') || integration.type === 'vite-project') {
        let finalUrl = '';
        
        if (integration.type === 'iframe-web') finalUrl = integration.entryPoint;
        else if (integration.type === 'iframe-local') finalUrl = `/integrations/integrations/${integration.entryPoint}`;
        else if (integration.type === 'vite-project') finalUrl = vitePort ? `http://localhost:${vitePort}` : '';

        if (integration.type === 'vite-project' && isBooting) {
            return (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center gap-4">
                    <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
                    <p className="font-mono text-xs text-indigo-400 uppercase tracking-[0.3em]">Booting Node Environment for {integration.name}</p>
                    <p className="font-mono text-[9px] text-slate-500 max-w-sm mt-4">Running npm install & hot-reloading Dev Server on native port in the background... this may take 30-60 seconds on initial boot.</p>
                </div>
            );
        }
        
        if (!finalUrl) {
            return (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center gap-4">
                    <p className="font-mono text-xs text-red-500 uppercase tracking-[0.3em]">Integrations Error</p>
                    <p className="font-mono text-[10px] text-slate-400 max-w-sm mt-2">Failed to resolve the entry point URL for this integration. The background dev server may have crashed or timed out.</p>
                </div>
            );
        }

        return (
            <div className="w-full h-full bg-black relative overflow-hidden group">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute left-4 top-4 px-3 py-1.5 rounded-lg bg-slate-950/90 text-red-500 hover:bg-red-900/40 hover:text-red-400 font-mono text-[9px] sm:text-xs tracking-[0.2em] border border-red-500/20 hover:border-red-500/60 shadow-2xl backdrop-blur-2xl transition-all z-[99999] opacity-40 group-hover:opacity-100 hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        TERMINATE_PROTOCOL [ESC]
                    </button>
                )}
                <IntegrationErrorBoundary name={integration.name}>
                    <iframe 
                        src={finalUrl}
                        className="w-full h-full border-none"
                        title={integration.name}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                    />
                </IntegrationErrorBoundary>
            </div>
        );
    }

    // 2. Handle React Components (for projects like Glyphrider)
    if (integration.type === 'react') {
        console.log(`[IntegrationSandbox] Manifesting React Integration: ${integration.id} (${integration.path})`);
        
        const DynamicComponent = useMemo(() => getLazyComponent(integration.id), [integration.id]);

        return (
            <div className="w-full h-full relative bg-slate-900 overflow-hidden group">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute left-4 top-4 px-3 py-1.5 rounded-lg bg-slate-950/90 text-red-500 hover:bg-red-900/40 hover:text-red-400 font-mono text-[9px] sm:text-xs tracking-[0.2em] border border-red-500/20 hover:border-red-500/60 shadow-2xl backdrop-blur-2xl transition-all z-[99999] opacity-40 group-hover:opacity-100 hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        TERMINATE_PROTOCOL [ESC]
                    </button>
                )}
                <Suspense fallback={
                    <div className="flex items-center justify-center h-full text-white/20 font-mono text-xs uppercase animate-pulse">
                        INITIALIZING {integration.name}...
                    </div>
                }>
                    <IntegrationErrorBoundary name={integration.name}>
                        <DynamicComponent onClose={onClose || (() => {})} />
                    </IntegrationErrorBoundary>
                </Suspense>
            </div>
        );
    }

    return (
        <div className="p-12 text-white/40 font-mono text-xs uppercase">
            Unsupported Integration Type: {integration.type}
        </div>
    );
};
