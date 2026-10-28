import { SpatialMemoryNode } from '../spatial/types.js';

export type PartyMemberRole = 'Hero' | 'Mage' | 'Cleric';

export interface PartyMemberState {
  id: string;
  name: string;
  role: PartyMemberRole;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  position: [number, number, number];
  statusEffects: string[];
  abilities: string[];
  inventory: string[];
  classLore?: string;
}

export type PlaytestActionType =
  | 'ATTACK'
  | 'CAST_SPELL'
  | 'HEAL'
  | 'DEFEND'
  | 'INVESTIGATE_LORE'
  | 'MOVE'
  | 'USE_ITEM';

export interface StateDelta {
  targetHpChange?: number;
  actorMpChange?: number;
  actorHpChange?: number;
  newStatusEffect?: string;
  removedStatusEffect?: string;
}

export interface PlaytestTurnAction {
  turnNumber: number;
  actorId: string;
  actorName: string;
  actorRole: PartyMemberRole | 'DM' | 'RulesLawyer';
  actionType: PlaytestActionType;
  target: string;
  spellName?: string;
  damage?: number;
  healing?: number;
  narrativeReasoning: string;
  isLegal: boolean;
  rulesViolationReason?: string;
  spatialContextUsed?: string[];
  stateDelta?: StateDelta;
}

export interface SwarmContextParams {
  position: [number, number, number];
  radius: number;
  activeRegionId: string;
  memories: SpatialMemoryNode[];
  partyState: PartyMemberState[];
  turnHistory: PlaytestTurnAction[];
  currentTurn: number;
}

export interface DMPromptOptions {
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'NIGHTMARE';
  narrativeStyle: 'B-Movie Horror' | 'Epic Fantasy' | 'Gothic Dark';
  atmospherePreset?: string;
  maxMemoriesInContext?: number;
}

export interface SwarmHarnessConfig {
  vectorStore?: any;
  dbPath?: string;
  defaultPosition?: [number, number, number];
  defaultRadius?: number;
  dmOptions?: DMPromptOptions;
  party?: PartyMemberState[];
  maxTurns?: number;
  llamaOfflineMode?: boolean;
}

export interface RulesLawyerResult {
  isLegal: boolean;
  violationReason?: string;
  correctedAction?: PlaytestTurnAction;
}

export interface PlaytestSessionMetrics {
  totalTurns: number;
  legalActionsCount: number;
  illegalActionsCount: number;
  spatialMemoryHits: number;
  totalDamageDealt: number;
  totalHealingApplied: number;
}
