import * as THREE from 'three';
import type { NLBL_ThoughtNode, NLBL_Relationship } from '../types/NLBL_Schema';

/**
 * NLBL_Physics.ts
 * 
 * Implements the resonance physics calculations for the 3D Graph.
 * "Standard force graphs use Spring Physics. We use Resonance Physics."
 */

export const NLBL_Physics = {
    /**
     * Calculates the 3D position of a node based on its ontological properties.
     * x: Derived from Dewey Class (The Neighborhood)
     * y: Derived from Fractal Depth (The Z-Layer / Altitude) - FLIPPED for 3D vis typically
     * z: Derived from NLBL Shift (The Warp/Displacement)
     */
    calculateResonanceAddress: (dewey: string, depth: number, shift: string): { x: number, y: number, z: number } => {
        // 1. BASE: Dewey Decimal Map (000 - 999 mapped to a radial angle or X-plane)
        const deweyVal = parseFloat(dewey) || 0;
        const angle = (deweyVal / 1000) * Math.PI * 2;
        const radius = 100 + (depth * 50); // Deeper thoughts are further out (or in?)

        // 2. DEPTH: Y-Axis (The Hierarchy)
        const y = depth * -50; // Levels go down

        // 3. SHIFT: NLBL Complexity (Z-Axis / Warp)
        // Parse the shift string [...0.n.0...] to get a density score
        const complexity = shift.length;
        const z = (Math.random() - 0.5) * complexity * 10; // Placeholder randomness + complexity

        return {
            x: Math.cos(angle) * radius,
            y: y,
            z: z
        };
    },

    /**
     * TIME TUNNEL: The Phenomenology of Use.
     * "Nodes step forward in space for each time the file is opened."
     * Used to calculate the Z-axis displacement based on usage.
     */
    calculateTimeTunnelShift: (usage: number): number => {
        return (usage || 0) * 5;
    },
    /**
     * NLBL Coordinate Mapper (The Kinetic Weaver)
     * Translates Semantic Metadata into 3D Space Coordinates.
     * @param node The data node (Book/Thought)
     * @param globalPillarWeights The current 10-Pillar Force Matrix configuration
     */
    mapToNLBLSpace: (node: any, globalPillarWeights: Record<number, number>) => {
        // 1. X-AXIS: Dewey Decimal Distribution
        // Normalize Dewey (000-999) to range -50 to 50
        const deweyRaw = node.ddc?.number || node.callNumber || "500";
        const deweyBase = parseFloat(deweyRaw) || 500;
        const x = ((deweyBase / 1000) * 100) - 50;

        // 2. Y-AXIS: Fractal Depth & Logic Push
        // Fractal Depth defaults to 1 if not present.
        const fractalDepth = node.fractalDepth || 1;
        const depthFactor = fractalDepth * 5;

        // Logic (Pillar 3) snaps nodes to a 10-unit Y-grid
        const logicForce = globalPillarWeights[3] || 0;
        const logicAlignment = Math.round(x / 10) * 10;
        // Interpolate between natural depth and logic-enforced grid
        const y = (-depthFactor) * (1 - logicForce) + (logicAlignment * logicForce * 0.5);

        // 3. Z-AXIS: Temporal Resonance (The Time Tunnel)
        // Existence (5) Decays back. Mastery (7) Resists.
        // We calculate an initial Z based on lastAccessed.
        const now = Date.now();
        const lastAccess = node.accessStats?.lastAccessed || node.addedAt || now;
        const daysSinceActive = (now - lastAccess) / (1000 * 60 * 60 * 24);

        const existenceForce = (globalPillarWeights[5] !== undefined) ? globalPillarWeights[5] : 0.1;
        const masteryForce = (globalPillarWeights[7] !== undefined) ? globalPillarWeights[7] : 0.9;

        // Base depth: 1 day = 1 unit back (scaled by Existence force)
        const existenceDepth = daysSinceActive * -10 * existenceForce;

        // Mastery Float: High mastery brings it forward
        const masteryFloat = masteryForce * 20;

        const z = existenceDepth + masteryFloat;

        return new THREE.Vector3(x, y, z);
    },

    /**
     * Translates a standard JSON-LD Relationship into a ForceGraph link object
     * with visual particles.
     */
    manifestLink: (sourceId: string, rel: NLBL_Relationship) => {
        return {
            source: sourceId,
            target: rel.target_node,
            type: rel.vector_type,
            particles: (rel.visual_manifest.particle_density || 0.5) * 10,
            color: rel.visual_manifest.particle_color || '#fff',
            width: (rel.visual_manifest.line_opacity || 0.5) * 2
        };
    },

    /**
     * Calculates the gravitational mass of a node based on its "Digital Weight" (Bytes).
     * "Heavy files have gravity. They warp the weave."
     */
    calculateNodeMass: (sizeKB: number): number => {
        // Base mass is 1. Heavy files (>100KB) start acting like stars.
        if (!sizeKB) return 1;
        return Math.min(Math.max(1, sizeKB / 10), 50); // Cap at 50 to prevent Black Holes
    },

    /**
     * Determines the strength of the bond (Spring Stiffness).
     * "Is there a bond strength? Yes. Some logic is undeniable."
     */
    calculateBondStrength: (vectorType: string): number => {
        switch (vectorType) {
            case 'foundational': return 0.9; // Rigid, unyielding (The Salt)
            case 'recursive': return 0.5;    // Flexible, bouncing (The Mercury)
            case 'synergetic': return 0.7;   // Strong but adaptive
            case 'conflicting': return 0.1;  // Weak, repelling (Tension)
            default: return 0.3;
        }
    },

    /**
     * SAFETY PROTOCOL: The Weave Integrity Check.
     * "Can the Matrix be de-logiced? Can the weave be torn?"
     * Checks if coordinates have drifted explicitly into NaN (The Void) or Infinity (The Tear).
     */
    checkWeaveIntegrity: (coords: { x: number, y: number, z: number }): boolean => {
        if (
            isNaN(coords.x) || isNaN(coords.y) || isNaN(coords.z) ||
            !isFinite(coords.x) || !isFinite(coords.y) || !isFinite(coords.z)
        ) {
            console.warn("⚠️ ONTOLOGICAL TEAR DETECTED. Coordinates collapsed to Singularity.");
            return false;
        }
        return true;
    }
};
