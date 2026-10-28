# Explorer 3 Survey Handoff Report — Symbiorithmic Deep Dive (R4 & Infra)

## 1. Observation
1. **Visual Engine Source**: `apps/web/src/components/World/ParallaxatronEngine.tsx` defines `ParallaxatronEngine`, `ParallaxLayerSpec`, `ParallaxatronPreset`, and `PARALLAXATRON_PRESETS` (lines 1-233).
   - Currently defined presets: `faerun_overland` (lines 35-75), `yawning_portal` (lines 76-89), `fireball_vortex` (lines 90-118).
   - `ParallaxCyclotron.tsx` is located at `apps/web/src/components/World/ParallaxCyclotron.tsx` (lines 1-60).
2. **World Mounting Location**: `apps/web/src/components/World/AstraLabWorld.tsx` line 449 mounts:
   `<ParallaxatronEngine presetId="faerun_overland" anchorPosition={[px, 0, pz]} />`
   which hardcodes the `faerun_overland` preset without spatial memory tag binding.
3. **Requirement R4 Specs**: `ORIGINAL_REQUEST.md` lines 179-180 and 192-195 mandate integrating `ParallaxatronEngine` with spatial memory nodes so entering historical lore regions automatically triggers atmospheric presets (`stormy_skies`, `bioluminescent_spores`, `dark_shadow_rings`).
4. **TODO Ledger Items**: `TODO.md` lines 31 and 33 require expanding `PARALLAXATRON_PRESETS` to include `yawning_portal`, `waterdeep_city_streets`, `undermountain_cavern`, `icewind_blizzard`, and `candlekeep_library`, alongside GLSL Mandelbrot & Julia fractal shaders.
5. **Project Workspace & Build Infra**:
   - Monorepo root `package.json` configures npm workspaces (`apps/*`, `packages/*`).
   - `teamwork_projects/symbiorithmic_deep_dive` directory does not yet exist and needs initialization.
   - Standard build commands: `npm run build` (`tsc -b && vite build` in `apps/web`).
   - Test runner framework: 4-tier opaque-box runner pattern (`node tests/e2e-runner.mjs` or `npm run test:e2e`).

## 2. Logic Chain
1. **From Observation 1 & 2 to Preset Deficit**:
   - The engine infrastructure (`ParallaxatronEngine.tsx`) is operational with multiplane cylinder/sphere rendering, rotation speed, UV scrolling, and transparency.
   - However, `PARALLAXATRON_PRESETS` only contains 3 presets and lacks `stormy_skies`, `bioluminescent_spores`, `dark_shadow_rings`, `waterdeep_city_streets`, `undermountain_cavern`, `icewind_blizzard`, and `candlekeep_library`.
   - `AstraLabWorld.tsx` hardcodes `presetId="faerun_overland"`, meaning player movement to spatial coordinates with lore tags does not currently trigger dynamic visual preset changes.
2. **From Observation 3 to R4 Architecture**:
   - To achieve Requirement R4, a reactive bridge (`SpatialParallaxBridge`) must map spatial tags retrieved from SQLite/vector store queries (e.g. `ancient_battlefield`, `haunted_ruins`, `underdark_cavern`) directly to dynamic preset IDs (`stormy_skies`, `dark_shadow_rings`, `bioluminescent_spores`).
   - Opacity lerping over a 1.5s window must be implemented to prevent visual popping during region boundary crossing.
3. **From Observation 5 to Infra Architecture**:
   - Creating `teamwork_projects/symbiorithmic_deep_dive` with `package.json`, `tsconfig.json`, modular source subdirectories (`spatial/`, `playtest/`, `mutation/`, `parallax/`), and a 53-test 4-tier `e2e-runner.mjs` establishes a clean, testable subproject setup aligned with existing repo conventions (`packages/b-movie-beatdown`).

## 3. Caveats
- Direct shell execution (`run_command`) timed out waiting for user approval in this environment mode. Build and test status evaluation was performed via file inspection of build manifests (`package.json`, `tsconfig.json`, `TEST_READY.md`) and pre-existing workspace scripts.
- Image assets for additional preset layers rely on existing texture paths (`/assets/textures/skybox/`, `/assets/textures/parallax_clouds_layer2.png`, `/assets/textures/parallax_creatures_layer3.png`). If custom texture variations are desired, additional image files can be generated via local image tools (`pixel_forge.py` / PyTorch generator).

## 4. Conclusion
- **Requirement R4 Readiness**: Clear spatial tag to visual preset mapping defined for all required atmospheric environments (`stormy_skies`, `bioluminescent_spores`, `dark_shadow_rings`, plus 4 additional lore presets). Architectural workflow defined for spatial tag resolution and dynamic prop binding in `AstraLabWorld.tsx`.
- **Project Infrastructure**: Directory structure, package configuration, build commands (`npm run build`), and a 53-case 4-tier E2E test runner pattern specified for `teamwork_projects/symbiorithmic_deep_dive`.

## 5. Verification Method
1. **Source Inspection**:
   - Inspect `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\src\components\World\ParallaxatronEngine.tsx` for preset declarations.
   - Inspect `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\src\components\World\AstraLabWorld.tsx` line 449 for engine instantiation.
2. **Analysis Report Inspection**:
   - Read `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\explorer_survey_3\analysis.md` for full preset specifications and visual mapping tables.
3. **Build & Test Commands**:
   - Build command: `npm --prefix apps/web run build`
   - Test command: `npm run test` or `node teamwork_projects/symbiorithmic_deep_dive/tests/e2e-runner.mjs`
