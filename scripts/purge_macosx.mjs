
import fs from 'fs';
import path from 'path';

const filesToClean = [
    'apps/web/public/assets/lpc/asset_manifest.json',
    'apps/web/public/assets/lpc/semantic_manifest.json'
];

function cleanObject(obj) {
    if (Array.isArray(obj)) {
        return obj.filter(item => {
            const pathStr = typeof item === 'string' ? item : item.path;
            if (!pathStr) return true;
            const isBad = pathStr.includes('__MACOSX') || pathStr.includes('/._') || pathStr.startsWith('._');
            return !isBad;
        }).map(cleanObject);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (key.includes('__MACOSX')) continue;
            newObj[key] = cleanObject(obj[key]);
        }
        return newObj;
    }
    return obj;
}

for (const file of filesToClean) {
    const fullPath = path.resolve(file);
    if (!fs.existsSync(fullPath)) {
        console.log(`Skipping ${file} - not found`);
        continue;
    }
    console.log(`Cleaning ${file}...`);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const cleaned = cleanObject(data);
    fs.writeFileSync(fullPath, JSON.stringify(cleaned, null, 2));
    console.log(`Cleaned ${file}`);
}
