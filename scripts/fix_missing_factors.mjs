import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../apps/web/src');

async function getPillarDirs() {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory() && /^[A-Z]/.test(e.name)).map(e => e.name);
}

async function scaffoldCorrectFactors() {
    let count = 0;
    const pillars = await getPillarDirs();
    for (const pillar of pillars) {
        const pillarDir = path.join(srcDir, pillar);
        const files = await fs.readdir(pillarDir);
        const interfaceFile = files.find(f => f.startsWith('S') && f.endsWith('Interface.tsx'));

        if (!interfaceFile) continue;

        const interfacePath = path.join(pillarDir, interfaceFile);
        const code = await fs.readFile(interfacePath, 'utf-8');

        // We look for imports like `import { All as X } from './Factors/Name/All'`
        const regex = /import\s+\{\s*All\s+as\s+\w+\s*\}\s+from\s+['"]\.\/Factors\/([^/]+)\/All['"]/g;
        let match;

        while ((match = regex.exec(code)) !== null) {
            const factorName = match[1];
            const factorDir = path.join(pillarDir, 'Factors', factorName);
            const allFilePath = path.join(factorDir, 'All.tsx');
            const indexFilePath = path.join(factorDir, 'index.ts');

            try {
                // If it already exists, do nothing
                await fs.access(allFilePath);
            } catch (e) {
                // It does not exist, so we create the directory and the placeholder file
                await fs.mkdir(factorDir, { recursive: true });
                const componentCode = `import React from 'react';\n\nexport const All = () => {\n  return (\n    <div className="p-8 flex flex-col items-center justify-center h-full text-slate-400 bg-black/40 border border-white/5 rounded-2xl m-8">\n      <h2 className="text-xl font-display mb-2">${factorName} Panel</h2>\n      <p className="font-mono text-sm opacity-50">Scaffold generated for ${pillar} &gt; ${factorName}</p>\n    </div>\n  );\n};\n`;
                await fs.writeFile(allFilePath, componentCode);
                await fs.writeFile(indexFilePath, `export * from './All';\n`);
                console.log(`[Scaffolded] ${pillar} -> ${factorName}`);
                count++;
            }
        }
    }
    console.log(`\nSuccessfully scaffolded \${count} missing Factors based on Interface imports.`);
}

scaffoldCorrectFactors().catch(console.error);
