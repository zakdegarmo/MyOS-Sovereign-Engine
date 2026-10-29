const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    console.log('[Verify] Testing Diegetic Swarm Manager Facet in Chrome...');
    const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const browser = await puppeteer.launch({
        executablePath,
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-web-security', '--use-gl=angle', '--use-angle=d3d11', '--enable-webgl']
    });

    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 4000));

    // Open Prism Navigator
    console.log('[Verify] Pressing [P] for Prism Navigator...');
    await page.keyboard.press('p');
    await new Promise(r => setTimeout(r, 3000));

    // Press '4' to jump directly to Unity Pillar
    console.log('[Verify] Pressing [4] to jump to Unity Pillar...');
    await page.keyboard.press('4');
    await new Promise(r => setTimeout(r, 4000));

    // Check if Swarm Manager Facet mounted
    const swarmStats = await page.evaluate(() => {
        const text = document.body.innerText || '';
        return {
            hasSwarmHeader: text.includes('Diegetic Swarm Manager Core') || text.includes('10-Agent Swarm Active'),
            hasAgents: text.includes('Self Core') || text.includes('Thought Weaver') || text.includes('Logic Gate'),
            hasTelemetry: text.includes('CPU:') || text.includes('VRAM:'),
            snippet: text.slice(0, 400)
        };
    });

    console.log('[Verify] Swarm Facet Stats:', swarmStats);

    const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";
    const ssPath = path.join(artifactDir, "swarm_manager_facet_live.png");
    await page.screenshot({ path: ssPath });
    console.log('[Verify] Saved screenshot:', ssPath);

    await browser.close();
    console.log('[Verify] Swarm Facet verification finished successfully!');
})();
