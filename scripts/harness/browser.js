/**
 * browser.js
 * ----------
 * Standardized headless browser launcher harness for Attempt 1.
 * Solves Pain Point 2: Automatically discovers Edge or Chrome on Windows
 * without requiring manual cache downloads or failing on missing paths.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

function getBrowserExecutablePath() {
    const candidates = [
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        process.env.PUPPETEER_EXECUTABLE_PATH
    ];

    for (const p of candidates) {
        if (p && fs.existsSync(p)) {
            return p;
        }
    }
    return undefined;
}

async function launchHarnessBrowser(options = {}) {
    const exe = getBrowserExecutablePath();
    const defaultArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu-sandbox'
    ];

    const launchConfig = {
        headless: "new",
        args: options.args ? [...defaultArgs, ...options.args] : defaultArgs,
        ...options
    };

    if (exe) {
        launchConfig.executablePath = exe;
    }

    return await puppeteer.launch(launchConfig);
}

module.exports = {
    getBrowserExecutablePath,
    launchHarnessBrowser
};
