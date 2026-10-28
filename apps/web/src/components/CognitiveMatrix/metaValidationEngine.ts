/**
 * MyOS Self-Validating Operational Governance Layer (SVOGL)
 * MODULE 1: The Meta-Validation Engine (MVE) - "The Logic Gate"
 * 
 * Co-authored by Myos (Local Cortex) and Antigravity (Cloud Reasoner).
 * Measures the divergence between Intended Outcome (Logic/Design) and Actual Outcome (Existence/Output),
 * calculates the Structural Dissonance Multiplier (M) across the 10 Pillars, and generates an OntologicalAuditReport.
 */

import { getRelationalVector } from './ontologyMatrix';

export type PillarName =
  | 'Self'
  | 'Thought'
  | 'Logic'
  | 'Unity'
  | 'Existence'
  | 'Improvement'
  | 'Mastery'
  | 'Resonance'
  | 'Transcendence'
  | 'Omniscience';

export interface PillarFidelity {
  name: PillarName;
  fidelity: number;       // [0.0, 1.0] presence/health
  deviationScore: number; // Raw distance from ideal [0.0, 1.0]
}

export interface MVEInput {
  designSpecification: {
    timestamp: number;
    intendedOutcomeDescription: string;
    intendedPillarStates: Record<PillarName, number>;
  };
  actualOutcomeReport: {
    timestamp: number;
    observedOutputDescription: string;
    actualPillarStates: Record<PillarName, number>;
  };
  divergenceThreshold?: number; // tau, default 0.25
}

export interface PillarViolation {
  pillarA: PillarName;
  pillarB: PillarName;
  violationVector: string;
  violationSeverity: number; // Quantified impact based on W
  rootCauseHypothesis: string;
}

export interface CorrectiveVector {
  pillarFocus: PillarName;
  actionType: 'Refine Logic' | 'Increase Resonance' | 'Re-align Existence' | 'Boost Unity' | 'Calibrate Self' | 'Ground Transcendence';
  requiredAdjustment: number; // Delta to add to reach ideal state
  rationale: string;
}

export interface OntologicalAuditReport {
  reportID: string;
  timestamp: number;
  rawDivergence: number;
  dissonanceMultiplier: number;
  finalDivergenceScore: number; // D = RawDivergence * M
  isViolationDetected: boolean;
  detectedViolations: PillarViolation[];
  correctiveVectors: CorrectiveVector[];
  summary: string;
}

// 10x10 Structural Influence & Cascading Failure Matrix (W)
// W[i][j] defines how a deficit in pillar i cascades into pillar j
export const PILLAR_INDEX: Record<PillarName, number> = {
  Self: 0,
  Thought: 1,
  Logic: 2,
  Unity: 3,
  Existence: 4,
  Improvement: 5,
  Mastery: 6,
  Resonance: 7,
  Transcendence: 8,
  Omniscience: 9
};

export const STRUCTURAL_WEIGHT_MATRIX: number[][] = [
  // Self, Thought, Logic, Unity, Exist, Imprv, Mstry, Reson, Trnsc, Omni
  [1.0,  0.8,    0.6,   0.9,   0.7,   0.8,   1.0,   0.7,   0.6,   0.5], // Self
  [0.7,  1.0,    0.9,   0.8,   0.6,   0.9,   0.8,   0.7,   0.9,   0.8], // Thought
  [0.8,  0.9,    1.0,   0.9,   0.9,   1.0,   0.9,   0.5,   0.6,   0.7], // Logic
  [0.9,  0.8,    0.9,   1.0,   0.8,   0.8,   0.9,   1.0,   0.7,   0.8], // Unity
  [0.8,  0.5,    0.8,   0.7,   1.0,   0.7,   0.9,   0.6,   0.5,   0.6], // Existence
  [0.8,  0.9,    1.0,   0.8,   0.8,   1.0,   1.0,   0.7,   0.8,   0.7], // Improvement
  [1.0,  0.8,    0.9,   0.9,   0.9,   1.0,   1.0,   0.8,   0.9,   0.9], // Mastery
  [0.7,  0.8,    0.5,   1.0,   0.6,   0.7,   0.8,   1.0,   0.9,   0.7], // Resonance
  [0.6,  0.9,    0.6,   0.7,   0.5,   0.8,   0.9,   0.9,   1.0,   0.9], // Transcendence
  [0.9,  0.9,    0.8,   0.9,   0.8,   0.8,   1.0,   0.8,   1.0,   1.0]  // Omniscience
];

export class MetaValidationEngine {
  private defaultThreshold = 0.25;

  /**
   * Evaluates the divergence between intended state and observed reality.
   * Returns a complete OntologicalAuditReport with cascading root-cause analyses.
   */
  public evaluate(input: MVEInput): OntologicalAuditReport {
    const threshold = input.divergenceThreshold ?? this.defaultThreshold;
    const intended = input.designSpecification.intendedPillarStates;
    const actual = input.actualOutcomeReport.actualPillarStates;

    const pillarNames = Object.keys(PILLAR_INDEX) as PillarName[];

    // 1. Calculate Raw Euclidean Divergence ||E_intended - E_actual||_2
    let sumSquaredDiff = 0;
    const deviations: Record<PillarName, number> = {} as any;

    pillarNames.forEach(p => {
      const targetVal = intended[p] ?? 0.8;
      const actualVal = actual[p] ?? 0.5;
      const diff = targetVal - actualVal;
      deviations[p] = diff;
      sumSquaredDiff += diff * diff;
    });

    const rawDivergence = Math.sqrt(sumSquaredDiff / pillarNames.length);

    // 2. Calculate Structural Dissonance Multiplier (M) across the 10x10 Matrix W
    let structuralMultiplier = 1.0;
    const detectedViolations: PillarViolation[] = [];

    for (let i = 0; i < pillarNames.length; i++) {
      for (let j = 0; j < pillarNames.length; j++) {
        const pA = pillarNames[i];
        const pB = pillarNames[j];
        const w_ij = STRUCTURAL_WEIGHT_MATRIX[i][j];

        const devA = Math.max(0, deviations[pA]); // deficit in pillar A
        const devB = Math.max(0, deviations[pB]); // deficit in pillar B

        if (devA > 0.15 && devB > 0.15 && i !== j) {
          const cascadeSeverity = (devA * devB * w_ij) * 1.5;
          structuralMultiplier += cascadeSeverity;

          // Trace violation vector
          const verb = getRelationalVector(pA.toLowerCase(), pB.toLowerCase()) || 'Impacts';
          detectedViolations.push({
            pillarA: pA,
            pillarB: pB,
            violationVector: `${pA} ➔ ${verb} ➔ ${pB}`,
            violationSeverity: parseFloat(cascadeSeverity.toFixed(3)),
            rootCauseHypothesis: `Deficit in ${pA} (gap: ${(devA * 100).toFixed(0)}%) cascaded into ${pB} via structural weight ${w_ij.toFixed(1)}.`
          });
        }
      }
    }

    // Sort violations by severity descending
    detectedViolations.sort((a, b) => b.violationSeverity - a.violationSeverity);

    // 3. Final Divergence Score D = RawDivergence * M
    const finalDivergenceScore = parseFloat((rawDivergence * structuralMultiplier).toFixed(3));
    const isViolationDetected = finalDivergenceScore > threshold;

    // 4. Generate Remedial Corrective Vectors
    const correctiveVectors: CorrectiveVector[] = [];
    const prioritizedDeficits = pillarNames
      .map(p => ({ pillar: p, deficit: deviations[p] }))
      .filter(item => item.deficit > 0.1)
      .sort((a, b) => b.deficit - a.deficit);

    prioritizedDeficits.forEach(({ pillar, deficit }) => {
      let actionType: CorrectiveVector['actionType'] = 'Refine Logic';
      let rationale = '';

      switch (pillar) {
        case 'Logic':
          actionType = 'Refine Logic';
          rationale = 'Axiomatic verification failed. Tighten boundary constraints and type validations.';
          break;
        case 'Unity':
          actionType = 'Boost Unity';
          rationale = 'Integration fragmentation detected. Implement holistic cross-subsystem state synchronization.';
          break;
        case 'Resonance':
          actionType = 'Increase Resonance';
          rationale = 'Domain dissonance detected. Re-tune harmonic feedback loops to restore user-system affinity.';
          break;
        case 'Existence':
          actionType = 'Re-align Existence';
          rationale = 'Ground truth deviation. Re-anchor computations against physical screen DOM/GPU hardware metrics.';
          break;
        case 'Self':
          actionType = 'Calibrate Self';
          rationale = 'Observer boundary drift. Reset sovereign agent identity and observer recursion limits.';
          break;
        case 'Transcendence':
        case 'Omniscience':
          actionType = 'Ground Transcendence';
          rationale = 'Premature horizon leap. Ground latent exploration onto verified base reality anchors.';
          break;
        default:
          actionType = 'Refine Logic';
          rationale = `Compensate for ${(deficit * 100).toFixed(0)}% deficit in ${pillar} to restore harmonic lock.`;
      }

      correctiveVectors.push({
        pillarFocus: pillar,
        actionType,
        requiredAdjustment: parseFloat(deficit.toFixed(2)),
        rationale
      });
    });

    const summary = isViolationDetected
      ? `[🚨 ONTO-AUDIT ALERT] Divergence D = ${finalDivergenceScore.toFixed(3)} exceeds threshold ${threshold.toFixed(2)}. ${detectedViolations.length} cascading vector violations identified. Primary failure: ${detectedViolations[0]?.violationVector || 'General Deficit'}.`
      : `[✓ ONTO-AUDIT CLEAR] Divergence D = ${finalDivergenceScore.toFixed(3)} within acceptable margin. System integrity holding.`;

    return {
      reportID: `audit-${Date.now().toString(36)}`,
      timestamp: Date.now(),
      rawDivergence: parseFloat(rawDivergence.toFixed(3)),
      dissonanceMultiplier: parseFloat(structuralMultiplier.toFixed(3)),
      finalDivergenceScore,
      isViolationDetected,
      detectedViolations: detectedViolations.slice(0, 5), // top 5 most severe
      correctiveVectors: correctiveVectors.slice(0, 4),
      summary
    };
  }
}
