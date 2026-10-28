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
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 4000));

    // Open Package Foundry
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const pkgBtn = btns.find(b => (b.getAttribute('title') || '').includes('Package Foundry'));
        if (pkgBtn) pkgBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Filter by "cannon-es"
    await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Filter installed"]');
        if (input) {
            input.value = 'cannon-es';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    await new Promise(r => setTimeout(r, 1500));

    const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";
    const ssPath = path.join(artifactDir, "cortex_installed_cannon_live.png");
    await page.screenshot({ path: ssPath });
    console.log('[Capture] Saved screenshot:', ssPath);

    await browser.close();
})();
