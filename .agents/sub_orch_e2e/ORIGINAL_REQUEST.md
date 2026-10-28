# Original User Request

## 2026-07-26T23:37:35Z

Design and build a comprehensive opaque-box E2E test suite for the B-Movie Beatdown game (`packages/neon-nightmare` / `packages/b-movie-beatdown`).
1. Read `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\ORIGINAL_REQUEST.md` and `PROJECT.md` for full requirements and feature specs.
2. Create `TEST_INFRA.md` at project root detailing the methodology, test architecture, feature inventory, and test case definitions across 4 tiers:
   - Tier 1: Feature Coverage (>=5 per feature) - basic gameplay, WASD controls, Mouse attacks, score/health, rewards generation, level progression, marquee splash, title demo.
   - Tier 2: Boundary & Corner Cases (>=5 per feature) - zero health, max enemies, off-screen bounds, fast mouse clicks, rapid WASD inputs, level transition limits.
   - Tier 3: Cross-Feature Combinations - WASD movement while attacking, rewards drop during boss fight, pause during marquee splash, asset loading during level transition.
   - Tier 4: Real-World Scenarios - playing through entire films/levels from start to finish, surviving waves, collecting rewards, defeating bosses.
3. Spawn workers/test creators to implement the test runner and test cases (e.g. using Vitest / Playwright / Node test scripts / CLI runners).
4. Run and verify the test suite infrastructure.
5. When complete, publish `TEST_READY.md` at project root with full tier coverage table and test invocation command.
6. Write your handoff report in `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\sub_orch_e2e\handoff.md` and notify parent.
