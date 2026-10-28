import { PartyMemberState, PlaytestTurnAction, RulesLawyerResult } from './types.js';

export class RulesLawyerPromptBuilder {
  /**
   * Builds system prompt for Rules Lawyer agent.
   */
  static buildRulesLawyerSystemPrompt(): string {
    return [
      `# RULES LAWYER SYSTEM PROMPT (D&D 5E LEGALITY AUDITOR)`,
      `You are the Rules Lawyer agent in an autonomous AI Swarm playtest framework.`,
      `Your sole duty is to strictly audit turn actions taken by Hero, Mage, and Cleric agents for D&D 5e action legality and resource constraints.`,
      ``,
      `## AUDIT RULES:`,
      `1. CONSCIOUSNESS CHECK: Actor HP must be > 0. Unconscious or dead actors cannot take actions.`,
      `2. ACTION ECONOMY: 1 main action per turn.`,
      `3. MANA / SPELL SLOT CHECK:`,
      `   - CAST_SPELL requires sufficient MP (e.g., Fireball: 15 MP, Frostbolt: 10 MP, Arcane Shield: 8 MP).`,
      `   - HEAL requires sufficient MP (e.g., Cure Wounds: 10 MP, Blessing: 8 MP).`,
      `4. STATUS EFFECTS: Actors under 'Stunned', 'Frozen', or 'Paralyzed' cannot act.`,
      `5. TARGET VALIDITY: Melee attacks require valid target; spell targets must be alive or valid.`,
    ].join('\n');
  }

  /**
   * Builds prompt for LLM evaluation of an action.
   */
  static buildActionVerificationPrompt(
    action: PlaytestTurnAction,
    actor: PartyMemberState,
    target?: PartyMemberState
  ): string {
    return [
      this.buildRulesLawyerSystemPrompt(),
      ``,
      `## ACTION TO AUDIT:`,
      `- Actor: ${actor.name} (${actor.role}) [HP: ${actor.hp}/${actor.maxHp}, MP: ${actor.mp}/${actor.maxMp}]`,
      `- Status Effects: [${actor.statusEffects.join(', ') || 'None'}]`,
      `- Declared Action Type: ${action.actionType}`,
      `- Target: ${action.target}${target ? ` [Target HP: ${target.hp}/${target.maxHp}]` : ''}`,
      `- Spell Name: ${action.spellName || 'N/A'}`,
      `- Declared Damage/Healing: ${action.damage ? `${action.damage} DMG` : action.healing ? `${action.healing} HEAL` : 'N/A'}`,
      `- Narrative Reasoning: ${action.narrativeReasoning}`,
      ``,
      `Evaluate legality under D&D 5e rules and return strictly valid JSON: { "isLegal": boolean, "violationReason": string | null }`,
    ].join('\n');
  }

  /**
   * Deterministic D&D 5e rule validation engine for fast, offline, and reliable test verification.
   */
  static verifyActionLegality(
    action: PlaytestTurnAction,
    actor: PartyMemberState,
    target?: PartyMemberState
  ): RulesLawyerResult {
    // 1. Consciousness Check
    if (actor.hp <= 0) {
      return {
        isLegal: false,
        violationReason: `Actor '${actor.name}' is unconscious or dead (HP: ${actor.hp}/${actor.maxHp}) and cannot perform '${action.actionType}'.`,
      };
    }

    // 2. Status Effect Check
    const incapacitatingStatuses = ['Stunned', 'Frozen', 'Paralyzed', 'Petrified'];
    const activeIncapacitating = actor.statusEffects.find((s) =>
      incapacitatingStatuses.includes(s)
    );
    if (activeIncapacitating) {
      return {
        isLegal: false,
        violationReason: `Actor '${actor.name}' is incapacitated by status effect '${activeIncapacitating}' and cannot act.`,
      };
    }

    // 3. Action Type & Resource Check
    if (action.actionType === 'CAST_SPELL') {
      const spell = (action.spellName || '').toLowerCase();
      let requiredMp = 10; // default spell cost

      if (spell.includes('fireball')) requiredMp = 15;
      else if (spell.includes('frostbolt')) requiredMp = 10;
      else if (spell.includes('shield')) requiredMp = 8;
      else if (spell.includes('meteor') || spell.includes('ult')) requiredMp = 25;

      if (actor.mp < requiredMp) {
        return {
          isLegal: false,
          violationReason: `Insufficient MP to cast '${action.spellName || 'spell'}'. Required: ${requiredMp} MP, Available: ${actor.mp} MP.`,
        };
      }
    }

    if (action.actionType === 'HEAL') {
      const spell = (action.spellName || '').toLowerCase();
      let requiredMp = 10;

      if (spell.includes('cure') || spell.includes('heal')) requiredMp = 10;
      else if (spell.includes('blessing')) requiredMp = 8;
      else if (spell.includes('revive') || spell.includes('resurrect')) requiredMp = 30;

      if (actor.mp < requiredMp) {
        return {
          isLegal: false,
          violationReason: `Insufficient MP for divine healing '${action.spellName || 'Heal'}'. Required: ${requiredMp} MP, Available: ${actor.mp} MP.`,
        };
      }
    }

    // 4. Target Status Check (if target provided)
    if (target && action.actionType === 'ATTACK' && target.hp <= 0) {
      return {
        isLegal: false,
        violationReason: `Target '${target.name}' is already defeated (HP: ${target.hp}). Cannot attack defeated target.`,
      };
    }

    // Default: Action is legal
    return {
      isLegal: true,
    };
  }
}
