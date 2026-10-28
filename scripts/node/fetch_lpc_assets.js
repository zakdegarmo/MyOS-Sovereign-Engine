const fs = require('fs');
const https = require('https');
const path = require('path');

const pathsFile = 'lpc_paths.json';
const targetDir = path.join(__dirname, 'apps', 'web', 'public', 'textures', 'avatars', 'lpc');

if (!fs.existsSync(pathsFile)) {
    console.error('lpc_paths.json not found!');
    process.exit(1);
}

const allPaths = JSON.parse(fs.readFileSync(pathsFile, 'utf8'));

const mappings = {
    // 1. Base Body (Self)
    body: allPaths.filter(p => p.includes('/body/') && !p.includes('child')),
    // 2. Eyes
    eyes: allPaths.filter(p => p.includes('/facial/') && p.includes('eyecolors')),
    // 3. Facial Features / Beards
    facial: allPaths.filter(p => p.includes('/facial/') && !p.includes('eyecolors')),
    // 4. Hair (Thought)
    hair: allPaths.filter(p => p.includes('/hair/') && !p.includes('female')), // just for consistent framing
    // 5. Tops / Shirts (Unity)
    tops: allPaths.filter(p => p.includes('/torso/shirts/') || p.includes('/torso/tunics/')),
    // 6. Bottoms / Pants (Existence)
    bottoms: allPaths.filter(p => p.includes('/legs/') || p.includes('/pants/')),
    // 7. Footwear / Shoes
    footwear: allPaths.filter(p => p.includes('/feet/') || p.includes('/shoes/')),
    // 8. Outerwear / Armor (Improvement)
    armor: allPaths.filter(p => p.includes('/torso/armor/') || p.includes('/torso/chain/') || p.includes('/torso/leather/')),
    // 9. Gloves / Hands
    gloves: allPaths.filter(p => p.includes('/hands/') || p.includes('/gloves/')),
    // 10. Shoulders (Transcendence)
    shoulders: allPaths.filter(p => p.includes('/shoulders/')),
    // 11. Headwear / Masks (Mastery)
    headwear: allPaths.filter(p => p.includes('/head/') || p.includes('/hats/') || p.includes('/helmets/') || p.includes('/masks/')),
    // 12. Weapons (Logic)
    weapon: allPaths.filter(p => p.includes('/weapons/') && p.includes('right')),
    // 13. Shields
    shield: allPaths.filter(p => p.includes('/shields/')),
    // 14. Capes / Back (Resonance)
    cape: allPaths.filter(p => p.includes('/cloak/')),
    // 15. Auras (Omni)
    aura: allPaths.filter(p => p.includes('/magic/') || p.includes('/accessories/'))
};

// Create directories for each layer
Object.keys(mappings).forEach(layer => {
    const layerDir = path.join(targetDir, layer);
    if (!fs.existsSync(layerDir)) {
        fs.mkdirSync(layerDir, { recursive: true });
    }
});

const BASE_URL = 'https://raw.githubusercontent.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator/master/';

const MAX_ASSETS = 10;

Object.entries(mappings).forEach(([layer, paths]) => {
    // We want specifically 10 assets to map to the 10 pillars.
    // We try to grab the first 10 if there are that many. 
    // We shuffle first to get variety.
    const shuffled = paths.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, MAX_ASSETS);

    // If we have fewer than 10, pad with empty/null representation (won't download, so 404 in UI, which we will handle gracefully)
    selected.forEach((relPath, idx) => {
        const url = BASE_URL + encodeURI(relPath);
        const filename = `${idx}.png`;
        const dest = path.join(targetDir, layer, filename);

        https.get(url, res => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded ${layer}/${filename}`);
                });
            }
        }).on('error', err => { });
    });
});
