/**
 * ontologicalValidator.ts
 * 
 * Uses the Modular Semantic Multiplication Axiom (Base 10)
 * to evaluate the truth of ontological assertions.
 */

export const PILLAR_MAP: Record<string, number> = {
    self: 1, thought: 2, logic: 3, unity: 4, existence: 5,
    improvement: 6, mastery: 7, resonance: 8, transcendence: 9, omni: 10
};

/**
 * Returns the numerical value of a relationship string based on Row 1 (Self)
 */
export const RELATIONSHIP_VALUES: Record<string, number> = {
    'identity': 1, 'subject of': 2, 'applies': 3, 'seeks': 4, 'affirms': 5,
    'undergoes': 6, 'pursues': 7, 'experiences': 8, 'aspires to': 9, 'is realized by': 10
};

/**
 * Evaluates the truth of: "The [Relationship] of [Pillar A] is [Pillar B/Value]"
 * Axiom: (PillarA * RelationshipValue) % 10 == ResultPillar
 */
export function evaluateOntologicalTruth(pillarA: string, relationship: string, target: string): boolean {
    const valA = PILLAR_MAP[pillarA.toLowerCase()];
    const valR = RELATIONSHIP_VALUES[relationship.toLowerCase()];
    const valT = PILLAR_MAP[target.toLowerCase()];

    if (!valA || !valR || !valT) return false;

    const product = (valA * valR) % 10;
    const finalProduct = product === 0 ? 10 : product;

    return finalProduct === valT;
}

/**
 * Compounded Truth of the System
 * Sum of 1-10 digital root = 10 (Omni)
 */
export const COMPOUNDED_TRUTH = "OMNI";
