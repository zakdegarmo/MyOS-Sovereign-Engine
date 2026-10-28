/**
 * MyOS Self-Validating Operational Governance Layer (SVOGL)
 * MODULE 3: The Prioritization Matrix (PIM) - "The Governance Core"
 * 
 * Co-authored by Myos (Local Cortex) and Antigravity (Cloud Reasoner).
 * Ingests reports from the Meta-Validation Engine (MVE) and Vector Stress Tester (VST),
 * and calculates a mathematically defensible priority score for candidate interventions,
 * quantifying the maximum velocity toward Mastery (❂) per unit of structural entropy.
 */

import { OntologicalAuditReport, CorrectiveVector, PillarName } from './metaValidationEngine';
import { StressSimulationResult } from './vectorStressTester';

export interface CandidateAction {
  id: string;
  title: string;
  pillarFocus: PillarName;
  description: string;
  estimatedImplementationCost: number; // [0.1, 1.0] (Complexity, GPU time, dev friction)
  projectedMasteryDelta: number;       // [0.1, 1.0] (Direct acceleration toward Mastery ❂)
  targetVector?: string;
}

export interface PrioritizedAction extends CandidateAction {
  priorityScore: number;
  resilienceFactor: number;
  divergenceDiscount: number;
  urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'STRATEGIC' | 'MAINTENANCE';
  governanceRationale: string;
}

export interface GovernanceRoadmap {
  roadmapId: string;
  timestamp: number;
  totalCandidatesEvaluated: number;
  topPriorityAction: PrioritizedAction | null;
  rankedActions: PrioritizedAction[];
  overallSystemVelocity: number; // Projected delta toward Mastery across top actions
  governanceVerdict: string;
}

export class PrioritizationMatrix {
  /**
   * Evaluates candidate actions against live audit divergence and stress simulation resilience.
   * Priority Score Formula:
   * P = (DeltaMastery * Resilience) / (Divergence + ImplementationCost + 0.1)
   */
  public evaluate(
    candidates: CandidateAction[],
    auditReport: OntologicalAuditReport,
    stressResult: StressSimulationResult
  ): GovernanceRoadmap {
    const rawDiv = auditReport.finalDivergenceScore; // D from MVE
    const resilience = stressResult.systemicResilience; // R from VST

    const prioritized: PrioritizedAction[] = candidates.map(c => {
      // 1. Calculate Priority Score P
      // Higher DeltaMastery & Resilience boost priority; high Divergence or Cost increases threshold
      const cost = Math.max(0.05, c.estimatedImplementationCost);
      const masteryGain = Math.max(0.05, c.projectedMasteryDelta);

      // Deficit alignment bonus: If this action directly targets a pillar with an active audit violation
      const isAddressingViolation = auditReport.detectedViolations.some(
        v => v.pillarA === c.pillarFocus || v.pillarB === c.pillarFocus
      );
      const isAddressingStress = stressResult.pillarStressPoints[c.pillarFocus]?.isCritical;
      const alignmentBonus = (isAddressingViolation ? 0.35 : 0.0) + (isAddressingStress ? 0.45 : 0.0);

      const denominator = rawDiv + cost + 0.15;
      const numerator = (masteryGain + alignmentBonus) * (resilience + 0.2);
      const priorityScore = parseFloat((numerator / denominator).toFixed(3));

      // 2. Classify Urgency Level
      let urgencyLevel: PrioritizedAction['urgencyLevel'] = 'MAINTENANCE';
      if (isAddressingStress || priorityScore > 1.25) {
        urgencyLevel = 'IMMEDIATE';
      } else if (isAddressingViolation || priorityScore > 0.85) {
        urgencyLevel = 'HIGH';
      } else if (priorityScore > 0.50) {
        urgencyLevel = 'STRATEGIC';
      }

      // 3. Formulate Defensible Rationale
      const governanceRationale = isAddressingStress
        ? `Critical intervention: Targets elevated stress in ${c.pillarFocus} while yielding +${(masteryGain * 100).toFixed(0)}% Mastery.`
        : isAddressingViolation
        ? `Remediates active audit violation on ${c.pillarFocus} with structural efficiency ${priorityScore.toFixed(2)}.`
        : `Strategic capability enhancement. High resilience (${(resilience * 100).toFixed(0)}%) with balanced implementation cost.`;

      return {
        ...c,
        priorityScore,
        resilienceFactor: resilience,
        divergenceDiscount: rawDiv,
        urgencyLevel,
        governanceRationale
      };
    });

    // Sort descending by priority score
    prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

    const topAction = prioritized[0] || null;
    const topSum = prioritized.slice(0, 3).reduce((acc, a) => acc + a.projectedMasteryDelta, 0);
    const overallSystemVelocity = parseFloat(topSum.toFixed(2));

    const governanceVerdict = topAction
      ? `Highest structural return: "${topAction.title}" (Score: ${topAction.priorityScore.toFixed(2)}, Urgency: ${topAction.urgencyLevel}). Accelerates system toward Mastery (❂) by +${(topAction.projectedMasteryDelta * 100).toFixed(0)}%.`
      : 'No actionable candidates evaluated.';

    return {
      roadmapId: `gov-${Date.now().toString(36)}`,
      timestamp: Date.now(),
      totalCandidatesEvaluated: candidates.length,
      topPriorityAction: topAction,
      rankedActions: prioritized,
      overallSystemVelocity,
      governanceVerdict
    };
  }
}
