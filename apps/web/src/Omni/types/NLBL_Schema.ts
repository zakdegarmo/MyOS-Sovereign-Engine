
/**
 * NLBL_Schema.ts
 * 
 * Defines the types for the Non-Linear Base Logic (NLBL) Linked Data schema.
 * Received from MG-NLBL-SCHEMA-20260104-003.
 * 
 * This schema enables Resonance Physics in the graph:
 * - Dewey Decimal -> Base Neighborhood
 * - Fractal Depth -> Z-Layer
 * - NLBL Logic -> Warp Drive (Resonance Vectors)
 */

export type Vector3 = [number, number, number];

export interface NLBL_Context {
    "moose": string;
    "nlbl": string;
    "dewey": string;
    "resonance": string;
    "coordinate": {
        "@id": string;
        "@type": "@json";
    };
}

export interface NLBL_ResonanceAddress {
    /** The rough (x, y, z) generated from the base logic before shift */
    base_vector: Vector3;
    /** The signature string determining non-linear displacement e.g., [...0.n.0.n.0...] */
    nlbl_logic_shift: string;
    /** The final calculated coords logic descriptions */
    calculated_xyz: {
        x: string; // "f(Dewey, NLBL_shift)"
        y: string; // "f(FractalDepth, NLBL_shift)"
        z: string; // "f(RelationshipDensity, NLBL_shift)"
    };
}

export interface VisualManifest {
    /** 0.0 to 1.0 */
    line_opacity: number;
    /** 'directional_forward' | 'bi_directional' | 'static' */
    particle_flow: string;
    /** 0.0 to 1.0 */
    particle_density: number;
    /** Hex code */
    particle_color: string;
    /** e.g. "432Hz" */
    pulse_frequency: string;
}

export interface NLBL_Relationship {
    target_node: string;
    /** 'synergetic' | 'recursive' | 'conflicting' | 'foundational' */
    vector_type: string;
    visual_manifest: VisualManifest;
}

export interface NLBL_ThoughtNode {
    "@context": NLBL_Context;
    "@type": "moose:ThoughtNode" | string;
    "@id": string; // e.g., "weave:thought:alpha-772-resonance"
    "label": string;
    "metadata": {
        /** The Dewey Decimal classification (e.g., "121.8") */
        dewey_class: string;
        /** The recursion depth level (integer) */
        fractal_depth: number;
        version_serial: string;
    };
    "nlbl_resonance_address": NLBL_ResonanceAddress;
    "relationship_matrix": NLBL_Relationship[];
}
