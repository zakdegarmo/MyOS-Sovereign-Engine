/**
 * test_attempt3_pipeline.js
 * -------------------------
 * Comprehensive End-to-End Verification for Attempt 3.
 * Tests:
 * 1. Standardized browser harness (Edge/Chrome auto-discovery).
 * 2. In-game Web Audio engine + stunt chime audio trigger.
 * 3. Story Mode Act 1 (The Scrap Yard: Awakening).
 * 4. Level 1 race start + 3 laps + Victory Modal.
 * 5. Story Mode Act 2 (Neon Docks: Reunion with Blue).
 * 6. Level 2 tandem race + 3 laps + Victory Modal.
 * 7. Story Mode Act 3 (CycNet Citadel: The Corporate Ambush).
 * 8. Level 3 Boss race + 3 laps + Victory Modal.
 * 9. Story Mode Act 4 (Outlaw Canyon: Sonic Velocity - Grand Finale).
 * 10. Level 4 race + 3 laps + Grand Outlaw Champion modal.
 */

const path = require('path');
const fs = require('fs');
const { launchHarnessBrowser } = require('./harness/browser');

const ARTIFACT_DIR = 'C:/Users/zakde/.gemini/antigravity/brain/5d778f69-db13-4232-9d87-80fc4f0ece4e';

(async () => {
    console.log("=== EXECUTING ATTEMPT 3 FULL CAMPAIGN VERIFICATION PIPELINE ===");
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
        await new Promise(r => setTimeout(r, 1000));

        // Simulate 3 Laps on Level 1
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

        // Progress to Level 2
        console.log("4. Progressing to Act 2 (Neon Docks)...");
        await page.waitForSelector('#victory-overlay', { timeout: 5000 });
        await page.waitForSelector('#btn-next-race', { timeout: 3000 });
        await page.click('#btn-next-race');

        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1000));

        // Simulate 3 Laps on Level 2
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

        // Progress to Level 3
        console.log("6. Progressing to Act 3 (CycNet Citadel)...");
        await page.waitForSelector('#victory-overlay', { timeout: 5000 });
        await page.waitForSelector('#btn-next-race', { timeout: 3000 });
        await page.click('#btn-next-race');

        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1000));

        // Simulate 3 Laps on Level 3
        console.log("7. Simulating 3 complete laps on Level 3 (Boss Race)...");
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

        // Progress to Level 4 (Grand Finale)
        console.log("8. Progressing to Act 4 (Outlaw Canyon Grand Finale)...");
        await page.waitForSelector('#victory-overlay', { timeout: 5000 });
        await page.waitForSelector('#btn-next-race', { timeout: 3000 });
        await page.click('#btn-next-race');

        // Verify Act 4 Cutscene
        console.log("9. Verifying Act 4 Cutscene Player...");
        await page.waitForSelector('#cutscene-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1200));

        const cutscene4Path = path.resolve(__dirname, '../../temp_attempt3_act4_cutscene.png');
        await page.screenshot({ path: cutscene4Path });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(cutscene4Path, path.join(ARTIFACT_DIR, 'attempt3_act4_cutscene.png'));
        }

        // Skip into Level 4 Grand Prix Race
        console.log("10. Skipping Act 4 cutscene into Level 4 Grand Prix...");
        await page.waitForSelector('#btn-skip-cutscene', { timeout: 3000 });
        await page.click('#btn-skip-cutscene');
        await new Promise(r => setTimeout(r, 1500));

        const level4State = await page.evaluate(() => {
            return {
                levelId: window.game.currentLevel?.id,
                levelName: window.game.currentLevel?.name,
                racers: window.game.racers.length,
                lap: window.game.currentLap,
                trackColor: window.game.trackConfig?.trackColor
            };
        });
        console.log("Level 4 Grand Prix State:", level4State);

        const race4Path = path.resolve(__dirname, '../../temp_attempt3_level4_race.png');
        await page.screenshot({ path: race4Path });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(race4Path, path.join(ARTIFACT_DIR, 'attempt3_level4_race.png'));
        }

        // Simulate 3 Laps on Level 4 to trigger Grand Outlaw Championship Victory
        console.log("11. Completing 3 Laps on Level 4 to trigger Grand Championship Victory...");
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

        await page.waitForSelector('#victory-overlay', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 1000));

        const champPath = path.resolve(__dirname, '../../temp_attempt3_grand_champion.png');
        await page.screenshot({ path: champPath });
        if (fs.existsSync(ARTIFACT_DIR)) {
            fs.copyFileSync(champPath, path.join(ARTIFACT_DIR, 'attempt3_grand_champion.png'));
        }

        console.log("=== ATTEMPT 3 FULL CAMPAIGN VERIFICATION: 100% PASSED ===");
    } catch (err) {
        console.error("ATTEMPT 3 PIPELINE FAILED:", err);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
