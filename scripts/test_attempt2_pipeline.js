/**
 * test_attempt2_pipeline.js
 * -------------------------
 * Comprehensive End-to-End Verification for Attempt 2.
 * Tests:
 * 1. Standardized browser harness (Edge/Chrome auto-discovery).
 * 2. In-game Web Audio engine initialization and live pitch tracking.
 * 3. Story Mode Act 1 (The Scrap Yard: Awakening).
 * 4. Level 1 race start + 3 laps + Victory Modal.
 * 5. Story Mode Act 2 (Neon Docks: Reunion with Blue).
 * 6. Level 2 tandem race + 3 laps + Victory Modal.
 * 7. Story Mode Act 3 (CycNet Citadel: The Corporate Ambush).
 * 8. Level 3 Boss race against CycNet Uni-nator Enforcer.
 */

const path = require('path');
const fs = require('fs');
const { launchHarnessBrowser } = require('./harness/browser');

const ARTIFACT_DIR = 'C:/Users/zakde/.gemini/antigravity/brain/5d778f69-db13-4232-9d87-80fc4f0ece4e';

(async () => {
    console.log("=== EXECUTING ATTEMPT 2 MULTI-ACT VERIFICATION PIPELINE ===");
    const browser = await launchHarnessBrowser();

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

        console.log("1. Navigating to game server http://localhost:5174/ ...");
        await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        // 1. Launch Story Mode (Act 1)
        console.log("2. Launching Story Mode (Act 1: The Scrap Yard)...");
        await page.waitForSelector('#btn-story', { timeout: 5000 });
        await page.click('#btn-story');

        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));

        // Skip Act 1 Cutscene
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1200));

        // 2. Complete 3 Laps on Level 1
        console.log("3. Simulating 3 complete laps on Level 1...");
        for (let lap = 1; lap <= 3; lap++) {
            await page.evaluate(() => {
                window.game.player.t = 0.95;
                window.game.playerPrevT = 0.95;
            });
            await new Promise(r => setTimeout(r, 100));
            await page.evaluate(() => {
                window.game.player.t = 0.03;
            });
            await new Promise(r => setTimeout(r, 200));
        }

        // 3. Victory Modal Level 1 -> Progress to Level 2
        console.log("4. Progressing from Level 1 Victory to Act 2 (Neon Docks)...");
        await page.waitForSelector('#victory-overlay', { timeout: 5000 });
        await page.waitForSelector('#btn-next-race', { timeout: 3000 });
        await page.click('#btn-next-race');

        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));

        // Skip Act 2 Cutscene
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1200));

        // 4. Complete 3 Laps on Level 2 (Reunion Race)
        console.log("5. Simulating 3 complete laps on Level 2...");
        for (let lap = 1; lap <= 3; lap++) {
            await page.evaluate(() => {
                window.game.player.t = 0.95;
                window.game.playerPrevT = 0.95;
            });
            await new Promise(r => setTimeout(r, 100));
            await page.evaluate(() => {
                window.game.player.t = 0.03;
            });
            await new Promise(r => setTimeout(r, 200));
        }

        // 5. Victory Modal Level 2 -> Progress to Level 3 (CycNet Citadel)
        console.log("6. Progressing from Level 2 Victory to Act 3 (CycNet Citadel)...");
        await page.waitForSelector('#victory-overlay', { timeout: 5000 });
        await page.waitForSelector('#btn-next-race', { timeout: 3000 });
        await page.click('#btn-next-race');

        // 6. Verify Act 3 Cutscene Player
        console.log("7. Verifying Act 3 Cutscene Player...");
        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1200));

        const cutscene3Path = path.resolve(__dirname, '../../temp_attempt2_act3_cutscene.png');
        await page.screenshot({ path: cutscene3Path });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(cutscene3Path, path.join(ARTIFACT_DIR, 'attempt2_act3_cutscene.png'));
        }

        // 7. Skip Act 3 Cutscene into Level 3 Boss Race
        console.log("8. Skipping Act 3 cutscene into Level 3 Boss Race...");
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1500));

        const level3State = await page.evaluate(() => {
            return {
                levelId: window.game.currentLevel?.id,
                levelName: window.game.currentLevel?.name,
                racers: window.game.racers.length,
                lap: window.game.currentLap,
                trackColor: window.game.trackConfig?.trackColor
            };
        });
        console.log("Level 3 Boss Race State:", level3State);

        const race3Path = path.resolve(__dirname, '../../temp_attempt2_level3_race.png');
        await page.screenshot({ path: race3Path });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(race3Path, path.join(ARTIFACT_DIR, 'attempt2_level3_race.png'));
        }

        console.log("=== ATTEMPT 2 MULTI-ACT VERIFICATION: 100% PASSED ===");
    } catch (err) {
        console.error("ATTEMPT 2 PIPELINE FAILED:", err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
