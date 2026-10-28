const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e';

async function run() {
    console.log('[VERIFY] Launching browser to test pure original Glyphrider on http://localhost:3005...');
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
            console.log(`[BROWSER]: ${msg.text()}`);
        });

        await page.goto('http://localhost:3005', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot original start screen
        const menuShot = path.join(ARTIFACTS_DIR, 'original_glyphrider_menu.png');
        await page.screenshot({ path: menuShot });
        console.log(`[VERIFY] Captured original start screen: ${menuShot}`);

        // Click PLUMBER driver to start
        console.log('[VERIFY] Clicking PLUMBER driver...');
        await page.evaluate(() => {
            const btn = document.getElementById('btn-plumber');
            if (btn) btn.click();
        });

        // Wait 3 seconds of driving
        console.log('[VERIFY] Driving on original procedural track...');
        await page.keyboard.down('KeyW');
        await new Promise(r => setTimeout(r, 3000));
        await page.keyboard.up('KeyW');

        // Screenshot gameplay
        const gameShot = path.join(ARTIFACTS_DIR, 'original_glyphrider_gameplay.png');
        await page.screenshot({ path: gameShot });
        console.log(`[VERIFY] Captured original gameplay: ${gameShot}`);

    } finally {
        await browser.close();
    }
}

run().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});
