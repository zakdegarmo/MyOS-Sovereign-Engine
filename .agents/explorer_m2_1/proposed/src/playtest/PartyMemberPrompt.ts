import {
  PartyMemberRole,
  PartyMemberState,
  PlaytestActionType,
  PlaytestTurnAction,
  SwarmContextParams,
} from './types.js';

export class PartyMemberPromptBuilder {
  /**
   * Builds Hero (Fighter) persona system prompt.
   */
  static buildHeroPrompt(params: SwarmContextParams, actor: PartyMemberState): string {
    const memoryTags = (params.memories || []).flatMap((m) => m.tags || []);
    const uniqueTags = Array.from(new Set(memoryTags)).join(', ');

    return [
      `# HERO (FIGHTER) AGENT PROMPT`,
      `You are ${actor.name}, a veteran Level ${actor.level} Fighter on the front lines.`,
      `Current Status: HP ${actor.hp}/${actor.maxHp} | MP ${actor.mp}/${actor.maxMp} | Coords: [${params.position.join(', ')}]`,
      `Class Abilities: ${actor.abilities.join(', ')}`,
      `Active Regional Tags: [${uniqueTags}]`,
      ``,
      `## TACTICAL OBJECTIVE:`,
      `- Engage hostiles in melee range with powerful physical strikes (Slash, Power Strike, Shield Bash).`,
      `- Utilize physical spatial cover and terrain vantage points derived from regional lore.`,
      `- Protect backline casters (Mage and Cleric).`,
    ].join('\n');
  }

  /**
   * Builds Mage (Wizard) persona system prompt.
   */
  static buildMagePrompt(params: SwarmContextParams, actor: PartyMemberState): string {
    const memories = params.memories || [];
    const loreTitles = memories.map((m) => m.title).join('; ');

    return [
      `# MAGE (WIZARD) AGENT PROMPT`,
      `You are ${actor.name}, a Level ${actor.level} Arcane Archmage.`,
      `Current Status: HP ${actor.hp}/${actor.maxHp} | MP ${actor.mp}/${actor.maxMp} | Coords: [${params.position.join(', ')}]`,
      `Spells Available: ${actor.abilities.join(', ')}`,
      `Regional Arcane Lore Injected: "${loreTitles || 'No active ley lines'}"`,
      ``,
      `## TACTICAL OBJECTIVE:`,
      `- Unleash high-impact elemental AoE spells (Fireball, Frostbolt, Arcane Shield).`,
      `- Channel ambient spatial lore and elemental anomalies into spell power.`,
      `- Maintain distance from melee threats while preserving MP.`,
    ].join('\n');
  }

  /**
   * Builds Cleric persona system prompt.
   */
  static buildClericPrompt(params: SwarmContextParams, actor: PartyMemberState): string {
    const lowestHpParty = [...(params.partyState || [])].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const lowestHpPct = lowestHpParty ? Math.round((lowestHpParty.hp / lowestHpParty.maxHp) * 100) : 100;

    return [
      `# CLERIC AGENT PROMPT`,
      `You are ${actor.name}, a Level ${actor.level} Divine Cleric of Life.`,
      `Current Status: HP ${actor.hp}/${actor.maxHp} | MP ${actor.mp}/${actor.maxMp} | Coords: [${params.position.join(', ')}]`,
      `Divine Spells: ${actor.abilities.join(', ')}`,
      `Party Emergency Meter: Lowest ally is ${lowestHpParty?.name} at ${lowestHpPct}% HP.`,
      ``,
      `## TACTICAL OBJECTIVE:`,
      `- Prioritize healing (Cure Wounds, Blessing) if any party member falls below 60% HP.`,
      `- Smite undead/shadow entities (Holy Smite) when party HP is stable.`,
      `- Anchor divine wards to consecrated spatial vector sites in the region.`,
    ].join('\n');
  }

  /**
   * Evaluates spatial context and party situation to generate an autonomous turn action.
   */
  static generatePartyMemberTurnAction(
    params: SwarmContextParams,
    actor: PartyMemberState,
    options?: { forceAction?: PlaytestActionType; targetOverride?: string }
  ): PlaytestTurnAction {
    const memories = params.memories || [];
    const usedTags: string[] = [];
    memories.forEach((m) => {
      if (Array.isArray(m.tags)) {
        m.tags.forEach((t) => {
          if (!usedTags.includes(t)) usedTags.push(t);
        });
      }
    });

    let actionType: PlaytestActionType = options?.forceAction || 'ATTACK';
    let target = options?.targetOverride || 'Hostile Entity';
    let spellName: string | undefined = undefined;
    let damage: number | undefined = undefined;
    let healing: number | undefined = undefined;
    let narrativeReasoning = '';
    let stateDelta: any = {};

    if (actor.role === 'Hero') {
      actionType = options?.forceAction || 'ATTACK';
      target = options?.targetOverride || 'Shadow Fiend';
      damage = 25;
      narrativeReasoning = `${actor.name} draws his broadsword and executes a heavy melee strike against ${target}, leveraging tactical terrain at [${params.position.join(', ')}].`;
      if (usedTags.includes('boss_encounter') || usedTags.includes('ancient_battlefield')) {
        damage += 10;
        narrativeReasoning += ` (Inspirited by ancient battlefield echoes!)`;
      }
      stateDelta = { targetHpChange: -damage };
    } else if (actor.role === 'Mage') {
      if (actor.mp >= 15) {
        actionType = options?.forceAction || 'CAST_SPELL';
        spellName = 'Fireball';
        target = options?.targetOverride || 'Cluster of Shadow Hostiles';
        damage = 35;
        narrativeReasoning = `${actor.name} channels regional arcane vectors into a radiant Fireball, detonating for ${damage} fire damage!`;
        if (usedTags.includes('arcane_anomaly') || usedTags.includes('underdark_cavern')) {
          damage += 12;
          narrativeReasoning += ` (Amplified by ley line anomaly!)`;
        }
        stateDelta = { targetHpChange: -damage, actorMpChange: -15 };
      } else {
        actionType = 'ATTACK';
        target = options?.targetOverride || 'Shadow Fiend';
        damage = 10;
        narrativeReasoning = `${actor.name} fires a basic Arcane Bolt (Low MP: ${actor.mp}).`;
        stateDelta = { targetHpChange: -damage };
      }
    } else if (actor.role === 'Cleric') {
      const injuredParty = (params.partyState || []).find((p) => p.hp < p.maxHp * 0.7 && p.hp > 0);

      if (injuredParty && actor.mp >= 10 && !options?.forceAction) {
        actionType = 'HEAL';
        spellName = 'Cure Wounds';
        target = injuredParty.name;
        healing = 30;
        narrativeReasoning = `${actor.name} notices ${target} is injured and casts Cure Wounds, restoring ${healing} HP!`;
        stateDelta = { targetHpChange: healing, actorMpChange: -10 };
      } else if (actor.mp >= 10) {
        actionType = options?.forceAction || 'CAST_SPELL';
        spellName = 'Holy Smite';
        target = options?.targetOverride || 'Undead Wraith';
        damage = 28;
        narrativeReasoning = `${actor.name} invokes divine wrath, blasting ${target} with Holy Smite for ${damage} radiant damage!`;
        stateDelta = { targetHpChange: -damage, actorMpChange: -10 };
      } else {
        actionType = 'DEFEND';
        target = actor.name;
        narrativeReasoning = `${actor.name} raises a sacred shield to defend the party.`;
        stateDelta = {};
      }
    }

    return {
      turnNumber: params.currentTurn,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actionType,
      target,
      spellName,
      damage,
      healing,
      narrativeReasoning,
      isLegal: true,
      spatialContextUsed: usedTags,
      stateDelta,
    };
  }
}
