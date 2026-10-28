const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve('apps/web/public/data/pdf_manifest.json');
const dbDir = path.resolve('apps/web/lore-db');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));

let highestIndex = -1;

for (let i = 0; i < manifest.files.length; i++) {
    const safeName = manifest.files[i].name.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (files.includes(safeName)) {
        highestIndex = i;
    }
}

console.log('Highest index processed:', highestIndex);
