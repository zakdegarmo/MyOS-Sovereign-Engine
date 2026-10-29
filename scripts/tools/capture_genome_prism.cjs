const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    const browser = await puppeteer.launch({
        executablePath,
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-web-security', '--use-gl=angle', '--use-angle=d3d11', '--enable-webgl']
    });

    const page = await browser.newPage();
    console.log('[Capture] Loading page with domcontentloaded...');
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 4000));

    // Open Prism Navigator
    console.log('[Capture] Opening Prism Navigator...');
    await page.keyboard.press('p');
    await new Promise(r => setTimeout(r, 3000));

    // Select Omni Pillar
    console.log('[Capture] Selecting Omni Pillar...');
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('myos:select-pillar', { detail: { pillarIndex: 9 } }));
    });
    await new Promise(r => setTimeout(r, 3500));

    const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";
    const ssPath = path.join(artifactDir, "synergetic_genome_prism_live.png");
    await page.screenshot({ path: ssPath });
    console.log('[Capture] Saved Genome Prism screenshot:', ssPath);

    await browser.close();
})();
