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

console.log("=== 1. ROOT saved_states/ ===");
const rootSavedStatesDir = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/saved_states";
const rootSavedFiles = fs.readdirSync(rootSavedStatesDir);
rootSavedFiles.forEach(file => {
    const p = path.join(rootSavedStatesDir, file);
    const content = safeRead(p);
    const stat = fs.statSync(p);
    console.log(`\nFile: saved_states/${file} (${stat.size} bytes)`);
    try {
        const json = JSON.parse(content);
        console.log("Keys:", Object.keys(json));
        if (json.timestamp) console.log("timestamp:", json.timestamp);
        if (json.activeAgentId) console.log("activeAgentId:", json.activeAgentId);
        if (json.version) console.log("version:", json.version);
        if (json.agentsConfig) console.log("agentsConfig keys count:", Object.keys(json.agentsConfig).length);
        if (json.universeState) console.log("universeState keys:", Object.keys(json.universeState));
    } catch(e) {
        console.log("Parse error:", e.message);
    }
});

console.log("\n=== 2. DATA saved_states/ ===");
const dataSavedStatesDir = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/saved_states";
const dataSavedFiles = fs.readdirSync(dataSavedStatesDir);
dataSavedFiles.forEach(file => {
    const p = path.join(dataSavedStatesDir, file);
    const content = safeRead(p);
    const stat = fs.statSync(p);
    console.log(`\nFile: data/saved_states/${file} (${stat.size} bytes)`);
    try {
        const json = JSON.parse(content);
        console.log("Keys:", Object.keys(json));
        if (json.timestamp) console.log("timestamp:", json.timestamp);
        if (json.activeAgentId) console.log("activeAgentId:", json.activeAgentId);
        if (json.universeState) console.log("universeState keys:", Object.keys(json.universeState));
    } catch(e) {
        console.log("Parse error:", e.message);
    }
});

console.log("\n=== 3. SCRATCH/ Directory ===");
const scratchDir = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/scratch";
const scratchFiles = fs.readdirSync(scratchDir);
scratchFiles.forEach(file => {
    const p = path.join(scratchDir, file);
    const stat = fs.statSync(p);
    const content = safeRead(p);
    console.log(`Scratch file: ${file} (${stat.size} bytes, ${content ? content.split('\n').length : 0} lines)`);
});

console.log("\n=== 4. JSON-LD Graph Details ===");
const localNodePath = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/myos_local_node.jsonld";
const localNode = JSON.parse(safeRead(localNodePath));
console.log("myos_local_node.jsonld top keys:", Object.keys(localNode));
console.log("myos_local_node extractedKnowledge length:", localNode.extractedKnowledge.length);
console.log("myos_local_node extractedKnowledge[0]:", JSON.stringify(localNode.extractedKnowledge[0]));

const journalNodePath = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/myos_journal_node.jsonld";
const journalNode = JSON.parse(safeRead(journalNodePath));
console.log("myos_journal_node.jsonld top keys:", Object.keys(journalNode));
console.log("myos_journal_node entries count:", journalNode.journalEntries.length);
console.log("myos_journal_node entry[0] keys:", Object.keys(journalNode.journalEntries[0]));
console.log("myos_journal_node entry[0] sample:", JSON.stringify(journalNode.journalEntries[0]).slice(0, 200));

console.log("\n=== 5. Parent Candidates Details ===");
const pcPath = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/parent_candidates.json";
const pc = JSON.parse(safeRead(pcPath));
console.log("parent_candidates.json length:", pc.length);
console.log("Sample candidate item[0]:", JSON.stringify(pc[0]).slice(0, 250));

console.log("\n=== 6. Vector Store Header Check ===");
const vsPath = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/data/myos_vector_store.json";
try {
    const fd = fs.openSync(vsPath, 'r');
    const buf = Buffer.alloc(500);
    fs.readSync(fd, buf, 0, 500, 0);
    fs.closeSync(fd);
    console.log("myos_vector_store.json first 500 bytes:", buf.toString('utf8', 0, 300));
} catch(e) {
    console.log("Error reading vector store sample:", e.message);
}
