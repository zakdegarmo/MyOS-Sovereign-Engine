const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new'
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => typeof window.__MYOS_SWAP_DIMENSION === 'function');
    await page.evaluate(() => window.__MYOS_SWAP_DIMENSION('uniracers_world'));
    await new Promise(r => setTimeout(r, 4000));

    const hudInfo = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div'));
        const el = divs.find(d => d.innerText && d.innerText.includes('CENTRAL ROUNDABOUT') && d.children.length > 0);
        if (!el) return 'Not found';
        const comp = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
            tag: el.tagName,
            className: el.className,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            computed: {
                display: comp.display,
                visibility: comp.visibility,
                opacity: comp.opacity,
                position: comp.position,
                zIndex: comp.zIndex,
                width: comp.width,
                height: comp.height
            },
            parentTag: el.parentElement ? el.parentElement.tagName : null,
            parentClass: el.parentElement ? el.parentElement.className : null,
            parentStyle: el.parentElement ? el.parentElement.getAttribute('style') : null,
            parentCompZIndex: el.parentElement ? window.getComputedStyle(el.parentElement).zIndex : null
        };
    });

    console.log('HUD Element Diagnostics:', JSON.stringify(hudInfo, null, 2));
    await browser.close();
})();
