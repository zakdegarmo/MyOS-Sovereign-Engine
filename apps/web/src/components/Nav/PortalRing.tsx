import React, { useState } from 'react';
import { DimensionalPortal } from './DimensionalPortal';
import { COUNCIL_AGENTS, type AgentId } from '../../council/agentRegistry';
import { useOntologicalContext } from '../../council/OntologicalContext';

interface PortalRingProps {
    onEnterPillar: (pillarId: string) => void;
    activePillarId?: string | null;
}

/**
 * PortalRing
 * 
 * Arranges the 10 Ontological Dimension Doors in a 360-degree array.
 * Includes the special Spawn Door for navigation up (cd ..).
 */
export const PortalRing: React.FC<PortalRingProps> = ({
    onEnterPillar,
    activePillarId
}) => {
    const { drillUp } = useOntologicalContext();
    const [openPortalId, setOpenPortalId] = useState<string | null>(null);

    // Pillar IDs in circular order
    const pillars: AgentId[] = [
        'self', 'thought', 'logic', 'unity', 'existence', 
        'improvement', 'mastery', 'resonance', 'transcendence', 'omni'
    ];

    const RADIUS = 18; // 18-meter circle for a grand JRPG feel

    return (
        <group>
            {/* THE 10 ONTOLOGICAL GATES */}
            {pillars.map((pid, index) => {
                const agent = COUNCIL_AGENTS[pid];
                if (!agent) return null;

                const angle = (index / pillars.length) * Math.PI * 2;
                const x = Math.cos(angle) * RADIUS;
                const z = Math.sin(angle) * RADIUS;

                // SPECIAL GLYPH MAPPING
                let modelUrl = `/models/glyph glb/glyph_${pid}.glb`;
                if (pid === 'omni') modelUrl = '/models/glyph glb/glyph_everything.glb';
                
                // TODO: Swap improvement with Leviathan Cross once asset resolved
                // For now, improvement uses glyph_improvement.glb

                return (
                    <DimensionalPortal
                        key={pid}
                        id={`portal-${pid}`}
                        pillarId={pid}
                        label={agent.name}
                        glyph={agent.avatarConfig.emoji || '?'}
                        modelUrl={modelUrl}
                        position={[x, 0, z]}
                        rotation={[0, -angle + Math.PI / 2, 0]} // Face the center
                        isOpen={openPortalId === pid}
                        onToggle={() => setOpenPortalId(openPortalId === pid ? null : pid)}
                        onEnter={() => {
                            onEnterPillar(pid);
                            setOpenPortalId(null);
                        }}
                    />
                );
            })}

            {/* THE SPAWN DOOR (BACK / CD ..) */}
            {/* Positioned at the 'Zero Point' but offset slightly so it doesn't overlap player immediately */}
            <DimensionalPortal
                id="portal-back"
                pillarId="back"
                label="PARENT DIMENSION"
                glyph="⎌"
                modelUrl="/models/glyph glb/glyph_self.glb" // Reuse self glyph for 'Return to Self/Parent'
                position={[0, 0, 5]}
                rotation={[0, Math.PI, 0]} // Faces the gates
                isOpen={openPortalId === 'back'}
                onToggle={() => setOpenPortalId(openPortalId === 'back' ? null : 'back')}
                onEnter={() => {
                    drillUp();
                    setOpenPortalId(null);
                }}
            />
        </group>
    );
};
