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
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));

    // Toggle Dual Workstations
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('myos:toggle-workstation', { detail: { show: true } }));
    });
    await new Promise(r => setTimeout(r, 3500));

    const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";
    const ssPath = path.join(artifactDir, "dual_workstation_verified.png");
    await page.screenshot({ path: ssPath });
    console.log('[Info] Saved screenshot:', ssPath);

    // Now test script dispatch: click RUN SCRIPT on Editor face!
    console.log('[Info] Testing script dispatch from Left Prism to Right Watcher Prism...');
    const dispatched = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const runBtn = btns.find(b => (b.innerText || '').includes('RUN SCRIPT'));
        if (runBtn) {
            runBtn.click();
            return true;
        }
        return false;
    });

    console.log(`[Info] Clicked [ ▶ RUN SCRIPT ]: ${dispatched}`);
    await new Promise(r => setTimeout(r, 4000));

    const ssPath2 = path.join(artifactDir, "dual_workstation_running.png");
    await page.screenshot({ path: ssPath2 });
    console.log('[Info] Saved running screenshot:', ssPath2);

    await browser.close();
})();
