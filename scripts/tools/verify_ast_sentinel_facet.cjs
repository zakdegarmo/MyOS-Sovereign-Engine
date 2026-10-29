const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    console.log('[Verify AST] Testing Live AST Sentinel in Left Editor Prism...');
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

    // 1. Toggle Dual Workstations
    console.log('[Verify AST] Toggling Dual Workstations...');
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('myos:toggle-workstation', { detail: { show: true } }));
    });
    await new Promise(r => setTimeout(r, 4000));

    const artifactDir = "C:\\Users\\zakde\\.gemini\\antigravity\\brain\\5d778f69-db13-4232-9d87-80fc4f0ece4e";

    // 2. Check AST Status Badge for loaded script
    const initialAstStatus = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const badge = Array.from(document.querySelectorAll('div')).find(d => (d.innerText || '').includes('AST VERIFIED') || (d.innerText || '').includes('AST SENTINEL'));
        return {
            hasVerifiedBadge: !!badge,
            badgeText: badge ? badge.innerText : null
        };
    });
    console.log('[Verify AST] Initial Status:', initialAstStatus);

    const ssPath1 = path.join(artifactDir, "ast_sentinel_verified.png");
    await page.screenshot({ path: ssPath1 });
    console.log('[Verify AST] Saved screenshot:', ssPath1);

    // 3. Inject Syntax Error into Editor
    console.log('[Verify AST] Injecting deliberate syntax error into editor...');
    await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.value = 'def broken_syntax(\n    return 42\n';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // Wait for debounced AST validation (1.5s)
    await new Promise(r => setTimeout(r, 2500));

    const errorAstStatus = await page.evaluate(() => {
        const text = document.body.innerText || '';
        return {
            hasErrorBadge: text.includes('AST SYNTAX ERROR'),
            hasErrorDrawer: text.includes('Python Syntax Error') || text.includes('was never closed'),
            snippet: text.slice(0, 300)
        };
    });
    console.log('[Verify AST] Error State:', errorAstStatus);

    const ssPath2 = path.join(artifactDir, "ast_sentinel_error.png");
    await page.screenshot({ path: ssPath2 });
    console.log('[Verify AST] Saved error screenshot:', ssPath2);

    await browser.close();
    console.log('[Verify AST] Verification complete!');
})();
