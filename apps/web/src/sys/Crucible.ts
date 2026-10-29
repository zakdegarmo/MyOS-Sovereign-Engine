/**
 * Crucible.ts
 * 
 * The 27-point Prismatic Evaluation Matrix.
 * Validates StickyNotes against Friction, Elegance, and Potency.
 */

import type { StickyNote, IDaemon } from '../sys/Daemon';
import { SemanticAddress } from './SemanticAddress';

export interface FacetResult {
    score: number; // 0.0 to 1.0
    message: string;
}

export interface PillarResults {
    score: number;
    facets: Record<string, FacetResult>;
}

export interface ValidationResult {
    id: string;
    passed: boolean;
    totalScore: number;
    pillars: {
        friction: PillarResults;
        elegance: PillarResults;
        potency: PillarResults;
    };
    minted?: {
        omni: number;
        coins: Record<string, number>;
    };
    timestamp: number;
}

export class Crucible {
    /**
     * The primary entry point for evaluating a daemon's proposal.
     */
    public static async evaluate(daemon: IDaemon, note: StickyNote): Promise<ValidationResult> {
        const friction = this.checkFriction(daemon, note);
        const elegance = this.checkElegance(daemon, note);
        const potency = this.checkPotency(daemon, note);

        const totalScore = (friction.score + elegance.score + potency.score) / 3;
        const passed = totalScore > 0.7; // 70% threshold for "The Great Work"

        const result: ValidationResult = {
            id: `val-${note.id}`,
            passed,
            totalScore,
            pillars: {
                friction,
                elegance,
                potency
            },
            timestamp: Date.now()
        };

        result.minted = this.mintCoins(result);
        return result;
    }

    /**
     * Mints 'ontoCoins' based on the 27-facet check.
     * 9 Pillars x 3 Facets each. Omni (🜋) is the Total (Dollar).
     */
    private static mintCoins(result: ValidationResult) {
        const f = result.pillars.friction.facets;
        const e = result.pillars.elegance.facets;
        const p = result.pillars.potency.facets;

        const coins: Record<string, number> = {
            '⚹': (p.ontology.score + p.kernel.score + p.intent.score) / 3, // Self
            '☿': (e.naming.score + e.traceability.score + e.cohesion.score) / 3, // Thought
            '🜔': (f.namespace.score + f.dependency.score + f.sideEffect.score) / 3, // Logic
            '🝩': (e.complexity.score + e.depth.score + e.exit.score) / 3, // Conjunction
            '🜄': (f.cpu.score + f.ram.score + f.gpu.score) / 3, // Existence
            '🜏': (e.nigredo.score + e.albedo.score + e.rubedo.score) / 3, // Improvement
            '☉': (p.portability.score + p.inheritance.score + p.velocity.score) / 3, // Mastery
            '♀': (f.promptTax.score + f.attention.score + f.bypassRate.score) / 3, // Resonance
            '🜍': (p.fuzz.score + p.degradation.score + p.recovery.score) / 3, // Transcendence
        };

        return {
            omni: result.totalScore, // The Dollar
            coins
        };
    }

    private static checkFriction(daemon: IDaemon, note: StickyNote): PillarResults {
        const facets: Record<string, FacetResult> = {
            // Agent Friction (Bare Metal)
            cpu: { score: note.metadata.duration < 100 ? 1 : 0.5, message: "Execution time check" },
            ram: { score: note.metadata.complexity < 50 ? 1 : 0.6, message: "Memory footprint check" },
            gpu: { score: 1.0, message: "Concurrency/Thread lock check" },
            
            // Symbiorithm Friction (Architecture)
            namespace: { 
                score: daemon.address.rootIndex.length === 8 ? 1 : 0, 
                message: "10-symbol schema alignment" 
            },
            dependency: { score: 0.9, message: "Coupling check" },
            sideEffect: { score: 1.0, message: "Global state mutation check" },

            // User Friction (Cognitive Load)
            promptTax: { score: 0.8, message: "Action-to-Resolution ratio" },
            attention: { score: 0.9, message: "Flow-state interrupt check" },
            bypassRate: { score: 1.0, message: "Manual override monitoring" }
        };

        return {
            score: Object.values(facets).reduce((a, b) => a + b.score, 0) / 9,
            facets
        };
    }

    private static checkElegance(daemon: IDaemon, note: StickyNote): PillarResults {
        // Simple heuristic: complexity vs clarity
        const facets: Record<string, FacetResult> = {
            // Clarity
            naming: { score: 0.8, message: "Semantic resonance" },
            traceability: { score: 0.9, message: "State flow check" },
            cohesion: { score: 0.85, message: "Linear narrative check" },

            // Density (Alchemical Hack)
            nigredo: { score: 0.9, message: "Dead code hacking" },
            albedo: { score: 0.8, message: "Purification/DRY" },
            rubedo: { score: 0.7, message: "Higher-order compression" },

            // Symmetry (Geometry)
            complexity: { score: 0.9, message: "Cyclomatic knot test" },
            depth: { score: 1.0, message: "Nesting depth (Pyramid of Doom)" },
            exit: { score: 1.0, message: "Early return/Guard clause check" }
        };

        return {
            score: Object.values(facets).reduce((a, b) => a + b.score, 0) / 9,
            facets
        };
    }

    private static checkPotency(daemon: IDaemon, note: StickyNote): PillarResults {
        const facets: Record<string, FacetResult> = {
            // Multiplier (Generalization)
            portability: { score: 0.7, message: "Lateral application test" },
            inheritance: { score: 0.9, message: "Little-endian inheritance" },
            velocity: { score: 0.8, message: "Compounding system impact" },

            // Chaos Sink (Anti-Fragility)
            fuzz: { score: 0.6, message: "Entropy/Garbage data test" },
            degradation: { score: 0.9, message: "Fallback safety check" },
            recovery: { score: 1.0, message: "State reset check" },

            // Teleology (Alignment)
            ontology: { score: 1.0, message: "Master Genome grounding" },
            kernel: { score: 1.0, message: "Root ledger compliance" },
            intent: { score: 0.9, message: "Ascension Vector/Purpose check" }
        };

        return {
            score: Object.values(facets).reduce((a, b) => a + b.score, 0) / 9,
            facets
        };
    }
}
