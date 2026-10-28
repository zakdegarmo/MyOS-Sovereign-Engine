import fs from 'fs';
import path from 'path';
import assert from 'assert';

// Import compiled dist modules directly
import { SpatialVectorStoreManager } from '../../teamwork_projects/symbiorithmic_deep_dive/dist/spatial/SpatialVectorStoreManager.js';
import {
  calculateBoundingBox,
  euclideanDistanceSquared,
  cosineSimilarity,
  packFloat32Blob,
  unpackFloat32Blob,
  generateFallbackEmbedding
} from '../../teamwork_projects/symbiorithmic_deep_dive/dist/spatial/SpatialMath.js';

const TEST_DB_PATH = path.join(process.cwd(), '.agents/challenger_symbio_m1_1/test_empirical_spatial.db');

async function cleanDb() {
  if (fs.existsSync(TEST_DB_PATH)) {
    try { fs.unlinkSync(TEST_DB_PATH); } catch (e) {}
  }
  if (fs.existsSync(TEST_DB_PATH + '-wal')) {
    try { fs.unlinkSync(TEST_DB_PATH + '-wal'); } catch (e) {}
  }
  if (fs.existsSync(TEST_DB_PATH + '-shm')) {
    try { fs.unlinkSync(TEST_DB_PATH + '-shm'); } catch (e) {}
  }
}

async function runEmpiricalStressTest() {
  console.log('====================================================');
  console.log('EMPIRICAL ADVERSARIAL STRESS TEST: MILESTONE 1 (SPATIAL MEMORY)');
  console.log('====================================================\n');

  await cleanDb();

  const manager = new SpatialVectorStoreManager();
  await manager.initDatabase(TEST_DB_PATH);
  console.log('[TEST 0] Database initialized at:', TEST_DB_PATH);

  const resultsSummary = {
    passed: 0,
    failed: 0,
    defects: []
  };

  function recordResult(name, pass, detail) {
    if (pass) {
      resultsSummary.passed++;
      console.log(`[PASS] ${name}`);
      if (detail) console.log(`       ${detail}`);
    } else {
      resultsSummary.failed++;
      resultsSummary.defects.push({ test: name, detail });
      console.log(`[FAIL/DEFECT FOUND] ${name}`);
      console.log(`       ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Zero Coordinates [0, 0, 0] & Negative Coordinates [-500, -200, -100]
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 1: Coordinate Systems (Zero & Negative Coordinates) ---');

  const zeroNodeId = await manager.insertSpatialMemory({
    x: 0,
    y: 0,
    z: 0,
    radius_influence: 10,
    region_id: 'origin_realm',
    type: 'nexus',
    title: 'Origin Point Node',
    text: 'Zero coordinate center node',
    tags: ['origin', 'zero'],
    embedding: new Float32Array([1, 0, 0, 0])
  });

  const negNodeId = await manager.insertSpatialMemory({
    x: -500,
    y: -200,
    z: -100,
    radius_influence: 50,
    region_id: 'abyssal_trench',
    type: 'abyss',
    title: 'Deep Abyssal Node',
    text: 'Negative coordinate node deep underground',
    tags: ['abyss', 'negative'],
    embedding: new Float32Array([0, 1, 0, 0])
  });

  // Query origin
  const zeroQueryRes = await manager.querySpatialMemories({
    position: [0, 0, 0],
    radius: 5
  });
  const zeroFound = zeroQueryRes.some(n => n.id === zeroNodeId);
  recordResult('Zero coordinates query [0, 0, 0]', zeroFound, `Retrieved ${zeroQueryRes.length} nodes around origin.`);

  // Query negative coordinates
  const negQueryRes = await manager.querySpatialMemories({
    position: [-500, -200, -100],
    radius: 10
  });
  const negFound = negQueryRes.some(n => n.id === negNodeId);
  recordResult('Negative coordinates query [-500, -200, -100]', negFound, `Retrieved ${negQueryRes.length} nodes around negative point.`);

  // -------------------------------------------------------------
  // TEST 2: Radius Edge Cases (Zero Radius & Negative Radius)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Radius Edge Cases ---');

  // Query with radius = 0 exactly at zeroNode position (0,0,0) with r_inf = 10
  const zeroRadRes = await manager.querySpatialMemories({
    position: [0, 0, 0],
    radius: 0
  });
  const zeroRadFound = zeroRadRes.some(n => n.id === zeroNodeId);
  recordResult('Query with radius = 0 at node position', zeroRadFound, `Found ${zeroRadRes.length} nodes when radius = 0.`);

  // Query with radius = 0 at (5, 0, 0) with node at (0,0,0) and r_inf = 10
  const zeroRadDist5Res = await manager.querySpatialMemories({
    position: [5, 0, 0],
    radius: 0
  });
  const zeroRadDist5Found = zeroRadDist5Res.some(n => n.id === zeroNodeId);
  recordResult('Query with radius = 0 within node r_inf', zeroRadDist5Found, `Found ${zeroRadDist5Res.length} nodes at dist 5 when query radius = 0, node r_inf = 10.`);

  // Query with negative radius = -10, node r_inf = 5 at dist = 3
  const negRadNodeId = await manager.insertSpatialMemory({
    x: 100,
    y: 0,
    z: 0,
    radius_influence: 5,
    region_id: 'test_neg_rad',
    type: 'test',
    title: 'Neg Rad Test Node',
    text: 'Testing negative radius math flaw',
    tags: ['test'],
    embedding: new Float32Array([1, 0, 0, 0])
  });

  const negRadRes = await manager.querySpatialMemories({
    position: [103, 0, 0], // dist = 3
    radius: -10
  });
  const negRadFlawDetected = negRadRes.some(n => n.id === negRadNodeId);
  recordResult('Negative query radius handling', !negRadFlawDetected, negRadFlawDetected ? 'DEFECT: Query with negative radius (-10) returned node because Stage 1 bounds & Stage 2 maxAllowedDist squared negative result!' : 'Negative radius correctly excluded node.');

  // -------------------------------------------------------------
  // TEST 3: Zero-Vector Embeddings & Cosine Similarity
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Zero-Vector Embeddings ---');

  const zeroEmbedNodeId = await manager.insertSpatialMemory({
    x: 10,
    y: 10,
    z: 10,
    radius_influence: 10,
    region_id: 'zero_embed_region',
    type: 'test',
    title: 'Zero Vector Node',
    text: 'Node with all zeros embedding',
    tags: ['zero_vector'],
    embedding: new Float32Array([0, 0, 0, 0])
  });

  const simZero = cosineSimilarity(new Float32Array([0, 0, 0, 0]), new Float32Array([1, 2, 3, 4]));
  recordResult('Cosine similarity with zero vector (returns 0 without NaN/crash)', simZero === 0 && !isNaN(simZero), `Similarity result: ${simZero}`);

  // -------------------------------------------------------------
  // TEST 4: Boundary Condition Queries (D = R + r_inf)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Boundary Conditions (D = R + r_inf) ---');

  // Node at (0, 0, 0), r_inf = 6.
  // Query at (0, 10, 0), radius = 4.
  // Distance = 10. Max allowed dist = 4 + 6 = 10.
  const boundaryNodeId = await manager.insertSpatialMemory({
    x: 0,
    y: 0,
    z: 0,
    radius_influence: 6,
    region_id: 'boundary_region',
    type: 'boundary',
    title: 'Exact Boundary Node',
    text: 'Node positioned exactly on boundary D = R + r_inf',
    tags: ['boundary'],
    embedding: new Float32Array([1, 0, 0, 0])
  });

  const boundaryRes = await manager.querySpatialMemories({
    position: [0, 10, 0], // dist = 10
    radius: 4 // r + r_inf = 10
  });
  const boundaryIncluded = boundaryRes.some(n => n.id === boundaryNodeId);
  recordResult('Exact boundary condition D = R + r_inf (inclusive)', boundaryIncluded, `Node at distance 10 with max allowed distance 10 was ${boundaryIncluded ? 'INCLUDED' : 'EXCLUDED'}.`);

  // Just beyond boundary: dist = 10.001
  const boundaryBeyondRes = await manager.querySpatialMemories({
    position: [0, 10.001, 0],
    radius: 4
  });
  const boundaryBeyondExcluded = !boundaryBeyondRes.some(n => n.id === boundaryNodeId);
  recordResult('Just beyond boundary D > R + r_inf (exclusive)', boundaryBeyondExcluded, `Node at distance 10.001 with max allowed distance 10 was ${boundaryBeyondExcluded ? 'EXCLUDED' : 'INCLUDED'}.`);

  // -------------------------------------------------------------
  // TEST 5: Query Limits (large, zero, negative)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Query Limit Edge Cases ---');

  const limit10000Res = await manager.querySpatialMemories({
    position: [0, 0, 0],
    radius: 100,
    limit: 10000
  });
  recordResult('Large query limit (limit = 10000)', limit10000Res.length <= 10000 && limit10000Res.length > 0, `Returned ${limit10000Res.length} nodes.`);

  const limit0Res = await manager.querySpatialMemories({
    position: [0, 0, 0],
    radius: 100,
    limit: 0
  });
  recordResult('Zero query limit (limit = 0)', limit0Res.length === 0, `Returned ${limit0Res.length} nodes when limit = 0.`);

  const limitNegRes = await manager.querySpatialMemories({
    position: [0, 0, 0],
    radius: 100,
    limit: -2
  });
  const limitNegFlaw = limitNegRes.length > 0;
  recordResult('Negative query limit handling (limit = -2)', !limitNegFlaw, limitNegFlaw ? `DEFECT: limit = -2 was passed to Array.slice(0, -2), returning ${limitNegRes.length} nodes instead of 0 or throwing error!` : 'Negative limit handled safely.');

  // -------------------------------------------------------------
  // TEST 6: queryEmbedding vs queryText & Stage 3 Cosine Reranking
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: 3-Stage Query Engine Filtering & Reranking Defects ---');

  const nodeAId = await manager.insertSpatialMemory({
    x: 200,
    y: 0,
    z: 0,
    radius_influence: 10,
    region_id: 'rerank_region',
    type: 'rerank',
    title: 'Node A Alpha',
    text: 'Alpha text',
    tags: ['alpha'],
    embedding: new Float32Array([1.0, 0.0, 0.0, 0.0])
  });

  const nodeBId = await manager.insertSpatialMemory({
    x: 200,
    y: 0,
    z: 0,
    radius_influence: 10,
    region_id: 'rerank_region',
    type: 'rerank',
    title: 'Node B Beta',
    text: 'Beta text',
    tags: ['beta'],
    embedding: new Float32Array([0.0, 1.0, 0.0, 0.0])
  });

  // Query with queryEmbedding = [0, 1, 0, 0] (matches Node B perfectly) WITHOUT queryText
  const queryEmbedRes = await manager.querySpatialMemories({
    position: [200, 0, 0],
    radius: 10,
    queryEmbedding: [0.0, 1.0, 0.0, 0.0]
  });

  const queryEmbedTopId = queryEmbedRes[0]?.id;
  const queryEmbedReranked = queryEmbedTopId === nodeBId;
  recordResult('Query with queryEmbedding parameter (without queryText)', queryEmbedReranked, queryEmbedReranked ? 'Node B (matching vector) ranked first.' : `DEFECT: queryEmbedding parameter was IGNORED! Top result was ${queryEmbedRes[0]?.title} instead of Node B!`);

  // Query with minSimilarity = 0.8 without queryText
  const minSimNoTextRes = await manager.querySpatialMemories({
    position: [200, 0, 0],
    radius: 10,
    minSimilarity: 0.8
  });
  recordResult('minSimilarity filter without queryText', minSimNoTextRes.length < 2, minSimNoTextRes.length === 2 ? 'DEFECT: minSimilarity parameter was IGNORED because queryText was not provided!' : 'minSimilarity applied.');

  // -------------------------------------------------------------
  // TEST 7: High-Density Node Insertions (1,000+ nodes stress test)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: High-Density Insertion & Scale Query Stress (1,000+ Nodes) ---');

  const countToInsert = 1000;
  console.log(`Inserting ${countToInsert} spatial memory nodes...`);
  const startTime = Date.now();

  for (let i = 0; i < countToInsert; i++) {
    const x = (Math.random() - 0.5) * 1000;
    const y = (Math.random() - 0.5) * 1000;
    const z = (Math.random() - 0.5) * 1000;
    const r_inf = Math.random() * 20;

    const emb = new Float32Array(1024);
    emb[i % 1024] = 1.0;

    await manager.insertSpatialMemory({
      x,
      y,
      z,
      radius_influence: r_inf,
      region_id: `region_${i % 10}`,
      type: 'stress_node',
      title: `Stress Node #${i}`,
      text: `High density spatial memory node #${i} located at [${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}]`,
      tags: [`tag_${i % 5}`, 'stress'],
      embedding: emb
    });
  }

  const insertDuration = Date.now() - startTime;
  console.log(`✓ Inserted ${countToInsert} nodes in ${insertDuration} ms (${(insertDuration / countToInsert).toFixed(2)} ms/node).`);
  recordResult(`High-density node insertion (${countToInsert} nodes)`, insertDuration < 10000, `Total time: ${insertDuration}ms.`);

  const queryStart = Date.now();
  const scaleQueryRes = await manager.querySpatialMemories({
    position: [0, 0, 0],
    radius: 100,
    limit: 50
  });
  const queryDuration = Date.now() - queryStart;
  console.log(`✓ Query over high-density store returned ${scaleQueryRes.length} nodes in ${queryDuration} ms.`);
  recordResult('High-density spatial radius query performance (< 50ms)', queryDuration < 50, `Query execution time: ${queryDuration}ms.`);

  // -------------------------------------------------------------
  // TEST 8: Stage 1 & Stage 2 Filtering Verification
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: 3-Stage Query Pipeline Step-by-Step Verification ---');

  const farNodeId = await manager.insertSpatialMemory({
    x: 9999,
    y: 9999,
    z: 9999,
    radius_influence: 5,
    region_id: 'outer_space',
    type: 'far',
    title: 'Far Far Away',
    text: 'Far away node',
    tags: ['far'],
    embedding: new Float32Array(1024)
  });

  const boxInDistOutNodeId = await manager.insertSpatialMemory({
    x: 8,
    y: 8,
    z: 8,
    radius_influence: 0,
    region_id: 'box_test',
    type: 'corner',
    title: 'Box-In Distance-Out Corner Node',
    text: 'Inside bounding box cube corner, but outside Euclidean sphere',
    tags: ['corner'],
    embedding: new Float32Array(1024)
  });

  const stageTestRes = await manager.querySpatialMemories({
    position: [0, 0, 0],
    radius: 10
  });

  const farNodePresent = stageTestRes.some(n => n.id === farNodeId);
  const cornerNodePresent = stageTestRes.some(n => n.id === boxInDistOutNodeId);

  recordResult('Stage 1 Bounding Box Filter (excludes (9999,9999,9999))', !farNodePresent, farNodePresent ? 'DEFECT: Far node passed Stage 1!' : 'Far node correctly excluded by Stage 1.');
  recordResult('Stage 2 Euclidean Distance Filter (excludes cube corner (8,8,8) at distance 13.85)', !cornerNodePresent, cornerNodePresent ? 'DEFECT: Corner node (dist 13.85) passed Stage 2 when max radius is 10!' : 'Corner node correctly filtered out by Stage 2 Euclidean calculation.');

  manager.close();

  // -------------------------------------------------------------
  // TEST GROUP 9: TS Source Code vs Compiled Bundle Integrity
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 9: Source Code vs Compiled Bundle Integrity ---');
  const tsMathContent = fs.readFileSync(path.join(process.cwd(), 'teamwork_projects/symbiorithmic_deep_dive/src/spatial/SpatialMath.ts'), 'utf8');
  const missingExports = [];
  if (!tsMathContent.includes('euclideanDistanceSquared')) missingExports.push('euclideanDistanceSquared');
  if (!tsMathContent.includes('packFloat32Blob')) missingExports.push('packFloat32Blob');
  if (!tsMathContent.includes('unpackFloat32Blob')) missingExports.push('unpackFloat32Blob');
  if (!tsMathContent.includes('generateFallbackEmbedding')) missingExports.push('generateFallbackEmbedding');

  recordResult('src/spatial/SpatialMath.ts exports completeness', missingExports.length === 0, missingExports.length > 0 ? `DEFECT: src/spatial/SpatialMath.ts is missing required exports: ${missingExports.join(', ')} used by SpatialVectorStoreManager.ts!` : 'All required math exports present in TS source.');

  // Summary
  console.log('\n====================================================');
  console.log('EMPIRICAL STRESS TEST SUMMARY');
  console.log('====================================================');
  console.log(`Total Subtests Run: ${resultsSummary.passed + resultsSummary.failed}`);
  console.log(`Passed: ${resultsSummary.passed}`);
  console.log(`Failed / Defects Found: ${resultsSummary.failed}`);

  if (resultsSummary.defects.length > 0) {
    console.log('\nCRITICAL DEFECTS RECORDED:');
    resultsSummary.defects.forEach((d, idx) => {
      console.log(`${idx + 1}. [${d.test}]: ${d.detail}`);
    });
  }

  return resultsSummary;
}

runEmpiricalStressTest().catch(err => {
  console.error('Empirical stress test suite crashed:', err);
  process.exit(1);
});
