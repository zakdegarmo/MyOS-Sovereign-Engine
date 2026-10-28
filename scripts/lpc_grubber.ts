import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://opengameart.org';
const COLLECTION_URL = 'https://opengameart.org/content/lpc-collection';
const DOWNLOAD_DIR = path.resolve(__dirname, '../apps/web/public/assets/lpc');

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function fetchHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function downloadFile(url: string, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(targetPath);
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Handle redirects
                downloadFile(res.headers.location!, targetPath).then(resolve).catch(reject);
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', (err) => {
                fs.unlink(targetPath, () => { });
                reject(err);
            });
        }).on('error', reject);
    });
}

async function grub() {
    console.log(`[LPC GRUBBER] Starting: ${COLLECTION_URL}`);
    try {
        const html = await fetchHtml(COLLECTION_URL);

        // Extract content links using regex
        const contentRegex = /href="(\/content\/[^"]+)"/g;
        const links: string[] = [];
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

        console.log(`[LPC GRUBBER] Found ${links.length} potential sub-pages.`);

        for (const link of links) {
            await downloadFromPage(link);
        }

    } catch (err) {
        console.error('[LPC GRUBBER] Root fetch failed:', err);
    }
}

async function downloadFromPage(pageUrl: string) {
    try {
        console.log(`[LPC GRUBBER] Checking page: ${pageUrl}`);
        const html = await fetchHtml(pageUrl);

        // Extract file links (.png, .zip, .tar.gz)
        const fileRegex = /href="(https?:\/\/opengameart\.org\/sites\/default\/files\/[^"]+\.(?:png|zip|tar\.gz|7z))"/g;
        let match;
        const files: string[] = [];
        while ((match = fileRegex.exec(html)) !== null) {
            const fileUrl = match[1];
            if (!files.includes(fileUrl)) {
                files.push(fileUrl);
            }
        }

        for (const fileUrl of files) {
            const fileName = path.basename(new URL(fileUrl).pathname);
            const targetPath = path.join(DOWNLOAD_DIR, fileName);

            if (fs.existsSync(targetPath)) {
                console.log(`  Skipping existing: ${fileName}`);
                continue;
            }

            console.log(`  Downloading: ${fileName} ...`);
            try {
                await downloadFile(fileUrl, targetPath);
            } catch (dErr) {
                console.warn(`  Failed download: ${fileName}`, dErr.message);
            }
        }
    } catch (err) {
        console.warn(`[LPC GRUBBER] Failed to scrape page ${pageUrl}:`, err.message);
    }
}

grub();
