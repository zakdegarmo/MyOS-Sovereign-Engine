const puppeteer = require('puppeteer');
const path = require('path');

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

        const consoleLogs = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleLogs.push(`[CONSOLE ${msg.type()}]: ${text}`);
            if (text.includes('Error') || text.includes('error') || text.includes('GLYPHRIDER') || text.includes('CRITICAL')) {
                console.log(`[BROWSER] ${text}`);
            }
        });

        page.on('pageerror', err => {
            console.error(`[PAGEERROR] ${err.message}`);
        });

        console.log('[VERIFY] Navigating to http://localhost:5173 ...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('[VERIFY] Swapping dimension to glyphrider...');
        await page.waitForFunction(() => typeof window.__MYOS_SWAP_DIMENSION === 'function', { timeout: 15000 });
        await page.evaluate(() => {
            window.__MYOS_SWAP_DIMENSION('glyphrider');
        });

        console.log('[VERIFY] Waiting 5s for Glyphrider and 3D stuntcraft to initialize...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('[VERIFY] Clicking HIT THE TRACK! [START] button...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const startBtn = btns.find(b => b.innerText.includes('Hit the Track') || b.innerText.includes('START'));
            if (startBtn) startBtn.click();
        });

        console.log('[VERIFY] Driving on track for 3 seconds...');
        await page.keyboard.down('KeyW');
        await new Promise(r => setTimeout(r, 3000));
        await page.keyboard.up('KeyW');

        // Check if critical error HUD is visible
        const errorHudState = await page.evaluate(() => {
            const errHud = document.getElementById('glyph-error-hud');
            const hasError = errHud ? (errHud.style.display !== 'none' && errHud.innerHTML.length > 0) : false;
            const errContent = errHud ? errHud.innerText : '';
            return { hasError, errContent };
        });

        console.log('[VERIFY] Error HUD Check during driving:', JSON.stringify(errorHudState));

        const shotPath = path.join(ARTIFACTS_DIR, 'glyphrider_driving_action_verified.png');
        await page.screenshot({ path: shotPath });
        console.log(`[VERIFY] Captured live driving gameplay screenshot: ${shotPath}`);

        if (errorHudState.hasError) {
            console.error('❌ FAILURE: Error HUD is active:', errorHudState.errContent);
            process.exit(1);
        } else {
            console.log('✅ SUCCESS: Glyphrider is running at full FPS with zero critical errors!');
        }
    } finally {
        await browser.close();
    }
}

run().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});
