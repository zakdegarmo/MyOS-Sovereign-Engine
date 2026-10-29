const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'apps', 'web', 'backend');
const outputFile = path.join(__dirname, 'backend_dump.json');
const result = {};

function walkSync(currentDirPath) {
    if (!fs.existsSync(currentDirPath)) return;
    
    fs.readdirSync(currentDirPath).forEach((name) => {
        const filePath = path.join(currentDirPath, name);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile() && name === 'server.ts') {
            // Store the file content using its path as the key
            const relativePath = path.relative(__dirname, filePath);
            result[relativePath] = fs.readFileSync(filePath, 'utf8');
        } else if (stat.isDirectory()) {
            walkSync(filePath);
        }
    });
}

console.log('Sweeping the Fractal Genome Matrix...');
walkSync(backendDir);

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log(`Successfully bundled ${Object.keys(result).length} terminal endpoints into backend_dump.json!`);