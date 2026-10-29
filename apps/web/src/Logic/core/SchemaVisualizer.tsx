
import React, { useMemo } from 'react';
import BioForceGraph from '@Existence/viz/BioForceGraph/GraphViewer.tsx'; // Use the wrapper
import type { GraphData } from '@Existence/viz/BioForceGraph/types';

// Hardcoded Schema Representation of UserGestalt (since we can't parse TS at runtime easily without a parser)
// In a real implementation, we'd use an API to return this from ts-morph on the server.
const GESTALT_SCHEMA_NODES = [
    { id: 'UserGestalt', group: 'interface', val: 20 },
    { id: 'Attribute', group: 'type', val: 10 },
    { id: 'Archetype', group: 'type', val: 10 },
    { id: 'CoreValue', group: 'type', val: 10 },
    { id: 'CognitiveModel', group: 'interface', val: 15 },
    { id: 'SymbiosisMetrics', group: 'interface', val: 15 },
    { id: 'IdentityProfile', group: 'interface', val: 15 },
    { id: 'Biometrics', group: 'interface', val: 10 },
    { id: 'Psychometrics', group: 'interface', val: 10 },
    { id: 'Aptitude', group: 'interface', val: 10 },
    { id: 'Calibration', group: 'interface', val: 10 },
    { id: 'OntologyMap', group: 'type', val: 10 },
];

const GESTALT_SCHEMA_LINKS = [
    { source: 'UserGestalt', target: 'Attribute', label: 'attributes' },
    { source: 'UserGestalt', target: 'Archetype', label: 'archetype' },
    { source: 'UserGestalt', target: 'CoreValue', label: 'coreValues' },
    { source: 'UserGestalt', target: 'CognitiveModel', label: 'cognitiveModel' },
    { source: 'UserGestalt', target: 'SymbiosisMetrics', label: 'symbiosis' },
    { source: 'UserGestalt', target: 'IdentityProfile', label: 'identity' },
    { source: 'UserGestalt', target: 'Biometrics', label: 'biometrics' },
    { source: 'UserGestalt', target: 'Psychometrics', label: 'psychometrics' },
    { source: 'UserGestalt', target: 'Aptitude', label: 'aptitude' },
    { source: 'UserGestalt', target: 'Calibration', label: 'calibration' },
    { source: 'UserGestalt', target: 'OntologyMap', label: 'ontology' },
];

interface SchemaVisualizerProps {
    className?: string;
}

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ className }) => {

    const data: GraphData = useMemo(() => ({
        nodes: GESTALT_SCHEMA_NODES.map(n => ({
            id: n.id,
            name: n.id,
            path: n.id, // Satisfy required path
            type: n.group,
            val: n.val,
            color: n.group === 'interface' ? '#38bdf8' : '#fbbf24'
        })),
        links: GESTALT_SCHEMA_LINKS.map(l => ({
            source: l.source,
            target: l.target,
            color: '#94a3b8',
            type: 'schema'
        }))
    }), []);

    return (
        <div className={`relative w-full h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 ${className}`}>
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestalt Schema</h3>
            </div>

            <BioForceGraph
                data={data}
                viewMode="schema"
                layoutMode="force"
                spacing={10}
                rotation={{ x: 0, y: 0, z: 0 }}
                onNodeClick={(node) => console.log("Schema Node:", node)}
            />
        </div>
    );
};
