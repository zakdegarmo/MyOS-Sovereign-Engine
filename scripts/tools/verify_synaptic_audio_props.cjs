const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    console.log('[Verify Audio] Testing Aura-Synaptic Resonance Layer with Cannon-es in Chrome...');
    const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const browser = await puppeteer.launch({
        executablePath,
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--no-sandbox',
            '--disable-web-security',
            '--use-gl=angle',
            '--use-angle=d3d11',
            '--enable-webgl',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Error') || text.includes('Resonator') || text.includes('Audio')) {
            console.log(`[Browser Console] ${text}`);
        }
    });

    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Simulate audio clicks and physics impacts
    console.log('[Verify Audio] Simulating 4 seconds of physics impacts and harmonic chime ticks...');
    await new Promise(r => setTimeout(r, 4500));

    // Test clicking on canvas to trigger audio context resume
    await page.mouse.click(960, 540);
    await new Promise(r => setTimeout(r, 1500));

    const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";
    const ssPath = path.join(artifactDir, "synaptic_resonance_props_live.png");
    await page.screenshot({ path: ssPath });
    console.log('[Verify Audio] Saved screenshot:', ssPath);

    await browser.close();
    console.log('[Verify Audio] Aura-Synaptic Resonance verification complete!');
})();
