const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../apps/web/src/components/MaxOverlay/OrchestratorPanel.tsx');
let content = fs.readFileSync(file, 'utf-8');

// Find from "Current Location" to the closing backtick of the template literal
const START_MARKER = "Current Location: ${activeGem || 'The Void'}";
const startIdx = content.indexOf(START_MARKER);
if (startIdx === -1) { console.error('START NOT FOUND'); process.exit(1); }

// The section ends with the template literal closing: "        `;"
const CLOSE = '        `;';
const closeIdx = content.indexOf(CLOSE, startIdx);
if (closeIdx === -1) { console.error('CLOSE NOT FOUND'); process.exit(1); }

const oldSection = content.substring(startIdx, closeIdx + CLOSE.length);
console.log('OLD SECTION:\n', JSON.stringify(oldSection));

// Build the replacement
const newSection = `Current Location: \${activeGem || 'The Void'}
             Context: \${fileContext || 'No files indexed'}
             \${activeOntologicalPath ? (()=>{ 
                 const e = getBrainEntryByPath(activeOntologicalPath); 
                 const loreBlock = e 
                     ? 'Title: ' + e.title + '\\nContent: ' + e.content + '\\nTags: ' + e.tags.join(', ') + '\\n\\nInhabit this space. Speak as its embodied intelligence.'
                     : 'Synthesize from first-principles of the path "' + activeOntologicalPath + '".';
                 return '\\n\\n**CURRENTLY ACTIVE ONTOLOGICAL SPACE:** "' + activeOntologicalPath + '"\\n' + loreBlock;
             })() : ''}
        \`;`;

const patched = content.substring(0, startIdx) + newSection + content.substring(closeIdx + CLOSE.length);
fs.writeFileSync(file, patched, 'utf-8');
console.log('PATCH SUCCESS');
