const fs = require('fs');
const path = require('path');

function safeRead(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        return content;
    } catch (e) {
        return null;
    }
}

console.log("=== Audit Report ===");
const auditReport = JSON.parse(safeRead("c:/Users/zakde/Desktop/AntiGravity projects/MyOS/results/audit_report.json"));
console.log("Length:", auditReport.length);
console.log("Item 0:", JSON.stringify(auditReport[0], null, 2));

console.log("\n=== Tmp Nexus Test Files ===");
const nexusTestDir = "c:/Users/zakde/Desktop/AntiGravity projects/MyOS/tmp/nexus_test";
const files = fs.readdirSync(nexusTestDir).filter(f => f !== 'node_modules');
files.forEach(f => {
    const p = path.join(nexusTestDir, f);
    const stat = fs.statSync(p);
    if (stat.isFile()) {
        const content = safeRead(p);
        console.log(`\n--- ${f} (${stat.size} bytes, ${content ? content.split('\n').length : 0} lines) ---`);
        if (content) {
            console.log(content.split('\n').slice(0, 10).join('\n'));
        }
    }
});
