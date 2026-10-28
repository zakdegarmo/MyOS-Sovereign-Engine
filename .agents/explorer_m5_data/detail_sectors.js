const fs = require('fs');
let content = fs.readFileSync("c:/Users/zakde/Desktop/AntiGravity projects/MyOS/sectors.json", 'utf16le');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
const data = JSON.parse(content);
console.log("sectors length:", data.sectors.length);
data.sectors.forEach((sec, idx) => {
    console.log(`Sector [${idx}]: length = ${sec.length}`);
    console.log(`  First file: ${sec[0]}`);
    console.log(`  Last file: ${sec[sec.length - 1]}`);
});
