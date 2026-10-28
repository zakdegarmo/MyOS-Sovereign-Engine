import assert from 'node:assert';
import { SpatialVectorStoreManager } from '../dist/src/spatial/SpatialVectorStoreManager.js';
import { DMPromptBuilder } from '../dist/src/playtest/DMPrompt.js';
import { RulesLawyerPromptBuilder } from '../dist/src/playtest/RulesLawyerPrompt.js';
import { PartyMemberPromptBuilder } from '../dist/src/playtest/PartyMemberPrompt.js';
import { SwarmHarness } from '../dist/src/playtest/SwarmHarness.js';

console.log('====================================================');
console.log('   M2 SWARM PLAYTEST HARNESS TEST SUITE RESULTS     ');
console.log('====================================================\n');

const testResults = {
  passed: 0,
  failed: 0,
  details: [],
};

function recordTest(name, success, message) {
  if (success) {
    testResults.passed++;
    console.log(`[PASS] ${name}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`[FAIL] ${name}: ${message}`);
  }
  testResults.details.push({ name, success, message });
}

async function runM2Tests() {
  // Setup in-memory vector store and seed test nodes
  const vectorStore = new SpatialVectorStoreManager(':memory:');
  await vectorStore.initDatabase();

  await vectorStore.insertSpatialMemory({
    id: 'node_waterdeep_boss',
    x: -150,
    y: 0,
    z: 80,
    radius_influence: 50,
    region_id: 'waterdeep_ruins',
    type: 'boss_arena',
    title: 'Waterdeep Shadow Portal Arena',
    text: 'A desolate stone platform where an ancient Shadow Fiend was defeated. Residual spatial void magic lingers.',
    tags: ['boss_encounter', 'waterdeep', 'shadow_portal', 'ancient_battlefield'],
    embedding: new Float32Array(1024).fill(0.1),
  });

  await vectorStore.insertSpatialMemory({
    id: 'node_ancient_crypt',
    x: 100,
    y: 50,
    z: -200,
    radius_influence: 40,
    region_id: 'crypt_of_the_damned',
    type: 'holy_site',
    title: 'Sanctified Altar of Sol Invictus',
    text: 'Consecrated altar radiating sacred solar energy, boosting divine cleric prayers and repelling shadow beasts.',
    tags: ['sacred_site', 'holy_altar', 'undead_threat'],
    embedding: new Float32Array(1024).fill(0.2),
  });

  // ----------------------------------------------------
  // TEST 1: Spatial Context Injection into DM Prompts
  // ----------------------------------------------------
  try {
    const harness = new SwarmHarness({
      vectorStore,
      defaultPosition: [-150, 0, 80],
      defaultRadius: 30,
      dmOptions: {
        narrativeStyle: 'B-Movie Horror',
        difficulty: 'HARD',
      },
    });

    const dmPromptText = await harness.getFormattedDMContext();
    assert.ok(dmPromptText.includes('Waterdeep Shadow Portal Arena'), 'DM prompt must contain node title');
    assert.ok(dmPromptText.includes('boss_encounter'), 'DM prompt must contain spatial tags');
    assert.ok(dmPromptText.includes('[-150, 0, 80]'), 'DM prompt must contain target coordinates');
    assert.ok(dmPromptText.includes('B-MOVIE HORROR MODE'), 'DM prompt must incorporate style framing');

    recordTest(
      'DM Prompt Spatial Context Injection',
      true,
      'DM Prompt correctly injected spatial lore nodes, 3D coordinates, and B-Movie style framing.'
    );
  } catch (err) {
    recordTest('DM Prompt Spatial Context Injection', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Party Action Generation (Hero, Mage, Cleric)
  // ----------------------------------------------------
  try {
    const harness = new SwarmHarness({
      vectorStore,
      defaultPosition: [-150, 0, 80],
      defaultRadius: 30,
    });

    const context = await harness.buildSwarmContext();
    const heroActor = harness.getPartyState().find((p) => p.role === 'Hero');
    const mageActor = harness.getPartyState().find((p) => p.role === 'Mage');
    const clericActor = harness.getPartyState().find((p) => p.role === 'Cleric');

    const heroAction = PartyMemberPromptBuilder.generatePartyMemberTurnAction(context, heroActor);
    const mageAction = PartyMemberPromptBuilder.generatePartyMemberTurnAction(context, mageActor);
    const clericAction = PartyMemberPromptBuilder.generatePartyMemberTurnAction(context, clericActor);

    assert.strictEqual(heroAction.actorRole, 'Hero');
    assert.strictEqual(heroAction.actionType, 'ATTACK');
    assert.ok(heroAction.spatialContextUsed.includes('boss_encounter'), 'Hero action referenced spatial context tag');

    assert.strictEqual(mageAction.actorRole, 'Mage');
    assert.strictEqual(mageAction.actionType, 'CAST_SPELL');
    assert.strictEqual(mageAction.spellName, 'Fireball');

    assert.strictEqual(clericAction.actorRole, 'Cleric');
    assert.ok(['CAST_SPELL', 'HEAL'].includes(clericAction.actionType), 'Cleric generated valid action type');

    recordTest(
      'Party Action Generation',
      true,
      'Hero, Mage, and Cleric agents successfully generated role-specific actions with spatial context.'
    );
  } catch (err) {
    recordTest('Party Action Generation', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 3: Rules Lawyer Legality Verification & Constraints
  // ----------------------------------------------------
  try {
    const heroActor = {
      id: 'h1',
      name: 'Valerius',
      role: 'Hero',
      hp: 100,
      maxHp: 100,
      mp: 10,
      maxMp: 10,
      level: 5,
      position: [0, 0, 0],
      statusEffects: [],
      abilities: ['Slash'],
      inventory: [],
    };

    const deadMageActor = {
      id: 'm1',
      name: 'Eldrin',
      role: 'Mage',
      hp: 0,
      maxHp: 60,
      mp: 80,
      maxMp: 80,
      level: 5,
      position: [0, 0, 0],
      statusEffects: [],
      abilities: ['Fireball'],
      inventory: [],
    };

    const lowMpMageActor = {
      id: 'm2',
      name: 'Eldrin',
      role: 'Mage',
      hp: 60,
      maxHp: 60,
      mp: 5,
      maxMp: 80,
      level: 5,
      position: [0, 0, 0],
      statusEffects: [],
      abilities: ['Fireball'],
      inventory: [],
    };

    // Subtest 3a: Legal Action
    const legalAction = {
      turnNumber: 1,
      actorId: heroActor.id,
      actorName: heroActor.name,
      actorRole: 'Hero',
      actionType: 'ATTACK',
      target: 'Shadow Fiend',
      damage: 25,
      narrativeReasoning: 'Standard melee attack.',
      isLegal: true,
    };
    const resLegal = RulesLawyerPromptBuilder.verifyActionLegality(legalAction, heroActor);
    assert.strictEqual(resLegal.isLegal, true, 'Legal action must pass verification');

    // Subtest 3b: Action by Dead Actor
    const deadAction = {
      turnNumber: 1,
      actorId: deadMageActor.id,
      actorName: deadMageActor.name,
      actorRole: 'Mage',
      actionType: 'CAST_SPELL',
      target: 'Shadow Fiend',
      spellName: 'Fireball',
      narrativeReasoning: 'Attempting spell while dead.',
      isLegal: true,
    };
    const resDead = RulesLawyerPromptBuilder.verifyActionLegality(deadAction, deadMageActor);
    assert.strictEqual(resDead.isLegal, false, 'Dead actor action must be rejected');
    assert.ok(resDead.violationReason.includes('unconscious or dead'), 'Violation reason must explain death state');

    // Subtest 3c: Insufficient MP
    const oomAction = {
      turnNumber: 1,
      actorId: lowMpMageActor.id,
      actorName: lowMpMageActor.name,
      actorRole: 'Mage',
      actionType: 'CAST_SPELL',
      target: 'Shadow Fiend',
      spellName: 'Fireball',
      narrativeReasoning: 'Casting fireball with only 5 MP.',
      isLegal: true,
    };
    const resOom = RulesLawyerPromptBuilder.verifyActionLegality(oomAction, lowMpMageActor);
    assert.strictEqual(resOom.isLegal, false, 'OOM spell must be rejected');
    assert.ok(resOom.violationReason.includes('Insufficient MP'), 'Violation reason must explain MP deficiency');

    recordTest(
      'Rules Lawyer Legality Verification',
      true,
      'Rules Lawyer correctly validated legal action and rejected dead actor / OOM actions.'
    );
  } catch (err) {
    recordTest('Rules Lawyer Legality Verification', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 4: JRPG Party State Updates
  // ----------------------------------------------------
  try {
    const harness = new SwarmHarness({
      vectorStore,
      defaultPosition: [-150, 0, 80],
    });

    const party = harness.getPartyState();
    const hero = party.find((p) => p.role === 'Hero');
    const cleric = party.find((p) => p.role === 'Cleric');

    // Damage Hero to 30 HP
    hero.hp = 30;

    // Cleric heals Hero with Cure Wounds (restores 30 HP, costs 10 MP)
    const healAction = await harness.executeTurn('Cleric', {
      actionType: 'HEAL',
      target: hero.name,
      spellName: 'Cure Wounds',
      healing: 30,
      stateDelta: {
        targetHpChange: 30,
        actorMpChange: -10,
      },
    });

    assert.strictEqual(healAction.isLegal, true, 'Heal action should be legal');
    assert.strictEqual(hero.hp, 60, 'Hero HP restored from 30 to 60');
    assert.strictEqual(cleric.mp, 50, 'Cleric MP deducted from 60 to 50');

    recordTest(
      'JRPG Party State Updates',
      true,
      'State delta correctly restored Hero HP (+30) and deducted Cleric MP (-10).'
    );
  } catch (err) {
    recordTest('JRPG Party State Updates', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Multi-Turn Swarm Execution Loop
  // ----------------------------------------------------
  try {
    const harness = new SwarmHarness({
      vectorStore,
      defaultPosition: [-150, 0, 80],
      defaultRadius: 50,
    });

    await harness.initialize();
    const actions = await harness.runPlaytestCycle(2); // 2 cycles = 6 turns

    assert.strictEqual(actions.length, 6, 'Must execute 6 turns');
    const metrics = harness.getMetrics();
    assert.strictEqual(metrics.totalTurns, 6, 'Metrics total turns must be 6');
    assert.strictEqual(metrics.legalActionsCount, 6, 'All 6 actions must be legal');
    assert.ok(metrics.spatialMemoryHits > 0, 'Spatial memory hits recorded');
    assert.ok(metrics.totalDamageDealt > 0, 'Total damage tracked');

    recordTest(
      'Multi-Turn Swarm Execution Loop',
      true,
      `Executed 6-turn playtest cycle seamlessly (Damage: ${metrics.totalDamageDealt}, Memory Hits: ${metrics.spatialMemoryHits}).`
    );
  } catch (err) {
    recordTest('Multi-Turn Swarm Execution Loop', false, err.message);
  }

  console.log('\n----------------------------------------------------');
  console.log(`SUMMARY: ${testResults.passed} Passed, ${testResults.failed} Failed`);
  console.log('----------------------------------------------------');
}

runM2Tests().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
