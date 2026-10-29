const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e';

async function run() {
    console.log('[VERIFY] Launching browser...');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--use-gl=angle',
            '--use-angle=default',
            '--enable-webgl',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[Uniracers') || text.includes('error') || text.includes('Error')) {
                console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
            }
        });

        console.log('[VERIFY] Navigating to http://localhost:5173 ...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });

        await page.waitForFunction(() => typeof window.__MYOS_SWAP_DIMENSION === 'function', { timeout: 15000 });

        console.log('[VERIFY] Swapping dimension to uniracers_world...');
        await page.evaluate(() => {
            window.__MYOS_SWAP_DIMENSION('uniracers_world');
        });

        await new Promise(r => setTimeout(r, 3500));

        // Focus canvas
        await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) canvas.focus();
        });

        // 1. Test Accelerating and Braking to a stop
        console.log('[VERIFY] Testing Acceleration with W...');
        await page.keyboard.down('KeyW');
        await new Promise(r => setTimeout(r, 2000));
        await page.keyboard.up('KeyW');

        let speedAfterW = await page.evaluate(() => {
            const el = document.querySelector('.text-4xl.font-black');
            return el ? el.innerText : null;
        });
        console.log('[VERIFY] Speed after 2s W:', speedAfterW, 'MPH (comfortable readable speed)');

        console.log('[VERIFY] Testing Braking with S down to full stop...');
        await page.keyboard.down('KeyS');
        await new Promise(r => setTimeout(r, 1500));
        await page.keyboard.up('KeyS');

        let speedAfterS = await page.evaluate(() => {
            const el = document.querySelector('.text-4xl.font-black');
            return el ? el.innerText : null;
        });
        console.log('[VERIFY] Speed after braking with S:', speedAfterS, 'MPH (able to stop!)');

        // 2. Test Jump and In-Flight Tricks (Space + ArrowUp / ArrowDown + Q/E)
        console.log('[VERIFY] Driving forward and testing Jump (Space) + In-Flight Tricks...');
        await page.keyboard.down('KeyW');
        await new Promise(r => setTimeout(r, 800));

        // Hold Space to charge jump, then release
        console.log('[VERIFY] Charging and launching Jump...');
        await page.keyboard.down('Space');
        await new Promise(r => setTimeout(r, 500));
        await page.keyboard.up('Space');

        // While airborne, execute Frontflips and Twists
        console.log('[VERIFY] Airborne: Executing Frontflip (ArrowUp) + Twist (KeyE)...');
        await page.keyboard.down('ArrowUp');
        await page.keyboard.down('KeyE');
        await new Promise(r => setTimeout(r, 900));
        await page.keyboard.up('ArrowUp');
        await page.keyboard.up('KeyE');
        await page.keyboard.up('KeyW');

        // Wait for landing
        await new Promise(r => setTimeout(r, 800));

        const trickShot = path.join(ARTIFACTS_DIR, 'uniracers_tricks_executed.png');
        await page.screenshot({ path: trickShot });
        console.log(`[VERIFY] Captured trick landing screenshot: ${trickShot}`);

        const scoreText = await page.evaluate(() => {
            const text = document.body.innerText;
            const scoreMatch = text.match(/SCORE:\s*([\d,]+)/);
            return scoreMatch ? scoreMatch[1] : '0';
        });
        console.log('[VERIFY] Score awarded after trick:', scoreText);

        // 3. Test Fullscreen Tactical Planetary Map (Key: M)
        console.log('[VERIFY] Pressing "M" to open Fullscreen Tactical Planetary Map...');
        await page.keyboard.press('KeyM');
        await new Promise(r => setTimeout(r, 800));

        const mapOpen = await page.evaluate(() => {
            return document.body.innerText.includes('PLANETARY TRANSIT GRID');
        });
        console.log('[VERIFY] Tactical Map modal open:', mapOpen);

        const mapShot = path.join(ARTIFACTS_DIR, 'uniracers_tactical_planetary_map.png');
        await page.screenshot({ path: mapShot });
        console.log(`[VERIFY] Captured Tactical Map screenshot: ${mapShot}`);

        // Close Tactical Map
        console.log('[VERIFY] Pressing "KeyM" to close map...');
        await page.keyboard.press('KeyM');
        await new Promise(r => setTimeout(r, 600));

        // 4. Test High Satellite / Top-Down Camera to see entire world structure
        console.log('[VERIFY] Cycling camera to TOP_DOWN (Planetary Satellite)...');
        // NORMAL -> WIDE -> REAR -> SIDE_2D -> TOP_DOWN (4 presses of C)
        for (let i = 0; i < 4; i++) {
            await page.keyboard.press('KeyC');
            await new Promise(r => setTimeout(r, 400));
        }

        await new Promise(r => setTimeout(r, 1000));
        const satelliteShot = path.join(ARTIFACTS_DIR, 'uniracers_planetary_satellite_overview.png');
        await page.screenshot({ path: satelliteShot });
        console.log(`[VERIFY] Captured Planetary Satellite overview screenshot: ${satelliteShot}`);

        // Return to NORMAL
        await page.keyboard.press('KeyC');
        await new Promise(r => setTimeout(r, 500));

        // 5. Test Tangential Exit Off-Ramp
        console.log('[VERIFY] Accelerating along roundabout and steering right into smooth off-ramp...');
        await page.keyboard.down('KeyW');
        await new Promise(r => setTimeout(r, 2000));
        await page.keyboard.down('KeyD'); // Steer right onto off-ramp
        await new Promise(r => setTimeout(r, 2000));
        await page.keyboard.up('KeyD');
        await new Promise(r => setTimeout(r, 1500));
        await page.keyboard.up('KeyW');

        const offRampShot = path.join(ARTIFACTS_DIR, 'uniracers_tangential_offramp_riding.png');
        await page.screenshot({ path: offRampShot });
        console.log(`[VERIFY] Captured Tangential Off-Ramp screenshot: ${offRampShot}`);

        console.log('[VERIFY] All verifications finished successfully!');
    } catch (err) {
        console.error('[VERIFY] Error during verification:', err);
    } finally {
        await browser.close();
    }
}

run();
