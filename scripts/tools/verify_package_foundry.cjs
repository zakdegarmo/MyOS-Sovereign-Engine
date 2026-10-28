const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://127.0.0.1:5173/';
const SHOT_PATH = path.resolve(__dirname, '../../data/ux_autopsy/package_foundry_live.png');

(async () => {
  console.log('🚀 Launching Chrome to verify Package Foundry...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl']
  });

  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3500));

  // Find the button with title containing "Package Foundry"
  console.log('🔍 Clicking Package Foundry button...');
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const b of btns) {
      const title = b.getAttribute('title') || '';
      const text = b.innerText || '';
      if (title.toLowerCase().includes('package foundry') || text.toLowerCase().includes('package foundry')) {
        b.click();
        return title || text;
      }
    }
    return null;
  });

  console.log('Clicked result:', clicked);
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: SHOT_PATH });
  console.log('📸 Screenshot saved to:', SHOT_PATH);

  // Check if Package Foundry modal is rendered
  const modalText = await page.evaluate(() => {
    const el = document.querySelector('h2');
    return el ? el.innerText : 'No h2 found';
  });
  console.log('Header text found:', modalText);

  await browser.close();
})().catch(err => {
  console.error('Error verifying Package Foundry:', err);
  process.exit(1);
});
