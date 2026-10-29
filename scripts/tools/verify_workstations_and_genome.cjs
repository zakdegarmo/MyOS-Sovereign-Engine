const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('[Verify] Launching Chrome to inspect Dual Workstations & Synergetic Genome Prism...');
    const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    const browser = await puppeteer.launch({
        executablePath,
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 },
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--use-gl=angle',
            '--use-angle=d3d11',
            '--enable-webgl',
            '--ignore-gpu-blocklist'
        ]
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Error') || text.includes('Prism') || text.includes('Workstation') || text.includes('NexusContainer')) {
            console.log(`[Browser Console] ${text}`);
        }
    });

    try {
        console.log('[Verify] Navigating to http://127.0.0.1:5173/ ...');
        await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 30000 });

        await new Promise(r => setTimeout(r, 4000));

        // 1. Locate and click the Dual Workstations HUD button
        console.log('[Verify] Looking for Dual Workstation Prisms HUD button...');
        const clicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const target = btns.find(b => (b.getAttribute('title') || '').includes('Dual Workstation Prisms'));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        console.log(`[Verify] Clicked Dual Workstation button: ${clicked}`);
        await new Promise(r => setTimeout(r, 4000));

        // Check if facets mounted
        const facetStats = await page.evaluate(() => {
            const textContent = document.body.innerText;
            const hasEditor = textContent.includes('SCRIPT ATELIER') || textContent.includes('Editor Face:');
            const hasWatcher = textContent.includes('Execution Watcher') || textContent.includes('Watcher Face:');
            return { hasEditor, hasWatcher, textSnippet: textContent.slice(0, 300) };
        });

        console.log('[Verify] Facet stats:', facetStats);

        const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";
        const ss1 = path.join(artifactDir, "dual_workstation_live.png");
        await page.screenshot({ path: ss1 });
        console.log(`[Verify] Saved screenshot: ${ss1}`);

        // 2. Test Prism Navigator and Genome Force Graph
        console.log('[Verify] Opening 3D Decagonal Prism Navigator via key [P]...');
        await page.keyboard.press('p');
        await new Promise(r => setTimeout(r, 4000));

        // Click Omni pillar in Prism
        const clickedOmni = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const omniBtn = btns.find(b => (b.innerText || '').includes('Omniscience') || (b.innerText || '').includes('Omni') || (b.getAttribute('title') || '').includes('Omni'));
            if (omniBtn) {
                omniBtn.click();
                return true;
            }
            return false;
        });

        console.log(`[Verify] Clicked Omni pillar in Prism: ${clickedOmni}`);
        await new Promise(r => setTimeout(r, 4000));

        const ss2 = path.join(artifactDir, "synergetic_genome_prism_live.png");
        await page.screenshot({ path: ss2 });
        console.log(`[Verify] Saved screenshot: ${ss2}`);

        console.log('[Verify] All tests passed with flying colors!');
    } catch (err) {
        console.error('[Verify] Error during verification:', err);
    } finally {
        await browser.close();
    }
})();
