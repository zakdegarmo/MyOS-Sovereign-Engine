import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../apps/web/public/assets/lpc');
const OUTPUT_FILE = path.resolve(__dirname, '../apps/web/public/assets/lpc/semantic_manifest.json');

const KEYWORDS = {
    sprites: {
        body: ['body', 'base_human', 'skeleton', 'orc', 'elf'],
        hair: ['hair', 'bangs', 'beard'],
        eyes: ['eyes'],
        tops: ['torso', 'shirt', 'tunic', 'jacket', 'coat', 'robe', 'top'],
        bottoms: ['legs', 'pants', 'skirt', 'greaves', 'bottom'],
        footwear: ['feet', 'boots', 'shoes'],
        headwear: ['head', 'hat', 'cap', 'helmet', 'hood'],
        armor: ['armor', 'plate', 'chainmail', 'leather_armor'],
        gloves: ['hands', 'gloves', 'gauntlets'],
        weapon: ['weapon', 'sword', 'bow', 'dagger', 'axe', 'mace', 'spear', 'staff'],
        shield: ['shield'],
        cape: ['cape', 'cloak'],
    },
    environments: {
        terrain: ['sand', 'grass', 'dirt', 'water', 'lava', 'snow', 'rock', 'tile', 'floor', 'ground'],
        structures: ['wall', 'roof', 'building', 'house', 'door', 'window', 'fence', 'bridge', 'stairs'],
        flora: ['tree', 'plant', 'flower', 'bush', 'trunk', 'leaf'],
        props: ['barrel', 'chest', 'table', 'chair', 'bed', 'lamp', 'sign', 'statue', 'well'],
    }
};

function getCategory(filePath) {
    const lower = filePath.toLowerCase();

    // Check Sprites first
    for (const [layer, words] of Object.entries(KEYWORDS.sprites)) {
        if (words.some(word => lower.includes(word))) {
            return { type: 'sprite', layer };
        }
    }

    // Check Environments
    for (const [layer, words] of Object.entries(KEYWORDS.environments)) {
        if (words.some(word => lower.includes(word))) {
            return { type: 'environment', layer };
        }
    }

    return { type: 'uncategorized', layer: 'misc' };
}

function buildTree() {
    console.log(`Scanning ${ROOT_DIR}...`);
    const tree = {
        sprites: {},
        environments: {},
        uncategorized: []
    };

    function walk(dir, relativePath = '') {
        const files = fs.readdirSync(dir);
        const sidecars = files.filter(f => f.endsWith('.jsonld'));

        for (const file of files) {
            if (file.startsWith('._') || file.includes('__MACOSX')) continue;

            const fullPath = path.join(dir, file);
            const rel = relativePath ? path.join(relativePath, file) : file;

            if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath, rel);
            } else if (file.endsWith('.png')) {
                const { type, layer } = getCategory(rel);

                // Look for sidecar context
                const sidecarName = file.replace('.png', '.jsonld');
                let context = null;
                if (sidecars.includes(sidecarName)) {
                    try {
                        const contextContent = fs.readFileSync(path.join(dir, sidecarName), 'utf-8');
                        context = JSON.parse(contextContent);
                    } catch (e) {
                        console.warn(`Failed to parse context for ${rel}`);
                    }
                }

                const entry = context ? { path: rel, context } : rel;

                if (type === 'sprite') {
                    if (!tree.sprites[layer]) tree.sprites[layer] = [];
                    tree.sprites[layer].push(entry);
                } else if (type === 'environment') {
                    if (!tree.environments[layer]) tree.environments[layer] = [];
                    tree.environments[layer].push(entry);
                } else {
                    tree.uncategorized.push(entry);
                }
            }
        }
    }

    walk(ROOT_DIR);

    // Sort everything
    Object.keys(tree.sprites).forEach(key => tree.sprites[key].sort());
    Object.keys(tree.environments).forEach(key => tree.environments[key].sort());
    tree.uncategorized.sort();

    return tree;
}

const manifest = buildTree();
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`Manifest saved to ${OUTPUT_FILE}`);
console.log(`Stats:`);
console.log(`- Sprites: ${Object.values(manifest.sprites).flat().length}`);
console.log(`- Environments: ${Object.values(manifest.environments).flat().length}`);
console.log(`- Uncategorized: ${manifest.uncategorized.length}`);
