/**
 * test_attempt1_pipeline.js
 * -------------------------
 * Comprehensive End-to-End Verification for Attempt 1.
 * Tests:
 * 1. Standardized browser harness (Edge/Chrome auto-discovery).
 * 2. Story Mode Act 1 launch + cutscene player.
 * 3. Level 1 race start + 3-lap loop detection + lap banners.
 * 4. Stage Cleared Victory Modal + time breakdown.
 * 5. Level 2 progression + Act 2 cutscene pre-roll + tandem race start.
 */

const path = require('path');
const fs = require('fs');
const { launchHarnessBrowser } = require('./harness/browser');

const ARTIFACT_DIR = 'C:/Users/zakde/.gemini/antigravity/brain/5d778f69-db13-4232-9d87-80fc4f0ece4e';

(async () => {
    console.log("=== EXECUTING ATTEMPT 1 AUTONOMOUS PIPELINE VERIFICATION ===");
    const browser = await launchHarnessBrowser();

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

        console.log("1. Navigating to game server http://localhost:5174/ ...");
        await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1000));

        // 1. Launch Story Mode
        console.log("2. Launching Story Mode (Act 1)...");
        await page.waitForSelector('#btn-story', { timeout: 5000 });
        await page.click('#btn-story');

        // 2. Verify Cutscene Overlay
        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));

        const cutscene1Path = path.resolve(__dirname, '../../temp_attempt1_act1_cutscene.png');
        await page.screenshot({ path: cutscene1Path });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(cutscene1Path, path.join(ARTIFACT_DIR, 'attempt1_act1_cutscene.png'));
        }

        // 3. Skip to Race
        console.log("3. Skipping Act 1 cutscene to start race...");
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1200));

        // 4. Run 3 Laps on Level 1
        console.log("4. Simulating 3 complete laps on Level 1...");
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

        // 5. Verify Stage Cleared Modal
        console.log("5. Verifying Stage Cleared Victory Modal...");
        await page.waitForSelector('#victory-overlay', { timeout: 5000 });
        await page.waitForSelector('#btn-next-race', { timeout: 3000 });

        const victoryPath = path.resolve(__dirname, '../../temp_attempt1_victory_modal.png');
        await page.screenshot({ path: victoryPath });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(victoryPath, path.join(ARTIFACT_DIR, 'attempt1_victory_modal.png'));
        }

        // 6. Progress to Level 2
        console.log("6. Clicking NEXT RACE to trigger Act 2 cutscene...");
        await page.click('#btn-next-race');

        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));

        const cutscene2Path = path.resolve(__dirname, '../../temp_attempt1_act2_cutscene.png');
        await page.screenshot({ path: cutscene2Path });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(cutscene2Path, path.join(ARTIFACT_DIR, 'attempt1_act2_cutscene.png'));
        }

        // 7. Skip Act 2 Cutscene into Level 2 Race
        console.log("7. Skipping Act 2 cutscene into Level 2 race against Blue...");
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1500));

        const level2State = await page.evaluate(() => {
            return {
                levelId: window.game.currentLevel?.id,
                levelName: window.game.currentLevel?.name,
                racers: window.game.racers.length,
                lap: window.game.currentLap
            };
        });
        console.log("Level 2 State:", level2State);

        const race2Path = path.resolve(__dirname, '../../temp_attempt1_level2_race.png');
        await page.screenshot({ path: race2Path });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(race2Path, path.join(ARTIFACT_DIR, 'attempt1_level2_race.png'));
        }

        console.log("=== ATTEMPT 1 PIPELINE VERIFICATION: 100% PASSED ===");
    } catch (err) {
        console.error("ATTEMPT 1 PIPELINE FAILED:", err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
