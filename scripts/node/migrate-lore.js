const fs = require('fs');
const path = require('path');

const indexFile = path.resolve('apps/web/lore-index.json');
const dbDir = path.resolve('apps/web/lore-db');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

if (!fs.existsSync(indexFile)) {
    console.log('No lore-index.json found.');
    process.exit(0);
}

const data = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const grouped = {};

data.forEach(chunk => {
    let sourceName = 'unknown';
    if (chunk.source) {
        sourceName = path.basename(chunk.source).replace(/[^a-zA-Z0-9.-]/g, '_');
    }
    if (!grouped[sourceName]) {
        grouped[sourceName] = [];
    }
    grouped[sourceName].push(chunk);
});

for (const [name, chunks] of Object.entries(grouped)) {
    const outFile = path.join(dbDir, name + '.json');
    fs.writeFileSync(outFile, JSON.stringify(chunks, null, 2), 'utf8');
    console.log('Wrote', outFile, 'with', chunks.length, 'chunks.');
}

fs.renameSync(indexFile, path.resolve('apps/web/lore-index.backup.json'));
console.log('Migration complete. lore-index.json renamed to lore-index.backup.json.');
