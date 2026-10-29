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
            if (text.includes('[Uniracers') || text.includes('[Cortex') || text.includes('error') || text.includes('Error')) {
                console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
            }
        });

        page.on('pageerror', err => {
            console.error(`[BROWSER UNCAUGHT] ${err.message}`);
        });

        console.log('[VERIFY] Navigating to http://localhost:5173 ...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('[VERIFY] Page loaded. Checking __MYOS_SWAP_DIMENSION...');
        await page.waitForFunction(() => typeof window.__MYOS_SWAP_DIMENSION === 'function', { timeout: 15000 });

        console.log('[VERIFY] Swapping dimension to uniracers_world...');
        await page.evaluate(() => {
            window.__MYOS_SWAP_DIMENSION('uniracers_world');
        });

        console.log('[VERIFY] Waiting 4s for 3D world, track topology, and HUD to initialize...');
        await new Promise(r => setTimeout(r, 4000));

        // Check if HUD is mounted
        const hudState = await page.evaluate(() => {
            const speedEl = document.querySelector('[data-testid="hud-speedometer"]');
            const minimap = document.querySelector('canvas[title*="Radar"], canvas');
            const chatOpen = !!document.querySelector('[data-testid="cognitive-cortex-panel"]');
            return {
                speedometerPresent: !!speedEl,
                speedText: speedEl ? speedEl.innerText : null,
                chatOpen: chatOpen,
                bodyTextSample: document.body.innerText.slice(0, 300)
            };
        });
        console.log('[VERIFY] Initial HUD state:', JSON.stringify(hudState, null, 2));

        // Screenshot initial view (NORMAL)
        const shotNormal = path.join(ARTIFACTS_DIR, 'uniracers_gta_normal_chase.png');
        await page.screenshot({ path: shotNormal });
        console.log(`[VERIFY] Captured NORMAL chase screenshot: ${shotNormal}`);

        // Press C to cycle cameras and verify chat is NOT opened
        console.log('[VERIFY] Pressing "C" key to switch camera to WIDE...');
        await page.keyboard.press('KeyC');
        await new Promise(r => setTimeout(r, 1200));

        const camWideState = await page.evaluate(() => {
            const cortexPanel = document.querySelector('[data-testid="cognitive-cortex-panel"]') ||
                                document.querySelector('.cognitive-cortex');
            return {
                cortexOpen: !!cortexPanel,
                activeModeLabel: document.body.innerText.includes('WIDE') ? 'WIDE' : 'OTHER'
            };
        });
        console.log('[VERIFY] After 1st C press (expected WIDE, cortex closed):', JSON.stringify(camWideState));

        const shotWide = path.join(ARTIFACTS_DIR, 'uniracers_gta_wide_panoramic.png');
        await page.screenshot({ path: shotWide });
        console.log(`[VERIFY] Captured WIDE panoramic screenshot: ${shotWide}`);

        // Cycle through remaining camera angles: REAR -> SIDE_2D
        console.log('[VERIFY] Pressing "C" to switch to REAR...');
        await page.keyboard.press('KeyC');
        await new Promise(r => setTimeout(r, 800));

        console.log('[VERIFY] Pressing "C" to switch to SIDE_2D (Retro 1994 profile)...');
        await page.keyboard.press('KeyC');
        await new Promise(r => setTimeout(r, 1200));

        const shotSide2D = path.join(ARTIFACTS_DIR, 'uniracers_gta_side_2d.png');
        await page.screenshot({ path: shotSide2D });
        console.log(`[VERIFY] Captured SIDE_2D retro profile screenshot: ${shotSide2D}`);

        // Cycle to TOP_DOWN
        console.log('[VERIFY] Pressing "C" to switch to TOP_DOWN...');
        await page.keyboard.press('KeyC');
        await new Promise(r => setTimeout(r, 800));

        const shotTopDown = path.join(ARTIFACTS_DIR, 'uniracers_gta_top_down.png');
        await page.screenshot({ path: shotTopDown });
        console.log(`[VERIFY] Captured TOP_DOWN satellite screenshot: ${shotTopDown}`);

        // Return to NORMAL
        console.log('[VERIFY] Pressing "C" to return to NORMAL...');
        await page.keyboard.press('KeyC');
        await new Promise(r => setTimeout(r, 800));

        // Test Cognitive Cortex panel trigger with Enter
        console.log('[VERIFY] Testing Cognitive Cortex trigger with "Enter"...');
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 1000));

        const cortexStatus = await page.evaluate(() => {
            const body = document.body.innerText;
            return {
                containsMyOS: body.includes('MYOS') || body.includes('Cognitive Cortex') || body.includes('COGNITIVE CORTEX'),
                containsPillars: body.includes('Self') || body.includes('Logic') || body.includes('Pillars') || body.includes('TOPOLOGICAL')
            };
        });
        console.log('[VERIFY] Cognitive Cortex trigger result:', JSON.stringify(cortexStatus));

        const shotCortex = path.join(ARTIFACTS_DIR, 'uniracers_gta_cognitive_cortex.png');
        await page.screenshot({ path: shotCortex });
        console.log(`[VERIFY] Captured Cognitive Cortex overlay screenshot: ${shotCortex}`);

        // Close Cognitive Cortex with Escape
        console.log('[VERIFY] Pressing "Escape" to dismiss Cognitive Cortex...');
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 800));

        // Blur any active input and focus canvas
        await page.evaluate(() => {
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            const canvas = document.querySelector('canvas');
            if (canvas) canvas.focus();
        });
        await new Promise(r => setTimeout(r, 500));

        // Drive the unicycle forward on the Central Roundabout with W
        console.log('[VERIFY] Holding "KeyW" for 3 seconds to drive along the Central Roundabout ($R=1200$)...');
        await page.keyboard.down('KeyW');
        await new Promise(r => setTimeout(r, 3000));
        await page.keyboard.up('KeyW');

        await new Promise(r => setTimeout(r, 1000));

        const shotDriving = path.join(ARTIFACTS_DIR, 'uniracers_gta_driving_action.png');
        await page.screenshot({ path: shotDriving });
        console.log(`[VERIFY] Captured Driving Action screenshot: ${shotDriving}`);

        console.log('[VERIFY] Verification completed successfully.');
    } catch (err) {
        console.error('[VERIFY] Error during verification:', err);
    } finally {
        await browser.close();
    }
}

run();
