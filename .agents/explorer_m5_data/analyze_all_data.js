const fs = require('fs');
const path = require('path');

function safeRead(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf16le');
        if (!content.trim().startsWith('{') && !content.trim().startsWith('[') && !content.trim().startsWith('<') && !content.trim().startsWith('#')) {
            content = fs.readFileSync(filePath, 'utf8');
        }
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    } catch (e) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (e2) {
            return null;
        }
    }
}

function analyzeJson(name, content) {
    console.log(`\n--- JSON Analysis: ${name} (Length: ${content.length} chars) ---`);
    if (content.length === 0) {
        console.log("Status: Empty file (0 bytes)");
        return;
    }
    try {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
            console.log(`Root: Array with ${data.length} items.`);
            if (data.length > 0) {
                console.log(`Item[0] Type: ${typeof data[0]}`);
                if (typeof data[0] === 'object' && data[0] !== null) {
                    console.log(`Item[0] Keys:`, Object.keys(data[0]));
                }
            }
        } else if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            console.log(`Root: Object with ${keys.length} top-level keys: [${keys.slice(0, 20).join(', ')}${keys.length > 20 ? '...' : ''}]`);
            // Check inner structure of top keys
            keys.slice(0, 10).forEach(k => {
                const val = data[k];
                if (Array.isArray(val)) {
                    console.log(`  key '${k}': Array[${val.length}]`);
                } else if (typeof val === 'object' && val !== null) {
                    console.log(`  key '${k}': Object keys [${Object.keys(val).slice(0, 10).join(', ')}]`);
                } else {
                    console.log(`  key '${k}': ${typeof val}`);
                }
            });
        }
    } catch (e) {
        console.log(`JSON parse error: ${e.message}`);
    }
}

function analyzeText(name, content, linesToPreview = 15) {
    console.log(`\n--- Text Analysis: ${name} (Length: ${content.length} chars) ---`);
    const lines = content.split(/\r?\n/);
    console.log(`Total Lines: ${lines.length}`);
    console.log(`Head preview (${linesToPreview} lines):`);
    console.log(lines.slice(0, linesToPreview).join('\n'));
}

const rootDir = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS";

const targetFiles = [
    "council_config.json",
    "council_config.json.crswap",
    "fractal_genome.json",
    "fractal_genome_map.md",
    "fractal_genome_standard.md",
    "genome_map.json",
    "myos_chronological_journal.md",
    "myos_journal_node.jsonld",
    "myos_local_node.jsonld",
    "sectors.json",
    "data/lpc_paths.json",
    "data/myontology-genome.xml",
    "data/parent_candidates.json",
    "data/MyOS.tree.md",
    "data/tree.txt",
    "results/audit_report.json"
];

targetFiles.forEach(relPath => {
    const fullPath = path.join(rootDir, relPath);
    const content = safeRead(fullPath);
    if (content === null) {
        console.log(`File NOT FOUND: ${relPath}`);
        return;
    }
    if (relPath.endsWith('.json') || relPath.endsWith('.jsonld') || relPath.endsWith('.crswap')) {
        analyzeJson(relPath, content);
    } else {
        analyzeText(relPath, content);
    }
});
