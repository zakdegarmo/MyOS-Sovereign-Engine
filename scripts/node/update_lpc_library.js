const fs = require('fs');
const https = require('https');
const path = require('path');

const pathsFile = path.join(__dirname, 'lpc_paths.json');
const targetDir = path.join(__dirname, 'apps', 'web', 'public', 'textures', 'avatars', 'lpc');
const manifestFile = path.join(targetDir, 'manifest.json');

if (!fs.existsSync(pathsFile)) {
    console.error('lpc_paths.json not found!');
    process.exit(1);
}

const allPaths = JSON.parse(fs.readFileSync(pathsFile, 'utf8'));

// Filter rules for the 10 core layers + additional semantic layers
const mappings = {
    body: allPaths.filter(p => (p.includes('/body/') || p.includes('/bodies/')) && !p.includes('child') && !p.includes('wings') && !p.includes('tail')),
    eyes: allPaths.filter(p => p.includes('/eyes/')),
    mouth: allPaths.filter(p => p.includes('/mouth/')),
    nose: allPaths.filter(p => p.includes('/nose/')),
    facial: allPaths.filter(p => p.includes('/facial/') && !p.includes('/mouth/') && !p.includes('/nose/')),
    hair: allPaths.filter(p => p.includes('/hair/') && !p.includes('female')), // Keeping to male base framing for now
    tops: allPaths.filter(p => p.includes('/torso/') && !p.includes('armor') && !p.includes('chain') && !p.includes('leather')),
    bottoms: allPaths.filter(p => p.includes('/legs/') || p.includes('/pants/')),
    footwear: allPaths.filter(p => p.includes('/feet/') || p.includes('/shoes/')),
    armor: allPaths.filter(p => p.includes('/armour/') || p.includes('/torso/armor/') || p.includes('/torso/chain/') || p.includes('/torso/leather/')),
    gloves: allPaths.filter(p => p.includes('/hands/') || p.includes('/gloves/')),
    shoulders: allPaths.filter(p => p.includes('/shoulders/')),
    headwear: allPaths.filter(p => (p.includes('/head/') || p.includes('/hats/') || p.includes('/helmets/') || p.includes('/masks/')) && !p.includes('mouth') && !p.includes('nose')),
    weapon: allPaths.filter(p => p.includes('/weapons/') && p.includes('right')), // right hand dominant
    shield: allPaths.filter(p => p.includes('/shields/')),
    cape: allPaths.filter(p => p.includes('/cloak/') || p.includes('wings') || p.includes('tail')),
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
const MAX_ASSETS = 200;

// This object will hold string arrays of valid, successfully downloaded filenames per layer.
const manifest = {};

Object.keys(mappings).forEach(layer => {
    manifest[layer] = [];
});

let totalDownloads = 0;
let completedDownloads = 0;

// Promise-based download function
const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else {
                reject(new Error(`Status Code: ${res.statusCode}`));
            }
        }).on('error', err => reject(err));
    });
};

const run = async () => {
    for (const [layer, paths] of Object.entries(mappings)) {
        // Shuffle to get a random assortment of up to 100 assets
        const shuffled = paths.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, MAX_ASSETS);

        console.log(`Preparing to download ${selected.length} assets for layer: ${layer}...`);
        totalDownloads += selected.length;

        for (const relPath of selected) {
            const url = BASE_URL + encodeURI(relPath);

            // Create a semantic filename by replacing slashes with underscores
            // e.g., 'spritesheets/body/female/light.png' -> 'body_female_light.png'
            let semanticFilename = relPath.replace('spritesheets/', '').replace(/\//g, '_');
            const dest = path.join(targetDir, layer, semanticFilename);

            try {
                await downloadFile(url, dest);
                manifest[layer].push(semanticFilename); // Track successful download
                completedDownloads++;
                if (completedDownloads % 50 === 0) {
                    console.log(`Downloaded ${completedDownloads} / ${totalDownloads} items...`);
                }
            } catch (err) {
                console.warn(`[WARN] Failed to download ${relPath}: ${err.message}`);
            }
        }

        // Sort manifest for this layer alphabetically
        manifest[layer].sort();
    }

    // Write the manifest to disk
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n✅ LPC Library Update Complete.`);
    console.log(`Saved Manifest to: ${manifestFile}`);
    console.log(`Total Assets Harvested: ${completedDownloads}`);
};

run();
