import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://opengameart.org';
const COLLECTION_URL = 'https://opengameart.org/content/lpc-collection';
const DOWNLOAD_DIR = path.resolve(__dirname, '../apps/web/public/assets/lpc');
const MANIFEST_PATH = path.join(DOWNLOAD_DIR, 'asset_manifest.json');

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const downloadedFiles = [];

async function fetchHtml(url) {
    console.log(`[LPC] Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return await response.text();
}

async function downloadFile(url, targetPath) {
    if (fs.existsSync(targetPath)) {
        downloadedFiles.push(path.relative(path.resolve(__dirname, '../apps/web/public'), targetPath).replace(/\\/g, '/'));
        return;
    }

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(targetPath);
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                downloadFile(res.headers.location, targetPath).then(resolve).catch(reject);
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                downloadedFiles.push(path.relative(path.resolve(__dirname, '../apps/web/public'), targetPath).replace(/\\/g, '/'));
                resolve();
            });
            file.on('error', (err) => {
                fs.unlink(targetPath, () => { });
                reject(err);
            });
        }).on('error', reject);
    });
}

async function downloadFromPage(pageUrl) {
    try {
        const html = await fetchHtml(pageUrl);
        const fileRegex = /href="(https?:\/\/opengameart\.org\/sites\/default\/files\/[^"]+\.(?:png|zip|tar\.gz|7z))"/g;
        let match;
        const files = [];
        while ((match = fileRegex.exec(html)) !== null) {
            const fileUrl = match[1];
            if (!files.includes(fileUrl)) {
                files.push(fileUrl);
            }
        }

        for (const fileUrl of files) {
            const fileName = path.basename(new URL(fileUrl).pathname);
            const targetPath = path.join(DOWNLOAD_DIR, fileName);
            console.log(`  Downloading: ${fileName}`);
            try {
                await downloadFile(fileUrl, targetPath);
            } catch (err) {
                console.warn(`  Failed download: ${fileName}`, err.message);
            }
        }
    } catch (err) {
        console.warn(`\n[LPC] Failed to scrape page ${pageUrl}:`, err.message);
    }
}

async function grub() {
    console.log(`\n[LPC GRUBBER] Initializing extraction from: ${COLLECTION_URL}`);
    try {
        const html = await fetchHtml(COLLECTION_URL);
        const contentRegex = /href="(\/content\/[^"]+)"/g;
        const links = [];
        let match;
        while ((match = contentRegex.exec(html)) !== null) {
            const href = match[1];
            if (href.toLowerCase().includes('lpc') || href.toLowerCase().includes('tile') || href.toLowerCase().includes('sprite')) {
                const fullUrl = BASE_URL + href;
                if (!links.includes(fullUrl)) {
                    links.push(fullUrl);
                }
            }
        }

        console.log(`[LPC] Found ${links.length} potential sub-pages.`);

        for (const link of links) {
            await downloadFromPage(link);
        }

        // Save manifest
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(downloadedFiles, null, 2));
        console.log(`\n[LPC] Manifest updated with ${downloadedFiles.length} assets.`);
        console.log('\n[LPC GRUBBER] Task Complete.');

    } catch (err) {
        console.error('[LPC] Root fetch failed:', err);
    }
}

grub();
