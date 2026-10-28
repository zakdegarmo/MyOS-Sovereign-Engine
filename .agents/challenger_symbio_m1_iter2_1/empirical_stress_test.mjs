/**
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS: Milestone 1 Iteration 2
 * Subsystem: Spatial Memory Anchoring Subsystem (src/spatial/)
 * Target: SpatialVectorStoreManager, SpatialMath, DDL, 3-Stage Query Pipeline
 */

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import * as path from 'node:path';
import * as fs from 'node:fs';

import {
  euclideanDistance3D,
  euclideanDistanceSquared,
  calculateBoundingBox,
  cosineSimilarity,
  packEmbedding,
  unpackEmbedding,
  generateFallbackEmbedding,
} from '../../teamwork_projects/symbiorithmic_deep_dive/src/spatial/SpatialMath.js';
import { SpatialVectorStoreManager } from '../../teamwork_projects/symbiorithmic_deep_dive/src/spatial/SpatialVectorStoreManager.js';

const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function record(name, pass, details) {
  if (pass) {
    testResults.passed++;
    console.log(`[PASS] ${name}${details ? `: ${details}` : ''}`);
  } else {
    testResults.failed++;
    console.log(`[FAIL] ${name}${details ? `: ${details}` : ''}`);
  }
  testResults.tests.push({ name, pass, details });
}

async function runAllEmpiricalTests() {
  console.log('================================================================');
  console.log('   M1 ITERATION 2 EMPIRICAL ADVERSARIAL STRESS TEST SUITE      ');
  console.log('================================================================\n');

  const testDbPath = path.join(process.cwd(), 'teamwork_projects', 'symbiorithmic_deep_dive', 'data', 'agent_empirical_m1_test.db');
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch (e) {}
  }
  const walPath = `${testDbPath}-wal`;
  const shmPath = `${testDbPath}-shm`;
  if (fs.existsSync(walPath)) try { fs.unlinkSync(walPath); } catch (e) {}
  if (fs.existsSync(shmPath)) try { fs.unlinkSync(shmPath); } catch (e) {}

  const manager = new SpatialVectorStoreManager(testDbPath);
  await manager.initDatabase();

  // ----------------------------------------------------
  // TEST 1: Zero Coordinates [0, 0, 0]
  // ----------------------------------------------------
  try {
    const zeroNodeId = await manager.insertSpatialMemory({
      x: 0,
      y: 0,
      z: 0,
      radius_influence: 10,
      region_id: 'origin_nexus',
      type: 'origin',
      title: 'Zero Origin Point',
      text: 'Anchored at exact zero origin',
      tags: ['zero', 'origin'],
      embedding: new Float32Array(1024).fill(0.1),
    });

    const res = await manager.querySpatialMemories({
      position: [0, 0, 0],
      radius: 5,
    });

    assert.ok(res.some((n) => n.id === zeroNodeId), 'Node at [0,0,0] must be retrieved when querying [0,0,0]');
    record('Edge Case 1: Zero Coordinates [0,0,0]', true, 'Node at [0,0,0] retrieved successfully');
  } catch (err) {
    record('Edge Case 1: Zero Coordinates [0,0,0]', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Negative Coordinates [-500, -200, -100]
  // ----------------------------------------------------
  try {
    const negNodeId = await manager.insertSpatialMemory({
      x: -500,
      y: -200,
      z: -100,
      radius_influence: 15,
      region_id: 'underdark_trench',
      type: 'abyss',
      title: 'Deep Trench Abyss',
      text: 'Deep in the subterranean abyss',
      tags: ['underdark', 'abyss'],
      embedding: new Float32Array(1024).fill(-0.2),
    });

    const resNeg = await manager.querySpatialMemories({
      position: [-500, -200, -100],
      radius: 10,
    });

    assert.ok(resNeg.some((n) => n.id === negNodeId), 'Negative coordinate node must be retrieved');

    // Test bounding box for negative center
    const bbox = calculateBoundingBox([-500, -200, -100], 15);
    assert.strictEqual(bbox.minX, -515);
    assert.strictEqual(bbox.maxX, -485);
    assert.strictEqual(bbox.minY, -215);
    assert.strictEqual(bbox.maxY, -185);
    assert.strictEqual(bbox.minZ, -115);
    assert.strictEqual(bbox.maxZ, -85);

    record('Edge Case 2: Negative Coordinates [-500,-200,-100]', true, 'Bounding box & distance math valid for negative space');
  } catch (err) {
    record('Edge Case 2: Negative Coordinates [-500,-200,-100]', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 3: Zero Radius Queries (radius = 0)
  // ----------------------------------------------------
  try {
    const exactNodeId = await manager.insertSpatialMemory({
      x: 12.34,
      y: 56.78,
      z: 90.12,
      radius_influence: 0,
      region_id: 'pinpoint_spot',
      type: 'waypoint',
      title: 'Exact Pinpoint Spot',
      text: 'Exact spot zero radius',
      tags: ['pinpoint'],
      embedding: generateFallbackEmbedding('Pinpoint'),
    });

    // Query exact point with radius 0
    const resZeroRadius = await manager.querySpatialMemories({
      position: [12.34, 56.78, 90.12],
      radius: 0,
    });

    assert.ok(resZeroRadius.some((n) => n.id === exactNodeId), 'Exact point node should match query with radius 0');

    // Query slightly offset point (0.01 units away) with radius 0
    const resOffset = await manager.querySpatialMemories({
      position: [12.35, 56.78, 90.12],
      radius: 0,
    });
    assert.strictEqual(resOffset.some((n) => n.id === exactNodeId), false, 'Offset point should NOT match radius 0 query');

    record('Edge Case 3: Zero Radius (radius = 0)', true, 'Exact match returned, off-target filtered out');
  } catch (err) {
    record('Edge Case 3: Zero Radius (radius = 0)', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 4: Zero-Vector Embeddings [0, 0, ..., 0]
  // ----------------------------------------------------
  try {
    const zeroVec = new Float32Array(1024).fill(0.0);
    const nonZeroVec = generateFallbackEmbedding('Test Vector');

    const simZero = cosineSimilarity(zeroVec, nonZeroVec);
    assert.strictEqual(simZero, 0, 'Cosine similarity with zero vector must be 0 (no NaN)');

    const zeroEmbedNodeId = await manager.insertSpatialMemory({
      x: 30,
      y: 30,
      z: 30,
      radius_influence: 5,
      region_id: 'null_zone',
      type: 'void',
      title: 'Null Vector Void',
      text: 'Memory with all-zero vector embedding',
      tags: ['null'],
      embedding: zeroVec,
    });

    const resZeroEmbed = await manager.querySpatialMemories({
      position: [30, 30, 30],
      radius: 10,
      queryEmbedding: nonZeroVec,
    });

    const foundNullNode = resZeroEmbed.find((n) => n.id === zeroEmbedNodeId);
    assert.ok(foundNullNode, 'Null vector node should still be in candidates');

    record('Edge Case 4: Zero-Vector Embeddings', true, 'Cosine similarity handles 0-norm without NaN, DB stores/retrieves zero vector');
  } catch (err) {
    record('Edge Case 4: Zero-Vector Embeddings', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 5: queryEmbedding Vector Reranking
  // ----------------------------------------------------
  try {
    const vecA = new Float32Array(1024).fill(0.0);
    vecA[0] = 1.0;
    const vecB = new Float32Array(1024).fill(0.0);
    vecB[1] = 1.0;

    const nodeAId = await manager.insertSpatialMemory({
      x: 100,
      y: 100,
      z: 100,
      radius_influence: 20,
      region_id: 'vector_test',
      type: 'target_a',
      title: 'Target Vector A',
      text: 'Vector A orientation',
      tags: ['a'],
      embedding: vecA,
    });

    const nodeBId = await manager.insertSpatialMemory({
      x: 100,
      y: 101, // Closer in distance!
      z: 100,
      radius_influence: 20,
      region_id: 'vector_test',
      type: 'target_b',
      title: 'Target Vector B',
      text: 'Vector B orientation',
      tags: ['b'],
      embedding: vecB,
    });

    // Query with queryEmbedding vecA -> Node A should rank FIRST despite being 1 unit farther away
    const reranked = await manager.querySpatialMemories({
      position: [100, 100, 100],
      radius: 25,
      queryEmbedding: vecA,
    });

    assert.strictEqual(reranked[0].id, nodeAId, 'Node A must rank first due to cosine similarity reranking');
    record('Edge Case 5: queryEmbedding Vector Reranking', true, 'Cosine similarity reranks higher than distance proximity when queryEmbedding is set');
  } catch (err) {
    record('Edge Case 5: queryEmbedding Vector Reranking', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 6: minSimilarity Filtering
  // ----------------------------------------------------
  try {
    const vecQuery = new Float32Array(1024).fill(0.0);
    vecQuery[0] = 1.0;

    const resFiltered = await manager.querySpatialMemories({
      position: [100, 100, 100],
      radius: 25,
      queryEmbedding: vecQuery,
      minSimilarity: 0.9,
    });

    assert.ok(resFiltered.every((n) => cosineSimilarity(vecQuery, n.embedding) >= 0.9), 'All returned nodes must satisfy minSimilarity >= 0.9');
    record('Edge Case 6: minSimilarity Filtering', true, 'Nodes with similarity < 0.9 filtered out');
  } catch (err) {
    record('Edge Case 6: minSimilarity Filtering', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 7: Negative and Zero Limit Inputs (limit <= 0)
  // ----------------------------------------------------
  try {
    // Limit = 0
    const resLimitZero = await manager.querySpatialMemories({
      position: [0, 0, 0],
      radius: 100,
      limit: 0,
    });
    assert.strictEqual(resLimitZero.length, 0, 'limit: 0 must return empty array');

    // Limit = -5 (Negative limit testing)
    const resLimitNeg = await manager.querySpatialMemories({
      position: [0, 0, 0],
      radius: 100,
      limit: -5,
    });

    console.log(`  [INFO] limit: -5 returned ${resLimitNeg.length} elements (JS Array.slice behavior)`);
    record('Edge Case 7: Limit Parameter Behavior (0 & Negative)', true, `limit: 0 returns 0 elements. limit: -5 handled (returned ${resLimitNeg.length})`);
  } catch (err) {
    record('Edge Case 7: Limit Parameter Behavior (0 & Negative)', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 8: 1,000+ Node Scale Queries & Performance Benchmark
  // ----------------------------------------------------
  try {
    const SCALE_COUNT = 1200;
    console.log(`\nInserting ${SCALE_COUNT} nodes for scale testing...`);
    const t0Insert = performance.now();

    for (let i = 0; i < SCALE_COUNT; i++) {
      const x = (Math.sin(i) * 450);
      const y = (Math.cos(i * 1.3) * 450);
      const z = (Math.sin(i * 0.7) * 450);
      const r_inf = 5 + (i % 10);

      const emb = new Float32Array(1024);
      emb[i % 1024] = 1.0;

      await manager.insertSpatialMemory({
        x,
        y,
        z,
        radius_influence: r_inf,
        region_id: `scale_region_${i % 12}`,
        type: i % 3 === 0 ? 'lore' : 'encounter',
        title: `Scale Node #${i}`,
        text: `Scale test memory body text for item ${i}`,
        tags: [`tag_${i % 8}`, 'scale_test'],
        embedding: emb,
      });
    }

    const insertTimeMs = performance.now() - t0Insert;
    console.log(`✓ Inserted ${SCALE_COUNT} nodes in ${insertTimeMs.toFixed(2)}ms (${(insertTimeMs / SCALE_COUNT).toFixed(3)}ms/node)`);

    // Execute benchmark queries across random origins
    const benchmarkQueries = [
      { pos: [0, 0, 0], r: 50 },
      { pos: [200, -200, 100], r: 75 },
      { pos: [-300, 300, -300], r: 40 },
      { pos: [100, 100, 100], r: 30 },
      { pos: [-450, -450, -450], r: 60 },
    ];

    const latencies = [];
    for (const bq of benchmarkQueries) {
      const t0Query = performance.now();
      const res = await manager.querySpatialMemories({
        position: bq.pos,
        radius: bq.r,
        limit: 20,
      });
      const dur = performance.now() - t0Query;
      latencies.push(dur);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    assert.ok(maxLatency < 10.0, `Max query latency (${maxLatency.toFixed(2)}ms) exceeded 10ms threshold at scale`);
    record(
      'Edge Case 8: 1,000+ Node Scale Queries',
      true,
      `Scale: 1200+ nodes. Avg Latency: ${avgLatency.toFixed(3)}ms, Max: ${maxLatency.toFixed(3)}ms (Target <10ms)`
    );
  } catch (err) {
    record('Edge Case 8: 1,000+ Node Scale Queries', false, err.message);
  }

  // ----------------------------------------------------
  // TEST 9: Prompt Formatting output check
  // ----------------------------------------------------
  try {
    const memories = await manager.querySpatialMemories({
      position: [0, 0, 0],
      radius: 100,
      limit: 3,
    });
    const promptMd = manager.formatMemoriesForPrompt(memories);
    assert.ok(promptMd.includes('### 📍 Spatial Vector Store Regional Lore'), 'Prompt output must contain header');
    assert.ok(promptMd.includes('Anchor Coords'), 'Prompt output must contain coordinate info');

    const emptyMd = manager.formatMemoriesForPrompt([]);
    assert.ok(emptyMd.includes('No relevant spatial lore nodes found'), 'Empty memories prompt formatting check');

    record('Feature: formatMemoriesForPrompt', true, 'Markdown context prompt correctly formatted');
  } catch (err) {
    record('Feature: formatMemoriesForPrompt', false, err.message);
  }

  manager.close();
  try { fs.unlinkSync(testDbPath); } catch (e) {}
  try { fs.unlinkSync(walPath); } catch (e) {}
  try { fs.unlinkSync(shmPath); } catch (e) {}

  console.log('\n================================================================');
  console.log(` FINAL SUMMARY: ${testResults.passed} PASSED | ${testResults.failed} FAILED`);
  console.log('================================================================\n');

  if (testResults.failed > 0) {
    process.exit(1);
  }
}

runAllEmpiricalTests().catch((err) => {
  console.error('Fatal execution error in test runner:', err);
  process.exit(1);
});
