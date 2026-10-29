import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LPC_DIR = path.resolve(__dirname, '../apps/web/public/assets/lpc');
const MANIFEST_PATH = path.join(LPC_DIR, 'asset_manifest.json');

if (!fs.existsSync(LPC_DIR)) {
    console.error(`[LPC EXTRACTOR] Directory not found: ${LPC_DIR}`);
    process.exit(1);
}

function getFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
        .filter(file => !file.isDirectory())
        .map(file => path.join(dir, file.name));
    const folders = entries.filter(folder => folder.isDirectory());
    for (const folder of folders) {
        files.push(...getFiles(path.join(dir, folder.name)));
    }
    return files;
}

function updateManifest() {
    console.log('[LPC EXTRACTOR] Updating asset manifest...');
    const allFiles = getFiles(LPC_DIR);
    const relativeFiles = allFiles
        .map(f => path.relative(path.resolve(__dirname, '../apps/web/public'), f).replace(/\\/g, '/'))
        .filter(f => f.endsWith('.png'));

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(relativeFiles, null, 2));
    console.log(`[LPC EXTRACTOR] Manifest updated with ${relativeFiles.length} png assets.`);
}

function extractArchives() {
    const files = fs.readdirSync(LPC_DIR);
    const archives = files.filter(f => f.endsWith('.zip') || f.endsWith('.7z') || f.endsWith('.tar.gz'));

    console.log(`[LPC EXTRACTOR] Found ${archives.length} archives to process.`);

    for (const archive of archives) {
        const archivePath = path.join(LPC_DIR, archive);
        const folderName = archive.replace(/\.(zip|7z|tar\.gz)$/i, '');
        const targetDir = path.join(LPC_DIR, folderName);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        console.log(`[LPC EXTRACTOR] Extracting: ${archive}`);
        try {
            // Using system tar which is available on modern Windows and handles zip/tar.gz
            execSync(`tar -xf "${archivePath}" -C "${targetDir}"`, { stdio: 'inherit' });

            // Move archive to a 'processed' folder or just delete?
            // For now, let's keep them but maybe move to a subfolder to avoid re-processing
            const processedDir = path.join(LPC_DIR, 'archives_processed');
            if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir);
            fs.renameSync(archivePath, path.join(processedDir, archive));

        } catch (err) {
            console.error(`[LPC EXTRACTOR] Failed to extract ${archive}:`, err.message);
        }
    }

    // After extraction, flatten if necessary or just scan for more pngs
    updateManifest();
}

extractArchives();
