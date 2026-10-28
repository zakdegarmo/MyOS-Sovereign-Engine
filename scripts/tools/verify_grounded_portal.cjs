const puppeteer = require('puppeteer-core');
const path = require('path');

async function verify() {
    console.log('[Portal Verifier] Launching Headless Chrome...');
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--no-sandbox',
            '--disable-web-security',
            '--use-gl=angle',
            '--use-angle=d3d11',
            '--enable-webgl'
        ]
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('[PAGE CONSOLE]', msg.text()));
    page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

    try {
        console.log('[Portal Verifier] Navigating to http://127.0.0.1:5173/ ...');
        await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise(r => setTimeout(r, 4000));

        // Take initial screenshot of grounded soundstage
        const artifactDir = 'C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e';
        const initPath = path.join(artifactDir, 'grounded_desktop_restored.png');
        await page.screenshot({ path: initPath });
        console.log('[Portal Verifier] Captured grounded soundstage screenshot:', initPath);

        // Press 'p' to open the physical 3D doorway portal
        console.log('[Portal Verifier] Pressing "p" to summon 3D Physical Doorway Portal...');
        await page.keyboard.press('p');
        await new Promise(r => setTimeout(r, 2000));

        const portalPath = path.join(artifactDir, 'grounded_portal_open.png');
        await page.screenshot({ path: portalPath });
        console.log('[Portal Verifier] Captured open physical portal screenshot:', portalPath);

        console.log('[Portal Verifier] SUCCESS!');
        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error('[Portal Verifier] Error:', err);
        await browser.close();
        process.exit(1);
    }
}

verify();
