const fs = require('fs');
const glob = require('glob');
const path = require('path');

const ifaceFiles = glob.sync('apps/web/src/**/*Interface.tsx');

const mappings = {
    'S1_SelfInterface.tsx': 'Self',
    'S2_ThoughtInterface.tsx': 'Thought',
    'S3_LogicInterface.tsx': 'Logic',
    'S4_UnityInterface.tsx': 'Unity',
    'S5_ExistenceInterface.tsx': 'Existence',
    'S6_ImprovementInterface.tsx': 'Improvement',
    'S7_MasteryInterface.tsx': 'Mastery',
    'S8_ResonanceInterface.tsx': 'Resonance',
    'S9_TranscendenceInterface.tsx': 'Transcendence',
    'S10_OmniInterface.tsx': 'Omnipotence'
};

ifaceFiles.forEach(file => {
    const basename = path.basename(file);
    const pillar = mappings[basename];
    if (!pillar || pillar === 'Self' || pillar === 'Thought' || pillar === 'Unity') return;

    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    const newLines = lines.map(line => {
        if (line.includes('{ id:') && line.includes('label:') && line.includes('icon:')) {
            if (line.includes('dot:')) return line;

            const match = line.match(/\(([^)]+)\)/);
            if (match && match[1]) {
                let target = match[1];
                if (target === 'Omni') target = 'Omnipotence';
                modified = true;

                const hasCr = line.endsWith('\r');
                let cleanLine = hasCr ? line.slice(0, -1) : line;

                cleanLine = cleanLine.replace(/\s*}\s*,?\s*$/, `, dot: '${pillar}_${target}' },`);

                return hasCr ? cleanLine + '\r' : cleanLine;
            }
        }
        return line;
    });

    if (modified) {
        fs.writeFileSync(file, newLines.join('\n'));
        console.log('Updated ' + basename);
    }
});
