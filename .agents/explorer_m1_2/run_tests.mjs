import { runTier1Tests } from '../../packages/neon-nightmare/tests/tier1-tests.mjs';
import { runTier2Tests } from '../../packages/neon-nightmare/tests/tier2-tests.mjs';
import { runTier3Tests } from '../../packages/neon-nightmare/tests/tier3-tests.mjs';

function runAll() {
    console.log('=== RUNNING TIER 1 TESTS ===');
    runSuite(runTier1Tests());

    console.log('\n=== RUNNING TIER 2 TESTS ===');
    runSuite(runTier2Tests());

    console.log('\n=== RUNNING TIER 3 TESTS ===');
    runSuite(runTier3Tests());
}

function runSuite(tests) {
    let passed = 0;
    let failed = 0;
    for (const t of tests) {
        try {
            t.fn();
            passed++;
        } catch (e) {
            failed++;
            console.error(`❌ [FAIL] ${t.id} - ${t.name}`);
            console.error(`   Error: ${e.message}\n`);
        }
    }
    console.log(`Summary: ${passed} passed, ${failed} failed out of ${tests.length} tests.`);
}

runAll();
