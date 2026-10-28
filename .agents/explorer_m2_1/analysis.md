# Analysis: Milestone 2 — Autonomous AI Swarm Region-Aware Playtesting Protocol (Requirement R2)

## Executive Summary
This document provides the architectural investigation, detailed design, evidence chain, and test specification for **Milestone 2: Autonomous AI Swarm Region-Aware Playtesting Protocol (R2)** in `teamwork_projects/symbiorithmic_deep_dive`.

Milestone 2 connects the 3D WebGL spatial coordinate system `[X, Y, Z]` and `SpatialVectorStoreManager` (built in Milestone 1) with an autonomous multi-agent playtest swarm comprising:
1. **Dungeon Master (DM)**: Synthesizes regional spatial lore vectors into immersive narrative scene descriptions, environmental hazards, and tactical opportunities.
2. **Rules Lawyer**: Audits proposed agent actions against D&D 5e mechanics (consciousness check, action economy, spellcasting MP costs, status effect constraints, and target validity).
3. **Party Swarm (Hero, Mage, Cleric)**: Autonomous hero agents making proactive tactical and narrative decisions driven by current 3D coordinates, regional vector tags, and JRPG party state (HP/MP).
4. **Swarm Harness**: Multi-agent orchestration loop executing turn sequences, managing spatial context queries, passing actions through Rules Lawyer verification, applying state mutations (HP/MP damage/healing), and collecting metrics.

---

## 1. System Architecture & Evidence Chain

### 1.1 Data Flow Diagram
```
  [ 3D WebGL Canvas Coords [X, Y, Z] ]
                    │
                    ▼
   ┌───────────────────────────────────┐
   │    SpatialVectorStoreManager      │  <-- 3-Stage SQL + Euclidean + Cosine Query
   └─────────────────┬─────────────────┘
                     │ Returns: SpatialMemoryNode[] (Lore, Tags, Anchor Coords)
                     ▼
   ┌───────────────────────────────────┐
   │        SwarmHarness Engine        │
   └────────┬─────────────────┬────────┘
            │                 │
    (Injects Context)  (Generates Action)
            │                 │
            ▼                 ▼
   ┌────────────────┐ ┌────────────────┐
   │ DM System      │ │ Party Swarm    │ (Hero / Fighter: Melee, Spatial Terrain)
   │ Prompt Builder │ │ (Hero/Mage/    │ (Mage / Wizard: AoE Spells, Ley Lines)
   │ (DMPrompt.ts)  │ │  Cleric)       │ (Cleric / Healer: Divine Healing/Smite)
   └────────────────┘ └───────┬────────┘
                              │
                    Action: PlaytestTurnAction
                              │
                              ▼
                   ┌────────────────────┐
                   │ Rules Lawyer Agent │  <-- Audits D&D 5e Legality
                   │ (RulesLawyer.ts)   │      (HP > 0, MP cost, Status, Target)
                   └──────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
             [ LEGAL ]             [ ILLEGAL ]
                │                       │
                ▼                       ▼
     Apply JRPG State Delta    Reject Action & Log
     (HP/MP Mutation)          Violation Reason
                │                       │
                └─────────┬─────────────┘
                          │
                          ▼
             Record Turn in History &
             Update Session Metrics
```

---

## 2. Component Design Specifications

### 2.1 Types Module (`src/playtest/types.ts`)
Defines the core data contracts for the playtest framework:

- `PartyMemberRole`: `'Hero' | 'Mage' | 'Cleric'`
- `PartyMemberState`: Represents character attributes (`id`, `name`, `role`, `hp`, `maxHp`, `mp`, `maxMp`, `level`, `position`, `statusEffects`, `abilities`, `inventory`, `classLore`).
- `PlaytestActionType`: `'ATTACK' | 'CAST_SPELL' | 'HEAL' | 'DEFEND' | 'INVESTIGATE_LORE' | 'MOVE' | 'USE_ITEM'`
- `StateDelta`: HP/MP changes, status effect additions/removals (`targetHpChange`, `actorMpChange`, `actorHpChange`, `newStatusEffect`, `removedStatusEffect`).
- `PlaytestTurnAction`: Complete record of a turn decision (`turnNumber`, `actorId`, `actorName`, `actorRole`, `actionType`, `target`, `spellName`, `damage`, `healing`, `narrativeReasoning`, `isLegal`, `rulesViolationReason`, `spatialContextUsed`, `stateDelta`).
- `SwarmContextParams`: Payload containing `position`, `radius`, `activeRegionId`, `memories`, `partyState`, `turnHistory`, and `currentTurn`.
- `DMPromptOptions`: Configuration for DM framing (`difficulty`, `narrativeStyle`, `atmospherePreset`, `maxMemoriesInContext`).
- `SwarmHarnessConfig`: Config for initializing `SwarmHarness` (`vectorStore`, `dbPath`, `defaultPosition`, `defaultRadius`, `dmOptions`, `party`, `maxTurns`).
- `RulesLawyerResult`: Verification output (`isLegal`, `violationReason`, `correctedAction`).
- `PlaytestSessionMetrics`: Summary statistics (`totalTurns`, `legalActionsCount`, `illegalActionsCount`, `spatialMemoryHits`, `totalDamageDealt`, `totalHealingApplied`).

### 2.2 DM System Prompt Builder (`src/playtest/DMPrompt.ts`)
Maps spatial vector memories retrieved from `SpatialVectorStoreManager` into rich markdown DM prompts:

- `buildDMRolePrompt(options)`: Establishes DM persona with narrative style (`B-Movie Horror`, `Epic Fantasy`, `Gothic Dark`) and difficulty level (`HARD`, `NORMAL`).
- `buildDMSpatialContextPrompt(params, options)`: Iterates through active `SpatialMemoryNode[]` anchored to current 3D position `[X, Y, Z]`. Formats anchor coordinates, influence radius, region ID, tags (`#boss_encounter`, `#ancient_battlefield`), and memory text block into markdown.
- `formatDMTurnPrompt(params, options)`: Combines DM persona framing, spatial context markdown, active party status (HP/MP of Fighter, Wizard, Cleric), and recent turn history into the complete DM turn prompt.
- `parseDMSceneNarration(rawOutput)`: Parses DM narrative output, extracting referenced spatial tags and environmental hazard alerts.

### 2.3 Rules Lawyer Verification Protocol (`src/playtest/RulesLawyerPrompt.ts`)
Audits action legality under D&D 5e rules:

- **System Prompt**: Enforces consciousness, action economy, spell slot/MP costs, incapacitating status effects, and target validity.
- **Verification Logic (`verifyActionLegality`)**:
  1. *Consciousness Check*: Fails if actor `hp <= 0` (unconscious or dead).
  2. *Status Check*: Fails if actor has incapacitating status (`Stunned`, `Frozen`, `Paralyzed`, `Petrified`).
  3. *MP / Spell Check*: Fails if `CAST_SPELL` or `HEAL` exceeds actor's current MP (e.g. Fireball = 15 MP, Cure Wounds = 10 MP).
  4. *Target Check*: Fails if attacking a target already at `hp <= 0`.
  5. Returns `{ isLegal: boolean, violationReason?: string }`.

### 2.4 Party Member Agents (`src/playtest/PartyMemberPrompt.ts`)
Provides custom prompt protocols and autonomous decision generators for 3 core archetypes:

1. **Hero (Fighter)**: Frontline melee specialist. Uses physical attacks (Slash, Power Strike, Shield Bash). Incorporates spatial terrain tags (`ancient_battlefield`, `boss_encounter`) into damage bonuses and narrative reasoning.
2. **Mage (Wizard)**: Ranged arcane specialist. Uses elemental AoE spells (Fireball, Frostbolt, Arcane Shield). Injects regional ley line anomalies (`arcane_anomaly`, `underdark_cavern`) into spell power.
3. **Cleric**: Divine support specialist. Evaluates party emergency meter: if an ally is below 60% HP, prioritizes divine healing (`Cure Wounds`). Otherwise casts `Holy Smite` or raises divine wards.

### 2.5 Swarm Execution Harness (`src/playtest/SwarmHarness.ts`)
Orchestrates the multi-agent playtest cycle:

- `setPosition(pos)`: Updates 3D party coordinates.
- `buildSwarmContext()`: Queries `SpatialVectorStoreManager` at current position + radius.
- `executeTurn(actorRole, overrideAction)`: Generates action for active hero role, verifies via Rules Lawyer, applies HP/MP state deltas if legal, logs turn, and updates metrics.
- `runPlaytestCycle(cyclesCount)`: Iterates turns across Hero -> Mage -> Cleric sequentially.
- `getMetrics()`: Returns aggregated session metrics (`totalTurns`, `legalActionsCount`, `illegalActionsCount`, `spatialMemoryHits`, `totalDamageDealt`, `totalHealingApplied`).

---

## 3. Test Suite Design (`tests/test-m2-playtest.mjs`)

The test suite covers 5 key validation tiers:

| Test Case | Description | Assertion Criteria |
|-----------|-------------|-------------------|
| **Test 1: DM Prompt Spatial Context Injection** | Seeds spatial lore at Waterdeep `[-150, 0, 80]` and queries DM context builder. | Verifies presence of node titles, tags (`boss_encounter`), 3D coords, and narrative style. |
| **Test 2: Party Action Generation** | Generates turn actions for Hero, Mage, and Cleric at active position. | Verifies `actorRole`, valid `actionType`, spell names, and populated `spatialContextUsed`. |
| **Test 3: Rules Lawyer Verification** | Tests legal action vs dead actor vs OOM spellcast. | Verifies `isLegal: true` for valid action; `isLegal: false` with clear violation reasons for invalid actions. |
| **Test 4: JRPG Party State Updates** | Executes Cure Wounds heal on injured Hero (30 HP) and Fireball spellcast. | Verifies Hero HP increases from 30 to 60 (+30 HP) and Cleric MP decreases by 10. |
| **Test 5: Multi-Turn Swarm Execution Loop** | Runs `SwarmHarness.runPlaytestCycle(2)` (6 full turns). | Verifies 6 turns logged, 100% legal action compliance, and positive spatial memory hit metrics. |

---

## 4. Implementation Location & Proposed Files

Draft implementations have been written to `.agents/explorer_m2_1/proposed/`:
- `proposed/src/playtest/types.ts`
- `proposed/src/playtest/DMPrompt.ts`
- `proposed/src/playtest/RulesLawyerPrompt.ts`
- `proposed/src/playtest/PartyMemberPrompt.ts`
- `proposed/src/playtest/SwarmHarness.ts`
- `proposed/tests/test-m2-playtest.mjs`

Implementer agent can transfer these files to `teamwork_projects/symbiorithmic_deep_dive/src/playtest/` and `tests/test-m2-playtest.mjs` and execute `npx tsc` followed by `node tests/test-m2-playtest.mjs`.
