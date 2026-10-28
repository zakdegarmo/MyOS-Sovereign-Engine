import { SpatialMemoryNode } from '../spatial/types.js';
import { SpatialVectorStoreManager } from '../spatial/SpatialVectorStoreManager.js';
import { DMPromptBuilder } from './DMPrompt.ts';
import { RulesLawyerPromptBuilder } from './RulesLawyerPrompt.ts';
import { PartyMemberPromptBuilder } from './PartyMemberPrompt.ts';
import {
  PartyMemberState,
  PlaytestSessionMetrics,
  PlaytestTurnAction,
  SwarmContextParams,
  SwarmHarnessConfig,
} from './types.ts';

export class SwarmHarness {
  private vectorStore: SpatialVectorStoreManager;
  private dbPath: string;
  private currentPosition: [number, number, number];
  private currentRadius: number;
  private partyState: PartyMemberState[];
  private turnHistory: PlaytestTurnAction[];
  private currentTurn: number;
  private metrics: PlaytestSessionMetrics;
  private config: SwarmHarnessConfig;

  constructor(config: SwarmHarnessConfig = {}) {
    this.config = config;
    this.dbPath = config.dbPath || ':memory:';
    this.vectorStore = config.vectorStore || new SpatialVectorStoreManager(this.dbPath);
    this.currentPosition = config.defaultPosition || [0, 0, 0];
    this.currentRadius = config.defaultRadius || 50;
    this.partyState = config.party || this.getDefaultParty();
    this.turnHistory = [];
    this.currentTurn = 1;
    this.metrics = {
      totalTurns: 0,
      legalActionsCount: 0,
      illegalActionsCount: 0,
      spatialMemoryHits: 0,
      totalDamageDealt: 0,
      totalHealingApplied: 0,
    };
  }

  public getDefaultParty(): PartyMemberState[] {
    return [
      {
        id: 'hero_1',
        name: 'Valerius the Brave',
        role: 'Hero',
        hp: 100,
        maxHp: 100,
        mp: 20,
        maxMp: 20,
        level: 5,
        position: [0, 0, 0],
        statusEffects: [],
        abilities: ['Slash', 'Power Strike', 'Shield Bash', 'Taunt'],
        inventory: ['Longsword', 'Plate Mail', 'Health Potion'],
        classLore: 'Frontline vanguard skilled in physical warfare.',
      },
      {
        id: 'mage_1',
        name: 'Eldrin Sparkweaver',
        role: 'Mage',
        hp: 60,
        maxHp: 60,
        mp: 80,
        maxMp: 80,
        level: 5,
        position: [0, 0, 0],
        statusEffects: [],
        abilities: ['Fireball', 'Frostbolt', 'Arcane Shield', 'Teleport'],
        inventory: ['Arcane Staff', 'Spellbook', 'Mana Potion'],
        classLore: 'Master of elemental chaos and spatial arcane vectors.',
      },
      {
        id: 'cleric_1',
        name: 'Sister Lyra',
        role: 'Cleric',
        hp: 80,
        maxHp: 80,
        mp: 60,
        maxMp: 60,
        level: 5,
        position: [0, 0, 0],
        statusEffects: [],
        abilities: ['Cure Wounds', 'Holy Smite', 'Blessing', 'Turn Undead'],
        inventory: ['Warhammer', 'Sacred Symbol', 'Holy Water'],
        classLore: 'Devout healer anchoring divine grace to sanctified ground.',
      },
    ];
  }

  public async initialize(): Promise<void> {
    await this.vectorStore.initDatabase(this.dbPath);
  }

  public setPosition(position: [number, number, number]): void {
    this.currentPosition = position;
    this.partyState.forEach((p) => (p.position = position));
  }

  public setRadius(radius: number): void {
    this.currentRadius = radius;
  }

  public getPartyState(): PartyMemberState[] {
    return this.partyState;
  }

  public getTurnHistory(): PlaytestTurnAction[] {
    return this.turnHistory;
  }

  public getMetrics(): PlaytestSessionMetrics {
    return this.metrics;
  }

  /**
   * Queries vector store for spatial memories anchored to active 3D position & radius.
   */
  public async queryRegionalContext(queryText?: string): Promise<SpatialMemoryNode[]> {
    return await this.vectorStore.querySpatialMemories({
      position: this.currentPosition,
      radius: this.currentRadius,
      limit: 10,
      queryText,
    });
  }

  /**
   * Builds the current SwarmContextParams object for context injection.
   */
  public async buildSwarmContext(queryText?: string): Promise<SwarmContextParams> {
    const memories = await this.queryRegionalContext(queryText);
    this.metrics.spatialMemoryHits += memories.length;

    const regionId = memories[0]?.region_id || 'unknown_region';

    return {
      position: this.currentPosition,
      radius: this.currentRadius,
      activeRegionId: regionId,
      memories,
      partyState: this.partyState,
      turnHistory: this.turnHistory,
      currentTurn: this.currentTurn,
    };
  }

  /**
   * Formats the active DM context prompt string for inspection/verification.
   */
  public async getFormattedDMContext(): Promise<string> {
    const context = await this.buildSwarmContext();
    return DMPromptBuilder.formatDMTurnPrompt(context, this.config.dmOptions);
  }

  /**
   * Executes a single turn action for a given actor (Hero, Mage, Cleric) or custom action.
   */
  public async executeTurn(
    actorRole: 'Hero' | 'Mage' | 'Cleric',
    overrideAction?: Partial<PlaytestTurnAction>
  ): Promise<PlaytestTurnAction> {
    const actor = this.partyState.find((p) => p.role === actorRole);
    if (!actor) {
      throw new Error(`Actor with role '${actorRole}' not found in party.`);
    }

    const context = await this.buildSwarmContext();

    // 1. Generate action via PartyMemberPromptBuilder or apply override
    let action: PlaytestTurnAction;
    if (overrideAction && overrideAction.actionType) {
      action = {
        turnNumber: this.currentTurn,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        actionType: overrideAction.actionType,
        target: overrideAction.target || 'Target',
        spellName: overrideAction.spellName,
        damage: overrideAction.damage,
        healing: overrideAction.healing,
        narrativeReasoning: overrideAction.narrativeReasoning || 'Forced test action execution.',
        isLegal: true,
        spatialContextUsed: context.memories.flatMap((m) => m.tags || []),
        stateDelta: overrideAction.stateDelta,
      };
    } else {
      action = PartyMemberPromptBuilder.generatePartyMemberTurnAction(context, actor);
    }

    // 2. Pass action through Rules Lawyer verification
    const targetActor = this.partyState.find((p) => p.name === action.target);
    const legalityResult = RulesLawyerPromptBuilder.verifyActionLegality(
      action,
      actor,
      targetActor
    );

    action.isLegal = legalityResult.isLegal;
    if (!legalityResult.isLegal) {
      action.rulesViolationReason = legalityResult.violationReason;
      this.metrics.illegalActionsCount++;
    } else {
      this.metrics.legalActionsCount++;

      // 3. Apply JRPG State Delta Updates if legal
      if (action.stateDelta) {
        if (action.stateDelta.actorMpChange) {
          actor.mp = Math.max(0, Math.min(actor.maxMp, actor.mp + action.stateDelta.actorMpChange));
        }

        if (action.stateDelta.actorHpChange) {
          actor.hp = Math.max(0, Math.min(actor.maxHp, actor.hp + action.stateDelta.actorHpChange));
        }

        if (targetActor && action.stateDelta.targetHpChange) {
          targetActor.hp = Math.max(
            0,
            Math.min(targetActor.maxHp, targetActor.hp + action.stateDelta.targetHpChange)
          );
        }

        if (action.stateDelta.newStatusEffect) {
          if (!actor.statusEffects.includes(action.stateDelta.newStatusEffect)) {
            actor.statusEffects.push(action.stateDelta.newStatusEffect);
          }
        }
      }

      if (action.damage) this.metrics.totalDamageDealt += action.damage;
      if (action.healing) this.metrics.totalHealingApplied += action.healing;
    }

    // 4. Update session history & turn counters
    this.turnHistory.push(action);
    this.metrics.totalTurns++;
    this.currentTurn++;

    return action;
  }

  /**
   * Executes a full multi-turn cycle across all party members (Hero -> Mage -> Cleric).
   */
  public async runPlaytestCycle(cyclesCount: number = 1): Promise<PlaytestTurnAction[]> {
    const executedActions: PlaytestTurnAction[] = [];
    const roles: ('Hero' | 'Mage' | 'Cleric')[] = ['Hero', 'Mage', 'Cleric'];

    for (let c = 0; c < cyclesCount; c++) {
      for (const role of roles) {
        const action = await this.executeTurn(role);
        executedActions.push(action);
      }
    }

    return executedActions;
  }
}
