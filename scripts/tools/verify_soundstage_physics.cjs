const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    console.log('[Verify Physics] Testing Cannon-es Rigid Body Physics in Soundstage...');
    const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const browser = await puppeteer.launch({
        executablePath,
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-web-security', '--use-gl=angle', '--use-angle=d3d11', '--enable-webgl']
    });

    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait 4 seconds for physics simulation to settle and bounce
    console.log('[Verify Physics] Simulating 4 seconds of physics ticks...');
    await new Promise(r => setTimeout(r, 4500));

    const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";
    const ssPath = path.join(artifactDir, "cannon_physics_props_live.png");
    await page.screenshot({ path: ssPath });
    console.log('[Verify Physics] Saved physics simulation screenshot:', ssPath);

    await browser.close();
    console.log('[Verify Physics] Verification complete!');
})();
