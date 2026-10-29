# E2E Test Infra: B-Movie Beatdown

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: Tests verify user-visible gameplay behavior, state transitions, inputs, controls, rewards, level progression, marquee splash screens, and title demos without depending on internal implementation details.
- **Methodology**: Derived using Category-Partitioning, Boundary Value Analysis (BVA), Pairwise Combinatorial Interaction Testing, and Real-World Workload Simulation.

## Feature Inventory
| # | Feature ID | Feature Name | Description & Requirement Mapping | Tier 1 Goals | Tier 2 Goals | Tier 3 Goals |
|---|------------|--------------|-----------------------------------|:------------:|:------------:|:------------:|
| 1 | `F1_GAME_LOOP` | Basic Gameplay Loop & State Transitions | Title, Playing, Shop, GameOver, Victory, Cutscene, Director/Zombies modes (R1, AC Technical Quality) | >= 5 tests | >= 5 tests | Pairwise |
| 2 | `F2_WASD_CONTROLS` | WASD Movement & 2.5D Engine | Responsive WASD key movement, altitude/jump, 2.5D vector updates (R1, AC UX) | >= 5 tests | >= 5 tests | Pairwise |
| 3 | `F3_MOUSE_ATTACKS` | Mouse Attacks & Combo System | Left click attack, Right click special/action, combo steps 1-3, cooldowns (R1, AC UX) | >= 5 tests | >= 5 tests | Pairwise |
| 4 | `F4_STATS_HEALTH` | Score, Health & Budget Meter | HP, max HP, Money, Ransom Debt, Hype/Budget meter (0-100), death trigger (R1, AC UX) | >= 5 tests | >= 5 tests | Pairwise |
| 5 | `F5_REWARDS_GEN` | Rewards Generation & Items | Prop destruction, coin/burger item spawn logic, pickup mechanics (R1, AC Technical Quality) | >= 5 tests | >= 5 tests | Pairwise |
| 6 | `F6_LEVEL_PROGRESS` | Level Progression & Wave Spawning | Levels 1-10 across films, wave completion, enemy/victim counters (R1, R4, AC UX) | >= 5 tests | >= 5 tests | Pairwise |
| 7 | `F7_MARQUEE_SPLASH` | Cinema Marquee Splash Screen | Pre-level & demo cinema marquee splash, title/description display (R3, AC Aesthetics) | >= 5 tests | >= 5 tests | Pairwise |
| 8 | `F8_TITLE_DEMO` | Title Screen & Automated Level Demo | Title demo playback, marquee splash trigger, returning to title (R3, AC Technical Quality) | >= 5 tests | >= 5 tests | Pairwise |

---

## Test Architecture
- **Test Runner Location**: `packages/b-movie-beatdown/tests/` (or `packages/neon-nightmare/tests/`)
- **Invocation Command**: `npm run test:e2e` (or `node tests/e2e-runner.mjs`)
- **Assertion Framework**: Built-in opaque-box test runner framework with clean pass/fail reporter, zero external browser runtime requirement, and deterministic game state simulation engine.
- **Pass/Fail Semantics**: Exit code `0` on 100% pass, non-zero on any failure. All output printed cleanly with individual test IDs, names, status, and execution timings.

---

## Detailed Test Case Specs

### Tier 1: Feature Coverage (>=5 per feature = 40 tests)

#### F1: Basic Gameplay Loop & State Transitions
1. `T1_F1_01_TITLE_TO_PLAYING`: Transitioning from TITLE to PLAYING initializes initial level state, player entity, and score.
2. `T1_F1_02_PLAYING_TO_GAMEOVER`: Player HP reaching 0 triggers GAMEOVER state transition and halts wave spawns.
3. `T1_F1_03_PLAYING_TO_SHOP`: Wave completion transitions to SHOP state when configured.
4. `T1_F1_04_SHOP_TO_PLAYING`: Exiting shop resumes PLAYING state with updated player budget/upgrades.
5. `T1_F1_05_VICTORY_STATE`: Defeating final boss triggers VICTORY state screen.

#### F2: WASD Movement & 2.5D Engine
6. `T1_F2_01_WASD_W_NORTH`: Pressing 'W' decreases Y coordinate (moves North/Up in 2.5D plane).
7. `T1_F2_02_WASD_S_SOUTH`: Pressing 'S' increases Y coordinate (moves South/Down in 2.5D plane).
8. `T1_F2_03_WASD_A_WEST`: Pressing 'A' decreases X coordinate and updates facing to 'LEFT'.
9. `T1_F2_04_WASD_D_EAST`: Pressing 'D' increases X coordinate and updates facing to 'RIGHT'.
10. `T1_F2_05_WASD_DIAGONAL`: Pressing 'W' and 'D' simultaneously moves diagonally North-East with normalized velocity vector.

#### F3: Mouse Attacks & Combo System
11. `T1_F3_01_LEFT_CLICK_ATTACK`: Left mouse click triggers ATTACK state, step 1 combo, and sets attack cooldown.
12. `T1_F3_02_COMBO_STEP_2`: Second left click within combo window advances comboStep to 2.
13. `T1_F3_03_COMBO_STEP_3_FINISHER`: Third left click advances comboStep to 3 (finisher with extra knockback).
14. `T1_F3_04_RIGHT_CLICK_SPECIAL`: Right mouse click triggers SPECIAL action if budget meter > 0.
15. `T1_F3_05_ATTACK_HITBOX_FACING`: Attack hitboxes align in the direction player is facing (LEFT vs RIGHT).

#### F4: Score, Health & Budget Meter
16. `T1_F4_01_INITIAL_STATS`: Player starts with maxHp (100), money (0), and budget meter initialized.
17. `T1_F4_02_TAKE_DAMAGE`: Receiving enemy hit reduces player HP by enemy damage value.
18. `T1_F4_03_GAIN_MONEY`: Defeating enemies or picking up coins increases player money.
19. `T1_F4_04_BUDGET_METER_FILL`: Dealing consecutive hits fills the budget/hype meter (0 to 100).
20. `T1_F4_05_SPECIAL_CONSUMES_BUDGET`: Executing special attack consumes budget meter points.

#### F5: Rewards Generation & Items
21. `T1_F5_01_PROP_DESTRUCTION`: Attacking destructible props (CRATE/BARREL) reduces prop HP to 0 and destroys prop.
22. `T1_F5_02_REWARD_ITEM_SPAWN`: Destroying a prop triggers non-buggy reward item generation (BURGER or COIN).
23. `T1_F5_03_COIN_PICKUP`: Player colliding with COIN item collects coin and adds value to money.
24. `T1_F5_04_BURGER_HEAL_PICKUP`: Player colliding with BURGER item restores HP up to maxHp.
25. `T1_F5_05_REWARD_NO_NULL_ERRORS`: Spawning 50 consecutive rewards generates valid items without null/undefined runtime errors.

#### F6: Level Progression & Wave Spawning
26. `T1_F6_01_WAVE_SPAWN_START`: Starting Level 1 spawns initial wave of enemies per level configuration.
27. `T1_F6_02_KILLS_COUNTER`: Defeating an enemy increments `enemiesKilled` counter.
28. `T1_F6_03_WAVE_CLEAR`: Killing all enemies in current wave triggers next wave spawn or level completion.
29. `T1_F6_04_VICTIM_RESCUE`: Player touching VICTIM entity rescues them, incrementing `victimsRescued`.
30. `T1_F6_05_LEVEL_TRANSITION`: Completing all waves in level 1 transitions game state to Level 2.

#### F7: Cinema Marquee Splash Screen
31. `T1_F7_01_MARQUEE_RENDER`: Transitioning to new level renders Cinema Marquee Splash Screen with film title.
32. `T1_F7_02_MARQUEE_METADATA`: Marquee splash displays level title, pillar designation, and level description text.
33. `T1_F7_03_MARQUEE_START_PROMPT`: Marquee splash presents prompt to start gameplay.
34. `T1_F7_04_MARQUEE_DISMISSAL`: User action dismisses marquee splash screen and initiates level active gameplay.
35. `T1_F7_05_MARQUEE_STYLING`: Marquee splash screen sets background style ('CINEMA' / 'NEON_VEGAS').

#### F8: Title Screen & Automated Level Demo
36. `T1_F8_01_TITLE_DEMO_TRIGGER`: Staying idle on TITLE screen for 5 seconds automatically triggers level demo mode.
37. `T1_F8_02_DEMO_MARQUEE_SPLASH`: Level demo mode opens with marquee splash screen preview.
38. `T1_F8_03_DEMO_SIMULATED_INPUTS`: Demo mode executes automated simulated WASD and attack inputs.
39. `T1_F8_04_DEMO_USER_INTERRUPT`: Pressing any key or mouse button during demo mode cancels demo and returns to TITLE screen.
40. `T1_F8_05_DEMO_LOOP_RETURN`: Demo finishing without user input automatically loops back to TITLE screen.

---

### Tier 2: Boundary & Corner Cases (>=5 per feature = 40 tests)

#### F1: Basic Gameplay Loop Boundaries
41. `T2_F1_01_ZERO_HP_OVERKILL`: Player receiving damage far exceeding current HP (e.g. 9999 damage at 1 HP) safely clamps HP to 0 and triggers GAMEOVER without crashing.
42. `T2_F1_02_RAPID_PAUSE_TOGGLE`: Toggling pause state 50 times in rapid succession maintains internal state consistency.
43. `T2_F1_03_MAX_ENEMIES_CAP`: Spawner respects `maxEnemiesOnScreen` limit and halts spawning when max cap is reached.
44. `T2_F1_04_RESTART_FROM_GAMEOVER`: Restarting game from GAMEOVER screen fully resets player HP, wave counter, score, and clears existing entities.
45. `T2_F1_05_INVALID_LEVEL_INDEX`: Requesting transition to invalid level index clamps safely to level bounds without throw.

#### F2: WASD Movement Boundaries
46. `T2_F2_01_BOUNDS_LEFT_MIN`: Moving left at minimum X boundary (x <= 0) stops player at border.
47. `T2_F2_02_BOUNDS_RIGHT_MAX`: Moving right at max level width boundary (x >= levelWidth) stops player at border.
48. `T2_F2_03_BOUNDS_TOP_Y_MIN`: Moving up at top depth boundary (y <= minY) stops player at border.
49. `T2_F2_04_BOUNDS_BOTTOM_Y_MAX`: Moving down at bottom depth boundary (y >= maxY) stops player at border.
50. `T2_F2_05_RAPID_OPPOSITE_WASD`: Rapidly alternating 'A' and 'D' keys (100 inputs/sec) prevents position instability or runaway velocity.

#### F3: Mouse Attacks Boundaries
51. `T2_F3_01_ATTACK_DURING_COOLDOWN`: Click during attack cooldown is ignored without buffering corrupt state.
52. `T2_F3_02_COMBO_TIMEOUT_RESET`: Delaying second click past `comboTimer` window resets comboStep back to 0.
53. `T2_F3_03_FAST_MOUSE_CLICKS`: 100 mouse clicks in 1 second correctly respects cooldowns without skipping frames or memory leak.
54. `T2_F3_04_SPECIAL_ZERO_BUDGET`: Right click attack with 0 budget meter is rejected gracefully and does not execute special.
55. `T2_F3_05_ATTACK_OUT_OF_BOUNDS_CLICK`: Clicking mouse coordinates far outside game viewport maintains facing direction towards cursor.

#### F4: Stats & Health Boundaries
56. `T2_F4_01_MAX_HP_OVERHEAL`: Picking up multiple burgers at max HP clamps HP at `maxHp` (no overheal overflow).
57. `T2_F4_02_BUDGET_METER_CAP_100`: Accumulating hype past 100 points clamps budget meter strictly at 100.
58. `T2_F4_03_BUDGET_METER_MIN_0`: Consuming budget meter never drops value below 0.
59. `T2_F4_04_ZERO_RANSOM_DEBT`: Rescuing all victims reduces ransom debt to 0 without negative debt bugs.
60. `T2_F4_05_MAX_MONEY_LIMIT`: Accumulating 999,999 coins maintains integer safety without numeric overflow or NaN.

#### F5: Rewards Generation Boundaries
61. `T5_F5_01_MULTIPLE_PROPS_SAME_FRAME`: Destroying 10 props in the exact same tick correctly spawns 10 distinct reward items with unique IDs.
62. `T2_F5_02_ITEM_DESPAWN_TIMER`: Uncollected reward items cleanly despawn after expiration timer without leaving orphaned entities.
63. `T2_F5_03_ZERO_HP_PROP`: Props created with 0 HP immediately shatter and trigger drop calculation safely.
64. `T2_F5_04_DESPAWNED_ITEM_PICKUP_ATTEMPT`: Attempting to collect an item on the frame it despawns resolves without double-pickup or error.
65. `T2_F5_05_REWARD_TABLE_PROBABILITY_SUM`: Item drop probability tables for all prop types sum strictly to 1.0.

#### F6: Level Progression Boundaries
66. `T2_F6_01_ZERO_ENEMIES_LEVEL_START`: Starting a level with empty enemy array immediately resolves wave as clear.
67. `T2_F6_02_LAST_WAVE_BOSS_SPAWN`: Wave 10 completion correctly triggers Boss spawn entity rather than normal wave.
68. `T2_F6_03_VICTIM_CAPTURED_DEFEAT`: If all victims in level are captured before player rescues them, handles penalty score cleanly.
69. `T2_F6_04_MAX_LEVEL_TRANSITION`: Completing level 10 transitions cleanly to victory screen rather than indexing past film array.
70. `T2_F6_05_SIMULTANEOUS_KILL_WAVE_CLEAR`: Killing final two enemies on the exact same frame triggers wave clear event exactly once.

#### F7: Marquee Splash Boundaries
71. `T2_F7_01_MARQUEE_EMPTY_DESCRIPTION`: LevelDef with empty description text renders fallback text safely.
72. `T2_F7_02_MARQUEE_RAPID_DISMISS`: Rapid keypress during marquee fade-in immediately skips animation safely to gameplay.
73. `T2_F7_03_MARQUEE_LONG_TITLE`: Unusually long film title (200 characters) wraps or truncates without UI overflow.
74. `T2_F7_04_MARQUEE_REPEATED_PAUSE`: Pressing pause key while marquee is active does not stack pause layers.
75. `T2_F7_05_MARQUEE_ASSET_TIMEOUT`: Delay in background asset loading during marquee fallback displays loading indicator without freeze.

#### F8: Title Demo Boundaries
76. `T2_F8_01_DEMO_RAPID_INTERRUPT`: Interrupting demo mode on the exact tick it starts cleanly returns to TITLE state.
77. `T2_F8_02_DEMO_PLAYER_DEATH`: If simulated demo player entity dies, demo automatically restarts or exits cleanly to TITLE.
78. `T2_F8_03_DEMO_REPEATED_CYCLES`: Running demo mode 10 consecutive times without input exhibits no memory drift.
79. `T2_F8_04_DEMO_NO_SAVE_MUTATION`: Demo mode gameplay does not overwrite stored high scores or player save state.
80. `T2_F8_05_DEMO_SOUND_MUTED`: Demo mode honors user audio mute settings.

---

### Tier 3: Cross-Feature Combinations (8 tests)

81. `T3_COMB_01_WASD_ATTACK_SIMULTANEOUS`: Pressing WASD movement keys while clicking Left Mouse attack executes attack without freezing player movement or losing direction.
82. `T3_COMB_02_REWARDS_DROP_BOSS_FIGHT`: Destroying props during boss fight spawns rewards correctly while boss AI remains active.
83. `T3_COMB_03_PAUSE_DURING_MARQUEE_SPLASH`: Activating pause menu during marquee splash freezes marquee timer and prevents gameplay start until unpaused.
84. `T3_COMB_04_ASSET_LOAD_LEVEL_TRANSITION`: Loading parallax background layers during level transition updates rendering pipeline seamlessly before gameplay unpauses.
85. `T3_COMB_05_BUDGET_FULL_SPECIAL_LOW_HP`: Triggering right-click special at 10 HP with full budget consumes budget, executes special, and protects player from lethal hit during invulnerability frame.
86. `T3_COMB_06_RESCUE_VICTIM_WHILE_ATTACKING`: Rescuing a victim while executing combo step 3 awards rescue bonus and updates debt counter without interrupting attack animation.
87. `T3_COMB_07_TITLE_DEMO_MARQUEE_TRANSITION`: Entering demo mode opens marquee splash, transitions to demo playing state, and returns cleanly to TITLE state upon user keypress.
88. `T3_COMB_08_WAVE_CLEAR_REWARD_PICKUP`: Defeating last enemy of a wave while collecting a burger heals player, updates stats, and opens SHOP transition cleanly.

---

### Tier 4: Real-World Scenarios (5 tests)

89. `T4_SCENARIO_01_FULL_FILM_LEVEL_1_PLAYTHROUGH`: Simulate complete playthrough of Film 1 Level 1: start at TITLE, view Marquee Splash, clear 3 enemy waves, rescue 2 victims, collect coins & burger rewards, defeat wave boss, and reach SHOP transition.
90. `T4_SCENARIO_02_SURVIVAL_WAVE_ENDURANCE`: Simulate surviving 5 consecutive waves with scaling enemy density, tracking HP retention, budget meter usage, and kill counts.
91. `T4_SCENARIO_03_REWARDS_PROP_FARMING`: Complete a prop-heavy level section: smash all 10 props, verify reward generation rates, collect all spawned burgers and coins, and check end-of-level budget calculations.
92. `T4_SCENARIO_04_BOSS_ENCOUNTER_DEFEAT`: Complete Level 10 Boss Fight: trigger boss spawn, execute WASD dodge patterns, deal combo attacks, handle boss phase transitions, use budget special, and defeat boss to reach VICTORY screen.
93. `T4_SCENARIO_05_TITLE_DEMO_ATTRACT_LOOP`: Run automated attract loop: TITLE state idle -> Marquee Splash -> Level Demo execution -> User Input Interrupt -> Return to TITLE state -> Idle auto-start next demo film.

---

## Minimum Threshold Compliance
- Total Identified Features (N): 8
- Tier 1 Threshold (5 * N): 40
- Tier 2 Threshold (5 * N): 40
- Tier 3 Threshold (N): 8
- Tier 4 Threshold (max(5, N / 2)): 5
- **Total Test Cases Defined**: 93 (100% compliant with formula `~11 * N + max(5, N/2)`).
